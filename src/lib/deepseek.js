// 升格智能论文系统 · DeepSeek 接入客户端
//
// 接口实测（2026-09 校验）：
//   GET /models  → deepseek-flash、deepseek-v4-pro
//   deepseek-v4-flash 为官方别名，指向当前最新的 V4 Flash 版本；
//   “deepseek-v4.1-flash / v4.1-flash”等写法会被接口以 HTTP 400 拒绝，
//   这里统一做名称归一化，避免因名称写法导致生成失败。
//
// 重要：V4 Flash 是思考型（reasoning）模型，思考过程与正文共用 max_tokens 额度。
// 不限制思考强度时，长文会出现“正文为空 / 中途截断 / 连点多次才成功”。
// 因此默认 reasoning_effort=none，把额度全部留给正文；需要深挖论证时可在设置里开启。

export const DEFAULT_BASE = "https://api.deepseek.com"

function joinUrl(base, path) {
  return `${String(base || DEFAULT_BASE).replace(/\/+$/, "")}${path}`
}

function chatEndpoint() {
  return joinUrl(getDsBase(), "/chat/completions")
}

function modelsEndpoint() {
  return joinUrl(getDsBase(), "/models")
}
const REQUEST_TIMEOUT = 300000

const LS_KEY = "sg.ds.key"
const LS_MODEL = "sg.ds.model"
const LS_TEMPERATURE = "sg.ds.temp"
const LS_EFFORT = "sg.ds.effort"
const LS_BASE = "sg.ds.base"

// 接口地址规范化：允许用户填写自建/代理网关，只填到域名或 /v1 均可
export function normalizeBase(url) {
  const raw = String(url || "").trim().replace(/\s+/g, "")
  if (!raw) return DEFAULT_BASE
  let v = raw
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`
  v = v.replace(/\/+$/, "")
  v = v.replace(/\/chat\/completions$/i, "").replace(/\/models$/i, "")
  return v
}

export function getDsBase() {
  try {
    return normalizeBase(localStorage.getItem(LS_BASE) || DEFAULT_BASE)
  } catch {
    return DEFAULT_BASE
  }
}

export const DEFAULT_MODEL = "deepseek-v4-flash"
export const DEFAULT_EFFORT = "none"
export const MAX_OUTPUT_TOKENS = 32000

export const MODEL_OPTIONS = [
  {
    value: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash（默认 · 推荐）",
    desc: "最新的 V4 Flash 版本，响应快，适合大纲与全文逐章成文",
  },
  {
    value: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro（更强 · 较慢）",
    desc: "推理与论证更深入，适合终稿精修与深度改稿",
  },
  {
    value: "deepseek-v4-flash-vision-exp",
    label: "DeepSeek V4 Flash Vision（实验）",
    desc: "支持图像理解，用于图表与扫描件信息提取",
  },
]

export const EFFORT_OPTIONS = [
  { value: "none", label: "关闭思考（默认 · 最稳）", desc: "额度全部用于成文，避免正文为空或中途截断" },
  { value: "low", label: "轻度思考", desc: "少量推演，适合大纲与提纲设计" },
  { value: "medium", label: "标准思考", desc: "推理更均衡，耗时与额度占用同步增加" },
  { value: "high", label: "深度思考（较慢）", desc: "多轮推演，适合理论论证与改稿建议" },
  { value: "max", label: "最大思考（最慢）", desc: "推理最充分，耗时明显增加" },
]

const MODEL_ALIASES = {
  "deepseek-flash": DEFAULT_MODEL,
  "deepseek-v4-flash": DEFAULT_MODEL,
  "deepseek-v4.1-flash": DEFAULT_MODEL,
  "deepseek-v4-1-flash": DEFAULT_MODEL,
  "deepseek-v41-flash": DEFAULT_MODEL,
  "deepseek-v4.1": DEFAULT_MODEL,
  "deepseek-v41": DEFAULT_MODEL,
  "v4.1-flash": DEFAULT_MODEL,
  "v4.1": DEFAULT_MODEL,
  "deepseek-flash-latest": DEFAULT_MODEL,
  "deepseek-v4-pro": "deepseek-v4-pro",
  "deepseek-pro": "deepseek-v4-pro",
  "deepseek-reasoner": "deepseek-v4-pro",
  "deepseek-v4-flash-vision-exp": "deepseek-v4-flash-vision-exp",
  "deepseek-vision": "deepseek-v4-flash-vision-exp",
}

const EFFORT_ALLOWANCE = { none: 0, minimal: 900, low: 1400, medium: 2800, high: 5000, xhigh: 6500, max: 9000 }
const VALID_EFFORT = new Set(Object.keys(EFFORT_ALLOWANCE))

export function normalizeModel(name) {
  const raw = String(name || "").trim().toLowerCase()
  if (!raw) return DEFAULT_MODEL
  if (MODEL_ALIASES[raw]) return MODEL_ALIASES[raw]
  if (raw.includes("vision")) return "deepseek-v4-flash-vision-exp"
  if (raw.includes("pro") || raw.includes("reasoner")) return "deepseek-v4-pro"
  return DEFAULT_MODEL
}

export function normalizeEffort(name) {
  const raw = String(name || "").trim().toLowerCase()
  return VALID_EFFORT.has(raw) ? raw : DEFAULT_EFFORT
}

export function modelLabel(name) {
  const v = normalizeModel(name)
  const hit = MODEL_OPTIONS.find((m) => m.value === v)
  return hit ? hit.label.replace(/（.*?）/, "") : v
}

export function effortLabel(name) {
  const v = normalizeEffort(name)
  const hit = EFFORT_OPTIONS.find((m) => m.value === v)
  return hit ? hit.label.replace(/（.*?）/, "") : v
}

export function getDsKey() {
  try {
    return (localStorage.getItem(LS_KEY) || "").trim()
  } catch {
    return ""
  }
}

export function getDsModel() {
  try {
    return normalizeModel(localStorage.getItem(LS_MODEL) || DEFAULT_MODEL)
  } catch {
    return DEFAULT_MODEL
  }
}

export function getDsEffort() {
  try {
    return normalizeEffort(localStorage.getItem(LS_EFFORT) || DEFAULT_EFFORT)
  } catch {
    return DEFAULT_EFFORT
  }
}

export function getDsTemperature() {
  try {
    const v = Number(localStorage.getItem(LS_TEMPERATURE))
    return Number.isFinite(v) && v > 0 ? v : 0.5
  } catch {
    return 0.5
  }
}

export function saveDsConfig({ key, model, temperature, effort, base } = {}) {
  try {
    if (key !== undefined) localStorage.setItem(LS_KEY, String(key || "").trim())
    if (model !== undefined) localStorage.setItem(LS_MODEL, normalizeModel(model))
    if (temperature !== undefined) localStorage.setItem(LS_TEMPERATURE, String(temperature))
    if (effort !== undefined) localStorage.setItem(LS_EFFORT, normalizeEffort(effort))
    if (base !== undefined) localStorage.setItem(LS_BASE, normalizeBase(base))
    return true
  } catch {
    return false
  }
}

export function hasDsKey() {
  return Boolean(getDsKey())
}

// 支持用带参数的网址一键配置 Key（例如 #/?key=sk-xxx），
// Key 只写入本机浏览器，导入后立即从地址栏抹去，不进入仓库、不进入分享链接内容。
export function importKeyFromUrl() {
  try {
    const hash = window.location.hash || ""
    const qIndex = hash.indexOf("?")
    if (qIndex < 0) return false
    const params = new URLSearchParams(hash.slice(qIndex + 1))
    const incoming = (params.get("key") || params.get("dsKey") || "").trim()
    if (!incoming) return false
    localStorage.setItem(LS_KEY, incoming)
    params.delete("key")
    params.delete("dsKey")
    const rest = params.toString()
    const next = hash.slice(0, qIndex) + (rest ? `?${rest}` : "")
    window.history.replaceState(null, "", window.location.pathname + window.location.search + next)
    return true
  } catch {
    return false
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function clampTokens(n) {
  return Math.max(256, Math.min(MAX_OUTPUT_TOKENS, Math.round(n)))
}

function friendlyError(err, model) {
  const status = err?.status
  const raw = String(err?.rawMessage || err?.message || "")
  if (status === 401) return new Error("API Key 无效或已失效，请在「接入设置」中重新填写")
  if (status === 402 || status === 403) return new Error("DeepSeek 账户余额不足或该模型未开通，请检查账户")
  if (status === 429) return new Error("DeepSeek 请求过于频繁（限流），请稍候重试")
  if (status >= 500) return new Error(`DeepSeek 服务暂时不可用（HTTP ${status}），请稍后重试`)
  if (status === 400 && /model/i.test(raw)) {
    return new Error(`模型名称“${model}”不被接口支持，可用模型：${MODEL_OPTIONS.map((m) => m.value).join("、")}`)
  }
  if (status === 400) return new Error(`请求被接口拒绝：${raw || "参数不合法"}`)
  if (/Failed to fetch|NetworkError|network|abort/i.test(raw)) {
    return new Error("网络连接中断或响应超时，请检查网络后重试")
  }
  return new Error(raw || `DeepSeek 请求失败（HTTP ${status || "未知"}）`)
}

async function rawCall({ key, model, messages, maxTokens, temperature, json, effort }) {
  const body = {
    model,
    messages,
    max_tokens: clampTokens(maxTokens),
    temperature,
    stream: false,
    reasoning_effort: normalizeEffort(effort),
  }
  if (json) body.response_format = { type: "json_object" }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT)
  let res
  try {
    res = await fetch(chatEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    const err = new Error("网络连接中断或响应超时，请检查网络后重试")
    err.rawMessage = e?.message || ""
    throw err
  }
  clearTimeout(timer)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data?.error?.message || `DeepSeek 请求失败（HTTP ${res.status}）`)
    err.status = res.status
    err.rawMessage = data?.error?.message || ""
    throw err
  }
  return data
}

export async function listModels() {
  const key = getDsKey()
  if (!key) return []
  try {
    const res = await fetch(modelsEndpoint(), { headers: { Authorization: `Bearer ${key}` } })
    const data = await res.json().catch(() => ({}))
    return (data?.data || []).map((m) => m.id).filter(Boolean)
  } catch {
    return []
  }
}

export async function testDsConnection(model) {
  const key = getDsKey()
  if (!key) return { ok: false, message: "请先填写并保存 API Key" }
  const useModel = normalizeModel(model || getDsModel())
  const t0 = Date.now()
  try {
    const data = await rawCall({
      key,
      model: useModel,
      messages: [{ role: "user", content: "只回复两个字：正常" }],
      maxTokens: 32,
      temperature: 0.1,
      json: false,
      effort: "none",
    })
    return {
      ok: true,
      model: data?.model || useModel,
      ms: Date.now() - t0,
      sample: String(data?.choices?.[0]?.message?.content || "").trim(),
    }
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, message: friendlyError(e, useModel).message }
  }
}

// 统一入口：
// 1) 模型名归一化与不支持时自动回退
// 2) 思考占满额度导致正文为空时自动关闭思考重试
// 3) 限流与 5xx 自动退避重试
// 4) 正文被 max_tokens 截断时自动续写，避免“生成到一半就停下”
export async function callDeepSeek({
  system,
  user,
  maxTokens = 4096,
  temperature,
  json = false,
  effort,
  model,
  maxContinuations = 2,
} = {}) {
  const key = getDsKey()
  if (!key) throw new Error("未配置 DeepSeek API Key")

  const temp = temperature === undefined ? getDsTemperature() : temperature
  const messages = []
  if (system) messages.push({ role: "system", content: system })
  messages.push({ role: "user", content: user })

  let useModel = normalizeModel(model || getDsModel())
  let useEffort = normalizeEffort(effort === undefined ? getDsEffort() : effort)
  let budget = clampTokens(maxTokens + EFFORT_ALLOWANCE[useEffort])
  let text = ""
  let partial = ""
  let continuations = 0
  let retriedWithoutThinking = false

  for (let round = 1; round <= 6; round += 1) {
    let data
    try {
      data = await rawCall({ key, model: useModel, messages, maxTokens: budget, temperature: temp, json: json && !continuations, effort: useEffort })
    } catch (e) {
      const status = e?.status
      if (status === 400 && /model/i.test(String(e.rawMessage || "")) && useModel !== DEFAULT_MODEL) {
        useModel = DEFAULT_MODEL
        continue
      }
      if ((status === 429 || status >= 500) && round < 4) {
        await sleep(2000 * round)
        continue
      }
      throw friendlyError(e, useModel)
    }

    const choice = data?.choices?.[0] || {}
    const msg = choice.message || {}
    const content = String(msg.content || "").trim()
    const reasoning = String(msg.reasoning_content || "").trim()
    const finish = choice.finish_reason

    if (!content && reasoning && useEffort !== "none" && !retriedWithoutThinking) {
      retriedWithoutThinking = true
      useEffort = "none"
      budget = clampTokens(budget + 2000)
      continue
    }

    if (!content) {
      if (finish === "length" && round < 5) {
        budget = clampTokens(budget * 1.8 + 1200)
        continue
      }
      if (round < 4) {
        await sleep(1200 * round)
        continue
      }
      throw new Error(
        finish === "length"
          ? "模型额度耗尽仍未返回正文，请降低目标字数或把「思考强度」设为关闭后重试"
          : "DeepSeek 未返回正文，请稍后重试",
      )
    }

    text += content

    if (finish === "length" && continuations < maxContinuations) {
      continuations += 1
      partial = text.slice(-1200)
      messages.push({ role: "assistant", content: content })
      messages.push({
        role: "user",
        content: "上一条回答在结尾处被截断。请直接从断点继续往下写，保持同一文体与术语，不要重复已写内容，不要重新开头，不要添加任何说明性文字。",
      })
      budget = clampTokens(Math.min(budget, 8000))
      continue
    }
    break
  }

  if (!text.trim()) throw new Error("DeepSeek 未返回正文，请稍后重试")
  void partial
  return text.trim()
}
