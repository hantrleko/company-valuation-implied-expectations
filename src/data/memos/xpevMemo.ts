import { ResearchMemo } from '../../types/financial';

export const XPEV_MEMO: ResearchMemo = {
  id: 'memo-xpev-2025',
  companyId: 'xpev',
  title: '小鹏汽车 (XPEV)：端到端AI智驾平权与MONA爆款周期——当前市值隐含的软件货币化与供应链降本拐点',
  subtitle: '基于SEC 20-F/6-K披露重构、MONA毛利率爬坡与逆向DCF推演',
  author: 'Eugene Han',
  date: '2025-01-22',
  recommendation: '买入 (Buy)',
  targetHorizon: '12-18 个月',
  executiveSummary: '小鹏汽车当前市值约835亿元人民币（约$12.3/ADS）。2024下半年凭借MONA M03与P7+连续斩获爆款，单月交付迅速突破3万台大关，彻底走出G6以来的低谷期。逆向DCF反推显示，市场隐含未来5年交付量复合增速需达22.0%，且整车毛利率维持在11.5%左右。我们的非共识在于：端到端AI模型使得高阶智驾硬件BOM成本大幅削减（去掉激光雷达降低近万元），配合大众技术合作软件授权费入账，2025年毛利率弹性将远超市场保守预期。',
  thesis: {
    marketConsensus: '市场认可MONA和P7+的销量势能，但担忧11-15万元低价位车型会严重稀释整车毛利率，使得小鹏依然深陷“卖得越多亏得越多”的泥潭；同时对与大众的电子电气架构（EEA）联合开发收入的可持续性持观望态度。',
    variantPerception: '我们通过财报重构发现：1) 2024Q3/Q4整车毛利率已回升至8.5%-8.6%，综合毛利率更在技术服务费拉动下攀升至15%-17%高位；2) 自研图灵AI芯片在2025年底量产将进一步砍掉第三方算力芯片采购溢价；3) 规模突破30万台后，固定研发和销售折旧将被迅速摊薄。',
    catalysts: [
      'MONA M03与P7+双子星连续季度月均交付突破3.5万台',
      '纯视觉AI鹰眼智驾系统全量OTA推送，好评率与选装率超预期',
      '与大众汽车合资平台联合采购红利显现，单车物料BOM成本环比再降5%'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年交付近19万台，同比增33.9%；受MONA放量影响，单车ASP在2024Q4降至16.0万元，但高毛利P7+（18-20万级）有效托底了均价。',
    grossMarginDefense: '整车毛利率从2023H1的负数冰点（-8.6%）彻底反转至2024Q4的+8.5%，综合毛利率达14.98%，印证了王凤英加盟后供应链反腐与平台化降本的成效。',
    capexAndCashFlowTrajectory: '2024Q4单季度经营现金流大幅回正至25亿元，账面现金及短期投资增至364亿元，彻底摆脱流动性危机。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=9.4%、永续增长率g=2.2%假设下，当前市值隐含未来5年销量年化复合增速为22.0%（对应2029年销量约51万台），隐含整车综合毛利率需稳定在12.0%。',
    growthVsMarginTradeoff: '若2025年销量在双爆款拉动下达到35-40万台（增长翻倍），则当前估值具备约31.5%的安全边际。',
    competitiveAdvantagePeriodCap: '当前估值隐含CAP为6.8年，反映出市场逐步对其智驾第一梯队定位与出海爆发力定价。'
  },
  verifiableForecasts: [
    {
      targetPeriod: '2025 Q1',
      metric: '季度汽车总交付量',
      ourPrediction: '85,000 - 92,000 台',
      consensusEstimate: '78,000 台',
      verificationSource: 'SEC 6-K 季度产销快报',
      falsificationThreshold: '< 70,000 台 (证明爆款延续性不及预期)'
    },
    {
      targetPeriod: '2025 Q1',
      metric: '汽车销售毛利率 (Vehicle Margin)',
      ourPrediction: '9.0% - 10.2%',
      consensusEstimate: '8.1%',
      verificationSource: 'SEC 6-K 车辆销售毛利率披露',
      falsificationThreshold: '< 7.2% (表明MONA严重击穿盈利能力)'
    },
    {
      targetPeriod: '2025 全年',
      metric: '全年经营活动现金流 (OCF)',
      ourPrediction: '+35亿 至 +50亿元 人民币 (实现年度转正)',
      consensusEstimate: '盈亏平衡 (-5亿至+10亿)',
      verificationSource: '20-F 经营现金流指标',
      falsificationThreshold: '< -15 亿元'
    }
  ],
  killConditions: [
    {
      id: 'kill-xpev-1',
      trigger: 'MONA与P7+车型在2025Q2出现月交付跌破 15,000 台且无新主力车接棒',
      rationale: '爆款周期早夭，小鹏重回“产品断档”的历史陷阱。',
      actionIfTriggered: '下调估值目标35%并及时清仓。'
    },
    {
      id: 'kill-xpev-2',
      trigger: '自研图灵芯片流片及量产延期超12个月，或端到端智驾被华为/特斯拉大幅拉开代差',
      rationale: '科技溢价与自主掌控能力受损，估值体系降级为二线代工厂水平。',
      actionIfTriggered: '剥离科技估值溢价，转向审慎观望。'
    }
  ]
};
