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
    key: "ouc-bachelor",
    label: "国家开放大学 · 本科毕业论文",
    desc: "官方格式：一、（一）1.（1）四级标题 · 正文小四宋体 · 行距24磅 · 三线表/图题在下表题在上 · 页下脚注 · 含国开封面字段",
  },
  {
    key: "ouc-degree",
    label: "国家开放大学 · 学位论文",
    desc: "官方格式：A4 上下2.6cm左右3cm · 1.5倍行距 · 标题黑体分级 · 图表编号规范 · 页下脚注 · 含授权声明",
  },
  {
    key: "generic",
    label: "通用院校格式（章-节式）",
    desc: "第一章 / 1.1 式标题，适合非国开院校与期刊投稿",
  },
]

const LS_FORMAT = "sg.paper.format"

export function isOucFormat(key) {
  return key === "ouc-bachelor" || key === "ouc-degree"
}

export function getPaperFormat() {
  try {
    const v = localStorage.getItem(LS_FORMAT)
    return PAPER_FORMATS.some((f) => f.key === v) ? v : "ouc-bachelor"
  } catch {
    return "ouc-bachelor"
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

export const OUC_COVER_FIELDS = ["分部", "学习中心", "专业", "年级", "学号", "姓名", "指导教师"]

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

// 章标题：第一章 绪论 → 一、绪论（国开）；通用格式保持原样
export function chapterLabel(index, title, fmtKey = "ouc-bachelor") {
  if (!isOucFormat(fmtKey)) return String(title || "")
  return `${cnNum(index + 1)}、${stripHeadPrefix(title)}`
}

// 小节标题：1.6 本章小结 → （六）本章小结（国开二级）；1.6.1 → 1. 三级
export function blockHeadLabel(text, fmtKey = "ouc-bachelor") {
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

export function figLabel(n, title, fmtKey = "ouc-bachelor") {
  const t = cleanCap(title)
  return isOucFormat(fmtKey) ? `图${n}　${t}` : `图：${t}`
}

export function tableLabel(n, title, fmtKey = "ouc-bachelor") {
  const t = cleanCap(title)
  return isOucFormat(fmtKey) ? `表${n}　${t}` : `表：${t}`
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
}

function baseCss(fmtKey) {
  const degree = fmtKey === "ouc-degree"
  const ouc = isOucFormat(fmtKey)
  const margin = ouc ? "2.6cm 3.0cm" : "2.54cm 3.17cm"
  const line = degree ? "1.5" : "24.0pt"
  const bodySize = "12.0pt"
  return `
  @page WordSection1{
    size:21.0cm 29.7cm;
    margin:${margin};
    mso-header-margin:1.8cm;
    mso-footer-margin:1.8cm;
    mso-footer:f1;
  }
  div.WordSection1{page:WordSection1;}
  body{font-family:${FONT.song};font-size:${bodySize};color:#000;}
  p{margin:0;text-align:justify;}
  .body{font-family:${FONT.song};font-size:${bodySize};line-height:${line};${degree ? "mso-line-height-rule:auto;" : "mso-line-height-rule:exactly;"}text-indent:24.0pt;margin:0 0 ${degree ? "0" : "0"};}
  .sec-title{font-family:${FONT.hei};font-size:18.0pt;font-weight:bold;text-align:center;text-indent:0;line-height:1.0;margin:24.0pt 0 24.0pt;letter-spacing:2.0pt;}
  .h1{font-family:${FONT.hei};font-size:${degree ? "18.0pt" : "14.0pt"};font-weight:${degree ? "bold" : "normal"};line-height:${degree ? "1.0" : line};text-indent:24.0pt;text-align:left;margin:${degree ? "24.0pt 0 24.0pt" : "12.0pt 0 6.0pt"};}
  .h2{font-family:${degree ? FONT.hei : FONT.hei};font-size:${degree ? "15.0pt" : "12.0pt"};font-weight:bold;line-height:${degree ? "1.0" : line};text-indent:24.0pt;text-align:left;margin:${degree ? "18.0pt 0 18.0pt" : "6.0pt 0 3.0pt"};}
  .h3{font-family:${degree ? FONT.hei : FONT.song};font-size:${degree ? "12.0pt" : "12.0pt"};font-weight:bold;line-height:${degree ? "1.0" : line};text-indent:24.0pt;text-align:left;margin:${degree ? "12.0pt 0 12.0pt" : "6.0pt 0 3.0pt"};}
  .h4{font-family:${FONT.kai};font-size:12.0pt;font-weight:bold;text-indent:24.0pt;text-align:left;}
  .abs-body{font-family:${FONT.song};font-size:${degree ? "14.0pt" : "12.0pt"};line-height:${line};${degree ? "mso-line-height-rule:auto;" : "mso-line-height-rule:exactly;"}text-indent:24.0pt;}
  .kw{font-size:${degree ? "14.0pt" : "12.0pt"};text-indent:0;margin-left:24.0pt;margin-top:6.0pt;}
  .kw b{font-family:${FONT.hei};font-weight:bold;}
  .toc1{font-family:${FONT.hei};font-size:12.0pt;text-indent:0;margin:0 0 2.0pt;}
  .toc2{font-size:12.0pt;text-indent:24.0pt;margin:0;}
  .toc-tip{font-size:9.0pt;color:#666;text-indent:0;margin-top:12.0pt;}
  .fig{text-align:center;text-indent:0;margin:8.0pt 0 4.0pt;}
  .chart{width:14.0cm;height:auto;}
  .fig-cap{font-family:${FONT.song};font-size:10.5pt;text-align:center;text-indent:0;margin:0 0 10.0pt;}
  .tbl-cap{font-family:${FONT.song};font-size:10.5pt;text-align:center;text-indent:0;margin:8.0pt 0 4.0pt;}
  /* 三线表：顶线、栏目线、底线，无竖线（国家开放大学论文表格规范） */
  table.data{border-collapse:collapse;width:100%;margin:0 0 6.0pt;font-family:${FONT.song};font-size:10.5pt;}
  table.data th,table.data td{border:none;padding:3.0pt 5.0pt;text-align:center;vertical-align:middle;line-height:1.4;}
  .src-note{font-family:${FONT.song};font-size:9.0pt;text-align:left;text-indent:0;margin:0 0 10.0pt;}
  .body sup,.fig-cap sup,.tbl-cap sup{font-size:9.0pt;}
  .MsoFootnoteText{font-family:${FONT.song};font-size:9.0pt;text-indent:0;margin:0;}
  .MsoFootnoteReference{vertical-align:super;}
  .ref{font-family:${FONT.song};font-size:12.0pt;line-height:${line};text-indent:0;margin:0 0 3.0pt;padding-left:24.0pt;text-indent:-24.0pt;text-align:left;}
  .note{font-size:9.0pt;color:#666;text-indent:0;margin-top:8.0pt;}
  .cover{text-align:center;}
  .cov-org{font-family:${FONT.hei};font-size:22.0pt;letter-spacing:8.0pt;margin-top:72.0pt;text-indent:0;text-align:center;}
  .cov-kind{font-family:${FONT.hei};font-size:18.0pt;letter-spacing:4.0pt;margin-top:12.0pt;text-indent:0;text-align:center;}
  .cov-title{font-family:${FONT.hei};font-size:18.0pt;margin:72.0pt 0 0;text-indent:0;text-align:center;}
  .cov-sub{font-family:${FONT.hei};font-size:16.0pt;margin-top:8.0pt;text-indent:0;text-align:center;}
  .cov-fields{font-family:${FONT.hei};font-size:14.0pt;line-height:2.0;margin-top:48.0pt;text-indent:0;text-align:center;}
  .cov-date{font-family:${FONT.hei};font-size:14.0pt;margin-top:36.0pt;text-indent:0;text-align:center;}
  .sign{font-size:12.0pt;text-indent:0;text-align:right;margin-top:36.0pt;}
  .pb{page-break-before:always;}
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
    const kind = fmtKey === "ouc-degree" ? "学位论文" : "本科毕业论文"
    const fields = OUC_COVER_FIELDS.map((f) => `${f}：${"　".repeat(10)}`).join("<br/>")
    return `
    <div class="cover">
      <p class="cov-org">国家开放大学</p>
      <p class="cov-kind">${kind}</p>
      <p class="cov-title">${esc(doc.title)}</p>
      <p class="cov-fields">${fields}</p>
      <p class="cov-date">论文完成日期：　　　　年　　　月</p>
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
  const degree = fmtKey === "ouc-degree"
  const auth = degree
    ? `${PB}<p class="sec-title">授权声明</p>
       <p class="body">本人完全了解国家开放大学有关保留、使用学位论文的规定，同意学校保留并向有关部门送交论文的复印件和电子版，允许论文被查阅和借阅；本人授权国家开放大学可以将本论文的全部或部分内容编入有关数据库进行检索，可以采用影印、缩印或其他复制手段保存和汇编本论文。</p>
       <p class="sign">作者签名：　　　　　　　　　导师签名：　　　　　　　　　日期：　　　年　　月　　日</p>`
    : ""
  return `
    <p class="sec-title">原创性声明</p>
    <p class="body">本人郑重声明：所呈交的论文是本人在指导教师的指导下独立完成的研究成果。除文中已经注明引用的内容外，本论文不包含任何其他个人或集体已经发表或撰写过的研究成果，也不包含为获得国家开放大学或其他教育机构的学位或证书而使用过的材料。对本文的研究做出重要贡献的个人和集体，均已在文中以明确方式标明。</p>
    <p class="body">论文作者签名：　　　　　　　　　日期：　　　年　　月　　日</p>
    ${auth}`
}

export function buildPaperHtml(doc, fmtKey = "ouc-bachelor") {
  const fmt = PAPER_FORMATS.some((f) => f.key === fmtKey) ? fmtKey : "ouc-bachelor"
  const ouc = isOucFormat(fmt)
  let figNo = 0
  let tblNo = 0
  const footnotes = []

  const head = `<a style="mso-footnote-id:__ID__" href="#___ID__" name="_ftnref__N__" title=""><span class="MsoFootnoteReference"><span style="mso-special-character:footnote"></span></span></a>`

  // 正文：图表编号上标引用 [1]、②③④ 注释标记 → Word 页下脚注
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

  // 章节内 "注释：①……②……" 收集为页下脚注文本
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

  const renderBlocks = (blocks, noteMap) =>
    (blocks || [])
      .map((b) => {
        if (b.kind === "h4") {
          const label = blockHeadLabel(b.text, fmt)
          const cls = ouc ? (headInfo(b.text).level === 1 ? "h2" : "h3") : "h3"
          return `<p class="${cls}">${esc(label)}</p>`
        }
        if (b.kind === "p") return `<p class="body">${richText(b.text, noteMap)}</p>`
        if (b.kind === "src") return `<p class="src-note">${esc(b.text)}</p>`
        if (b.kind === "notes") return "" // 注释改为页下脚注，正文不再重复列出
        if (b.kind === "figure" && b.figure) {
          const n = figNo
          figNo += 1
          return (
            `<p class="fig"><img class="chart" src="__CHART__${n}__" alt="${esc(cleanCap(b.figure.title))}"/></p>` +
            `<p class="fig-cap">${esc(figLabel(n + 1, b.figure.title, fmt))}</p>`
          )
        }
        if (b.kind === "table" && b.table) {
          tblNo += 1
          return tableHtml(b.table, tableLabel(tblNo, b.table.title, fmt))
        }
        return ""
      })
      .join("")

  const chapters = doc.sections || []
  const body = chapters
    .map(
      (s, i) =>
        `<p class="h1">${esc(chapterLabel(i, s.title, fmt))}</p>${renderBlocks(s.blocks, noteMapOf(s.blocks))}`,
    )
    .join("")

  const tocRows = []
  chapters.forEach((s, i) => {
    tocRows.push(`<p class="toc1">${esc(chapterLabel(i, s.title, fmt))}</p>`)
    ;(s.blocks || [])
      .filter((b) => b.kind === "h4")
      .forEach((b) => tocRows.push(`<p class="toc2">${esc(blockHeadLabel(b.text, fmt))}</p>`))
  })
  tocRows.push(`<p class="toc1">参考文献</p>`)
  tocRows.push(`<p class="toc1">致谢</p>`)

  const abstract = `
    <p class="sec-title">摘　要</p>
    <p class="abs-body">${esc(doc.abstract)}</p>
    <p class="kw"><b>关键词：</b>${esc((doc.keywords || []).join(ouc ? "　" : "；"))}</p>
    ${PB}`

  const toc = `
    <p class="sec-title">目　录</p>
    ${tocRows.join("")}
    <p class="toc-tip">提示：目录页码可在 Word 中自动生成——全选后按 F9，或使用「引用 → 目录 → 自动目录」。</p>
    ${PB}`

  const refs = `
    ${PB}
    <p class="sec-title">参考文献</p>
    ${(doc.refs || []).map((r, i) => `<p class="ref">[${i + 1}] ${esc(r)}</p>`).join("")}
    ${doc.refsNote ? `<p class="note">${esc(doc.refsNote)}</p>` : ""}`

  const ack = `
    ${PB}
    <p class="sec-title">致　谢</p>
    <p class="body">${esc(doc.ack || "")}</p>`

  const order =
    fmt === "ouc-degree"
      ? [coverHtml(doc, fmt), declHtml(fmt), PB, toc, abstract, PB, body, refs, ack]
      : [coverHtml(doc, fmt), PB, declHtml(fmt), PB, abstract, toc, body, refs, ack]

  const footnoteList = footnotes.length
    ? `<div style="mso-element:footnote-list">${footnotes
        .map(
          (f) =>
            `<div style="mso-element:footnote" id="${f.id}"><p class="MsoFootnoteText"><a style="mso-footnote-id:${f.id}" href="#_ftnref${f.n}" name="_${f.id}" title=""><span class="MsoFootnoteReference"><span style="mso-special-character:footnote"></span></span></a> ${esc(f.text)}</p></div>`,
        )
        .join("")}</div>`
    : ""

  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>${baseCss(fmt)}</style></head><body><div class="WordSection1">${order.join("")}</div>${footnoteList}<div style='mso-element:footer' id="f1"><p class="MsoFooter" style='text-align:center;font-family:${FONT.song};font-size:9.0pt'><span style='mso-field-code:PAGE'>1</span></p></div></body></html>`
}

/* 供「材料清单」等文本文件使用 */
export function formatSpecSummary(key) {
  const fmt = PAPER_FORMATS.find((f) => f.key === key) || PAPER_FORMATS[0]
  const lines = [fmt.label, fmt.desc, ""]
  if (key === "ouc-degree") {
    lines.push(
      "版面：A4；页边距 上下 2.6cm、左右 3cm；页眉页脚 1.8cm",
      "正文：小四号宋体，1.5 倍行距，段间距 0，每段首行缩进 2 字",
      "标题：1 级小二黑体加粗（段前段后 24 磅）；2 级小三黑体加粗（18 磅）；3 级小四黑体加粗（12 磅）；4 级小四楷体加粗",
      "摘要 / 目录：小二黑体加粗居中，字间空一格，段前段后各 24 磅；摘要内容四号宋体",
      "关键词：四号黑体“关键词：”+ 四号宋体词条，分号分隔",
      "图题置于图下方居中，表题置于表上方居中",
      "图表编号：图 1、图 2……／表 1、表 2……（阿拉伯数字连续编号）；表格采用三线表，表内文字五号宋体；图表数据来源以小五号宋体标注在图/表下方",
      "注释：以脚注形式置于该页下方，小五号宋体，句末标明引用页码；正文引用标注以上标 [1] 形式与文末参考文献对应",
      "参考文献：GB/T 7714，按正文出现次序 [1][2] 排列，不少于 10 篇",
    )
  } else if (key === "ouc-bachelor") {
    lines.push(
      "版面：A4；页边距 上下 2.6cm、左右 3cm；页眉页脚 1.8cm",
      "标题层级：一、（此处用顿号）／（一）（不加符号）／1.（用点号）／（1）（不加符号）",
      "一级标题四号黑体（单行）；二三级标题后不换行；各级标题前缩进两字空格",
      "正文：小四号宋体，行间距 24 磅；段前缩进两字符",
      "摘要：300 字以内，小四号宋体，首行缩进两字符；关键词 3–7 个",
      "目录：按三级标题编排，从正文开始编页码，小四号宋体",
      "图表：图的编号与图题置于图下方居中（图 1……）；表的编号与表题置于表上方居中（表 1……）；表格采用三线表，表内文字五号宋体，数据来源用小五号宋体注明",
      "注释：一律采用页下脚注，格式参照参考文献并注明页码；申请学位的论文须有 3 处及以上注释；正文引用以上标 [序号] 标注并与文末参考文献对应",
      "参考文献：小四号宋体，顺序编码制 [序号]，不少于 10 篇",
      "封面：论文标题小二号黑体居中，副标题三号黑体居中，含分部/学习中心/专业/年级/学号/姓名/指导教师字段",
    )
  } else {
    lines.push("通用院校格式：第一章 / 1.1 式标题，正文小四宋体，通用 A4 页边距")
  }
  return lines.join("\n")
}
