export const DOC_TYPES = [
  { key: "graduate", label: "毕业论文", group: "论文" },
  { key: "journal", label: "期刊论文", group: "论文" },
  { key: "title", label: "职称论文", group: "论文" },
  { key: "topic", label: "课题论文", group: "论文" },
  { key: "zb", label: "专升本论文", group: "论文" },
  { key: "review", label: "文献综述", group: "论文" },
  { key: "task", label: "论文任务书", group: "论文" },
  { key: "course", label: "课程论文", group: "论文" },
  { key: "monograph", label: "专著", group: "论文" },
  { key: "proposal", label: "开题报告", group: "报告" },
  { key: "survey", label: "调查报告", group: "报告" },
  { key: "mid", label: "中期报告", group: "报告" },
  { key: "intern", label: "实习报告", group: "报告" },
  { key: "zhiji", label: "实践报告", group: "报告" },
  { key: "report", label: "工作报告", group: "报告" },
  { key: "homework", label: "课程作业", group: "作业" },
  { key: "reflection", label: "心得体会", group: "作业" },
  { key: "reading", label: "读后感", group: "作业" },
  { key: "teaching", label: "教学设计", group: "教学" },
  { key: "career", label: "职业规划", group: "就业" },
  { key: "defense", label: "答辩稿", group: "其他" },
  { key: "ppt", label: "答辩 PPT", group: "其他" },
  { key: "custom", label: "自定义写作", group: "其他" },
]

export const DOC_TYPE_GROUPS = [
  { name: "论文", keys: ["graduate", "journal", "title", "topic", "zb", "review", "task", "course", "monograph"] },
  { name: "报告", keys: ["proposal", "survey", "mid", "intern", "zhiji", "report"] },
  { name: "作业与教学", keys: ["homework", "reflection", "reading", "teaching", "career"] },
  { name: "更多", keys: ["defense", "ppt", "custom"] },
]

export const SAMPLE_TOPICS = {
  graduate: "艾宾浩斯记忆曲线在初中英语教学中的运用研究",
  journal: "生成式人工智能对大学生学习投入的影响研究",
  title: "新课标背景下高中数学课堂互动教学策略研究",
  topic: "数字普惠金融对中小企业融资约束的缓解效应研究",
  zb: "短视频平台对大学生信息素养的影响与对策",
  review: "深度学习在医学影像识别中的研究进展",
  task: "智慧养老服务平台的设计与实现",
  course: "乡村振兴背景下农村电商物流发展路径研究",
  monograph: "中国数字经济发展报告（2026）",
  proposal: "短视频用户持续使用意愿的影响因素研究",
  survey: "大学生睡眠质量与学业表现关系的调查研究",
  mid: "基于深度学习的交通标志识别研究进展汇报",
  intern: "某互联网公司数据分析岗位实习报告",
  zhiji: "社会工作专业社区实践总结报告",
  report: "2026 年上半年市场运营工作分析报告",
  homework: "浅析平台经济中的个人信息保护问题",
  reflection: "参加红色教育实践活动心得体会",
  reading: "《人类简史》读后感",
  teaching: "「函数的单调性」教学设计",
  career: "计算机科学与技术专业本科生职业规划书",
  defense: "基于 YOLOv8 的课堂专注度检测系统答辩稿",
  ppt: "基于大模型的智能论文写作系统",
  custom: "我的自定义写作主题",
}

export const EDU_LEVELS = ["专科", "本科", "研究生", "博士", "MBA"]
export const WORD_OPTIONS = ["3000", "5000", "8000", "1万", "2万", "3万", "5万", "10万"]
export const LANGS = ["中文", "英语", "日语", "韩语", "俄语", "泰语"]
export const REF_OPTIONS = ["5", "10", "15", "20", "30", "40"]
export const MODELS = [
  {
    id: "pro",
    label: "升格 5.0 · 学术加强版",
    desc: "长文记忆 · 支持联网检索与文献标注 · 深度学术语体",
  },
  {
    id: "std",
    label: "标准模型",
    desc: "生成速度更快，适合短篇与日常写作",
  },
]

export const PRICING = [
  {
    count: 1,
    label: "单篇体验",
    price: "29.9",
    original: "119",
    note: "永久有效 · 下载不限次",
    feats: ["任意文档类型", "免费大纲 + 三级大纲", "无限次改稿", "全文 Word 下载"],
  },
  {
    count: 3,
    label: "三篇套餐",
    price: "69",
    original: "299",
    note: "永久有效 · 可多人共用",
    feats: ["含单篇全部权益", "支持不同题目", "降 AIGC 痕迹可用", "AI 一键降重可用"],
  },
  {
    count: 5,
    label: "五篇套餐",
    price: "99",
    original: "459",
    note: "永久有效 · 最受欢迎",
    hot: true,
    feats: ["含三篇全部权益", "真实文献检索与标注", "答辩 PPT 生成", "优先写作通道"],
  },
  {
    count: 10,
    label: "十篇套餐",
    price: "168",
    original: "699",
    note: "永久有效 · 可多人共用",
    feats: ["含五篇全部权益", "私人知识库投喂", "团队协作空间", "商务合作价"],
  },
]

export const FAQS = [
  {
    q: "生成一篇论文需要多久？",
    a: "演示环境通常数十秒即可完成大纲，全文生成数分钟。正式服务为保证长文上下文连贯，会逐章写作并实时展示进度；万字论文通常在 5~10 分钟内完成，完成后可无限次改稿。",
  },
  {
    q: "支持按我自己的大纲生成吗？",
    a: "支持。可以先让系统生成标准大纲，再在大纲面板中直接修改章节标题、增删章节、调整顺序；也可以选择「自定义写作」后手动录入大纲，系统会严格按你的结构展开正文。",
  },
  {
    q: "参考文献是真实的吗？",
    a: "正式版接入知网 / 中科院等检索数据源，按 GB/T 7714 输出真实可查的文献并优先近 3~5 年成果。当前开源演示版内的文献为占位示例，仅用于展示排版效果。",
  },
  {
    q: "如何降低 AIGC 痕迹与查重率？",
    a: "工作台右侧提供「降 AIGC」「一键降重」工具，写作引擎内置学术语体改写层，会主动弱化模板化表达。实际降重效果因学科、文本与检测库而异，请以学校检测报告为准。",
  },
  {
    q: "可以写英语或其他语言的论文吗？",
    a: "支持中文、英语、日语、韩语、俄语、泰语等常见语言。选择语言后，大纲与正文会以对应语言输出，并保留中英摘要等格式。",
  },
  {
    q: "我的隐私和资料安全吗？",
    a: "演示版数据仅保存在浏览器本地。正式版采用加密存储与访问隔离，投喂资料只用于本次写作任务，可随时删除写作记录。",
  },
  {
    q: "支持开发票与商务合作吗？",
    a: "正式运营支持开发票；批量采购、OEM 独立分站、API 接入与代理合作请联系站点客服或商务人员。",
  },
]

export const STEPS = [
  {
    title: "设定命题",
    desc: "选择学科领域与文档类型，输入核心题目或初步构思，系统自动补全研究角度。",
  },
  {
    title: "提纲骨架",
    desc: "AI 极速生成标准结构，支持三级大纲与可视化增删改，让逻辑先于文字定型。",
  },
  {
    title: "赋能内容",
    desc: "逐章写作并检索真实文献、插入图表与公式，上下文连贯，标注规范。",
  },
  {
    title: "导出交付",
    desc: "一键导出标准 Word 文档，衔接内置排版、降 AIGC 与降重引擎。",
  },
]

export const FEATURES = [
  {
    title: "创作闭环",
    desc: "生成只是起点：从大纲、全文到排版、降重、答辩 PPT，一整条可继续优化的交付链路。",
  },
  {
    title: "长文记忆引擎",
    desc: "跨章节保持研究主线、术语与论证口径一致，万字长文不割裂、不跑题。",
  },
  {
    title: "真实文献标注",
    desc: "智能检索近 3~5 年真实文献并按 GB/T 7714 标注，正文与文末列表一一对应。",
  },
  {
    title: "图 · 表 · 公式 · 代码",
    desc: "支持在正文中插入数据表、示意图、公式与代码块，满足理工与经管论文需求。",
  },
  {
    title: "降 AIGC 痕迹",
    desc: "内置学术语体改写层，弱化模板化表达，保持逻辑密度与专业感。",
  },
  {
    title: "一键降重排版",
    desc: "按学校模板处理页边距、字号、目录与引用格式，原生 Word 导出，开箱即用。",
  },
]

export const ECO = [
  {
    title: "原生 API Token",
    desc: "面向开发者开放大纲与全文生成接口，支持回调通知与私有化参数。",
  },
  {
    title: "WPS / Word 插件",
    desc: "在文档内直接唤起选题、降重与排版能力，边写边用，无需切换页面。",
  },
  {
    title: "独立分站 OEM",
    desc: "拥有自有品牌与域名，个性化样式定制，套餐与价格体系完全自主。",
  },
  {
    title: "代理与返利体系",
    desc: "两级分销、拼团与渠道码开箱即用，适合团队裂变与私域运营。",
  },
]

export const HELP_LINKS = [
  { label: "免费生成大纲", href: "#demo" },
  { label: "如何修改大纲", href: "#demo" },
  { label: "写作记录管理", href: "#records" },
  { label: "套餐与支付", href: "#pricing" },
]

export const PROD_LINKS = [
  { label: "毕业论文", href: "#demo" },
  { label: "开题报告", href: "#demo" },
  { label: "文献综述", href: "#demo" },
  { label: "答辩 PPT", href: "#demo" },
]

export const LEGAL_LINKS = [
  { label: "学术诚信声明", href: "#faq" },
  { label: "免责声明", href: "#faq" },
  { label: "隐私说明", href: "#faq" },
  { label: "用户协议", href: "#faq" },
]
