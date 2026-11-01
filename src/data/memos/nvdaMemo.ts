import { ResearchMemo } from '../../types/financial';

export const NVDA_MEMO: ResearchMemo = {
  id: 'memo-nvda-2025',
  companyId: 'nvda',
  industryId: 'semiconductors',
  title: '英伟达 (NVDA)：AI算力工业革命与全栈网络税——当前市值隐含的云巨头Capex天花板与Blackwell放量节奏',
  subtitle: '基于SEC 10-K/10-Q重构、CUDA生态转换壁垒与逆向DCF推演',
  author: 'Eugene Han',
  date: '2025-02-26',
  recommendation: '买入 (Buy)',
  targetHorizon: '12-18 个月',
  executiveSummary: '英伟达当前市值约3.39万亿美元（约$138.5/股）。逆向DCF模型反解显示，当前股价隐含未来5年数据中心算力营收复合增速需达23.5%且终端营业利润率需维持在62%的高位。我们的非共识在于：市场普遍担忧四大云巨头（CSP）资本开支无法长久持续，但低估了Blackwell架构在推理侧的能效比飞跃与NVLink网络交换芯片（Spectrum-X）对传统网络设备的替代速度，生态护城河依然深不可测。',
  thesis: {
    marketConsensus: '云厂商（微软、谷歌、Meta、亚马逊）2025年CapEx增速将由翻倍放缓至20%-25%，后续AI大模型商业化ROI不足将引发硬件砍单；定制化ASIC芯片份额将侵蚀通用GPU。',
    variantPerception: '1) Blackwell GB200机柜级方案将价值量由单芯片拓展至铜缆连接与液冷系统，推高单机柜ASP至300万美元以上；2) 模型推理算力需求伴随DeepSeek及多模态视频模型爆发出现数倍扩张，推理算力消耗将接棒训练成为主力；3) 软件CUDA生态导致客户迁移成本极高。',
    catalysts: [
      'Blackwell Ultra与B200芯片解决封装良率后单季度向云巨头全量出货超200万颗',
      '网络业务（NVLink / InfiniBand / Spectrum-X）年化收入突破250亿美元',
      '主权AI（中东、欧洲及日韩国家级算力采购）订单实质性兑现'
    ]
  },
  driversAnalysis: {
    volumeAndAspDynamics: '2024全年实现营业收入1,291亿美元，同比暴增112%；数据中心营收占比突破87%，单芯片等效ASP维持在1.7万-1.8万美元高位。',
    grossMarginDefense: '综合毛利率由2023年的73.1%提升至2024年的75.3%，展现出垄断性定价权与台积电先进制程代工成本转嫁能力。',
    capexAndCashFlowTrajectory: '轻资产Fabless模式赋予其极致自由现金流生成能力，2024全年经营活动现金流666亿美元，自由现金流650亿美元，FCF转化率高达90%以上。'
  },
  reverseValuationAnalysis: {
    impliedExpectationsSummary: '在WACC=9.2%、永续增长率g=2.8%假设下，当前3.39万亿市值对应未来5年营收复合增速需达23.5%（2029年需达3,700亿美元），或在增速为18%情景下要求净利率保持在58%以上。',
    growthVsMarginTradeoff: '当前估值对毛利率敏感性极高，若Blackwell早期毛利率因复杂组装降至71%，则需要更高的出货量增速以弥补。',
    competitiveAdvantagePeriodCap: '当前估值隐含超额竞争优势期（CAP）长达13.5年，市场几乎将其定价为全人类AI基础设施唯一的常青卖水人。'
  },
  verifiableForecasts: [
    {
      id: 'vf-nvda-1',
      targetPeriod: '2025 Q1 (FY26Q1)',
      metric: '数据中心业务单季营业收入',
      ourPrediction: '$36.5B - $38.5B',
      consensusEstimate: '$34.8B',
      verificationSource: 'SEC 8-K 季度业绩分部收入披露',
      falsificationThreshold: '< $33.5B (证明云厂商CapEx出现收紧)',
      actualValue: '$37.2B',
      status: 'hit',
      verificationNotes: 'Blackwell早期小批量发货与Hopper强劲补库驱动超预期'
    },
    {
      id: 'vf-nvda-2',
      targetPeriod: '2025 Q1',
      metric: '综合销售毛利率 (GAAP)',
      ourPrediction: '73.0% - 74.0%',
      consensusEstimate: '73.2%',
      verificationSource: '10-Q 利润表 Gross Margin',
      falsificationThreshold: '< 71.0%',
      status: 'pending'
    },
    {
      id: 'vf-nvda-3',
      targetPeriod: '2025 全年',
      metric: '自由现金流 (FCFF)',
      ourPrediction: '$78B - $85B',
      consensusEstimate: '$72B',
      verificationSource: '10-K 现金流量表经营现金流净额减CapEx',
      falsificationThreshold: '< $65B',
      status: 'pending'
    }
  ],
  killConditions: [
    {
      id: 'kill-nvda-1',
      trigger: '四大云巨头（微软/Meta/谷歌/亚马逊）最新财报合计AI CapEx指引出现同比负增长',
      rationale: '上游买方投资回报率破产，算力采购军备竞赛终结，硬件需求进入断崖期。',
      actionIfTriggered: '坚决平仓并大幅调低估值模型至周期股倍数（15-20x P/E）。'
    },
    {
      id: 'kill-nvda-2',
      trigger: '单季度综合毛利率连续两个季度跌破 68.0%',
      rationale: '证明台积电先进制程涨价及ASIC替代竞争彻底侵蚀英伟达垄断超额溢价。',
      actionIfTriggered: '将目标价下调30%，转为审慎防守。'
    }
  ]
};
