<?php
/* 一次性初始化数据库表结构：/api/setup.php?key=SETUP_KEY
 * 建表完成后可以删除本文件（或保留，重复执行也安全）。
 */

require __DIR__ . '/config.php';

if (param(body(), 'key') !== SETUP_KEY) {
    fail('setup key 不正确', 403);
}

$sql = [
    'users' => "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(64) NOT NULL DEFAULT '',
        pass_hash VARCHAR(255) NOT NULL,
        quota_total INT NOT NULL DEFAULT 0,
        quota_used INT NOT NULL DEFAULT 0,
        amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
        note VARCHAR(255) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL,
        last_login DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    'sessions' => "CREATE TABLE IF NOT EXISTS sessions (
        token CHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        created_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    'orders' => "CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(32) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        plan_label VARCHAR(64) NOT NULL,
        plan_count INT NOT NULL DEFAULT 1,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL,
        paid_at DATETIME NULL,
        admin_note VARCHAR(255) NOT NULL DEFAULT '',
        INDEX idx_user (user_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    'usage_log' => "CREATE TABLE IF NOT EXISTS usage_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT '',
        doc_type VARCHAR(64) NOT NULL DEFAULT '',
        words VARCHAR(32) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    'events' => "CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        kind VARCHAR(32) NOT NULL,
        detail VARCHAR(255) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

$done = [];
try {
    foreach ($sql as $name => $statement) {
        db()->exec($statement);
        $done[] = $name;
    }
} catch (Throwable $e) {
    fail('建表失败：' . $e->getMessage(), 500);
}

out([
    'ok' => true,
    'created' => $done,
    'database' => DB_NAME,
    'tables' => db()->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN),
]);
