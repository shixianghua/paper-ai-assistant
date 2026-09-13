<?php
/* 支付接口
 * action=config  查询支付通道状态（前端据此决定显示动态二维码还是静态收款码）
 * action=create  创建订单并调用支付通道下单（登录用户）
 * action=status  查询订单状态；顺带触发「懒检查」，已支付即自动发放
 * action=notify  支付通道异步回调（免费主机可能拦截外部回调，作为备用）
 * action=credit  管理员手动/模拟核销
 * action=mockpay 测试通道的“付款页”
 */

require_once __DIR__ . '/pay-lib.php';

$in = body();
$action = param($in, 'action', 'config');

try {
    switch ($action) {
        case 'config':
            out([
                'ok' => true,
                'provider' => PAY_PROVIDER,
                'auto' => PAY_PROVIDER !== 'manual',
            ]);

        case 'create': {
            $user = current_user();
            $planLabel = mb_substr(param($in, 'plan_label', '套餐'), 0, 60);
            $planCount = max(1, (int) param($in, 'plan_count', '1'));
            $amount = (float) param($in, 'amount', '0');
            $orderNo = new_order_no();

            $stmt = db()->prepare(
                'INSERT INTO orders (order_no, user_id, plan_label, plan_count, amount, status, created_at, pay_provider)
                 VALUES (?,?,?,?,?,?,NOW(),?)'
            );
            $stmt->execute([$orderNo, $user['id'], $planLabel, $planCount, $amount, 'pending', PAY_PROVIDER]);
            log_event((int) $user['id'], 'order', $orderNo . ' / ' . $planLabel . ' / ¥' . $amount);

            $orderRow = ['order_no' => $orderNo, 'plan_label' => $planLabel, 'plan_count' => $planCount, 'amount' => $amount];
            $created = provider_create($orderRow);

            if (!empty($created['ok'])) {
                db()->prepare('UPDATE orders SET pay_url = ?, pay_provider = ? WHERE order_no = ?')
                    ->execute([$created['pay_url'], $created['provider'], $orderNo]);
                out([
                    'ok' => true,
                    'order_no' => $orderNo,
                    'status' => 'pending',
                    'auto' => true,
                    'provider' => $created['provider'],
                    'pay_url' => $created['pay_url'],
                ]);
            }

            // 通道不可用 → 退回静态收款码 + 人工核销
            db()->prepare('UPDATE orders SET pay_provider = ? WHERE order_no = ?')->execute(['manual', $orderNo]);
            out([
                'ok' => true,
                'order_no' => $orderNo,
                'status' => 'pending',
                'auto' => false,
                'provider' => 'manual',
                'hint' => $created['error'] ?? '',
            ]);
        }

        case 'status': {
            $user = current_user();
            $orderNo = param($in, 'order_no');
            $stmt = db()->prepare('SELECT * FROM orders WHERE order_no = ? AND user_id = ? LIMIT 1');
            $stmt->execute([$orderNo, $user['id']]);
            $order = $stmt->fetch();
            if (!$order) {
                fail('订单不存在', 404);
            }
            if ($order['status'] === 'pending' && $order['pay_provider'] && $order['pay_provider'] !== 'manual') {
                $fresh = (int) (time() - strtotime((string) ($order['last_checked'] ?: $order['created_at'])));
                if ($fresh >= 3) {
                    db()->prepare('UPDATE orders SET last_checked = NOW() WHERE id = ?')->execute([$order['id']]);
                    $q = provider_query($order);
                    if (!empty($q['paid'])) {
                        credit_order($orderNo, (string) ($q['trade_no'] ?? ''), '通道自动核销');
                        $stmt->execute([$orderNo, $user['id']]);
                        $order = $stmt->fetch();
                    }
                }
            }
            maybe_poll_pending_orders(2);
            $fresh = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
            $fresh->execute([$user['id']]);
            out([
                'ok' => true,
                'status' => $order['status'],
                'paid' => $order['status'] === 'paid',
                'order_no' => $orderNo,
                'user' => public_user($fresh->fetch()),
            ]);
        }

        case 'notify': {
            $provider = param($in, 'provider', PAY_PROVIDER);
            if ($provider === 'alipay') {
                $publicKey = alipay_key(ALIPAY_PUBLIC_KEY, ALIPAY_PUBLIC_KEY_PATH, 'PUBLIC');
                if ($publicKey !== '' && alipay_verify($in, trim($publicKey))) {
                    if (in_array(param($in, 'trade_status'), ['TRADE_SUCCESS', 'TRADE_FINISHED'], true)) {
                        credit_order(param($in, 'out_trade_no'), param($in, 'trade_no'), '支付宝回调自动核销');
                    }
                }
                echo 'success';
                exit;
            }
            if ($provider === 'epay') {
                $sign = param($in, 'sign');
                $calc = epay_sign($in, EPAY_KEY);
                if ($sign === '' || !hash_equals($calc, $sign)) {
                    out(['ok' => false, 'error' => 'sign error'], 400);
                }
                if (param($in, 'trade_status') === 'TRADE_SUCCESS') {
                    credit_order(param($in, 'out_trade_no'), param($in, 'trade_no'), '回调自动核销');
                }
                echo 'success';
                exit;
            }
            out(['ok' => true]);
        }

        case 'credit': {
            require_admin();
            $r = credit_order(param($in, 'order_no'), param($in, 'trade_no'), mb_substr(param($in, 'note', '管理员核销'), 0, 200));
            out($r);
        }

        case 'pending': {
            require_admin();
            maybe_poll_pending_orders(20);
            out(['ok' => true]);
        }

        case 'mockpay': {
            // 测试通道的模拟付款页：把订单标记为已支付，用于验证自动发放链路
            $orderNo = param($in, 'order_no');
            header('Content-Type: text/html; charset=utf-8');
            echo '<!doctype html><meta charset="utf-8"><title>模拟支付</title>'
                . '<div style="font-family:system-ui;padding:40px;text-align:center">'
                . '<h2>模拟支付通道</h2><p>订单号：' . htmlspecialchars($orderNo) . '</p>'
                . '<p>这是测试用的付款页：支付状态会在约 8 秒后自动变为「已支付」，用于验证自动发放。</p>'
                . '</div>';
            exit;
        }

        default:
            fail('未知操作', 404);
    }
} catch (Throwable $e) {
    fail('服务器错误：' . $e->getMessage(), 500);
}
