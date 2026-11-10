import React, { useState, useMemo, useEffect } from 'react';
import { Company, ForecastInputs, DisclosureSource, IndustryId, AccountingOptions } from './types/financial';
import { COMPANIES } from './data/companies';
import { HISTORICAL_DATA } from './data/historicalData';
import { ALL_RESEARCH_MEMOS } from './data/researchMemos';
import { calculateForwardDCF, solveImpliedGrowthRate, solveImpliedGrossMargin, solveImpliedCapYears } from './utils/dcfSolver';
import { Navbar } from './components/Navbar';
import { StageNavigator, StageId } from './components/StageNavigator';
import { LiveValuationHud } from './components/LiveValuationHud';
import { QuickSandboxDrawer } from './components/QuickSandboxDrawer';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { DisclosureDrawer } from './components/DisclosureDrawer';
import { RawDisclosuresStage } from './components/stages/RawDisclosuresStage';
import { FinancialReconstructionStage } from './components/stages/FinancialReconstructionStage';
import { OperatingDriversStage } from './components/stages/OperatingDriversStage';
import { ScenarioForecastingStage } from './components/stages/ScenarioForecastingStage';
import { ValuationRangeStage } from './components/stages/ValuationRangeStage';
import { MarketImpliedStage } from './components/stages/MarketImpliedStage';
import { ResearchMemoModal } from './components/memos/ResearchMemoModal';

export const App: React.FC = () => {
  const [activeIndustry, setActiveIndustry] = useState<IndustryId>('ev-mobility');
  const [activeCompany, setActiveCompany] = useState<Company>(COMPANIES[0]);
  const [currentStage, setCurrentStage] = useState<StageId>('disclosures');
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Accounting Options (v3.1)
  const [accountingOptions, setAccountingOptions] = useState<AccountingOptions>({
    capitalizeRD: false,
    rdAmortizationYears: 3,
    excludeCreditsAndSubsidies: false
  });

  // Disclosure Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inspectedMetric, setInspectedMetric] = useState<{
    name: string;
    period: string;
    value: string;
    disclosure: DisclosureSource | null;
  }>({
    name: '',
    period: '',
    value: '',
    disclosure: null
  });

  // Global Keyboard shortcuts: Ctrl+K / Cmd+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // URL query params synchronization for Eugene Finance Research Hub protocol
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tickerParam = params.get('ticker');
    const stageParam = params.get('stage') as StageId;
    const indParam = params.get('industry') as IndustryId;

    if (indParam && (indParam === 'ev-mobility' || indParam === 'semiconductors')) {
      setActiveIndustry(indParam);
    }
    if (tickerParam) {
      const match = COMPANIES.find(c => c.ticker.toLowerCase().includes(tickerParam.toLowerCase()) || c.id === tickerParam.toLowerCase());
      if (match) {
        setActiveCompany(match);
        setActiveIndustry(match.industryId);
      }
    }
    if (stageParam && ['disclosures', 'reconstruction', 'drivers', 'scenarios', 'valuation', 'market-implied'].includes(stageParam)) {
      setCurrentStage(stageParam);
    }
  }, []);

  // Historical quarters for active company
  const quarters = useMemo(() => {
    return HISTORICAL_DATA[activeCompany.id] || HISTORICAL_DATA['tsla'];
  }, [activeCompany.id]);

  // Annual baseline for forward DCF
  const baseQuarter = useMemo(() => {
    const fy24 = quarters.find((q) => q.period === '2024-FY');
    return fy24 || quarters[quarters.length - 1];
  }, [quarters]);

  // Tailored Forecast inputs per company
  const defaultInputs = useMemo<Record<string, ForecastInputs>>(() => ({
    // EV Mobility
    tsla: {
      volumeGrowthYears1to5: 0.18,
      volumeGrowthYears6to10: 0.08,
      aspGrowthYearly: -0.01,
      targetGrossMargin: 0.185,
      rdRatioOfRevenue: 0.045,
      sgaRatioOfRevenue: 0.055,
      capexRatioOfRevenue: 0.08,
      deltaNwcRatioOfRevenue: 0.015,
      terminalGrowthRate: 0.025,
      wacc: 0.088,
      taxRate: 0.12,
      scenarioWeights: { bull: 0.20, base: 0.55, bear: 0.25 }
    },
    byd: {
      volumeGrowthYears1to5: 0.18,
      volumeGrowthYears6to10: 0.08,
      aspGrowthYearly: -0.02,
      targetGrossMargin: 0.215,
      rdRatioOfRevenue: 0.055,
      sgaRatioOfRevenue: 0.045,
      capexRatioOfRevenue: 0.09,
      deltaNwcRatioOfRevenue: -0.01,
      terminalGrowthRate: 0.025,
      wacc: 0.082,
      taxRate: 0.15,
      scenarioWeights: { bull: 0.25, base: 0.60, bear: 0.15 }
    },
    li: {
      volumeGrowthYears1to5: 0.16,
      volumeGrowthYears6to10: 0.07,
      aspGrowthYearly: -0.015,
      targetGrossMargin: 0.205,
      rdRatioOfRevenue: 0.08,
      sgaRatioOfRevenue: 0.085,
      capexRatioOfRevenue: 0.05,
      deltaNwcRatioOfRevenue: -0.02,
      terminalGrowthRate: 0.025,
      wacc: 0.089,
      taxRate: 0.15,
      scenarioWeights: { bull: 0.30, base: 0.50, bear: 0.20 }
    },
    nio: {
      volumeGrowthYears1to5: 0.24,
      volumeGrowthYears6to10: 0.10,
      aspGrowthYearly: -0.02,
      targetGrossMargin: 0.135,
      rdRatioOfRevenue: 0.14,
      sgaRatioOfRevenue: 0.16,
      capexRatioOfRevenue: 0.10,
      deltaNwcRatioOfRevenue: 0.02,
      terminalGrowthRate: 0.022,
      wacc: 0.096,
      taxRate: 0.15,
      scenarioWeights: { bull: 0.20, base: 0.45, bear: 0.35 }
    },
    xpev: {
      volumeGrowthYears1to5: 0.25,
      volumeGrowthYears6to10: 0.10,
      aspGrowthYearly: -0.02,
      targetGrossMargin: 0.125,
      rdRatioOfRevenue: 0.12,
      sgaRatioOfRevenue: 0.13,
      capexRatioOfRevenue: 0.07,
      deltaNwcRatioOfRevenue: 0.01,
      terminalGrowthRate: 0.022,
      wacc: 0.094,
      taxRate: 0.15,
      scenarioWeights: { bull: 0.30, base: 0.50, bear: 0.20 }
    },
    
    // Semiconductors
    nvda: {
      volumeGrowthYears1to5: 0.24,
      volumeGrowthYears6to10: 0.10,
      aspGrowthYearly: 0.02,
      targetGrossMargin: 0.745,
      rdRatioOfRevenue: 0.09,
      sgaRatioOfRevenue: 0.025,
      capexRatioOfRevenue: 0.02,
      deltaNwcRatioOfRevenue: 0.02,
      terminalGrowthRate: 0.028,
      wacc: 0.092,
      taxRate: 0.14,
      scenarioWeights: { bull: 0.30, base: 0.55, bear: 0.15 }
    },
    tsm: {
      volumeGrowthYears1to5: 0.16,
      volumeGrowthYears6to10: 0.08,
      aspGrowthYearly: 0.03,
      targetGrossMargin: 0.565,
      rdRatioOfRevenue: 0.08,
      sgaRatioOfRevenue: 0.04,
      capexRatioOfRevenue: 0.32,
      deltaNwcRatioOfRevenue: 0.01,
      terminalGrowthRate: 0.025,
      wacc: 0.086,
      taxRate: 0.15,
      scenarioWeights: { bull: 0.25, base: 0.60, bear: 0.15 }
    },
    amd: {
      volumeGrowthYears1to5: 0.18,
      volumeGrowthYears6to10: 0.08,
      aspGrowthYearly: 0.01,
      targetGrossMargin: 0.520,
      rdRatioOfRevenue: 0.22,
      sgaRatioOfRevenue: 0.14,
      capexRatioOfRevenue: 0.03,
      deltaNwcRatioOfRevenue: 0.02,
      terminalGrowthRate: 0.025,
      wacc: 0.090,
      taxRate: 0.14,
      scenarioWeights: { bull: 0.20, base: 0.55, bear: 0.25 }
    },
    avgo: {
      volumeGrowthYears1to5: 0.15,
      volumeGrowthYears6to10: 0.07,
      aspGrowthYearly: 0.02,
      targetGrossMargin: 0.650,
      rdRatioOfRevenue: 0.16,
      sgaRatioOfRevenue: 0.12,
      capexRatioOfRevenue: 0.015,
      deltaNwcRatioOfRevenue: 0.01,
      terminalGrowthRate: 0.025,
      wacc: 0.084,
      taxRate: 0.12,
      scenarioWeights: { bull: 0.25, base: 0.60, bear: 0.15 }
    },
    asml: {
      volumeGrowthYears1to5: 0.13,
      volumeGrowthYears6to10: 0.06,
      aspGrowthYearly: 0.04,
      targetGrossMargin: 0.525,
      rdRatioOfRevenue: 0.15,
      sgaRatioOfRevenue: 0.04,
      capexRatioOfRevenue: 0.07,
      deltaNwcRatioOfRevenue: 0.01,
      terminalGrowthRate: 0.025,
      wacc: 0.085,
      taxRate: 0.15,
      scenarioWeights: { bull: 0.25, base: 0.55, bear: 0.20 }
    }
  }), []);

  const [inputs, setInputs] = useState<ForecastInputs>(defaultInputs['tsla']);

  const handleSelectCompany = (comp: Company) => {
    setActiveCompany(comp);
    setActiveIndustry(comp.industryId);
    setInputs(defaultInputs[comp.id] || defaultInputs['tsla']);
  };

  const handleApplyPreset = (preset: 'bull' | 'base' | 'bear' | 'consensus') => {
    const base = defaultInputs[activeCompany.id] || defaultInputs['tsla'];
    if (preset === 'bull') {
      setInputs({
        ...base,
        volumeGrowthYears1to5: base.volumeGrowthYears1to5 + 0.08,
        targetGrossMargin: Math.min(base.targetGrossMargin + 0.03, 0.85)
      });
    } else if (preset === 'bear') {
      setInputs({
        ...base,
        volumeGrowthYears1to5: Math.max(base.volumeGrowthYears1to5 - 0.08, -0.05),
        targetGrossMargin: Math.max(base.targetGrossMargin - 0.04, 0.06),
        aspGrowthYearly: -0.04
      });
    } else if (preset === 'consensus') {
      setInputs({
        ...base,
        volumeGrowthYears1to5: activeCompany.id === 'tsla' ? 0.15 : activeCompany.id === 'nvda' ? 0.20 : 0.16,
        targetGrossMargin: activeCompany.id === 'tsla' ? 0.175 : activeCompany.id === 'nvda' ? 0.735 : 0.20
      });
    } else {
      setInputs(base);
    }
  };

  // Run dynamic DCF Valuation
  const valuation = useMemo(() => {
    return calculateForwardDCF(
      baseQuarter.deliveries.value,
      baseQuarter.asp.value,
      baseQuarter.totalRevenue.value,
      inputs,
      activeCompany.netDebt,
      activeCompany.sharesOutstanding,
      activeCompany.currentStockPrice
    );
  }, [baseQuarter, inputs, activeCompany]);

  // Global Solvers for Live Valuation HUD
  const impliedGrowth = useMemo(() => {
    return solveImpliedGrowthRate(
      activeCompany.marketCap,
      baseQuarter.deliveries.value,
      baseQuarter.asp.value,
      baseQuarter.totalRevenue.value,
      inputs,
      activeCompany.netDebt,
      activeCompany.sharesOutstanding,
      activeCompany.currentStockPrice
    );
  }, [activeCompany, baseQuarter, inputs]);

  const impliedMargin = useMemo(() => {
    const fixedGrowthInputs = { ...inputs, volumeGrowthYears1to5: 0.15, volumeGrowthYears6to10: 0.06 };
    return solveImpliedGrossMargin(
      activeCompany.marketCap,
      baseQuarter.deliveries.value,
      baseQuarter.asp.value,
      baseQuarter.totalRevenue.value,
      fixedGrowthInputs,
      activeCompany.netDebt,
      activeCompany.sharesOutstanding,
      activeCompany.currentStockPrice
    );
  }, [activeCompany, baseQuarter, inputs]);

  const micap = useMemo(() => {
    const baseNopat = valuation.forecastYears[0].nopat;
    const baseIc = Math.max(activeCompany.marketCap * 0.2, 5000);
    return solveImpliedCapYears(activeCompany.enterpriseValue, baseNopat, baseIc, inputs.wacc);
  }, [activeCompany.enterpriseValue, valuation.forecastYears, inputs.wacc, activeCompany.marketCap]);

  const handleInspect = (name: string, period: string, value: string, disclosure: DisclosureSource) => {
    setInspectedMetric({ name, period, value, disclosure });
    setDrawerOpen(true);
  };

  const activeMemo = useMemo(() => {
    return ALL_RESEARCH_MEMOS.find((m) => m.companyId === activeCompany.id) || ALL_RESEARCH_MEMOS[0];
  }, [activeCompany.id]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 bg-grid-pattern">
      {/* 1. Navbar */}
      <Navbar
        activeIndustry={activeIndustry}
        onSelectIndustry={setActiveIndustry}
        activeCompany={activeCompany}
        onSelectCompany={handleSelectCompany}
        onOpenMemos={() => setIsMemoOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 2. Interactive Stage Pipeline Navigation */}
      <StageNavigator
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
      />

      {/* 3. Global Live Valuation & Expectation Telemetry HUD */}
      <LiveValuationHud
        company={activeCompany}
        valuation={valuation}
        inputs={inputs}
        accountingOptions={accountingOptions}
        impliedGrowth={impliedGrowth}
        impliedMargin={impliedMargin}
        impliedCapYears={micap.capYears}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        isSandboxOpen={isSandboxOpen}
      />

      {/* 4. Main Stage Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {currentStage === 'disclosures' && (
          <RawDisclosuresStage
            company={activeCompany}
            quarters={quarters}
            onInspect={handleInspect}
          />
        )}

        {currentStage === 'reconstruction' && (
          <FinancialReconstructionStage
            company={activeCompany}
            quarters={quarters}
            accountingOptions={accountingOptions}
            onChangeAccountingOptions={setAccountingOptions}
          />
        )}

        {currentStage === 'drivers' && (
          <OperatingDriversStage
            company={activeCompany}
            quarters={quarters}
            onSelectCompany={handleSelectCompany}
          />
        )}

        {currentStage === 'scenarios' && (
          <ScenarioForecastingStage
            company={activeCompany}
            inputs={inputs}
            valuation={valuation}
            onChangeInputs={setInputs}
            onApplyPreset={handleApplyPreset}
          />
        )}

        {currentStage === 'valuation' && (
          <ValuationRangeStage
            company={activeCompany}
            valuation={valuation}
            inputs={inputs}
            baseDeliveries={baseQuarter.deliveries.value}
            baseAsp={baseQuarter.asp.value}
            baseRevenue={baseQuarter.totalRevenue.value}
          />
        )}

        {currentStage === 'market-implied' && (
          <MarketImpliedStage
            company={activeCompany}
            inputs={inputs}
            valuation={valuation}
            baseDeliveries={baseQuarter.deliveries.value}
            baseAsp={baseQuarter.asp.value}
            baseRevenue={baseQuarter.totalRevenue.value}
            memo={activeMemo}
            onOpenMemo={() => setIsMemoOpen(true)}
            onChangeInputs={setInputs}
          />
        )}
      </main>

      {/* 5. Quick Sandbox Drawer (Floating from Right) */}
      <QuickSandboxDrawer
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        company={activeCompany}
        inputs={inputs}
        valuation={valuation}
        onChangeInputs={setInputs}
        onApplyPreset={handleApplyPreset}
      />

      {/* 6. Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectCompany={handleSelectCompany}
        onSelectStage={setCurrentStage}
        onOpenMemos={(companyId) => {
          if (companyId) {
            const comp = COMPANIES.find(c => c.id === companyId);
            if (comp) handleSelectCompany(comp);
          }
          setIsMemoOpen(true);
        }}
      />

      {/* 7. Slide-Over Audit Drawer */}
      <DisclosureDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        metricName={inspectedMetric.name}
        periodLabel={inspectedMetric.period}
        formattedValue={inspectedMetric.value}
        disclosure={inspectedMetric.disclosure}
      />

      {/* 8. Institutional Research Memo & Forecast Ledger Modal */}
      <ResearchMemoModal
        isOpen={isMemoOpen}
        onClose={() => setIsMemoOpen(false)}
        activeCompany={activeCompany}
        onSwitchCompany={(cid) => {
          const comp = COMPANIES.find((c) => c.id === cid);
          if (comp) handleSelectCompany(comp);
        }}
      />

      {/* 9. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Eugene Finance</span>
            <span>·</span>
            <span>公司经营、估值与市场隐含预期实验室 (v3.1 深度交互与美学版)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>SEC EDGAR XBRL</span>
            <span>巨潮资讯 (Cninfo)</span>
            <span>Michael Mauboussin 预期投资学</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
