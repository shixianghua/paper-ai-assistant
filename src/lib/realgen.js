import { callDeepSeek } from "./deepseek"
import { figFlow } from "./charts"
import { fetchRealRefs } from "./reflib"

let seq = 0
const nid = (p) => `${p}-${Date.now().toString(36)}-${seq++}`

const PROF = `你是一位资深高校学术论文指导教授，精通中文学位论文规范（GB/T 7714、章-节结构、学术语体）。你输出真实、具体、可核查的内容：严禁编造任何统计数字、样本数据或事实；没有真实数据支撑时，在相应位置输出“［待填入真实数据：……］”并说明应采集的指标与来源；杜绝空洞套话与重复句式；全文图注、表注与文字一律使用中文。`

function stripJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start < 0 || end <= start) throw new Error("模型输出不是有效 JSON")
  return JSON.parse(raw.slice(start, end + 1))
}

export async function realOutline({ typeKey: _typeKey, typeLabel, topic, edu, lang, words, level: _level }, { onLog } = {}) {
  onLog?.({ text: "正在调用 DeepSeek V4 Flash 解析选题并设计论文框架…", kind: "run" })
  const system = `${PROF}\n只输出 JSON，不要 Markdown。结构：{"chapters":[{"title":"第一章 绪论","children":["1.1 研究背景与问题提出","1.2 研究目的与意义","1.3 国内外研究现状","1.4 研究内容与方法","1.5 论文组织结构"]},...]}。论文类型为${typeLabel}，全文目标 ${words} 字，必须包含绪论、理论/概念基础、研究设计或系统设计、结果与分析、结论与建议等标准章，每章 2-5 个“x.y”节；章节标题紧密围绕“${topic}”，不得泛泛而谈。`
  const user = `请为“${topic}”（${edu} · ${lang}）设计一份符合学位论文规范的章节大纲 JSON。`
  const data = stripJson(await callDeepSeek({ system, user, maxTokens: 2600, temperature: 0.5 }))
  const chapters = Array.isArray(data.chapters) ? data.chapters : []
  if (!chapters.length) throw new Error("大纲为空，请重试")
  const items = []
  chapters.forEach((ch, ci) => {
    const pid = nid("c")
    items.push({ id: pid, level: 1, title: ch.title, role: "chapter", domain: "llm" })
    const kids = Array.isArray(ch.children) ? ch.children : []
    kids.forEach((t, si) => items.push({ id: nid("c"), level: 2, title: String(t).trim(), parent: pid, no: `${ci + 1}.${si + 1}` }))
  })
  items.push({ id: nid("c"), level: 1, title: "参考文献", special: "refs" })
  items.push({ id: nid("c"), level: 1, title: "致谢", special: "ack" })
  onLog?.({ text: `DeepSeek 已完成选题分析并生成 ${items.length} 个大纲节点`, kind: "done" })
  return items
}

function parseBlocks(md) {
  const blocks = []
  const lines = String(md || "").split("\n").map((s) => s.trimEnd())
  let para = []
  let table = null
  const flushPara = () => {
    if (para.length) {
      const text = para.join("").trim()
      if (text) blocks.push({ kind: "p", text })
      para = []
    }
  }
  const flushTable = () => {
    if (table && table.rows.length) {
      blocks.push({ kind: "table", table, demo: false })
    }
    table = null
  }
  lines.forEach((line) => {
    const t = line.trim()
    if (!t) {
      flushPara()
      flushTable()
      return
    }
    const head = t.match(/^(#{2,4})\s+(.*)/)
    if (head) {
      flushPara()
      flushTable()
      blocks.push({ kind: "h4", text: head[2].trim() })
      return
    }
    if (t.startsWith("|")) {
      flushPara()
      const cells = t.replace(/^\||\|$/g, "").split("|").map((c) => c.trim())
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return
      if (!table) {
        table = { title: null, headers: cells, rows: [] }
      } else if (!table.headers.length) {
        table.headers = cells
      } else {
        table.rows.push(cells)
      }
      return
    }
    flushTable()
    para.push(t.replace(/^[-•]\s+/, "· "))
  })
  flushPara()
  flushTable()
  return blocks
}

function injectFlow(blocks, children) {
  if (blocks.some((b) => b.kind === "figure")) return
  const steps = (children || []).map((c) => String(c).replace(/^\d+\.\d+\s*/, "")).slice(0, 5)
  if (steps.length >= 2) {
    blocks.push({ kind: "figure", figure: figFlow({ title: "本章内容与研究路径示意图（AI 自动生成）", steps }) })
  }
}

export async function realFullDoc(
  { outline, topic, typeLabel, edu, lang, words, refCount },
  { onLog, onProgress, onChunk } = {},
) {
  const chapters = outline.filter((n) => n.level === 1 && !n.special)
  const doc = { title: topic, metaLine: "", abstract: "", keywords: [], toc: [], sections: [], refs: [], refsNote: "", ack: "" }
  doc.metaLine = `${typeLabel} · ${edu} · ${lang} · 目标 ${words} 字 · DeepSeek V4 Flash 真实生成`

  onLog?.({ text: "DeepSeek V4 Flash 正在撰写摘要与关键词…", kind: "run" })
  onProgress?.(5)
  const abs = stripJson(
    await callDeepSeek({
      system: `${PROF}\n只输出 JSON：{"abstract":"正文，不少于380字，须包含研究目的、方法、结果、结论","keywords":["关键词1","关键词2","关键词3"]}。关键词从中提炼，禁用泛词。`,
      user: `论文题目：${topic}（${typeLabel}，${edu}，${lang}）\n章节：${chapters.map((c) => c.title).join("；")}`,
      maxTokens: 2600,
      temperature: 0.4,
    }),
  )
  doc.abstract = abs.abstract || ""
  doc.keywords = Array.isArray(abs.keywords) ? abs.keywords.slice(0, 6) : []
  onLog?.({ text: "摘要与关键词生成完成", kind: "done" })
  onProgress?.(12)

  onLog?.({ text: "正在通过 Crossref/DOI 检索真实文献…", kind: "run" })
  let realRefs = []
  try {
    realRefs = await fetchRealRefs(topic, refCount)
  } catch {
    realRefs = []
  }
  if (realRefs.length) {
    doc.refs = realRefs.map((r) => r.text)
    doc.refsNote =
      "以下文献来自 Crossref 实时检索（含 DOI，可在线核验）。如需知网可检索文献，请将知网导出的 GB/T 7714 条目粘贴进“投喂/资料”区，系统将原样采用。"
  } else {
    try {
      const refData = stripJson(
        await callDeepSeek({
          system: `${PROF}\n只输出 JSON：{"references":[{"text":"GB/T 7714 条目"}]}。仅输出你确信可检索到的经典或代表性文献；无法确认时宁缺毋滥，最多 ${refCount} 条；不要编造。`,
          user: `论文题目：${topic}；主题：${chapters.map((c) => c.title).join("；")}`,
          maxTokens: 2400,
          temperature: 0.2,
        }),
      )
      doc.refs = (refData.references || []).map((r) => r.text).filter(Boolean).slice(0, Number(refCount) || 12)
    } catch {
      doc.refs = []
    }
    doc.refsNote = "实时检索暂不可用，以下为模型建议条目，提交前请务必逐条核验。"
  }
  onLog?.({ text: `参考文献整理完成（${doc.refs.length} 条，${realRefs.length ? "Crossref 实时检索" : "模型建议需核验"}）`, kind: "done" })
  onProgress?.(18)

  const totalChars = typeof words === "string" && words.includes("万")
    ? Number.parseFloat(words) * 10000
    : Number(words) || 8000
  let remainingChars = Math.max(2000, totalChars - (doc.abstract || "").replace(/\s/g, "").length)
  const base = 74 / chapters.length
  let acc = 20
  let ci = 0
  for (const chapter of chapters) {
    ci += 1
    const kids = outline.filter((n) => n.level === 2 && n.parent === chapter.id)
    const allocated = Math.max(400, Math.floor(remainingChars / (chapters.length - ci + 1)))
    onLog?.({ text: `DeepSeek 正在撰写 ${ci}/${chapters.length} · ${chapter.title}`, kind: "run" })
    onProgress?.(acc)
    let md = ""
    let lastErr = ""
    for (let attempt = 1; attempt <= 2 && !md; attempt += 1) {
      try {
        md = await callDeepSeek({
          system: `${PROF}\n请撰写该章正文：结构按“本章任务→分节论证→本章小结”；表格用 Markdown 且必须给出真实数据出处或标注占位；引用标注 [n]；图注表注使用中文；禁止空话与重复句式。只输出 Markdown 正文。`,
          user: `论文题目：${topic}（${typeLabel}，全文目标 ${totalChars} 字）\n当前章节：${chapter.title}（第 ${ci}/${chapters.length} 章）\n本节清单：${kids.map((k) => k.title).join("、")}\n本章目标字数：约 ${allocated} 字（全文剩余 ${remainingChars} 字），请严格控制篇幅，宁短勿滥。\n请撰写本章。`,
          maxTokens: Math.min(16384, allocated * 2 + 3000),
          temperature: 0.6,
        })
      } catch (e) {
        lastErr = e.message
        if (attempt === 1) {
          onLog?.({ text: `${chapter.title} 首次请求失败，正在自动重试…`, kind: "run" })
          await new Promise((r) => setTimeout(r, 1200))
        }
      }
    }
    const blocks = md
      ? parseBlocks(md)
      : [{ kind: "p", text: `本章（${chapter.title}）自动生成暂时失败：${lastErr}。请使用右侧“无限改稿”单独重试，或稍后重新生成。` }]
    if (md) {
      const used = md.replace(/\s/g, "").length
      remainingChars = Math.max(0, remainingChars - used)
    }
    injectFlow(blocks, kids)
    doc.sections.push({ id: chapter.id, title: chapter.title, level: 1, blocks })
    doc.toc.push({ id: chapter.id, title: chapter.title })
    onLog?.({ text: `${chapter.title} · 完成`, kind: "done" })
    onChunk?.(JSON.parse(JSON.stringify(doc)))
    acc += base
  }

  onProgress?.(96)
  onLog?.({ text: "正在撰写致谢并统一格式…", kind: "run" })
  try {
    doc.ack = (await callDeepSeek({
      system: `${PROF} 只输出300字以内的致谢正文。`,
      user: `论文题目：${topic}`,
      maxTokens: 900,
      temperature: 0.4,
    })).trim()
  } catch {
    doc.ack = "感谢指导教师与参与本研究的所有人员。"
  }
  onLog?.({ text: "DeepSeek V4 Flash 全文生成完成", kind: "done" })
  onProgress?.(100)
  return doc
}

export function llmWordCount(doc) {
  const n = (s) => (s || "").replace(/\s/g, "").length
  return (
    doc.sections.reduce((sum, s) => sum + (s.blocks || []).filter((b) => b.text).reduce((a, b) => a + n(b.text), 0), 0) +
    n(doc.abstract) +
    n(doc.ack)
  )
}
