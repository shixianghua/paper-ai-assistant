import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Compass,
  Download,
  FileText,
  Gift,
  Globe,
  ListTree,
  PenLine,
  Plug,
  Rocket,
  ScrollText,
  ShieldCheck,
  Wand2,
  Zap,
} from "lucide-react"
import { DOC_TYPE_GROUPS, DOC_TYPES, ECO, FAQS, FEATURES, PRICING, STEPS } from "../data/catalog"
import { notify } from "../lib/store"
import { RecordRows, Reveal, SectionHead } from "./Chrome"
import { scrollToId } from "../lib/scroll"

/* ---------- Hero ---------- */
export function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="mesh" />
        <div className="grid-mask" />
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>
      <div className="container hero-inner">
        <div className="hero-copy">
          <Reveal>
            <h1 className="hero-title">
              从题目到 Word 成稿，
              <br />
              <span className="grad-text">一条完整的学术创作链路</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="hero-sub">
              告别碎片化工具。大纲、正文、真实文献、图表、排版与降重一体化编排，
              为毕业论文、开题报告、文献综述等长文档写作提供一站式闭环体验。
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" to="/workspace">
                开启创作之旅 <Rocket size={18} />
              </Link>
              <a
                className="btn btn-outline btn-lg"
                href="#top"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId("features")
                }}
              >
                探索核心能力 <ArrowRight size={17} />
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="hero-proof">
              <span className="proof-item">
                <CheckCircle2 size={16} /> 大纲免费生成
              </span>
              <span className="proof-item">
                <CheckCircle2 size={16} /> 无限次改稿
              </span>
              <span className="proof-item">
                <CheckCircle2 size={16} /> 原生 Word 导出
              </span>
            </div>
          </Reveal>
        </div>
        <div className="hero-art">
          <Reveal delay={160}>
            <div className="app-window">
              <div className="window-bar">
                <span className="win-dot" />
                <span className="win-dot" />
                <span className="win-dot" />
                <span className="win-url">workbench / 毕业论文</span>
              </div>
              <div className="window-body">
                <div className="doc-mini-head">
                  <div>
                    <div className="mini-title">艾宾浩斯记忆曲线在初中英语教学中的运用研究</div>
                    <div className="mini-meta">
                      <span className="mini-tag">本科</span>
                      <span className="mini-tag">2 万字</span>
                      <span className="mini-tag green">已排版</span>
                    </div>
                  </div>
                  <span className="mini-ring">
                    <b>72%</b>
                  </span>
                </div>
                <div className="mini-block">
                  <div className="row">
                    <span>正文撰写进度</span>
                    <span>
                      <i style={{ color: "var(--brand-700)" }}>6 / 8 章</i>
                    </span>
                  </div>
                  <div className="bar" style={{ marginTop: 10, width: "100%" }}>
                    <i />
                  </div>
                </div>
                <div className="mini-block">
                  <div className="row">
                    <span>降 AIGC 痕迹</span>
                    <span className="badge green">进行中</span>
                  </div>
                  <div className="bar cyan" style={{ marginTop: 10, width: "100%" }}>
                    <i />
                  </div>
                </div>
                <div className="para-lines">
                  <div className="ln w80" />
                  <div className="ln" />
                  <div className="ln w55" />
                </div>
              </div>
            </div>
          </Reveal>
          <div className="float-card fc-1">
            <span className="fc-icon">
              <Wand2 size={17} />
            </span>
            <span>
              智能排版完成
              <small>GB/T 7714 引用格式</small>
            </span>
          </div>
          <div className="float-card fc-2">
            <span className="fc-icon">
              <ShieldCheck size={17} />
            </span>
            <span>
              查重预检 9.6%
              <small>演示示意 · 实际以检测报告为准</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Doc types ---------- */
export function DocTypes() {
  const send = (key) => {
    const type = DOC_TYPES.find((t) => t.key === key)
    window.dispatchEvent(new CustomEvent("sg:prefill", { detail: { key } }))
    notify(`已切换到「${type.label}」，可一键开始`, "info", 2400)
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })
  }
  return (
    <section className="types-band">
      <div className="container types-inner">
        <div className="types-lead">
          <h3>一种工具，覆盖 20+ 类学术文档</h3>
          <span>点击分类即可在下方体验区切换</span>
        </div>
        {DOC_TYPE_GROUPS.map((g) => (
          <div key={g.name} className="chip-cloud" style={{ marginBottom: 12 }}>
            {g.keys.map((key) => {
              const t = DOC_TYPES.find((x) => x.key === key)
              return (
                <button className="chip" key={key} onClick={() => send(key)}>
                  {t.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Steps ---------- */
const STEP_ICONS = [Compass, ListTree, PenLine, Download]

export function FlowSteps() {
  return (
    <section className="section section-soft" id="flow">
      <div className="container">
        <SectionHead
          title={
            <>
              化繁为简，将复杂学术写作拆成 <span className="grad-text">四个可控阶段</span>
            </>
          }
          lead="每一步都有明确产出：命题确认 → 大纲定稿 → 内容成稿 → 交付排版，全程可视、可改、可回退。"
        />
        <div className="steps-grid">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <Reveal key={s.title} delay={i * 110}>
                <div className="step">
                  <div className="step-icon">
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Feature matrix ---------- */
const FEATURE_ICONS = [Zap, ScrollText, FileText, BarChart3, Wand2, Blocks]

export function MatrixBand() {
  return (
    <section className="section band-deep" id="features">
      <div className="container">
        <SectionHead
          light
          title="不止生成，而是完整的学术交付闭环"
          lead="打破传统 Chat 模式的局限，为高标准长文档定制的能力矩阵。"
        />
        <div className="matrix">
          <div>
            {FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]
              return (
                <Reveal key={f.title} delay={i * 70}>
                  <div className="feature-item">
                    <span className="fi-icon">
                      <Icon size={20} strokeWidth={1.9} />
                    </span>
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <Reveal delay={140}>
            <div className="engine-window">
              <div className="engine-head">
                <b>
                  <Bot size={15} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />
                  写作引擎实时状态
                </b>
                <span className="live">
                  <span className="dot" /> 执行中
                </span>
              </div>
              <div className="es-list">
                <div className="es-item done">
                  <span className="dot" /> 大纲确认与选题解析
                  <span className="es-bar">
                    <i />
                  </span>
                </div>
                <div className="es-item done">
                  <span className="dot" /> 文献检索与知识注入
                  <span className="es-bar">
                    <i />
                  </span>
                </div>
                <div className="es-item run">
                  <span className="dot" /> 第 3/8 章 · 正文撰写中
                  <span className="es-bar">
                    <i />
                  </span>
                </div>
                <div className="es-item">
                  <span className="dot" /> AIGC 痕迹优化
                  <span className="es-bar" />
                </div>
                <div className="es-item">
                  <span className="dot" /> 排版与 Word 导出
                  <span className="es-bar" />
                </div>
              </div>
              <div className="engine-foot">
                <span>预计剩余 03:42</span>
                <span>Token 0.8k / 章</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------- History ---------- */
export function HistorySection() {
  return (
    <section className="section tight section-soft" id="records">
      <div className="container">
        <Reveal>
          <div className="records-head">
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink-900)" }}>我的写作记录</h2>
              <p style={{ marginTop: 6, color: "var(--ink-500)", fontSize: 14.5, fontWeight: 600 }}>
                永久云端记录 · 隐私隔离 · 随时继续上次写作
              </p>
            </div>
            <Link className="btn btn-outline" to="/workspace">
              新建文档 <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <RecordRows />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- Pricing ---------- */
export function Pricing() {
  const choose = (p) => {
    notify(`已选择「${p.label}」，当前演示版未接入支付，可在正式版配置支付通道`, "info", 4200)
  }
  return (
    <section className="section section-soft" id="pricing">
      <div className="container">
        <SectionHead
          title={
            <>
              灵活套餐，<span className="grad-text">按需选择</span>
            </>
          }
          lead="多篇套餐可写不同题目，支持多人共用，生成的文档永久有效。价格为演示占位配置，正式运营可自行调整。"
        />
        <div className="pricing-grid">
          {PRICING.map((p, i) => (
            <Reveal key={p.count} delay={i * 90}>
              <div className={`price-card${p.hot ? " hot" : ""}`}>
                {p.hot && <span className="hot-ribbon">最受欢迎</span>}
                <span className="price-num">任写 {p.count} 篇</span>
                <div className="price-amount">
                  <span className="cur">¥</span>
                  <span className="val">{p.price}</span>
                  <span className="price-original">¥{p.original}</span>
                </div>
                <div className="price-note">{p.note}</div>
                <ul className="price-feats">
                  {p.feats.map((f) => (
                    <li key={f}>
                      <Check size={15} /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`btn ${p.hot ? "btn-primary" : "btn-outline"}`} onClick={() => choose(p)}>
                  选择套餐
                </button>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="pricing-footnote">
            ❉ 批量采购、OEM 合作与代理咨询请通过商务渠道联系 · ❉ 演示版生成的文档仅供学习与功能体验
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- Ecosystem ---------- */
const ECO_ICONS = [Plug, Globe, Rocket, Gift]

export function Ecosystem() {
  return (
    <section className="section">
      <div className="container">
        <SectionHead
          title="从个人创作到商业化接入"
          lead="无论是寻求强力工具的个人创作者，还是希望接入 AI 能力的代理伙伴，都能找到合适的承接方式。"
        />
        <div className="eco-grid">
          {ECO.map((e, i) => {
            const Icon = ECO_ICONS[i]
            return (
              <Reveal key={e.title} delay={i * 90}>
                <div className="eco-item">
                  <span className="eco-icon">
                    <Icon size={21} strokeWidth={1.9} />
                  </span>
                  <h4>{e.title}</h4>
                  <p>{e.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */
export function FaqSection() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section section-soft" id="faq">
      <div className="container">
        <SectionHead title="常见问题" lead="关于写作质量、隐私与交付的说明都在这里。" />
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 50, 250)}>
              <div className={`faq-item${open === i ? " open" : ""}`}>
                <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                  {f.q}
                  <span className="plus">
                    <ChevronDown size={16} />
                  </span>
                </button>
                <div className="faq-a">{f.a}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- CTA ---------- */
export function CtaBand() {
  return (
    <section className="section">
      <div className="container">
        <Reveal>
          <div className="cta-band">
            <h2>构思，即刻成文。</h2>
            <p>不要让排版与资料收集耗费你的心智，把时间留给真正的创造。</p>
            <div className="cta-actions">
              <Link className="btn btn-light btn-lg" to="/workspace">
                免费开始写作 <ArrowRight size={17} />
              </Link>
              <a
                className="btn btn-lg"
                href="#top"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId("demo")
                }}
                style={{ border: "1px solid rgba(255,255,255,.55)", color: "#fff" }}
              >
                先看大纲演示
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
