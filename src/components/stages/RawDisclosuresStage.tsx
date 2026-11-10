import React, { useState } from 'react';
import { Company, QuarterData, DisclosureSource, AuditedMetric } from '../../types/financial';
import { formatNumber, formatCurrency, formatPercentRaw } from '../../utils/formatters';
import { ShieldCheck, ExternalLink, Info, CheckCircle2, TrendingUp, Filter, Sparkles, HelpCircle } from 'lucide-react';

interface RawDisclosuresStageProps {
  company: Company;
  quarters: QuarterData[];
  onInspect: (metricName: string, periodLabel: string, formattedValue: string, disclosure: DisclosureSource) => void;
}

type ViewMode = 'absolute' | 'yoy' | 'qoq';

// Mini SVG Sparkline Component
const Sparkline: React.FC<{ data: number[]; isPercent?: boolean; color?: string }> = ({
  data,
  isPercent = false,
  color = '#22d3ee'
}) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 18;
  const padding = 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const lastPoint = points.split(' ').pop()?.split(',') || ['0', '0'];

  return (
    <div className="flex items-center gap-1.5" title={`8Q区间: ${isPercent ? min.toFixed(1) + '%' : formatNumber(min)} ~ ${isPercent ? max.toFixed(1) + '%' : formatNumber(max)}`}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="2.5"
          fill={color}
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};

export const RawDisclosuresStage: React.FC<RawDisclosuresStageProps> = ({
  company,
  quarters,
  onInspect
}) => {
  const isSec = company.market === 'NASDAQ' || company.market === 'NYSE';
  const [viewMode, setViewMode] = useState<ViewMode>('absolute');
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  // Helper to calculate YoY or QoQ
  const getCellDisplay = (
    metricExtractor: (q: QuarterData) => AuditedMetric<number>,
    currentQuarterIdx: number,
    isPercentMetric: boolean = false,
    currencyPrefix: string = ''
  ) => {
    const q = quarters[currentQuarterIdx];
    const rawVal = metricExtractor(q).value;

    if (viewMode === 'absolute') {
      if (isPercentMetric) {
        return formatPercentRaw(rawVal);
      }
      return `${currencyPrefix}${formatNumber(rawVal)}`;
    }

    if (viewMode === 'qoq') {
      if (currentQuarterIdx === 0) return '-';
      const prevVal = metricExtractor(quarters[currentQuarterIdx - 1]).value;
      if (!prevVal || prevVal === 0) return '-';
      const growth = (rawVal - prevVal) / Math.abs(prevVal);
      const sign = growth > 0 ? '+' : '';
      return `${sign}${(growth * 100).toFixed(1)}%`;
    }

    if (viewMode === 'yoy') {
      // Find matching quarter from 4 quarters ago (e.g. 2024-Q1 vs 2023-Q1)
      const currentPeriod = q.period;
      const parts = currentPeriod.split('-');
      if (parts.length === 2 && parts[1].startsWith('Q')) {
        const year = parseInt(parts[0], 10);
        const qtr = parts[1];
        const prevYearPeriod = `${year - 1}-${qtr}`;
        const prevQuarter = quarters.find(item => item.period === prevYearPeriod);
        if (prevQuarter) {
          const prevVal = metricExtractor(prevQuarter).value;
          if (prevVal && prevVal !== 0) {
            const growth = (rawVal - prevVal) / Math.abs(prevVal);
            const sign = growth > 0 ? '+' : '';
            return `${sign}${(growth * 100).toFixed(1)}%`;
          }
        }
      }
      return '-';
    }

    return `${currencyPrefix}${formatNumber(rawVal)}`;
  };

  const getMetricSeries = (extractor: (q: QuarterData) => AuditedMetric<number>) => {
    return quarters.map(q => extractor(q).value);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
              阶段 01 ｜ 原始披露审计数据库
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-3 h-3" /> 8季度+2年度审计核准
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              行业: {company.industry}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5 flex items-center gap-2">
            <span>{company.chineseName} ({company.ticker}) 官方披露历史底稿</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            涵盖 2023Q1 至 2024Q4 连续 8 个季度及年度审计报告。点击表格中 <strong className="text-cyan-300 font-medium">任意数值单元格</strong> 可穿透查看官方报告类型、披露日期、Accession Number、报表章节与附注原文。
          </p>
        </div>

        {/* View Mode Switcher & Filing Archive Link */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 flex-shrink-0">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'absolute' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              绝对值
            </button>
            <button
              onClick={() => setViewMode('yoy')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'yoy' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="同比去年同季度变动 %"
            >
              同比 YoY
            </button>
            <button
              onClick={() => setViewMode('qoq')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'qoq' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="环比上一季度变动 %"
            >
              环比 QoQ
            </button>
          </div>

          <a
            href={isSec 
              ? `https://www.sec.gov/edgar/browse/?CIK=${company.secEdgarCik}`
              : 'http://www.cninfo.com.cn/new/disclosure/stock?stockCode=002594'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isSec ? 'SEC EDGAR 档案库' : '巨潮资讯网档案库'}</span>
          </a>
        </div>
      </div>

      {/* Main Multi-Quarter Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>财务与经营数据表 (单位：{company.currencySymbol}M，数量为物理单位) ｜ 当前视图：{viewMode === 'absolute' ? '原始申报值' : viewMode === 'yoy' ? '同比变动 (YoY %)' : '环比变动 (QoQ %)'}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Info className="w-3 h-3 text-cyan-400" /> 点击数值展开穿透审计抽屉，悬停查看趋势
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold text-slate-300 sticky left-0 bg-slate-950 z-10 w-52 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  经营与财务科目
                </th>
                <th className="py-3 px-2 text-center w-20 text-[11px] text-slate-500">
                  8Q 趋势
                </th>
                {quarters.map((q) => (
                  <th 
                    key={q.period} 
                    className={`py-3 px-3 text-right whitespace-nowrap min-w-[95px] ${
                      q.isAnnual ? 'bg-cyan-950/20 text-cyan-300 font-bold border-l border-cyan-900/40' : ''
                    }`}
                  >
                    {q.periodLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {/* Section 1: Physical Drivers */}
              <tr className="bg-slate-950/60 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 2} className="py-2 px-4 bg-slate-950/80">
                  一、核心物理经营驱动 (Physical Drivers)
                </td>
              </tr>
              
              {/* Volume */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  {company.volumeUnitLabel}
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.deliveries)} color="#22d3ee" />
                </td>
                {quarters.map((q, idx) => (
                  <td key={q.period} className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onInspect(company.volumeUnitLabel, q.periodLabel, `${formatNumber(q.deliveries.value)}`, q.deliveries.disclosure)}
                      className="hover:text-cyan-300 hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right font-medium transition-colors"
                    >
                      {getCellDisplay(item => item.deliveries, idx, false)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* ASP */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  {company.aspUnitLabel} ({company.currencySymbol})
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.asp)} color="#34d399" />
                </td>
                {quarters.map((q, idx) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-emerald-400">
                    <button
                      onClick={() => onInspect(company.aspUnitLabel, q.periodLabel, formatCurrency(q.asp.value, company.currencySymbol), q.asp.disclosure)}
                      className="hover:text-emerald-300 hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                    >
                      {getCellDisplay(item => item.asp, idx, false)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Unit Cost */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  单车/单芯片制造成本 ({company.currencySymbol})
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.unitCost)} color="#94a3b8" />
                </td>
                {quarters.map((q, idx) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-400">
                    <button
                      onClick={() => onInspect('单车/单芯片制造成本', q.periodLabel, formatCurrency(q.unitCost.value, company.currencySymbol), q.unitCost.disclosure)}
                      className="hover:text-slate-200 hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                    >
                      {getCellDisplay(item => item.unitCost, idx, false)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Section 2: Revenues & Margins */}
              <tr className="bg-slate-950/60 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 2} className="py-2 px-4 bg-slate-950/80">
                  二、营业收入与毛利拆解 (Revenues & Margins)
                </td>
              </tr>

              {/* Total Revenue */}
              <tr className="hover:bg-slate-800/40 transition-colors font-semibold text-slate-100">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  营业总收入
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.totalRevenue)} color="#38bdf8" />
                </td>
                {quarters.map((q, idx) => (
                  <td key={q.period} className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onInspect('营业总收入', q.periodLabel, formatCurrency(q.totalRevenue.value, company.currencySymbol), q.totalRevenue.disclosure)}
                      className="hover:text-cyan-300 hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                    >
                      {getCellDisplay(item => item.totalRevenue, idx, false)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Hardware/Automotive Revenue */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-400 pl-6 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  ↳ 核心硬件/数据中心收入
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.automotiveRevenue)} color="#64748b" />
                </td>
                {quarters.map((q, idx) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-300">
                    <button
                      onClick={() => onInspect('核心业务收入', q.periodLabel, formatCurrency(q.automotiveRevenue.value, company.currencySymbol), q.automotiveRevenue.disclosure)}
                      className="hover:text-slate-100 hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                    >
                      {getCellDisplay(item => item.automotiveRevenue, idx, false)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Hardware Gross Margin */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  核心硬件销售毛利率 (%)
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.automotiveGrossMargin)} isPercent color="#fbbf24" />
                </td>
                {quarters.map((q, idx) => (
                  <td key={q.period} className="py-2.5 px-3 text-right font-semibold text-amber-400">
                    <button
                      onClick={() => onInspect('核心硬件销售毛利率', q.periodLabel, `${formatPercentRaw(q.automotiveGrossMargin.value)}`, q.automotiveGrossMargin.disclosure)}
                      className="hover:text-amber-300 hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                    >
                      {getCellDisplay(item => item.automotiveGrossMargin, idx, true)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Section 3: Operating Profitability */}
              <tr className="bg-slate-950/60 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 2} className="py-2 px-4 bg-slate-950/80">
                  三、研发、销管与营业利润 (EBIT & OpEx)
                </td>
              </tr>

              {/* R&D */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-300 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  研发费用 (R&D)
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.rdExpense)} color="#a855f7" />
                </td>
                {quarters.map((q, idx) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-300">
                    <button
                      onClick={() => onInspect('研发费用', q.periodLabel, formatCurrency(q.rdExpense.value, company.currencySymbol), q.rdExpense.disclosure)}
                      className="hover:text-cyan-300 hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                    >
                      {getCellDisplay(item => item.rdExpense, idx, false)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Operating Profit EBIT */}
              <tr className="hover:bg-slate-800/40 transition-colors font-semibold">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  营业利润 (EBIT)
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.operatingProfit)} color="#10b981" />
                </td>
                {quarters.map((q, idx) => {
                  const val = q.operatingProfit.value;
                  return (
                    <td 
                      key={q.period} 
                      className={`py-2.5 px-3 text-right ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      <button
                        onClick={() => onInspect('营业利润 (EBIT)', q.periodLabel, formatCurrency(q.operatingProfit.value, company.currencySymbol), q.operatingProfit.disclosure)}
                        className="hover:underline hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                      >
                        {getCellDisplay(item => item.operatingProfit, idx, false)}
                      </button>
                    </td>
                  );
                })}
              </tr>

              {/* Section 4: Cash Flow & CapEx */}
              <tr className="bg-slate-950/60 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 2} className="py-2 px-4 bg-slate-950/80">
                  四、现金流与资本开支 (Cash Flow & CapEx)
                </td>
              </tr>

              {/* Free Cash Flow */}
              <tr className="hover:bg-slate-800/40 transition-colors font-bold">
                <td className="py-2.5 px-4 font-sans text-cyan-300 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  自由现金流 (FCF)
                </td>
                <td className="py-2 px-2 text-center">
                  <Sparkline data={getMetricSeries(q => q.freeCashFlow)} color="#06b6d4" />
                </td>
                {quarters.map((q, idx) => {
                  const val = q.freeCashFlow.value;
                  return (
                    <td 
                      key={q.period} 
                      className={`py-2.5 px-3 text-right ${val >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}
                    >
                      <button
                        onClick={() => onInspect('自由现金流 (FCF)', q.periodLabel, formatCurrency(q.freeCashFlow.value, company.currencySymbol), q.freeCashFlow.disclosure)}
                        className="hover:underline hover:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer w-full text-right transition-colors"
                      >
                        {getCellDisplay(item => item.freeCashFlow, idx, false)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
