import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Company, ForecastInputs, ValuationOutput, CapmWaccConfig, SegmentDriver } from '../../types/financial';
import { COMPANY_CAPM_CONFIGS, computeWaccFromCapm, COMPANY_SEGMENTS } from '../../data/v4InstitutionalData';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Sliders, RotateCcw, TrendingUp, PieChart, Layers, Landmark, Zap, Check } from 'lucide-react';

interface ScenarioForecastingStageProps {
  company: Company;
  inputs: ForecastInputs;
  valuation: ValuationOutput;
  onChangeInputs: (newInputs: ForecastInputs) => void;
  onApplyPreset: (preset: 'bull' | 'base' | 'bear' | 'consensus') => void;
}

const CURVE_META: Record<SegmentDriver['category'], {
  label: string;
  badgeClass: string;
  accentClass: string;
  textClass: string;
  rowBorderClass: string;
}> = {
  core: {
    label: '第一曲线核心基本盘',
    badgeClass: 'bg-cyan-950/90 text-cyan-300 border-cyan-800/60',
    accentClass: 'accent-cyan-500',
    textClass: 'text-cyan-300',
    rowBorderClass: 'border-l-2 border-l-cyan-500/80'
  },
  'growth-curve': {
    label: '第二曲线高增业务',
    badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-800/60',
    accentClass: 'accent-amber-500',
    textClass: 'text-amber-300',
    rowBorderClass: 'border-l-2 border-l-amber-500/80'
  },
  'software-ecosystem': {
    label: '第三曲线高毛利软件/服务',
    badgeClass: 'bg-purple-950/90 text-purple-300 border-purple-800/60',
    accentClass: 'accent-purple-500',
    textClass: 'text-purple-300',
    rowBorderClass: 'border-l-2 border-l-purple-500/80'
  }
};

interface SegmentSynthesis {
  blendedCagr5Y: number;
  blendedMarginYear5: number;
  currentBlendedMargin: number;
  year5Shares: number[];
}

function computeSegmentSynthesis(segments: SegmentDriver[]): SegmentSynthesis {
  if (!segments.length) {
    return {
      blendedCagr5Y: 0.18,
      blendedMarginYear5: 0.25,
      currentBlendedMargin: 0.25,
      year5Shares: []
    };
  }
  const totalShare2025 = segments.reduce((acc, s) => acc + s.revenueShare2025, 0) || 1;
  const year5Weights = segments.map((s) => s.revenueShare2025 * Math.pow(1 + s.expectedCagr5Y, 5));
  const totalYear5Weight = year5Weights.reduce((acc, w) => acc + w, 0) || 1;
  const blendedCagr5Y = Math.pow(totalYear5Weight / totalShare2025, 1 / 5) - 1;
  const year5Shares = year5Weights.map((w) => w / totalYear5Weight);
  const blendedMarginYear5 = segments.reduce((acc, s, idx) => acc + s.grossMargin * year5Shares[idx], 0);
  const currentBlendedMargin = segments.reduce(
    (acc, s) => acc + s.grossMargin * (s.revenueShare2025 / totalShare2025),
    0
  );

  return {
    blendedCagr5Y: Number(blendedCagr5Y.toFixed(4)),
    blendedMarginYear5: Number(blendedMarginYear5.toFixed(4)),
    currentBlendedMargin: Number(currentBlendedMargin.toFixed(4)),
    year5Shares
  };
}

interface YearSegmentProjection {
  year: number;
  shares: number[];
  revenues: number[];
  grossProfits: number[];
  grossProfitShares: number[];
  totalSegmentGrossProfit: number;
  blendedGrossMargin: number;
  expansionCurveGpShare: number;
}

function computeTenYearSegmentProjections(
  segments: SegmentDriver[],
  forecastYears: ValuationOutput['forecastYears'],
  terminalGrowthRate: number
): YearSegmentProjection[] {
  if (!segments.length || !forecastYears.length) return [];

  const anchorRate = Math.min(Math.max(terminalGrowthRate, 0.015), 0.06);
  const runningWeights = segments.map((s) => Math.max(s.revenueShare2025, 0));

  return forecastYears.map((yr) => {
    // Y1-Y5 compound at each curve's 5Y CAGR; Y6-Y10 smoothly decelerate toward terminal anchor
    const fadeMultiplier = yr.year <= 5 ? 1 : Math.pow(0.72, yr.year - 5);
    for (let i = 0; i < segments.length; i++) {
      const segRate =
        yr.year <= 5
          ? segments[i].expectedCagr5Y
          : anchorRate + (segments[i].expectedCagr5Y - anchorRate) * fadeMultiplier;
      runningWeights[i] *= Math.max(1 + segRate, 0.01);
    }

    const totalWeight = runningWeights.reduce((sum, w) => sum + w, 0) || 1;
    const shares = runningWeights.map((w) => w / totalWeight);

    // Normalize integer segment revenues to match yr.revenue exactly
    const revenues = shares.map((share) => Math.round(yr.revenue * share));
    const residual = yr.revenue - revenues.reduce((sum, r) => sum + r, 0);
    if (residual !== 0 && revenues.length > 0) {
      let maxIdx = 0;
      for (let i = 1; i < shares.length; i++) {
        if (shares[i] > shares[maxIdx]) maxIdx = i;
      }
      revenues[maxIdx] += residual;
    }

    const grossProfits = revenues.map((rev, idx) => Math.round(rev * segments[idx].grossMargin));
    const totalSegmentGrossProfit = grossProfits.reduce((sum, gp) => sum + gp, 0);
    const grossProfitShares = grossProfits.map((gp) =>
      totalSegmentGrossProfit > 0 ? gp / totalSegmentGrossProfit : 0
    );
    const blendedGrossMargin = yr.revenue > 0 ? totalSegmentGrossProfit / yr.revenue : 0;
    const expansionCurveGpShare =
      totalSegmentGrossProfit > 0
        ? grossProfits.reduce(
            (sum, gp, idx) => (segments[idx].category !== 'core' ? sum + gp : sum),
            0
          ) / totalSegmentGrossProfit
        : 0;

    return {
      year: yr.year,
      shares,
      revenues,
      grossProfits,
      grossProfitShares,
      totalSegmentGrossProfit,
      blendedGrossMargin,
      expansionCurveGpShare
    };
  });
}

export const ScenarioForecastingStage: React.FC<ScenarioForecastingStageProps> = ({
  company,
  inputs,
  valuation,
  onChangeInputs,
  onApplyPreset
}) => {
  const [capmConfig, setCapmConfig] = useState<CapmWaccConfig>(() => COMPANY_CAPM_CONFIGS[company.id] || COMPANY_CAPM_CONFIGS['nvda']);
  const [segments, setSegments] = useState<SegmentDriver[]>(() => COMPANY_SEGMENTS[company.id] || []);
  const [showSegmentBreakdown, setShowSegmentBreakdown] = useState<boolean>(true);
  const [autoSyncDcf, setAutoSyncDcf] = useState<boolean>(true);
  const [syncToast, setSyncToast] = useState<boolean>(false);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setCapmConfig(COMPANY_CAPM_CONFIGS[company.id] || COMPANY_CAPM_CONFIGS['nvda']);
    setSegments(COMPANY_SEGMENTS[company.id] || []);
    setSyncToast(false);
  }, [company.id]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const segmentSynthesis = useMemo(() => computeSegmentSynthesis(segments), [segments]);
  const segmentProjections = useMemo(
    () => computeTenYearSegmentProjections(segments, valuation.forecastYears, inputs.terminalGrowthRate),
    [segments, valuation.forecastYears, inputs.terminalGrowthRate]
  );

  const flashSyncedToast = () => {
    setSyncToast(true);
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => setSyncToast(false), 2000);
  };

  const syncSynthesisToDcf = (synthesis: SegmentSynthesis, showFeedback = false) => {
    onChangeInputs({
      ...inputs,
      volumeGrowthYears1to5: synthesis.blendedCagr5Y,
      targetGrossMargin: synthesis.blendedMarginYear5
    });
    if (showFeedback) {
      flashSyncedToast();
    }
  };

  const handleSegmentFieldChange = (
    segIdx: number,
    field: 'expectedCagr5Y' | 'grossMargin',
    value: number
  ) => {
    const nextSegments = segments.map((seg, idx) =>
      idx === segIdx ? { ...seg, [field]: value } : seg
    );
    setSegments(nextSegments);
    if (autoSyncDcf) {
      syncSynthesisToDcf(computeSegmentSynthesis(nextSegments));
    }
  };

  const handleToggleAutoSync = () => {
    const nextAuto = !autoSyncDcf;
    setAutoSyncDcf(nextAuto);
    if (nextAuto) {
      syncSynthesisToDcf(segmentSynthesis, true);
    }
  };

  const handleResetSegments = () => {
    const defaults = COMPANY_SEGMENTS[company.id] || [];
    setSegments(defaults);
    if (autoSyncDcf) {
      syncSynthesisToDcf(computeSegmentSynthesis(defaults), true);
    }
  };

  const isDcfAlignedWithMix =
    Math.abs(inputs.volumeGrowthYears1to5 - segmentSynthesis.blendedCagr5Y) < 0.001 &&
    Math.abs(inputs.targetGrossMargin - segmentSynthesis.blendedMarginYear5) < 0.001;

  const y1Projection = segmentProjections[0];
  const y10Projection = segmentProjections[segmentProjections.length - 1];
  const marginExpansionBps =
    y1Projection && y10Projection
      ? Math.round((y10Projection.blendedGrossMargin - y1Projection.blendedGrossMargin) * 10000)
      : 0;

  const capmDerived = computeWaccFromCapm(capmConfig, inputs.taxRate);

  const handleCapmChange = (newCfg: CapmWaccConfig) => {
    setCapmConfig(newCfg);
    const derived = computeWaccFromCapm(newCfg, inputs.taxRate);
    onChangeInputs({
      ...inputs,
      wacc: Number(Math.min(Math.max(derived.wacc, 0.055), 0.16).toFixed(4))
    });
  };

  const applyMacroShock = (deltaRf: number, deltaErp: number = 0) => {
    const baseCfg = COMPANY_CAPM_CONFIGS[company.id] || COMPANY_CAPM_CONFIGS['nvda'];
    const nextCfg: CapmWaccConfig = {
      ...baseCfg,
      riskFreeRate: Number(Math.max(baseCfg.riskFreeRate + deltaRf, 0.01).toFixed(4)),
      equityRiskPremium: Number(Math.max(baseCfg.equityRiskPremium + deltaErp, 0.03).toFixed(4))
    };
    handleCapmChange(nextCfg);
  };
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

  const renderSegmentRows = (metric: 'revenue' | 'grossProfit') => {
    const isRevenue = metric === 'revenue';
    return segments.map((seg, segIdx) => {
      const meta = CURVE_META[seg.category];
      return (
        <tr
          key={`${metric}-${seg.id}`}
          className="bg-slate-950/60 hover:bg-slate-800/40 text-[11px] transition-colors"
        >
          <td className={`py-2 px-4 font-sans sticky left-0 bg-slate-950 z-10 ${meta.rowBorderClass}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${meta.badgeClass}`}>
                {meta.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {isRevenue ? '营收' : '毛利'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px] text-slate-400">
              <span className="truncate max-w-[165px]" title={seg.name}>
                {seg.name}
              </span>
              <span className="font-mono text-slate-500 flex-shrink-0">
                {isRevenue
                  ? `CAGR ${(seg.expectedCagr5Y * 100).toFixed(0)}%`
                  : `GM ${(seg.grossMargin * 100).toFixed(1)}%`}
              </span>
            </div>
          </td>
          {segmentProjections.map((proj) => {
            const val = isRevenue ? proj.revenues[segIdx] : proj.grossProfits[segIdx];
            const share = isRevenue ? proj.shares[segIdx] : proj.grossProfitShares[segIdx];
            return (
              <td key={`${metric}-${seg.id}-${proj.year}`} className="py-2 px-3 text-right">
                <div className={`font-semibold ${isRevenue ? meta.textClass : 'text-emerald-300/90'}`}>
                  {formatNumber(val)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {formatPercent(share, 1)} {isRevenue ? '占比' : '贡献'}
                </div>
              </td>
            );
          })}
        </tr>
      );
    });
  };

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

      {/* V4.0 MODULE 3: CAPM / WACC Capital Cost Penetration & Macro Rate Stress Test Builder */}
      <div className="bg-slate-900 border border-indigo-800/50 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">
                CAPM / WACC 资本成本底层穿透推导器与宏观利率压力测试 ({capmConfig.riskFreeBenchmark} 联动)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              公式：WACC = (E/V) × [Rf + βL × ERP] + (D/V) × Kd × (1 - T) ｜ 宏观无风险利率波动通过高 Beta 杠杆非线性传导至远期现金流折现价值
            </p>
          </div>

          {/* Macro Rate Shock Quick Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => applyMacroShock(-0.005, 0)}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-[11px] font-mono transition-colors"
            >
              📉 降息宽松 (-50bps Rf)
            </button>
            <button
              onClick={() => applyMacroShock(0, 0)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-mono transition-colors"
            >
              ⚖️ 当前宏观基准
            </button>
            <button
              onClick={() => applyMacroShock(0.005, 0)}
              className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-[11px] font-mono transition-colors"
            >
              📈 通胀加息 (+50bps Rf)
            </button>
            <button
              onClick={() => applyMacroShock(0.0075, 0.005)}
              className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-[11px] font-mono transition-colors"
            >
              🌪️ 滞胀风险 (+75bps Rf & +50bps ERP)
            </button>
          </div>
        </div>

        {/* CAPM Interactive Sliders & Live Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 1. Risk-Free Rate Rf */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">无风险利率 Rf ({capmConfig.riskFreeBenchmark})</span>
              <span className="text-cyan-300 font-bold">{(capmConfig.riskFreeRate * 100).toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={0.01}
              max={0.065}
              step={0.0005}
              value={capmConfig.riskFreeRate}
              onChange={(e) => handleCapmChange({ ...capmConfig, riskFreeRate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-slate-500">
              {capmConfig.riskFreeBenchmark === 'US10Y' ? '锚定10年期美债收益率基准' : '锚定10年期中国国债收益率基准'}
            </div>
          </div>

          {/* 2. Levered Beta */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">个股杠杆贝塔 (Levered β)</span>
              <span className="text-purple-300 font-bold">{capmConfig.leveredBeta.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={2.4}
              step={0.05}
              value={capmConfig.leveredBeta}
              onChange={(e) => handleCapmChange({ ...capmConfig, leveredBeta: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-slate-500">
              反映算力/电动车周期对市场波动的放大系数
            </div>
          </div>

          {/* 3. Equity Risk Premium (ERP) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">股权风险溢价 (ERP)</span>
              <span className="text-amber-300 font-bold">{(capmConfig.equityRiskPremium * 100).toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={0.035}
              max={0.08}
              step={0.001}
              value={capmConfig.equityRiskPremium}
              onChange={(e) => handleCapmChange({ ...capmConfig, equityRiskPremium: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-slate-500">
              Damodaran 市场隐含股权风险补偿要求
            </div>
          </div>

          {/* 4. Synthesized WACC Output */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-700/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-indigo-300 font-bold">CAPM 推导 WACC</span>
              <span className="text-lg font-black text-emerald-400">{(inputs.wacc * 100).toFixed(2)}%</span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-0.5 mt-1">
              <div>股权成本 Ke: <strong>{(capmDerived.costOfEquity * 100).toFixed(2)}%</strong> (权重 {(capmDerived.equityWeight * 100).toFixed(0)}%)</div>
              <div>税后债务成本 Kd(1-T): <strong>{(capmDerived.afterTaxCostOfDebt * 100).toFixed(2)}%</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Inline Multi-Segment Curve Growth & Blended Margin Tuner */}
      {segments.length > 0 && (
        <div className="bg-slate-900 border border-cyan-800/40 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">三大业务曲线增速与混合毛利快调</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  Y1-Y5 曲线增速 · Y6-Y10 平滑收敛 · 实时映射下方 10 年明细
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                合成 5Y CAGR: <strong className="text-cyan-300">{(segmentSynthesis.blendedCagr5Y * 100).toFixed(1)}%</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Y5 混合毛利: <strong className="text-emerald-400">{(segmentSynthesis.blendedMarginYear5 * 100).toFixed(1)}%</strong>
              </span>
              {y1Projection && y10Projection && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  10年毛利扩张: <strong className="text-amber-300">{formatPercent(y1Projection.blendedGrossMargin)} → {formatPercent(y10Projection.blendedGrossMargin)}</strong>{' '}
                  <span className={marginExpansionBps >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ({marginExpansionBps >= 0 ? '+' : ''}{marginExpansionBps}bps)
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-sans font-medium transition-colors ${
                  autoSyncDcf
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/70'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoSyncDcf ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>{autoSyncDcf ? '实时联动 DCF: 开启' : '实时联动 DCF: 关闭'}</span>
              </button>

              <button
                type="button"
                onClick={() => syncSynthesisToDcf(segmentSynthesis, true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-sans font-bold transition-all ${
                  syncToast
                    ? 'bg-emerald-600 text-white'
                    : isDcfAlignedWithMix
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                }`}
              >
                {syncToast ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                <span>
                  {syncToast
                    ? '已同步至 DCF'
                    : isDcfAlignedWithMix
                    ? 'DCF 已对齐'
                    : '同步混合增速/毛利至 DCF'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetSegments}
                title="恢复默认分部参数"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 font-sans transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {segments.map((seg, idx) => {
              const meta = CURVE_META[seg.category];
              const y5Share = segmentSynthesis.year5Shares[idx] ?? seg.revenueShare2025;
              const y10Share = y10Projection?.shares[idx] ?? y5Share;

              return (
                <div key={seg.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      占比 {(seg.revenueShare2025 * 100).toFixed(0)}% → Y5 {(y5Share * 100).toFixed(0)}% → Y10 {(y10Share * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-slate-200 truncate" title={seg.name}>
                    {seg.name}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-slate-400">5Y CAGR</span>
                        <span className={`font-bold ${meta.textClass}`}>+{(seg.expectedCagr5Y * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={0.65}
                        step={0.01}
                        value={seg.expectedCagr5Y}
                        onChange={(e) => handleSegmentFieldChange(idx, 'expectedCagr5Y', parseFloat(e.target.value))}
                        className={`w-full h-1 bg-slate-800 rounded-lg cursor-pointer ${meta.accentClass}`}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-slate-400">分部毛利率</span>
                        <span className="font-bold text-emerald-400">{(seg.grossMargin * 100).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.05}
                        max={0.92}
                        step={0.005}
                        value={seg.grossMargin}
                        onChange={(e) => handleSegmentFieldChange(idx, 'grossMargin', parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10-Year Projections Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>未来 10 年财务与现金流情景推演表 (单位：{company.currencySymbol}M)</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            {segments.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSegmentBreakdown((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans font-medium border transition-colors ${
                  showSegmentBreakdown
                    ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/70 hover:bg-cyan-900/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>📊 展开三大业务分部 10年营收与毛利明细</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    showSegmentBreakdown ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {showSegmentBreakdown ? '已展开' : '已收起'}
                </span>
              </button>
            )}
            <span className="text-slate-400">折现率 (WACC): {formatPercent(inputs.wacc)}</span>
            <span className="text-slate-400">永续增长率 (g): {formatPercent(inputs.terminalGrowthRate)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold text-slate-300 sticky left-0 bg-slate-950 z-10 w-60 min-w-[230px]">
                  预测科目
                </th>
                {valuation.forecastYears.map((yr) => (
                  <th key={yr.year} className="py-3 px-3 text-right whitespace-nowrap min-w-[92px]">
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

              {/* Segment Revenue Breakdown (Y1-Y10) */}
              {showSegmentBreakdown &&
                segments.length > 0 &&
                segmentProjections.length === valuation.forecastYears.length &&
                renderSegmentRows('revenue')}

              {/* Revenue */}
              <tr className="bg-slate-900/90 hover:bg-slate-800/40 font-semibold text-slate-100">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10">
                  <div>营业收入</div>
                  {showSegmentBreakdown && segments.length > 0 && (
                    <div className="text-[10px] font-mono font-normal text-cyan-400/80 mt-0.5">
                      三大分部归一化合计 (100%)
                    </div>
                  )}
                </td>
                {valuation.forecastYears.map((yr) => (
                  <td key={yr.year} className="py-2.5 px-3 text-right">
                    {formatNumber(yr.revenue)}
                  </td>
                ))}
              </tr>

              {/* Segment Gross Profit Breakdown (Y1-Y10) */}
              {showSegmentBreakdown &&
                segments.length > 0 &&
                segmentProjections.length === valuation.forecastYears.length &&
                renderSegmentRows('grossProfit')}

              {/* Gross Profit */}
              <tr className="bg-slate-900/90 hover:bg-slate-800/40">
                <td className="py-2.5 px-4 font-sans text-slate-200 sticky left-0 bg-slate-900 z-10">
                  <div className="font-semibold">毛利润</div>
                  {showSegmentBreakdown && y1Projection && y10Projection && (
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 space-y-0.5">
                      <div>
                        DCF {(inputs.targetGrossMargin * 100).toFixed(1)}% ｜ 混合{' '}
                        <span className="text-emerald-400">
                          {formatPercent(y1Projection.blendedGrossMargin)} → {formatPercent(y10Projection.blendedGrossMargin)}
                        </span>
                      </div>
                      <div className="text-purple-300/90">
                        第2+3曲线毛利占比 {formatPercent(y1Projection.expansionCurveGpShare, 0)} → {formatPercent(y10Projection.expansionCurveGpShare, 0)}
                      </div>
                    </div>
                  )}
                </td>
                {valuation.forecastYears.map((yr, idx) => {
                  const proj = segmentProjections[idx];
                  return (
                    <td key={yr.year} className="py-2.5 px-3 text-right">
                      <div className="text-emerald-400 font-semibold">{formatNumber(yr.grossProfit)}</div>
                      {showSegmentBreakdown && proj && (
                        <div className="text-[10px] text-slate-400 whitespace-nowrap" title={`第2+3曲线贡献 ${formatPercent(proj.expansionCurveGpShare, 1)}`}>
                          分部 {formatNumber(proj.totalSegmentGrossProfit)} ({formatPercent(proj.blendedGrossMargin)})
                        </div>
                      )}
                    </td>
                  );
                })}
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
