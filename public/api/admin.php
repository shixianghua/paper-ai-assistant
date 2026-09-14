<?php
/* 管理后台接口（需要 X-Admin-Key / key 参数）
 * action=stats   概览数据
 * action=users   用户列表（含充值、已用、剩余）
 * action=user    单个用户详情（订单 + 使用明细）
 * action=orders  订单列表（可按 status 过滤）
 * action=markPaid 核销订单：给用户加篇数、累计充值金额
 * action=setQuota 手动调整用户额度/已充值金额
 */

require __DIR__ . '/config.php';

require_admin();

$in = body();
$action = param($in, 'action', 'stats');

try {
    switch ($action) {
        case 'stats': {
            $stats = db()->query(
                'SELECT COUNT(*) AS users,
                        COALESCE(SUM(quota_total),0) AS quota_total,
                        COALESCE(SUM(quota_used),0) AS quota_used,
                        COALESCE(SUM(amount_paid),0) AS amount_paid
                 FROM users'
            )->fetch();
            $pending = db()->query("SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'")->fetchColumn();
            $paidOrders = db()->query("SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS amount FROM orders WHERE status = 'paid'")->fetch();
            $today = db()->query(
                "SELECT (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) AS new_users,
                        (SELECT COUNT(*) FROM usage_log WHERE DATE(created_at) = CURDATE()) AS used_today"
            )->fetch();
            out([
                'ok' => true,
                'users' => (int) $stats['users'],
                'quotaTotal' => (int) $stats['quota_total'],
                'quotaUsed' => (int) $stats['quota_used'],
                'quotaLeft' => max(0, (int) $stats['quota_total'] - (int) $stats['quota_used']),
                'amountPaid' => (float) $stats['amount_paid'],
                'pendingOrders' => (int) $pending,
                'paidOrders' => (int) $paidOrders['c'],
                'paidAmount' => (float) $paidOrders['amount'],
                'newUsersToday' => (int) $today['new_users'],
                'usedToday' => (int) $today['used_today'],
            ]);
        }

        case 'users': {
            $q = param($in, 'q');
            $sql = 'SELECT id, phone, name, quota_total, quota_used, amount_paid, note, created_at, last_login FROM users';
            $params = [];
            if ($q !== '') {
                $sql .= ' WHERE phone LIKE ? OR name LIKE ?';
                $params = ['%' . $q . '%', '%' . $q . '%'];
            }
            $sql .= ' ORDER BY id DESC LIMIT 300';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
            $tokStmt = db()->prepare(
                "SELECT user_id, COALESCE(SUM(tokens),0) AS t FROM usage_log WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') GROUP BY user_id"
            );
            $tokStmt->execute();
            $tokMap = [];
            foreach ($tokStmt->fetchAll() as $tr) {
                $tokMap[(int) $tr['user_id']] = (int) $tr['t'];
            }
            $rows = array_map(static function (array $u): array {
                return [
                    'id' => (int) $u['id'],
                    'phone' => $u['phone'],
                    'name' => $u['name'],
                    'quotaTotal' => (int) $u['quota_total'],
                    'quotaUsed' => (int) $u['quota_used'],
                    'quotaLeft' => max(0, (int) $u['quota_total'] - (int) $u['quota_used']),
                    'amountPaid' => (float) $u['amount_paid'],
                    'note' => $u['note'],
                    'createdAt' => $u['created_at'],
                    'lastLogin' => $u['last_login'],
                    'tokensThisMonth' => $tokMap[(int) $u['id']] ?? 0,
                ];
            }, $stmt->fetchAll());
            out(['ok' => true, 'users' => $rows]);
        }

        case 'user': {
            $id = (int) param($in, 'id', '0');
            $stmt = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            if (!$user) {
                fail('用户不存在', 404);
            }
            $orders = db()->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 100');
            $orders->execute([$id]);
            $usage = db()->prepare('SELECT * FROM usage_log WHERE user_id = ? ORDER BY id DESC LIMIT 100');
            $usage->execute([$id]);
            out([
                'ok' => true,
                'user' => [
                    'id' => (int) $user['id'],
                    'phone' => $user['phone'],
                    'name' => $user['name'],
                    'quotaTotal' => (int) $user['quota_total'],
                    'quotaUsed' => (int) $user['quota_used'],
                    'quotaLeft' => max(0, (int) $user['quota_total'] - (int) $user['quota_used']),
                    'amountPaid' => (float) $user['amount_paid'],
                    'note' => $user['note'],
                    'createdAt' => $user['created_at'],
                    'lastLogin' => $user['last_login'],
                ],
                'orders' => $orders->fetchAll(),
                'usage' => $usage->fetchAll(),
            ]);
        }

        case 'orders': {
            $status = param($in, 'status');
            $sql = 'SELECT o.*, u.phone, u.name FROM orders o JOIN users u ON u.id = o.user_id';
            $params = [];
            if ($status !== '') {
                $sql .= ' WHERE o.status = ?';
                $params[] = $status;
            }
            $sql .= ' ORDER BY o.id DESC LIMIT 300';
            $stmt = db()->prepare($sql);
            $stmt->execute($params);
            out(['ok' => true, 'orders' => $stmt->fetchAll()]);
        }

        case 'markPaid': {
            $orderNo = param($in, 'order_no');
            $note = mb_substr(param($in, 'note'), 0, 200);
            $stmt = db()->prepare('SELECT * FROM orders WHERE order_no = ? LIMIT 1');
            $stmt->execute([$orderNo]);
            $order = $stmt->fetch();
            if (!$order) {
                fail('订单不存在', 404);
            }
            if ($order['status'] === 'paid') {
                fail('该订单已经核销过了');
            }
            $pdo = db();
            $pdo->beginTransaction();
            try {
                $pdo->prepare("UPDATE orders SET status = 'paid', paid_at = NOW(), admin_note = ? WHERE id = ?")
                    ->execute([$note, $order['id']]);
                $pdo->prepare('UPDATE users SET quota_total = quota_total + ?, amount_paid = amount_paid + ? WHERE id = ?')
                    ->execute([(int) $order['plan_count'], (float) $order['amount'], (int) $order['user_id']]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            log_event((int) $order['user_id'], 'paid', $orderNo . ' / +' . $order['plan_count'] . ' 篇 / ¥' . $order['amount']);
            out(['ok' => true]);
        }

        case 'setQuota': {
            $id = (int) param($in, 'id', '0');
            $total = (int) param($in, 'quota_total', '0');
            $used = (int) param($in, 'quota_used', '0');
            $amount = (float) param($in, 'amount_paid', '0');
            $note = mb_substr(param($in, 'note'), 0, 200);
            $stmt = db()->prepare(
                'UPDATE users SET quota_total = ?, quota_used = ?, amount_paid = ?, note = ? WHERE id = ?'
            );
            $stmt->execute([max(0, $total), max(0, $used), $amount, $note, $id]);
            log_event($id, 'admin', '手动调整为 总' . $total . ' 已用' . $used . ' 充值' . $amount);
            out(['ok' => true]);
        }

        case 'events': {
            $stmt = db()->query('SELECT e.*, u.phone FROM events e LEFT JOIN users u ON u.id = e.user_id ORDER BY e.id DESC LIMIT 200');
            out(['ok' => true, 'events' => $stmt->fetchAll()]);
        }

        default:
            fail('未知操作', 404);
    }
} catch (Throwable $e) {
    fail('服务器错误：' . $e->getMessage(), 500);
}
