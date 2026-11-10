import React, { useState } from 'react';
import { Company, ValuationOutput, ForecastInputs, AccountingOptions } from '../types/financial';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Sliders, ArrowUpRight, ArrowDownRight, Target, Compass, Flame, ShieldAlert, Sparkles, Zap, Check, Edit3, RotateCcw, Clock } from 'lucide-react';

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
  activePriceMode: 'live' | 'filing' | 'custom';
  onSelectPriceMode: (mode: 'live' | 'filing' | 'custom', customVal?: number) => void;
  liveQuoteTimestamp?: string;
  isLiveConnected?: boolean;
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
  isSandboxOpen,
  activePriceMode,
  onSelectPriceMode,
  liveQuoteTimestamp = '刚刚',
  isLiveConnected = true
}) => {
  const isUndervalued = valuation.marginOfSafety > 0;
  const growthGap = impliedGrowth - inputs.volumeGrowthYears1to5;

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPriceInput, setTempPriceInput] = useState(valuation.currentPrice.toString());

  // Range gauge calculation
  const minVal = Math.min(valuation.bearPrice, valuation.currentPrice * 0.7);
  const maxVal = Math.max(valuation.bullPrice, valuation.currentPrice * 1.3);
  const rangeSpan = Math.max(maxVal - minVal, 1);
  const pricePct = Math.min(Math.max(((valuation.currentPrice - minVal) / rangeSpan) * 100, 2), 98);
  const fairValuePct = Math.min(Math.max(((valuation.expectedValuePerShare - minVal) / rangeSpan) * 100, 2), 98);

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempPriceInput);
    if (!isNaN(val) && val > 0) {
      onSelectPriceMode('custom', val);
      setIsEditingPrice(false);
    }
  };

  return (
    <div className="bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md sticky top-[53px] z-25 py-2 px-4 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Price Mode Switcher & Real-time Value */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Quote Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300">{isLiveConnected ? '实时行情直连' : '收盘快照'}</span>
            <span className="text-slate-500">· {liveQuoteTimestamp}</span>
          </div>

          {/* Price Time-Machine Switcher (三档切换) */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
            <button
              onClick={() => {
                setIsEditingPrice(false);
                onSelectPriceMode('live');
              }}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                activePriceMode === 'live' 
                  ? 'bg-cyan-600 text-white font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>实时市价</span>
              <span className="text-[10px] opacity-80">{company.currencySymbol}{company.currentStockPrice}</span>
            </button>

            <button
              onClick={() => {
                setIsEditingPrice(false);
                onSelectPriceMode('filing');
              }}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                activePriceMode === 'filing' 
                  ? 'bg-amber-600 text-white font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="2024财报发布基准日股价"
            >
              <span>年报发布日</span>
              <span className="text-[10px] opacity-80">{company.currencySymbol}{company.filingBenchmarkPrice || 138.5}</span>
            </button>

            {!isEditingPrice ? (
              <button
                onClick={() => {
                  setTempPriceInput(valuation.currentPrice.toString());
                  setIsEditingPrice(true);
                }}
                className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  activePriceMode === 'custom' 
                    ? 'bg-purple-600 text-white font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="输入任意假设价格反解隐含预期"
              >
                <Edit3 className="w-3 h-3" />
                <span>{activePriceMode === 'custom' ? `自定义 $${valuation.currentPrice}` : '自定义'}</span>
              </button>
            ) : (
              <form onSubmit={handlePriceSubmit} className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  value={tempPriceInput}
                  onChange={(e) => setTempPriceInput(e.target.value)}
                  className="w-16 bg-slate-950 border border-cyan-500 text-cyan-300 px-1 py-0.5 rounded text-[11px] font-mono focus:outline-none"
                  placeholder="价格"
                />
                <button
                  type="submit"
                  className="px-1.5 py-0.5 rounded bg-cyan-600 text-white font-bold text-[10px]"
                >
                  确定
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPrice(false)}
                  className="px-1 py-0.5 text-slate-400 hover:text-slate-200 text-[10px]"
                >
                  ✕
                </button>
              </form>
            )}
          </div>

          {/* Current Fair Value */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono">|</span>
            <span className="text-slate-400">公允值:</span>
            <span className="font-mono font-black text-cyan-300 text-sm">
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
          <div className="hidden xl:flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">
              {formatCurrency(minVal, company.currencySymbol, 0)}
            </span>
            <div className="relative w-28 h-2 bg-slate-800 rounded-full overflow-visible my-auto">
              <div 
                className="absolute top-0 bottom-0 bg-cyan-950/60 rounded-full"
                style={{ 
                  left: `${Math.min(pricePct, fairValuePct)}%`, 
                  width: `${Math.abs(fairValuePct - pricePct)}%` 
                }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-950 shadow-[0_0_8px_#22d3ee]"
                style={{ left: `${fairValuePct}%` }}
                title={`模型公允值: ${valuation.expectedValuePerShare}`}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 shadow-[0_0_8px_#fbbf24]"
                style={{ left: `${pricePct}%` }}
                title={`当前计算市价: ${valuation.currentPrice}`}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {formatCurrency(maxVal, company.currencySymbol, 0)}
            </span>
          </div>
        </div>

        {/* Center: Expectation Gap & Reverse Signals */}
        <div className="flex items-center gap-2.5 font-mono text-[11px] flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">当前市价隐含CAGR:</span>
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
