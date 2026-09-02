/* 演示版图表：输出可渲染的 SVG 字符串，网页与 Word 导出均使用 */

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function figFlow({ title, steps = [] }) {
  const w = 620
  const h = 150
  const n = Math.max(steps.length, 1)
  const bw = Math.min(150, Math.floor((w - (n + 1) * 22) / n))
  const bh = 52
  const y = 42
  let x = 16
  let nodes = ""
  let arrows = ""
  steps.forEach((s, i) => {
    nodes += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="#eef0ff" stroke="#6366f1" stroke-width="1.4"/>
      <text x="${x + bw / 2}" y="${y + bh / 2 + 4}" text-anchor="middle" font-size="12.5" fill="#312e81" font-family="'Noto Sans SC','Microsoft YaHei',sans-serif">${esc(s)}</text>`
    if (i < steps.length - 1) {
      const ax = x + bw + 5
      arrows += `<line x1="${ax}" y1="${y + bh / 2}" x2="${ax + 12}" y2="${y + bh / 2}" stroke="#a5b4fc" stroke-width="1.8"/>
        <path d="M${ax + 11} ${y + bh / 2 - 5} L${ax + 17} ${y + bh / 2} L${ax + 11} ${y + bh / 2 + 5}" fill="none" stroke="#a5b4fc" stroke-width="1.8"/>`
    }
    x += bw + 22
  })
  return {
    title,
    svg: `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${arrows}${nodes}</svg>`,
  }
}

export function figBar({ title, categories = [], series = [], unit = "" }) {
  const w = 620
  const h = 300
  const padL = 56
  const padR = 16
  const padT = 30
  const padB = 62
  const cw = w - padL - padR
  const ch = h - padT - padB
  const maxVal = Math.max(1, ...series.flatMap((s) => s.values))
  const cols = Math.max(categories.length, 1)
  const groupW = cw / cols
  const barW = Math.min(34, (groupW - 24) / Math.max(series.length, 1))
  let body = ""
  // 网格与纵轴
  for (let i = 0; i <= 4; i += 1) {
    const yy = padT + ch - (ch * i) / 4
    body += `<line x1="${padL}" y1="${yy}" x2="${w - padR}" y2="${yy}" stroke="#e7e9f2" stroke-width="1"/>
      <text x="${padL - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#6b7280">${Math.round((maxVal * i) / 4)}</text>`
  }
  series.forEach((s, si) => {
    s.values.forEach((v, ci) => {
      const x = padL + groupW * ci + 12 + si * (barW + 4)
      const bh = (v / maxVal) * ch
      const yy = padT + ch - bh
      body += `<rect x="${x}" y="${yy}" width="${barW}" height="${Math.max(bh, 1)}" rx="3" fill="${s.color}" opacity="0.92">
        <title>${esc(s.name)} ${v}${esc(unit)}</title></rect>`
    })
  })
  const legend = series
    .map(
      (s, i) =>
        `<rect x="${w / 2 - series.length * 60 + i * 120}" y="${h - 34}" width="12" height="12" rx="3" fill="${s.color}"/>
         <text x="${w / 2 - series.length * 60 + i * 120 + 17}" y="${h - 24}" font-size="12" fill="#374151" font-family="'Noto Sans SC','Microsoft YaHei',sans-serif">${esc(s.name)}</text>`,
    )
    .join("")
  const cats = categories
    .map(
      (c, ci) =>
        `<text x="${padL + groupW * ci + groupW / 2}" y="${h - padB + 26}" text-anchor="middle" font-size="12" fill="#374151" font-family="'Noto Sans SC','Microsoft YaHei',sans-serif">${esc(c)}</text>`,
    )
    .join("")
  return {
    title,
    svg: `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${body}${cats}${legend}</svg>`,
  }
}

export function figArch({ title, layers = [] }) {
  const w = 620
  const h = 110 + layers.length * 56
  const boxW = 380
  const x = (w - boxW) / 2
  let body = ""
  layers.forEach((l, i) => {
    const yy = 34 + i * 56
    body += `<rect x="${x}" y="${yy}" width="${boxW}" height="40" rx="10" fill="${i % 2 ? "#f5f3ff" : "#eef2ff"}" stroke="#818cf8" stroke-width="1.4"/>
      <text x="${w / 2}" y="${yy + 25}" text-anchor="middle" font-size="13" fill="#312e81" font-weight="700" font-family="'Noto Sans SC','Microsoft YaHei',sans-serif">${esc(l)}</text>`
    if (i < layers.length - 1) {
      body += `<line x1="${w / 2}" y1="${yy + 40}" x2="${w / 2}" y2="${yy + 56}" stroke="#a5b4fc" stroke-width="1.6"/>`
    }
  })
  return {
    title,
    svg: `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${body}</svg>`,
  }
}
