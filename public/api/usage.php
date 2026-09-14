<?php
/* 用量接口：扣减篇数 / 查询剩余 */

require __DIR__ . '/config.php';

$in = body();
$action = param($in, 'action', 'consume');

try {
    $user = current_user();

    if ($action === 'check') {
        out([
            'ok' => true,
            'user' => public_user($user),
            'tokensThisMonth' => monthly_tokens((int) $user['id']),
            'tokenLimit' => MONTHLY_TOKEN_LIMIT,
        ]);
    }

    if ($action === 'consume') {
        $kind = param($in, 'kind', 'full');           // full（生成全文，扣 1 篇）| rewrite（全文改稿）| chapter（章节改稿）
        if (!in_array($kind, ['full', 'rewrite', 'chapter'], true)) {
            $kind = 'full';
        }
        $tokens = max(0, (int) param($in, 'tokens', '0'));
        $userId = (int) $user['id'];

        // 护栏 1：每月 token 封顶（防止脚本刷量）
        $usedTokens = monthly_tokens($userId);
        if ($usedTokens + $tokens > MONTHLY_TOKEN_LIMIT) {
            fail('本月额度已用尽（已达平台使用上限），请下月再用或联系客服', 429);
        }

        // 护栏 2：改稿频率与次数限制（"不限次数"但不能刷）
        if ($kind === 'rewrite' || $kind === 'chapter') {
            $gap = last_same_kind_seconds($userId, $kind);
            if ($gap < REWRITE_MIN_INTERVAL) {
                fail('操作过于频繁，请 ' . (REWRITE_MIN_INTERVAL - $gap) . ' 秒后再试', 429);
            }
            $limit = $kind === 'rewrite' ? REWRITE_DAILY_LIMIT : CHAPTER_DAILY_LIMIT;
            if (today_count($userId, $kind) >= $limit) {
                fail($kind === 'rewrite' ? '今日改稿次数已达上限（' . $limit . ' 次），请明天再试' : '今日章节修改次数已达上限', 429);
            }
        }

        // 护栏 3：只有"生成全文"扣篇数；改稿与章节修改不扣篇（成本由 token 封顶兜住）
        if ($kind === 'full') {
            $left = (int) $user['quota_total'] - (int) $user['quota_used'];
            if ($left <= 0) {
                fail('套餐次数已用完，请先购买套餐', 402);
            }
        }

        $title = mb_substr(param($in, 'title', '未命名文档'), 0, 200);
        $docType = mb_substr(param($in, 'doc_type'), 0, 60);
        $words = mb_substr(param($in, 'words'), 0, 30);

        $pdo = db();
        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'INSERT INTO usage_log (user_id, title, doc_type, words, kind, tokens, created_at) VALUES (?,?,?,?,?,?,NOW())'
            )->execute([$userId, $title, $docType, $words, $kind, $tokens]);
            if ($kind === 'full') {
                $pdo->prepare('UPDATE users SET quota_used = quota_used + 1 WHERE id = ?')->execute([$userId]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        log_event($userId, 'consume', $kind . ' / ' . $title . ' / ' . $docType . ' / ' . $tokens . ' tokens');
        $fresh = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $fresh->execute([$userId]);
        out([
            'ok' => true,
            'user' => public_user($fresh->fetch()),
            'tokensThisMonth' => $usedTokens + $tokens,
            'tokenLimit' => MONTHLY_TOKEN_LIMIT,
            'kind' => $kind,
        ]);
    }

    fail('未知操作', 404);
} catch (Throwable $e) {
    fail('服务器错误：' . $e->getMessage(), 500);
}
