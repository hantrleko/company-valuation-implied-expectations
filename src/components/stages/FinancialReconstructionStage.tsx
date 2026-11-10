import React, { useState } from 'react';
import { Company, QuarterData, ReconstructedFinancials, AccountingOptions } from '../../types/financial';
import { reconstructFinancials } from '../../utils/financialEngine';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Calculator, ArrowRight, Zap, TrendingUp, AlertTriangle, Settings2, Sparkles, Layers, CheckCircle2 } from 'lucide-react';

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
  const latestQ = quarters[quarters.length - 1];

  // Waterfall Chart Bridge Data for latest quarter
  const rawEbit = latestQ.operatingProfit.value;
  const rdAddition = accountingOptions.capitalizeRD ? latestQ.rdExpense.value : 0;
  const rdAmortizationDeduction = accountingOptions.capitalizeRD ? Math.round(latestRecon.capitalizedRdAsset / (accountingOptions.rdAmortizationYears * 4)) : 0;
  const subsidyDeduction = accountingOptions.excludeCreditsAndSubsidies && latestQ.regulatoryCreditsOrSubsidies ? latestQ.regulatoryCreditsOrSubsidies.value : 0;
  const adjustedEbit = rawEbit + rdAddition - rdAmortizationDeduction - subsidyDeduction;
  const taxDeduction = adjustedEbit > 0 ? Math.round(adjustedEbit * company.effectiveTaxRate) : 0;
  const finalEconomicNopat = latestRecon.nopat;

  const waterfallSteps = [
    { label: 'GAAP 营业利润 (EBIT)', amount: rawEbit, type: 'base', runningTotal: rawEbit },
    ...(accountingOptions.capitalizeRD ? [
      { label: '+ 当期研发费用全额加回', amount: rdAddition, type: 'positive', runningTotal: rawEbit + rdAddition },
      { label: '- 历史研发资产季度摊销', amount: -rdAmortizationDeduction, type: 'negative', runningTotal: rawEbit + rdAddition - rdAmortizationDeduction }
    ] : []),
    ...(accountingOptions.excludeCreditsAndSubsidies && subsidyDeduction > 0 ? [
      { label: '- 剔除非经常补贴/碳积分', amount: -subsidyDeduction, type: 'negative', runningTotal: rawEbit - subsidyDeduction }
    ] : []),
    { label: '- 经营现金有效税扣除', amount: -taxDeduction, type: 'negative', runningTotal: adjustedEbit - taxDeduction },
    { label: '重构经济 NOPAT (真实造血)', amount: finalEconomicNopat, type: 'total', runningTotal: finalEconomicNopat }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
              阶段 02 ｜ 财务重构与真实经济利润 (v3.1)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
              会计准则还原 ➔ 经济实质
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5">
            {company.chineseName} 资本回报率 (ROIC) 与经济附加值 (EVA) 穿透
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            标准会计准则（GAAP/IFRS）通常将高科技研发支出一次性费用化并包含政府补贴等非经常性损益。本模块提供研发资产化与非经常性损益剥离开关，还原最真实的经济投资资本（IC）与持续造血能力。
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                accountingOptions.capitalizeRD
                  ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>研发资本化 ({accountingOptions.capitalizeRD ? '已开启' : '已关闭'})</span>
            </button>

            {accountingOptions.capitalizeRD && (
              <select
                value={accountingOptions.rdAmortizationYears}
                onChange={(e) => onChangeAccountingOptions({
                  ...accountingOptions,
                  rdAmortizationYears: parseInt(e.target.value, 10)
                })}
                className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none"
              >
                <option value={3}>3年直线摊销</option>
                <option value={5}>5年直线摊销</option>
                <option value={7}>7年直线摊销</option>
              </select>
            )}

            <button
              onClick={() => onChangeAccountingOptions({
                ...accountingOptions,
                excludeCreditsAndSubsidies: !accountingOptions.excludeCreditsAndSubsidies
              })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                accountingOptions.excludeCreditsAndSubsidies
                  ? 'bg-amber-600 text-white shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>剥离补贴/积分</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ROIC */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>年化重构回报率 (ROIC)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              latestRecon.roic > company.wacc ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950 text-rose-400 border border-rose-800/40'
            }`}>
              {latestRecon.roic > company.wacc ? '超额创造价值' : '低于资本成本'}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-2">
            {formatPercent(latestRecon.roic)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            未调整会计ROIC: {formatPercent(latestRecon.rawRoic)} ｜ WACC: {formatPercent(company.wacc)}
          </div>
        </div>

        {/* Card 2: NOPAT Margin */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400">重构 NOPAT 利润率</div>
          <div className="text-2xl font-black font-mono text-slate-100 mt-2">
            {formatPercent(latestRecon.nopatMargin)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            重构NOPAT: {formatCurrency(latestRecon.nopat, company.currencySymbol)}M (GAAP: {formatCurrency(latestRecon.rawNopat, company.currencySymbol)}M)
          </div>
        </div>

        {/* Card 3: Capital Turnover */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400">投入资本周转率 (Turnover)</div>
          <div className="text-2xl font-black font-mono text-slate-100 mt-2">
            {latestRecon.capitalTurnover}x
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            重构IC: {formatCurrency(latestRecon.investedCapital, company.currencySymbol)}M {accountingOptions.capitalizeRD ? `(含研发资产 +${latestRecon.capitalizedRdAsset}M)` : ''}
          </div>
        </div>

        {/* Card 4: Cash Conversion Cycle */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400">现金循环周期 (CCC)</div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-2">
            {latestRecon.cashConversionCycle} 天
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {latestRecon.cashConversionCycle < 0 ? '极强上游占款能力 (负营运资金)' : '产业链营运资金正常占用'}
          </div>
        </div>
      </div>

      {/* Visual 1: GAAP EBIT to Economic NOPAT Waterfall Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              会计 EBIT ➔ 经济 NOPAT 重构瀑布阶梯 ({latestQ.periodLabel})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            金额单位：{company.currencySymbol}M
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          {waterfallSteps.map((step, idx) => {
            const isTotal = step.type === 'total';
            const isPositive = step.amount >= 0 && !isTotal;
            const isNegative = step.amount < 0;

            return (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex flex-col justify-between h-32 relative overflow-hidden group">
                <span className="text-[11px] text-slate-400 font-medium leading-snug line-clamp-2">
                  {step.label}
                </span>

                <div className="mt-2">
                  <div className={`text-lg font-black font-mono ${
                    isTotal 
                      ? 'text-cyan-300' 
                      : isPositive 
                        ? 'text-emerald-400' 
                        : isNegative 
                          ? 'text-rose-400' 
                          : 'text-slate-200'
                  }`}>
                    {step.amount > 0 && !isTotal ? '+' : ''}{formatNumber(step.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    阶梯结转: {formatNumber(step.runningTotal)}
                  </div>
                </div>

                {/* Color bar indicator at bottom */}
                <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${
                  isTotal ? 'bg-cyan-500' : isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual 2: Visual DuPont Tree Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Calculator className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100">
            杜邦 ROIC 经济驱动树状拆解模型 (DuPont ROIC Tree)
          </h3>
        </div>

        <div className="mt-5 flex flex-col md:flex-row items-center justify-around gap-4 text-center">
          {/* Node 1: Final ROIC */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/50 shadow-md w-full md:w-56">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold block">
              重构回报率 (ROIC)
            </span>
            <div className="text-2xl font-black text-cyan-300 font-mono mt-1">
              {formatPercent(latestRecon.roic)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              GAAP 原生: {formatPercent(latestRecon.rawRoic)}
            </div>
          </div>

          <div className="text-slate-600 font-black text-xl">=</div>

          {/* Node 2: NOPAT Margin */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md w-full md:w-56">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold block">
              NOPAT 利润率
            </span>
            <div className="text-2xl font-black text-slate-100 font-mono mt-1">
              {formatPercent(latestRecon.nopatMargin)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              NOPAT: {formatNumber(latestRecon.nopat)} / Rev: {formatNumber(latestQ.totalRevenue.value)}
            </div>
          </div>

          <div className="text-slate-600 font-black text-xl">×</div>

          {/* Node 3: Capital Turnover */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md w-full md:w-56">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold block">
              资本周转率 (Turnover)
            </span>
            <div className="text-2xl font-black text-slate-100 font-mono mt-1">
              {latestRecon.capitalTurnover}x
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              Rev / 投入资本 IC ({formatNumber(latestRecon.investedCapital)})
            </div>
          </div>

          <div className="text-slate-600 font-black text-xl">➔</div>

          {/* Node 4: Economic Spread */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-md w-full md:w-56">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold block">
              经济利润利差 (Spread)
            </span>
            <div className={`text-2xl font-black font-mono mt-1 ${
              latestRecon.roic - company.wacc > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatPercent(latestRecon.roic - company.wacc)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              基准 WACC: {formatPercent(company.wacc)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual 3: 8-Quarter ROIC vs WACC Trend Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>连续 8 季度重构经济指标趋势表 ({accountingOptions.capitalizeRD ? `${accountingOptions.rdAmortizationYears}年研发资本化` : '未开启研发资本化'})</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            所得税率基准: {formatPercent(company.effectiveTaxRate)} ｜ 资本成本 (WACC): {formatPercent(company.wacc)}
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
