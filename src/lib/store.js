import { useSyncExternalStore } from "react"

const LS_USER = "sg.user"
const LS_RECORDS = "sg.records"

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

export function loginDemo(phone) {
  snapshot = {
    ...snapshot,
    user: { phone, name: phone ? `用户 ${phone.slice(-4)}` : "演示用户", since: Date.now() },
  }
  localStorage.setItem(LS_USER, JSON.stringify(snapshot.user))
  emit()
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
