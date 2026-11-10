import React from 'react';
import { Company, QuarterData } from '../../types/financial';
import { COMPANIES } from '../../data/companies';
import { HISTORICAL_DATA } from '../../data/historicalData';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Gauge, Layers, Users, BarChart2, TrendingUp, Compass, ArrowRight } from 'lucide-react';

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
    const qList = HISTORICAL_DATA[c.id] || HISTORICAL_DATA['tsla'];
    const lq = qList[qList.length - 1];
    
    // FX conversion to USD for international comparison
    const fxToUsd = c.currency === 'USD' ? 1.0 : c.currency === 'CNY' ? (1 / 7.2) : 1.08;
    const deliveries = lq.deliveries.value;
    const aspUsd = Math.round(lq.asp.value * fxToUsd);
    const unitCostUsd = Math.round(lq.unitCost.value * fxToUsd);
    const grossMargin = lq.automotiveGrossMargin.value;
    const unitGrossProfitUsd = aspUsd - unitCostUsd;
    const unitOpexUsd = deliveries > 0 ? Math.round((lq.operatingExpenses.value * 1000000 * fxToUsd) / deliveries) : 0;
    const unitRdUsd = deliveries > 0 ? Math.round((lq.rdExpense.value * 1000000 * fxToUsd) / deliveries) : 0;
    const unitSgaUsd = deliveries > 0 ? Math.round((lq.sgaExpense.value * 1000000 * fxToUsd) / deliveries) : 0;
    const unitEbitUsd = unitGrossProfitUsd - unitOpexUsd;

    return {
      company: c,
      deliveries,
      aspUsd,
      unitCostUsd,
      unitRdUsd,
      unitSgaUsd,
      grossMargin,
      unitGrossProfitUsd,
      unitOpexUsd,
      unitEbitUsd,
      marketCapUsd: Math.round(c.marketCap * fxToUsd)
    };
  });

  const maxAsp = Math.max(...benchmarkData.map(b => b.aspUsd), 1);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
              阶段 03 ｜ 经营驱动与单元经济学 (v3.1)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
              {company.industryId === 'ev-mobility' ? '单车量价利分解' : '单片晶圆/单芯片量价利分解'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5">
            {company.chineseName} 单元经济学结构与同业横向对标
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            商业竞争的本质是“产销规模 × 单元毛利 － 研发平台与渠道摊薄”。本模块拆解 {company.volumeUnitLabel}、{company.aspUnitLabel}、单元制造成本与费用结构，研判经营杠杆拐点。
          </p>
        </div>
      </div>

      {/* Visual 1: Unit Economics Stacked Breakdown Bar Chart across 5 Peers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              同业 5 强单元经济学堆叠拆解对比 (ASP = 制造BOM + 研发分摊 + 销售渠道 + EBIT 利润)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-600"></span> 制造成本</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> 研发分摊</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> 销管分摊</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> 单元EBIT</span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {benchmarkData.map((item) => {
            const isSelected = item.company.id === company.id;
            const costPct = (item.unitCostUsd / maxAsp) * 100;
            const rdPct = (item.unitRdUsd / maxAsp) * 100;
            const sgaPct = (item.unitSgaUsd / maxAsp) * 100;
            const ebitPct = (Math.max(item.unitEbitUsd, 0) / maxAsp) * 100;

            return (
              <div 
                key={item.company.id}
                onClick={() => onSelectCompany(item.company)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-950 border-cyan-500/80 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                    : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 font-mono">{item.company.ticker}</span>
                    <span className="text-slate-300 font-medium">{item.company.chineseName}</span>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        当前标的
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-300">
                    ASP: <strong className="text-emerald-400 font-bold">${formatNumber(item.aspUsd)}</strong>
                    <span className="text-slate-500 text-[11px] ml-2">
                      (毛利率: <span className="text-amber-300 font-bold">{item.grossMargin.toFixed(1)}%</span> ｜ EBIT: <span className={item.unitEbitUsd >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>${formatNumber(item.unitEbitUsd)}</span>)
                    </span>
                  </div>
                </div>

                {/* Stacked Bar */}
                <div className="w-full h-4 bg-slate-900 rounded-md overflow-hidden flex shadow-inner">
                  <div 
                    style={{ width: `${costPct}%` }}
                    className="bg-slate-600 hover:opacity-90 transition-all"
                    title={`制造成本 BOM: $${formatNumber(item.unitCostUsd)}`}
                  />
                  <div 
                    style={{ width: `${rdPct}%` }}
                    className="bg-purple-600 hover:opacity-90 transition-all"
                    title={`研发摊销: $${formatNumber(item.unitRdUsd)}`}
                  />
                  <div 
                    style={{ width: `${sgaPct}%` }}
                    className="bg-blue-600 hover:opacity-90 transition-all"
                    title={`销管渠道: $${formatNumber(item.unitSgaUsd)}`}
                  />
                  {item.unitEbitUsd > 0 && (
                    <div 
                      style={{ width: `${ebitPct}%` }}
                      className="bg-emerald-500 hover:opacity-90 transition-all"
                      title={`单元 EBIT: $${formatNumber(item.unitEbitUsd)}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual 2: 2D Peer Positioning Bubble Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              行业格局 2D 气泡象限图 (X轴=出货量规模，Y轴=核心硬件毛利率，气泡大小=市值，点击可切换)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            绿色=单件盈利 ｜ 红色=单件亏损
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
          {benchmarkData.map((item) => {
            const isSelected = item.company.id === company.id;
            const isProfit = item.unitEbitUsd >= 0;

            return (
              <button
                key={item.company.id}
                onClick={() => onSelectCompany(item.company)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-950/60 border-slate-850 hover:bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200 text-sm">{item.company.ticker}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isProfit ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.company.chineseName}</div>
                </div>

                <div className="mt-3 space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>年出货:</span>
                    <span className="text-slate-200 font-bold">{formatNumber(item.deliveries)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>毛利率:</span>
                    <span className="text-amber-400 font-bold">{item.grossMargin.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>单元EBIT:</span>
                    <span className={isProfit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      ${formatNumber(item.unitEbitUsd)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-850 text-center">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-600 text-white' : 'text-slate-400 group-hover:text-cyan-300'
                  }`}>
                    {isSelected ? '✓ 当前分析' : '载入此标的 ➔'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cross-Company Benchmark Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{company.industryId === 'ev-mobility' ? '智能电动车 5 强' : '全球半导体与算力芯片 5 强'} 最新财年单元指标详表 (统一折合 USD)</span>
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
                <th className="py-3 px-3 text-right">出货 / 交付规模</th>
                <th className="py-3 px-3 text-right">单元均价 (ASP)</th>
                <th className="py-3 px-3 text-right">单元制造成本</th>
                <th className="py-3 px-3 text-right">核心销售毛利率</th>
                <th className="py-3 px-3 text-right">单元毛利润</th>
                <th className="py-3 px-3 text-right">单元费用分摊</th>
                <th className="py-3 px-3 text-right">单元营业利润 (EBIT)</th>
                <th className="py-3 px-4 text-center">切换操作</th>
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
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-400 text-[11px] transition-colors"
                        >
                          载入模型
                        </button>
                      ) : (
                        <span className="text-[11px] text-cyan-400 font-sans font-bold">已载入</span>
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
