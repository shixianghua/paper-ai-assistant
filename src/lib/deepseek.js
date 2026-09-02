const LS_KEY = "sg.ds.key"
const LS_MODEL = "sg.ds.model"
const LS_TEMPERATURE = "sg.ds.temp"

export function getDsKey() {
  try {
    return localStorage.getItem(LS_KEY) || ""
  } catch {
    return ""
  }
}

export function getDsModel() {
  try {
    return localStorage.getItem(LS_MODEL) || "deepseek-v4-flash"
  } catch {
    return "deepseek-v4-flash"
  }
}

export function getDsTemperature() {
  try {
    return Number(localStorage.getItem(LS_TEMPERATURE)) || 0.5
  } catch {
    return 0.5
  }
}

export function saveDsConfig({ key, model, temperature }) {
  localStorage.setItem(LS_KEY, (key || "").trim())
  localStorage.setItem(LS_MODEL, model || "deepseek-v4-flash")
  localStorage.setItem(LS_TEMPERATURE, String(temperature || 0.5))
}

export function hasDsKey() {
  return Boolean(getDsKey())
}

export async function callDeepSeek({ system, user, maxTokens = 4096, temperature, json = false }) {
  const key = getDsKey()
  if (!key) throw new Error("未配置 DeepSeek API Key")
  const model = getDsModel()
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
    temperature: temperature === undefined ? getDsTemperature() : temperature,
    stream: false,
  }
  if (json) body.response_format = { type: "json_object" }
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.message || `DeepSeek 请求失败（HTTP ${res.status}）`
    throw new Error(msg)
  }
  const content = data?.choices?.[0]?.message?.content || ""
  if (!content) throw new Error("DeepSeek 未返回内容，请重试（可能推理被截断）")
  return content
}
