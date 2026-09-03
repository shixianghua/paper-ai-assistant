import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileDown,
  FileText,
  FolderArchive,
  LayoutTemplate,
  Loader2,
  LogIn,
  MonitorPlay,
  Pencil,
  Plus,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react"
import JSZip from "jszip"
import {
  DOC_TYPES,
  EDU_LEVELS,
  LANGS,
  MODELS,
  REF_OPTIONS,
  WORD_OPTIONS,
} from "../data/catalog"
import { docWordCount, uid } from "../lib/generator"
import { smartFullDoc, smartOutline } from "../lib/engine"
import { getDsKey, getDsModel, saveDsConfig } from "../lib/deepseek"
import {
  addRecord,
  clearSession,
  notify,
  saveSessionDoc,
  saveSessionOutline,
  useStore,
} from "../lib/store"
import { LoginModal, LogoMark } from "../components/Chrome"

const RESET = {
  typeKey: "graduate",
  topic: "",
  edu: "本科",
  words: "2万",
  lang: "中文",
  model: "pro",
  level: "三级大纲",
  refCount: "15",
}

const REPLACE_MAP = [
  ["综上所述", "基于上述分析"],
  ["值得注意的是", "值得关注的是"],
  ["需要强调的是", "应当指出的是"],
  ["本文认为", "本研究认为"],
  ["相关研究", "既有文献"],
  ["实践样态", "现实形态"],
  ["核心问题", "关键议题"],
  ["机制分析", "作用机理分析"],
]

function applyRewrite(paras, passes = 2) {
  return paras.map((p) => {
    let out = p
    for (let i = 0; i < passes; i += 1) {
      REPLACE_MAP.forEach(([a, b]) => {
        out = out.split(a).join(b)
      })
    }
    return out
  })
}

function docFullText(doc) {
  const secText = (s) =>
    [s.title, ...(s.blocks || []).filter((b) => b.text).map((b) => b.text)].join("\n")
  return [
    doc.title,
    doc.metaLine,
    "",
    "摘要",
    doc.abstract,
    `关键词：${(doc.keywords || []).join("；")}`,
    ...doc.sections.map(secText),
    "参考文献",
    ...doc.refs.map((r, i) => `[${i + 1}] ${r}`),
    doc.ack,
  ].join("\n")
}

async function svgToPng(svgEl) {
  try {
    const xml = new XMLSerializer().serializeToString(svgEl)
    const svg64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
      img.src = svg64
    })
    const canvas = document.createElement("canvas")
    const scale = 2
    canvas.width = svgEl.viewBox?.baseVal?.width * scale || 1240
    canvas.height = svgEl.viewBox?.baseVal?.height * scale || 600
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

function svgDataImage(svg) {
  const xml = new XMLSerializer().serializeToString(svg)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
}

async function replaceAsync(str, re, fn) {
  const matches = []
  str.replace(re, (...args) => {
    matches.push(args)
    return args[0]
  })
  const replaced = await Promise.all(matches.map((m) => fn(m[0], m[1])))
  return str.replace(re, () => replaced.shift())
}

async function buildPaperHtml(doc) {
  let chartNo = 0
  const renderBlocks = (blocks) =>
    (blocks || [])
      .map((b) => {
        if (b.kind === "h4") return `<h3>${b.text}</h3>`
        if (b.kind === "p") return `<p>${b.text}</p>`
        if (b.kind === "figure" && b.figure) {
          const no = chartNo
          chartNo += 1
          return `<p class="tbl-title">图：${b.figure.title}</p><img class="chart" src="__CHART__${no}__" alt="${b.figure.title}"/>`
        }
        if (b.kind === "table" && b.table) {
          const t = b.table
          return `<p class="tbl-title">表：${t.title}</p><table border="1" cellspacing="0" cellpadding="5"><thead><tr>${t.headers
            .map((h) => `<th>${h}</th>`)
            .join("")}</tr></thead><tbody>${t.rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        }
        return ""
      })
      .join("")

  const body = `
    <div class="cover">
      <p class="cover-school">本科毕业论文（设计）</p>
      <h1 class="cover-title">${doc.title}</h1>
      <p class="cover-meta">${doc.metaLine.replace("· 演示版按规范结构输出精简篇幅", "")}</p>
    </div>
    <div style="page-break-before:always"></div>
    <h2 class="decl">原创性声明</h2>
    <p class="decl-text">本人郑重声明：所呈交的论文是本人在指导教师指导下独立完成的研究成果。除文中已经注明引用的内容外，本论文不包含任何其他个人或集体已经发表或撰写过的研究成果。演示版由系统自动生成，仅供格式与功能演示。</p>
    <h2>摘 要</h2>
    <p>${doc.abstract}</p>
    <p class="kw">关键词：${(doc.keywords || []).join("；")}</p>
    <h2>目 录</h2>
    ${doc.sections.map((s) => `<p class="toc">${s.title}</p>`).join("")}
    <div style="page-break-before:always"></div>
    ${doc.sections
      .map(
        (s) =>
          `<h2 class="chapter">${s.title}</h2>` +
          renderBlocks(s.blocks) +
          `<div style="page-break-before:always"></div>`,
      )
      .join("")}
    <h2>参考文献</h2>
    <ol class="refs">${doc.refs.map((r) => `<li>${r}</li>`).join("")}</ol>
    <p class="note">${doc.refsNote}</p>
    <h2>致 谢</h2><p>${doc.ack}</p>`
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>
    body{font-family:"Times New Roman","SimSun",serif;line-height:1.9;color:#111;font-size:14px}
    h1{text-align:center;font-size:22px} h2{font-size:18px;margin:18px 0 10px}
    h3{font-size:15px;margin:14px 0 6px} h4{font-size:14px;margin:12px 0 4px}
    p{text-align:justify;text-indent:2em;margin:0 0 6px}
    .cover{text-align:center;padding-top:80px}
    .cover-school{font-size:22px;letter-spacing:4px}
    .cover-title{font-size:26px;margin-top:60px;text-indent:0}
    .cover-meta,.tbl-title,.note,.kw,.toc,.decl{text-indent:0}
    .kw{font-weight:bold} .note{color:#666;font-size:12px}
    .decl-text{text-indent:2em}
    table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:13px}
    th,td{border:1px solid #333;padding:4px 8px;text-align:center}
    .chart{width:100%;max-width:560px;height:auto;margin:6px 0 12px}
    .chapter{page-break-before:always}
    @page{size:A4;margin:2.54cm 3.17cm}
  </style></head><body>${body}</body></html>`

  const svgs = [...document.querySelectorAll(".paper figure svg")]
  const finalHtml = await replaceAsync(html, /__CHART__(\d+)__/g, async (m, no) => {
    const svg = svgs[Number(no)]
    if (!svg) return ""
    const png = await svgToPng(svg)
    return `<img class="chart" src="${png || svgDataImage(svg)}" alt="图表"/>`
  })
  return finalHtml
}

async function exportWord(doc) {
  const html = await buildPaperHtml(doc)
  const blob = new Blob(["\ufeff", html], { type: "application/msword" })
  downloadBlob(blob, `${doc.title.replace(/[\\/:*?"<>|]/g, "_")}.doc`)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function auxHtml(body) {
  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>
    body{font-family:"Times New Roman","SimSun",serif;font-size:13px;line-height:1.9;color:#111}
    h1{text-align:center;font-size:20px;letter-spacing:2px}
    h2{font-size:16px;margin:16px 0 8px;border-bottom:1px solid #999;padding-bottom:3px}
    p{text-align:justify;text-indent:2em;margin:0 0 5px}
    table{width:100%;border-collapse:collapse;margin:6px 0 10px;font-size:12.5px}
    th,td{border:1px solid #333;padding:5px 8px;vertical-align:top}
    th{background:#f2f3f7;font-weight:bold;white-space:nowrap}
    .fill{color:#666}
    @page{size:A4;margin:2.2cm 2.4cm}
  </style></head><body>${body}</body></html>`
}

function auxHeader(rows) {
  return `<table><tbody>${rows
    .map((r) => `<tr><th style="width:96px">${r[0]}</th><td>${r[1]}</td><th style="width:96px">${r[2] || ""}</th><td>${r[3] || ""}</td></tr>`)
    .join("")}</tbody></table>`
}

function buildAuxDocs(doc, meta) {
  const typeText = (meta && DOC_TYPES.find((t) => t.key === meta.typeKey)?.label) || "毕业论文"
  const edu = meta?.edu || "本科"
  const words = meta?.words || "8000"
  const base = [
    ["课题名称", doc.title],
    ["成果类型", `${typeText}（${edu}）`],
    ["目标字数", `${words} 字`],
    ["学生 / 学号", '<span class="fill">（填写）</span>'],
    ["专业 / 班级", '<span class="fill">（填写）</span>'],
    ["指导教师", '<span class="fill">（填写）</span>'],
    ["完成日期", '<span class="fill">（填写）</span>'],
  ]

  const proposal = auxHtml(`
    <h1>开 题 报 告</h1>
    ${auxHeader(base)}
    <h2>一、选题背景与研究意义</h2>
    <p>${doc.abstract}</p>
    <h2>二、国内外研究现状</h2>
    <p>通过对国内外文献的梳理可以发现，围绕“${doc.title}”的研究已积累了一定成果，为本课题提供了概念工具与方法借鉴；但已有研究在研究对象代表性、机制解释与可操作化方面仍有拓展空间，本课题即在上述基础上展开。</p>
    <h2>三、研究目标与研究内容</h2>
    <p>总体目标：按照学术规范完成“${doc.title}”的选题论证、方案设计与成果产出。具体内容包括：（1）明确核心概念与分析框架；（2）开展资料收集与现状分析；（3）完成实证或工程验证；（4）形成结论并撰写论文。</p>
    <h2>四、研究方法与技术路线</h2>
    <p>拟综合运用文献研究法、问卷调查法、准实验研究法（或系统设计、测试验证方法），按“问题界定—框架建构—方案实施—结果分析—总结建议”的路线推进，确保过程可记录、结果可检验。</p>
    <h2>五、进度安排</h2>
    <table><tr><th style="width:110px">阶段</th><th>主要任务</th><th style="width:110px">时间</th></tr>
      <tr><td>准备阶段</td><td>文献检索、开题论证、方案确定</td><td>第 1-2 周</td></tr>
      <tr><td>实施阶段</td><td>资料收集、方案实施、过程记录</td><td>第 3-6 周</td></tr>
      <tr><td>写作阶段</td><td>数据分析、论文撰写与修改</td><td>第 7-10 周</td></tr>
      <tr><td>答辩阶段</td><td>定稿、答辩准备</td><td>第 11-12 周</td></tr></table>
    <h2>六、预期成果</h2>
    <p>形成结构完整的论文（含开题报告、任务书、中期检查表等过程材料），产出规范的数据与测试记录，提出经检验的结论与建议。</p>
    <h2>七、指导教师意见</h2>
    <p class="fill">（由指导教师填写并签字）</p>`)

  const task = auxHtml(`
    <h1>毕 业 设 计（论 文）任 务 书</h1>
    ${auxHeader(base)}
    <h2>一、任务来源及背景</h2>
    <p>本课题来源于${edu}${typeText}培养环节的选题要求，结合“${doc.title}”的研究现状与实践需要拟定，具有一定的理论价值与应用背景。</p>
    <h2>二、主要任务与要求</h2>
    <p>1. 完成选题论证与开题报告，明确研究边界；<br/>2. 按大纲完成论文各章写作，做到结构规范、论证充分、图文表格并茂；<br/>3. 规范引用并整理参考文献（GB/T 7714）；<br/>4. 按期提交论文、开题报告、任务书、中期检查表等全套材料并参加答辩。</p>
    <h2>三、论文主要内容</h2>
    <p>${doc.toc.map((t) => t.title).join("；")}。正文应包含摘要、关键词、目录、图表、参考文献与致谢。</p>
    <h2>四、进度安排</h2>
    <table><tr><th style="width:110px">阶段</th><th>任务</th><th style="width:110px">时间</th></tr>
      <tr><td>开题</td><td>提交开题报告</td><td>第 2 周</td></tr>
      <tr><td>中期</td><td>完成初稿大半，提交中期检查表</td><td>第 6 周</td></tr>
      <tr><td>定稿</td><td>完成全文与查改</td><td>第 10 周</td></tr>
      <tr><td>答辩</td><td>提交全套材料并答辩</td><td>第 12 周</td></tr></table>
    <h2>五、成果要求</h2>
    <p>提交任务书、开题报告、中期检查表、论文正文及配套图表资料，内容真实规范，符合学校写作与格式要求。</p>
    <h2>六、审核意见</h2>
    <p class="fill">（由教研室/指导教师填写）</p>`)

  const mid = auxHtml(`
    <h1>毕 业 设 计（论 文）中 期 检 查 表</h1>
    ${auxHeader(base)}
    <h2>一、计划进度执行情况</h2>
    <p>本课题按照任务书进度推进：已完成选题论证、资料收集与论文初稿的主体写作，计划完成率约 80%；论文结构完整，摘要、关键词、目录、正文与参考文献均已按规范生成，正在开展修改完善。</p>
    <h2>二、阶段成果</h2>
    <p>已形成论文初稿（目标 ${words} 字）及配套图表；完成开题报告、任务书等过程材料；按要求进行文献引用与格式校对。</p>
    <h2>三、存在问题及拟采取措施</h2>
    <p>存在的主要问题为部分论证的数据支撑仍需加强、格式细节有待统一。拟通过补充分析材料、参照学校模板逐项校对等方式解决，并请指导教师进一步把关。</p>
    <h2>四、下一阶段工作计划</h2>
    <p>完成全文统稿与降重修改，规范图表与参考文献，提交指导教师审阅后定稿，准备答辩材料。</p>
    <h2>五、指导教师意见</h2>
    <p class="fill">（由指导教师填写并签字）</p>`)

  return [
    { name: "开题报告", html: proposal },
    { name: "任务书", html: task },
    { name: "中期检查表", html: mid },
  ]
}

async function exportPackage(doc, meta) {
  const zip = new JSZip()
  const docs = buildAuxDocs(doc, meta)
  const paperHtml = await buildPaperHtml(doc)
  zip.file("1-论文（全文）.doc", `\ufeff${paperHtml}`)
  docs.forEach((d, i) => zip.file(`${i + 2}-${d.name}.doc`, `\ufeff${d.html}`))
  zip.file("材料清单.txt", "本压缩包包含：论文（全文）、开题报告、任务书、中期检查表。请按学校要求填写个人信息与签名后提交。")
  const blob = await zip.generateAsync({ type: "blob" })
  downloadBlob(blob, `升格智能论文系统-全套材料-${doc.title.slice(0, 12)}.zip`)
}

export default function Workspace() {
  const { user, sessionOutline, sessionMeta, sessionDoc } = useStore()
  const [form, setForm] = useState({ ...RESET, topic: sessionMeta?.topic || "" })
  const [outline, setOutlineState] = useState(sessionOutline || [])
  const [meta, setMeta] = useState(sessionMeta || null)
  const [doc, setDoc] = useState(sessionDoc || null)
  const [tab, setTab] = useState(outline.length ? "outline" : "create")
  const [activeId, setActiveId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState("")
  const [outlineBusy, setOutlineBusy] = useState(false)
  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(0)
  const [docBusy, setDocBusy] = useState(false)
  const [toolKey, setToolKey] = useState(null)
  const [toolDone, setToolDone] = useState({})
  const [login, setLogin] = useState(false)
  const [showDs, setShowDs] = useState(false)
  const [dsKey, setDsKey] = useState(getDsKey())
  const [dsModel, setDsModel] = useState(getDsModel())
  const timers = useRef([])
  const cancelRef = useRef(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const updateOutline = (next) => {
    setOutlineState(next)
    saveSessionOutline(next, meta || form)
  }

  const genOutline = async () => {
    if (!form.topic.trim()) {
      notify("请先输入题目或研究方向", "err")
      return
    }
    cancelRef.current = false
    setOutlineBusy(true)
    setLogs([])
    setDoc(null)
    try {
      const result = await smartOutline(
        { ...form, topic: form.topic.trim(), feed: "" },
        {
          onLog: ({ text, kind }) =>
            setLogs((prev) => [...prev, { id: `${prev.length}-${Date.now()}`, text, kind }]),
        },
      )
      setOutlineState(result)
      setMeta({ ...form, topic: form.topic.trim() })
      saveSessionOutline(result, { ...form, topic: form.topic.trim() })
      setActiveId(result[0]?.id || null)
      setTab("outline")
      notify("大纲生成完成，可点选章节修改后再撰写全文", "ok", 4000)
    } finally {
      setOutlineBusy(false)
    }
  }

  const genDoc = async () => {
    const secs = outline.filter((o) => !o.special && o.level === 1)
    if (!secs.length || !meta) {
      notify("请先生成并确认大纲", "err")
      return
    }
    cancelRef.current = false
    setDocBusy(true)
    setProgress(0)
    setLogs([])
    setDoc(null)
    try {
      const finalDoc = await smartFullDoc(
        { outline, topic: meta.topic, typeKey: meta.typeKey, edu: meta.edu, lang: meta.lang, words: meta.words, refCount: meta.refCount },
        {
          onLog: ({ text, kind }) =>
            setLogs((prev) => [...prev, { id: `${prev.length}-${Date.now()}`, text, kind }]),
          onProgress: (p) => setProgress(p),
          onChunk: (d) => setDoc(d),
        },
      )
      setDoc(finalDoc)
      saveSessionDoc(finalDoc)
      addRecord({
        id: uid("rec"),
        title: finalDoc.title,
        type: DOC_TYPES.find((t) => t.key === meta.typeKey)?.label || "论文",
        edu: meta.edu,
        words: `约 ${Math.round(docWordCount(finalDoc) / 100) / 10} 千字`,
        status: "已生成",
        time: new Date().toISOString(),
      })
      notify("全文生成完成，可导出 Word 或继续使用右侧工具", "ok", 4600)
    } catch (e) {
      notify(`生成中断：${e.message || "请重试"}`, "err", 6000)
    } finally {
      setDocBusy(false)
    }
  }

  const commitRename = () => {
    if (!editingId) return
    updateOutline(outline.map((n) => (n.id === editingId ? { ...n, title: editingText.trim() || n.title } : n)))
    setEditingId(null)
  }

  const deleteNode = (id) => {
    const idx = outline.findIndex((n) => n.id === id)
    if (idx < 0) return
    let end = idx + 1
    while (end < outline.length && outline[end].level === 2) end += 1
    updateOutline(outline.filter((_, i) => i < idx || i >= end))
    if (activeId === id) setActiveId(null)
    notify("已删除章节节点", "info")
  }

  const addNode = () => {
    const lastL1 = outline.filter((n) => n.level === 1).length
    const node = { id: uid("c"), level: 1, title: `补充章节 ${lastL1 + 1}`, special: null }
    const idx = outline.length - (outline[outline.length - 1]?.special ? 2 : 0)
    const next = [...outline.slice(0, idx), node, ...outline.slice(idx)]
    updateOutline(next)
    setActiveId(node.id)
    notify("已新增章节，可点选标题重命名", "info")
  }

  const runTool = (key) => {
    if (!doc || docBusy) return
    if (key === "package") {
      exportPackage(doc, meta)
        .then(() => notify("全套材料已打包：论文、开题报告、任务书、中期检查表", "ok", 5200))
        .catch(() => notify("打包失败，请重试", "err"))
      return
    }
    if (key === "export") {
      exportWord(doc)
        .then(() => notify("Word 文档已开始下载（含图表）", "ok"))
        .catch(() => notify("导出失败，请重试", "err"))
      return
    }
    if (key === "ppt") {
      notify("演示版未接入 PPT 生成服务，正式版将自动生成立场页与讲解备注", "info", 4200)
      return
    }
    setToolKey(key)
    const wait = 1400 + Math.random() * 900
    timers.current.push(
      setTimeout(() => {
        const next = JSON.parse(JSON.stringify(doc))
        if (key === "rewrite" || key === "aigc" || key === "reduce") {
          next.sections = next.sections.map((s) => ({ ...s, paras: applyRewrite(s.paras, key === "reduce" ? 3 : 2) }))
          if (key === "aigc") next.aigcNote = "已执行 AIGC 痕迹弱化（演示）"
          if (key === "reduce") next.reduceNote = "已执行降重预检（演示）"
        }
        if (key === "layout") {
          next.metaLine = `${next.metaLine} · 已排版`
          next.layoutNote = "已按 A4 学术模板排版：页边距、字号、目录与引用格式（演示）"
        }
        setDoc(next)
        saveSessionDoc(next)
        setToolDone((t) => ({ ...t, [key]: true }))
        setToolKey(null)
        notify(
          { rewrite: "改稿完成：全文已按当前大纲重写润色", aigc: "降 AIGC 完成（演示示意）", reduce: "降重预检完成（演示示意）", layout: "智能排版完成" }[key],
          "ok",
        )
      }, wait),
    )
  }

  const resetAll = () => {
    clearSession()
    setOutlineState([])
    setMeta(null)
    setDoc(null)
    setForm({ ...RESET })
    setTab("create")
    setToolDone({})
    setLogs([])
    notify("已新建空白文档", "info")
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(docFullText(doc))
      notify("全文已复制到剪贴板", "ok")
    } catch {
      notify("复制失败，请手动选择文本", "err")
    }
  }

  const level1s = outline.filter((n) => n.level === 1)
  const totalWords = doc ? docWordCount(doc) : 0

  const tools = [
    { key: "rewrite", label: "无限改稿", desc: "按当前大纲重新润色全文", icon: RefreshCw },
    { key: "aigc", label: "降 AIGC 痕迹", desc: "弱化模板化表达", icon: Wand2 },
    { key: "reduce", label: "一键降重", desc: "同义改写与结构微调", icon: ScanSearch },
    { key: "layout", label: "智能排版", desc: "A4 学术模板 · GB/T 7714", icon: LayoutTemplate },
    { key: "ppt", label: "生成答辩 PPT", desc: "演示版暂未开放", icon: MonitorPlay },
    { key: "package", label: "全套材料打包", desc: "论文+开题+任务书+中期检查表", icon: FolderArchive },
    { key: "export", label: "导出 Word", desc: "原生 .doc 文件下载", icon: FileDown },
  ]

  return (
    <div className="ws">
      <header className="ws-topbar">
        <div className="container ws-topbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link to="/" className="btn btn-ghost btn-sm hide-sm">
              <ArrowLeft size={15} /> 返回首页
            </Link>
            <span className="ws-logo">
              <LogoMark size={34} />
              <b>升格 · 学术工作台</b>
            </span>
          </div>
          <div className="ws-top-actions">
            {doc && (
              <span className="badge green" style={{ display: "inline-flex", gap: 6 }}>
                <Check size={12} /> 已保存 · 约 {Math.round(totalWords / 100) / 10} 千字
              </span>
            )}
            <button className="btn btn-outline btn-sm" onClick={resetAll}>
              <Plus size={15} /> 新建
            </button>
            <button
              className={`btn btn-sm ${dsKey ? "btn-soft" : "btn-outline"}`}
              onClick={() => setShowDs(true)}
              title="配置 DeepSeek API（Key 仅保存在本浏览器，不提交到仓库）"
            >
              <span className="dot" style={{ background: dsKey ? "var(--green-500)" : "var(--amber-400)" }} />
              {dsKey ? `DeepSeek ${dsModel.replace("deepseek-", "")} · 已接入` : "接入 DeepSeek"}
            </button>
            {user ? (
              <span className="user-chip">
                <span className="avatar">{user.name.slice(-1)}</span>
                {user.name}
              </span>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setLogin(true)}>
                <LogIn size={15} /> 登录
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="ws-main">
        {/* left rail */}
        <div className="rail rail-scroll" style={{ position: "sticky", top: 76 }}>
          <div className="rail-head">
            <b>
              {tab === "create" ? <Sparkles size={16} /> : <FileText size={16} />}
              {tab === "create" ? "创作配置" : "章节大纲"}
            </b>
            {outline.length > 0 && (
              <div className="seg">
                <button className={tab === "create" ? "on" : ""} onClick={() => setTab("create")}>
                  配置
                </button>
                <button className={tab === "outline" ? "on" : ""} onClick={() => setTab("outline")}>
                  大纲 {level1s.length}
                </button>
              </div>
            )}
          </div>
          <div className="rail-body">
            {tab === "create" || outline.length === 0 ? (
              <div className="ws-form">
                <div className="field">
                  <label>文档类型</label>
                  <select className="select" value={form.typeKey} onChange={(e) => set("typeKey", e.target.value)}>
                    {DOC_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>题目 / 研究方向</label>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 70 }}
                    value={form.topic}
                    onChange={(e) => set("topic", e.target.value)}
                    placeholder="填写论文题目或一段研究方向说明"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field">
                    <label>学历</label>
                    <select className="select" value={form.edu} onChange={(e) => set("edu", e.target.value)}>
                      {EDU_LEVELS.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>目标字数</label>
                    <select className="select" value={form.words} onChange={(e) => set("words", e.target.value)}>
                      {WORD_OPTIONS.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field">
                    <label>语言</label>
                    <select className="select" value={form.lang} onChange={(e) => set("lang", e.target.value)}>
                      {LANGS.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>参考文献</label>
                    <select className="select" value={form.refCount} onChange={(e) => set("refCount", e.target.value)}>
                      {REF_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v} 篇
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>写作引擎</label>
                  <select className="select" value={form.model} onChange={(e) => set("model", e.target.value)}>
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary btn-block" onClick={genOutline} disabled={outlineBusy}>
                  {outlineBusy ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {outlineBusy ? "生成大纲中…" : "免费生成大纲"}
                </button>
                {outline.length > 0 && !outlineBusy && (
                  <button className="btn btn-outline btn-block btn-sm" onClick={() => setTab("outline")}>
                    查看大纲并调整
                  </button>
                )}
              </div>
            ) : (
              <div className="outline-tree">
                {outline.map((n) => (
                  <div
                    key={n.id}
                    className={`ot-node${activeId === n.id ? " active" : ""}${n.level === 2 ? " level2" : ""}`}
                    onClick={() => {
                      setActiveId(n.id)
                      if (editingId) commitRename()
                    }}
                  >
                    {n.level === 1 ? <ChevronRight size={13} className="chev" /> : <span style={{ width: 13 }} />}
                    {editingId === n.id ? (
                      <input
                        autoFocus
                        className="input"
                        style={{ padding: "3px 8px", minWidth: 0, flex: 1 }}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename()
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span style={{ flex: 1 }}>{n.title}</span>
                    )}
                    <span className="node-tools">
                      {n.special !== "refs" && n.special !== "ack" && (
                        <button
                          className="node-btn"
                          title="重命名"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(n.id)
                            setEditingText(n.title)
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      <button
                        className="node-btn"
                        title="删除"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNode(n.id)
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                ))}
                <button className="rail-add" onClick={addNode}>
                  <Plus size={14} style={{ display: "inline", verticalAlign: -2 }} /> 新增章节
                </button>
                <button className="rail-add" onClick={() => setTab("create")} disabled={outlineBusy}>
                  <RefreshCw size={13} style={{ display: "inline", verticalAlign: -2 }} /> 重新生成大纲
                </button>
              </div>
            )}
          </div>
        </div>

        {/* center paper */}
        <div className="paper-col">
          {docBusy && (
            <div className="ws-overlay">
              <div className="gen-state">
                <div className="gs-head">
                  <span className="orb">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h3>正在生成全文 · 智能学术引擎</h3>
                    <div className="gs-sub">长文记忆开启 · 逐章写作中 · 预计 1-2 分钟</div>
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="gs-logs">
                  {logs.slice(-4).map((l, i) => (
                    <div key={l.id} className={`log-line${i === Math.min(logs.length, 4) - 1 ? " run" : " done"}`}>
                      <span className="log-dot">
                        {i === Math.min(logs.length, 4) - 1 ? (
                          <Loader2 className="spin" size={11} />
                        ) : (
                          <Check size={12} />
                        )}
                      </span>
                      {l.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="paper-wrap">
            {doc ? (
              <>
                <div className="paper">
                  <h1 className="paper-title">{doc.title}</h1>
                  <div className="meta-line">{doc.metaLine}</div>
                  <div className="abstract">
                    <b>摘要</b>
                    <p>{doc.abstract}</p>
                    <p style={{ marginTop: 10, color: "#666", fontSize: 13, fontWeight: 700 }}>
                      关键词：{(doc.keywords || []).join("；")}
                    </p>
                  </div>
                  <div className="paper-toc">
                    <h3>目录</h3>
                    {doc.toc.map((t) => (
                      <div className="toc-row" key={t.id}>
                        {t.title}
                      </div>
                    ))}
                  </div>
                  {doc.sections.map((s) => (
                    <section key={s.id}>
                      <h3>{s.title}</h3>
                      {(s.blocks || []).map((b, bi) => {
                        if (b.kind === "h4") return <h4 key={bi}>{b.text}</h4>
                        if (b.kind === "p") return <p key={bi}>{b.text}</p>
                        if (b.kind === "figure" && b.figure) {
                          return (
                            <figure className="paper-figure" key={bi}>
                              <div className="figure-title">{b.figure.title}</div>
                              <div
                                className="figure-svg"
                                dangerouslySetInnerHTML={{ __html: b.figure.svg }}
                              />
                            </figure>
                          )
                        }
                        if (b.kind === "table" && b.table) {
                          return (
                            <div className="paper-table" key={bi}>
                              <div className="table-title">{b.table.title}</div>
                              <table>
                                <thead>
                                  <tr>
                                    {b.table.headers.map((h) => (
                                      <th key={h}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.table.rows.map((row, ri) => (
                                    <tr key={ri}>
                                      {row.map((cell, ci) => (
                                        <td key={ci}>{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {b.demo && <div className="demo-note">示例数据，正式版以真实调研/测试结果回填</div>}
                            </div>
                          )
                        }
                        return null
                      })}
                    </section>
                  ))}
                  <h3>参考文献</h3>
                  <ol className="refs">
                    {doc.refs.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ol>
                  <p style={{ fontSize: 12.5, color: "#999", marginTop: 10 }}>{doc.refsNote}</p>
                  <h3>致谢</h3>
                  <p>{doc.ack}</p>
                  {doc.aigcNote && (
                    <p style={{ fontSize: 12.5, color: "#0f9f6e" }}>● {doc.aigcNote}</p>
                  )}
                  {doc.reduceNote && (
                    <p style={{ fontSize: 12.5, color: "#0f9f6e" }}>● {doc.reduceNote}</p>
                  )}
                  {doc.layoutNote && <p style={{ fontSize: 12.5, color: "#0f9f6e" }}>● {doc.layoutNote}</p>}
                </div>
                <div className="paper-tools">
                  <button className="btn btn-primary" onClick={() => runTool("export")}>
                    <FileDown size={16} /> 导出 Word
                  </button>
                  <button className="btn btn-outline" onClick={copyAll}>
                    复制全文
                  </button>
                  <button className="btn btn-ghost" onClick={genDoc} disabled={docBusy}>
                    <RefreshCw size={15} /> 重新生成全文
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-paper">
                <div>
                  <div className="ep-icon">
                    {outline.length ? <FileText size={32} /> : <Sparkles size={32} />}
                  </div>
                  {outline.length ? (
                    <>
                      <h3>大纲已就绪 · 第 2 步：撰写全文</h3>
                      <p>
                        当前大纲共 {level1s.length} 章。确认左侧章节结构后，点击下方按钮开始逐章写作，
                        完成后支持无限改稿、降 AIGC、一键排版与 Word 导出。
                      </p>
                      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                        <button className="btn btn-primary btn-lg" onClick={genDoc} disabled={docBusy}>
                          {docBusy ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
                          {docBusy ? "生成中…" : "立即生成全文"}
                        </button>
                        <button className="btn btn-outline" onClick={() => setTab("outline")}>
                          返回调整大纲
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>开始一次新的创作</h3>
                      <p>
                        在左侧选择文档类型并填写题目，先免费生成大纲；大纲满意后，再一键生成带摘要、
                        参考文献标注与致谢的完整正文。
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* right tools */}
        <div className="rail rail-scroll right-rail" style={{ position: "sticky", top: 76 }}>
          <div className="rail-head">
            <b>写作工具链</b>
            <span className="badge">{doc ? "已启用" : "等待成稿"}</span>
          </div>
          <div className="rail-body">
            <div className="right-status">
              <b>
                <span className="dot" style={{ background: doc ? "var(--green-500)" : "var(--amber-400)" }} />
                {doc ? "当前文档可用" : "生成全文后可用"}
              </b>
              <p>
                {doc
                  ? `${DOC_TYPES.find((t) => t.key === meta?.typeKey)?.label || "论文"} · ${meta?.edu || ""} · 当前约 ${Math.round(totalWords / 100) / 10} 千字`
                  : "大纲或全文生成后，这里会解锁改稿、降 AIGC、排版与导出等能力。"}
              </p>
            </div>
            <div className="tool-list">
              {tools.map((t) => {
                const Icon = t.icon
                const done = toolDone[t.key]
                return (
                  <button
                    className="tool-btn"
                    key={t.key}
                    disabled={!doc || docBusy || toolKey !== null}
                    onClick={() => runTool(t.key)}
                  >
                    <span className="ti">
                      {toolKey === t.key ? <Loader2 className="spin" size={15} /> : <Icon size={15} />}
                    </span>
                    <span>
                      {t.label}
                      <small style={{ display: "block", color: "var(--ink-400)", fontWeight: 600, fontSize: 11 }}>
                        {t.desc}
                      </small>
                    </span>
                    <span className="t-badge">{done ? "已完成" : toolKey === t.key ? "处理中" : ""}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {login && <LoginModal mode="login" onClose={() => setLogin(false)} />}
      {showDs && (
        <div className="overlay" role="dialog" aria-modal="true" onClick={() => setShowDs(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>DeepSeek 接入设置</h3>
              <button className="modal-close" onClick={() => setShowDs(false)} aria-label="关闭">
                ×
              </button>
            </div>
            <p className="modal-sub">开启后大纲与全文由 DeepSeek V4 Flash 真实生成；Key 仅保存在本浏览器 localStorage，不会写入仓库或发送给第三方。</p>
            <div className="form-stack">
              <div className="field">
                <label htmlFor="ds-key">API Key</label>
                <input
                  id="ds-key"
                  className="input"
                  type="password"
                  value={dsKey}
                  onChange={(e) => setDsKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="field">
                <label htmlFor="ds-model">模型</label>
                <select id="ds-model" className="select" value={dsModel} onChange={(e) => setDsModel(e.target.value)}>
                  <option value="deepseek-v4-flash">deepseek-v4-flash（推荐）</option>
                  <option value="deepseek-v4-pro">deepseek-v4-pro（更强，更慢）</option>
                </select>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  saveDsConfig({ key: dsKey, model: dsModel })
                  setShowDs(false)
                  notify(dsKey ? "DeepSeek 已接入，下次生成将使用真实模型" : "已切换到本地演示引擎", "ok")
                }}
              >
                保存配置
              </button>
              <button
                className="btn btn-ghost btn-block btn-sm"
                onClick={() => {
                  setDsKey("")
                  saveDsConfig({ key: "", model: dsModel })
                  notify("已清除 Key，回到本地演示模式", "info")
                }}
              >
                清除 Key（回到演示模式）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
