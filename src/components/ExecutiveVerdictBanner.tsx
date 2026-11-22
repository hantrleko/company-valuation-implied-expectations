import React, { useState } from 'react';
import {
  Company,
  ValuationOutput,
  ForecastInputs,
  BasePeriodMode,
  ResearchMemo
} from '../types/financial';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  ShieldAlert,
  FileSearch,
  Sliders,
  BookOpen,
  ArrowRight,
  Compass
} from 'lucide-react';

export interface ExecutiveVerdictBannerProps {
  company: Company;
  valuation: ValuationOutput;
  inputs: ForecastInputs;
  impliedGrowth: number;
  impliedMargin: number;
  impliedCapYears: number;
  basePeriodMode: BasePeriodMode;
  memo: ResearchMemo;
  onSelectStage: (stage: 'disclosures' | 'reconstruction' | 'drivers' | 'scenarios' | 'valuation' | 'market-implied') => void;
  onOpenMemo: () => void;
  onOpenPeerDuel: () => void;
}

interface VerdictClassification {
  label: string;
  summary: string;
  badgeClass: string;
  containerBorderClass: string;
  headerGradientClass: string;
  accentTextClass: string;
}

function classifyVerdict(marginOfSafety: number): VerdictClassification {
  if (marginOfSafety > 0.08) {
    return {
      label: '🟢 低估击球区 (安全边际充足)',
      summary: '现价隐含预期偏保守，DCF概率加权估值具备明确安全边际',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.2)]',
      containerBorderClass: 'border-emerald-700/40',
      headerGradientClass: 'from-emerald-950/45 via-slate-900/95 to-slate-950',
      accentTextClass: 'text-emerald-300'
    };
  }
  if (marginOfSafety >= -0.08) {
    return {
      label: '⚖️ 定价合理均衡区',
      summary: '当前股价与模型内生公允值基本匹配，回报主要取决于业绩兑现节奏',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.16)]',
      containerBorderClass: 'border-amber-700/40',
      headerGradientClass: 'from-amber-950/35 via-slate-900/95 to-slate-950',
      accentTextClass: 'text-amber-300'
    };
  }
  return {
    label: '🔴 预期拥挤区 (需警惕估值消化)',
    summary: '当前股价隐含较激进的长期增长或远期期权假设，下行容错空间偏窄',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.2)]',
    containerBorderClass: 'border-rose-700/40',
    headerGradientClass: 'from-rose-950/45 via-slate-900/95 to-slate-950',
    accentTextClass: 'text-rose-300'
  };
}

function formatSignedPercent(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return '-';
  const formatted = formatPercent(value, decimals);
  return value > 0 ? `+${formatted}` : formatted;
}

export const ExecutiveVerdictBanner: React.FC<ExecutiveVerdictBannerProps> = ({
  company,
  valuation,
  inputs,
  impliedGrowth,
  impliedMargin,
  impliedCapYears,
  basePeriodMode,
  memo,
  onSelectStage,
  onOpenMemo,
  onOpenPeerDuel
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const marginOfSafety = Number.isFinite(valuation.marginOfSafety) ? valuation.marginOfSafety : 0;
  const verdict = classifyVerdict(marginOfSafety);

  const expectedUpside =
    company.currentStockPrice > 0 && Number.isFinite(valuation.expectedValuePerShare)
      ? (valuation.expectedValuePerShare - company.currentStockPrice) / company.currentStockPrice
      : 0;

  const growthGap = impliedGrowth - inputs.volumeGrowthYears1to5;
  const growthGapPctPoints = (Math.abs(growthGap) * 100).toFixed(1);
  const growthComparisonText =
    Math.abs(growthGap) < 0.005
      ? '市场隐含增速与当前模型假设基本一致'
      : growthGap > 0
      ? `市场隐含预期高于模型假设 +${growthGapPctPoints} pct`
      : `市场隐含增速低于模型假设 ${growthGapPctPoints} pct`;

  const capYearsLabel = Number.isFinite(impliedCapYears) ? `${impliedCapYears.toFixed(1)}年` : '-';
  const primaryCatalyst = memo.thesis?.catalysts?.[0] || '暂无预设催化事件，可在研报工作台补充跟踪节点。';
  const variantPerception = memo.thesis?.variantPerception || '暂无非共识判断描述，请打开研报工作台编辑个人投研逻辑。';
  const primaryKill = memo.killConditions?.[0];
  const killTrigger = primaryKill?.trigger || '暂未配置硬性证伪止损条件，建议在研报工作台设定红线。';
  const killAction = primaryKill?.actionIfTriggered || '触发后应重新校准DCF关键假设并评估减仓/风控动作。';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-5">
      <section
        aria-label="30秒一页式核心投决诊断书"
        className={`rounded-2xl border ${verdict.containerBorderClass} bg-gradient-to-br ${verdict.headerGradientClass} backdrop-blur-md shadow-2xl overflow-hidden transition-all`}
      >
      {/* Top Header Bar (Always Visible) */}
      <div className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
                30秒一页式核心投决诊断书
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/90 text-cyan-300 border border-slate-700/70">
                Executive Verdict &amp; Guided Workflow
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 border border-slate-800">
                {company.chineseName} ({company.ticker}) · 基准 {basePeriodMode}
              </span>
            </div>
            {!isExpanded && (
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                现价 {formatCurrency(company.currentStockPrice, company.currencySymbol, 2)} · 加权公允值{' '}
                {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)} · 安全边际{' '}
                {formatSignedPercent(marginOfSafety)} · 隐含5Y增速 {formatPercent(impliedGrowth)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {/* Quantitative Classification Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-tight ${verdict.badgeClass}`}
          >
            <span>{verdict.label}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-colors"
          >
            <span>{isExpanded ? '收起诊断书' : '展开诊断书'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 animate-fadeIn">
          {/* Quantitative Telemetry Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 px-3.5 py-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                当前股价 vs 概率加权公允值
              </div>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap font-mono">
                <span className="text-sm font-bold text-slate-100">
                  {formatCurrency(company.currentStockPrice, company.currencySymbol, 2)}
                </span>
                <span className="text-slate-500 text-xs">vs</span>
                <span className="text-sm font-black text-cyan-300">
                  {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
                </span>
                <span className={`text-[11px] font-bold ${expectedUpside >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({formatSignedPercent(expectedUpside)})
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 px-3.5 py-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                基础安全边际 &amp; 蒙特卡洛分位
              </div>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap font-mono">
                <span className={`text-sm font-black ${verdict.accentTextClass}`}>
                  {formatSignedPercent(marginOfSafety)}
                </span>
                <span className="text-[11px] text-slate-400">
                  P{valuation.monteCarlo?.percentileCurrentPrice ?? '-'} 分位 · 研报建议: {memo.recommendation}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 px-3.5 py-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                隐含5Y增速 vs 模型假设增速
              </div>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap font-mono">
                <span className="text-sm font-bold text-amber-300">{formatPercent(impliedGrowth)}</span>
                <span className="text-slate-500 text-xs">vs</span>
                <span className="text-sm font-bold text-slate-200">{formatPercent(inputs.volumeGrowthYears1to5)}</span>
                <span className={`text-[11px] font-bold ${growthGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  (差值 {formatSignedPercent(growthGap)})
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 px-3.5 py-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                隐含毛利底线 &amp; 竞争优势期
              </div>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap font-mono">
                <span className="text-sm font-bold text-cyan-300">{formatPercent(impliedMargin)}</span>
                <span className="text-slate-600 text-xs">/</span>
                <span className="text-sm font-bold text-purple-300">MICAP {capYearsLabel}</span>
                <span className="text-[11px] text-slate-400">
                  (模型毛利 {formatPercent(inputs.targetGrossMargin)})
                </span>
              </div>
            </div>
          </div>

          {/* 3-Column Core Contradiction Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* Column 1: What Current Price Is Betting On */}
            <div className="rounded-xl bg-slate-950/80 border border-cyan-900/50 p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-950/90 border border-cyan-800/60 text-cyan-400">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-cyan-200">当前价格在赌什么</h3>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-900/60 px-1.5 py-0.5 rounded">
                    逆向DCF定价
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  当前股价{' '}
                  <span className="font-mono font-bold text-slate-100">
                    {formatCurrency(company.currentStockPrice, company.currencySymbol, 2)}
                  </span>{' '}
                  正在交易：未来5年销量/业务复合增速需达{' '}
                  <span className="font-mono font-bold text-amber-300">{formatPercent(impliedGrowth)}</span>、稳态毛利率底线守住{' '}
                  <span className="font-mono font-bold text-cyan-300">{formatPercent(impliedMargin)}</span>，并维持{' '}
                  <span className="font-mono font-bold text-purple-300">{capYearsLabel}</span>{' '}
                  超额竞争优势期 (MICAP)。对比加权公允值{' '}
                  <span className="font-mono font-bold text-cyan-200">
                    {formatCurrency(valuation.expectedValuePerShare, company.currencySymbol, 2)}
                  </span>
                  ，{growthComparisonText}。
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>{verdict.summary}</span>
              </div>
            </div>

            {/* Column 2: Core Non-Consensus Catalyst */}
            <div className="rounded-xl bg-slate-950/80 border border-emerald-900/50 p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-950/90 border border-emerald-800/60 text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-emerald-200">核心非共识催化剂</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 border border-emerald-900/60 px-1.5 py-0.5 rounded">
                  Variant Perception
                </span>
              </div>
              <div className="rounded-lg bg-emerald-950/35 border border-emerald-800/40 px-3 py-2">
                <div className="text-[10px] font-mono font-semibold text-emerald-400 mb-0.5">
                  头号催化里程碑
                </div>
                <p className="text-xs font-medium text-emerald-100 leading-relaxed">{primaryCatalyst}</p>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 mb-0.5">非共识预期差逻辑</div>
                <p title={variantPerception} className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                  {variantPerception}
                </p>
              </div>
            </div>

            {/* Column 3: #1 Falsification / Kill Condition */}
            <div className="rounded-xl bg-slate-950/80 border border-rose-900/50 p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-950/90 border border-rose-800/60 text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-rose-200">头号证伪止损红线</h3>
                </div>
                <span className="text-[10px] font-mono text-rose-400/80 bg-rose-950/60 border border-rose-900/60 px-1.5 py-0.5 rounded">
                  Pre-Mortem
                </span>
              </div>
              <div className="rounded-lg bg-rose-950/35 border border-rose-800/40 px-3 py-2">
                <div className="text-[10px] font-mono font-semibold text-rose-400 mb-0.5">
                  触发证伪条件
                </div>
                <p className="text-xs font-medium text-rose-100 leading-relaxed">{killTrigger}</p>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 mb-0.5">触发后纪律动作</div>
                <p className="text-xs text-slate-300 leading-relaxed">{killAction}</p>
              </div>
            </div>
          </div>

          {/* 3-Step Interactive Guided Workflow Action Bar */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectStage('disclosures')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-600/60 text-xs font-semibold transition-all shadow-sm group"
              >
                <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                <span>① 查验/录入最新财报快报 (阶段01)</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => onSelectStage('scenarios')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-600/60 text-xs font-semibold transition-all shadow-sm group"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>② 调节三大业务分部10年DCF (阶段04)</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={onOpenMemo}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/70 text-cyan-200 hover:text-white border border-cyan-700/60 hover:border-cyan-500 text-xs font-semibold transition-all shadow-sm group"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
                <span>③ 撰写我的2026预测与对账单 (打开研报工作台)</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenPeerDuel}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 hover:text-white border border-purple-700/60 hover:border-purple-500 text-xs font-semibold transition-all shadow-sm flex-shrink-0"
            >
              <span>⚔️ 同业双雄PK</span>
            </button>
          </div>
        </div>
      )}
      </section>
    </div>
  );
};
