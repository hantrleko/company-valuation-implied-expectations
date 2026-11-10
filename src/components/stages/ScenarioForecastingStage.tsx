import React from 'react';
import { Company, ForecastInputs, ValuationOutput } from '../../types/financial';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Sliders, RotateCcw, TrendingUp, ShieldAlert, Sparkles, PieChart, Layers, Target } from 'lucide-react';

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
    const clampedVal = Math.min(Math.max(val, 0.05), 0.85);
    const newWeights = { ...weights, [type]: clampedVal };
    const remaining = 1 - clampedVal;
    if (type === 'base') {
      newWeights.bull = Number((remaining * 0.45).toFixed(2));
      newWeights.bear = Number((remaining * 0.55).toFixed(2));
    } else if (type === 'bull') {
      newWeights.base = Number((remaining * 0.65).toFixed(2));
      newWeights.bear = Number((remaining * 0.35).toFixed(2));
    } else {
      newWeights.base = Number((remaining * 0.65).toFixed(2));
      newWeights.bull = Number((remaining * 0.35).toFixed(2));
    }
    onChangeInputs({
      ...inputs,
      scenarioWeights: newWeights
    });
  };

  // Trajectory bar calculations for 10-year FCFF
  const maxFcff = Math.max(...valuation.forecastYears.map(y => Math.abs(y.fcff)), 1);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
              阶段 04 ｜ 经营驱动情景模拟预测 (v3.1)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
              双锚点精密滑块 ＆ 概率加权期望公允值
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5">
            {company.chineseName} 10年动态经营假设与情景主观发生概率合成
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            支持动态调节 6 大核心经营驱动，并通过三情景概率分配器为主观牛市、基准常态、悲观出清赋予发生概率，实时合成期望公允价值与 10 年现金流轨迹。
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

      {/* Probabilistic Weighted Fair Value Card & Tri-Scenario Probability Mixer */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-800/40 text-cyan-400 shadow-inner">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">概率加权期望公允价值 (Probability-Weighted Fair Value)</span>
              <div className="text-3xl font-black font-mono text-cyan-300 mt-0.5">
                {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
                <span className="text-xs font-normal text-slate-400 font-sans ml-3">
                  (当前现价: {formatCurrency(valuation.currentPrice, company.currencySymbol, 2)})
                </span>
              </div>
            </div>
          </div>

          {/* 3 Scenario Outcomes */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="text-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 min-w-[100px]">
              <span className="text-emerald-400 font-bold block">牛市 ({(weights.bull * 100).toFixed(0)}%)</span>
              <span className="text-slate-200 text-sm font-black">{formatCurrency(valuation.bullPrice, company.currencySymbol, 1)}</span>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 min-w-[100px]">
              <span className="text-cyan-400 font-bold block">基准 ({(weights.base * 100).toFixed(0)}%)</span>
              <span className="text-slate-200 text-sm font-black">{formatCurrency(valuation.basePrice, company.currencySymbol, 1)}</span>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 min-w-[100px]">
              <span className="text-rose-400 font-bold block">熊市 ({(weights.bear * 100).toFixed(0)}%)</span>
              <span className="text-slate-200 text-sm font-black">{formatCurrency(valuation.bearPrice, company.currencySymbol, 1)}</span>
            </div>
          </div>
        </div>

        {/* Probability Weight Adjuster Bars */}
        <div className="pt-3 border-t border-slate-850">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>情景主观权重分配器 (拖动滑块合成期望价值，总和自动保持 100%):</span>
            <span className="font-mono text-cyan-300">
              牛 {Math.round(weights.bull * 100)}% + 基 {Math.round(weights.base * 100)}% + 熊 {Math.round(weights.bear * 100)}% = 100%
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">乐观牛市权重</span>
                <span className="text-slate-200 font-bold">{Math.round(weights.bull * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.bull}
                onChange={(e) => handleWeightChange('bull', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-900/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-cyan-400 font-bold">基准常态权重</span>
                <span className="text-slate-200 font-bold">{Math.round(weights.base * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.85"
                step="0.05"
                value={weights.base}
                onChange={(e) => handleWeightChange('base', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-rose-400 font-bold">悲观出清权重</span>
                <span className="text-slate-200 font-bold">{Math.round(weights.bear * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={weights.bear}
                onChange={(e) => handleWeightChange('bear', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dual-Anchor Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Slider 1: Volume CAGR */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">未来5年出货/交付增速 (CAGR)</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">
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
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>-10% (衰退)</span>
            <span>+20% (行业均值)</span>
            <span>+60% (超高增)</span>
          </div>
        </div>

        {/* Slider 2: Yearly ASP Change */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">单价年变动幅度 (ASP Trend)</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
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
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>-10% (价格战)</span>
            <span>0% (持平)</span>
            <span>+8% (提价权)</span>
          </div>
        </div>

        {/* Slider 3: Target Gross Margin */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">稳态综合销售毛利率</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
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
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>5% (重工薄利)</span>
            <span>25% (成熟制造)</span>
            <span>80% (垄断软件)</span>
          </div>
        </div>

        {/* Slider 4: R&D Ratio */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">研发费用率 (% of Revenue)</span>
            <span className="font-mono font-bold text-slate-200 text-sm">
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
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">资本开支强度 (CapEx / Sales)</span>
            <span className="font-mono font-bold text-rose-300 text-sm">
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
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">营运资金变动比 (ΔNWC / ΔRev)</span>
            <span className="font-mono font-bold text-purple-300 text-sm">
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

      {/* Visual Trajectory Bars: 10-Year FCFF Trajectory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              未来 10 年自由现金流 (FCFF) 与折现净现值 (PV) 柱状走廊
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> 显式FCFF</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600"></span> 折现PV</span>
            <span className="text-slate-500">折现率 (WACC): {formatPercent(inputs.wacc)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-10 gap-2 items-end h-36 pt-4 border-b border-slate-850 pb-2">
          {valuation.forecastYears.map((yr) => {
            const fcffHeight = Math.max((Math.abs(yr.fcff) / maxFcff) * 100, 4);
            const pvHeight = Math.max((Math.abs(yr.pvFcff) / maxFcff) * 100, 4);
            const isPositive = yr.fcff >= 0;

            return (
              <div key={yr.year} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                  {formatNumber(yr.fcff)}
                </div>
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* FCFF bar */}
                  <div
                    style={{ height: `${fcffHeight}%` }}
                    className={`w-3.5 rounded-t-sm transition-all ${isPositive ? 'bg-cyan-500' : 'bg-rose-500'}`}
                    title={`FCFF: ${yr.fcff}`}
                  />
                  {/* PV bar */}
                  <div
                    style={{ height: `${pvHeight}%` }}
                    className="w-3.5 bg-blue-600 rounded-t-sm opacity-80"
                    title={`PV of FCFF: ${yr.pvFcff}`}
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-2">
                  Y{yr.year}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10-Year Projections Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
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
