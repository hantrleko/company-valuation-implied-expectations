import { ResearchMemo } from '../../types/financial';

export const LI_MEMO: ResearchMemo = {
  id: 'memo-li-2025',
  companyId: 'li',
  title: '理想汽车 (LI)：增程基本盘韧性与纯电平台重塑——当前市值隐含的毛利率下限与组织敏捷性测算',
  subtitle: '基于SEC 20-F/6-K披露重构、净现金保护与逆向DCF隐含预期拆解',
  author: 'Eugene Han',
  date: '2025-01-15',
  recommendation: '买入 (Buy)',
  targetHorizon: '12 个月',
  executiveSummary: '理想汽车当前市值约1,856亿元人民币（折合$24.8/ADS）。公司账面手握超1,000亿元现金及短期投资（净现金高达941亿元），对应企业价值（EV）仅915亿元人民币。逆向DCF推演表明，市场仅要求未来5年交付量复合增速达8.5%且综合毛利率维持在18.5%即可成立。市场对MEGA试水受挫过度反应，提供了罕见的非对称赔率。',
  thesis: {
    marketConsensus: '理想纯电MPV MEGA遭遇舆论滑铁卢，市场质疑其能否复制增程SUV的成功，担忧其进入20-30万元纯电红海后毛利率断崖式下坠，给新势力估值严重折价。',
    variantPerception: '我们认为：1) 增程L系列（L6/L7/L8/L9）在30万家庭SUV市场的品类定义统治力不可动摇，L6放量虽拉低均价至27万元，但单车毛利仍稳定在20%以上；2) 净现金占总市值50%以上，提供了极强抗风险垫；3) 2025年高压纯电SUV发布推迟属于管理层理性校准，而非战略溃败。',
    catalysts: [
      '新一代高压纯电SUV M系列产品矩阵与超充桩布局落地',
      '无图NOA（城市领航辅助驾驶）全国全量推送后进店转化率跳升',
      '季度自由现金流连续保持单季80亿元以上健康回流'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年交付量突破50万台，随着L6车型成为主力销量担当，ASP由2023年的32.1万元下移至2024Q4的26.5万元，但整体规模效益对冲了单价下滑。',
    grossMarginDefense: '整车毛利率在2024Q1受产品换代扰动短暂下探至19.3%，随后在Q3/Q4迅速反弹至20.4%-20.9%，展现出中国新势力中最为卓越的供应链溢价与精细化管理。',
    capexAndCashFlowTrajectory: '2024全年实现自由现金流204亿元，营运资金占用极低（净营业周期持续为负），资本效率领跑全行业。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在扣除941亿元净现金后，当前EV对应市场隐含未来5年交付量复合增速仅需8.5%（2029年仅需达到75万台），隐含毛利率仅需18.2%。',
    growthVsMarginTradeoff: '若我们预计公司在2025-2029年维持16%的销量复合增长并保住20%毛利率，其合理内在价值较当前股价有38.2%的安全边际。',
    competitiveAdvantagePeriodCap: '当前隐含CAP仅为4.2年，市场几乎在给一家成熟甚至萎缩的车企估值，定价严重失真。'
  },
  verifiableForecasts: [
    {
      targetPeriod: '2025 Q1',
      metric: '整车销售毛利率',
      ourPrediction: '19.8% - 20.6%',
      consensusEstimate: '19.0%',
      verificationSource: 'SEC 6-K Vehicle Margin 披露指标',
      falsificationThreshold: '< 18.0%'
    },
    {
      targetPeriod: '2025 Q1',
      metric: '季度汽车交付量',
      ourPrediction: '115,000 - 125,000 台',
      consensusEstimate: '110,000 台',
      verificationSource: '每月1日官方交付快报与港交所公告',
      falsificationThreshold: '< 100,000 台'
    },
    {
      targetPeriod: '2025 全年',
      metric: '自由现金流 (FCFF)',
      ourPrediction: '180亿 - 220亿元 人民币',
      consensusEstimate: '150亿元 人民币',
      verificationSource: '20-F 经营现金流减购建固定资产',
      falsificationThreshold: '< 120亿元'
    }
  ],
  killConditions: [
    {
      id: 'kill-li-1',
      trigger: '车辆销售毛利率连续两季度跌破 17.5%',
      rationale: '意味着问界、比亚迪混动在增程领域的围剿彻底瓦解了理想的定价权。',
      actionIfTriggered: '调降盈利预测中枢30%，削减仓位至清仓。'
    },
    {
      id: 'kill-li-2',
      trigger: '单季度研发与资本开支激增导致自由现金流连续两个季度为负',
      rationale: '标志着资本运作纪律瓦解，造血闭环出现结构性破坏。',
      actionIfTriggered: '重新审视管理层治理与资本配置，启动全面止损。'
    }
  ]
};
