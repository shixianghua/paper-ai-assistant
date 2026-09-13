<?php
/* 支付通道抽象层：下单、查单、验签、自动发放
 * 自动发放核心：credit_order() —— 幂等，重复调用不会重复加篇数
 */

require_once __DIR__ . '/config.php';

function http_json(string $url, ?array $payload = null, array $headers = [], string $method = 'POST'): array
{
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => $headers,
    ];
    if ($payload !== null) {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $opts[CURLOPT_HTTPHEADER] = array_merge($headers, ['Content-Type: application/json']);
    } else {
        $opts[CURLOPT_HTTPGET] = true;
    }
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false) {
        return ['ok' => false, 'error' => $err ?: '网络请求失败'];
    }
    $json = json_decode($body, true);
    return ['ok' => $code >= 200 && $code < 300, 'status' => $code, 'data' => is_array($json) ? $json : [], 'raw' => $body];
}

/** 表单方式 POST（支付宝网关要求 application/x-www-form-urlencoded） */
function http_form(string $url, array $params): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($params),
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body = curl_exec($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false) {
        return ['ok' => false, 'error' => $err ?: '网络请求失败'];
    }
    $json = json_decode($body, true);
    return ['ok' => $code >= 200 && $code < 300, 'status' => $code, 'data' => is_array($json) ? $json : [], 'raw' => $body];
}

/* ---------------- 支付宝当面付 ---------------- */

function alipay_key(string $inline, string $path, string $type): string
{
    $key = trim($inline);
    if ($key === '' && is_file($path)) {
        $key = trim((string) file_get_contents($path));
    }
    if ($key === '') {
        return '';
    }
    if (strpos($key, '-----BEGIN') === false) {
        $body = chunk_split(preg_replace('/\s+/', '', $key), 64, "\n");
        $key = "-----BEGIN {$type} KEY-----\n" . $body . "-----END {$type} KEY-----\n";
    }
    return $key;
}

function alipay_sign(array $params, string $privateKey): string
{
    ksort($params);
    $pairs = [];
    foreach ($params as $k => $v) {
        if ($v === '' || $k === 'sign' || $k === 'sign_type') {
            continue;
        }
        $pairs[] = $k . '=' . $v;
    }
    $content = implode('&', $pairs);
    $res = openssl_sign($content, $signature, $privateKey, OPENSSL_ALGO_SHA256);
    return $res ? base64_encode($signature) : '';
}

function alipay_verify(array $params, string $publicKey): bool
{
    if (empty($params['sign'])) {
        return false;
    }
    $sign = $params['sign'];
    unset($params['sign'], $params['sign_type']);
    ksort($params);
    $pairs = [];
    foreach ($params as $k => $v) {
        if ($v === '' || is_array($v)) {
            continue;
        }
        $pairs[] = $k . '=' . $v;
    }
    return openssl_verify(implode('&', $pairs), base64_decode($sign), $publicKey, OPENSSL_ALGO_SHA256) === 1;
}

/** 调用支付宝开放平台接口 */
function alipay_request(string $method, array $bizContent, string $notifyUrl = ''): array
{
    $privateKey = alipay_key(ALIPAY_PRIVATE_KEY, ALIPAY_PRIVATE_KEY_PATH, 'PRIVATE');
    if (ALIPAY_APPID === '' || $privateKey === '') {
        return ['ok' => false, 'error' => '支付宝 APPID 或应用私钥未配置'];
    }
    $params = [
        'app_id' => ALIPAY_APPID,
        'method' => $method,
        'format' => 'JSON',
        'charset' => 'utf-8',
        'sign_type' => 'RSA2',
        'timestamp' => date('Y-m-d H:i:s'),
        'version' => '1.0',
        'biz_content' => json_encode($bizContent, JSON_UNESCAPED_UNICODE),
    ];
    if ($notifyUrl !== '') {
        $params['notify_url'] = $notifyUrl;
    }
    $params['sign'] = alipay_sign($params, $privateKey);
    if ($params['sign'] === '') {
        return ['ok' => false, 'error' => '支付宝签名失败，请检查应用私钥'];
    }
    $res = http_form(ALIPAY_GATEWAY, $params);
    if (!$res['ok']) {
        return ['ok' => false, 'error' => $res['error'] ?? '支付宝网关不可达'];
    }
    $node = str_replace('.', '_', $method) . '_response';
    $data = $res['data'][$node] ?? null;
    if (!is_array($data)) {
        return ['ok' => false, 'error' => '支付宝返回格式异常', 'raw' => substr((string) $res['raw'], 0, 300)];
    }
    if (($data['code'] ?? '') !== '10000') {
        return ['ok' => false, 'error' => ($data['sub_msg'] ?? $data['msg'] ?? '支付宝接口返回错误'), 'code' => $data['code'] ?? ''];
    }
    return ['ok' => true, 'data' => $data];
}

/* ---------------- 自动发放（核心） ---------------- */

function credit_order(string $orderNo, string $tradeNo = '', string $note = ''): array
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE order_no = ? LIMIT 1');
    $stmt->execute([$orderNo]);
    $order = $stmt->fetch();
    if (!$order) {
        return ['ok' => false, 'error' => '订单不存在'];
    }
    if ($order['status'] === 'paid' || (int) ($order['credited'] ?? 0) === 1) {
        return ['ok' => true, 'already' => true];
    }
    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            "UPDATE orders SET status = 'paid', paid_at = NOW(), credited = 1, pay_trade_no = ?, admin_note = ? WHERE id = ? AND status <> 'paid'"
        )->execute([$tradeNo, $note ?: '自动发放', $order['id']]);
        $pdo->prepare('UPDATE users SET quota_total = quota_total + ?, amount_paid = amount_paid + ? WHERE id = ?')
            ->execute([(int) $order['plan_count'], (float) $order['amount'], (int) $order['user_id']]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        return ['ok' => false, 'error' => $e->getMessage()];
    }
    log_event((int) $order['user_id'], 'auto_paid', $orderNo . ' / +' . $order['plan_count'] . ' 篇 / ¥' . $order['amount']);
    return ['ok' => true, 'credited' => true, 'user_id' => (int) $order['user_id']];
}

/* ---------------- 通道下单 ---------------- */

function epay_sign(array $params, string $key): string
{
    ksort($params);
    $pairs = [];
    foreach ($params as $k => $v) {
        if ($v === '' || $k === 'sign' || $k === 'sign_type') {
            continue;
        }
        $pairs[] = $k . '=' . $v;
    }
    return md5(implode('&', $pairs) . $key);
}

/** 创建支付，返回 ['ok'=>true,'pay_url'=>'...','provider'=>'...'] */
function provider_create(array $order): array
{
    $provider = PAY_PROVIDER;
    $orderNo = $order['order_no'];
    $amount = number_format((float) $order['amount'], 2, '.', '');
    $subject = '升格智能论文系统 · ' . $order['plan_label'];

    if ($provider === 'mock') {
        return ['ok' => true, 'pay_url' => SITE_URL . '/api/pay.php?action=mockpay&order_no=' . urlencode($orderNo), 'provider' => 'mock'];
    }

    if ($provider === 'epay') {
        if (EPAY_API === '' || EPAY_PID === '' || EPAY_KEY === '') {
            return ['ok' => false, 'error' => '易支付参数未配置'];
        }
        $params = [
            'act' => 'order',
            'pid' => EPAY_PID,
            'type' => 'wxpay',
            'out_trade_no' => $orderNo,
            'notify_url' => SITE_URL . '/api/pay.php?action=notify&provider=epay',
            'return_url' => SITE_URL . '/?pay=done&order=' . $orderNo,
            'name' => $subject,
            'money' => $amount,
            'sitename' => '升格智能论文系统',
        ];
        $params['sign'] = epay_sign($params, EPAY_KEY);
        $params['sign_type'] = 'MD5';
        $res = http_json(rtrim(EPAY_API, '/') . '/mapi.php', $params);
        if (!$res['ok']) {
            return ['ok' => false, 'error' => '支付通道请求失败：' . ($res['error'] ?? $res['status'])];
        }
        $data = $res['data'];
        if ((int) ($data['code'] ?? 0) !== 1) {
            return ['ok' => false, 'error' => $data['msg'] ?? '支付通道下单失败'];
        }
        $payUrl = $data['qrcode'] ?? ($data['payurl'] ?? ($data['urlscheme'] ?? ''));
        return [
            'ok' => true,
            'pay_url' => $payUrl,
            'raw' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'provider' => 'epay',
        ];
    }

    if ($provider === 'wechat') {
        if (WX_MCHID === '' || WX_APPID === '' || !is_file(WX_KEY_PATH)) {
            return ['ok' => false, 'error' => '微信支付商户参数/证书未配置'];
        }
        $body = [
            'appid' => WX_APPID,
            'mchid' => WX_MCHID,
            'description' => $subject,
            'out_trade_no' => $orderNo,
            'notify_url' => SITE_URL . '/api/pay.php?action=notify&provider=wechat',
            'amount' => ['total' => (int) round((float) $order['amount'] * 100), 'currency' => 'CNY'],
        ];
        $auth = wechat_auth_header('POST', '/v3/pay/transactions/native', $body);
        if (!$auth['ok']) {
            return $auth;
        }
        $res = http_json('https://api.mch.weixin.qq.com/v3/pay/transactions/native', $body, [$auth['header']]);
        if (!$res['ok'] || empty($res['data']['code_url'])) {
            return ['ok' => false, 'error' => $res['data']['message'] ?? '微信支付下单失败'];
        }
        return ['ok' => true, 'pay_url' => $res['data']['code_url'], 'provider' => 'wechat'];
    }

    if ($provider === 'alipay') {
        $res = alipay_request(
            'alipay.trade.precreate',
            [
                'out_trade_no' => $orderNo,
                'total_amount' => $amount,
                'subject' => $subject,
                'timeout_express' => '15m',
            ],
            SITE_URL . '/api/pay.php?action=notify&provider=alipay'
        );
        if (!$res['ok']) {
            return ['ok' => false, 'error' => '支付宝下单失败：' . $res['error']];
        }
        return ['ok' => true, 'pay_url' => $res['data']['qr_code'] ?? '', 'provider' => 'alipay'];
    }

    return ['ok' => false, 'error' => '未配置自动支付通道'];
}

/* ---------------- 通道查单 ---------------- */

function provider_query(array $order): array
{
    $provider = $order['pay_provider'] ?: PAY_PROVIDER;
    $orderNo = $order['order_no'];

    if ($provider === 'mock') {
        // 测试模式：下单 8 秒后视为已支付
        $created = strtotime($order['created_at']);
        return ['ok' => true, 'paid' => (time() - $created) >= 8, 'trade_no' => 'MOCK' . $orderNo];
    }

    if ($provider === 'epay') {
        if (EPAY_API === '' || EPAY_PID === '' || EPAY_KEY === '') {
            return ['ok' => false, 'error' => '易支付参数未配置'];
        }
        $url = rtrim(EPAY_API, '/') . '/api.php?act=order&pid=' . urlencode(EPAY_PID) . '&key=' . urlencode(EPAY_KEY)
            . '&out_trade_no=' . urlencode($orderNo);
        $res = http_json($url, null, [], 'GET');
        if (!$res['ok']) {
            return ['ok' => false, 'error' => $res['error'] ?? '查询失败'];
        }
        $d = $res['data'];
        $status = (int) ($d['status'] ?? 0);
        return ['ok' => true, 'paid' => $status === 1, 'trade_no' => (string) ($d['trade_no'] ?? '')];
    }

    if ($provider === 'wechat') {
        $path = '/v3/pay/transactions/out-trade-no/' . rawurlencode($orderNo) . '?mchid=' . rawurlencode(WX_MCHID);
        $auth = wechat_auth_header('GET', $path, null);
        if (!$auth['ok']) {
            return $auth;
        }
        $res = http_json('https://api.mch.weixin.qq.com' . $path, null, [$auth['header']], 'GET');
        if (!$res['ok']) {
            return ['ok' => false, 'error' => $res['data']['message'] ?? '查询失败'];
        }
        $state = $res['data']['trade_state'] ?? '';
        return ['ok' => true, 'paid' => $state === 'SUCCESS', 'trade_no' => (string) ($res['data']['transaction_id'] ?? '')];
    }

    if ($provider === 'alipay') {
        $res = alipay_request('alipay.trade.query', ['out_trade_no' => $orderNo]);
        if (!$res['ok']) {
            // 交易不存在（用户还没扫码）不算错误
            if (($res['code'] ?? '') === '40004') {
                return ['ok' => true, 'paid' => false];
            }
            return ['ok' => false, 'error' => $res['error']];
        }
        $d = $res['data'];
        $status = (string) ($d['trade_status'] ?? '');
        return [
            'ok' => true,
            'paid' => in_array($status, ['TRADE_SUCCESS', 'TRADE_FINISHED'], true),
            'trade_no' => (string) ($d['trade_no'] ?? ''),
        ];
    }

    return ['ok' => true, 'paid' => false];
}

/* ---------------- 微信支付签名 ---------------- */

function wechat_auth_header(string $method, string $pathWithQuery, ?array $body): array
{
    if (!is_file(WX_KEY_PATH)) {
        return ['ok' => false, 'error' => '缺少商户私钥 apiclient_key.pem'];
    }
    $privateKey = openssl_pkey_get_private((string) file_get_contents(WX_KEY_PATH));
    if (!$privateKey) {
        return ['ok' => false, 'error' => '商户私钥无法读取'];
    }
    $timestamp = (string) time();
    $nonce = bin2hex(random_bytes(16));
    $bodyStr = $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE);
    $message = $method . "\n" . $pathWithQuery . "\n" . $timestamp . "\n" . $nonce . "\n" . $bodyStr . "\n";
    $signature = '';
    if (!openssl_sign($message, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
        return ['ok' => false, 'error' => '签名失败'];
    }
    $header = sprintf(
        'Authorization: WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",signature="%s",timestamp="%s",serial_no="%s"',
        WX_MCHID,
        $nonce,
        base64_encode($signature),
        $timestamp,
        WX_SERIAL
    );
    return ['ok' => true, 'header' => $header];
}

/* ---------------- 轮询看护：任何接口请求都会顺手检查待支付订单 ----------------
 * 免费主机没有服务器端回调/cron，这里用「懒检查」代替：
 * 只要有用户或管理员访问站点接口，就会挑几条超时的待支付订单去通道查一次，
 * 已支付就立刻发放额度。用户停留在支付页时前端每 3 秒轮询一次，到账通常在数秒内。
 */

function maybe_poll_pending_orders(int $limit = 3): void
{
    if (PAY_PROVIDER === 'manual') {
        return;
    }
    try {
        $stmt = db()->prepare(
            "SELECT * FROM orders
             WHERE status = 'pending' AND pay_provider IS NOT NULL AND pay_provider <> ''
               AND (last_checked IS NULL OR last_checked < DATE_SUB(NOW(), INTERVAL 5 SECOND))
             ORDER BY id ASC LIMIT " . max(1, $limit)
        );
        $stmt->execute();
        foreach ($stmt->fetchAll() as $order) {
            db()->prepare('UPDATE orders SET last_checked = NOW() WHERE id = ?')->execute([$order['id']]);
            $q = provider_query($order);
            if (!empty($q['paid'])) {
                credit_order($order['order_no'], (string) ($q['trade_no'] ?? ''), '通道自动核销');
            }
        }
    } catch (Throwable $e) {
        /* 看护失败不影响主流程 */
    }
}
