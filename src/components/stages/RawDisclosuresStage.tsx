import React from 'react';
import { Company, QuarterData, DisclosureSource } from '../../types/financial';
import { formatNumber, formatCurrency, formatPercentRaw } from '../../utils/formatters';
import { ShieldCheck, ExternalLink, Info, CheckCircle2, MessageSquareText } from 'lucide-react';

interface RawDisclosuresStageProps {
  company: Company;
  quarters: QuarterData[];
  onInspect: (metricName: string, periodLabel: string, formattedValue: string, disclosure: DisclosureSource) => void;
}

export const RawDisclosuresStage: React.FC<RawDisclosuresStageProps> = ({
  company,
  quarters,
  onInspect
}) => {
  const isSec = company.market === 'NASDAQ' || company.market === 'NYSE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              阶段 01 ｜ 原始披露数据库
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-3 h-3" /> 8季度+2年度审计核准
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              行业: {company.industry}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            {company.chineseName} ({company.ticker}) 官方披露历史底稿
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            涵盖2023Q1至2024Q4连续8个季度及年度报告。点击表格中<strong className="text-cyan-300 font-medium">任意数值单元格</strong>，可直接穿透查看官方报告类型、披露日期、Accession Number、科目名称与附注原文。
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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
            {isSec ? 'SEC EDGAR 档案库' : '巨潮资讯网档案库'}
          </a>
        </div>
      </div>

      {/* Main Multi-Quarter Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>财务与经营数据表 (金额单位：{company.currencySymbol}M)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Info className="w-3 h-3" /> 点击任意数值展开穿透审计抽屉
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold text-slate-300 sticky left-0 bg-slate-950 z-10 w-52 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  经营与财务科目
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
              <tr className="bg-slate-950/40 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 1} className="py-2 px-4 bg-slate-950/60">
                  一、核心物理经营驱动 (Physical Drivers)
                </td>
              </tr>
              
              {/* Volume */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  {company.volumeUnitLabel}
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onInspect(company.volumeUnitLabel, q.periodLabel, `${formatNumber(q.deliveries.value)}`, q.deliveries.disclosure)}
                      className="hover:text-cyan-300 hover:underline underline-offset-2 decoration-cyan-500/50 cursor-pointer w-full text-right font-medium"
                    >
                      {formatNumber(q.deliveries.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* ASP */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  {company.aspUnitLabel} ({company.currencySymbol})
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-emerald-400">
                    <button
                      onClick={() => onInspect(company.aspUnitLabel, q.periodLabel, formatCurrency(q.asp.value, company.currencySymbol), q.asp.disclosure)}
                      className="hover:text-emerald-300 hover:underline underline-offset-2 cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.asp.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Unit Cost */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  单芯片/单车成本 ({company.currencySymbol})
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-400">
                    <button
                      onClick={() => onInspect('单芯片/单车成本', q.periodLabel, formatCurrency(q.unitCost.value, company.currencySymbol), q.unitCost.disclosure)}
                      className="hover:text-slate-200 hover:underline underline-offset-2 cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.unitCost.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Section 2: Revenues & Margins */}
              <tr className="bg-slate-950/40 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 1} className="py-2 px-4 bg-slate-950/60">
                  二、营业收入与毛利拆解 (Revenues & Margins)
                </td>
              </tr>

              {/* Total Revenue */}
              <tr className="hover:bg-slate-800/40 transition-colors font-semibold text-slate-100">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  营业总收入
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onInspect('营业总收入', q.periodLabel, formatCurrency(q.totalRevenue.value, company.currencySymbol), q.totalRevenue.disclosure)}
                      className="hover:text-cyan-300 hover:underline underline-offset-2 cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.totalRevenue.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Hardware/Automotive Revenue */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-400 pl-6 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  ↳ 核心硬件/数据中心/汽车业务收入
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-300">
                    <button
                      onClick={() => onInspect('核心业务收入', q.periodLabel, formatCurrency(q.automotiveRevenue.value, company.currencySymbol), q.automotiveRevenue.disclosure)}
                      className="hover:text-slate-100 hover:underline underline-offset-2 cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.automotiveRevenue.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Hardware Gross Margin */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  核心硬件销售毛利率 (%)
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right font-semibold text-amber-400">
                    <button
                      onClick={() => onInspect('核心硬件销售毛利率', q.periodLabel, `${formatPercentRaw(q.automotiveGrossMargin.value)}`, q.automotiveGrossMargin.disclosure)}
                      className="hover:text-amber-300 hover:underline underline-offset-2 cursor-pointer w-full text-right"
                    >
                      {formatPercentRaw(q.automotiveGrossMargin.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Total Gross Margin */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-300 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  综合销售毛利率 (%)
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-300">
                    <button
                      onClick={() => onInspect('综合销售毛利率', q.periodLabel, `${formatPercentRaw(q.totalGrossMargin.value)}`, q.totalGrossMargin.disclosure)}
                      className="hover:text-slate-100 hover:underline underline-offset-2 cursor-pointer w-full text-right"
                    >
                      {formatPercentRaw(q.totalGrossMargin.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Section 3: Operating Profitability */}
              <tr className="bg-slate-950/40 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 1} className="py-2 px-4 bg-slate-950/60">
                  三、研发、销管与营业利润 (EBIT & OpEx)
                </td>
              </tr>

              {/* R&D */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-300 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  研发费用 (R&D)
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-300">
                    <button
                      onClick={() => onInspect('研发费用', q.periodLabel, formatCurrency(q.rdExpense.value, company.currencySymbol), q.rdExpense.disclosure)}
                      className="hover:text-cyan-300 hover:underline cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.rdExpense.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* SG&A */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans text-slate-300 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  销售与行政费用 (SG&A)
                </td>
                {quarters.map((q) => (
                  <td key={q.period} className="py-2.5 px-3 text-right text-slate-300">
                    <button
                      onClick={() => onInspect('销售与行政费用', q.periodLabel, formatCurrency(q.sgaExpense.value, company.currencySymbol), q.sgaExpense.disclosure)}
                      className="hover:text-cyan-300 hover:underline cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.sgaExpense.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Operating Profit EBIT */}
              <tr className="hover:bg-slate-800/40 transition-colors font-semibold">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  营业利润 (EBIT)
                </td>
                {quarters.map((q) => (
                  <td 
                    key={q.period} 
                    className={`py-2.5 px-3 text-right ${
                      q.operatingProfit.value >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <button
                      onClick={() => onInspect('营业利润 (EBIT)', q.periodLabel, formatCurrency(q.operatingProfit.value, company.currencySymbol), q.operatingProfit.disclosure)}
                      className="hover:underline cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.operatingProfit.value)}
                    </button>
                  </td>
                ))}
              </tr>

              {/* Section 4: Cash Flow & CapEx */}
              <tr className="bg-slate-950/40 font-sans font-semibold text-cyan-400 text-[11px]">
                <td colSpan={quarters.length + 1} className="py-2 px-4 bg-slate-950/60">
                  四、现金流与资本开支 (Cash Flow & CapEx)
                </td>
              </tr>

              {/* Free Cash Flow */}
              <tr className="hover:bg-slate-800/40 transition-colors font-bold">
                <td className="py-2.5 px-4 font-sans text-cyan-300 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  自由现金流 (FCF)
                </td>
                {quarters.map((q) => (
                  <td 
                    key={q.period} 
                    className={`py-2.5 px-3 text-right ${
                      q.freeCashFlow.value >= 0 ? 'text-cyan-400' : 'text-rose-400'
                    }`}
                  >
                    <button
                      onClick={() => onInspect('自由现金流 (FCF)', q.periodLabel, formatCurrency(q.freeCashFlow.value, company.currencySymbol), q.freeCashFlow.disclosure)}
                      className="hover:underline cursor-pointer w-full text-right"
                    >
                      {formatNumber(q.freeCashFlow.value)}
                    </button>
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
