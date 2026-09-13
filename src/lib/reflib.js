/* 真实文献：Crossref / DOI 检索（可联网核验）。知网条目请通过“粘贴知网导出”方式导入。 */

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/* 服务端爬虫：聚合 Crossref / OpenAlex / Semantic Scholar / PubMed（结果更全，且不受浏览器跨域限制） */
async function fetchFromCrawler(topic, limit) {
  const res = await fetch("./api/crawl.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refs", q: topic, limit }),
  })
  if (!res.ok) throw new Error(`crawler ${res.status}`)
  const data = await res.json()
  if (!data?.ok || !Array.isArray(data.refs) || !data.refs.length) throw new Error(data?.error || "crawler empty")
  return data.refs.map((r) => ({
    text: r.text,
    title: r.title,
    doi: r.doi || "",
    url: r.url || (r.doi ? `https://doi.org/${r.doi}` : ""),
    origin: r.origin || "crawler",
    source: r.source || "",
    year: r.year || "",
    real: true,
  }))
}

export async function fetchRealRefs(topic, limit = 12) {
  // 1) 优先走服务端爬虫（多源聚合）
  try {
    return await fetchFromCrawler(topic, Math.min(Number(limit) || 12, 20))
  } catch {
    /* 回退到浏览器直连 Crossref */
  }
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
