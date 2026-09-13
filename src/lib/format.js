/* 升格智能论文系统 · 排版格式引擎
 *
 * 依据来源（2026-09 联网抓取的官方发布原文）：
 *  [1] 咸阳开放大学《国家开放大学本科毕业论文格式》
 *      https://xy.ousn.edu.cn/info/1026/1533.htm （含官方模板附件）
 *  [2] 郑州工程技术学院开放教育学院《国家开放大学学位论文写作形式要求》
 *      https://open.zzut.edu.cn/info/1084/2977.htm
 *
 * 官方要点（照抄规范，不做发挥）：
 *  · 封面题名页：国家开放大学 / 本科毕业论文 / 论文标题（小二号黑体居中）/ 副标题（三号黑体居中）/
 *    分部·学习中心·专业·年级·学号·姓名·指导教师 / 论文完成日期
 *  · 摘要 300 字以内、小四号宋体、首行缩进两字符；关键词 3–7 个
 *  · 目录按三级标题编排，从正文开始编页码，目录与摘要不编页码，小四号宋体
 *  · 四级标题：一、（此处用顿号）／（一）（不加符号）／1.（此处用点号）／（1）（不加符号）
 *  · 各级标题前均缩进两字空格；正文用小四号宋体；行间距 24 磅；段前缩进两字符
 *  · 一级标题四号黑体（单行），二三级标题后不换行
 *  · 参考文献小四号宋体、顺序编码制 [序号]、GB/T 7714、不少于 10 篇
 *  · 学位论文版面：A4，页边距上下 2.6cm、左右 3cm，页眉页脚 1.8cm，正文小四宋体、1.5 倍行距、段间距 0
 *  · 学位论文标题：1 级小二黑体加粗（段前段后 24 磅）／2 级小三黑体加粗（18 磅）／
 *    3 级小四黑体加粗（12 磅）／4 级小四楷体加粗
 *  · 图题置于图下方居中（图1）；表题置于表上方居中（表1）
 */

export const PAPER_FORMATS = [
  {
    key: "ynou-bachelor",
    label: "某某大学 · 本科毕业论文",
    desc: "云开模板：封面（题目/办学单位/专业/毕业时间/学号/姓名/指导教师）+ 原创性声明 + 版权使用授权声明 + 摘要 + 目录（含页码）+ 正文（一、/（一）/1.）+ 参考文献 + 致谢",
  },
  {
    key: "ynou-degree",
    label: "某某大学 · 学士学位论文",
    desc: "云开模板：摘要单独成页（三号黑体）· 目录含页码 · 每章另起一页（章标题三号黑体）· 图表按章编号（图1.2/表2.3）· 正文小四宋体1.5倍行距",
  },
  {
    key: "ynou-college",
    label: "某某大学 · 专科毕业论文（设计）",
    desc: "云开模板：摘要（小二黑体居中，正文四号宋体）· 目录含页码 · 章标题小二黑体 · 页码从正文第 1 页起",
  },
  {
    key: "generic",
    label: "通用院校格式（章-节式）",
    desc: "第一章 / 1.1 式标题，适合非国开院校与期刊投稿",
  },
]

const LS_FORMAT = "sg.paper.format"

/** 是否为「某某大学（云开模板）」系列格式 */
export function isYnouFormat(key) {
  return key === "ynou-bachelor" || key === "ynou-degree" || key === "ynou-college"
}
/** 兼容旧命名 */
export const isOucFormat = isYnouFormat

export function getPaperFormat() {
  try {
    const v = localStorage.getItem(LS_FORMAT)
    return PAPER_FORMATS.some((f) => f.key === v) ? v : "ynou-bachelor"
  } catch {
    return "ynou-bachelor"
  }
}

export function savePaperFormat(key) {
  try {
    if (PAPER_FORMATS.some((f) => f.key === key)) localStorage.setItem(LS_FORMAT, key)
  } catch {
    /* 忽略隐私模式写入失败 */
  }
}

export function formatLabel(key) {
  const hit = PAPER_FORMATS.find((f) => f.key === key)
  return hit ? hit.label : PAPER_FORMATS[0].label
}

/* 云开模板封面字段（本科/学位/专科通用） */
export const YNU_COVER_FIELDS = ["办学单位", "专业", "毕业时间", "学号", "姓名", "指导教师姓名（职称）"]
/** 兼容旧命名 */
export const OUC_COVER_FIELDS = YNU_COVER_FIELDS

/* ---------- 编号工具 ---------- */

const CN_DIGITS = "一二三四五六七八九十"

export function cnNum(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v < 1) return ""
  if (v <= 10) return v === 10 ? "十" : CN_DIGITS[v - 1]
  if (v < 20) return `十${CN_DIGITS[v - 11]}`
  if (v < 100) {
    const tens = CN_DIGITS[Math.floor(v / 10) - 1]
    const ones = v % 10 ? CN_DIGITS[(v % 10) - 1] : ""
    return `${tens}十${ones}`
  }
  return String(v)
}

// 去掉“第一章 / 1.1 / （一） / 一、”等已有编号，便于按国开层级重新编号
export function stripHeadPrefix(title) {
  return String(title || "")
    .replace(/^第\s*[一二三四五六七八九十百零\d]+\s*[章节点节部分篇]\s*[、.．:：]?\s*/, "")
    .replace(/^[（(]\s*[一二三四五六七八九十\d]+\s*[）)]\s*/, "")
    .replace(/^[一二三四五六七八九十]+\s*[、.．]\s*/, "")
    .replace(/^\d+(?:[.．]\d+)*\s*[、.．]?\s*/, "")
    .replace(/^[.．、]\s*/, "")
    .trim()
}

// 解析“1.6 本章小结”这类小节编号层级：1 → 一级，2 → 二级，3 → 三级
export function headInfo(text) {
  const raw = String(text || "").trim()
  const m = raw.match(/^(\d+)((?:[.．]\d+)*)[\s、.．]*/)
  if (!m) return { level: null, ordinal: null, tail: raw }
  const parts = m[2] ? m[2].split(/[.．]/).filter(Boolean) : []
  const tail = raw.slice(m[0].length).trim() || raw
  return {
    level: parts.length + 1,
    ordinal: Number(parts.length ? parts[parts.length - 1] : m[1]),
    tail,
  }
}

// 章标题：第一章 绪论 → 一、绪论（云开）；通用格式保持原样
export function chapterLabel(index, title, fmtKey = "ynou-bachelor") {
  if (!isOucFormat(fmtKey)) return String(title || "")
  return `${cnNum(index + 1)}、${stripHeadPrefix(title)}`
}

// 小节标题：1.6 本章小结 → （六）本章小结；1.6.1 → 1. 三级标题
export function blockHeadLabel(text, fmtKey = "ynou-bachelor") {
  const raw = String(text || "").trim()
  if (!isOucFormat(fmtKey)) return raw
  const info = headInfo(raw)
  const body = stripHeadPrefix(info.tail || raw)
  if (!info.level || !info.ordinal) return body
  if (info.level <= 1) return `${cnNum(info.ordinal)}、${body}`
  if (info.level === 2) return `（${cnNum(info.ordinal)}）${body}`
  if (info.level === 3) return `${info.ordinal}. ${body}`
  return `（${info.ordinal}）${body}`
}

function cleanCap(title) {
  return String(title || "")
    .replace(/^[图表]\s*[:：]?\s*\d*\s*/u, "")
    .replace(/（演示[^）]*）/g, "")
    .replace(/\(演示[^)]*\)/g, "")
    .trim()
}

export function figLabel(n, title, fmtKey = "ynou-bachelor", chapterNo = 0) {
  const t = cleanCap(title)
  if (!isOucFormat(fmtKey)) return `图：${t}`
  // 云开规范：图、表按章编号，如 图1.2、表2.3
  return `图${chapterNo > 0 ? `${chapterNo}.${n}` : n}　${t}`
}

export function tableLabel(n, title, fmtKey = "ynou-bachelor", chapterNo = 0) {
  const t = cleanCap(title)
  if (!isOucFormat(fmtKey)) return `表：${t}`
  return `表${chapterNo > 0 ? `${chapterNo}.${n}` : n}　${t}`
}

/* ---------- Word 导出 ---------- */

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

const FONT = {
  song: '"宋体",SimSun,"Times New Roman",serif',
  hei: '"黑体",SimHei,"Microsoft YaHei",sans-serif',
  kai: '"楷体",KaiTi,"楷体_GB2312",serif',
  fang: '"仿宋_GB2312",FangSong,"仿宋",serif',
}

function baseCss(fmtKey) {
  const degree = fmtKey === "ynou-degree"
  const college = fmtKey === "ynou-college"
  const yn = isOucFormat(fmtKey)
  // 云开：A4，页边距 上2.5 下2 左2.5 右2.5
  const margin = yn ? "2.5cm 2.5cm 2.0cm 2.5cm" : "2.54cm 3.17cm"
  const line = "1.5"
  const bodySize = "12.0pt"
  // 字号：小二18 三号16 小三15 四号14 小四12 五号10.5
  const h1Size = college ? "18.0pt" : "16.0pt" // 专科一级标题小二黑体；本科/学位三号黑体
  const absTitleSize = college ? "18.0pt" : "16.0pt"
  const absBodySize = college ? "14.0pt" : "12.0pt"
  return `
  @page WordSection1{
    size:21.0cm 29.7cm;
    margin:${margin};
    mso-header-margin:1.8cm;
    mso-footer-margin:1.5cm;
    mso-footer:f1;
  }
  div.WordSection1{page:WordSection1;}
  body{font-family:${FONT.song};font-size:${bodySize};color:#000;}
  p{margin:0;text-align:justify;}
  /* 正文：宋体 小四，1.5 倍行距，首行缩进 2 字 */
  .body{font-family:${FONT.song};font-size:${bodySize};line-height:${line};mso-line-height-rule:auto;text-indent:24.0pt;margin:0;}
  /* 摘要 / 目录 / 参考文献 / 致谢 标题 */
  .sec-title{font-family:${FONT.hei};font-size:18.0pt;font-weight:bold;text-align:center;text-indent:0;line-height:1.5;margin:0 0 18.0pt;letter-spacing:6.0pt;}
  .sec-title.abs{font-size:${absTitleSize};letter-spacing:3.0pt;}
  /* 章节标题：一级 三号黑体（专科小二）／二级 小三黑体／三级 小四黑体，均居左 */
  .h1{font-family:${FONT.hei};font-size:${h1Size};font-weight:normal;line-height:${line};text-indent:0;text-align:left;margin:12.0pt 0 6.0pt;}
  .h2{font-family:${FONT.hei};font-size:15.0pt;font-weight:normal;line-height:${line};text-indent:0;text-align:left;margin:12.0pt 0 6.0pt;}
  .h3{font-family:${FONT.hei};font-size:12.0pt;font-weight:normal;line-height:${line};text-indent:0;text-align:left;margin:12.0pt 0 6.0pt;}
  .h4{font-family:${FONT.hei};font-size:12.0pt;text-indent:24.0pt;text-align:left;line-height:${line};}
  .abs-body{font-family:${FONT.song};font-size:${absBodySize};line-height:${college ? line : "22.0pt"};${college ? "mso-line-height-rule:auto;" : "mso-line-height-rule:exactly;"}text-indent:${college ? "28.0pt" : "24.0pt"};}
  .kw{font-size:${absBodySize};text-indent:0;margin:12.0pt 0 0;}
  .kw b{font-family:${college ? FONT.hei : FONT.fang};font-weight:bold;}
  /* 目录：条目 + 页码（PAGEREF 域） */
  .toc1{font-family:${FONT.hei};font-size:12.0pt;text-indent:0;margin:0 0 3.0pt;line-height:1.5;}
  .toc2{font-family:${FONT.song};font-size:12.0pt;text-indent:24.0pt;margin:0 0 2.0pt;line-height:1.5;}
  .toc3{font-family:${FONT.song};font-size:12.0pt;text-indent:48.0pt;margin:0 0 2.0pt;line-height:1.5;}
  .toc-page{font-family:${FONT.song};font-size:12.0pt;}
  .toc-tip{font-size:9.0pt;color:#666;text-indent:0;margin-top:12.0pt;text-align:center;}
  .fig{text-align:center;text-indent:0;margin:8.0pt 0 4.0pt;}
  .chart{width:14.0cm;height:auto;}
  /* 图名/表名：五号（专科用黑体，其余宋体），居中 */
  .fig-cap{font-family:${college ? FONT.hei : FONT.song};font-size:10.5pt;text-align:center;text-indent:0;margin:0 0 10.0pt;line-height:1.5;}
  .tbl-cap{font-family:${college ? FONT.hei : FONT.song};font-size:10.5pt;text-align:center;text-indent:0;margin:8.0pt 0 4.0pt;line-height:1.5;}
  /* 三线表：顶线、栏目线、底线，无竖线；表内文字五号宋体 */
  table.data{border-collapse:collapse;width:100%;margin:0 0 6.0pt;font-family:${FONT.song};font-size:10.5pt;}
  table.data th,table.data td{border:none;padding:3.0pt 5.0pt;text-align:center;vertical-align:middle;line-height:1.4;}
  .src-note{font-family:${FONT.song};font-size:9.0pt;text-align:left;text-indent:0;margin:0 0 10.0pt;}
  .body sup,.fig-cap sup,.tbl-cap sup{font-size:9.0pt;}
  .MsoFootnoteText{font-family:${FONT.song};font-size:9.0pt;text-indent:0;margin:0;}
  .MsoFootnoteReference{vertical-align:super;}
  /* 参考文献：宋体小四，悬挂缩进 */
  .ref{font-family:${FONT.song};font-size:12.0pt;line-height:${line};margin:0 0 3.0pt;padding-left:24.0pt;text-indent:-24.0pt;text-align:left;}
  .note{font-size:9.0pt;color:#666;text-indent:0;margin-top:8.0pt;}
  .cover{text-align:center;}
  .cov-org{font-family:${FONT.hei};font-size:28.0pt;letter-spacing:6.0pt;margin-top:60.0pt;text-indent:0;text-align:center;}
  .cov-kind{font-family:${FONT.hei};font-size:22.0pt;letter-spacing:6.0pt;margin-top:16.0pt;text-indent:0;text-align:center;}
  .cov-title{font-family:${FONT.hei};font-size:16.0pt;margin:56.0pt 0 0;text-indent:0;text-align:center;line-height:2.0;}
  .cov-sub{font-family:${FONT.hei};font-size:14.0pt;margin-top:8.0pt;text-indent:0;text-align:center;}
  .cov-fields{font-family:${FONT.hei};font-size:14.0pt;line-height:2.2;margin-top:40.0pt;text-indent:0;text-align:center;}
  .cov-date{font-family:${FONT.hei};font-size:14.0pt;margin-top:28.0pt;text-indent:0;text-align:center;}
  .sign{font-size:12.0pt;text-indent:0;text-align:right;margin-top:36.0pt;}
  .pb{page-break-before:always;}
  .decl-title{font-family:${FONT.hei};font-size:16.0pt;font-weight:bold;text-align:center;text-indent:0;margin:12.0pt 0 18.0pt;}
  `
}

// Word（含较老版本与 WPS）对 HTML 里的 data:image 内嵌图片支持很差，
// 会显示成替代文字。这里改为 Word 原生支持的“单文件网页”格式（MHTML）：
// 正文 HTML 与每张 PNG 各自作为一个 MIME 部件，通过 Content-Location 引用。
const PB = '<p class="pb" style="page-break-before:always">&#160;</p>'

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(String(str ?? ""))
  let bin = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

function wrap76(b64) {
  const out = []
  for (let i = 0; i < b64.length; i += 76) out.push(b64.slice(i, i + 76))
  return out.join("\r\n")
}

export function packWordMhtml(html, images = []) {
  const boundary = `----=_NextPart_SG_${Date.now().toString(36).toUpperCase()}`
  const docUrl = "file:///C:/shengge-paper/doc.htm"
  const parts = [
    `MIME-Version: 1.0\r\nContent-Type: multipart/related; type="text/html"; boundary="${boundary}"\r\n\r\n`,
    `--${boundary}\r\nContent-Location: ${docUrl}\r\nContent-Type: text/html; charset="utf-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(utf8ToBase64(html))}\r\n`,
  ]
  images.forEach((img) => {
    const b64 = String(img.dataUrl || "").split(",")[1] || ""
    if (!b64) return
    parts.push(
      `--${boundary}\r\nContent-Location: file:///C:/shengge-paper/${img.name}\r\nContent-Type: image/png\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(b64)}\r\n`,
    )
  })
  parts.push(`--${boundary}--\r\n`)
  return parts.join("")
}

function coverHtml(doc, fmtKey) {
  if (isOucFormat(fmtKey)) {
    const kind =
      fmtKey === "ynou-degree" ? "学士学位论文" : fmtKey === "ynou-college" ? "专科毕业论文（设计）" : "本科毕业论文"
    const fields = YNU_COVER_FIELDS.map((f) => `${f}：${"　".repeat(8)}`).join("<br/>")
    return `
    <div class="cover">
      <p class="cov-org">某某大学</p>
      <p class="cov-kind">${kind}</p>
      <p class="cov-title">题目：${esc(doc.title)}</p>
      <p class="cov-fields">${fields}</p>
      <p class="cov-date">论文完成时间：　　　　年　　　月</p>
    </div>
    ${PB}`
  }
  return `
    <div class="cover">
      <p class="cov-kind">${esc(doc.metaLine || "")}</p>
      <p class="cov-title">${esc(doc.title)}</p>
    </div>
    ${PB}`
}

function declHtml(fmtKey) {
  if (!isOucFormat(fmtKey)) return ""
  const kindWord = fmtKey === "ynou-degree" ? "学位论文" : "毕业论文"
  return `
    <p class="decl-title">${kindWord}原创性声明</p>
    <p class="body">本人郑重声明：所呈交的${kindWord}，是本人在导师指导下，进行研究工作所取得的成果。除文中已经注明引用的内容外，本${kindWord}的研究成果不包含任何他人创作的、已公开发表或者没有公开发表的作品的内容。对本论文所涉及的研究工作做出贡献的其他个人和集体，均已在文中以明确方式标明。本${kindWord}原创性声明的法律责任由本人承担。</p>
    <p class="sign">作者签名：　　　　　　　　　　日期：　　　　年　　月　　日</p>
    ${PB}
    <p class="decl-title">${kindWord}版权使用授权声明</p>
    <p class="body">本人完全了解某某大学关于收集、保存、使用${kindWord}的规定，同意如下各项内容：按照学校要求提交${kindWord}的印刷本和电子版本；学校有权保存${kindWord}的印刷本和电子版，并采用影印、缩印、扫描、数字化或其它手段保存论文；学校有权提供目录检索以及提供本${kindWord}全文或者部分的阅览服务，以及出版${kindWord}；学校有权按有关规定向国家有关部门或者机构送交论文的复印件和电子版；在不以赢利为目的的前提下，学校可以适当复制论文的部分或全部内容用于学术活动。</p>
    <p class="sign">作者签名：　　　　　　　　　　日期：　　　　年　　月　　日</p>
    ${PB}`
}

export function buildPaperHtml(doc, fmtKey = "ynou-bachelor") {
  const fmt = PAPER_FORMATS.some((f) => f.key === fmtKey) ? fmtKey : "ynou-bachelor"
  const ouc = isOucFormat(fmt)
  let figNo = 0
  const footnotes = []
  const chapters = doc.sections || []

  // 目录页码：Word 域（PAGEREF），打开文档后按 Ctrl+A → F9 更新为真实页码
  const pageRef = (id) => `<span class="toc-page" style="mso-field-code:PAGEREF ${id} \\h">1</span>`

  const head = `<a style="mso-footnote-id:__ID__" href="#___ID__" name="_ftnref__N__" title=""><span class="MsoFootnoteReference"><span style="mso-special-character:footnote"></span></span></a>`

  // 正文：引用 [n] 上标、①②③ 注释标记 → Word 页下脚注
  const richText = (text, noteMap) => {
    let out = esc(text)
    out = out.replace(/\[(\d+(?:\s*[-,，]\s*\d+)*)\]/g, "<sup>[$1]</sup>")
    out = out.replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, (mark) => {
      const note = noteMap?.get(mark)
      if (!note) return `<sup>${mark}</sup>`
      const n = footnotes.length + 1
      const id = `ftn${n}`
      footnotes.push({ id, n, text: typeof note === "string" ? note : note.text })
      return head.replace(/__ID__/g, id).replace(/__N__/g, String(n))
    })
    return out
  }

  const noteMapOf = (blocks) => {
    const map = new Map()
    ;(blocks || [])
      .filter((b) => b.kind === "notes")
      .forEach((b) => {
        ;(b.items || []).forEach((it) => {
          const marker = typeof it === "string" ? (it.match(/[①②③④⑤⑥⑦⑧⑨⑩]/) || [""])[0] : it.marker
          const body = typeof it === "string" ? it.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, "") : it.text
          if (marker && body) map.set(marker, body)
        })
      })
    return map
  }

  const tableHtml = (t, label) => {
    const cell = "padding:3.0pt 5.0pt;text-align:center;vertical-align:middle;border-left:none;border-right:none;"
    const headCell = `${cell}border-top:1.5pt solid windowtext;border-bottom:0.75pt solid windowtext;font-family:${FONT.song};font-size:10.5pt;font-weight:bold;`
    const bodyCell = `${cell}border:none;font-family:${FONT.song};font-size:10.5pt;`
    const lastCell = `${cell}border-bottom:1.5pt solid windowtext;font-family:${FONT.song};font-size:10.5pt;`
    const heads = (t.headers || []).map((h) => `<th style="${headCell}">${esc(h)}</th>`).join("")
    const rows = (t.rows || [])
      .map((r, ri) => {
        const style = ri === (t.rows || []).length - 1 ? lastCell : bodyCell
        return `<tr>${r.map((c) => `<td style="${style}">${esc(c)}</td>`).join("")}</tr>`
      })
      .join("")
    return (
      `<p class="tbl-cap">${esc(label)}</p>` +
      `<table class="data" border="0" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">` +
      `<thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table>`
    )
  }

  // 图、表按章编号（图1.2、表2.3）
  const renderBlocks = (blocks, noteMap, chapterNo) => {
    let figIn = 0
    let tblIn = 0
    return (blocks || [])
      .map((b) => {
        if (b.kind === "h4") {
          const level = headInfo(b.text).level || 2
          const cls = ouc ? (level <= 1 ? "h2" : level === 2 ? "h3" : "h4") : "h3"
          return `<p class="${cls}">${esc(blockHeadLabel(b.text, fmt))}</p>`
        }
        if (b.kind === "p") return `<p class="body">${richText(b.text, noteMap)}</p>`
        if (b.kind === "src") return `<p class="src-note">${esc(b.text)}</p>`
        if (b.kind === "notes") return ""
        if (b.kind === "figure" && b.figure) {
          const slot = figNo
          figNo += 1
          figIn += 1
          return (
            `<p class="fig"><img class="chart" src="__CHART__${slot}__" alt="${esc(cleanCap(b.figure.title))}"/></p>` +
            `<p class="fig-cap">${esc(figLabel(figIn, b.figure.title, fmt, chapterNo))}</p>`
          )
        }
        if (b.kind === "table" && b.table) {
          tblIn += 1
          return tableHtml(b.table, tableLabel(tblIn, b.table.title, fmt, chapterNo))
        }
        return ""
      })
      .join("")
  }

  // 正文：另页开始；云开规范要求每章另起一页
  const body = chapters
    .map((s, i) => {
      const brk = ouc || i > 0 ? ` style="page-break-before:always"` : ""
      return (
        `<p class="h1"${brk}><a name="_TocCh${i + 1}"></a>${esc(chapterLabel(i, s.title, fmt))}</p>` +
        renderBlocks(s.blocks, noteMapOf(s.blocks), i + 1)
      )
    })
    .join("")

  // 目录：章 / 节 + 页码域
  const tocRows = [`<p class="toc1">摘　要${pageRef("_TocAbs")}</p>`]
  chapters.forEach((s, i) => {
    tocRows.push(`<p class="toc1">${esc(chapterLabel(i, s.title, fmt))}${pageRef(`_TocCh${i + 1}`)}</p>`)
    ;(s.blocks || [])
      .filter((b) => b.kind === "h4")
      .forEach((b) => {
        const level = headInfo(b.text).level || 2
        tocRows.push(`<p class="${level <= 1 ? "toc2" : "toc3"}">${esc(blockHeadLabel(b.text, fmt))}</p>`)
      })
  })
  tocRows.push(`<p class="toc1">参考文献${pageRef("_TocRefs")}</p>`)
  tocRows.push(`<p class="toc1">致　谢${pageRef("_TocAck")}</p>`)

  const abstract = `
    <p class="sec-title abs"><a name="_TocAbs"></a>摘　要</p>
    <p class="abs-body">${esc(doc.abstract)}</p>
    <p class="kw"><b>关键词：</b>${esc((doc.keywords || []).join("；"))}</p>
    ${PB}`

  const toc = `
    <p class="sec-title">目　录</p>
    ${tocRows.join("")}
    <p class="toc-tip">提示：目录页码为 Word 域，打开文档后按 Ctrl+A 再按 F9（或「引用 → 更新目录」）即可刷新为真实页码。</p>
    ${PB}`

  const refs = `
    ${PB}
    <p class="sec-title"><a name="_TocRefs"></a>参考文献</p>
    ${(doc.refs || []).map((r, i) => `<p class="ref">[${i + 1}] ${esc(r)}</p>`).join("")}
    ${doc.refsNote ? `<p class="note">${esc(doc.refsNote)}</p>` : ""}`

  const ack = `
    ${PB}
    <p class="sec-title"><a name="_TocAck"></a>致　谢</p>
    <p class="body">${esc(doc.ack || "")}</p>`

  const order = [coverHtml(doc, fmt), declHtml(fmt), abstract, toc, body, refs, ack]

  const footnoteList = footnotes.length
    ? `<div style="mso-element:footnote-list">${footnotes
        .map(
          (f) =>
            `<div style="mso-element:footnote" id="${f.id}"><p class="MsoFootnoteText"><a style="mso-footnote-id:${f.id}" href="#_ftnref${f.n}" name="_${f.id}" title=""><span class="MsoFootnoteReference"><span style="mso-special-character:footnote"></span></span></a> ${esc(f.text)}</p></div>`,
        )
        .join("")}</div>`
    : ""

  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>${baseCss(fmt)}</style></head><body><div class="WordSection1">${order.join("")}</div>${footnoteList}<div style='mso-element:footer' id="f1"><p class="MsoFooter" style='text-align:center;font-family:${FONT.song};font-size:10.5pt'><span style='mso-field-code:PAGE'>1</span></p></div></body></html>`
}
export function formatSpecSummary(key) {
  const fmt = PAPER_FORMATS.find((f) => f.key === key) || PAPER_FORMATS[0]
  const lines = [fmt.label, fmt.desc, ""]
  if (key === "ynou-degree") {
    lines.push(
      "版面：A4；页边距 上2.5cm 下2cm 左2.5cm 右2.5cm；左侧装订；页脚居中页码",
      "结构：封面 → 学位论文原创性声明 → 版权使用授权声明 → 中文摘要及关键词 → 目录 → 正文（每章另起一页）→ 参考文献 → 致谢",
      "摘要：单独成页，“摘要”三号黑体加粗居中（字间空 3 个半角字符）；正文宋体小四、1.5 倍行距、首行缩进 2 字；关键词 3—5 个，分号分隔",
      "目录：单独成页，“目录”小二号黑体居中（字间空 4 个半角字符），列出章节与页码（宋体小四）；页码为 Word 域，按 Ctrl+A→F9 更新",
      "正文：宋体小四、1.5 倍行距、段前段后 0、首行缩进 2 字；章标题黑体三号（另起一页）、节标题黑体小三、节中一级标题黑体四号，均居左",
      "图表：按章编号（图1.2、表2.3）；图名置于图下方居中、表名置于表上方居中，宋体五号；表内文字宋体五号",
      "引用：正文引用以右上角标 [1]、[2-4] 标注，与文末参考文献对应；参考文献按引用顺序编码",
      "参考文献：标题黑体小三居中；条目宋体小四、GB/T 7714 格式，不少于 10 篇",
    )
  } else if (key === "ynou-college") {
    lines.push(
      "版面：A4；页边距 上2.5cm 下2cm 左2.5cm 右2.5cm；页码从正文第 1 页起",
      "结构：封面 → 毕业论文（设计）原创性声明 → 版权使用授权声明 → 中文摘要及关键词 → 目录 → 正文 → 参考文献 → 致谢",
      "摘要：居中“摘要”小二号黑体加粗（字间空 3 个半角字符），下空一行为摘要内容（四号宋体）；关键词 3—5 个（“关键词：”四号黑体 + 四号宋体），不少于 300 字",
      "目录：小二号黑体居中（字间空 4 个半角字符），下空一行为章、节及页码；章标题小四黑体，节标题小四宋体",
      "正文：小四号宋体、1.5 倍行距、首行缩进；一级标题（章）小二号黑体居左、二级小三号黑体、三级小四号黑体",
      "图表：图题在图下方居中、表题在表上方居中，图名表名五号黑体；表内文字五号宋体；可按章编号",
      "参考文献：小四号宋体、GB/T 7714，按引用顺序 [1][2] 排列，不少于 10 篇",
    )
  } else if (key === "ynou-bachelor") {
    lines.push(
      "版面：A4；页边距 上2.5cm 下2cm 左2.5cm 右2.5cm；左侧装订；页脚居中页码",
      "结构：封面（题目/办学单位/专业/毕业时间/学号/姓名/指导教师姓名（职称）/论文完成时间）→ 毕业论文原创性声明 → 版权使用授权声明 → 摘要 → 目录 → 正文 → 参考文献 → 致谢",
      "摘要：约 300—400 字，宋体小四、固定行距 22 磅、首行缩进 2 字；关键词 3—5 个，仿宋_GB2312 小四，分号分隔",
      "目录：“目录”居中，列出章节与页码；一级条目小四黑体、二级条目小四宋体；页码为 Word 域",
      "正文：宋体小四、1.5 倍行距、段前段后 0、首行缩进 2 字；一级标题“一、”三号黑体居左、二级“（一）”小三黑体、三级“1.”小四黑体",
      "图表：按章编号（图2.1、表2.2）；图名在图下方居中、表名在表上方居中，宋体五号；表内文字宋体五号",
      "参考文献：标题黑体小三居中，条目宋体小四、GB/T 7714 格式，不少于 10 篇",
    )
  } else {
    lines.push("通用院校格式：第一章 / 1.1 式标题，正文小四宋体，通用 A4 页边距")
  }
  return lines.join("\n")
}
