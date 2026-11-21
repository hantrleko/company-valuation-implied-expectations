import React, { useMemo } from 'react';
import { Company, ForecastInputs, ValuationOutput, ResearchMemo, BasePeriodMode } from '../../types/financial';
import { solveImpliedGrowthRate, solveImpliedGrossMargin, solveImpliedCapYears, generateReverseSensitivityGrid } from '../../utils/dcfSolver';
import { getCompanyExpectationBacktest } from '../../data/v4InstitutionalData';
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters';
import { Target, AlertTriangle, Compass, CheckCircle2, BookOpen, Flame, ArrowRight, ShieldX, TrendingDown, Sparkles, History, Layers, Swords } from 'lucide-react';

interface MarketImpliedStageProps {
  company: Company;
  inputs: ForecastInputs;
  valuation: ValuationOutput;
  baseDeliveries: number;
  baseAsp: number;
  baseRevenue: number;
  memo: ResearchMemo;
  onOpenMemo: () => void;
  onChangeInputs?: (newInputs: ForecastInputs) => void;
  basePeriodMode?: BasePeriodMode;
  fy24Revenue?: number;
  fy25Revenue?: number;
  onOpenPeerDuel?: () => void;
}

export const MarketImpliedStage: React.FC<MarketImpliedStageProps> = ({
  company,
  inputs,
  valuation,
  baseDeliveries,
  baseAsp,
  baseRevenue,
  memo,
  onOpenMemo,
  onChangeInputs,
  basePeriodMode = '2025-FY',
  fy24Revenue = 0,
  fy25Revenue = 0,
  onOpenPeerDuel
}) => {
  // Numerical Solver to find implied parameters for CURRENT market cap
  const impliedVolumeGrowth = useMemo(() => {
    return solveImpliedGrowthRate(
      company.marketCap,
      baseDeliveries,
      baseAsp,
      baseRevenue,
      inputs,
      company.netDebt,
      company.sharesOutstanding,
      company.currentStockPrice
    );
  }, [company.marketCap, baseDeliveries, baseAsp, baseRevenue, inputs, company.netDebt, company.sharesOutstanding, company.currentStockPrice]);

  const impliedGrossMargin = useMemo(() => {
    const fixedGrowthInputs = { ...inputs, volumeGrowthYears1to5: 0.15, volumeGrowthYears6to10: 0.06 };
    return solveImpliedGrossMargin(
      company.marketCap,
      baseDeliveries,
      baseAsp,
      baseRevenue,
      fixedGrowthInputs,
      company.netDebt,
      company.sharesOutstanding,
      company.currentStockPrice
    );
  }, [company.marketCap, baseDeliveries, baseAsp, baseRevenue, inputs, company.netDebt, company.sharesOutstanding, company.currentStockPrice]);

  // Dynamic MICAP (Market Implied Competitive Advantage Period)
  const micap = useMemo(() => {
    const baseNopat = valuation.forecastYears[0].nopat;
    const baseIc = Math.max(company.marketCap * 0.2, 5000);
    return solveImpliedCapYears(company.enterpriseValue, baseNopat, baseIc, inputs.wacc);
  }, [company.enterpriseValue, valuation.forecastYears, inputs.wacc, company.marketCap]);

  // Implied Terminal Volume in Year 5
  const impliedTerminalDeliveries = Math.round(baseDeliveries * Math.pow(1 + impliedVolumeGrowth, 5));

  // Reverse Heatmap Grid
  const sensitivity = useMemo(() => {
    return generateReverseSensitivityGrid(
      baseDeliveries,
      baseAsp,
      baseRevenue,
      inputs,
      company.netDebt,
      company.sharesOutstanding,
      company.currentStockPrice
    );
  }, [baseDeliveries, baseAsp, baseRevenue, inputs, company.netDebt, company.sharesOutstanding, company.currentStockPrice]);

  const growthGapVsUser = impliedVolumeGrowth - inputs.volumeGrowthYears1to5;

  const handleCellClick = (growth: number, margin: number) => {
    if (onChangeInputs) {
      onChangeInputs({
        ...inputs,
        volumeGrowthYears1to5: growth,
        targetGrossMargin: margin
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner - Mauboussin Philosophy */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-800/50 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                核心命题 ｜ 市场隐含预期反向工程 (Reverse DCF v3.1)
              </span>
              <span className="text-xs text-slate-400 font-serif italic">
                “不是去预测未来，而是反问：当前价格到底需要多激进的假设才能成立？”
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 mt-2">
              {company.chineseName} 当前市值 ({formatCurrency(company.marketCap, company.currencySymbol)}M) 隐含预期穿透
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              基于 Michael Mauboussin 预期投资学原理：将当前市值作为已知输入，反解出资本市场一致预期对未来销量复合增速、稳态毛利率下限与**超额竞争优势期 (MICAP)** 的隐含定价。
            </p>
          </div>

          <button
            onClick={onOpenMemo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex-shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            查看完整《深度研究备忘录与预测账本》
          </button>
        </div>
      </div>

      {/* 3 Core Reverse Engineering Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Implied Volume Growth */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">1. 市场隐含销量/出货复合增速</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-cyan-300 mt-3">
            {formatPercent(impliedVolumeGrowth)}
          </div>
          <div className="text-xs text-slate-400 mt-2 space-y-1">
            <p>
              倒逼第5年规模需达到: <strong className="text-slate-200 font-mono">{formatNumber(impliedTerminalDeliveries)}</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              当前基准出货量: {formatNumber(baseDeliveries)} (需净扩充 {(impliedTerminalDeliveries / baseDeliveries).toFixed(1)}x)
            </p>
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">我方模型假设: {formatPercent(inputs.volumeGrowthYears1to5)}</span>
              <span className={`font-bold ${growthGapVsUser > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                预期差: {growthGapVsUser > 0 ? '+' : ''}{(growthGapVsUser * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Implied Gross Margin Floor */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">2. 隐含稳态综合毛利率下限</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-300 mt-3">
            {formatPercent(impliedGrossMargin)}
          </div>
          <div className="text-xs text-slate-400 mt-2 space-y-1">
            <p>
              若未来出货增速放缓至行业基准 (15%)，当前股价要求毛利率必须保持在 <strong className="text-amber-200 font-mono">{formatPercent(impliedGrossMargin)}</strong> 以上。
            </p>
            <p className="text-[11px] text-slate-500">
              当前模型综合毛利率假设: {formatPercent(inputs.targetGrossMargin)}
            </p>
            <div className="pt-2 border-t border-slate-850 text-[11px] font-mono text-slate-400">
              毛利率安全空间: <strong className={inputs.targetGrossMargin >= impliedGrossMargin ? 'text-emerald-400' : 'text-rose-400'}>
                {((inputs.targetGrossMargin - impliedGrossMargin) * 100).toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Dynamic MICAP (Market Implied CAP) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">3. 动态求解隐含竞争优势期 (MICAP)</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-purple-300 mt-3">
            {micap.capYears} 年
          </div>
          <div className="text-xs text-slate-400 mt-2 space-y-1">
            <p>
              Mauboussin 竞争均衡衰退模型反解：市场买入了公司在未来 <strong className="text-purple-200">{micap.capYears} 年</strong> 内持续享有超额投资回报（ROIC &gt; WACC）。
            </p>
            <p className="text-[11px] text-slate-500">
              {micap.capYears > 12 ? '市场给予了极高科技护城河常青溢价' : '反映传统工业品 4-8 年周期均值'}
            </p>
            <div className="pt-2 border-t border-slate-850 text-[11px] font-mono text-slate-400">
              WACC 资本成本锚: {formatPercent(inputs.wacc)}
            </div>
          </div>
        </div>
      </div>

      {/* ROIC Fade Curve Table & Visual Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              ROIC 竞争均衡衰退路径 (Competitive Fade Curve: {micap.capYears} 年)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            资本成本锚 (WACC): {formatPercent(inputs.wacc)}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-[700px]">
            {micap.fadeCurve.slice(0, 10).map((pt) => {
              const isSpreadPositive = pt.roic > pt.wacc;
              return (
                <div key={pt.year} className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 font-mono block">第 {pt.year} 年</span>
                  <div className={`text-sm font-bold font-mono mt-1 ${
                    isSpreadPositive ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {formatPercent(pt.roic)}
                  </div>
                  <span className="text-[9px] text-slate-600 block mt-0.5">
                    利差: {formatPercent(pt.roic - pt.wacc)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2D Reverse DCF Heatmap: Volume CAGR vs Gross Margin */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-bold">
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>反向估值热力矩阵 (Reverse DCF Heatmap)：销量增速 vs. 目标毛利率 ➔ 对应每股公允价</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded bg-cyan-950 border border-cyan-400"></span> 🎯 当前市价等高线锚点
            </span>
            <span className="text-slate-500">点击任意单元格可一键载入模型</span>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="text-slate-400 font-mono">
                <th className="py-2.5 px-3 text-left font-semibold text-slate-300">毛利率 \ 5年销量增速</th>
                {sensitivity.growthRates.map((g) => (
                  <th key={g} className="py-2.5 px-3 font-semibold">
                    {(g * 100).toFixed(0)}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {sensitivity.grid.map((row, rowIdx) => {
                const margin = sensitivity.margins[rowIdx];
                return (
                  <tr key={margin} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-left font-semibold text-slate-300">
                      Margin = {(margin * 100).toFixed(0)}%
                    </td>
                    {row.map((cell) => {
                      const priceDiff = Math.abs(cell.sharePrice - company.currentStockPrice) / company.currentStockPrice;
                      const isCurrentPriceAnchor = priceDiff < 0.12;

                      return (
                        <td
                          key={cell.growth}
                          onClick={() => handleCellClick(cell.growth, margin)}
                          className={`py-2.5 px-3 font-semibold transition-all cursor-pointer ${
                            isCurrentPriceAnchor
                              ? 'bg-cyan-950 text-cyan-300 border-2 border-cyan-400 font-black shadow-md'
                              : cell.sharePrice >= company.currentStockPrice
                                ? 'text-emerald-400 hover:bg-emerald-950/30'
                                : 'text-slate-400 hover:bg-slate-800/60'
                          }`}
                          title={`点击将 增速=${(cell.growth * 100).toFixed(0)}%, 毛利率=${(margin * 100).toFixed(0)}% 载入模型`}
                        >
                          {formatCurrency(cell.sharePrice, company.currencySymbol, 1)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* V4.0 MODULE 1 & 5A: 2D Price × Fundamental Attribution Matrix & 12-Quarter Implied Expectation Backtest */}
      {(() => {
        const filingPrice = company.filingBenchmarkPrice || company.currentStockPrice * 0.78;
        const totalStockReturnPct = ((company.currentStockPrice - filingPrice) / filingPrice) * 100;
        const fundamentalExpansionPct = fy24Revenue > 0 ? ((fy25Revenue - fy24Revenue) / fy24Revenue) * 100 : 25;
        const multipleShiftPct = totalStockReturnPct - fundamentalExpansionPct;

        const backtestPoints = getCompanyExpectationBacktest(
          company.id,
          company.currentStockPrice,
          filingPrice,
          impliedVolumeGrowth
        );

        return (
          <div className="space-y-6">
            {/* 1. 2D Time-Machine Attribution Card */}
            <div className="bg-slate-900 border border-emerald-800/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      二维时空股价涨幅归因拆解：基本面业绩兑现 (EPS/Revenue) vs. 市场拔估值 (Multiple/PVGO)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      当前选中基本面基准期：<strong className="text-emerald-300 font-mono">{basePeriodMode}</strong> ｜ 解答“从2024年报发布日至今的股价上涨，究竟是业绩增长推动还是估值泡沫？”
                    </p>
                  </div>
                </div>
                {onOpenPeerDuel && (
                  <button
                    onClick={onOpenPeerDuel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all self-start md:self-auto"
                  >
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>与同业龙头对比隐含预期</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400">1. 跨期股价累计变动 (2024年报日 ➔ 当前)</span>
                  <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
                    {totalStockReturnPct >= 0 ? '+' : ''}{totalStockReturnPct.toFixed(1)}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    {company.currencySymbol}{filingPrice} ➔ {company.currencySymbol}{company.currentStockPrice}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40">
                  <span className="text-[11px] text-emerald-400">2. FY2025 真实基本面扩张贡献 (业绩兑现)</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                    +{fundamentalExpansionPct.toFixed(1)}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    营收从 {company.currencySymbol}{formatNumber(fy24Revenue)}M 增至 {company.currencySymbol}{formatNumber(fy25Revenue)}M
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/40">
                  <span className="text-[11px] text-amber-400">3. 估值倍数与远期预期变动 (拔估值/杀估值)</span>
                  <div className={`text-2xl font-black font-mono mt-1 ${multipleShiftPct > 15 ? 'text-rose-400' : 'text-amber-300'}`}>
                    {multipleShiftPct >= 0 ? '+' : ''}{multipleShiftPct.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {multipleShiftPct <= 0
                      ? '业绩增速超过股价涨幅，动态估值反而被消化便宜了！'
                      : '股价涨幅高于当期业绩增速，市场计入了更高远期预期。'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 12-Quarter Historical Implied Expectations vs. Realized Growth Backtest Trajectory */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      12季度历史隐含预期 vs. 实际业绩兑现回测轨迹 (2023Q1 - 2025Q4 预期剪刀差)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      回溯过去 12 个季度末股价所隐含的 5 年 CAGR 要求（黄线），对比随后实际兑现的年化增速（青色柱），识别历史上的黄金低估买点与情绪过热区。
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 黄金买点 (实际兑现 &gt; 隐含预期)
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 预期过热 (隐含预期 &gt; 实际兑现)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {backtestPoints.map((pt) => {
                  const isGolden = pt.regime === 'golden-buy';
                  const isOverheated = pt.regime === 'overheated';
                  return (
                    <div
                      key={pt.period}
                      className={`p-3 rounded-xl border font-mono text-xs space-y-1.5 ${
                        isGolden
                          ? 'bg-emerald-950/25 border-emerald-800/50'
                          : isOverheated
                          ? 'bg-rose-950/25 border-rose-800/50'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{pt.period}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                            isGolden
                              ? 'bg-emerald-900/70 text-emerald-300'
                              : isOverheated
                              ? 'bg-rose-900/70 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isGolden ? '黄金买点' : isOverheated ? '预期过热' : '定价均衡'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        当时股价: <strong className="text-slate-200">{company.currencySymbol}{pt.stockPriceAtPeriod}</strong>
                      </div>
                      <div className="space-y-0.5 text-[10px] pt-1 border-t border-slate-800/80">
                        <div className="flex justify-between">
                          <span className="text-slate-400">隐含5Y增速:</span>
                          <span className="text-amber-300 font-bold">{(pt.impliedCagr5Y * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">实际兑现:</span>
                          <span className="text-cyan-300 font-bold">{(pt.realizedForwardGrowth * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">预期剪刀差:</span>
                          <span className={pt.sentimentGap >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {pt.sentimentGap >= 0 ? '+' : ''}{(pt.sentimentGap * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pre-Mortem & Kill Conditions Card */}
      <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <ShieldX className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                前置认错条件与止损清单 (Kill Conditions / Pre-Mortem)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                严守投资纪律：绝不因股价波动寻找借口。以下指标若被触发，即证明核心估值假设破产，必须坚决执行止损。
              </p>
            </div>
          </div>
          <button
            onClick={onOpenMemo}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
          >
            调阅预测账本与核验 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {memo.killConditions.map((kc, idx) => (
            <div key={kc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>认错指标 {idx + 1}</span>
                </div>
                <div className="text-sm font-semibold text-slate-100 mt-2">
                  {kc.trigger}
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  <span className="text-slate-500 font-semibold">破产原因：</span>{kc.rationale}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-850 text-xs text-amber-300 font-mono">
                触发动作：{kc.actionIfTriggered}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
