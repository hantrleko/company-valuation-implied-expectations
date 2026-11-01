import React from 'react';
import { Company, QuarterData } from '../../types/financial';
import { COMPANIES } from '../../data/companies';
import { HISTORICAL_DATA } from '../../data/historicalData';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Gauge, Layers, Users, BarChart2 } from 'lucide-react';

interface OperatingDriversStageProps {
  company: Company;
  quarters: QuarterData[];
  onSelectCompany: (company: Company) => void;
}

export const OperatingDriversStage: React.FC<OperatingDriversStageProps> = ({
  company,
  quarters,
  onSelectCompany
}) => {
  // Benchmark snapshot across companies in the SAME industry
  const peerCompanies = COMPANIES.filter((c) => c.industryId === company.industryId);

  const benchmarkData = peerCompanies.map((c) => {
    const qList = HISTORICAL_DATA[c.id];
    const lq = qList[qList.length - 1];
    
    // FX conversion to USD for international comparison
    const fxToUsd = c.currency === 'USD' ? 1.0 : c.currency === 'CNY' ? (1 / 7.2) : 1.08;
    const deliveries = lq.deliveries.value;
    const aspUsd = Math.round(lq.asp.value * fxToUsd);
    const unitCostUsd = Math.round(lq.unitCost.value * fxToUsd);
    const grossMargin = lq.automotiveGrossMargin.value;
    const unitGrossProfitUsd = aspUsd - unitCostUsd;
    const unitOpexUsd = deliveries > 0 ? Math.round((lq.operatingExpenses.value * 1000000 * fxToUsd) / deliveries) : 0;
    const unitEbitUsd = unitGrossProfitUsd - unitOpexUsd;

    return {
      company: c,
      deliveries,
      aspUsd,
      unitCostUsd,
      grossMargin,
      unitGrossProfitUsd,
      unitOpexUsd,
      unitEbitUsd
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              阶段 03 ｜ 经营驱动与单元经济学 (v3.0)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
              {company.industryId === 'ev-mobility' ? '单车量价利分解' : '单片晶圆/单芯片量价利分解'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            {company.chineseName} 单元经济学与同行业横向对标
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            商业竞争的本质是“产销规模 × 单元毛利 － 平台研发与渠道摊薄”。本模块拆解 {company.volumeUnitLabel}、{company.aspUnitLabel}、单元毛利润与分摊费用，研判经营杠杆拐点。
          </p>
        </div>
      </div>

      {/* Cross-Company Benchmark Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{company.industryId === 'ev-mobility' ? '智能电动车 5 强' : '全球半导体与算力芯片 5 强'} 最新财年单元经济学对比 (统一折合 USD)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            基准汇率: 1 USD = 7.20 CNY ｜ 1 EUR = 1.08 USD
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold text-slate-300">企业名称 / 股票代码</th>
                <th className="py-3 px-3 text-right">年度出货 / 交付规模</th>
                <th className="py-3 px-3 text-right">单元均价 (ASP USD)</th>
                <th className="py-3 px-3 text-right">单元制造成本</th>
                <th className="py-3 px-3 text-right">核心销售毛利率</th>
                <th className="py-3 px-3 text-right">单元毛利润</th>
                <th className="py-3 px-3 text-right">单元研发/销管分摊</th>
                <th className="py-3 px-3 text-right">单元营业利润 (EBIT)</th>
                <th className="py-3 px-4 text-center">切换模型</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {benchmarkData.map((item) => {
                const isSelected = item.company.id === company.id;
                return (
                  <tr 
                    key={item.company.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400 font-medium' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{item.company.chineseName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">({item.company.ticker})</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300">
                          当前标的
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-200">
                      {formatNumber(item.deliveries)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400">
                      ${formatNumber(item.aspUsd)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      ${formatNumber(item.unitCostUsd)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-400">
                      {item.grossMargin.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-300">
                      ${formatNumber(item.unitGrossProfitUsd)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      ${formatNumber(item.unitOpexUsd)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      item.unitEbitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      ${formatNumber(item.unitEbitUsd)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isSelected ? (
                        <button
                          onClick={() => onSelectCompany(item.company)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] transition-colors"
                        >
                          载入
                        </button>
                      ) : (
                        <span className="text-[11px] text-cyan-500 font-sans">当前</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
