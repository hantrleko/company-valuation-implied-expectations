import { ResearchMemo } from '../../types/financial';

export const TSLA_MEMO: ResearchMemo = {
  id: 'memo-tsla-2025',
  companyId: 'tsla',
  title: '特斯拉 (TSLA)：从汽车制造到物理AI平台——当前市值隐含的FSD货币化与Robotaxi期权反向推演',
  subtitle: '基于8个季度财报重构、逆向DCF及超额收益持续期(CAP)检验',
  author: 'Eugene Han',
  date: '2025-01-28',
  recommendation: '持有 / 观望 (Hold)',
  targetHorizon: '12-18 个月',
  executiveSummary: '特斯拉当前约$790B市值（约$248/股）已无法通过传统汽车整车业务贴现支撑。经逆向DCF求解，当前股价隐含未来5年销量复合增速达24.8%且终端营业利润率需重回17.5%以上。我们的非共识在于：2025年汽车硬件毛利率企稳在15%-16%区间，真正的价值重估依赖于FSD V13入华与无监督Robotaxi监管准入，在此之前估值缺乏安全边际。',
  thesis: {
    marketConsensus: '市场普遍担忧全球电动车竞争加剧与Model 3/Y产品周期老化，预期2025年交付增速落入10%-15%低位，单车毛利率受促销打压；部分多头则将市值锚定在Robotaxi与人形机器人的万亿远期空间。',
    variantPerception: '我们认为市场低估了储能业务（Megapack）的高毛利支撑与现金流再造能力（2024Q3已展现储能毛利突破30%的造血力）；但同时，多头对“全自动驾驶订阅立即带来SaaS级利润”过于激进，FSD算力资本开支（Dojo+NVIDIA H100/H200）在2025年将压制自由现金流净转换率。',
    catalysts: [
      '2025H1 廉价新车型（$25,000区间）在德州或墨西哥工厂的试产排期确认',
      'FSD V13在欧洲及中国市场的监管审批进度与全量推送',
      'Megapack加州Lathrop工厂产能爬坡至40GWh并实现全负荷满产交付'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2023Q1至2024Q4期间，特斯拉单车ASP从$47,214下滑至$41,200（降幅达12.7%），但随着降价边际效用递减，单车成本控制在$34,400稳态，降价促销周期已进入尾声。',
    grossMarginDefense: '汽车毛利率在2024Q2下探至14.6%的周期底部后，2024Q3/Q4回升至17.1%-17.4%，证明全供应链垂直整合与一体化压铸的制造成本壁垒依然坚固。',
    capexAndCashFlowTrajectory: '2024全年CapEx达到$11.3B历史峰值，主要投向AI算力基础设施；经营性现金流在存货周转优化后恢复至$14.6B，支撑自由现金流$3.25B。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=8.8%、永续增长率g=2.5%假设下，当前$248.50股价逆向反解出市场隐含的5年交付量复合增速为24.8%（对应2029年需交付约540万台），或在销量增速为15%的情景下要求终端营业利润率维持在18.2%的高位。',
    growthVsMarginTradeoff: '若汽车业务维持15%行业均速，当前市值中有超过52%（约$410B）属于对FSD软件分成与Robotaxi商业化的“纯期权溢价”。',
    competitiveAdvantagePeriodCap: '市场给予的隐含竞争优势期（CAP）长达14年，远高于传统车企的4-6年，反映了市场将其视为科技生态而非硬件制造商。'
  },
  verifiableForecasts: [
    {
      targetPeriod: '2025 Q1',
      metric: '全球交付量 (Units)',
      ourPrediction: '445,000 台',
      consensusEstimate: '425,000 台',
      verificationSource: 'SEC 8-K 季度产销官方快报',
      falsificationThreshold: '< 410,000 台 (若低于此值表明Q1环比断崖)'
    },
    {
      targetPeriod: '2025 Q1',
      metric: '汽车销售毛利率 (扣除积分)',
      ourPrediction: '15.8% - 16.5%',
      consensusEstimate: '15.2%',
      verificationSource: '10-Q 报表 Automotive Segment Gross Margin',
      falsificationThreshold: '< 14.5% (证明成本降幅不抵价格战)'
    },
    {
      targetPeriod: '2025 全年',
      metric: '储能业务营业收入',
      ourPrediction: '$9.8B - $10.5B',
      consensusEstimate: '$8.5B',
      verificationSource: '10-K Energy Generation & Storage Line Item',
      falsificationThreshold: '< $8.0B'
    }
  ],
  killConditions: [
    {
      id: 'kill-tsla-1',
      trigger: '单季度汽车业务毛利率（剔除监管积分）连续两季跌破 14.0%',
      rationale: '表明比亚迪及中国新势力在成本控制与智驾体验上彻底抹平特斯拉的硬件制造护城河。',
      actionIfTriggered: '下调估值模型中长期稳态毛利率至15%，判定现有市值存在25%以上下行风险，坚决止损。'
    },
    {
      id: 'kill-tsla-2',
      trigger: '2025年底前无监督FSD未能在任何主要监管区（美/中/欧）获得商业化付费落地许可',
      rationale: 'Robotaxi万亿期权折现落空，估值体系将被迫向高端纯电制造OEM均值回归。',
      actionIfTriggered: '剥离$400B软件期权溢价，将目标价下调至$130-$150区间。'
    }
  ]
};
