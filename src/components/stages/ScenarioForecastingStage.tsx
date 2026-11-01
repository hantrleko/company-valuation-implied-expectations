import React from 'react';
import { Company, ForecastInputs, ValuationOutput } from '../../types/financial';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Sliders, RotateCcw, TrendingUp, ShieldAlert, Sparkles, PieChart } from 'lucide-react';

interface ScenarioForecastingStageProps {
  company: Company;
  inputs: ForecastInputs;
  valuation: ValuationOutput;
  onChangeInputs: (newInputs: ForecastInputs) => void;
  onApplyPreset: (preset: 'bull' | 'base' | 'bear' | 'consensus') => void;
}

export const ScenarioForecastingStage: React.FC<ScenarioForecastingStageProps> = ({
  company,
  inputs,
  valuation,
  onChangeInputs,
  onApplyPreset
}) => {
  const handleSliderChange = (field: keyof ForecastInputs, val: any) => {
    onChangeInputs({
      ...inputs,
      [field]: val
    });
  };

  const weights = inputs.scenarioWeights || { bull: 0.20, base: 0.55, bear: 0.25 };

  const handleWeightChange = (type: 'bull' | 'base' | 'bear', val: number) => {
    const newWeights = { ...weights, [type]: val };
    const remaining = 1 - val;
    if (type === 'base') {
      newWeights.bull = Number((remaining * 0.45).toFixed(2));
      newWeights.bear = Number((remaining * 0.55).toFixed(2));
    }
    onChangeInputs({
      ...inputs,
      scenarioWeights: newWeights
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              阶段 04 ｜ 经营驱动情景模拟预测 (v3.0)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
              概率加权期望估值引擎
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            动态调节经营假设与情景主观发生概率
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            支持调节 7 大核心经营驱动，并为主观牛市、基准常态、悲观出清分配概率权重，实时合成**概率加权期望公允价值**。
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onApplyPreset('bull')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 text-xs border border-emerald-800/40 font-medium transition-colors"
          >
            🐂 乐观牛市
          </button>
          <button
            onClick={() => onApplyPreset('base')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 text-xs border border-cyan-800/40 font-medium transition-colors"
          >
            ⚖️ 基准常态
          </button>
          <button
            onClick={() => onApplyPreset('bear')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 text-xs border border-rose-800/40 font-medium transition-colors"
          >
            🐻 悲观出清
          </button>
          <button
            onClick={() => onApplyPreset('consensus')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 font-medium transition-colors"
          >
            📊 卖方共识
          </button>
        </div>
      </div>

      {/* Probabilistic Weighted Valuation Card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-cyan-900/40 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800/40 text-cyan-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">概率加权期望价值 (Expected Fair Value)</span>
            <div className="text-2xl font-black font-mono text-cyan-300">
              {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
            </div>
          </div>
        </div>

        {/* 3 Scenario Outcomes */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-center p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 font-bold block">牛市 ({(weights.bull * 100).toFixed(0)}%)</span>
            <span className="text-slate-200">{formatCurrency(valuation.bullPrice, company.currencySymbol, 1)}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 font-bold block">基准 ({(weights.base * 100).toFixed(0)}%)</span>
            <span className="text-slate-200">{formatCurrency(valuation.basePrice, company.currencySymbol, 1)}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-rose-400 font-bold block">熊市 ({(weights.bear * 100).toFixed(0)}%)</span>
            <span className="text-slate-200">{formatCurrency(valuation.bearPrice, company.currencySymbol, 1)}</span>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Slider 1: Volume CAGR */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">未来5年出货/交付增速 (CAGR)</span>
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

        {/* Slider 2: Yearly ASP Change */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
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

        {/* Slider 3: Target Gross Margin */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">稳态综合毛利率 (Target Margin)</span>
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

        {/* Slider 4: R&D Ratio */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">研发费用率 (% of Revenue)</span>
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
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
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

        {/* Slider 6: Working Capital Delta NWC */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">营运资金变动比 (ΔNWC / ΔRev)</span>
            <span className="font-mono font-bold text-purple-300">
              {(inputs.deltaNwcRatioOfRevenue * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="-0.08"
            max="0.10"
            step="0.005"
            value={inputs.deltaNwcRatioOfRevenue}
            onChange={(e) => handleSliderChange('deltaNwcRatioOfRevenue', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* 10-Year Projections Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>未来 10 年财务与现金流情景推演表 (单位：{company.currencySymbol}M)</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">折现率 (WACC): {formatPercent(inputs.wacc)}</span>
            <span className="text-slate-400">永续增长率 (g): {formatPercent(inputs.terminalGrowthRate)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold text-slate-300 sticky left-0 bg-slate-950 z-10 w-44">
                  预测科目
                </th>
                {valuation.forecastYears.map((yr) => (
                  <th key={yr.year} className="py-3 px-3 text-right whitespace-nowrap min-w-[85px]">
                    {yr.calendarYear} (Y{yr.year})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {/* Deliveries / Volume */}
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-4 font-sans text-slate-200 sticky left-0 bg-slate-900 z-10">
                  出货/交付规模
                </td>
                {valuation.forecastYears.map((yr) => (
                  <td key={yr.year} className="py-2.5 px-3 text-right font-semibold text-cyan-400">
                    {formatNumber(yr.deliveries)}
                  </td>
                ))}
              </tr>

              {/* Revenue */}
              <tr className="hover:bg-slate-800/40 font-semibold text-slate-100">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10">
                  营业收入
                </td>
                {valuation.forecastYears.map((yr) => (
                  <td key={yr.year} className="py-2.5 px-3 text-right">
                    {formatNumber(yr.revenue)}
                  </td>
                ))}
              </tr>

              {/* Gross Profit */}
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-4 font-sans text-slate-300 sticky left-0 bg-slate-900 z-10">
                  毛利润
                </td>
                {valuation.forecastYears.map((yr) => (
                  <td key={yr.year} className="py-2.5 px-3 text-right text-emerald-400">
                    {formatNumber(yr.grossProfit)}
                  </td>
                ))}
              </tr>

              {/* NOPAT */}
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-4 font-sans text-slate-300 sticky left-0 bg-slate-900 z-10">
                  重构 NOPAT
                </td>
                {valuation.forecastYears.map((yr) => (
                  <td key={yr.year} className="py-2.5 px-3 text-right text-slate-200">
                    {formatNumber(yr.nopat)}
                  </td>
                ))}
              </tr>

              {/* FCFF */}
              <tr className="hover:bg-slate-800/40 font-bold">
                <td className="py-2.5 px-4 font-sans text-cyan-300 sticky left-0 bg-slate-900 z-10">
                  自由现金流 (FCFF)
                </td>
                {valuation.forecastYears.map((yr) => (
                  <td 
                    key={yr.year} 
                    className={`py-2.5 px-3 text-right ${
                      yr.fcff >= 0 ? 'text-cyan-400' : 'text-rose-400'
                    }`}
                  >
                    {formatNumber(yr.fcff)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
