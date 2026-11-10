import React from 'react';
import { Company, ForecastInputs, ValuationOutput } from '../types/financial';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { X, Sliders, RotateCcw, Sparkles, TrendingUp, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface QuickSandboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  inputs: ForecastInputs;
  valuation: ValuationOutput;
  onChangeInputs: (newInputs: ForecastInputs) => void;
  onApplyPreset: (preset: 'bull' | 'base' | 'bear' | 'consensus') => void;
}

export const QuickSandboxDrawer: React.FC<QuickSandboxDrawerProps> = ({
  isOpen,
  onClose,
  company,
  inputs,
  valuation,
  onChangeInputs,
  onApplyPreset
}) => {
  if (!isOpen) return null;

  const handleSliderChange = (field: keyof ForecastInputs, val: any) => {
    onChangeInputs({
      ...inputs,
      [field]: val
    });
  };

  const isUndervalued = valuation.marginOfSafety > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-md bg-slate-900/95 border-l border-slate-800 shadow-2xl h-full flex flex-col p-5 overflow-y-auto animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Sliders className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                全局实时估值沙盘 (Live Sandbox)
              </span>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                {company.chineseName} ({company.ticker})
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Result Summary Card */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-900/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">期望每股公允价值:</span>
            <span className="text-slate-400 font-mono text-[11px]">现价: {formatCurrency(valuation.currentPrice, company.currencySymbol, 2)}</span>
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-1 flex items-baseline justify-between">
            <span>{formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}</span>
            <span className={`text-sm font-bold flex items-center ${isUndervalued ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUndervalued ? '+' : ''}{(valuation.marginOfSafety * 100).toFixed(1)}%
              {isUndervalued ? <ArrowUpRight className="w-4 h-4 ml-0.5" /> : <ArrowDownRight className="w-4 h-4 ml-0.5" />}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-850 text-[11px] font-mono text-slate-400">
            <span>牛市: {valuation.bullPrice}</span>
            <span>基准: {valuation.basePrice}</span>
            <span>熊市: {valuation.bearPrice}</span>
          </div>
        </div>

        {/* Presets Toolbar */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            快速情景预设:
          </label>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
            <button
              onClick={() => onApplyPreset('bull')}
              className="py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40 text-center transition-colors text-[11px]"
            >
              🐂 乐观牛市
            </button>
            <button
              onClick={() => onApplyPreset('base')}
              className="py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-800/40 text-center transition-colors text-[11px]"
            >
              ⚖️ 基准常态
            </button>
            <button
              onClick={() => onApplyPreset('bear')}
              className="py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 text-center transition-colors text-[11px]"
            >
              🐻 悲观出清
            </button>
            <button
              onClick={() => onApplyPreset('consensus')}
              className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-center transition-colors text-[11px]"
            >
              📊 卖方共识
            </button>
          </div>
        </div>

        {/* Sliders Area */}
        <div className="mt-5 space-y-4 flex-1">
          {/* Slider 1: 5Y Volume CAGR */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">未来5年出货/交付增速</span>
              <span className="font-mono font-bold text-cyan-400">
                {(inputs.volumeGrowthYears1to5 * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="-0.10"
              max="0.60"
              step="0.01"
              value={inputs.volumeGrowthYears1to5}
              onChange={(e) => handleSliderChange('volumeGrowthYears1to5', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Slider 2: Target Gross Margin */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">稳态综合毛利率</span>
              <span className="font-mono font-bold text-emerald-400">
                {(inputs.targetGrossMargin * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.005"
              value={inputs.targetGrossMargin}
              onChange={(e) => handleSliderChange('targetGrossMargin', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Slider 3: ASP Annual Trend */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">单价年变动幅度 (ASP Trend)</span>
              <span className="font-mono font-bold text-amber-400">
                {(inputs.aspGrowthYearly * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="-0.10"
              max="0.08"
              step="0.005"
              value={inputs.aspGrowthYearly}
              onChange={(e) => handleSliderChange('aspGrowthYearly', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Slider 4: R&D Expense Ratio */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">研发费用率 (% of Sales)</span>
              <span className="font-mono font-bold text-slate-200">
                {(inputs.rdRatioOfRevenue * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.25"
              step="0.005"
              value={inputs.rdRatioOfRevenue}
              onChange={(e) => handleSliderChange('rdRatioOfRevenue', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Slider 5: CapEx Intensity */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">资本开支强度 (CapEx / Sales)</span>
              <span className="font-mono font-bold text-rose-300">
                {(inputs.capexRatioOfRevenue * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.35"
              step="0.005"
              value={inputs.capexRatioOfRevenue}
              onChange={(e) => handleSliderChange('capexRatioOfRevenue', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Slider 6: WACC Discount Rate */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">折现率 (WACC)</span>
              <span className="font-mono font-bold text-purple-400">
                {(inputs.wacc * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.06"
              max="0.14"
              step="0.002"
              value={inputs.wacc}
              onChange={(e) => handleSliderChange('wacc', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={() => onApplyPreset('base')}
            className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置为初始基准
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            收起沙盘
          </button>
        </div>
      </div>
    </div>
  );
};
