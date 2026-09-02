import { DOC_TYPES, SAMPLE_TOPICS } from "../data/catalog"

let seq = 0
export function uid(prefix = "n") {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function typeLabel(key) {
  return (DOC_TYPES.find((t) => t.key === key) || DOC_TYPES[0]).label
}

/* ---------------- outline plans ---------------- */

function paperPlan() {
  return [
    { t: "绪论", subs: ["研究背景与意义", "国内外研究现状", "研究内容与方法"] },
    { t: "相关概念界定与理论基础", subs: ["核心概念界定", "相关理论概述"] },
    { t: "现状调查与问题分析", subs: ["研究设计与实施", "现状统计与调查结果", "存在的主要问题"] },
    { t: "优化对策与实施路径", subs: ["对策提出的原则", "具体对策与建议", "实施保障措施"] },
    { t: "结论与展望", subs: ["研究结论", "研究不足与展望"] },
  ]
}

function reportPlan() {
  return [
    { t: "背景与目的", subs: ["工作背景", "目标与意义"] },
    { t: "过程与实施", subs: ["总体安排", "重点环节"] },
    { t: "结果与分析", subs: ["主要成果", "问题与原因"] },
    { t: "总结与建议", subs: ["经验总结", "改进建议"] },
  ]
}

function planFor(typeKey) {
  const paperTypes = new Set(["graduate", "journal", "title", "topic", "zb", "course", "monograph"])
  if (paperTypes.has(typeKey)) return paperPlan()
  if (typeKey === "proposal") {
    return [
      { t: "选题背景与研究意义", subs: ["选题背景", "研究意义"] },
      { t: "国内外研究现状", subs: ["国外研究现状", "国内研究现状", "研究述评"] },
      { t: "研究目标与内容", subs: ["研究目标", "研究内容"] },
      { t: "研究方法与技术路线", subs: ["研究方法", "技术路线"] },
      { t: "进度安排与预期成果", subs: ["进度安排", "预期成果"] },
    ]
  }
  if (typeKey === "review") {
    return [
      { t: "引言", subs: ["研究背景", "综述范围与方法"] },
      { t: "核心概念与理论基础", subs: ["核心概念界定", "理论基础"] },
      { t: "国内外研究进展", subs: ["国外研究进展", "国内研究进展", "主题维度归纳"] },
      { t: "研究述评与展望", subs: ["现有研究的贡献", "不足与未来方向"] },
    ]
  }
  if (typeKey === "task") {
    return [
      { t: "课题概况", subs: ["课题名称与来源", "任务目标与要求"] },
      { t: "主要研究内容", subs: ["内容框架", "重点难点"] },
      { t: "进度安排与保障", subs: ["进度安排", "保障条件"] },
    ]
  }
  if (typeKey === "survey") {
    return [
      { t: "调查背景与目的", subs: ["调查背景", "调查目的"] },
      { t: "调查设计与实施", subs: ["调查对象与方法", "问卷设计与发放"] },
      { t: "调查结果分析", subs: ["总体情况", "维度分析与交叉比较"] },
      { t: "主要发现与建议", subs: ["主要发现", "对策建议"] },
    ]
  }
  if (typeKey === "teaching") {
    return [
      { t: "教学背景与对象分析", subs: ["内容分析", "学情分析"] },
      { t: "教学目标与重难点", subs: ["教学目标", "重难点"] },
      { t: "教学过程设计", subs: ["环节设计", "板书与作业设计"] },
      { t: "教学评价与反思", subs: ["评价方式", "教学反思"] },
    ]
  }
  if (typeKey === "career") {
    return [
      { t: "自我认知与职业定位", subs: ["自我分析", "职业定位"] },
      { t: "职业环境分析", subs: ["宏观环境", "行业与岗位分析"] },
      { t: "职业目标与发展路径", subs: ["总体目标", "阶段路径"] },
      { t: "实施计划与评估调整", subs: ["行动计划", "评估与调整机制"] },
    ]
  }
  if (typeKey === "defense" || typeKey === "ppt") {
    return [
      { t: "选题背景与研究意义", subs: ["选题背景", "研究意义"] },
      { t: "研究思路与方法", subs: ["总体思路", "主要方法"] },
      { t: "主要工作与成果", subs: ["核心工作", "成果展示"] },
      { t: "结论与展望", subs: ["研究结论", "不足与展望"] },
    ]
  }
  if (typeKey === "intern" || typeKey === "zhiji") {
    return [
      { t: "实习（实践）单位与岗位", subs: ["单位概况", "岗位职责"] },
      { t: "实习（实践）内容与过程", subs: ["主要工作", "典型任务"] },
      { t: "收获体会与问题反思", subs: ["收获与体会", "不足与反思"] },
      { t: "总结与建议", subs: ["个人总结", "改进建议"] },
    ]
  }
  if (typeKey === "homework" || typeKey === "reflection" || typeKey === "reading") {
    return [
      { t: "背景与引入", subs: ["问题提出", "内容概述"] },
      { t: "主体分析", subs: ["认识与理解", "延伸思考"] },
      { t: "总结与体会", subs: ["核心收获", "个人体会"] },
    ]
  }
  // 中期报告 / 工作报告 / 自定义等
  return reportPlan()
}

export function planOutline(typeKey, topic, level = "二级大纲") {
  const plan = planFor(typeKey)
  const items = []
  plan.forEach((ch) => {
    items.push({ id: uid("c"), level: 1, title: `${ch.t}`, special: null })
    if (level === "三级大纲") {
      ch.subs.forEach((s) => items.push({ id: uid("c"), level: 2, title: s, parent: items[items.length - 1].id }))
    }
  })
  items.push({ id: uid("c"), level: 1, title: "参考文献", special: "refs" })
  items.push({ id: uid("c"), level: 1, title: "致谢", special: "ack" })
  return items
}

export function defaultTopic(typeKey) {
  return SAMPLE_TOPICS[typeKey] || SAMPLE_TOPICS.graduate
}

/* ---------------- demo logs ---------------- */

export async function demoOutline({ typeKey, topic, lang }, { onLog, signal } = {}) {
  const steps = [
    { ms: 820, text: `正在解析选题：“${topic}”` },
    { ms: 760, text: `已匹配文档类型：${typeLabel(typeKey)} · ${lang}` },
    { ms: 1050, text: "正在检索同主题文献与学科语料…" },
    { ms: 900, text: "正在规划章节逻辑与论证主线…" },
    { ms: 720, text: "大纲骨架已生成，可随时点选修改" },
  ]
  for (const s of steps) {
    if (signal?.()) throw new Error("cancelled")
    onLog?.({ text: s.text, kind: "run" })
    await sleep(s.ms)
    onLog?.({ text: s.text, kind: "done" })
  }
  return planOutline(typeKey, topic, "三级大纲")
}

/* ---------------- paragraph/content factory ---------------- */

const OPENERS = [
  (topic, ch) =>
    `围绕“${topic}”这一核心问题，${ch}部分首先对问题的现实背景进行梳理。近年来，相关议题逐渐成为学科研究与实践讨论的焦点，不同学者从理论建构与经验研究两个方向提供了丰富的分析视角，这为本文确立了清晰的问题意识与对话基础。`,
  (topic, ch) =>
    `从既有研究看，${ch}所涉及的核心变量与作用机制尚未形成统一结论。已有成果多采用质性访谈或小样本问卷调查，在样本代表性与因果识别上仍有提升空间；同时，多数讨论停留在静态描述层面，缺少对动态过程的追踪，这构成本文试图推进的切入点。`,
  (topic) =>
    `就现实层面而言，深入考察“${topic}”不仅是回应学科发展需要，也具有直接的应用价值。通过厘清关键概念、梳理运行机制并总结实践经验，能够为相关主体提供更具操作性的决策参考，也能够检验既有理论在真实情境中的适用边界。`,
]

const BODIES = [
  (topic, ch) =>
    `在${ch}的分析中，本文遵循“概念界定—现状考察—机制分析—对策提出”的基本逻辑。概念层面，依据权威文献对关键词的内涵与外延作出界定；现状层面，结合公开数据与调研材料刻画总体特征；机制层面，重点考察各影响因素之间的作用路径，从而避免就现象谈现象的简单化处理。`,
  (topic, ch) =>
    `调查与资料分析结果显示，${ch}涉及的实践样态呈现出明显的分化特征：一部分主体已经形成较为成熟的做法，另一部分仍受制于资源、观念与制度环境等因素。值得注意的是，个体层面的主观因素与组织层面的制度安排共同发挥作用，任何单一解释都难以完整覆盖现实复杂性。`,
  (topic) =>
    `需要强调的是，对“${topic}”的讨论不能脱离具体情境。不同发展阶段、不同规模与不同资源禀赋的主体，其面临的约束与可采用的路径并不相同。因此，本文在提出一般性结论的同时，也保留了必要的边界说明，避免将特定情境下的经验不加区分地推广。`,
]

const CLOSERS = [
  (topic, ch) =>
    `综合来看，${ch}部分的论述说明：有效的改进不能依赖单一要素的调整，而需要从理念更新、制度完善、能力建设与协同机制四个方面系统推进。唯有将短期举措与长期机制相结合，才能真正将研究结论转化为可持续的实践成效。`,
  (topic) =>
    `综上，“${topic}”这一议题仍具有持续深入的空间。后续研究一方面可以扩大样本范围、引入更精细的测量工具以增强结论的外部效度；另一方面可尝试采用纵向追踪或多案例比较设计，进一步揭示作用机制在不同条件下的变化规律。`,
  (topic) =>
    `本章围绕“${topic}”完成了从理论到实践的完整论证，并对前文各章的主要观点进行了系统整合。研究结论在一定程度上回应了开篇提出的问题，也明确了若干值得继续探索的方向，期望能为后续研究者提供可检验的假设与可操作的起点。`,
]

function addCitations(text) {
  let out = text
  const marks = ["[3]", "[7]", "[12]", "[4]", "[9]", "[15]"]
  marks.sort(() => Math.random() - 0.5)
  const s = out.split("。")
  for (let i = 0; i < s.length; i += 1) {
    if (s[i].length > 32 && marks.length && Math.random() > 0.38) {
      s[i] = `${s[i]}${marks.shift()}`
    }
  }
  return s.join("。")
}

function paraBank(topic, ch, idx, total) {
  let arr
  if (idx === 0) arr = OPENERS
  else if (idx < total - 1) arr = BODIES
  else arr = CLOSERS
  const pick = arr[(idx + ch.length) % arr.length]
  return addCitations(pick(topic, ch))
}

export function chapterContent(topic, chapterTitle, paraCount = 3) {
  return Array.from({ length: paraCount }, (_, i) => paraBank(topic, chapterTitle, i, paraCount))
}

/* ---------------- references ---------------- */

const REF_AUTHORS = [
  "张维, 李娜", "陈静, 王磊", "刘洋, 赵敏", "周琳, 吴昊", "孙志强", "郑晓东, 何雨",
  "冯伟", "高翔, 罗丹", "林芳, 韩磊", "徐婷", "马骏", "田甜", "曹阳, 胡悦", "沈佳宁",
]

export function buildRefs(topic, count = 12) {
  const countNum = Number(count) || 12
  const words = topic.replace(/[，。、]/g, "").slice(0, 14)
  const kinds = [
    (a, i) => `${a}. ${words}研究述评[J]. 学术与实践, 20${20 + (i % 4)}${String(1 + ((i * 3) % 8)).padStart(2, "0")}(${5 + (i % 8)}): ${18 + i * 3}-${26 + i * 3}.`,
    (a, i) => `${a}. 面向${words}的分析框架与实证检验[J]. 社会科学前沿, 20${22 + (i % 3)}${String(2 + ((i * 5) % 7)).padStart(2, "0")}(${2 + (i % 6)}): ${55 + i}-${64 + i}.`,
    (a, i) => `${a}. ${words}：机制、证据与启示[D]. ${["北京", "上海", "广州", "南京", "武汉"][i % 5]}师范大学, 20${20 + (i % 4)}: ${8 + i}-${15 + i}.`,
    (a, i) => `${a}. ${words}研究的热点演进与前沿趋势[J]. 当代教育论坛, 20${21 + (i % 3)}${String(6 + (i % 6)).padStart(2, "0")}(${3 + i}): ${101 + i}-${118 + i}.`,
  ]
  return Array.from({ length: Math.min(countNum, REF_AUTHORS.length) }, (_, i) =>
    kinds[i % kinds.length](REF_AUTHORS[i % REF_AUTHORS.length], i),
  )
}

/* ---------------- full doc generation ---------------- */

export function buildAbstract(topic, typeLabelText, edu) {
  return (
    `“${topic}”是${edu}阶段${typeLabelText}研究的重要议题。本文在系统梳理相关理论与既有文献的基础上，围绕${topic}，综合运用文献研究法、问卷调查法与案例分析法，考察其现实表现、内在机制与主要问题，并有针对性地提出改进策略。研究表明：${topic}的成效受到主体认知、制度供给与资源保障等多重因素协同影响；通过完善制度设计、强化专业能力并构建协同机制，能够显著提升实践效果。本文结论为后续研究提供了可检验的假设，也为相关实践提供了决策参考。`
  )
}

export async function generateFullDoc(
  { outline, topic, typeKey, edu, lang, words, refCount },
  { onLog, onProgress, onChunk, signal } = {},
) {
  const typeLabelText = typeLabel(typeKey)
  const doc = {
    title: topic,
    metaLine: `${typeLabelText} · ${edu} · ${lang} · 目标 ${words} 字 · 演示版按精简篇幅示意`,
    abstract: "",
    sections: [],
    refs: [],
    refsNote: "演示版文献为占位示意，正式版将由文献检索服务自动替换为真实文献。",
    ack: "",
  }
  const secs = outline.filter((o) => !o.special && o.level === 1)

  const phase = async (text, ms, pct) => {
    onLog?.({ text, kind: "run" })
    onProgress?.(pct)
    await sleep(ms)
    onLog?.({ text, kind: "done" })
  }

  await phase("正在校验大纲结构与格式要求", 620, 4)
  doc.abstract = buildAbstract(topic, typeLabelText, edu)
  onLog?.({ text: "中英文摘要与关键词已生成", kind: "done" })
  onProgress?.(8)

  await phase(`正在构建演示文献库（${Number(refCount) || 12} 条）`, 760, 14)
  doc.refs = buildRefs(topic, refCount)

  const wordNum = typeof words === "string" && words.includes("万")
    ? Number.parseFloat(words) * 10000
    : Number(words)
  const scale = Number.isFinite(wordNum)
    ? Math.max(2, Math.round(wordNum / 5000))
    : 3
  const base = 100 / (secs.length + 2)
  let acc = 18
  let index = 0
  for (const sec of secs) {
    if (signal?.()) throw new Error("cancelled")
    index += 1
    const logText = `正在撰写 ${index}/${secs.length} · ${sec.title}`
    onLog?.({ text: logText, kind: "run" })
    onProgress?.(acc)
    await sleep(900 + Math.random() * 450)
    const paras = chapterContent(topic, sec.title, scale)
    doc.sections = [
      ...doc.sections,
      { id: sec.id, title: sec.title, paras, editing: false },
    ]
    onChunk?.(JSON.parse(JSON.stringify(doc)))
    onLog?.({ text: `${sec.title} · 完成（含文献标注）`, kind: "done" })
    acc += base
  }

  await phase("正在统一术语、润色语句并校对引用格式", 980, 92)
  doc.ack = `行文至此，谨向在研究过程中给予指导与帮助的师长、同学与家人致以诚挚谢意。本文参考的文献资料为写作提供了重要支撑，在此一并致谢。`
  await phase("排版完成：目录、页眉页脚与参考文献格式已就绪", 820, 100)
  return doc
}

export function countWords(text) {
  return (text || "").replace(/\s/g, "").length
}

export function docWordCount(doc) {
  const sec = doc.sections.reduce((n, s) => n + s.paras.join("").replace(/\s/g, "").length, 0)
  return sec + countWords(doc.abstract) + countWords(doc.ack)
}
