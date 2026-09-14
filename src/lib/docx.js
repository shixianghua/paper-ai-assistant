import JSZip from "jszip"

/* 原生 .docx（OOXML）导出：Word / WPS 双端 100% 还原排版
 * 依据：云南开放大学模板（学校名用"某某大学"）
 * 特点：原生分页符、原生页脚 PAGE 域（页码）、TOC 域 + updateFields（打开自动生成目录页码）、
 *      宋体/黑体、三号/小三/小四/五号、1.5 倍行距、首行缩进 2 字全部写入 styles.xml
 */

const TWIP_CM = 566.929

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const FONT_SONG = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体" w:cs="Times New Roman"/>`
const FONT_HEI = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="黑体" w:cs="Times New Roman"/>`
const FONT_FANG = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="仿宋_GB2312" w:cs="Times New Roman"/>`

/** 文本 run：font/字号(pt)/加粗 */
function run(text, { font = FONT_SONG, size = 12, bold = false, color = "" } = {}) {
  return `<w:r><w:rPr>${font}${bold ? "<w:b/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}<w:sz w:val="${size * 2}"/><w:szCs w:val="${size * 2}"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`
}

/** 段落：可选样式、对齐、缩进、行距、分页 */
function para(text, opt = {}) {
  const {
    style = "",
    align = "",
    font = FONT_SONG,
    size = 12,
    bold = false,
    firstLine = false,
    pageBreakBefore = false,
    spacing = { line: 360, lineRule: "auto" },
    outlineLvl = null,
    runs = "",
  } = opt
  const pPr = [
    style ? `<w:pStyle w:val="${style}"/>` : "",
    `<w:spacing w:line="${spacing.line}" w:lineRule="${spacing.lineRule}" w:before="0" w:after="0"/>`,
    align ? `<w:jc w:val="${align}"/>` : "",
    firstLine ? `<w:ind w:firstLineChars="200" w:firstLine="480"/>` : "",
    outlineLvl !== null ? `<w:outlineLvl w:val="${outlineLvl}"/>` : "",
    pageBreakBefore ? "<w:pageBreakBefore/>" : "",
  ].join("")
  const body = runs || run(text, { font, size, bold })
  return `<w:p><w:pPr>${pPr}</w:pPr>${body}</w:p>`
}

const pageBreak = () => `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`

/** 目录域：Word/WPS 打开时按 updateFields 自动生成（含真实页码） */
function tocField() {
  return `<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr>
<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>
<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:rPr>${FONT_SONG}<w:sz w:val="24"/></w:rPr><w:t>（打开文档后目录会在此自动生成，如未显示请按 Ctrl+A 再按 F9 更新域）</w:t></w:r>
<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`
}

function pngSize(dataUrl) {
  try {
    const b64 = String(dataUrl).split(",")[1]
    const bin = atob(b64.slice(0, 64))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
    const w = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]
    const h = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]
    return { w, h }
  } catch {
    return { w: 1240, h: 600 }
  }
}

/** 内嵌图片段落：14cm 宽，等比高 */
function imagePara(relId, dataUrl, index) {
  const { w, h } = pngSize(dataUrl)
  const cx = Math.round(14 * 360000)
  const cy = Math.round((cx * h) / Math.max(1, w))
  return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="120" w:after="60"/></w:pPr>
<w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">
<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${index}" name="Picture ${index}"/>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${index}" name="chart${index}.png"/><pic:cNvPicPr/></pic:nvPicPr>
<pic:blipFill><a:blip r:embed="${relId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>
</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
}

function tableXml(t, label) {
  const bd = `<w:tblBorders><w:top w:val="single" w:sz="12" w:color="000000"/><w:bottom w:val="single" w:sz="12" w:color="000000"/><w:insideH w:val="none"/><w:insideV w:val="none"/><w:left w:val="none"/><w:right w:val="none"/></w:tblBorders>`
  const cap = para(label, { align: "center", size: 10.5, font: FONT_SONG })
  const head = (t.headers || [])
    .map(
      (h) =>
        `<w:tc><w:tcPr><w:tcBorders><w:bottom w:val="single" w:sz="6" w:color="000000"/></w:tcBorders><w:vAlign w:val="center"/></w:tcPr>${para(h, { align: "center", size: 10.5, bold: true, spacing: { line: 240, lineRule: "auto" } })}</w:tc>`,
    )
    .join("")
  const rows = (t.rows || [])
    .map(
      (r, ri) =>
        `<w:tr>${r
          .map(
            (c) =>
              `<w:tc><w:tcPr>${ri === (t.rows || []).length - 1 ? '<w:tcBorders><w:bottom w:val="single" w:sz="12" w:color="000000"/></w:tcBorders>' : ""}<w:vAlign w:val="center"/></w:tcPr>${para(c, { align: "center", size: 10.5, spacing: { line: 240, lineRule: "auto" } })}</w:tc>`,
          )
          .join("")}</w:tr>`,
    )
    .join("")
  return `${cap}<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${bd}</w:tblPr><w:tblGrid><w:gridCol w:w="2000"/></w:tblGrid><w:tr>${head}</w:tr>${rows}</w:tbl>`
}

/** 生成 docx 的所有部件（content 为 document.xml 内容） */
export function buildDocxFiles(doc, fmtKey, images = []) {
  const chapters = doc.sections || []
  const isCollege = fmtKey === "ynou-college"
  const h1Size = isCollege ? 18 : 16
  const parts = []

  // —— 封面 ——
  parts.push(para("某某大学", { align: "center", font: FONT_HEI, size: 28, spacing: { line: 240, lineRule: "auto" } }))
  parts.push(
    para(isCollege ? "专科毕业论文（设计）" : fmtKey === "ynou-degree" ? "学士学位论文" : "本科毕业论文", {
      align: "center",
      font: FONT_HEI,
      size: 22,
      spacing: { line: 240, lineRule: "auto" },
    }),
  )
  parts.push(para("", { spacing: { line: 480, lineRule: "auto" } }))
  parts.push(para(`题目：${doc.title}`, { align: "center", font: FONT_HEI, size: 16 }))
  parts.push(para("", { spacing: { line: 480, lineRule: "auto" } }))
  ;["办学单位", "专业", "毕业时间", "学号", "姓名", "指导教师姓名（职称）"].forEach((f) => {
    parts.push(para(`${f}：　　　　　　　　　　`, { align: "center", font: FONT_HEI, size: 14 }))
  })
  parts.push(para("", { spacing: { line: 480, lineRule: "auto" } }))
  parts.push(para("论文完成时间：　　　　年　　　月", { align: "center", font: FONT_HEI, size: 14 }))
  parts.push(pageBreak())

  // —— 原创性声明 + 版权使用授权声明 ——
  const kindWord = fmtKey === "ynou-degree" ? "学位论文" : "毕业论文"
  parts.push(para(`${kindWord}原创性声明`, { align: "center", font: FONT_HEI, size: 16, bold: true }))
  parts.push(
    para(
      `本人郑重声明：所呈交的${kindWord}，是本人在导师指导下，进行研究工作所取得的成果。除文中已经注明引用的内容外，本${kindWord}的研究成果不包含任何他人创作的、已公开发表或者没有公开发表的作品的内容。对本论文所涉及的研究工作做出贡献的其他个人和集体，均已在文中以明确方式标明。本${kindWord}原创性声明的法律责任由本人承担。`,
      { firstLine: true },
    ),
  )
  parts.push(para(""))
  parts.push(para("作者签名：　　　　　　　　　　日期：　　　　年　　月　　日", { align: "right" }))
  parts.push(pageBreak())
  parts.push(para(`${kindWord}版权使用授权声明`, { align: "center", font: FONT_HEI, size: 16, bold: true }))
  parts.push(
    para(
      `本人完全了解某某大学关于收集、保存、使用${kindWord}的规定，同意如下各项内容：按照学校要求提交${kindWord}的印刷本和电子版本；学校有权保存${kindWord}的印刷本和电子版，并采用影印、缩印、扫描、数字化或其它手段保存论文；学校有权提供目录检索以及提供本${kindWord}全文或者部分的阅览服务，以及出版${kindWord}；学校有权按有关规定向国家有关部门或者机构送交论文的复印件和电子版；在不以赢利为目的的前提下，学校可以适当复制论文的部分或全部内容用于学术活动。`,
      { firstLine: true },
    ),
  )
  parts.push(para(""))
  parts.push(para("作者签名：　　　　　　　　　　日期：　　　　年　　月　　日", { align: "right" }))
  parts.push(pageBreak())

  // —— 摘要 ——
  parts.push(para("摘　要", { align: "center", font: FONT_HEI, size: isCollege ? 18 : 16, bold: true }))
  parts.push(para(doc.abstract || "", { firstLine: true, size: isCollege ? 14 : 12, spacing: isCollege ? { line: 360, lineRule: "auto" } : { line: 440, lineRule: "exact" } }))
  parts.push(para("", { spacing: { line: 360, lineRule: "auto" } }))
  parts.push(
    para(`关键词：${(doc.keywords || []).join("；")}`, {
      font: isCollege ? FONT_HEI : FONT_FANG,
      size: isCollege ? 14 : 12,
    }),
  )
  parts.push(pageBreak())

  // —— 目录（TOC 域，打开自动生成页码） ——
  parts.push(para("目　录", { align: "center", font: FONT_HEI, size: 18, bold: true }))
  parts.push(tocField())
  parts.push(pageBreak())

  // —— 正文 ——
  let figNo = 0
  chapters.forEach((s, i) => {
    if (i > 0) parts.push(pageBreak())
    parts.push(para(s.title, { font: FONT_HEI, size: h1Size, outlineLvl: 0, style: "Heading1" }))
    let figIn = 0
    let tblIn = 0
    ;(s.blocks || []).forEach((b) => {
      if (b.kind === "h4") {
        const raw = String(b.text || "")
        const m = raw.match(/^(\d+)((?:[.．]\d+)*)/)
        const level = m ? (m[2] ? m[2].split(/[.．]/).length + 1 : 1) : 2
        const body = raw.replace(/^\d+(?:[.．]\d+)*\s*/, "").trim() || raw
        const label = level <= 1 ? `一、${body}` : level === 2 ? `（一）${body}` : `${m ? m[2].split(/[.．]/).filter(Boolean).slice(-1)[0] : ""}. ${body}`
        parts.push(para(label, { font: FONT_HEI, size: level === 2 ? 15 : 12, outlineLvl: Math.min(8, level), style: `Heading${Math.min(3, level + 1)}` }))
      } else if (b.kind === "p" || b.kind === "src") {
        parts.push(para(b.text || "", { firstLine: b.kind === "p", size: b.kind === "src" ? 9 : 12 }))
      } else if (b.kind === "table" && b.table) {
        tblIn += 1
        parts.push(tableXml(b.table, `表${i + 1}.${tblIn}　${b.table.title || ""}`))
      } else if (b.kind === "figure" && b.figure) {
        const slot = figNo
        figNo += 1
        figIn += 1
        const img = images[slot]
        if (img) parts.push(imagePara(`rId${100 + slot}`, img.dataUrl, slot + 1))
        parts.push(para(`图${i + 1}.${figIn}　${b.figure.title || ""}`, { align: "center", size: 10.5 }))
      }
    })
  })

  // —— 参考文献 / 致谢 ——
  parts.push(pageBreak())
  parts.push(para("参考文献", { align: "center", font: FONT_HEI, size: 15, bold: true, outlineLvl: 0, style: "Heading1" }))
  ;(doc.refs || []).forEach((r, i) => {
    parts.push(para(`[${i + 1}] ${r}`, { size: 12, spacing: { line: 360, lineRule: "auto" } }))
  })
  parts.push(pageBreak())
  parts.push(para("致　谢", { align: "center", font: FONT_HEI, size: 15, bold: true, outlineLvl: 0, style: "Heading1" }))
  parts.push(para(doc.ack || "", { firstLine: true }))

  const sectPr = `<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${Math.round(2.5 * TWIP_CM)}" w:right="${Math.round(2.5 * TWIP_CM)}" w:bottom="${Math.round(2.0 * TWIP_CM)}" w:left="${Math.round(2.5 * TWIP_CM)}" w:header="850" w:footer="850" w:gutter="0"/><w:cols w:space="425"/><w:docGrid w:linePitch="312"/></w:sectPr>`

  return { body: parts.join(""), sectPr }
}

export const DOCX_NS = `xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"`


const STYLES_XML = (body) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="正文"/><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="标题 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/><w:spacing w:before="120" w:after="60" w:line="360" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="黑体"/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="标题 2"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="1"/><w:spacing w:before="120" w:after="60" w:line="360" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="黑体"/><w:sz w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="标题 3"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="2"/><w:spacing w:before="120" w:after="60" w:line="360" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="黑体"/><w:sz w:val="24"/></w:rPr></w:style>
</w:styles>`

const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:updateFields w:val="true"/><w:zoom w:percent="100"/></w:settings>`

const FOOTER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto"/></w:pPr>
<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/><w:sz w:val="21"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
<w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:rPr><w:rFonts w:eastAsia="宋体"/><w:sz w:val="21"/></w:rPr><w:t>1</w:t></w:r>
<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`

export async function buildDocxBlob(doc, fmtKey, images = []) {
  const { body, sectPr } = buildDocxFiles(doc, fmtKey, images)
  const zip = new JSZip()
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`,
  )
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  )
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${DOCX_NS}><w:body>${body}${sectPr}</w:body></w:document>`,
  )
  const rels = [
    `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    `<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>`,
    `<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>`,
  ]
  images.forEach((img, i) => {
    rels.push(`<Relationship Id="rId${100 + i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/chart${i + 1}.png"/>`)
    zip.file(`word/media/chart${i + 1}.png`, img.dataUrl.split(",")[1], { base64: true })
  })
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join("")}</Relationships>`,
  )
  zip.file("word/styles.xml", STYLES_XML())
  zip.file("word/settings.xml", SETTINGS_XML)
  zip.file("word/footer1.xml", FOOTER_XML)
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}
