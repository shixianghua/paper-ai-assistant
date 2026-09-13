/* 后端接口封装（Byet 主机上的 PHP + MySQL）
 * 同源部署时地址是 ./api/*.php；在 GitHub Pages 等纯静态环境下会返回 404，
 * 上层会自动回退到「本地演示模式」。
 */

const BASE = "./api"

function httpError(status) {
  const err = new Error(status === 404 ? "后端不可用" : `请求失败（HTTP ${status}）`)
  err.code = status
  return err
}

async function req(file, payload, token) {
  let res
  try {
    res = await fetch(`${BASE}/${file}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // token 同时放进请求体：部分免费主机会丢弃 Authorization 头
      body: JSON.stringify({ ...(payload || {}), ...(token ? { token } : {}) }),
    })
  } catch {
    throw httpError(0)
  }
  if (res.status === 404 || res.status === 405) throw httpError(res.status)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `请求失败（HTTP ${res.status}）`)
    err.code = res.status
    throw err
  }
  return data
}

export const apiPing = () => req("auth.php", { action: "ping" })
export const apiRegister = (phone, password) => req("auth.php", { action: "register", phone, password })
export const apiLogin = (phone, password) => req("auth.php", { action: "login", phone, password })
export const apiMe = (token) => req("auth.php", { action: "me" }, token)
export const apiLogout = (token) => req("auth.php", { action: "logout" }, token)
export const apiConsume = (token, payload) => req("usage.php", { action: "consume", ...payload }, token)
export const apiCreateOrder = (token, payload) => req("orders.php", { action: "create", ...payload }, token)
export const apiPayConfig = () => req("pay.php", { action: "config" })
export const apiPayCreate = (token, payload) => req("pay.php", { action: "create", ...payload }, token)
export const apiPayStatus = (token, orderNo) => req("pay.php", { action: "status", order_no: orderNo }, token)

export async function apiAvailable() {
  try {
    await apiPing()
    return true
  } catch {
    return false
  }
}
