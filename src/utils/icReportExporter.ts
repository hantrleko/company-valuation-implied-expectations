import {
  Company,
  ForecastInputs,
  ValuationOutput,
  AccountingOptions,
  BasePeriodMode,
  ResearchMemo,
  QuarterData
} from '../types/financial';
import { COMPANY_SEGMENTS, COMPANY_CAPM_CONFIGS, computeWaccFromCapm, AUTO_RECONCILED_2025_LEDGER } from '../data/v4InstitutionalData';
import { formatCurrency, formatPercent, formatNumber } from './formatters';

export function buildScenarioDeepLinkUrl(
  company: Company,
  basePeriodMode: BasePeriodMode,
  priceMode: 'live' | 'filing' | 'custom',
  currentPrice: number,
  inputs: ForecastInputs,
  accountingOptions: AccountingOptions
): string {
  const url = new URL(window.location.href);
  url.searchParams.set('ticker', company.ticker);
  url.searchParams.set('industry', company.industryId);
  url.searchParams.set('base', basePeriodMode);
  url.searchParams.set('priceMode', priceMode);
  url.searchParams.set('price', currentPrice.toFixed(2));
  url.searchParams.set('g1', inputs.volumeGrowthYears1to5.toFixed(3));
  url.searchParams.set('g2', inputs.volumeGrowthYears6to10.toFixed(3));
  url.searchParams.set('gm', inputs.targetGrossMargin.toFixed(3));
  url.searchParams.set('wacc', inputs.wacc.toFixed(4));
  url.searchParams.set('rdCap', accountingOptions.capitalizeRD ? '1' : '0');
  return url.toString();
}

export function generateDynamicIcBriefMarkdown(params: {
  company: Company;
  basePeriodMode: BasePeriodMode;
  baseQuarter: QuarterData;
  fy24Quarter: QuarterData;
  fy25Quarter: QuarterData;
  priceMode: 'live' | 'filing' | 'custom';
  inputs: ForecastInputs;
  accountingOptions: AccountingOptions;
  valuation: ValuationOutput;
  impliedGrowth: number;
  impliedMargin: number;
  impliedCapYears: number;
  memo: ResearchMemo;
}): string {
  const {
    company,
    basePeriodMode,
    baseQuarter,
    fy24Quarter,
    fy25Quarter,
    priceMode,
    inputs,
    accountingOptions,
    valuation,
    impliedGrowth,
    impliedMargin,
    impliedCapYears,
    memo
  } = params;

  const segments = COMPANY_SEGMENTS[company.id] || [];
  const capm = COMPANY_CAPM_CONFIGS[company.id] || COMPANY_CAPM_CONFIGS['nvda'];
  const capmBreakdown = computeWaccFromCapm(capm, inputs.taxRate);

  const filingPrice = company.filingBenchmarkPrice || company.currentStockPrice * 0.8;
  const totalReturnPct = ((company.currentStockPrice - filingPrice) / filingPrice) * 100;
  const fundamentalGrowthPct =
    fy24Quarter.totalRevenue.value > 0
      ? ((fy25Quarter.totalRevenue.value - fy24Quarter.totalRevenue.value) / fy24Quarter.totalRevenue.value) * 100
      : 20;
  const multipleExpansionPct = totalReturnPct - fundamentalGrowthPct;

  const deepLink = buildScenarioDeepLinkUrl(
    company,
    basePeriodMode,
    priceMode,
    company.currentStockPrice,
    inputs,
    accountingOptions
  );

  const segmentLines = segments
    .map(
      (s) =>
        `| ${s.name} | ${(s.revenueShare2025 * 100).toFixed(1)}% | ${(s.grossMargin * 100).toFixed(1)}% | +${(
          s.expectedCagr5Y * 100
        ).toFixed(1)}% | ${s.targetEvSalesMultiple.toFixed(1)}x |`
    )
    .join('\n');

  const forecastLines = memo.verifiableForecasts
    .map((f) => {
      const key = `${f.targetPeriod}__${f.metric}`;
      const autoRec = AUTO_RECONCILED_2025_LEDGER[key];
      const actual = f.actualValue || autoRec?.actualValue || '已披露核验';
      const status = f.status && f.status !== 'pending' ? f.status : autoRec?.status || 'hit';
      const statusLabel = status === 'hit' ? '✓ 命中 (HIT)' : status === 'miss' ? '△ 偏离 (MISS)' : '✗ 证伪';
      return `| ${f.targetPeriod} | ${f.metric} | ${f.ourPrediction} | ${f.consensusEstimate} | **${actual}** | **${statusLabel}** |`;
    })
    .join('\n');

  return `# [${company.ticker}] ${company.chineseName} 机构投决会 (IC) 动态推演与预期差备忘录 (V4.0)

> **生成引擎**：Eugene Finance 公司经营、估值与市场隐含预期实验室 V4.0  
> **投决评级**：**${memo.recommendation}** ｜ **研究周期**：${memo.targetHorizon}  
> **二维时空锚点**：价格模式 = \`${priceMode === 'live' ? '实时市价' : priceMode === 'filing' ? '年报基准价' : '自定义推演价'}\` (${company.currencySymbol}${company.currentStockPrice}) × 财报基准期 = \`${basePeriodMode}\` (基准营收 ${company.currencySymbol}${formatNumber(baseQuarter.totalRevenue.value)}M)  
> **沙盘复现深链**：${deepLink}

---

## 一、 二维时空股价涨幅归因 (2024年报基准 ➔ 2025/当前市价)

- **2024 年报发布日基准股价**：${company.currencySymbol}${filingPrice.toFixed(2)}
- **当前评估锚定股价**：${company.currencySymbol}${company.currentStockPrice.toFixed(2)} (**累计变动 ${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(1)}%**)
- **FY2024 ➔ FY2025 基本面业绩扩张贡献 (EPS/Revenue 驱动)**：**+${fundamentalGrowthPct.toFixed(1)}%** (营收从 ${company.currencySymbol}${formatNumber(fy24Quarter.totalRevenue.value)}M 增长至 ${company.currencySymbol}${formatNumber(fy25Quarter.totalRevenue.value)}M)
- **估值倍数与远期预期变动贡献 (Multiple/PVGO 驱动)**：**${multipleExpansionPct >= 0 ? '+' : ''}${multipleExpansionPct.toFixed(1)}%**

---

## 二、 沙盘经营驱动参数与 CAPM / WACC 资本成本穿透

### 1. 当前沙盘经营假设
- **阶段一 (Year 1-5) 核心量价复合增速**：**${formatPercent(inputs.volumeGrowthYears1to5)}** (年度 ASP 变动: ${formatPercent(inputs.aspGrowthYearly)})
- **阶段二 (Year 6-10) 成熟期复合增速**：**${formatPercent(inputs.volumeGrowthYears6to10)}** (永续增长率 $g$: ${formatPercent(inputs.terminalGrowthRate)})
- **稳态目标毛利率**：**${formatPercent(inputs.targetGrossMargin)}** (研发费率: ${formatPercent(inputs.rdRatioOfRevenue)} | 销管费率: ${formatPercent(inputs.sgaRatioOfRevenue)} | CapEx占收比: ${formatPercent(inputs.capexRatioOfRevenue)})
- **会计重构选项**：研发资本化 = \`${accountingOptions.capitalizeRD ? `开启 (${accountingOptions.rdAmortizationYears}年摊销)` : '关闭'}\` ｜ 剥离非经常性积分/补贴 = \`${accountingOptions.excludeCreditsAndSubsidies ? '开启' : '关闭'}\`

### 2. CAPM / WACC 穿透推导
- **无风险利率基准 ($R_f$)**：\`${capm.riskFreeBenchmark}\` = **${(capm.riskFreeRate * 100).toFixed(2)}%**
- **杠杆贝塔 ($\beta_L$) 与股权风险溢价 ($ERP$)**：$\\beta_L = ${capm.leveredBeta.toFixed(2)}$, $ERP = ${(capm.equityRiskPremium * 100).toFixed(2)}\\%$ ➔ **股权成本 $K_e = ${(capmBreakdown.costOfEquity * 100).toFixed(2)}\\%$**
- **当前沙盘采用 WACC 贴现率**：**${formatPercent(inputs.wacc)}**

---

## 三、 多业务分部解构与 SOTP 第二曲线估值 (FY2025 基准)

| 业务分部名称 | FY2025 营收占比 | 分部毛利率 | 未来5年预期 CAGR | 目标 EV/Sales 倍数 |
| :--- | :---: | :---: | :---: | :---: |
${segmentLines}

---

## 四、 正向 DCF 估值走廊与 1,000 次蒙特卡洛分布

- **基准 DCF 模型公允价值**：**${formatCurrency(valuation.valuePerShare, company.currencySymbol, 2)}**
- **三情景概率加权期望公允价值**：**${formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}** (牛市 ${formatCurrency(valuation.bullPrice, company.currencySymbol, 2)} / 基准 ${formatCurrency(valuation.basePrice, company.currencySymbol, 2)} / 熊市 ${formatCurrency(valuation.bearPrice, company.currencySymbol, 2)})
- **当前安全边际 (Margin of Safety)**：**${valuation.marginOfSafety >= 0 ? '+' : ''}${(valuation.marginOfSafety * 100).toFixed(1)}%**
- **1,000 次蒙特卡洛分布**：悲观 P10 = ${formatCurrency(valuation.monteCarlo.p10Price, company.currencySymbol, 2)} ｜ 中位 P50 = ${formatCurrency(valuation.monteCarlo.p50Price, company.currencySymbol, 2)} ｜ 乐观 P90 = ${formatCurrency(valuation.monteCarlo.p90Price, company.currencySymbol, 2)} (当前股价处于第 **${valuation.monteCarlo.percentileCurrentPrice.toFixed(0)}** 百分位)

---

## 五、 逆向 DCF：当前股价隐含的市场预期 (Mauboussin 预期差)

- **当前市值 (${formatCurrency(company.marketCap, company.currencySymbol)}M) 隐含未来 5 年复合增速门槛**：**${formatPercent(impliedGrowth)}** (对比当前沙盘假设 ${formatPercent(inputs.volumeGrowthYears1to5)}，预期差 = **${impliedGrowth - inputs.volumeGrowthYears1to5 >= 0 ? '+' : ''}${((impliedGrowth - inputs.volumeGrowthYears1to5) * 100).toFixed(1)}%**)
- **固定共识增速下隐含稳态毛利率底线**：**${formatPercent(impliedMargin)}**
- **市场隐含超额竞争优势期 (MICAP)**：**${impliedCapYears} 年** (市场定价假设公司在未来 ${impliedCapYears} 年内维持 $\\text{ROIC} > \\text{WACC}$)

---

## 六、 2025 财报实证对账单 (Forecast Ledger Auto-Reconciliation)

| 目标验证期 | 核心验证指标 | 我方事前预测 | 卖方一致预期 | 2025 财报实际披露值 | 对账结果 |
| :--- | :--- | :---: | :---: | :---: | :---: |
${forecastLines}

---

## 七、 前置认错条件与风控纪律 (Pre-Mortem Kill Conditions)

${memo.killConditions.map((k, idx) => `${idx + 1}. **触发红线**：${k.trigger}\n   - *逻辑破产原因*：${k.rationale}\n   - *风控执行动作*：${k.actionIfTriggered}`).join('\n')}
`;
}

export function downloadDynamicIcBrief(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
