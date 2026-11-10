import React from 'react';
import { Company, ValuationOutput, ForecastInputs } from '../../types/financial';
import { calculateForwardDCF } from '../../utils/dcfSolver';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { DollarSign, ShieldCheck, Scale, ArrowUpRight, ArrowDownRight, Layers, BarChart3, Activity, Compass, Flame } from 'lucide-react';

interface ValuationRangeStageProps {
  company: Company;
  valuation: ValuationOutput;
  inputs: ForecastInputs;
  baseDeliveries: number;
  baseAsp: number;
  baseRevenue: number;
}

export const ValuationRangeStage: React.FC<ValuationRangeStageProps> = ({
  company,
  valuation,
  inputs,
  baseDeliveries,
  baseAsp,
  baseRevenue
}) => {
  const isUndervalued = valuation.marginOfSafety > 0;
  const mc = valuation.monteCarlo;

  // Valuation Football Field data
  // 1. Steady State per share
  const steadyStatePerShare = Number(((valuation.steadyStateValue - valuation.netDebt) / company.sharesOutstanding).toFixed(2));
  
  // 2. Scenario Range: Bear to Bull
  const scenarioLow = valuation.bearPrice;
  const scenarioHigh = valuation.bullPrice;

  // 3. Monte Carlo P10 to P90
  const mcLow = mc.p10Price;
  const mcHigh = mc.p90Price;

  // 4. Sensitivity Range: WACC +1% / g -0.5% (low) to WACC -1% / g +0.5% (high)
  const lowWaccInputs = { ...inputs, wacc: inputs.wacc + 0.01, terminalGrowthRate: Math.max(inputs.terminalGrowthRate - 0.005, 0.015) };
  const highWaccInputs = { ...inputs, wacc: Math.max(inputs.wacc - 0.01, 0.06), terminalGrowthRate: inputs.terminalGrowthRate + 0.005 };
  const sensLowVal = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, lowWaccInputs, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;
  const sensHighVal = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, highWaccInputs, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;

  // Min and Max for football field scaling
  const fieldMin = Math.min(steadyStatePerShare * 0.9, scenarioLow, mcLow, sensLowVal, company.currentStockPrice * 0.6);
  const fieldMax = Math.max(scenarioHigh, mcHigh, sensHighVal, company.currentStockPrice * 1.4);
  const fieldSpan = Math.max(fieldMax - fieldMin, 1);

  const getLeftPct = (val: number) => Math.max(((val - fieldMin) / fieldSpan) * 100, 2);
  const getWidthPct = (low: number, high: number) => Math.max(((high - low) / fieldSpan) * 100, 4);

  const currentPricePct = getLeftPct(company.currentStockPrice);

  // Tornado Sensitivity Data: Impact of +/- 10% change in key variables on Value Per Share
  const baseFair = valuation.valuePerShare;
  
  // Volume +10% / -10%
  const valVolUp = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, volumeGrowthYears1to5: inputs.volumeGrowthYears1to5 * 1.15 }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;
  const valVolDown = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, volumeGrowthYears1to5: inputs.volumeGrowthYears1to5 * 0.85 }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;

  // Margin +200bps / -200bps
  const valMarginUp = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, targetGrossMargin: inputs.targetGrossMargin + 0.02 }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;
  const valMarginDown = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, targetGrossMargin: inputs.targetGrossMargin - 0.02 }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;

  // WACC -50bps / +50bps
  const valWaccDown = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, wacc: inputs.wacc - 0.005 }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;
  const valWaccUp = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, wacc: inputs.wacc + 0.005 }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;

  // CapEx -200bps / +200bps
  const valCapexDown = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, capexRatioOfRevenue: Math.max(inputs.capexRatioOfRevenue - 0.02, 0.01) }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;
  const valCapexUp = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, { ...inputs, capexRatioOfRevenue: inputs.capexRatioOfRevenue + 0.02 }, company.netDebt, company.sharesOutstanding, company.currentStockPrice).valuePerShare;

  const tornadoList = [
    { name: '未来5年出货/交付增速 (CAGR ±15%)', low: valVolDown, high: valVolUp, swing: Math.abs(valVolUp - valVolDown) },
    { name: '稳态销售毛利率 (Target Margin ±200bps)', low: valMarginDown, high: valMarginUp, swing: Math.abs(valMarginUp - valMarginDown) },
    { name: '加权平均资本成本 (WACC ±50bps)', low: valWaccUp, high: valWaccDown, swing: Math.abs(valWaccDown - valWaccUp) },
    { name: '资本开支强度 (CapEx/Sales ±200bps)', low: valCapexUp, high: valCapexDown, swing: Math.abs(valCapexDown - valCapexUp) }
  ].sort((a, b) => b.swing - a.swing);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
              阶段 05 ｜ 估值走廊与蒙特卡洛分布 (v3.1)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              1,000次随机抽样 ＆ 足球场估值区间
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5">
            {company.chineseName} 企业价值 (EV)、股权价值与估值概率走廊
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            价值是一条概率分布走廊而非单一目标价。本模块并列呈现华尔街足球场区间图、1,000次蒙特卡洛随机模拟直方图与龙卷风敏感性归因，衡量价格所处百分位与盈亏比。
          </p>
        </div>
      </div>

      {/* Target Price & Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fair Value per share */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">基准模型公允价值 (每股)</span>
          <div className="text-3xl font-black font-mono text-cyan-300 mt-2">
            {formatCurrency(valuation.valuePerShare, company.currencySymbol, 2)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-slate-500">当前市价:</span>
            <span className="font-mono text-slate-300">
              {formatCurrency(valuation.currentPrice, company.currencySymbol, 2)}
            </span>
          </div>
        </div>

        {/* Margin of Safety */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">安全边际 (Margin of Safety)</span>
          <div className={`text-3xl font-black font-mono mt-2 flex items-center gap-1 ${
            isUndervalued ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isUndervalued ? '+' : ''}{(valuation.marginOfSafety * 100).toFixed(1)}%
            {isUndervalued ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            当前市价处于蒙特卡洛分布的 <strong className="text-cyan-400 font-mono">P{mc.percentileCurrentPrice}</strong> 分位
          </div>
        </div>

        {/* Expected Probability Weighted */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">概率加权期望公允值</span>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
            {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            牛({valuation.bullPrice}) / 基({valuation.basePrice}) / 熊({valuation.bearPrice})
          </div>
        </div>

        {/* Net Debt / Cash */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">资产负债表现金调节</span>
          <div className="text-3xl font-black font-mono text-amber-300 mt-2">
            {valuation.netDebt < 0 ? '净现金 +' : '净负债 -'}{formatCurrency(Math.abs(valuation.netDebt), company.currencySymbol)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            高流动性现金及短期投资扣除有息借款
          </div>
        </div>
      </div>

      {/* Visual 1: Wall Street "Football Field" Valuation Range Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              华尔街“足球场”估值区间对比图 (Valuation Football Field)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              当前市价: {formatCurrency(company.currentStockPrice, company.currencySymbol, 2)}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4 relative">
          {/* Vertical Current Price Benchmark Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 dashed z-20 pointer-events-none"
            style={{ left: `${currentPricePct}%` }}
          >
            <div className="absolute -top-3 -translate-x-1/2 bg-amber-400 text-slate-950 font-mono text-[9px] font-black px-1.5 py-0.2 rounded shadow">
              市价
            </div>
          </div>

          {/* Bar 1: Steady-State EP */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">1. 现有资产零增长价值 (Steady-State Earning Power)</span>
              <span className="font-mono text-slate-400">${steadyStatePerShare}</span>
            </div>
            <div className="relative w-full h-4 bg-slate-900 rounded-md overflow-hidden">
              <div
                style={{ left: `0%`, width: `${getLeftPct(steadyStatePerShare)}%` }}
                className="absolute top-0 bottom-0 bg-slate-600 rounded-md"
              />
            </div>
          </div>

          {/* Bar 2: Scenario Range (Bear to Bull) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">2. 确定性三情景预测区间 (Bear ➔ Base ➔ Bull)</span>
              <span className="font-mono text-cyan-300">${scenarioLow} ~ ${scenarioHigh} (基准: ${valuation.basePrice})</span>
            </div>
            <div className="relative w-full h-4 bg-slate-900 rounded-md overflow-hidden">
              <div
                style={{ left: `${getLeftPct(scenarioLow)}%`, width: `${getWidthPct(scenarioLow, scenarioHigh)}%` }}
                className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500 via-cyan-500 to-emerald-500 rounded-md shadow-md"
              />
            </div>
          </div>

          {/* Bar 3: Monte Carlo P10 to P90 */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">3. 蒙特卡洛 1,000次模拟置信区间 (P10 ➔ P90 走廊)</span>
              <span className="font-mono text-purple-300">${mcLow} ~ ${mcHigh} (中位数 P50: ${mc.p50Price})</span>
            </div>
            <div className="relative w-full h-4 bg-slate-900 rounded-md overflow-hidden">
              <div
                style={{ left: `${getLeftPct(mcLow)}%`, width: `${getWidthPct(mcLow, mcHigh)}%` }}
                className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-md shadow-md"
              />
            </div>
          </div>

          {/* Bar 4: Sensitivity Extreme Range */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-semibold">4. 宏观敏感性极值区间 (WACC ±100bps ｜ 永续增长 g ±50bps)</span>
              <span className="font-mono text-amber-300">${sensLowVal} ~ ${sensHighVal}</span>
            </div>
            <div className="relative w-full h-4 bg-slate-900 rounded-md overflow-hidden">
              <div
                style={{ left: `${getLeftPct(sensLowVal)}%`, width: `${getWidthPct(sensLowVal, sensHighVal)}%` }}
                className="absolute top-0 bottom-0 bg-amber-600/70 rounded-md border border-amber-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual 2: Monte Carlo Visual Histogram Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              1,000次蒙特卡洛模拟估值分布走廊 (Monte Carlo Density)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">P10: <strong className="text-rose-400">{formatCurrency(mc.p10Price, company.currencySymbol, 1)}</strong></span>
            <span className="text-slate-400">P50: <strong className="text-cyan-400">{formatCurrency(mc.p50Price, company.currencySymbol, 1)}</strong></span>
            <span className="text-slate-400">P90: <strong className="text-emerald-400">{formatCurrency(mc.p90Price, company.currencySymbol, 1)}</strong></span>
          </div>
        </div>

        {/* Histogram Bar Chart */}
        <div className="mt-5 space-y-2">
          <div className="grid grid-cols-10 gap-2 items-end h-36 pt-4 border-b border-slate-850 pb-2">
            {mc.buckets.map((b, idx) => {
              const maxCount = Math.max(...mc.buckets.map(item => item.count), 1);
              const heightPct = Math.max((b.count / maxCount) * 100, 4);
              const isCurrentPriceInBucket = company.currentStockPrice >= b.priceMin && company.currentStockPrice <= b.priceMax;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {b.percentage}%
                  </div>
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      isCurrentPriceInBucket
                        ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 border-2 border-amber-400 shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                  <div className="text-[9px] font-mono text-slate-500 mt-2 truncate w-full text-center">
                    {b.priceMin}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>低估悲观边界 (P10)</span>
            <span className="text-cyan-400 font-medium">当前股价处于整体估值分布的第 {mc.percentileCurrentPrice} 百分位</span>
            <span>高估乐观边界 (P90)</span>
          </div>
        </div>
      </div>

      {/* Visual 3: Tornado Sensitivity Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              龙卷风敏感性归因图 (Tornado Sensitivity: 各假设微调对每股价值的摆幅排序)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            基准公允值: ${baseFair}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {tornadoList.map((item, idx) => {
            return (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <span className="font-mono text-cyan-300">
                    摆动范围: ${item.low} ~ ${item.high} (Δ ${item.swing.toFixed(1)})
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex relative">
                  <div 
                    style={{ width: `${Math.min((item.swing / 120) * 100, 100)}%` }}
                    className="bg-gradient-to-r from-cyan-600 to-indigo-500 h-full rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mauboussin Value Bridge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">
            价值构成穿透：存量资产静态价值 vs. 增长期权 (PVGO)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-xs text-slate-400">1. 现有资产零增长价值 (Steady-State Earning Power)</span>
            <div className="text-2xl font-black font-mono text-slate-200 mt-1">
              {formatCurrency(valuation.steadyStateValue, company.currencySymbol)}M
            </div>
            <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              即刻停止任何再投资扩产，维持当前规模与NOPAT水平永续经营的静态现值。
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/30">
            <span className="text-xs text-cyan-400">2. 未来增长与期权现值 (PVGO)</span>
            <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
              {formatCurrency(valuation.growthValuePvgo, company.currencySymbol)}M
            </div>
            <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              市场对未来新产品放量、先进制程突破与全球化出海所支付的“成长溢价”。
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-xs text-amber-400">3. 净现金保护垫</span>
            <div className="text-2xl font-black font-mono text-amber-300 mt-1">
              {formatCurrency(-valuation.netDebt, company.currencySymbol)}M
            </div>
            <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              账面高流动性现金及短期投资扣除有息借款后的净安全垫。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
