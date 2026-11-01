import { ResearchMemo } from '../../types/financial';

export const AVGO_MEMO: ResearchMemo = {
  id: 'memo-avgo-2025',
  companyId: 'avgo',
  industryId: 'semiconductors',
  title: '博通 (AVGO)：定制化ASIC芯片与VMware协同重塑——当前市值隐含的以太网AI交换普及率与软件提价天花板',
  subtitle: '基于SEC 10-K/10-Q披露重构、自由现金流机器与逆向DCF推演',
  author: 'Eugene Han',
  date: '2025-02-18',
  recommendation: '买入 (Buy)',
  targetHorizon: '12-18 个月',
  executiveSummary: '博通当前市值约8,350亿美元（约$178/股）。逆向DCF反推表明，当前估值要求未来5年营收复合增速为15.5%，且自由现金流利润率维持在45%以上。我们的非共识在于：市场仍将博通视为并购驱动型半导体公司，低估了其在定制化AI芯片（Google TPU v6/v7、Meta MTIA）与超大规模数据中心以太网交换（Tomahawk 5 / Jericho 3-AI）中的垄断生态地位。此外，VMware向订阅制与多产品打包转型正在释放巨大的提价净现金流。当前估值具备21.5%的安全边际。',
  thesis: {
    marketConsensus: '收购VMware后杠杆负债高企（净负债达610亿美元）；若大型云巨头自研团队跳过博通直接找台积电代工定制ASIC，博通将失去设计溢价。',
    variantPerception: '1) 尖端定制芯片涉及复杂的SerDes高速互联IP与封装热管理，云厂商自研严重依赖博通的IP积累；2) 开放以太网（Ultra Ethernet Consortium）在万卡级集群中正在逐步战胜英伟达私有InfiniBand协议；3) 高额负债已快速通过年化超200亿美元的强劲FCF快速清偿。',
    catalysts: [
      '第三家大型云巨头（除Google、Meta外）正式确认博通为其下一代AI XPU协同设计方',
      'Tomahawk 5 (51.2T) 800G高速以太网交换芯片季度营收环比激增50%以上',
      'VMware年化年度经常性收入（ARR）突破160亿美元并大幅削减非核心SG&A'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年营业总收入达到522亿美元（同比增46.8%），AI相关半导体解决方案收入突破120亿美元大关。',
    grossMarginDefense: '综合毛利率保持在63.0%（剔除VMware无形资产摊销后高毛利半导体业务依然达75%）。',
    capexAndCashFlowTrajectory: '资本开支仅5.4亿美元（仅占收入1%），经营现金流高达216亿美元，自由现金流211亿美元，是全球自由现金流率最高的半导体企业。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=8.4%、永续增长率g=2.5%假设下，当前市值对应未来5年营收复合增速仅需15.5%，现金流质量提供了充足下行保护。',
    growthVsMarginTradeoff: '若AI半导体业务维持30%以上增速，软件业务提价兑现，对应合理内在价值为$216/股。',
    competitiveAdvantagePeriodCap: '当前隐含CAP为9.5年，体现了市场对其IP与软件黏性的长期信任。'
  },
  verifiableForecasts: [
    {
      id: 'vf-avgo-1',
      targetPeriod: '2025 Q1 (FY25Q1)',
      metric: 'AI半导体芯片及网络业务单季营收',
      ourPrediction: '$3.8B - $4.1B',
      consensusEstimate: '$3.6B',
      verificationSource: '季度财报业绩发布稿 (8-K)',
      falsificationThreshold: '< $3.3B',
      status: 'pending'
    },
    {
      id: 'vf-avgo-2',
      targetPeriod: '2025 Q1',
      metric: '单季度自由现金流 (FCF)',
      ourPrediction: '$5.5B - $6.0B',
      consensusEstimate: '$5.2B',
      verificationSource: '10-Q 现金流量表现金生成净额',
      falsificationThreshold: '< $4.8B',
      status: 'pending'
    },
    {
      id: 'vf-avgo-3',
      targetPeriod: '2025 全年',
      metric: '全年自由现金流总额',
      ourPrediction: '$25B - $27B',
      consensusEstimate: '$24B',
      verificationSource: '10-K 全年现金流报表',
      falsificationThreshold: '< $22B',
      status: 'pending'
    }
  ],
  killConditions: [
    {
      id: 'kill-avgo-1',
      trigger: '第一大客户（Google）在TPU下一代芯片中将博通核心设计份额大幅转给Marvell或完全内部自研',
      rationale: '核心定制化ASIC护城河被撕开缺口。',
      actionIfTriggered: '调减估值25%并启动平仓。'
    },
    {
      id: 'kill-avgo-2',
      trigger: 'VMware客户因大幅涨价出现大规模向开源KVM/Proxmox生态流失，续约率跌破80%',
      rationale: '软件提价闭环反噬基本盘。',
      actionIfTriggered: '降低对软件现金流的永续假设并削减仓位。'
    }
  ]
};
