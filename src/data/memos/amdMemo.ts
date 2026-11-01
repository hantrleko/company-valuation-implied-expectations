import { ResearchMemo } from '../../types/financial';

export const AMD_MEMO: ResearchMemo = {
  id: 'memo-amd-2025',
  companyId: 'amd',
  industryId: 'semiconductors',
  title: '超威半导体 (AMD)：EPYC服务器份额扩张与Instinct AI破局——当前市值隐含的AI第二极份额与ROCm生态成熟度',
  subtitle: '基于SEC 10-K/10-Q披露重构、数据中心双引擎与逆向DCF推演',
  author: 'Eugene Han',
  date: '2025-02-10',
  recommendation: '持有 / 观望 (Hold)',
  targetHorizon: '12 个月',
  executiveSummary: 'AMD当前市值约2,530亿美元（约$156/股）。逆向DCF模型表明，当前股价要求未来5年数据中心驱动的总体营收复合增速达到21.5%，且营业利润率需从目前的12%稳态提升至28%以上。我们的非共识在于：AMD在x86服务器CPU（EPYC Turin）上继续稳步蚕食英特尔份额，但在AI GPU（MI325X / MI350）上受制于ROCm软件生态的开发者粘性，作为“二供替代方案”的议价权有限，当前估值安全边际较为中性。',
  thesis: {
    marketConsensus: '英特尔服务器CPU溃败赋予AMD无阻力扩张；Instinct系列在2025年将突破70-80亿美元销售，成为仅次于英伟达的第二大算力提供商。',
    variantPerception: '市场忽视了游戏与嵌入式（Xilinx原业务）去库存对总体利润率的拖累；此外，云厂商采购MI300X多出于对英伟达的价格谈判制衡考量，单芯片毛利率显著低于英伟达。',
    catalysts: [
      '新一代MI350系列在大型云厂商（微软、甲骨文）集群中进入大规模生产环境部署',
      'EPYC服务器CPU在企业级与云计算市场的出货金额市占率突破35%',
      '嵌入式与游戏业务环比拐点确认，存货减值准备计提归零'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年数据中心业务营收129亿美元，实现同比翻倍增长；但PC与游戏业务分化，总营收实现256亿美元（同比+14%）。',
    grossMarginDefense: '毛利率维持在49.7%，随着高毛利数据中心产品占比提升，预计2025年有望突破53%。',
    capexAndCashFlowTrajectory: '2024全年实现自由现金流18.6亿美元，随着存货周期企稳，自由现金流转换率有望逐步修复。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=9.0%、永续增长率g=2.5%假设下，当前市值对应未来5年营收复合增速需达21.5%且营业利润率需提升至28.0%。',
    growthVsMarginTradeoff: '若AI加速器年销售未能突破60亿美元，当前市值面临15%-20%下行回调风险。',
    competitiveAdvantagePeriodCap: '当前估值隐含CAP为7.2年，反映市场认可其在CPU/GPU双平台的技术壁垒。'
  },
  verifiableForecasts: [
    {
      id: 'vf-amd-1',
      targetPeriod: '2025 Q1',
      metric: '数据中心业务单季度营收',
      ourPrediction: '$3.8B - $4.1B',
      consensusEstimate: '$3.7B',
      verificationSource: 'SEC 10-Q Data Center Segment Revenue',
      falsificationThreshold: '< $3.4B',
      status: 'pending'
    },
    {
      id: 'vf-amd-2',
      targetPeriod: '2025 Q1',
      metric: 'Non-GAAP 综合毛利率',
      ourPrediction: '54.0% - 55.0%',
      consensusEstimate: '54.0%',
      verificationSource: '10-Q Non-GAAP Financial Highlights',
      falsificationThreshold: '< 52.5%',
      status: 'pending'
    },
    {
      id: 'vf-amd-3',
      targetPeriod: '2025 全年',
      metric: 'Instinct AI 加速器年度出货总额',
      ourPrediction: '$5.5B - $6.5B',
      consensusEstimate: '$6.5B - $7.0B',
      verificationSource: '管理层在业绩会与季报披露的AI芯片收入',
      falsificationThreshold: '< $4.5B (证明二供替代份额不及预期)',
      status: 'pending'
    }
  ],
  killConditions: [
    {
      id: 'kill-amd-1',
      trigger: 'Instinct AI芯片出货在任一主要客户（如微软Azure）出现因软件兼容性导致的缩减采购',
      rationale: 'ROCm生态破局假说破灭，AI期权溢价归零。',
      actionIfTriggered: '调降目标估值30%并坚决离场。'
    },
    {
      id: 'kill-amd-2',
      trigger: '英特尔新一代服务器CPU评测反超并引发EPYC单价主动下调',
      rationale: '基本盘服务器CPU高毛利溢价遭受侵蚀。',
      actionIfTriggered: '转入清仓观察。'
    }
  ]
};
