import { ResearchMemo } from '../../types/financial';

export const BYD_MEMO: ResearchMemo = {
  id: 'memo-byd-2025',
  companyId: 'byd',
  title: '比亚迪 (002594.SZ)：垂直一体化成本壁垒与出海红利——当前市值隐含的国内市占率天花板与海外利润兑现期',
  subtitle: '基于巨潮8个季度财务报表重构、单车净利拆解与逆向DCF推演',
  author: 'Eugene Han',
  date: '2025-01-20',
  recommendation: '买入 (Buy)',
  targetHorizon: '12-24 个月',
  executiveSummary: '比亚迪当前约8,300亿元市值（约285元/股）对应2024年市盈率约21倍。逆向DCF反推显示，市场仅隐含未来5年销量年化增长14.2%且单车净利维持在8,500元水平。我们的非共识在于：市场严重低估了第五代DM混动对燃油车存量市场的二次收割，以及海外高端出口（单车净利超2.5万元）对国内内卷利润的对冲。当前估值具备24.5%的安全边际。',
  thesis: {
    marketConsensus: '国内新能源渗透率突破50%后行业增速中枢下移，国内“价格战”持续侵蚀主机厂利润；海外遭遇欧美反补贴关税阻击，出口增长可能受阻。',
    variantPerception: '我们通过财报重构发现，比亚迪凭借全产业链垂直整合（电池、IGBT芯片、冲压件自研），在单车售价下探至13.4万元的同时，整车毛利率依然稳定在22.4%历史高位。此外，泰国、匈牙利、巴西本地化建厂将系统性规避直接关税，海外销量占比预计在2026年突破20%。',
    catalysts: [
      '第五代DM-i技术车型全系放量，单月新能源车渗透率创历史新高',
      '高端品牌（腾势、方程豹、仰望）单季交付突破6万台，显著拉升综合ASP',
      '海外整车组装基地（泰国、巴西）首期产线投产下线'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年实现销量425万台，同比增长40.6%；单车ASP由2023Q1的17.2万元逐步下调至2024Q4的13.4万元，展现主动降价挤压合资燃油车份额的战略定力。',
    grossMarginDefense: '尽管单车ASP下降22%，但单车成本由14.1万元下降至10.4万元（下降26.2%），规模效应带来制造折旧快速稀释，单车毛利率逆势提升至22.4%。',
    capexAndCashFlowTrajectory: '2024年资本开支达到812亿元（主要投向海外基地与电池产能扩张），经营活动现金流充沛达1,079亿元，造血能力极强。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=8.2%、永续增长率g=2.5%假设下，8,300亿市值逆向反推对应未来5年交付量复合增速仅为14.2%（对应2029年总销量约820万台）。考虑到全球乘用车年需求达8500万台，该假设较为保守。',
    growthVsMarginTradeoff: '若销量复合增速达到我们预期的18.5%，则终端单车净利仅需维持在7,200元即可支撑当前股价，容错空间充足。',
    competitiveAdvantagePeriodCap: '当前估值隐含的竞争优势期（CAP）仅为7.5年，显著低估了其电池产业链一体化在成本曲线上的右侧压制力。'
  },
  verifiableForecasts: [
    {
      targetPeriod: '2025 Q1',
      metric: '新能源乘用车总销量',
      ourPrediction: '1,050,000 - 1,120,000 台',
      consensusEstimate: '980,000 台',
      verificationSource: '巨潮资讯网 每月产销自愿性披露公告',
      falsificationThreshold: '< 920,000 台'
    },
    {
      targetPeriod: '2025 Q1',
      metric: '单车平均归母净利润',
      ourPrediction: '8,800 - 9,400 元/台',
      consensusEstimate: '8,200 元/台',
      verificationSource: '一季报归母净利润 / 交付量计算',
      falsificationThreshold: '< 7,500 元/台 (证明价格战损伤内生造血)'
    },
    {
      targetPeriod: '2025 全年',
      metric: '海外出口及本地化销量',
      ourPrediction: '750,000 - 850,000 台',
      consensusEstimate: '650,000 台',
      verificationSource: '公司年报 境外分部收入与海关出口报关统计',
      falsificationThreshold: '< 600,000 台'
    }
  ],
  killConditions: [
    {
      id: 'kill-byd-1',
      trigger: '单季度汽车业务毛利率跌破 18.0%',
      rationale: '表明上游碳酸锂降价红利出尽，且价格战向核心主力车型腹地恶化蔓延。',
      actionIfTriggered: '调低目标估值20%，转入防守姿态。'
    },
    {
      id: 'kill-byd-2',
      trigger: '核心海外市场（欧盟及东南亚）政策出现实质性准入封锁导致海外月销量环比连续3个月负增长',
      rationale: '海外高毛利对冲逻辑被证伪，估值无法享受全球化车企溢价。',
      actionIfTriggered: '将估值中枢下移至仅反映国内成熟市场的公用事业级倍数（12-14x P/E）。'
    }
  ]
};
