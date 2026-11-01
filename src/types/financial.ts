export type IndustryId = 'ev-mobility' | 'semiconductors';

export interface DisclosureSource {
  filingType: '10-K' | '10-Q' | '20-F' | '6-K' | 'A股年度报告' | 'A股半年度报告' | 'A股季度报告' | '港股业绩公告';
  filingDate: string;
  accessionNumber: string; // SEC Accession Number or Cninfo Announcement ID
  secOrCninfoUrl: string;
  section: string;
  lineItem: string;
  reportedCurrency: 'USD' | 'RMB' | 'EUR' | 'NTD';
  quote: string;
  verified: boolean;
}

export interface AuditedMetric<T = number> {
  value: T;
  disclosure: DisclosureSource;
}

export interface QuarterData {
  period: string; // e.g. "2023-Q1", "2024-Q4", "2024-FY"
  periodLabel: string; // "2023 Q1", "2024 FY"
  isAnnual?: boolean;
  
  // Physical / Volume Drivers
  deliveries: AuditedMetric<number>; // units (cars delivered or kwafers / chip units)
  asp: AuditedMetric<number>; // Unit selling price (RMB or USD)
  unitCost: AuditedMetric<number>; // Unit cost of goods sold
  
  // Income Statement (in Millions of Reporting Currency)
  automotiveRevenue: AuditedMetric<number>; // Primary hardware/compute revenue
  otherRevenue: AuditedMetric<number>; // Secondary segment (Storage, Services, Foundry, Software)
  totalRevenue: AuditedMetric<number>;
  costOfGoodsSold: AuditedMetric<number>;
  automotiveGrossProfit: AuditedMetric<number>;
  totalGrossProfit: AuditedMetric<number>;
  automotiveGrossMargin: AuditedMetric<number>; // %
  totalGrossMargin: AuditedMetric<number>; // %
  
  rdExpense: AuditedMetric<number>;
  sgaExpense: AuditedMetric<number>;
  operatingExpenses: AuditedMetric<number>;
  operatingProfit: AuditedMetric<number>; // EBIT
  operatingMargin: AuditedMetric<number>; // %
  netIncome: AuditedMetric<number>;
  
  // Regulatory Credits / Government Subsidies / Non-recurring gains (for isolation)
  regulatoryCreditsOrSubsidies?: AuditedMetric<number>;
  
  // Cash Flow & Balance Sheet (in Millions)
  operatingCashFlow: AuditedMetric<number>;
  capex: AuditedMetric<number>;
  freeCashFlow: AuditedMetric<number>; // Operating CF - CapEx
  depreciationAmortization: AuditedMetric<number>;
  
  // Working Capital Components
  accountsReceivable: AuditedMetric<number>;
  inventory: AuditedMetric<number>;
  accountsPayable: AuditedMetric<number>;
  cashAndEquivalents: AuditedMetric<number>;
  totalDebt: AuditedMetric<number>;
  
  // Ecosystem: MD&A tone sentiment score (-1.0 to +1.0)
  mdaSentimentScore?: number;
}

export interface AccountingOptions {
  capitalizeRD: boolean; // Capitalize R&D and amortize over 3-5 years
  rdAmortizationYears: number; // e.g. 3 or 5
  excludeCreditsAndSubsidies: boolean; // Isolate regulatory credits / subsidies from core NOPAT
}

export interface Company {
  id: string; // 'tsla', 'byd', 'li', 'nio', 'xpev', 'nvda', 'tsm', 'amd', 'avgo', 'asml'
  ticker: string;
  name: string;
  chineseName: string;
  industryId: IndustryId;
  market: 'NASDAQ' | 'NYSE' | 'SZSE' | 'HKEX' | 'AMS';
  exchangeCode: string;
  currency: 'USD' | 'CNY' | 'EUR';
  currencySymbol: string;
  industry: string;
  sector: string;
  description: string;
  archetype: string; // Strategic positioning
  
  // Unit driver label (e.g. "交付量 (台)" vs "晶圆出货量 (千片等效8/12吋)")
  volumeUnitLabel: string;
  aspUnitLabel: string;
  
  // Market Snapshot (Latest Available / Current)
  currentStockPrice: number;
  sharesOutstanding: number; // in Millions
  marketCap: number; // in Millions
  totalDebt: number; // in Millions
  cashAndEquivalents: number; // in Millions
  netDebt: number; // in Millions
  enterpriseValue: number; // in Millions
  wacc: number; // e.g. 0.088 (8.8%)
  effectiveTaxRate: number; // e.g. 0.15 (15%)
  
  // Primary Filings Index Links
  secEdgarCik?: string;
  cninfoOrgCode?: string;
  investorRelationsUrl: string;
}

export interface ReconstructedFinancials {
  period: string;
  rawNopat: number;
  nopat: number; // Adjusted NOPAT
  rawInvestedCapital: number;
  investedCapital: number; // Adjusted IC
  capitalizedRdAsset: number;
  nwc: number; // AR + Inv - AP
  rawRoic: number;
  roic: number; // Adjusted ROIC
  nopatMargin: number; // NOPAT / Revenue
  capitalTurnover: number; // Revenue / Invested Capital
  fcff: number; // NOPAT + D&A - CapEx - Delta NWC
  cashConversionCycle: number; // DSO + DIO - DPO (in days)
  eva: number; // IC * (ROIC - WACC)
  reinvestmentRate: number; // (CapEx - D&A + Delta NWC) / NOPAT
}

export interface ForecastInputs {
  volumeGrowthYears1to5: number; // e.g. 0.20 (20% CAGR)
  volumeGrowthYears6to10: number; // e.g. 0.08 (8% CAGR)
  aspGrowthYearly: number; // e.g. -0.02 (-2% annual ASP decline)
  targetGrossMargin: number; // e.g. 0.22 (22%)
  rdRatioOfRevenue: number; // e.g. 0.07 (7%)
  sgaRatioOfRevenue: number; // e.g. 0.08 (8%)
  capexRatioOfRevenue: number; // e.g. 0.08 (8%)
  deltaNwcRatioOfRevenue: number; // e.g. 0.02 (2% of incremental revenue)
  terminalGrowthRate: number; // e.g. 0.025 (2.5%)
  wacc: number; // e.g. 0.085 (8.5%)
  taxRate: number; // e.g. 0.15 (15%)
  
  // Scenario Probability Weights
  scenarioWeights: {
    bull: number; // e.g. 0.20 (20%)
    base: number; // e.g. 0.55 (55%)
    bear: number; // e.g. 0.25 (25%)
  };
}

export interface ForecastYear {
  year: number; // 1 to 10
  calendarYear: number; // e.g. 2025, 2026...
  deliveries: number;
  asp: number;
  revenue: number;
  grossProfit: number;
  operatingExpenses: number;
  ebit: number;
  nopat: number;
  depreciation: number;
  capex: number;
  deltaNwc: number;
  fcff: number;
  discountFactor: number;
  pvFcff: number;
  fadedRoic?: number;
}

export interface MonteCarloBucket {
  priceMin: number;
  priceMax: number;
  count: number;
  percentage: number;
}

export interface MonteCarloResult {
  iterations: number;
  meanPrice: number;
  p10Price: number;
  p50Price: number;
  p90Price: number;
  percentileCurrentPrice: number; // What percentile current market price is at
  buckets: MonteCarloBucket[];
}

export interface ValuationOutput {
  forecastYears: ForecastYear[];
  pvExplicitFcff: number;
  terminalYearFcff: number;
  terminalValue: number;
  pvTerminalValue: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  valuePerShare: number;
  currentPrice: number;
  marginOfSafety: number; // (ValuePerShare - CurrentPrice) / CurrentPrice
  
  // Probability-weighted expected valuation
  expectedValuePerShare: number;
  bullPrice: number;
  basePrice: number;
  bearPrice: number;
  
  // Value Decomposition (Mauboussin Bridge)
  steadyStateValue: number; // NOPAT_0 / WACC
  growthValuePvgo: number; // EquityValue - steadyStateValue - NetCash
  terminalValueShare: number; // pvTerminalValue / enterpriseValue
  
  // Monte Carlo
  monteCarlo: MonteCarloResult;
}

export interface FadePoint {
  year: number;
  roic: number;
  wacc: number;
}

export interface ImpliedExpectations {
  currentMarketPrice: number;
  currentMarketCap: number;
  currentEnterpriseValue: number;
  
  // Solved Implied Metrics
  impliedVolumeCagr5Y: number; // What volume CAGR makes DCF == current price?
  impliedRevenueCagr5Y: number;
  impliedTerminalVolume: number; // In 5 years (units)
  impliedGrossMargin: number; // If growth is fixed at consensus, what margin is needed?
  impliedCapYears: number; // Competitive Advantage Period dynamically solved!
  fadeCurve: FadePoint[]; // ROIC fading towards WACC
  
  // Matrix for Reverse Heatmap
  growthRates: number[];
  marginRates: number[];
  sensitivityGrid: { growth: number; margin: number; sharePrice: number }[][];
  
  // Comparison Gap
  marketVsConsensusGrowthGap: number;
  marketVsUserGrowthGap: number;
}

export interface VerifiableForecast {
  id?: string;
  targetPeriod: string; // e.g. "2025 Q1" or "2025 全年"
  metric: string;
  ourPrediction: string;
  consensusEstimate: string;
  verificationSource: string;
  falsificationThreshold: string;
  actualValue?: string; // e.g. "441,000 台"
  status?: 'pending' | 'hit' | 'miss' | 'falsified';
  verificationNotes?: string;
  errorVsConsensusPct?: number;
}

export interface KillCondition {
  id: string;
  trigger: string;
  rationale: string;
  actionIfTriggered: string;
  isTriggered?: boolean;
  triggeredDate?: string;
  postMortemNotes?: string;
}

export interface ResearchMemo {
  id: string;
  companyId: string;
  industryId?: IndustryId;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  recommendation: '强力买入 (Strong Buy)' | '买入 (Buy)' | '持有 / 观望 (Hold)' | '减持 (Underweight)';
  targetHorizon: string;
  
  executiveSummary: string;
  
  // Section 1: Core Investment Thesis & Variant Perception
  thesis: {
    marketConsensus: string;
    variantPerception: string;
    catalysts: string[];
  };
  
  // Section 2: Operating Drivers & Unit Economics Analysis
  driversAnalysis: {
    volumeAndAspDynamics: string;
    grossMarginDefense: string;
    capexAndCashFlowTrajectory: string;
  };
  
  // Section 3: Reverse Valuation & Market Implied Expectations
  reverseValuationAnalysis: {
    impliedExpectationsSummary: string;
    growthVsMarginTradeoff: string;
    competitiveAdvantagePeriodCap: string;
  };
  
  // Section 4: Forward-Looking Verifiable Predictions
  verifiableForecasts: VerifiableForecast[];
  
  // Section 5: Kill Conditions / Pre-Mortem
  killConditions: KillCondition[];
}
