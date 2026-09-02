import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileUp,
  Loader2,
  RefreshCw,
  Rocket,
  Sparkles,
} from "lucide-react"
import {
  DOC_TYPES,
  EDU_LEVELS,
  LANGS,
  MODELS,
  REF_OPTIONS,
  WORD_OPTIONS,
} from "../data/catalog"
import { defaultTopic, demoOutline } from "../lib/generator"
import { notify, saveSessionOutline } from "../lib/store"

const initial = {
  typeKey: "graduate",
  topic: defaultTopic("graduate"),
  edu: "本科",
  words: "2万",
  model: "pro",
  lang: "中文",
  level: "三级大纲",
  refCount: "15",
}

export default function GeneratorPanel({ heading = "在线体验 · 从题目到大纲" }) {
  const [form, setForm] = useState(initial)
  const [feed, setFeed] = useState("")
  const [logs, setLogs] = useState([])
  const [outline, setOutline] = useState(null)
  const [running, setRunning] = useState(false)
  const [agree, setAgree] = useState(true)
  const runRef = useRef(0)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const type = useMemo(() => DOC_TYPES.find((t) => t.key === form.typeKey) || DOC_TYPES[0], [form.typeKey])

  useEffect(() => {
    const handler = (e) => {
      const { key } = e.detail || {}
      const target = DOC_TYPES.find((t) => t.key === key)
      if (!target) return
      setForm((f) => ({ ...f, typeKey: key, topic: defaultTopic(key) }))
      setOutline(null)
      setLogs([])
    }
    window.addEventListener("sg:prefill", handler)
    return () => window.removeEventListener("sg:prefill", handler)
  }, [])

  const generate = async () => {
    if (!form.topic.trim()) {
      notify("请先输入论文题目或研究主题", "err")
      return
    }
    if (!agree) {
      notify("请先勾选内容使用声明", "err")
      return
    }
    runRef.current += 1
    const token = runRef.current
    setRunning(true)
    setLogs([])
    setOutline(null)
    try {
      const result = await demoOutline(
        {
          typeKey: form.typeKey,
          topic: form.topic.trim(),
          lang: form.lang,
          model: form.model,
          feed: feed.trim(),
        },
        {
          onLog: ({ text, kind }) => {
            if (token !== runRef.current) return
            setLogs((prev) => [...prev, { id: `${prev.length}-${Date.now()}`, text, kind }])
          },
        },
      )
      if (token !== runRef.current) return
      setOutline(result)
      saveSessionOutline(result, { ...form, topic: form.topic.trim(), refCount: form.refCount })
      notify("免费大纲已生成，可进入工作台继续全文写作", "ok", 4200)
    } catch {
      /* cancelled */
    } finally {
      if (token === runRef.current) setRunning(false)
    }
  }

  return (
    <div className="gen-shell">
      <div className="gen-head">
        <div>
          <h3>{heading}</h3>
          <p>免费生成标准结构大纲 · 支持三级大纲与手动调整</p>
        </div>
        <span className="badge">
          <Sparkles size={13} /> 升格 5.0 学术加强版
        </span>
      </div>

      <div className="gen-body">
        <div className="gen-grid">
          <div className="field f-type">
            <label htmlFor="type">文档类型</label>
            <select id="type" className="select" value={form.typeKey} onChange={(e) => set("typeKey", e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field f-topic">
            <label htmlFor="topic">题目 / 研究方向</label>
            <input
              id="topic"
              className="input"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder="例如：艾宾浩斯记忆曲线在初中英语教学中的运用研究"
            />
          </div>

          <div className="f-options">
            <div className="opt-row">
              <span className="opt-label">
                学历
                <small>适用层次</small>
              </span>
              <div className="seg">
                {EDU_LEVELS.map((v) => (
                  <button key={v} className={form.edu === v ? "on" : ""} onClick={() => set("edu", v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="opt-row">
              <span className="opt-label">
                目标字数
                <small>全文篇幅</small>
              </span>
              <div className="seg">
                {WORD_OPTIONS.map((v) => (
                  <button key={v} className={form.words === v ? "on" : ""} onClick={() => set("words", v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="opt-row">
              <span className="opt-label">
                写作引擎
                <small>模型选择</small>
              </span>
              <div className="seg">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    title={m.desc}
                    className={form.model === m.id ? "on" : ""}
                    onClick={() => set("model", m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="opt-row">
              <span className="opt-label">
                大纲层级
                <small>结构深度</small>
              </span>
              <div className="seg">
                {["二级大纲", "三级大纲"].map((v) => (
                  <button key={v} className={form.level === v ? "on" : ""} onClick={() => set("level", v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="opt-row">
              <span className="opt-label">
                语言
                <small>输出语种</small>
              </span>
              <div className="seg">
                {LANGS.map((v) => (
                  <button key={v} className={form.lang === v ? "on" : ""} onClick={() => set("lang", v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="opt-row">
              <span className="opt-label">
                参考文献
                <small>检索数量</small>
              </span>
              <div className="seg">
                {REF_OPTIONS.map((v) => (
                  <button key={v} className={form.refCount === v ? "on" : ""} onClick={() => set("refCount", v)}>
                    {v} 篇
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <details className="gen-feed">
          <summary>
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <FileUp size={15} /> 投喂 AI：上传参考资料，让大纲更贴合你的要求
            </span>
            <ChevronDown size={16} />
          </summary>
          <textarea
            className="textarea"
            value={feed}
            onChange={(e) => setFeed(e.target.value)}
            placeholder="粘贴你的选题要求、学校模板、导师意见或资料要点（演示版仅用于展示交互，支持 txt / docx / pdf 的正式版会在连接服务后启用）"
          />
        </details>

        {logs.length > 0 && (
          <div className="gen-log" aria-live="polite">
            {logs.map((l, i) => (
              <div key={l.id} className={`log-line${l.kind === "run" && i === logs.length - 1 ? " run" : ""}${l.kind === "done" && i < logs.length - 1 ? " done" : ""}`}>
                <span className="log-dot">
                  {l.kind === "run" || (i === logs.length - 1 && running) ? (
                    <Loader2 className="spin" size={11} />
                  ) : (
                    <Check size={12} />
                  )}
                </span>
                {l.text}
              </div>
            ))}
          </div>
        )}

        {outline && (
          <div className="outline-preview" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 4 }}>
              <b style={{ color: "var(--ink-900)" }}>生成结果 · {type.label}</b>
              <span className="badge green">
                <Check size={12} /> 共 {outline.filter((o) => o.level === 1).length} 章
              </span>
            </div>
            {outline.slice(0, 10).map((o) => (
              <div key={o.id} className={`op-row level${o.level}`}>
                {o.level === 1 ? <ChevronRight size={13} /> : <span style={{ width: 13 }} />}
                <b>{o.level === 1 ? `${outline.filter((x) => x.level === 1).indexOf(o) + 1}` : "·"}</b>
                {o.title}
              </div>
            ))}
            {outline.length > 10 && (
              <div style={{ paddingLeft: 24, fontSize: 13, color: "var(--ink-400)", fontWeight: 600 }}>
                … 其余 {outline.length - 10} 个节点可进入工作台查看与修改
              </div>
            )}
          </div>
        )}

        <div className="gen-foot">
          <label className="checkbox-row">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              我已阅读并同意：演示版生成的全文为示意内容，仅用作功能演示与格式参考；正式版接入真实模型后，请遵守所在机构学术规范。
            </span>
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {outline && !running && (
              <>
                <button className="btn btn-outline" onClick={generate}>
                  <RefreshCw size={15} /> 重新生成
                </button>
                <Link className="btn btn-primary" to="/workspace">
                  进入工作台，生成全文 <Rocket size={16} />
                </Link>
              </>
            )}
            {!outline && (
              <button className="btn btn-primary btn-lg" onClick={generate} disabled={running}>
                {running ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
                {running ? "正在生成大纲…" : "免费生成大纲"}
              </button>
            )}
            {outline && running && (
              <button className="btn btn-primary" disabled>
                <Loader2 className="spin" size={16} /> 重新生成中…
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
