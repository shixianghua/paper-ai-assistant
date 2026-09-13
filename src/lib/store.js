import { useSyncExternalStore } from "react"

const LS_USER = "sg.user"
const LS_RECORDS = "sg.records"
const LS_ACCOUNTS = "sg.accounts"

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function seedRecords() {
  const now = Date.now()
  const mk = (offset, title, type, status) => ({
    id: `demo-${offset}`,
    title,
    type,
    edu: "本科",
    words: "约 1.2 万字",
    status,
    time: new Date(now - offset).toISOString(),
    seed: true,
  })
  return [
    mk(12 * 60 * 1000, "文献综述初稿：深度学习在医学影像识别中的研究进展", "文献综述", "已生成"),
    mk(2 * 86400000, "基于 YOLOv8 的课堂专注度检测系统（答辩稿）", "答辩稿", "已排版"),
  ]
}

let snapshot = {
  user: read(LS_USER, null),
  records: read(LS_RECORDS, null) || seedRecords(),
  sessionDoc: null,
  sessionOutline: null,
  sessionMeta: null,
  toasts: [],
}

const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState() {
  return snapshot
}

function emit() {
  snapshot = { ...snapshot }
  listeners.forEach((fn) => fn())
}

export function useStore() {
  return useSyncExternalStore(subscribe, getState)
}

/* ---------- 手机号账号（演示版：账号仅保存在本浏览器，不需要短信验证码） ---------- */

export function isValidPhone(phone) {
  return /^1\d{10}$/.test(String(phone || "").trim())
}
export function maskPhone(phone) {
  const p = String(phone || "")
  return p.length === 11 ? `${p.slice(0, 3)}****${p.slice(-4)}` : p
}

// 演示版只做不可逆混淆，避免明文存储；这不是加密，请勿使用重要密码
function hashPassword(pw) {
  let h = 5381
  const s = `sg|${String(pw ?? "")}`
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `h${(h >>> 0).toString(36)}`
}

function readAccounts() {
  try {
    const list = JSON.parse(localStorage.getItem(LS_ACCOUNTS) || "[]")
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeAccounts(list) {
  try {
    localStorage.setItem(LS_ACCOUNTS, JSON.stringify(list))
  } catch {
    /* 隐私模式下写入失败，忽略 */
  }
}

function setUser(user) {
  snapshot = { ...snapshot, user }
  try {
    localStorage.setItem(LS_USER, JSON.stringify(user))
  } catch {
    /* 忽略 */
  }
  emit()
}

export function registerAccount(phone, password) {
  const tel = String(phone || "").trim()
  if (!isValidPhone(tel)) return { ok: false, error: "请输入 11 位手机号（以 1 开头）" }
  if (String(password || "").length < 6) return { ok: false, error: "密码至少 6 位" }
  const list = readAccounts()
  if (list.some((a) => a.phone === tel)) return { ok: false, error: "该手机号已注册，请直接登录" }
  const user = { phone: tel, name: `用户 ${tel.slice(-4)}`, since: Date.now() }
  writeAccounts([...list, { ...user, pass: hashPassword(password) }])
  setUser(user)
  return { ok: true, user }
}

export function loginWithPassword(phone, password) {
  const tel = String(phone || "").trim()
  if (!isValidPhone(tel)) return { ok: false, error: "请输入 11 位手机号（以 1 开头）" }
  const hit = readAccounts().find((a) => a.phone === tel)
  if (!hit) return { ok: false, error: "该手机号尚未注册，请先注册" }
  if (hit.pass !== hashPassword(password)) return { ok: false, error: "手机号或密码不正确" }
  setUser({ phone: hit.phone, name: hit.name || `用户 ${hit.phone.slice(-4)}`, since: Date.now() })
  return { ok: true }
}

export function loginDemo(phone) {
  const tel = isValidPhone(phone) ? String(phone).trim() : "13800000000"
  setUser({ phone: tel, name: `用户 ${tel.slice(-4)}`, since: Date.now(), demo: true })
}

export function logout() {
  snapshot = { ...snapshot, user: null }
  localStorage.removeItem(LS_USER)
  emit()
}

export function notify(text, type = "ok", duration = 3000) {
  const id = `t${Date.now()}${Math.random().toString(36).slice(2, 7)}`
  snapshot = { ...snapshot, toasts: [...snapshot.toasts, { id, text, type }] }
  emit()
  setTimeout(() => dismissToast(id), duration)
}

export function dismissToast(id) {
  snapshot = { ...snapshot, toasts: snapshot.toasts.filter((t) => t.id !== id) }
  emit()
}

export function saveSessionOutline(outline, meta) {
  snapshot = { ...snapshot, sessionOutline: outline, sessionMeta: meta, sessionDoc: null }
  emit()
}

export function saveSessionDoc(doc) {
  snapshot = { ...snapshot, sessionDoc: doc }
  emit()
}

export function clearSession() {
  snapshot = {
    ...snapshot,
    sessionDoc: null,
    sessionOutline: null,
    sessionMeta: null,
  }
  emit()
}

export function addRecord(rec) {
  const next = [rec, ...snapshot.records]
  snapshot = { ...snapshot, records: next }
  localStorage.setItem(LS_RECORDS, JSON.stringify(next))
  emit()
}

export function removeRecord(id) {
  const next = snapshot.records.filter((r) => r.id !== id)
  snapshot = { ...snapshot, records: next }
  localStorage.setItem(LS_RECORDS, JSON.stringify(next))
  emit()
  notify("已删除该写作记录", "info")
}

export function formatTime(iso) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "刚刚"
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  return d.toLocaleDateString("zh-CN")
}
