<?php
/* 用量接口：扣减篇数 / 查询剩余 */

require __DIR__ . '/config.php';

$in = body();
$action = param($in, 'action', 'consume');

try {
    $user = current_user();

    if ($action === 'check') {
        out(['ok' => true, 'user' => public_user($user)]);
    }

    if ($action === 'consume') {
        $left = (int) $user['quota_total'] - (int) $user['quota_used'];
        if ($left <= 0) {
            fail('套餐次数已用完，请先购买套餐', 402);
        }
        $title = mb_substr(param($in, 'title', '未命名文档'), 0, 200);
        $docType = mb_substr(param($in, 'doc_type'), 0, 60);
        $words = mb_substr(param($in, 'words'), 0, 30);

        $pdo = db();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('INSERT INTO usage_log (user_id, title, doc_type, words, created_at) VALUES (?,?,?,?,NOW())')
                ->execute([$user['id'], $title, $docType, $words]);
            $pdo->prepare('UPDATE users SET quota_used = quota_used + 1 WHERE id = ?')->execute([$user['id']]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        log_event((int) $user['id'], 'consume', $title . ' / ' . $docType);
        $fresh = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $fresh->execute([$user['id']]);
        out(['ok' => true, 'user' => public_user($fresh->fetch())]);
    }

    fail('未知操作', 404);
} catch (Throwable $e) {
    fail('服务器错误：' . $e->getMessage(), 500);
}
