<?php
/* 订单接口：创建订单（待管理员核销）/ 查看我的订单 */

require __DIR__ . '/config.php';

$in = body();
$action = param($in, 'action', 'create');

try {
    $user = current_user();

    if ($action === 'create') {
        $planLabel = mb_substr(param($in, 'plan_label', '套餐'), 0, 60);
        $planCount = max(1, (int) param($in, 'plan_count', '1'));
        $amount = (float) param($in, 'amount', '0');
        $orderNo = new_order_no();
        $stmt = db()->prepare(
            'INSERT INTO orders (order_no, user_id, plan_label, plan_count, amount, status, created_at) VALUES (?,?,?,?,?,?,NOW())'
        );
        $stmt->execute([$orderNo, $user['id'], $planLabel, $planCount, $amount, 'pending']);
        log_event((int) $user['id'], 'order', $orderNo . ' / ' . $planLabel . ' / ¥' . $amount);
        out(['ok' => true, 'order_no' => $orderNo, 'status' => 'pending']);
    }

    if ($action === 'list') {
        $stmt = db()->prepare(
            'SELECT order_no, plan_label, plan_count, amount, status, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 50'
        );
        $stmt->execute([$user['id']]);
        out(['ok' => true, 'orders' => $stmt->fetchAll()]);
    }

    fail('未知操作', 404);
} catch (Throwable $e) {
    fail('服务器错误：' . $e->getMessage(), 500);
}
