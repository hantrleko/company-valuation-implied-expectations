import { ResearchMemo } from '../../types/financial';

export const NIO_MEMO: ResearchMemo = {
  id: 'memo-nio-2025',
  companyId: 'nio',
  title: '蔚来 (NIO)：换电基建重资产护城河与多品牌下沉放量——当前市值隐含的自由现金流转正交点与稀释风险测算',
  subtitle: '基于SEC 20-F/6-K披露重构、换电站利用率拐点与逆向DCF压力测试',
  author: 'Eugene Han',
  date: '2025-01-18',
  recommendation: '持有 / 观望 (Hold)',
  targetHorizon: '12 个月',
  executiveSummary: '蔚来当前约752亿元人民币市值（约$4.85/ADS）反映了市场对其长期现金失血与频繁股权/可转债稀释的极高折价。逆向DCF模型显示，当前估值要求第二品牌“乐道”及“萤火虫”在未来5年拉动整车销量复合增速达到28.5%，且整车毛利率在2026年回升至16%以上以实现FCFF转正。关键看点在于换电网络向长安、吉利等外部开放的轻资产商业化。',
  thesis: {
    marketConsensus: '蔚来持续每个季度亏损40-50亿元，换电站重资产折旧压力沉重；新品牌乐道若无法迅速月销破2万，将进一步消耗现有400余亿现金储备，面临二次股权稀释压力。',
    variantPerception: '市场忽视了两个潜在催化剂：1) 乐道L60单车BOM成本显著优化，自建全自研神玑9031芯片与自研电驱在2025年逐步导入，单车毛利率有望在规模效应下突破15%；2) 武汉蔚能与换电联盟独立融资，将大量换电站建站CapEx剥离出上市公司报表。',
    catalysts: [
      '第二品牌“乐道”首款车型L60单月交付站稳20,000台关口',
      '与国有车企（长安、广汽、奇瑞等）换电标准互通与商用化落成',
      '单季度经营性现金流首次转正（预期窗口：2025Q3/Q4）'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年交付22.1万台，同比增38.3%；ASP随价格优惠及乐道产品导入由2023年的30.8万元下移至2024Q4的26.0万元。',
    grossMarginDefense: '整车毛利率由2023H1的5%-6%冰点逐级修复至2024Q4的13.5%，成本端全栈自研技术降本开始显效。',
    capexAndCashFlowTrajectory: '2024全年自由现金流失血131亿元（较2023年的-150亿元有所收窄），但自由现金流转正拐点仍需等待乐道万台以上月产销支撑。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=9.6%、永续增长率g=2.2%假设下，当前市值隐含未来5年销量复合增速需达到28.5%（2029年需实现约78万台），且整车综合毛利率需在3年内站上16.5%。',
    growthVsMarginTradeoff: '若换电站重资产折旧无法被社会化联盟摊薄，毛利率若停留在11%-12%，当前市值仍有20%的下行风险；反之若乐道爆款成立，具备显著向上弹性。',
    competitiveAdvantagePeriodCap: '隐含CAP为5.8年，表明资本市场当前并未对高端用户服务护城河给予高确定性溢价，而是将其视为需要不断证明自负盈亏能力的存活测试。'
  },
  verifiableForecasts: [
    {
      targetPeriod: '2025 Q1',
      metric: '综合毛利率 (Gross Margin)',
      ourPrediction: '11.8% - 13.0%',
      consensusEstimate: '11.2%',
      verificationSource: 'SEC 6-K 季度利润表毛利率',
      falsificationThreshold: '< 10.0% (证明下沉品牌严重拖累毛利)'
    },
    {
      targetPeriod: '2025 Q1',
      metric: '全品牌季度总交付量',
      ourPrediction: '68,000 - 75,000 台',
      consensusEstimate: '65,000 台',
      verificationSource: '官方每月交付公告',
      falsificationThreshold: '< 58,000 台'
    },
    {
      targetPeriod: '2025 全年',
      metric: '单季度经营性现金流 (OCF)',
      ourPrediction: '2025Q4 首次实现季度转正 (>0)',
      consensusEstimate: '持续失血 (-15亿至-20亿)',
      verificationSource: '季度现金流量表经营现金流净额',
      falsificationThreshold: '2025Q4 经营现金流净流出仍超过 25 亿元'
    }
  ],
  killConditions: [
    {
      id: 'kill-nio-1',
      trigger: '乐道L60在首个完整交付季度（2025Q1）月均交付未能突破 12,000 台',
      rationale: '证明蔚来多品牌战略无法形成规模化飞轮，下沉扩量逻辑破产。',
      actionIfTriggered: '下调估值并全面平仓避险，防范潜在的再融资稀释。'
    },
    {
      id: 'kill-nio-2',
      trigger: '单季度现金及等价物总额跌破 250 亿元 且未获无稀释债务支持',
      rationale: '流动性缓冲区逼近危险红线，可能被迫在低股价位进行增发稀释。',
      actionIfTriggered: '坚决离场观望，直至资产负债表得到实质性修复。'
    }
  ]
};
