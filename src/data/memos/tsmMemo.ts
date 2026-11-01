import { ResearchMemo } from '../../types/financial';

export const TSM_MEMO: ResearchMemo = {
  id: 'memo-tsm-2025',
  companyId: 'tsm',
  industryId: 'semiconductors',
  title: '台积电 (TSM)：尖端代工与CoWoS先进封装物理瓶颈——当前市值隐含的2nm良率溢价与地缘政治折价',
  subtitle: '基于SEC 20-F/6-K披露重构、先进制程议价力与逆向DCF推演',
  author: 'Eugene Han',
  date: '2025-02-15',
  recommendation: '买入 (Buy)',
  targetHorizon: '12-24 个月',
  executiveSummary: '台积电当前市值约1.01万亿美元（约$195/ADR），对应2024年实际市盈率约28倍。逆向DCF模型反推表明，当前估值仅隐含未来5年美元营收复合增速达14.8%，且综合毛利率稳定在55%水平。我们的非共识在于：市场对地缘政治风险过度折价，低估了台积电在3nm/2nm制程与CoWoS产能上的绝对买方定价权——英伟达、苹果、AMD、博通全部为其代工排队，2025年先进制程再度提价8%-10%将直接增厚毛利。当前估值具备26.8%安全边际。',
  thesis: {
    marketConsensus: '地缘政治摩擦加剧，海外工厂（美国亚利桑那、日本熊本、德国德累斯顿）稀释综合毛利率；2025年手机消费电子复苏疲软拖累成熟制程产能利用率。',
    variantPerception: '1) 市场低估了AI芯片对CoWoS封装与N3P制程的饥渴度，AI相关营收占比在2025年将提前跨过20%门槛；2) 亚利桑那工厂良率已追平台湾本土工厂，海外工厂溢价定价策略已获大客户接受；3) 三星与英特尔代工分拆进展不顺，尖端代工全球事实独占。',
    catalysts: [
      '2nm (N2) 制程在2025下半年如期试产并获得苹果与英伟达全量首发锁单',
      'CoWoS先进制程封装月产能由2024年底的3.5万片翻倍扩充至7.5万片以上',
      '先进制程晶圆代工价格上调协议在Q1财报中显性化反映至综合毛利率'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年等效12吋晶圆出货量突破1,364万片，先进制程（7nm及以下）营收占比突破69%；单片晶圆ASP由2023年的$5,770攀升至$6,480。',
    grossMarginDefense: '在海外建厂初期折旧压力下，2024下半年毛利率逆势攀升至57.8%-58.6%，印证了极致产能利用率带来的固定成本摊薄效应。',
    capexAndCashFlowTrajectory: '2024全年CapEx为255亿美元，经营现金流高达646亿美元，自由现金流390亿美元，支撑丰厚季度派息。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=8.6%、永续增长率g=2.5%假设下，1万亿市值对应未来5年美元营收复合增速仅为14.8%（远低于管理层给出的15%-20%长期指引中枢）。',
    growthVsMarginTradeoff: '若营收复合增速达到我们预期的18.2%，且毛利率维持在56%以上，对应合理股价为$248/ADR。',
    competitiveAdvantagePeriodCap: '当前隐含CAP仅为8.2年，反映了地缘政治带来的风险溢价抑制。'
  },
  verifiableForecasts: [
    {
      id: 'vf-tsm-1',
      targetPeriod: '2025 Q1',
      metric: '美元计价营业收入 (USD)',
      ourPrediction: '$25.2B - $26.0B',
      consensusEstimate: '$24.5B',
      verificationSource: '台积电季度法说会官方财务报告 (6-K)',
      falsificationThreshold: '< $23.5B',
      status: 'pending'
    },
    {
      id: 'vf-tsm-2',
      targetPeriod: '2025 Q1',
      metric: '综合销售毛利率 (Gross Margin)',
      ourPrediction: '57.0% - 58.5%',
      consensusEstimate: '56.5%',
      verificationSource: '6-K Consolidated Income Statements',
      falsificationThreshold: '< 54.0%',
      status: 'pending'
    },
    {
      id: 'vf-tsm-3',
      targetPeriod: '2025 全年',
      metric: '年度资本开支 (CapEx 指引)',
      ourPrediction: '$34B - $38B',
      consensusEstimate: '$32B',
      verificationSource: '官方年度指引披露',
      falsificationThreshold: '< $30B (反映晶圆扩产节奏放缓)',
      status: 'pending'
    }
  ],
  killConditions: [
    {
      id: 'kill-tsm-1',
      trigger: '单季度先进制程（3nm/5nm）产能利用率跌破 80.0%',
      rationale: '意味着全球AI加速器出货全面急刹车，或大客户自研芯片转单。',
      actionIfTriggered: '下调估值目标25%并启动仓位削减。'
    },
    {
      id: 'kill-tsm-2',
      trigger: '台海地缘政治发生实质性封锁或军事冲突制裁',
      rationale: '核心生产基座面临物理破坏或全球供应链断绝。',
      actionIfTriggered: '无条件紧急清仓避险。'
    }
  ]
};
