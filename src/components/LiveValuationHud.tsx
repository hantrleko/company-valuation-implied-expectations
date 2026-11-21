import React, { useState } from 'react';
import { Company, ValuationOutput, ForecastInputs, AccountingOptions, BasePeriodMode } from '../types/financial';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Compass,
  Flame,
  Edit3,
  Layers,
  Share2,
  Download,
  Check
} from 'lucide-react';

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
  basePeriodMode: BasePeriodMode;
  onSelectBasePeriodMode: (mode: BasePeriodMode) => void;
  fy24Revenue: number;
  fy25Revenue: number;
  onCopyDeepLink: () => void;
  onExportIcBrief: () => void;
  liveQuoteTimestamp?: string;
  isLiveConnected?: boolean;
}

export const LiveValuationHud: React.FC<LiveValuationHudProps> = ({
  company,
  valuation,
  inputs,
  impliedGrowth,
  impliedMargin,
  impliedCapYears,
  onOpenSandbox,
  isSandboxOpen,
  activePriceMode,
  onSelectPriceMode,
  basePeriodMode,
  onSelectBasePeriodMode,
  fy24Revenue,
  fy25Revenue,
  onCopyDeepLink,
  onExportIcBrief,
  liveQuoteTimestamp = '刚刚',
  isLiveConnected = true
}) => {
  const isUndervalued = valuation.marginOfSafety > 0;
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPriceInput, setTempPriceInput] = useState(valuation.currentPrice.toString());
  const [linkCopied, setLinkCopied] = useState(false);

  // 2D Attribution calculation: Stock Return from 2024 Filing Benchmark vs FY25 Fundamental Revenue Growth
  const filingPrice = company.filingBenchmarkPrice || company.currentStockPrice * 0.78;
  const stockGainPct = ((valuation.currentPrice - filingPrice) / filingPrice) * 100;
  const fundamentalGrowthPct = fy24Revenue > 0 ? ((fy25Revenue - fy24Revenue) / fy24Revenue) * 100 : 25;
  const multipleExpansionPct = stockGainPct - fundamentalGrowthPct;

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

  const handleCopyClick = () => {
    onCopyDeepLink();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md sticky top-[53px] z-25 py-2 px-4 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left: 2D Time-Machine (Dimension A: Price Anchor × Dimension B: Fundamental Base Period) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Quote Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300">{isLiveConnected ? '实时直连' : '收盘快照'}</span>
            <span className="text-slate-500 hidden sm:inline">· {liveQuoteTimestamp}</span>
          </div>

          {/* Dimension A: Price Mode Switcher */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
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
              <span>实时价</span>
              <span className="text-[10px] opacity-90">{company.currencySymbol}{company.currentStockPrice}</span>
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
              title="2024年报披露日历史基准价"
            >
              <span>24年报日</span>
              <span className="text-[10px] opacity-85">{company.currencySymbol}{company.filingBenchmarkPrice || 138.5}</span>
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
                <span>{activePriceMode === 'custom' ? `${company.currencySymbol}${valuation.currentPrice}` : '自定义'}</span>
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

          <span className="text-slate-600 font-mono font-bold">×</span>

          {/* Dimension B: Fundamental Base Period Switcher (2025-FY vs 2024-FY) */}
          <div
            className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]"
            title="切换DCF与逆向反解的基本面财报基准期 (二维时空矩阵)"
          >
            <button
              onClick={() => onSelectBasePeriodMode('2025-FY')}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                basePeriodMode === '2025-FY'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>2025最新财报基准</span>
            </button>
            <button
              onClick={() => onSelectBasePeriodMode('2024-FY')}
              className={`px-2 py-0.5 rounded transition-all ${
                basePeriodMode === '2024-FY'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>2024历史基准</span>
            </button>
          </div>

          {/* Current Fair Value & Margin of Safety */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">公允值:</span>
            <span className="font-mono font-black text-cyan-300 text-sm">
              {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold border ${
              isUndervalued
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                : 'bg-rose-950/70 text-rose-400 border-rose-800/60'
            }`}
          >
            {isUndervalued ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>安全边际: {isUndervalued ? '+' : ''}{(valuation.marginOfSafety * 100).toFixed(1)}%</span>
            <span className="opacity-75 text-[10px]">P{valuation.monteCarlo.percentileCurrentPrice}</span>
          </div>
        </div>

        {/* Center: 2D Return Attribution & Implied Expectations */}
        <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
          {/* 2D Attribution Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px]"
            title="从2024年报基准日至今的股价变动归因：基本面业绩增长 vs 估值预期变动"
          >
            <span className="text-slate-400">跨期归因:</span>
            <span className="text-emerald-400 font-bold">业绩+{fundamentalGrowthPct.toFixed(0)}%</span>
            <span className="text-slate-600">/</span>
            <span className={multipleExpansionPct >= 0 ? 'text-amber-300 font-bold' : 'text-cyan-300 font-bold'}>
              估值{multipleExpansionPct >= 0 ? '+' : ''}{multipleExpansionPct.toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">隐含5Y增速:</span>
            <span className="text-amber-300 font-bold">{formatPercent(impliedGrowth)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">毛利底线:</span>
            <span className="text-cyan-300 font-bold">{formatPercent(impliedMargin)}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">MICAP:</span>
            <span className="text-purple-300 font-bold">{impliedCapYears}年</span>
          </div>
        </div>

        {/* Right: Deep-Link Share, IC Export & Quick Sandbox Drawer Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyClick}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-colors"
            title="复制包含当前全部滑块假设、二维时空基准与股价的沙盘深链 URL"
          >
            {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{linkCopied ? '深链已复制' : '分享深链'}</span>
          </button>

          <button
            onClick={onExportIcBrief}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-emerald-800/50 text-[11px] font-medium transition-colors"
            title="一键导出注入当前沙盘参数的机构投决会 (IC) 动态 Markdown 简报"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">导出IC投决简报</span>
          </button>

          <button
            onClick={onOpenSandbox}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isSandboxOpen
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'bg-slate-900 hover:bg-slate-850 text-cyan-400 border-cyan-800/50 hover:border-cyan-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>沙盘</span>
          </button>
        </div>
      </div>
    </div>
  );
};
