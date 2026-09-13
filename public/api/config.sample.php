<?php
/* 示例配置：把本文件复制为 config.php 并填入你自己的数据库信息。
 * 注意：真实的 config.php 含数据库口令，已被 .gitignore 排除，不会提交到公开仓库。
 */

declare(strict_types=1);

date_default_timezone_set('Asia/Shanghai');

const DB_HOST = 'sqlXXX.byethostXX.com';
const DB_NAME = 'bXXXXXXX_paper';
const DB_USER = 'bXXXXXXX';
const DB_PASS = '你的主机面板密码';

// 管理后台密钥（打开 /admin.html 时输入）；初始化数据库的密钥
const ADMIN_KEY = '改成你自己的管理密钥';
const SETUP_KEY = '改成你自己的初始化密钥';

const SESSION_DAYS = 30;
