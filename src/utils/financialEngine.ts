import { QuarterData, ReconstructedFinancials, AccountingOptions } from '../types/financial';

export function reconstructFinancials(
  q: QuarterData,
  prevQ: QuarterData | null,
  taxRate: number = 0.15,
  wacc: number = 0.085,
  options?: AccountingOptions
): ReconstructedFinancials {
  const opt: AccountingOptions = options || {
    capitalizeRD: false,
    rdAmortizationYears: 3,
    excludeCreditsAndSubsidies: false
  };

  let ebit = q.operatingProfit.value;

  // 1. Exclude regulatory credits / non-recurring subsidies if enabled
  if (opt.excludeCreditsAndSubsidies && q.regulatoryCreditsOrSubsidies) {
    ebit -= q.regulatoryCreditsOrSubsidies.value;
  }

  const rawNopat = ebit > 0 ? ebit * (1 - taxRate) : ebit;
  const revenue = q.totalRevenue.value;
  const ar = q.accountsReceivable.value;
  const inv = q.inventory.value;
  const ap = q.accountsPayable.value;
  const nwc = ar + inv - ap;

  // Base Invested Capital approximation
  const baseIc = Math.max(nwc + q.capex.value * 3.5, 100);
  const rawRoic = baseIc > 0 ? (rawNopat * 4) / baseIc : 0;

  // 2. R&D Capitalization adjustments
  let adjustedNopat = rawNopat;
  let capitalizedRdAsset = 0;
  let adjustedIc = baseIc;

  if (opt.capitalizeRD) {
    const rd = q.rdExpense.value;
    const years = opt.rdAmortizationYears || 3;
    // R&D asset balance under steady state = rd * (years / 2)
    capitalizedRdAsset = Math.round(rd * (years * 0.75));
    // Quarterly amortization = (rd * 4) / years / 4 = rd / years
    const quarterlyAmortization = rd / years;
    // Economic NOPAT adds back expensed R&D and deducts economic amortization
    const rdNetAdjustment = (rd - quarterlyAmortization) * (1 - taxRate);
    adjustedNopat = Math.round(rawNopat + rdNetAdjustment);
    adjustedIc = Math.round(baseIc + capitalizedRdAsset);
  }

  const roic = adjustedIc > 0 ? (adjustedNopat * 4) / adjustedIc : 0; // Annualized
  const nopatMargin = revenue > 0 ? adjustedNopat / revenue : 0;
  const capitalTurnover = adjustedIc > 0 ? (revenue * 4) / adjustedIc : 0;

  // Free Cash Flow to Firm = NOPAT + D&A - CapEx - Delta NWC
  const da = q.depreciationAmortization.value;
  const capex = q.capex.value;
  const prevNwc = prevQ ? (prevQ.accountsReceivable.value + prevQ.inventory.value - prevQ.accountsPayable.value) : nwc;
  const deltaNwc = nwc - prevNwc;
  const fcff = adjustedNopat + da - capex - deltaNwc;

  // Cash Conversion Cycle (days) = DSO + DIO - DPO
  const dailyRev = revenue > 0 ? revenue / 90 : 1;
  const dailyCogs = q.costOfGoodsSold.value > 0 ? q.costOfGoodsSold.value / 90 : 1;
  const dso = ar / dailyRev;
  const dio = inv / dailyCogs;
  const dpo = ap / dailyCogs;
  const ccc = dso + dio - dpo;

  // Economic Value Added = IC * (ROIC - WACC)
  const eva = adjustedIc * (roic - wacc);
  const reinvestment = capex - da + deltaNwc;
  const reinvestmentRate = adjustedNopat > 0 ? reinvestment / adjustedNopat : 0;

  return {
    period: q.period,
    rawNopat: Math.round(rawNopat),
    nopat: Math.round(adjustedNopat),
    rawInvestedCapital: Math.round(baseIc),
    investedCapital: Math.round(adjustedIc),
    capitalizedRdAsset: Math.round(capitalizedRdAsset),
    nwc: Math.round(nwc),
    rawRoic: Number(rawRoic.toFixed(4)),
    roic: Number(roic.toFixed(4)),
    nopatMargin: Number(nopatMargin.toFixed(4)),
    capitalTurnover: Number(capitalTurnover.toFixed(2)),
    fcff: Math.round(fcff),
    cashConversionCycle: Math.round(ccc),
    eva: Math.round(eva),
    reinvestmentRate: Number(reinvestmentRate.toFixed(4))
  };
}
