<?php
/* 账号接口：注册 / 登录 / 我的信息 / 退出 */

require __DIR__ . '/config.php';
require_once __DIR__ . '/pay-lib.php';

$in = body();
$action = param($in, 'action');

try {
    switch ($action) {
        case 'register': {
            $phone = param($in, 'phone');
            $password = param($in, 'password');
            if (!valid_phone($phone)) {
                fail('请输入 11 位手机号（以 1 开头）');
            }
            if (strlen($password) < 6) {
                fail('密码至少 6 位');
            }
            $exists = db()->prepare('SELECT id FROM users WHERE phone = ? LIMIT 1');
            $exists->execute([$phone]);
            if ($exists->fetch()) {
                fail('该手机号已注册，请直接登录');
            }
            $name = '用户 ' . substr($phone, -4);
            $stmt = db()->prepare(
                'INSERT INTO users (phone, name, pass_hash, created_at, last_login) VALUES (?,?,?,NOW(),NOW())'
            );
            $stmt->execute([$phone, $name, password_hash($password, PASSWORD_DEFAULT)]);
            $userId = (int) db()->lastInsertId();
            log_event($userId, 'register', $phone);
            $token = issue_token($userId);
            $user = fetch_user($userId);
            out(['ok' => true, 'token' => $token, 'user' => public_user($user)]);
        }

        case 'login': {
            $phone = param($in, 'phone');
            $password = param($in, 'password');
            if (!valid_phone($phone)) {
                fail('请输入 11 位手机号（以 1 开头）');
            }
            $stmt = db()->prepare('SELECT * FROM users WHERE phone = ? LIMIT 1');
            $stmt->execute([$phone]);
            $user = $stmt->fetch();
            if (!$user || !password_verify($password, $user['pass_hash'])) {
                fail('手机号或密码不正确', 401);
            }
            db()->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);
            log_event((int) $user['id'], 'login', $phone);
            $token = issue_token((int) $user['id']);
            out(['ok' => true, 'token' => $token, 'user' => public_user($user)]);
        }

        case 'me': {
            $user = current_user();
            maybe_poll_pending_orders(2);
            $orders = db()->prepare(
                'SELECT order_no, plan_label, plan_count, amount, status, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 30'
            );
            $orders->execute([$user['id']]);
            $usage = db()->prepare(
                'SELECT title, doc_type, words, created_at FROM usage_log WHERE user_id = ? ORDER BY id DESC LIMIT 50'
            );
            $usage->execute([$user['id']]);
            out([
                'ok' => true,
                'user' => public_user($user),
                'orders' => $orders->fetchAll(),
                'usage' => $usage->fetchAll(),
            ]);
        }

        case 'logout': {
            $token = bearer_token();
            if ($token !== '') {
                db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$token]);
            }
            out(['ok' => true]);
        }

        case 'ping': {
            out(['ok' => true, 'time' => date('c'), 'db' => DB_NAME]);
        }

        default:
            fail('未知操作', 404);
    }
} catch (Throwable $e) {
    fail('服务器错误：' . $e->getMessage(), 500);
}

function issue_token(int $userId): string
{
    $token = new_token();
    $stmt = db()->prepare(
        'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))'
    );
    $stmt->execute([$token, $userId, SESSION_DAYS]);
    return $token;
}

function fetch_user(int $userId): array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    return $stmt->fetch() ?: [];
}
