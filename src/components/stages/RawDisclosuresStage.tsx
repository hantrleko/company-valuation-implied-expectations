import React, { useState, useEffect, useMemo } from 'react';
import { Company, QuarterData, DisclosureSource, AuditedMetric } from '../../types/financial';
import { formatNumber, formatCurrency, formatPercentRaw } from '../../utils/formatters';
import {
  ShieldCheck,
  ExternalLink,
  Info,
  CheckCircle2,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileText
} from 'lucide-react';

export interface CustomBaseOverride {
  periodLabel: string;
  deliveries: number;
  asp: number;
  totalRevenue: number;
  /** 综合毛利率百分比，例如 20.41 表示 20.41% (与 QuarterData.totalGrossMargin.value 口径一致) */
  grossMargin: number;
}

export interface RawDisclosuresStageProps {
  company: Company;
  quarters: QuarterData[];
  onInspect: (metricName: string, periodLabel: string, formattedValue: string, disclosure: DisclosureSource) => void;
  customBaseOverride?: CustomBaseOverride | null;
  onApplyBaseOverride?: (override: CustomBaseOverride | null) => void;
}

type ViewMode = 'absolute' | 'yoy' | 'qoq';

interface OverrideFormState {
  periodLabel: string;
  deliveries: string;
  asp: string;
  totalRevenue: string;
  grossMargin: string;
}

interface XbrlMappingItem {
  tag: string;
  cnLabel: string;
  cninfoTag: string;
  metricName: string;
  extractor: (q: QuarterData) => AuditedMetric<number>;
  subNote?: (q: QuarterData) => string;
}

const OVERRIDE_STORAGE_PREFIX = 'user_filing_override_v45_';

const XBRL_TAXONOMY_MAPPINGS: XbrlMappingItem[] = [
  {
    tag: 'us-gaap:Revenues',
    cnLabel: '营业总收入',
    cninfoTag: 'cas:OperatingRevenue',
    metricName: '营业总收入',
    extractor: (q) => q.totalRevenue
  },
  {
    tag: 'us-gaap:CostOfGoodsAndServicesSold',
    cnLabel: '营业总成本',
    cninfoTag: 'cas:OperatingCosts',
    metricName: '营业总成本',
    extractor: (q) => q.costOfGoodsSold
  },
  {
    tag: 'us-gaap:GrossProfit',
    cnLabel: '毛利润总额',
    cninfoTag: 'cas:GrossProfit',
    metricName: '毛利润总额',
    extractor: (q) => q.totalGrossProfit,
    subNote: (q) => `综合毛利率 ${q.totalGrossMargin.value.toFixed(1)}%`
  },
  {
    tag: 'us-gaap:ResearchAndDevelopmentExpense',
    cnLabel: '研发费用',
    cninfoTag: 'cas:ResearchAndDevelopmentExpenses',
    metricName: '研发费用',
    extractor: (q) => q.rdExpense
  },
  {
    tag: 'us-gaap:OperatingIncomeLoss',
    cnLabel: '营业利润 (EBIT)',
    cninfoTag: 'cas:OperatingProfit',
    metricName: '营业利润 (EBIT)',
    extractor: (q) => q.operatingProfit,
    subNote: (q) => `营业利润率 ${q.operatingMargin.value.toFixed(1)}%`
  },
  {
    tag: 'us-gaap:NetCashProvidedByUsedInOperatingActivities',
    cnLabel: '经营活动现金流净额 (OCF)',
    cninfoTag: 'cas:NetCashFlowsFromOperatingActivities',
    metricName: '经营活动现金流净额',
    extractor: (q) => q.operatingCashFlow
  }
];

function getOverrideStorageKey(companyId: string): string {
  return `${OVERRIDE_STORAGE_PREFIX}${companyId}`;
}

function loadOverrideFromStorage(companyId: string): CustomBaseOverride | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getOverrideStorageKey(companyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const deliveries = Number(parsed?.deliveries);
    const asp = Number(parsed?.asp);
    const totalRevenue = Number(parsed?.totalRevenue);
    const grossMargin = Number(parsed?.grossMargin);
    if (
      parsed &&
      typeof parsed.periodLabel === 'string' &&
      Number.isFinite(deliveries) &&
      Number.isFinite(asp) &&
      Number.isFinite(totalRevenue) &&
      Number.isFinite(grossMargin)
    ) {
      return {
        periodLabel: parsed.periodLabel,
        deliveries,
        asp,
        totalRevenue,
        grossMargin
      };
    }
  } catch {
    // Ignore localStorage parse/access issues
  }
  return null;
}

function buildInitialOverrideDraft(
  overrideProp: CustomBaseOverride | null | undefined,
  companyId: string,
  fy25: QuarterData
): CustomBaseOverride {
  if (overrideProp) {
    return { ...overrideProp };
  }
  const stored = loadOverrideFromStorage(companyId);
  if (stored) {
    return stored;
  }
  return {
    periodLabel: '2026-Q1 TTM 快报',
    deliveries: fy25.deliveries.value,
    asp: fy25.asp.value,
    totalRevenue: fy25.totalRevenue.value,
    grossMargin: Number(fy25.totalGrossMargin.value.toFixed(1))
  };
}

function toFormState(draft: CustomBaseOverride): OverrideFormState {
  return {
    periodLabel: draft.periodLabel,
    deliveries: String(draft.deliveries),
    asp: String(draft.asp),
    totalRevenue: String(draft.totalRevenue),
    grossMargin: String(draft.grossMargin)
  };
}

function formatDeltaBadge(draftStr: string, fy25Val: number, isBps?: boolean): { text: string; tone: string } {
  const num = Number(draftStr);
  if (!Number.isFinite(num) || draftStr.trim() === '') {
    return { text: '待输入', tone: 'text-slate-500' };
  }
  if (isBps) {
    const bps = Math.round((num - fy25Val) * 100);
    if (bps === 0) return { text: '与 FY25 一致', tone: 'text-slate-400' };
    return {
      text: `${bps > 0 ? '+' : ''}${bps} bps vs FY25`,
      tone: bps > 0 ? 'text-emerald-400' : 'text-rose-400'
    };
  }
  if (fy25Val === 0) return { text: '-', tone: 'text-slate-500' };
  const pct = ((num - fy25Val) / Math.abs(fy25Val)) * 100;
  if (Math.abs(pct) < 0.05) return { text: '与 FY25 一致', tone: 'text-slate-400' };
  return {
    text: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs FY25`,
    tone: pct > 0 ? 'text-emerald-400' : 'text-rose-400'
  };
}

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
  onInspect,
  customBaseOverride,
  onApplyBaseOverride
}) => {
  const isSec = company.market === 'NASDAQ' || company.market === 'NYSE';
  const [viewMode, setViewMode] = useState<ViewMode>('absolute');
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fy24 = quarters.find(q => q.period === '2024-FY') || quarters[0];
  const fy25 = quarters.find(q => q.period === '2025-FY') || quarters[quarters.length - 1];

  const [localActiveOverride, setLocalActiveOverride] = useState<CustomBaseOverride | null>(() =>
    loadOverrideFromStorage(company.id)
  );
  const [formState, setFormState] = useState<OverrideFormState>(() =>
    toFormState(buildInitialOverrideDraft(customBaseOverride, company.id, fy25))
  );

  useEffect(() => {
    setLocalActiveOverride(loadOverrideFromStorage(company.id));
    setFormState(toFormState(buildInitialOverrideDraft(customBaseOverride, company.id, fy25)));
    setFeedback(null);
  }, [company.id, customBaseOverride, fy25]);

  const activeOverride = customBaseOverride !== undefined ? customBaseOverride : localActiveOverride;

  const overrideFieldConfigs = useMemo(
    () => [
      {
        key: 'deliveries' as const,
        label: company.volumeUnitLabel,
        fy25Value: fy25.deliveries.value,
        step: '1',
        min: '1',
        isBps: false,
        refText: formatNumber(fy25.deliveries.value)
      },
      {
        key: 'asp' as const,
        label: `${company.aspUnitLabel} (${company.currencySymbol})`,
        fy25Value: fy25.asp.value,
        step: '1',
        min: '1',
        isBps: false,
        refText: formatCurrency(fy25.asp.value, company.currencySymbol)
      },
      {
        key: 'totalRevenue' as const,
        label: `营业总收入 (${company.currencySymbol}M)`,
        fy25Value: fy25.totalRevenue.value,
        step: '1',
        min: '1',
        isBps: false,
        refText: `${company.currencySymbol}${formatNumber(fy25.totalRevenue.value)}M`
      },
      {
        key: 'grossMargin' as const,
        label: '综合毛利率 (%)',
        fy25Value: Number(fy25.totalGrossMargin.value.toFixed(1)),
        step: '0.1',
        min: '0',
        max: '99.9',
        isBps: true,
        refText: `${fy25.totalGrossMargin.value.toFixed(1)}%`
      }
    ],
    [company.volumeUnitLabel, company.aspUnitLabel, company.currencySymbol, fy25]
  );

  const handleFieldChange = (field: keyof OverrideFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (feedback) setFeedback(null);
  };

  const handleEstimateRevenueFromDrivers = () => {
    const d = Number(formState.deliveries);
    const a = Number(formState.asp);
    if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(a) || a <= 0) {
      setFeedback({ type: 'error', text: '请先输入有效的正数出货量与单价，再估算总收入。' });
      return;
    }
    const volRatio = fy25.deliveries.value > 0 ? d / fy25.deliveries.value : 1;
    const aspRatio = fy25.asp.value > 0 ? a / fy25.asp.value : 1;
    const estimated = Math.round(fy25.totalRevenue.value * volRatio * aspRatio);
    setFormState(prev => ({ ...prev, totalRevenue: String(estimated) }));
    setFeedback(null);
  };

  const handleApplyOverride = () => {
    const deliveries = Number(formState.deliveries);
    const asp = Number(formState.asp);
    const totalRevenue = Number(formState.totalRevenue);
    const grossMargin = Number(formState.grossMargin);

    if (
      !Number.isFinite(deliveries) || deliveries <= 0 ||
      !Number.isFinite(asp) || asp <= 0 ||
      !Number.isFinite(totalRevenue) || totalRevenue <= 0 ||
      !Number.isFinite(grossMargin) || grossMargin < 0 || grossMargin > 100
    ) {
      setFeedback({
        type: 'error',
        text: '请填写大于 0 的出货量、单价与营业总收入，并将毛利率控制在 0% ~ 100% 之间。'
      });
      return;
    }

    const normalized: CustomBaseOverride = {
      periodLabel: formState.periodLabel.trim() || '2026-Q1 TTM 快报',
      deliveries,
      asp,
      totalRevenue,
      grossMargin: Number(grossMargin.toFixed(2))
    };

    try {
      window.localStorage.setItem(getOverrideStorageKey(company.id), JSON.stringify(normalized));
    } catch {
      // Ignore storage quota errors
    }

    setLocalActiveOverride(normalized);
    setFormState(toFormState(normalized));
    onApplyBaseOverride?.(normalized);
    setFeedback({
      type: 'success',
      text: `已保存「${normalized.periodLabel}」并同步为全站 DCF 与逆向估值最新基准。`
    });
  };

  const handleResetOverride = () => {
    try {
      window.localStorage.removeItem(getOverrideStorageKey(company.id));
    } catch {
      // Ignore storage removal errors
    }

    const defaultDraft: CustomBaseOverride = {
      periodLabel: '2026-Q1 TTM 快报',
      deliveries: fy25.deliveries.value,
      asp: fy25.asp.value,
      totalRevenue: fy25.totalRevenue.value,
      grossMargin: Number(fy25.totalGrossMargin.value.toFixed(1))
    };

    setLocalActiveOverride(null);
    setFormState(toFormState(defaultDraft));
    onApplyBaseOverride?.(null);
    setFeedback({
      type: 'success',
      text: `已清除本地覆盖，恢复 ${fy25.periodLabel} 官方审计年报基准。`
    });
  };

  const handleCopyTag = (tag: string) => {
    try {
      navigator.clipboard?.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => {
        setCopiedTag(prev => (prev === tag ? null : prev));
      }, 1500);
    } catch {
      // Clipboard unavailable
    }
  };

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
      // Find matching quarter or annual report from 1 year ago (e.g. 2025-Q1 vs 2024-Q1, or 2025-FY vs 2024-FY)
      const currentPeriod = q.period;
      const parts = currentPeriod.split('-');
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const suffix = parts[1];
        const prevYearPeriod = `${year - 1}-${suffix}`;
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

  const revYoY25 = fy24.totalRevenue.value > 0
    ? ((fy25.totalRevenue.value - fy24.totalRevenue.value) / fy24.totalRevenue.value) * 100
    : 0;
  const ebitYoY25 = fy24.operatingProfit.value !== 0
    ? ((fy25.operatingProfit.value - fy24.operatingProfit.value) / Math.abs(fy24.operatingProfit.value)) * 100
    : 0;
  const volYoY25 = fy24.deliveries.value > 0
    ? ((fy25.deliveries.value - fy24.deliveries.value) / fy24.deliveries.value) * 100
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
              阶段 01 ｜ 原始披露审计数据库 (V4.0 扩充至 2025 全年)
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-3 h-3" /> 12季度+3年度审计核准 (2023Q1 - 2025FY)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              行业: {company.industry}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5 flex items-center gap-2">
            <span>{company.chineseName} ({company.ticker}) 官方披露历史底稿与 XBRL 同步库</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            涵盖 2023Q1 至 2025Q4 连续 12 个季度及 FY23/FY24/FY25 三份完整年度报告。点击表格中 <strong className="text-cyan-300 font-medium">任意数值单元格</strong> 可穿透查看官方报告类型、披露日期、Accession Number、报表章节与附注原文。
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
              title="同比去年同季度/年度变动 %"
            >
              同比 YoY
            </button>
            <button
              onClick={() => setViewMode('qoq')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'qoq' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="环比上一期变动 %"
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

      {/* V4.0 NEW: FY2025 vs FY2024 XBRL Audited Filing Expansion & Reconciliation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-800/40 shadow-lg">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
            <span>最新年度审计基准 (FY2025)</span>
            <span>{fy25.totalRevenue.disclosure.filingType}</span>
          </div>
          <div className="text-lg font-black font-mono text-slate-100 mt-1">
            {fy25.totalRevenue.disclosure.accessionNumber}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            披露日期: {fy25.totalRevenue.disclosure.filingDate} · 已完成勾稽核验
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[11px] text-slate-400">FY2025 物理出货/交付规模</div>
          <div className="text-xl font-black font-mono text-cyan-300 mt-1">
            {formatNumber(fy25.deliveries.value)}
            <span className="text-xs font-bold text-emerald-400 ml-2">
              {volYoY25 >= 0 ? '+' : ''}{volYoY25.toFixed(1)}% YoY
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            对比 FY2024: {formatNumber(fy24.deliveries.value)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[11px] text-slate-400">FY2025 营业总收入 ({company.currencySymbol}M)</div>
          <div className="text-xl font-black font-mono text-emerald-300 mt-1">
            {company.currencySymbol}{formatNumber(fy25.totalRevenue.value)}M
            <span className="text-xs font-bold text-emerald-400 ml-2">
              {revYoY25 >= 0 ? '+' : ''}{revYoY25.toFixed(1)}% YoY
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            对比 FY2024: {company.currencySymbol}{formatNumber(fy24.totalRevenue.value)}M
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[11px] text-slate-400">FY2025 经营利润 EBIT & 自由现金流</div>
          <div className="text-xl font-black font-mono text-amber-300 mt-1">
            {company.currencySymbol}{formatNumber(fy25.operatingProfit.value)}M
            <span className="text-xs font-bold text-emerald-400 ml-2">
              {ebitYoY25 >= 0 ? '+' : ''}{ebitYoY25.toFixed(1)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            FY25 FCF: {company.currencySymbol}{formatNumber(fy25.freeCashFlow.value)}M (毛利率 {fy25.totalGrossMargin.value.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* V4.5 NEW: Live Earnings Flash Override & SEC EDGAR / Cninfo XBRL Tag Mapping Inspector */}
      <div
        className={`bg-slate-900/95 border rounded-2xl shadow-xl overflow-hidden transition-colors ${
          activeOverride ? 'border-amber-500/50' : 'border-slate-800'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsInspectorOpen(prev => !prev)}
          aria-expanded={isInspectorOpen}
          className="w-full px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2 rounded-xl border flex-shrink-0 ${
                activeOverride
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-cyan-950/70 border-cyan-800/50 text-cyan-400'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                <span>⚡ 在线录入最新季报/业绩快报基准 &amp; SEC XBRL 标准科目映射检视器</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                录入最新季报/TTM快报即时覆盖全站 DCF 与逆向估值基准期，并核验 {isSec ? 'SEC EDGAR US-GAAP' : '巨潮 CAS'} 标准 XBRL 分类标签映射
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
            {activeOverride ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                已激活快报基准: {activeOverride.periodLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                官方年报基准: {fy25.periodLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800">
              <span>{isInspectorOpen ? '收起' : '展开'}</span>
              {isInspectorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>
        </button>

        {isInspectorOpen && (
          <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: (a) Live Earnings Flash Override Sandbox */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300">
                      a) 业绩快报实时录入 / 覆盖沙盘
                    </span>
                    {activeOverride && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                        ACTIVE OVERRIDE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    存储键: user_filing_override_v45_{company.id}
                  </span>
                </div>

                {activeOverride && (
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-700/40 text-[11px] font-mono text-amber-200 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      当前全站生效: <strong className="text-amber-300">{activeOverride.periodLabel}</strong>
                    </span>
                    <span className="text-amber-300/90">
                      营收 {company.currencySymbol}{formatNumber(activeOverride.totalRevenue)}M · 毛利率 {activeOverride.grossMargin.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Period Label */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                    快报 / 基准期标签 (periodLabel)
                  </label>
                  <input
                    type="text"
                    value={formState.periodLabel}
                    onChange={(e) => handleFieldChange('periodLabel', e.target.value)}
                    placeholder="2026-Q1 TTM 快报"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs font-mono text-slate-100"
                  />
                </div>

                {/* 4 Quantitative Drivers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {overrideFieldConfigs.map((field) => {
                    const delta = formatDeltaBadge(formState[field.key], field.fy25Value, field.isBps);
                    return (
                      <div key={field.key} className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <label className="text-[11px] text-slate-300 font-medium truncate" title={field.label}>
                            {field.label}
                          </label>
                          {field.key === 'totalRevenue' && (
                            <button
                              type="button"
                              onClick={handleEstimateRevenueFromDrivers}
                              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex-shrink-0"
                              title="按当前输入的出货量与单价相对 FY25 变动比例估算总收入"
                            >
                              按量×价估算
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step={field.step}
                          min={field.min}
                          max={field.max}
                          value={formState[field.key]}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs font-mono text-slate-100"
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono mt-1.5">
                          <span className="text-slate-500">FY25: {field.refText}</span>
                          <span className={delta.tone}>{delta.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {feedback && (
                  <div
                    className={`px-3 py-2 rounded-lg text-xs border font-mono ${
                      feedback.type === 'error'
                        ? 'bg-rose-950/50 border-rose-800/60 text-rose-300'
                        : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleApplyOverride}
                  className="flex-1 min-w-[220px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-amber-600 hover:from-cyan-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ 作为全站 DCF 与逆向估值最新基准</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetOverride}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>恢复官方审计年报基准</span>
                </button>
              </div>
            </div>

            {/* Right: (b) SEC EDGAR / Cninfo XBRL Official Taxonomy Mapping Table */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300">
                      b) SEC EDGAR / 巨潮 XBRL 官方分类标准映射表
                    </span>
                  </div>
                  <a
                    href={
                      isSec
                        ? `https://www.sec.gov/edgar/browse/?CIK=${company.secEdgarCik}`
                        : `http://www.cninfo.com.cn/new/disclosure/stock?stockCode=${company.cninfoOrgCode || '002594'}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    <span>{isSec ? `CIK: ${company.secEdgarCik || 'N/A'}` : `巨潮代码: ${company.cninfoOrgCode || 'N/A'}`}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Entity & Filing Identifier Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {isSec ? 'SEC EDGAR CIK' : '巨潮机构代码 (Cninfo)'}
                    </span>
                    <span className="text-cyan-300 font-bold select-all">
                      {isSec ? (company.secEdgarCik || '-') : (company.cninfoOrgCode || '-')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">审计基准报告</span>
                    <span className="text-slate-200 font-semibold">
                      {fy25.periodLabel} ({fy25.totalRevenue.disclosure.filingType})
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-500 block text-[10px]">Accession / 公告号</span>
                    <span className="text-emerald-300 truncate block select-all" title={fy25.totalRevenue.disclosure.accessionNumber}>
                      {fy25.totalRevenue.disclosure.accessionNumber}
                    </span>
                  </div>
                </div>

                {/* Taxonomy Mapping Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                        <th className="py-2 px-2.5 font-semibold">XBRL Taxonomy Tag</th>
                        <th className="py-2 px-2.5 font-semibold">标准科目 / CAS 映射</th>
                        <th className="py-2 px-2.5 text-right font-semibold">FY25 审计实绩</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-mono">
                      {XBRL_TAXONOMY_MAPPINGS.map((item) => {
                        const metric = item.extractor(fy25);
                        const isCopied = copiedTag === item.tag;
                        const subText = item.subNote?.(fy25);
                        return (
                          <tr key={item.tag} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-2.5 align-middle">
                              <div className="flex items-center gap-1.5">
                                <code className="text-[11px] text-cyan-300 bg-cyan-950/50 border border-cyan-900/50 px-1.5 py-0.5 rounded select-all">
                                  {item.tag}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTag(item.tag)}
                                  title="复制 XBRL 标签"
                                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-cyan-300 transition-colors flex-shrink-0"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-2.5 font-sans align-middle">
                              <div className="text-slate-200 font-medium">{item.cnLabel}</div>
                              <div className="text-[10px] font-mono text-slate-500">{item.cninfoTag}</div>
                            </td>
                            <td className="py-2 px-2.5 text-right align-middle">
                              <button
                                type="button"
                                onClick={() =>
                                  onInspect(
                                    item.metricName,
                                    fy25.periodLabel,
                                    formatCurrency(metric.value, company.currencySymbol),
                                    metric.disclosure
                                  )
                                }
                                className={`font-bold hover:underline cursor-pointer ${
                                  metric.value < 0 ? 'text-rose-400' : 'text-emerald-300'
                                }`}
                                title="点击穿透查看官方报告原文与附注"
                              >
                                {company.currencySymbol}{formatNumber(metric.value)}M
                              </button>
                              {subText && (
                                <div className="text-[10px] text-slate-400">{subText}</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between gap-2 pt-1">
                <span>点击右侧 FY25 审计金额可穿透核验官方报告章节与附注原文</span>
                <span className="text-slate-400">披露日: {fy25.totalRevenue.disclosure.filingDate}</span>
              </div>
            </div>
          </div>
        )}
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
