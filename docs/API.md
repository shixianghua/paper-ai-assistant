# API 文档

本文档详细说明了论文AI助手平台的所有API接口。

## 基础信息

- **Base URL**: `http://localhost:5000/api`
- **认证方式**: Bearer Token (JWT)
- **请求格式**: JSON
- **响应格式**: JSON

## 认证说明

大部分API需要在请求头中包含JWT token：

```
Authorization: Bearer <token>
```

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { /* 响应数据 */ },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "errors": [ /* 详细错误列表（可选） */ ]
}
```

## API 端点

### 用户认证

#### 1. 用户注册

注册新用户账号。

- **URL**: `/auth/register`
- **方法**: `POST`
- **认证**: 不需要

**请求体**:

```json
{
  "email": "user@example.com",
  "username": "用户名",
  "password": "password123"
}
```

**验证规则**:
- email: 必须是有效的邮箱地址
- username: 不能为空
- password: 至少6个字符

**成功响应** (201):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "username": "用户名",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "注册成功"
}
```

#### 2. 用户登录

用户登录获取访问令牌。

- **URL**: `/auth/login`
- **方法**: `POST`
- **认证**: 不需要

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "username": "用户名",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功"
}
```

---

### 用户信息

#### 3. 获取用户资料

获取当前登录用户的个人信息。

- **URL**: `/user/profile`
- **方法**: `GET`
- **认证**: 需要

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "用户名",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 论文生成

#### 4. 生成论文大纲

根据主题和关键词生成论文大纲。

- **URL**: `/paper/generate-outline`
- **方法**: `POST`
- **认证**: 需要
- **限流**: 10次/分钟

**请求体**:

```json
{
  "topic": "人工智能在教育领域的应用研究",
  "keywords": ["人工智能", "教育", "机器学习"],
  "wordCount": 5000,
  "subject": "计算机科学"
}
```

**验证规则**:
- topic: 不能为空
- keywords: 必须是数组
- wordCount: 至少1000字
- subject: 可选

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "outline": "# 论文标题\n\n## 1. 引言\n..."
  },
  "message": "大纲生成成功"
}
```

#### 5. 生成论文内容

根据大纲生成完整论文内容。

- **URL**: `/paper/generate-content`
- **方法**: `POST`
- **认证**: 需要
- **限流**: 10次/分钟

**请求体**:

```json
{
  "outline": "# 论文标题\n\n## 1. 引言\n...",
  "topic": "人工智能在教育领域的应用研究"
}
```

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "content": "<h1>论文标题</h1><p>内容...</p>"
  },
  "message": "内容生成成功"
}
```

#### 6. 保存论文

保存生成的论文到数据库。

- **URL**: `/paper/save`
- **方法**: `POST`
- **认证**: 需要

**请求体**:

```json
{
  "title": "人工智能在教育领域的应用研究",
  "content": "<h1>标题</h1><p>内容...</p>",
  "metadata": {
    "topic": "人工智能",
    "wordCount": 5000
  }
}
```

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "人工智能在教育领域的应用研究",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "论文保存成功"
}
```

---

### 智能降重

#### 7. 检测相似度

检测文本的相似度并标记高重复部分。

- **URL**: `/rewrite/check-similarity`
- **方法**: `POST`
- **认证**: 需要
- **限流**: 10次/分钟

**请求体**:

```json
{
  "text": "需要检测的文本内容..."
}
```

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "similarity": 65,
    "highlightedText": [
      {
        "text": "第一段文本。",
        "isHighlight": true
      },
      {
        "text": "第二段文本。",
        "isHighlight": false
      }
    ]
  },
  "message": "相似度检测完成"
}
```

#### 8. 文本改写

对文本进行AI智能改写以降低相似度。

- **URL**: `/rewrite/rewrite-text`
- **方法**: `POST`
- **认证**: 需要
- **限流**: 10次/分钟

**请求体**:

```json
{
  "text": "需要改写的文本内容..."
}
```

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "rewrittenText": "改写后的文本内容..."
  },
  "message": "文本改写成功"
}
```

#### 9. 获取改写建议

获取文本的多种改写建议。

- **URL**: `/rewrite/suggest`
- **方法**: `POST`
- **认证**: 需要
- **限流**: 10次/分钟

**请求体**:

```json
{
  "text": "需要获取建议的文本..."
}
```

**成功响应** (200):

```json
{
  "success": true,
  "data": [
    {
      "original": "研究表明",
      "suggestions": ["探讨显示", "分析表明", "调查证实"]
    },
    {
      "original": "通过分析",
      "suggestions": ["借助剖析", "经由解析", "依据考察"]
    }
  ],
  "message": "获取建议成功"
}
```

---

### 文档管理

#### 10. 获取文档列表

获取当前用户的所有文档列表。

- **URL**: `/documents`
- **方法**: `GET`
- **认证**: 需要

**成功响应** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "title": "论文标题",
      "type": "generate",
      "status": "completed",
      "metadata": {
        "wordCount": 5000,
        "topic": "AI研究"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 11. 获取文档详情

获取指定文档的完整信息。

- **URL**: `/documents/:id`
- **方法**: `GET`
- **认证**: 需要

**URL参数**:
- id: 文档ID

**成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "title": "论文标题",
    "content": "<h1>标题</h1><p>内容...</p>",
    "type": "generate",
    "status": "completed",
    "metadata": {
      "wordCount": 5000,
      "topic": "AI研究"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 12. 删除文档

删除指定的文档。

- **URL**: `/documents/:id`
- **方法**: `DELETE`
- **认证**: 需要

**URL参数**:
- id: 文档ID

**成功响应** (200):

```json
{
  "success": true,
  "message": "文档删除成功"
}
```

#### 13. 导出文档

导出文档为指定格式（Word或PDF）。

- **URL**: `/documents/export`
- **方法**: `POST`
- **认证**: 需要

**请求体**:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "format": "docx"
}
```

**验证规则**:
- id: 不能为空
- format: 必须是 'docx' 或 'pdf'

**成功响应** (200):

```json
{
  "success": true,
  "message": "文档导出成功（docx格式）"
}
```

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（需要登录或token无效） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 限流说明

为保证服务稳定性，API实施了以下限流策略：

- **普通API**: 100次/15分钟
- **登录/注册**: 5次/15分钟
- **AI操作**: 10次/分钟

超出限制时会返回429状态码。

## 示例代码

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const token = 'your_jwt_token';

// 登录
const login = async () => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'user@example.com',
    password: 'password123'
  });
  return response.data;
};

// 生成大纲（需要token）
const generateOutline = async () => {
  const response = await axios.post(
    `${API_URL}/paper/generate-outline`,
    {
      topic: 'AI研究',
      keywords: ['人工智能', '机器学习'],
      wordCount: 5000
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};
```

### Python

```python
import requests

API_URL = 'http://localhost:5000/api'
token = 'your_jwt_token'

# 登录
def login():
    response = requests.post(f'{API_URL}/auth/login', json={
        'email': 'user@example.com',
        'password': 'password123'
    })
    return response.json()

# 生成大纲（需要token）
def generate_outline():
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(
        f'{API_URL}/paper/generate-outline',
        json={
            'topic': 'AI研究',
            'keywords': ['人工智能', '机器学习'],
            'wordCount': 5000
        },
        headers=headers
    )
    return response.json()
```

## 最佳实践

1. **存储Token**: 将获取的JWT token安全存储（localStorage/sessionStorage）
2. **错误处理**: 始终处理可能的错误响应
3. **限流管理**: 合理控制请求频率，避免触发限流
4. **超时设置**: 为长时间操作（如AI生成）设置适当的超时时间
5. **数据验证**: 在发送请求前进行客户端数据验证

## 更新日志

- **v1.0.0** (2024-01-01)
  - 初始版本发布
  - 完整的用户认证系统
  - 论文生成与降重核心功能
  - 文档管理系统
