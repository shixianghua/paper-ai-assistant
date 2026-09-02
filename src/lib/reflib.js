/* 真实文献：Crossref / DOI 检索（可联网核验）。知网条目请通过“粘贴知网导出”方式导入。 */

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export async function fetchRealRefs(topic, limit = 12) {
  const query = topic.replace(/[“”《》在中的运用研究基于与和]/g, " ").trim().slice(0, 60)
  const url =
    `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=${Math.min(Number(limit) || 12, 20)}` +
    `&select=DOI,title,author,container-title,issued,URL,type&mailto=thesis-builder%40example.com`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Crossref ${res.status}`)
  const data = await res.json()
  const items = data?.message?.items || []
  return items
    .filter((it) => it?.title?.[0])
    .slice(0, Math.min(Number(limit) || 12, 20))
    .map((it) => {
      const authors = (it.author || [])
        .slice(0, 3)
        .map((a) => `${a.family || ""} ${a.given || ""}`.trim())
        .filter(Boolean)
        .join(", ")
      const name = authors || "佚名"
      const year = it.issued?.["date-parts"]?.[0]?.[0] || ""
      const journal = it["container-title"]?.[0] || ""
      const title = it.title[0]
      const doi = (it.DOI || "").trim()
      const type = it.type
      const tag = type === "dissertation" ? "D" : "J"
      const base = `${name}. ${title}[${tag}${journal ? "/OL" : ""}].`
      const venue = journal ? `${journal}, ` : ""
      return {
        text: `${base}${venue}${year ? `${year}.` : ""} DOI: ${doi}`,
        title,
        doi,
        real: true,
      }
    })
}

export { esc }
