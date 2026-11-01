import { ResearchMemo } from '../../types/financial';

export const ASML_MEMO: ResearchMemo = {
  id: 'memo-asml-2025',
  companyId: 'asml',
  industryId: 'semiconductors',
  title: '阿斯麦 (ASML)：High-NA EUV物理奇点与光刻垄断咽喉——当前市值隐含的2026扩产大年与中国市场出口禁令折价',
  subtitle: '基于SEC 20-F/6-K披露重构、在手积压订单（Backlog）与逆向DCF推演',
  author: 'Eugene Han',
  date: '2025-02-12',
  recommendation: '买入 (Buy)',
  targetHorizon: '12-24 个月',
  executiveSummary: '阿斯麦当前市值约2,810亿欧元（约$712/股）。逆向DCF反推表明，当前估值仅隐含未来5年欧元计价营收复合增速达11.2%，且综合毛利率稳定在51%水平。我们的非共识在于：2024下半年由于部分晶圆代工厂（如英特尔代工放缓、三星延后）扩产推迟导致的订单波动属于短期杂音；随着台积电、台美新建晶圆厂在2025-2026年集中转固装机，在手积压订单（超360亿欧元）将爆发式确认收入。当前估值处于历史估值走廊底部，具备25.0%的安全边际。',
  thesis: {
    marketConsensus: '受地缘政治出口管制限制，中国大陆高毛利DUV光刻机出货占比将由40%腰斩至20%；英特尔削减CapEx将直接导致High-NA EUV采购推迟。',
    variantPerception: '1) 市场低估了单台售价超3.5亿欧元的High-NA EUV (EXE:5000/5200) 对ASP的巨大拉动效应；2) 内存芯片（DRAM）向1c/1d节点演进正在系统性提升EUV光罩层数（从3-4层增至6-8层）；3) 庞大的全球在役设备装机基数使得安装管理与软件升级等高毛利服务收入占比稳固在25%以上。',
    catalysts: [
      '单季度新增净订购额（Net Bookings）反弹突破70亿欧元',
      '台积电官方确认在A16 (1.6nm) 制程中导入首台High-NA EUV商业化量产',
      '2026年营收指引在资本市场日（CMD）上重申达到350亿-400亿欧元'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年交付光刻系统416台，单台平均ASP约为4,860万欧元（若单看尖端EUV系统单台ASP超过1.8亿欧元）。',
    grossMarginDefense: '毛利率常年稳定在51.0%-51.5%窄幅区间，拥有制造业中罕见的抗通胀与零部件成本转嫁特权。',
    capexAndCashFlowTrajectory: '2024全年经营现金流达到30.6亿欧元，自由现金流8.3亿欧元，在建研发中心完工后资本开支将显著回落。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=8.5%、永续增长率g=2.5%假设下，当前市值对应未来5年营收复合增速仅需11.2%，接近历史底部悲观预期。',
    growthVsMarginTradeoff: '若2026扩产大年如期兑现，营收达到360亿欧元并实现54%毛利率，对应合理内在价值为890欧元/股。',
    competitiveAdvantagePeriodCap: '当前隐含CAP为8.5年，显著低估了其在光学物镜（Zeiss独占）与极紫外光源上的绝对物理独占地位。'
  },
  verifiableForecasts: [
    {
      id: 'vf-asml-1',
      targetPeriod: '2025 Q1',
      metric: '单季度净系统新增订购额 (Net Bookings)',
      ourPrediction: '€5.2B - €6.0B',
      consensusEstimate: '€4.8B',
      verificationSource: 'SEC 6-K 季度财报新闻发布通稿',
      falsificationThreshold: '< €4.0B (证明晶圆厂扩产进一步延后)',
      status: 'pending'
    },
    {
      id: 'vf-asml-2',
      targetPeriod: '2025 Q1',
      metric: '综合销售毛利率 (Gross Margin)',
      ourPrediction: '51.5% - 52.5%',
      consensusEstimate: '51.0%',
      verificationSource: '6-K 季度财务报表',
      falsificationThreshold: '< 49.5%',
      status: 'pending'
    },
    {
      id: 'vf-asml-3',
      targetPeriod: '2025 全年',
      metric: '全年营业收入 (Revenue 指引兑现)',
      ourPrediction: '€31B - €33B',
      consensusEstimate: '€30.5B',
      verificationSource: '年度报告财务报表',
      falsificationThreshold: '< €29B',
      status: 'pending'
    }
  ],
  killConditions: [
    {
      id: 'kill-asml-1',
      trigger: '台积电宣布在2nm与A16制程中完全弃用High-NA EUV并转向多重曝光技术路线',
      rationale: '下一代光刻物理路线图遭遇阻断，远期高毛利垄断增长破产。',
      actionIfTriggered: '下调估值目标35%并及时清仓。'
    },
    {
      id: 'kill-asml-2',
      trigger: '西方对华出口管制升级至全面禁止已出售成熟DUV设备的零部件维护与软件支持',
      rationale: '中国区高毛利存量服务与维保收入遭受毁灭性冲击。',
      actionIfTriggered: '转入审慎观望。'
    }
  ]
};
