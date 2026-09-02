import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileDown,
  FileText,
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
import {
  DOC_TYPES,
  EDU_LEVELS,
  LANGS,
  MODELS,
  REF_OPTIONS,
  WORD_OPTIONS,
} from "../data/catalog"
import { demoOutline, docWordCount, generateFullDoc, uid } from "../lib/generator"
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
  return [
    doc.title,
    doc.metaLine,
    "",
    "摘要",
    doc.abstract,
    ...doc.sections.flatMap((s) => [s.title, ...s.paras]),
    "参考文献",
    ...doc.refs.map((r, i) => `[${i + 1}] ${r}`),
    doc.ack,
  ].join("\n")
}

function exportWord(doc) {
  const body = `
    <h1>${doc.title}</h1>
    <p class="meta">${doc.metaLine}</p>
    <h2>摘要</h2><p>${doc.abstract}</p>
    ${doc.sections
      .map(
        (s, i) =>
          `<h2>${i + 1}. ${s.title}</h2>` +
          s.paras.map((p) => `<p>${p}</p>`).join(""),
      )
      .join("")}
    <h2>参考文献</h2><ol>${doc.refs.map((r) => `<li>${r}</li>`).join("")}</ol>
    <p class="meta">${doc.refsNote}</p>
    <h2>致谢</h2><p>${doc.ack}</p>`
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>
    body{font-family:"SimSun","Songti SC",serif;line-height:2;color:#111;font-size:16px}
    h1{text-align:center;font-size:24px} h2{font-size:19px;margin-top:22px}
    .meta{color:#555;text-align:center} p{text-align:justify;text-indent:2em;margin:0}
    .meta{text-indent:0}
    @page{size:A4;margin:2.54cm 3.17cm}
  </style></head><body>${body}</body></html>`
  const blob = new Blob(["\ufeff", html], { type: "application/msword" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${doc.title.replace(/[\\/:*?"<>|]/g, "_")}.doc`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
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
      const result = await demoOutline(
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
      const finalDoc = await generateFullDoc(
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
    } catch {
      notify("生成已中断", "err")
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
    if (key === "export") {
      exportWord(doc)
      notify("Word 文档已开始下载", "ok")
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
                    <p style={{ marginTop: 10, color: "#666", fontSize: 13 }}>
                      <b style={{ fontFamily: "var(--font-sans)" }}>关键词：</b>
                      {doc.title.slice(0, 4)}；研究现状；对策建议；文献综述
                    </p>
                  </div>
                  {doc.sections.map((s, i) => (
                    <section key={s.id}>
                      <h3>
                        {i + 1}. {s.title}
                      </h3>
                      {s.paras.map((p, pi) => (
                        <p key={`${s.id}-${pi}`}>{p}</p>
                      ))}
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
    </div>
  )
}
