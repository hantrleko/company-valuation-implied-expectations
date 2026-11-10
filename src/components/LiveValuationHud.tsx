import React from 'react';
import { Company, ValuationOutput, ForecastInputs, AccountingOptions } from '../types/financial';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Sliders, ArrowUpRight, ArrowDownRight, Target, Compass, Flame, ShieldAlert, Sparkles, Zap, Check } from 'lucide-react';

interface LiveValuationHudProps {
  company: Company;
  valuation: ValuationOutput;
  inputs: ForecastInputs;
  accountingOptions: AccountingOptions;
  impliedGrowth: number;
  impliedMargin: number;
  impliedCapYears: number;
  onOpenSandbox: () => void;
  isSandboxOpen: boolean;
}

export const LiveValuationHud: React.FC<LiveValuationHudProps> = ({
  company,
  valuation,
  inputs,
  accountingOptions,
  impliedGrowth,
  impliedMargin,
  impliedCapYears,
  onOpenSandbox,
  isSandboxOpen
}) => {
  const isUndervalued = valuation.marginOfSafety > 0;
  const growthGap = impliedGrowth - inputs.volumeGrowthYears1to5; // Positive means market requires MORE growth than our model assumes

  // Range gauge calculation
  const minVal = Math.min(valuation.bearPrice, valuation.currentPrice * 0.7);
  const maxVal = Math.max(valuation.bullPrice, valuation.currentPrice * 1.3);
  const rangeSpan = Math.max(maxVal - minVal, 1);
  const pricePct = Math.min(Math.max(((valuation.currentPrice - minVal) / rangeSpan) * 100, 2), 98);
  const fairValuePct = Math.min(Math.max(((valuation.expectedValuePerShare - minVal) / rangeSpan) * 100, 2), 98);

  return (
    <div className="bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-[53px] z-25 py-2 px-4 shadow-lg transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Real-time Price vs Fair Value & Gauge */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-100 text-sm">
              {company.ticker.replace('.SZ', '')}
            </span>
            <span className="font-mono text-slate-400">
              {formatCurrency(valuation.currentPrice, company.currencySymbol, 2)}
            </span>
            <span className="text-slate-600">vs</span>
            <span className="text-slate-400">公允值:</span>
            <span className="font-mono font-bold text-cyan-300 text-sm">
              {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
            </span>
          </div>

          {/* Safety Margin Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold border ${
            isUndervalued 
              ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60' 
              : 'bg-rose-950/70 text-rose-400 border-rose-800/60'
          }`}>
            {isUndervalued ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>安全边际: {isUndervalued ? '+' : ''}{(valuation.marginOfSafety * 100).toFixed(1)}%</span>
            <span className="opacity-75 text-[10px] pl-1">P{valuation.monteCarlo.percentileCurrentPrice}</span>
          </div>

          {/* Mini Visual Dual-Cursor Range Bar */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">
              {formatCurrency(minVal, company.currencySymbol, 0)}
            </span>
            <div className="relative w-32 h-2 bg-slate-800 rounded-full overflow-visible my-auto">
              {/* Range fill */}
              <div 
                className="absolute top-0 bottom-0 bg-cyan-950/60 rounded-full"
                style={{ 
                  left: `${Math.min(pricePct, fairValuePct)}%`, 
                  width: `${Math.abs(fairValuePct - pricePct)}%` 
                }}
              />
              {/* Fair Value cursor */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-950 shadow-[0_0_8px_#22d3ee]"
                style={{ left: `${fairValuePct}%` }}
                title={`模型公允值: ${valuation.expectedValuePerShare}`}
              />
              {/* Current Price cursor */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 shadow-[0_0_8px_#fbbf24]"
                style={{ left: `${pricePct}%` }}
                title={`当前市价: ${valuation.currentPrice}`}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {formatCurrency(maxVal, company.currencySymbol, 0)}
            </span>
          </div>
        </div>

        {/* Center: Expectation Gap & Reverse Signals */}
        <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">隐含销量CAGR:</span>
            <span className="text-amber-300 font-bold">{formatPercent(impliedGrowth)}</span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">
              (我方: {formatPercent(inputs.volumeGrowthYears1to5)})
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">毛利率底线:</span>
            <span className="text-cyan-300 font-bold">{formatPercent(impliedMargin)}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">MICAP优势期:</span>
            <span className="text-purple-300 font-bold">{impliedCapYears}年</span>
          </div>

          {/* Accounting status pill */}
          {accountingOptions.capitalizeRD && (
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
              <Sparkles className="w-3 h-3" /> 研发资本化
            </span>
          )}
        </div>

        {/* Right: Quick Sandbox Drawer Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSandbox}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isSandboxOpen
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'bg-slate-900 hover:bg-slate-850 text-cyan-400 border-cyan-800/50 hover:border-cyan-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>实时参数沙盘</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 font-mono text-cyan-300 ml-0.5">
              Live
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
