import React from 'react';
import { Company, QuarterData, ReconstructedFinancials, AccountingOptions } from '../../types/financial';
import { reconstructFinancials } from '../../utils/financialEngine';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Calculator, ArrowRight, Zap, TrendingUp, AlertTriangle, ToggleLeft, ToggleRight, Settings2 } from 'lucide-react';

interface FinancialReconstructionStageProps {
  company: Company;
  quarters: QuarterData[];
  accountingOptions: AccountingOptions;
  onChangeAccountingOptions: (opt: AccountingOptions) => void;
}

export const FinancialReconstructionStage: React.FC<FinancialReconstructionStageProps> = ({
  company,
  quarters,
  accountingOptions,
  onChangeAccountingOptions
}) => {
  // Reconstruct every quarter with options
  const reconstructedList: ReconstructedFinancials[] = quarters.map((q, idx) => {
    const prevQ = idx > 0 ? quarters[idx - 1] : null;
    return reconstructFinancials(q, prevQ, company.effectiveTaxRate, company.wacc, accountingOptions);
  });

  const latestRecon = reconstructedList[reconstructedList.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              阶段 02 ｜ 财务重构与真实经济利润 (v3.0)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
              会计调整与研发资本化引擎
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            {company.chineseName} 资本回报率 (ROIC) 与经济附加值 (EVA) 穿透
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            会计准则（GAAP/IFRS）往往将研发一次性费用化并包含碳积分/补贴扰动。本模块提供研发资产化与非经常性损益剥离开关，还原最真实的经济投资资本与持续造血率。
          </p>
        </div>

        {/* Accounting Toggles Toolbar */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeAccountingOptions({
                ...accountingOptions,
                capitalizeRD: !accountingOptions.capitalizeRD
              })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                accountingOptions.capitalizeRD
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>研发资本化 ({accountingOptions.capitalizeRD ? '已开启' : '已关闭'})</span>
            </button>

            <button
              onClick={() => onChangeAccountingOptions({
                ...accountingOptions,
                excludeCreditsAndSubsidies: !accountingOptions.excludeCreditsAndSubsidies
              })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                accountingOptions.excludeCreditsAndSubsidies
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>剥离补贴/积分</span>
            </button>
          </div>
        </div>
      </div>

      {/* DuPont / ROIC Tree Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: ROIC */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>年化重构回报率 (ROIC)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              latestRecon.roic > company.wacc ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }`}>
              {latestRecon.roic > company.wacc ? '超额创造价值' : '低于资本成本'}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-2">
            {formatPercent(latestRecon.roic)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            未调整会计ROIC: {formatPercent(latestRecon.rawRoic)} ｜ WACC: {formatPercent(company.wacc)}
          </div>
        </div>

        {/* Card 2: NOPAT Margin */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400">重构 NOPAT 利润率</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {formatPercent(latestRecon.nopatMargin)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            重构NOPAT: {formatCurrency(latestRecon.nopat, company.currencySymbol)}M (GAAP: {formatCurrency(latestRecon.rawNopat, company.currencySymbol)}M)
          </div>
        </div>

        {/* Card 3: Capital Turnover */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400">投入资本周转率 (Turnover)</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {latestRecon.capitalTurnover}x
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            重构IC: {formatCurrency(latestRecon.investedCapital, company.currencySymbol)}M {accountingOptions.capitalizeRD ? `(含研发资产 +${latestRecon.capitalizedRdAsset}M)` : ''}
          </div>
        </div>

        {/* Card 4: Cash Conversion Cycle */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400">现金循环周期 (CCC)</div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {latestRecon.cashConversionCycle} 天
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {latestRecon.cashConversionCycle < 0 ? '极强议价占款 (负营运资金)' : '营运资金正常占用'}
          </div>
        </div>
      </div>

      {/* ROIC Formula Breakdown Banner */}
      <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/30 flex flex-col md:flex-row items-center justify-around gap-4 text-center">
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">重构 ROIC</span>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {formatPercent(latestRecon.roic)}
          </div>
        </div>
        <div className="text-slate-600 font-bold text-lg">=</div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">NOPAT 利润率</span>
          <div className="text-lg font-bold text-slate-200 font-mono mt-0.5">
            {formatPercent(latestRecon.nopatMargin)}
          </div>
        </div>
        <div className="text-slate-600 font-bold text-lg">×</div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">资本周转率</span>
          <div className="text-lg font-bold text-slate-200 font-mono mt-0.5">
            {latestRecon.capitalTurnover}x
          </div>
        </div>
        <div className="text-slate-600 font-bold text-lg">➔</div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">经济利差 (ROIC - WACC)</span>
          <div className={`text-lg font-bold font-mono mt-0.5 ${
            latestRecon.roic - company.wacc > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatPercent(latestRecon.roic - company.wacc)}
          </div>
        </div>
      </div>

      {/* Reconstructed Multi-Quarter Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>连续8季度重构经济指标趋势表 ({accountingOptions.capitalizeRD ? '含研发资本化' : '未开启资本化'})</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            所得税率基准: {formatPercent(company.effectiveTaxRate)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold text-slate-300 sticky left-0 bg-slate-950 z-10 w-52 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  重构经济指标
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
              {/* Adjusted NOPAT */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  经济 NOPAT (重构后)
                </td>
                {reconstructedList.map((r, i) => (
                  <td key={quarters[i].period} className="py-2.5 px-3 text-right font-medium text-cyan-300">
                    {formatNumber(r.nopat)}
                  </td>
                ))}
              </tr>

              {/* Raw GAAP NOPAT */}
              <tr className="hover:bg-slate-800/40 transition-colors text-slate-500">
                <td className="py-2.5 px-4 font-sans pl-6 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  ↳ GAAP 原生 NOPAT
                </td>
                {reconstructedList.map((r, i) => (
                  <td key={quarters[i].period} className="py-2.5 px-3 text-right">
                    {formatNumber(r.rawNopat)}
                  </td>
                ))}
              </tr>

              {/* Adjusted IC */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  投入资本 IC (重构后)
                </td>
                {reconstructedList.map((r, i) => (
                  <td key={quarters[i].period} className="py-2.5 px-3 text-right text-slate-300">
                    {formatNumber(r.investedCapital)}
                  </td>
                ))}
              </tr>

              {/* ROIC */}
              <tr className="hover:bg-slate-800/40 transition-colors font-semibold">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10 text-cyan-300 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  ROIC (年化回报率)
                </td>
                {reconstructedList.map((r, i) => (
                  <td 
                    key={quarters[i].period} 
                    className={`py-2.5 px-3 text-right ${
                      r.roic >= company.wacc ? 'text-emerald-400 font-bold' : 'text-rose-400'
                    }`}
                  >
                    {formatPercent(r.roic)}
                  </td>
                ))}
              </tr>

              {/* Free Cash Flow to Firm */}
              <tr className="hover:bg-slate-800/40 transition-colors font-semibold">
                <td className="py-2.5 px-4 font-sans sticky left-0 bg-slate-900 z-10 text-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  企业自由现金流 (FCFF)
                </td>
                {reconstructedList.map((r, i) => (
                  <td 
                    key={quarters[i].period} 
                    className={`py-2.5 px-3 text-right ${
                      r.fcff >= 0 ? 'text-cyan-400' : 'text-rose-400'
                    }`}
                  >
                    {formatNumber(r.fcff)}
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
