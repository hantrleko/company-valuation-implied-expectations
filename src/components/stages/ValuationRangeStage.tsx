import React from 'react';
import { Company, ValuationOutput, ForecastInputs } from '../../types/financial';
import { calculateForwardDCF } from '../../utils/dcfSolver';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { DollarSign, ShieldCheck, Scale, ArrowUpRight, ArrowDownRight, Layers, BarChart3, Activity } from 'lucide-react';

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
  
  // Sensitivity table for WACC vs. Terminal Growth
  const waccList = [inputs.wacc - 0.01, inputs.wacc - 0.005, inputs.wacc, inputs.wacc + 0.005, inputs.wacc + 0.01];
  const gList = [inputs.terminalGrowthRate - 0.005, inputs.terminalGrowthRate, inputs.terminalGrowthRate + 0.005];

  const mc = valuation.monteCarlo;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              阶段 05 ｜ 估值区间与蒙特卡洛分布 (v3.0)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              1,000次随机抽样概率走廊
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            企业价值 (EV)、股权价值与蒙特卡洛估值概率分布
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            价值是一条概率分布走廊。本模块融合确定性DCF拆解与1,000次蒙特卡洛模拟，展示当前市场价格处于内在价值概率分布的具体百分位。
          </p>
        </div>
      </div>

      {/* Target Price & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Fair Value per share */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">基准公允价值 (每股)</span>
          <div className="text-3xl font-extrabold font-mono text-cyan-300 mt-2">
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
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">安全边际 (Margin of Safety)</span>
          <div className={`text-3xl font-extrabold font-mono mt-2 flex items-center gap-1 ${
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
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">概率加权期望公允值</span>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">
            {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            牛({valuation.bullPrice}) / 基({valuation.basePrice}) / 熊({valuation.bearPrice})
          </div>
        </div>

        {/* Net Debt / Cash */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">资产负债表现金调节</span>
          <div className="text-3xl font-extrabold font-mono text-amber-300 mt-2">
            {valuation.netDebt < 0 ? '净现金 +' : '净负债 -'}{formatCurrency(Math.abs(valuation.netDebt), company.currencySymbol)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            高流动性现金及短期投资扣除有息负债
          </div>
        </div>
      </div>

      {/* Monte Carlo Visual Histogram Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              1,000次蒙特卡洛模拟估值分布走廊 (Monte Carlo Simulation)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">P10: <strong className="text-rose-400">{formatCurrency(mc.p10Price, company.currencySymbol, 1)}</strong></span>
            <span className="text-slate-400">中位数 P50: <strong className="text-cyan-400">{formatCurrency(mc.p50Price, company.currencySymbol, 1)}</strong></span>
            <span className="text-slate-400">P90: <strong className="text-emerald-400">{formatCurrency(mc.p90Price, company.currencySymbol, 1)}</strong></span>
          </div>
        </div>

        {/* Histogram Bar Chart */}
        <div className="mt-5 space-y-2">
          <div className="grid grid-cols-10 gap-1.5 items-end h-32 pt-4">
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
                        ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 border-2 border-white shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  ></div>
                  <div className="text-[9px] font-mono text-slate-500 mt-2 truncate w-full text-center">
                    {b.priceMin}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-850">
            <span>低估悲观边界 (P10)</span>
            <span className="text-cyan-400 font-medium">当前股价处于整体估值分布的第 {mc.percentileCurrentPrice} 百分位</span>
            <span>高估乐观边界 (P90)</span>
          </div>
        </div>
      </div>

      {/* Mauboussin Value Bridge (Value Decomposition) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-slate-100">
            价值构成穿透：存量资产静态价值 vs. 增长期权 (PVGO)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-xs text-slate-400">1. 现有资产零增长价值 (Steady-State Earning Power)</span>
            <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
              {formatCurrency(valuation.steadyStateValue, company.currencySymbol)}M
            </div>
            <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              即刻停止任何再投资扩产，维持当前规模与NOPAT水平永续经营的静态现值。
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/30">
            <span className="text-xs text-cyan-400">2. 未来增长与期权现值 (PVGO)</span>
            <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
              {formatCurrency(valuation.growthValuePvgo, company.currencySymbol)}M
            </div>
            <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              市场对未来新车型放量、制程突破、软件货币化与全球化出海所支付的“成长溢价”。
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-xs text-amber-400">3. 净现金保护垫</span>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
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
