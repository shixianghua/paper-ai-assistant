import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  FileText,
  Info,
  Loader2,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Rocket,
  ShieldCheck,
  X,
} from "lucide-react"
import {
  HELP_LINKS,
  LEGAL_LINKS,
  PROD_LINKS,
} from "../data/catalog"
import {
  dismissToast,
  formatTime,
  loginDemo,
  loginWithPassword,
  logout,
  notify,
  refreshAccount,
  registerAccount,
  removeRecord,
  useStore,
} from "../lib/store"
import { scrollToId } from "../lib/scroll"

/* ---------- Logo ---------- */
export function LogoMark({ size = 38 }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 15h16M6 13l6-9 6 9" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18.2" cy="5.6" r="1.6" fill="#fde68a" />
      </svg>
    </span>
  )
}

export function Logo({ to = "/" }) {
  return (
    <Link className="logo" to={to} aria-label="升格智能论文系统 首页">
      <LogoMark />
      <span>
        <span className="logo-name">升格智能论文系统</span>
        <span className="logo-sub">AI ACADEMIC WORKSPACE</span>
      </span>
    </Link>
  )
}

/* ---------- Navbar ---------- */
/* ---------- 我的账户（额度 / 充值 / 使用明细） ---------- */
export function AccountModal({ onClose }) {
  const { user, account, backend } = useStore()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.body.classList.add("no-scroll")
    return () => document.body.classList.remove("no-scroll")
  }, [])

  useEffect(() => {
    if (backend) refreshAccount().catch(() => {})
  }, [backend])

  const orders = account?.orders || []
  const usage = account?.usage || []
  const left = typeof user?.quotaLeft === "number" ? user.quotaLeft : "—"
  const used = typeof user?.quotaUsed === "number" ? user.quotaUsed : "—"
  const paid = typeof user?.amountPaid === "number" ? `¥${user.amountPaid.toFixed(2)}` : "—"

  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" style={{ width: "min(560px, 100%)" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>我的账户</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <p className="modal-sub">
          {user?.phone ? `账号：${user.phone}` : "未登录"} · {backend ? "已连接服务器" : "本地演示模式"}
        </p>

        <div className="acct-grid">
          <div className="acct-card">
            <div className="k">剩余篇数</div>
            <div className="v" style={{ color: typeof left === "number" && left <= 0 ? "#e11d48" : "#16a34a" }}>
              {left}
            </div>
          </div>
          <div className="acct-card">
            <div className="k">已用篇数</div>
            <div className="v">{used}</div>
          </div>
          <div className="acct-card">
            <div className="k">累计充值</div>
            <div className="v">{paid}</div>
          </div>
        </div>

        {!backend && (
          <div className="demo-hint" style={{ marginTop: 4 }}>
            <b>提示：</b> 当前环境未连接后端数据库（例如 GitHub Pages 静态演示），额度统计仅在 Byet 主机的站点上可用。
          </div>
        )}

        <div className="acct-section">
          <div className="acct-title">
            订单记录
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await refreshAccount()
                  notify("已刷新账户数据", "ok", 2400)
                } catch {
                  notify("刷新失败，请稍后再试", "err", 3200)
                }
                setBusy(false)
              }}
            >
              <RefreshCw size={13} /> 刷新
            </button>
          </div>
          {orders.length ? (
            <table className="acct-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>套餐</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_no}>
                    <td style={{ fontFamily: "monospace" }}>{o.order_no}</td>
                    <td>{o.plan_label}</td>
                    <td>¥{Number(o.amount).toFixed(2)}</td>
                    <td>
                      <span className={`pill ${o.status}`}>{o.status === "paid" ? "已开通" : "待核销"}</span>
                    </td>
                    <td className="muted">{formatTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="acct-empty">还没有订单。购买套餐后，管理员核销即会自动增加篇数。</p>
          )}
        </div>

        <div className="acct-section">
          <div className="acct-title">使用明细（生成全文时扣减 1 篇）</div>
          {usage.length ? (
            <table className="acct-table">
              <thead>
                <tr>
                  <th>文档标题</th>
                  <th>类型</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u, i) => (
                  <tr key={`${u.created_at}-${i}`}>
                    <td style={{ maxWidth: 260 }}>{u.title}</td>
                    <td>{u.doc_type || "—"}</td>
                    <td className="muted">{formatTime(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="acct-empty">还没有使用记录。</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function Navbar({ onLogin }) {
  const { user } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    fn()
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const links = [
    { label: "产品能力", href: "#features" },
    { label: "创作流程", href: "#flow" },
    { label: "在线体验", href: "#demo" },
    { label: "价格", href: "#pricing" },
    { label: "常见问题", href: "#faq" },
  ]

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="container nav-inner">
        <Logo />
          <nav className="nav-links" aria-label="主导航">
          {links.map((l) => (
            <a
              key={l.href}
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                scrollToId(l.href.slice(1))
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          {user ? (
            <div style={{ position: "relative" }}>
              <button className="user-chip" onClick={() => setUserMenu((v) => !v)}>
                <span className="avatar">{user.name.slice(-1)}</span>
                {user.name}
                {typeof user.quotaLeft === "number" && (
                  <span className="quota-chip" title="剩余篇数">
                    剩 {user.quotaLeft} 篇
                  </span>
                )}
              </button>
              {userMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 190,
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    boxShadow: "var(--shadow-md)",
                    padding: 6,
                    zIndex: 90,
                  }}
                  onMouseLeave={() => setUserMenu(false)}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                    onClick={() => {
                      setAccountOpen(true)
                      setUserMenu(false)
                    }}
                  >
                    <ShieldCheck size={15} /> 我的账户 / 剩余额度
                  </button>
                  <Link
                    className="btn btn-ghost btn-sm"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                    to="/workspace"
                    onClick={() => setUserMenu(false)}
                  >
                    <Rocket size={15} /> 进入工作台
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: "100%", justifyContent: "flex-start", color: "var(--red-500)" }}
                    onClick={() => {
                      logout()
                      setUserMenu(false)
                      notify("已退出登录", "info")
                    }}
                  >
                    <LogOut size={15} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => onLogin("login")}>
                登录
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onLogin("register")}>
                免费注册
              </button>
            </>
          )}
          <button className="menu-btn" aria-label="打开菜单" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid var(--line)", padding: "14px 20px 20px", display: "grid", gap: 6 }}>
          {links.map((l) => (
            <a
              key={l.href}
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                setOpen(false)
                scrollToId(l.href.slice(1))
              }}
              style={{ padding: "10px 8px", borderRadius: 10, fontWeight: 700, color: "var(--ink-800)" }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
    </header>
  )
}

/* ---------- Login modal ---------- */
export function LoginModal({ mode, onClose }) {
  const [tab, setTab] = useState(mode === "register" ? "register" : "login")
  const [phone, setPhone] = useState("")
  const [pwd, setPwd] = useState("")
  const [pwd2, setPwd2] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.body.classList.add("no-scroll")
    return () => document.body.classList.remove("no-scroll")
  }, [])

  const submit = () => {
    if (!/^1\d{10}$/.test(phone.trim())) {
      notify("请输入 11 位手机号（以 1 开头）", "err")
      return
    }
    if (String(pwd).length < 6) {
      notify("密码至少 6 位", "err")
      return
    }
    if (tab === "register" && pwd !== pwd2) {
      notify("两次输入的密码不一致", "err")
      return
    }
    setBusy(true)
    setTimeout(async () => {
      const res = tab === "register" ? await registerAccount(phone, pwd) : await loginWithPassword(phone, pwd)
      setBusy(false)
      if (!res.ok) {
        notify(res.error, "err", 5200)
        return
      }
      onClose()
      notify(
        tab === "register" ? "注册成功，已自动登录" : res.server ? "登录成功，欢迎回来" : "登录成功（本地演示模式）",
        "ok",
        3600,
      )
    }, 460)
  }

  // 演示环境一键进入：不需要注册，也不发送短信
  const demoLogin = () => {
    loginDemo(phone)
    onClose()
    notify("已进入演示账号（演示版不发送短信、不需要验证码）", "ok", 4200)
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{tab === "login" ? "手机号登录" : "手机号注册"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={17} />
          </button>
        </div>
        <p className="modal-sub">登录后大纲、正文与写作记录将同步到你的账号</p>
        <div className="seg" style={{ marginBottom: 18 }}>
          <button className={tab === "login" ? "on" : ""} onClick={() => setTab("login")}>
            登录
          </button>
          <button className={tab === "register" ? "on" : ""} onClick={() => setTab("register")}>
            注册
          </button>
        </div>
        <div className="form-stack">
          <div className="field">
            <label htmlFor="phone">手机号</label>
            <input
              id="phone"
              className="input"
              placeholder="请输入 11 位手机号"
              value={phone}
              inputMode="numeric"
              maxLength={11}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="field">
            <label htmlFor="pwd">密码</label>
            <input
              id="pwd"
              className="input"
              type="password"
              placeholder={tab === "register" ? "设置密码（至少 6 位）" : "请输入密码"}
              value={pwd}
              autoComplete={tab === "register" ? "new-password" : "current-password"}
              onChange={(e) => setPwd(e.target.value)}
            />
          </div>
          {tab === "register" && (
            <div className="field">
              <label htmlFor="pwd2">确认密码</label>
              <input
                id="pwd2"
                className="input"
                type="password"
                placeholder="请再次输入密码"
                value={pwd2}
                autoComplete="new-password"
                onChange={(e) => setPwd2(e.target.value)}
              />
            </div>
          )}
          <button className="btn btn-primary btn-block btn-lg" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="spin" size={18} />}
            {busy ? "正在进入…" : tab === "register" ? "注册并登录" : "登录"}
          </button>
        </div>
        <button type="button" className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 12 }} onClick={demoLogin}>
          演示环境一键登录（免注册）
        </button>
        <div className="demo-hint">
          <b>演示说明：</b> 本前端为开源演示版，账号与数据仅保存在浏览器本地，<b>不发送短信、也不需要验证码</b>。首次使用请切到「注册」，用手机号设置一个密码；登录状态与写作记录保存在本浏览器，换设备或清理浏览器数据后需重新注册。
        </div>
        <div className="form-foot">
          <span style={{ color: "var(--ink-400)", fontWeight: 600 }}>登录即代表同意用户协议</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div>
            <Logo />
            <p className="footer-about">
              面向论文、报告与长文档的一站式 AI 学术写作工作台。从命题、大纲到全文、排版，
              让创作链路清晰可控。
            </p>
          </div>
          <div>
            <h5>产品能力</h5>
            <div className="footer-links">
              {PROD_LINKS.map((l) => (
                <a
                  key={l.label}
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToId(l.href.slice(1))
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5>使用帮助</h5>
            <div className="footer-links">
              {HELP_LINKS.map((l) => (
                <a
                  key={l.label}
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToId(l.href.slice(1))
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5>合规与联系</h5>
            <div className="footer-links">
              {LEGAL_LINKS.map((l) => (
                <a
                  key={l.label}
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToId(l.href.slice(1))
                  }}
                >
                  {l.label}
                </a>
              ))}
              <a href="mailto:hello@example.com" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Mail size={13} /> business@example.com
              </a>
            </div>
          </div>
        </div>
        <div className="disclaimer">
          学术诚信声明：本系统输出内容仅用于学习、研究与写作灵感参考，请严格遵循所在机构的学术规范与道德准则。
          我们不鼓励、也不支持任何违反学术诚信的行为。演示版生成内容与文献均为本地占位示意，不代表平台可交付的最终效果，
          实际功能以正式服务为准。
        </div>
        <div className="footer-bottom">
          <span>© 2026 升格智能论文系统 · 本站为开源演示版本</span>
          <span>React · Vite · Docker 一键部署</span>
        </div>
      </div>
    </footer>
  )
}

/* ---------- Toast ---------- */
export function ToastHost() {
  const { toasts } = useStore()
  const icons = {
    ok: <Check size={14} />,
    err: <AlertTriangle size={14} />,
    info: <Info size={14} />,
  }
  return (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => dismissToast(t.id)}>
          <span className="toast-icon">{icons[t.type]}</span>
          {t.text}
        </div>
      ))}
    </div>
  )
}

/* ---------- Reveal ---------- */
export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("in")
            io.disconnect()
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ "--d": `${delay}ms` }}>
      {children}
    </div>
  )
}

/* ---------- Section head ---------- */
export function SectionHead({ title, lead, light: _light = false, left = false }) {
  return (
    <div className={`section-head${left ? " left" : ""}`}>
      <h2>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  )
}

/* ---------- History section ---------- */
export function RecordRows({ limit = 4 }) {
  const { records } = useStore()
  const rows = records.slice(0, limit)
  return (
    <div className="record-list">
      {rows.map((r) => (
        <div className="record-row" key={r.id}>
          <div className="record-icon">
            <FileText size={19} />
          </div>
          <div className="record-main">
            <b>{r.title}</b>
            <span>
              {r.type} · {r.edu} · {r.words} · {formatTime(r.time)}
              {r.seed && " · 演示记录"}
            </span>
          </div>
          <div className="record-side">
            <span className={`badge${r.status === "已排版" ? " green" : ""}`}>{r.status}</span>
            <Link className="btn btn-soft btn-sm" to="/workspace">
              继续写作
              <ArrowUpRight size={14} />
            </Link>
            <button
              className="node-btn"
              style={{ width: 30, height: 30 }}
              title="删除记录"
              onClick={() => removeRecord(r.id)}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="empty-paper" style={{ minHeight: 180 }}>
          <div>
            <div className="ep-icon">
              <ShieldCheck size={30} />
            </div>
            <h3>还没有写作记录</h3>
            <p>去体验一次从大纲到全文的完整创作，记录会保存在这里。</p>
            <Link className="btn btn-primary" to="/workspace">
              开始创作 <Rocket size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
