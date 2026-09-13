<?php
/* 真实文献 / 数据爬虫：聚合 Crossref、OpenAlex、Semantic Scholar、PubMed
 * 用法：POST /api/crawl.php  {"action":"refs","q":"课堂专注度 深度学习","limit":12}
 * 返回 GB/T 7714 著录格式的条目，供论文「参考文献」直接使用。
 */

require __DIR__ . '/config.php';

$in = body();
$action = param($in, 'action', 'refs');
$q = trim(param($in, 'q'));
$limit = min(30, max(5, (int) param($in, 'limit', '12')));

if ($q === '') {
    fail('缺少检索关键词');
}

/* ---------- 简单 HTTP GET（带 UA 与超时） ---------- */
function crawl_get(string $url, int $timeout = 8): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => ['User-Agent: ShenggePaperBot/1.0 (mailto:service@sgzxjy.com)', 'Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false) {
        return ['ok' => false, 'error' => $err ?: '请求失败'];
    }
    $json = json_decode($body, true);
    return ['ok' => $code >= 200 && $code < 300, 'status' => $code, 'data' => is_array($json) ? $json : null];
}

function gbt_authors(array $names, int $max = 3): string
{
    $names = array_values(array_filter(array_map('trim', $names)));
    if (!$names) {
        return '佚名';
    }
    $shown = array_slice($names, 0, $max);
    $text = implode(', ', $shown);
    return count($names) > $max ? $text . ', 等' : $text;
}

$refs = [];
$sources = ['crossref' => 0, 'openalex' => 0, 'semanticscholar' => 0, 'pubmed' => 0];
$seenDoi = [];
$seenTitle = [];

function push_ref(array &$refs, array &$seenDoi, array &$seenTitle, array $item): bool
{
    $title = trim(preg_replace('/\s+/', ' ', (string) ($item['title'] ?? '')));
    if ($title === '' || mb_strlen($title) < 6) {
        return false;
    }
    $doi = strtolower(trim((string) ($item['doi'] ?? '')));
    $key = mb_strtolower(preg_replace('/[^\p{Han}\p{L}\p{N}]+/u', '', $title));
    if (($doi !== '' && isset($seenDoi[$doi])) || isset($seenTitle[$key])) {
        return false;
    }
    if ($doi !== '') {
        $seenDoi[$doi] = true;
    }
    $seenTitle[$key] = true;
    $refs[] = $item;
    return true;
}

/* ---------- 1. Crossref ---------- */
$url = 'https://api.crossref.org/works?rows=' . $limit . '&select=DOI,title,author,container-title,issued,type,volume,issue,page'
    . '&mailto=service@sgzxjy.com&query.bibliographic=' . rawurlencode($q);
$res = crawl_get($url);
if (!empty($res['ok'])) {
    foreach (($res['data']['message']['items'] ?? []) as $it) {
        $authors = [];
        foreach (($it['author'] ?? []) as $a) {
            $authors[] = trim(($a['family'] ?? '') . ' ' . ($a['given'] ?? '')) ?: trim((string) ($a['name'] ?? ''));
        }
        $year = $it['issued']['date-parts'][0][0] ?? '';
        $journal = $it['container-title'][0] ?? '';
        $type = $it['type'] ?? '';
        $tag = $type === 'dissertation' ? 'D' : ($journal ? 'J' : 'M');
        $vol = trim((string) ($it['volume'] ?? ''));
        $iss = trim((string) ($it['issue'] ?? ''));
        $pages = trim((string) ($it['page'] ?? ''));
        $text = gbt_authors($authors) . '. ' . $it['title'][0] . '[' . $tag . ']. '
            . ($journal ? $journal . ', ' : '') . ($year ?: '')
            . ($vol !== '' ? ', ' . $vol : '') . ($iss !== '' ? '(' . $iss . ')' : '')
            . ($pages !== '' ? ': ' . $pages : '') . '.';
        if (push_ref($refs, $seenDoi, $seenTitle, [
            'text' => $text,
            'title' => $it['title'][0],
            'doi' => $it['DOI'] ?? '',
            'source' => $journal,
            'year' => $year,
            'origin' => 'crossref',
            'real' => true,
        ])) {
            $sources['crossref']++;
        }
    }
}

/* ---------- 2. OpenAlex ---------- */
$res = crawl_get('https://api.openalex.org/works?per-page=' . $limit . '&mailto=service@sgzxjy.com&search=' . rawurlencode($q));
if (!empty($res['ok'])) {
    foreach (($res['data']['results'] ?? []) as $it) {
        $authors = [];
        foreach (array_slice(($it['authorships'] ?? []), 0, 4) as $a) {
            $authors[] = $a['author']['display_name'] ?? '';
        }
        $year = $it['publication_year'] ?? '';
        $journal = $it['primary_location']['source']['display_name'] ?? '';
        $doi = preg_replace('#^https?://doi.org/#i', '', (string) ($it['doi'] ?? ''));
        $type = $it['type'] ?? '';
        $tag = $type === 'dissertation' ? 'D' : ($journal ? 'J' : 'M');
        $text = gbt_authors($authors) . '. ' . ($it['display_name'] ?? '') . '[' . $tag . ']. '
            . ($journal ? $journal . ', ' : '') . ($year ?: '') . '.';
        if (push_ref($refs, $seenDoi, $seenTitle, [
            'text' => $text,
            'title' => $it['display_name'] ?? '',
            'doi' => $doi,
            'source' => $journal,
            'year' => $year,
            'origin' => 'openalex',
            'real' => true,
        ])) {
            $sources['openalex']++;
        }
    }
}

/* ---------- 3. Semantic Scholar ---------- */
$res = crawl_get(
    'https://api.semanticscholar.org/graph/v1/paper/search?limit=' . $limit
    . '&fields=title,authors,year,venue,externalIds,publicationTypes&query=' . rawurlencode($q)
);
if (!empty($res['ok'])) {
    foreach (($res['data']['data'] ?? []) as $it) {
        $authors = [];
        foreach (array_slice(($it['authors'] ?? []), 0, 4) as $a) {
            $authors[] = $a['name'] ?? '';
        }
        $year = $it['year'] ?? '';
        $venue = $it['venue'] ?? '';
        $doi = $it['externalIds']['DOI'] ?? '';
        $text = gbt_authors($authors) . '. ' . ($it['title'] ?? '') . '[' . ($venue ? 'J' : 'M') . ']. '
            . ($venue ? $venue . ', ' : '') . ($year ?: '') . '.';
        if (push_ref($refs, $seenDoi, $seenTitle, [
            'text' => $text,
            'title' => $it['title'] ?? '',
            'doi' => $doi,
            'source' => $venue,
            'year' => $year,
            'origin' => 'semanticscholar',
            'real' => true,
        ])) {
            $sources['semanticscholar']++;
        }
    }
}

/* ---------- 4. PubMed（医学与生命科学方向） ---------- */
$res = crawl_get(
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=' . $limit
    . '&term=' . rawurlencode($q)
);
$pmids = $res['data']['esearchresult']['idlist'] ?? [];
if ($pmids) {
    $res2 = crawl_get(
        'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' . implode(',', $pmids)
    );
    foreach (($res2['data']['result'] ?? []) as $key => $it) {
        if ($key === 'uids' || !is_array($it)) {
            continue;
        }
        $authors = [];
        foreach (($it['authors'] ?? []) as $a) {
            $authors[] = $a['name'] ?? '';
        }
        $year = substr((string) ($it['pubdate'] ?? ''), 0, 4);
        $journal = $it['fulljournalname'] ?? ($it['source'] ?? '');
        $text = gbt_authors($authors) . '. ' . ($it['title'] ?? '') . '[J]. ' . $journal
            . ', ' . $year . ($it['volume'] ?? '' ? ', ' . $it['volume'] : '')
            . ($it['issue'] ?? '' ? '(' . $it['issue'] . ')' : '')
            . ($it['pages'] ?? '' ? ': ' . $it['pages'] : '') . '.';
        if (push_ref($refs, $seenDoi, $seenTitle, [
            'text' => $text,
            'title' => $it['title'] ?? '',
            'doi' => '',
            'source' => $journal,
            'year' => $year,
            'origin' => 'pubmed',
            'url' => 'https://pubmed.ncbi.nlm.nih.gov/' . $key . '/',
            'real' => true,
        ])) {
            $sources['pubmed']++;
        }
    }
}

/* ---------- 输出 ---------- */
log_event(null, 'crawl', mb_substr($q, 0, 60) . ' / ' . count($refs) . ' 条');

out([
    'ok' => true,
    'query' => $q,
    'count' => count($refs),
    'sources' => $sources,
    'refs' => array_slice($refs, 0, $limit),
    'note' => '以上条目来自 Crossref / OpenAlex / Semantic Scholar / PubMed 实时检索，均含可核验来源；引用前请打开 DOI 核对原文。',
]);
