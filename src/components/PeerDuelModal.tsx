import React, { useState, useMemo } from 'react';
import { Company, ForecastInputs } from '../types/financial';
import { COMPANIES } from '../data/companies';
import { HISTORICAL_DATA } from '../data/historicalData';
import { COMPANY_SEGMENTS } from '../data/v4InstitutionalData';
import { calculateForwardDCF, solveImpliedGrowthRate, solveImpliedGrossMargin, solveImpliedCapYears } from '../utils/dcfSolver';
import { reconstructFinancials } from '../utils/financialEngine';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { Swords, X, Trophy, Scale, Flame, ShieldCheck, ArrowRight, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { LiveQuoteItem } from '../utils/liveQuoteService';

interface PeerDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompanyA: Company;
  defaultInputsMap: Record<string, ForecastInputs>;
  liveQuotes: Record<string, LiveQuoteItem>;
  onSelectCompanyInLab: (company: Company) => void;
}

export const PeerDuelModal: React.FC<PeerDuelModalProps> = ({
  isOpen,
  onClose,
  initialCompanyA,
  defaultInputsMap,
  liveQuotes,
  onSelectCompanyInLab
}) => {
  // Default rival mapping
  const getDefaultRivalId = (compId: string): string => {
    const rivalMap: Record<string, string> = {
      tsla: 'byd',
      byd: 'tsla',
      li: 'xpev',
      nio: 'li',
      xpev: 'li',
      nvda: 'amd',
      amd: 'nvda',
      tsm: 'asml',
      avgo: 'nvda',
      asml: 'tsm'
    };
    return rivalMap[compId] || (compId === 'nvda' ? 'amd' : 'nvda');
  };

  const [companyAId, setCompanyAId] = useState<string>(initialCompanyA.id);
  const [companyBId, setCompanyBId] = useState<string>(() => getDefaultRivalId(initialCompanyA.id));

  // Sync companyA when modal opens with a new active company
  React.useEffect(() => {
    if (isOpen) {
      setCompanyAId(initialCompanyA.id);
      const defaultB = getDefaultRivalId(initialCompanyA.id);
      if (defaultB !== initialCompanyA.id) {
        setCompanyBId(defaultB);
      }
    }
  }, [isOpen, initialCompanyA.id]);

  const computeDuelProfile = (compId: string) => {
    const rawComp = COMPANIES.find(c => c.id === compId) || COMPANIES[0];
    const livePrice = liveQuotes[compId]?.price || rawComp.currentStockPrice;
    const marketCap = Math.round(livePrice * rawComp.sharesOutstanding);
    const enterpriseValue = marketCap + rawComp.netDebt;
    const comp: Company = {
      ...rawComp,
      currentStockPrice: livePrice,
      marketCap,
      enterpriseValue
    };

    const qList = HISTORICAL_DATA[compId] || HISTORICAL_DATA['tsla'];
    const fy25 = qList.find(q => q.period === '2025-FY') || qList[qList.length - 1];
    const fy24 = qList.find(q => q.period === '2024-FY') || qList[0];

    const revGrowth2025 = fy24.totalRevenue.value > 0
      ? (fy25.totalRevenue.value - fy24.totalRevenue.value) / fy24.totalRevenue.value
      : 0.20;

    const latestRecon = reconstructFinancials(fy25, fy24, comp.effectiveTaxRate, comp.wacc, {
      capitalizeRD: true,
      rdAmortizationYears: 3,
      excludeCreditsAndSubsidies: true
    });

    const inp = defaultInputsMap[compId] || defaultInputsMap['tsla'];
    const dcf = calculateForwardDCF(
      fy25.deliveries.value,
      fy25.asp.value,
      fy25.totalRevenue.value,
      inp,
      comp.netDebt,
      comp.sharesOutstanding,
      comp.currentStockPrice
    );

    const impliedCagr = solveImpliedGrowthRate(
      comp.marketCap,
      fy25.deliveries.value,
      fy25.asp.value,
      fy25.totalRevenue.value,
      inp,
      comp.netDebt,
      comp.sharesOutstanding,
      comp.currentStockPrice
    );

    const impliedMargin = solveImpliedGrossMargin(
      comp.marketCap,
      fy25.deliveries.value,
      fy25.asp.value,
      fy25.totalRevenue.value,
      { ...inp, volumeGrowthYears1to5: 0.16 },
      comp.netDebt,
      comp.sharesOutstanding,
      comp.currentStockPrice
    );

    const micap = solveImpliedCapYears(
      comp.enterpriseValue,
      dcf.forecastYears[0].nopat,
      Math.max(comp.marketCap * 0.2, 5000),
      inp.wacc
    );

    const fxToUsd = comp.currency === 'USD' ? 1.0 : comp.currency === 'CNY' ? 1 / 7.2 : 1.08;
    const revenueUsdM = Math.round(fy25.totalRevenue.value * fxToUsd);
    const marketCapUsdM = Math.round(comp.marketCap * fxToUsd);

    return {
      company: comp,
      fy25,
      fy24,
      revGrowth2025,
      roic: latestRecon.roic,
      roicSpread: latestRecon.roic - comp.wacc,
      grossMargin: fy25.totalGrossMargin.value / 100,
      operatingMargin: fy25.operatingMargin.value / 100,
      fcfMargin: fy25.totalRevenue.value > 0 ? fy25.freeCashFlow.value / fy25.totalRevenue.value : 0,
      dcf,
      impliedCagr,
      impliedMargin,
      micapYears: micap.capYears,
      expectationGap: impliedCagr - inp.volumeGrowthYears1to5,
      revenueUsdM,
      marketCapUsdM,
      segments: COMPANY_SEGMENTS[compId] || []
    };
  };

  const profileA = useMemo(() => computeDuelProfile(companyAId), [companyAId, liveQuotes, defaultInputsMap]);
  const profileB = useMemo(() => computeDuelProfile(companyBId), [companyBId, liveQuotes, defaultInputsMap]);

  if (!isOpen) return null;

  // Determine fundamental winner vs expectation margin-of-safety winner
  const fundamentalScoreA =
    (profileA.roicSpread > profileB.roicSpread ? 1 : 0) +
    (profileA.grossMargin > profileB.grossMargin ? 1 : 0) +
    (profileA.revGrowth2025 > profileB.revGrowth2025 ? 1 : 0) +
    (profileA.fcfMargin > profileB.fcfMargin ? 1 : 0);

  const valuationWinner = profileA.dcf.marginOfSafety >= profileB.dcf.marginOfSafety ? profileA : profileB;
  const easierExpectationWinner = profileA.expectationGap <= profileB.expectationGap ? profileA : profileB;

  const duelRows = [
    {
      label: '2025 全年营收规模 (折合 USD)',
      valA: `$${formatNumber(profileA.revenueUsdM)}M`,
      valB: `$${formatNumber(profileB.revenueUsdM)}M`,
      rawA: profileA.revenueUsdM,
      rawB: profileB.revenueUsdM,
      higherIsBetter: true
    },
    {
      label: '2025 真实营收同比增速 (YoY)',
      valA: formatPercent(profileA.revGrowth2025),
      valB: formatPercent(profileB.revGrowth2025),
      rawA: profileA.revGrowth2025,
      rawB: profileB.revGrowth2025,
      higherIsBetter: true
    },
    {
      label: '2025 综合销售毛利率 (Gross Margin)',
      valA: formatPercent(profileA.grossMargin),
      valB: formatPercent(profileB.grossMargin),
      rawA: profileA.grossMargin,
      rawB: profileB.grossMargin,
      higherIsBetter: true
    },
    {
      label: '重构经济 ROIC - WACC 超额利差',
      valA: `${profileA.roicSpread >= 0 ? '+' : ''}${(profileA.roicSpread * 100).toFixed(1)}%`,
      valB: `${profileB.roicSpread >= 0 ? '+' : ''}${(profileB.roicSpread * 100).toFixed(1)}%`,
      rawA: profileA.roicSpread,
      rawB: profileB.roicSpread,
      higherIsBetter: true
    },
    {
      label: '自由现金流转化率 (FCF / Revenue)',
      valA: formatPercent(profileA.fcfMargin),
      valB: formatPercent(profileB.fcfMargin),
      rawA: profileA.fcfMargin,
      rawB: profileB.fcfMargin,
      higherIsBetter: true
    },
    {
      label: '当前市价隐含未来5年增速门槛 (越低越易超预期)',
      valA: formatPercent(profileA.impliedCagr),
      valB: formatPercent(profileB.impliedCagr),
      rawA: profileA.impliedCagr,
      rawB: profileB.impliedCagr,
      higherIsBetter: false
    },
    {
      label: '隐含超额竞争优势期 MICAP (越短容错率越高)',
      valA: `${profileA.micapYears} 年`,
      valB: `${profileB.micapYears} 年`,
      rawA: profileA.micapYears,
      rawB: profileB.micapYears,
      higherIsBetter: false
    },
    {
      label: '模型期望公允价值安全边际 (Margin of Safety)',
      valA: `${profileA.dcf.marginOfSafety >= 0 ? '+' : ''}${(profileA.dcf.marginOfSafety * 100).toFixed(1)}%`,
      valB: `${profileB.dcf.marginOfSafety >= 0 ? '+' : ''}${(profileB.dcf.marginOfSafety * 100).toFixed(1)}%`,
      rawA: profileA.dcf.marginOfSafety,
      rawB: profileB.dcf.marginOfSafety,
      higherIsBetter: true
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/50">
                  V4.0 同业双雄同台对决竞技场 (Head-to-Head Valuation & Expectation Duel)
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">
                基本面护城河厚度 vs. 当前实时市价隐含预期严苛度横向PK
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Fighter Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Fighter A Card */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                  🟦 主战方 (标的 A)
                </span>
                <select
                  value={companyAId}
                  onChange={(e) => setCompanyAId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  {COMPANIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.ticker} - {c.chineseName} ({c.industryId === 'ev-mobility' ? '智能电车' : 'AI芯片'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-black text-slate-100">
                    {profileA.company.chineseName}{' '}
                    <span className="text-sm font-mono text-cyan-400">({profileA.company.ticker})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{profileA.company.archetype}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-2xl font-black text-cyan-300">
                    {profileA.company.currencySymbol}{profileA.company.currentStockPrice}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    市值: ${formatNumber(profileA.marketCapUsdM)}M USD
                  </div>
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-amber-500 to-purple-600 p-0.5 shadow-lg">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black font-mono text-xs text-amber-400">
                  VS
                </div>
              </div>
            </div>

            {/* Fighter B Card */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-slate-950 border border-purple-500/40 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-purple-400 font-bold uppercase">
                  🟪 挑战方 (标的 B)
                </span>
                <select
                  value={companyBId}
                  onChange={(e) => setCompanyBId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-400"
                >
                  {COMPANIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.ticker} - {c.chineseName} ({c.industryId === 'ev-mobility' ? '智能电车' : 'AI芯片'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-black text-slate-100">
                    {profileB.company.chineseName}{' '}
                    <span className="text-sm font-mono text-purple-400">({profileB.company.ticker})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{profileB.company.archetype}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-2xl font-black text-purple-300">
                    {profileB.company.currencySymbol}{profileB.company.currentStockPrice}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    市值: ${formatNumber(profileB.marketCapUsdM)}M USD
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 8-Metric Tug of War Matrix */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  八维基本面实力与市场隐含预期严苛度对抗榜 (基于 FY2025 最新财报基准 + 实时市价)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                🏆 绿标代表该单项占优
              </span>
            </div>

            <div className="space-y-3">
              {duelRows.map((row, idx) => {
                const aWins = row.higherIsBetter ? row.rawA >= row.rawB : row.rawA <= row.rawB;
                const bWins = row.higherIsBetter ? row.rawB > row.rawA : row.rawB < row.rawA;
                const absA = Math.max(Math.abs(row.rawA), 0.001);
                const absB = Math.max(Math.abs(row.rawB), 0.001);
                const total = absA + absB;
                const pctA = Math.min(Math.max((absA / total) * 100, 15), 85);
                const pctB = 100 - pctA;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className={`flex items-center gap-1.5 ${aWins ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        <span>{row.valA}</span>
                        {aWins && <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/90 border border-emerald-700/60 text-emerald-300">占优</span>}
                      </div>
                      <span className="text-slate-400 font-sans text-[11px] font-medium">{row.label}</span>
                      <div className={`flex items-center gap-1.5 ${bWins ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                        {bWins && <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/90 border border-emerald-700/60 text-emerald-300">占优</span>}
                        <span>{row.valB}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex gap-0.5">
                      <div
                        className={`h-full transition-all ${aWins ? 'bg-cyan-500' : 'bg-cyan-900/60'}`}
                        style={{ width: `${pctA}%` }}
                      />
                      <div
                        className={`h-full transition-all ${bWins ? 'bg-purple-500' : 'bg-purple-900/60'}`}
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segment Mix Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { prof: profileA, border: 'border-cyan-900/50', badge: 'text-cyan-400' },
              { prof: profileB, border: 'border-purple-900/50', badge: 'text-purple-400' }
            ].map(({ prof, border, badge }, i) => (
              <div key={i} className={`p-4 rounded-2xl bg-slate-950 border ${border} space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${badge}`}>
                    {prof.company.chineseName} 三大业务分部与第二曲线构成 (FY2025)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    公允价值: {prof.company.currencySymbol}{prof.dcf.expectedValuePerShare}
                  </span>
                </div>
                <div className="space-y-2">
                  {prof.segments.map(seg => (
                    <div key={seg.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between font-medium text-slate-200">
                        <span>{seg.name}</span>
                        <span className="font-mono text-cyan-300">营收占比 {(seg.revenueShare2025 * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                        <span>分部毛利率: {(seg.grossMargin * 100).toFixed(1)}%</span>
                        <span>5Y预期CAGR: +{(seg.expectedCagr5Y * 100).toFixed(0)}%</span>
                        <span>目标EV/Sales: {seg.targetEvSalesMultiple}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Verdict Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-700/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
              <Trophy className="w-4 h-4" />
              <span>Eugene Finance 机构投决胜负手裁决 (Buy-Side Allocation Verdict)</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              1. <strong>基本面护城河对决</strong>：在 4 项核心财务质量指标（2025 营收增速、毛利率、ROIC超额利差、自由现金流转化率）中，
              <strong className="text-cyan-300"> {fundamentalScoreA >= 2 ? profileA.company.chineseName : profileB.company.chineseName} </strong>
              胜出（得分 {fundamentalScoreA >= 2 ? `${fundamentalScoreA}: ${4 - fundamentalScoreA}` : `${4 - fundamentalScoreA}: ${fundamentalScoreA}`}）。
              <br />
              2. <strong>市场隐含预期严苛度与赔率对决</strong>：在当前实时股价下，
              <strong className="text-amber-300"> { profileA.company.chineseName } </strong> 隐含未来 5 年复合增速门槛为 <span className="font-mono">{formatPercent(profileA.impliedCagr)}</span>（需维持 {profileA.micapYears} 年超额竞争优势期），而
              <strong className="text-purple-300"> { profileB.company.chineseName } </strong> 隐含未来 5 年复合增速门槛为 <span className="font-mono">{formatPercent(profileB.impliedCagr)}</span>（需维持 {profileB.micapYears} 年超额竞争优势期）。
              <strong className="text-emerald-400"> {easierExpectationWinner.company.chineseName} </strong> 的市场定价拥挤度更低、预期差容错率更高；按概率加权 DCF 测算，
              <strong className="text-emerald-400"> {valuationWinner.company.chineseName} </strong> 当前安全边际占优（{(valuationWinner.dcf.marginOfSafety * 100).toFixed(1)}%）。
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            点击右侧按钮可直接切换主实验室至对应标的沙盘
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectCompanyInLab(profileA.company);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
            >
              进入 {profileA.company.chineseName} 主沙盘
            </button>
            <button
              onClick={() => {
                onSelectCompanyInLab(profileB.company);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
            >
              进入 {profileB.company.chineseName} 主沙盘
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
