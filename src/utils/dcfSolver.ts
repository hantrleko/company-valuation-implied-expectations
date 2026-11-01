import { ForecastInputs, ForecastYear, ValuationOutput, MonteCarloResult, MonteCarloBucket, FadePoint } from '../types/financial';

export function calculateForwardDCF(
  baseDeliveries: number,
  baseAsp: number,
  baseRevenue: number,
  inputs: ForecastInputs,
  netDebt: number,
  sharesOutstanding: number,
  currentPrice: number
): ValuationOutput {
  const forecastYears: ForecastYear[] = [];
  let prevDeliveries = baseDeliveries;
  let prevAsp = baseAsp;
  let prevRevenue = baseRevenue;
  let pvExplicitFcff = 0;

  const currentYear = 2024;

  for (let t = 1; t <= 10; t++) {
    const calendarYear = currentYear + t;
    const volumeGrowth = t <= 5 ? inputs.volumeGrowthYears1to5 : inputs.volumeGrowthYears6to10;
    const deliveries = Math.round(prevDeliveries * (1 + volumeGrowth));
    const asp = Math.round(prevAsp * (1 + inputs.aspGrowthYearly));
    
    // Revenue scaling
    const volumeFactor = deliveries / baseDeliveries;
    const aspFactor = asp / baseAsp;
    const revenue = Math.round(baseRevenue * volumeFactor * aspFactor);

    const grossProfit = Math.round(revenue * inputs.targetGrossMargin);
    const opex = Math.round(revenue * (inputs.rdRatioOfRevenue + inputs.sgaRatioOfRevenue));
    const ebit = grossProfit - opex;
    const nopat = ebit > 0 ? Math.round(ebit * (1 - inputs.taxRate)) : ebit;

    // CapEx & Depreciation
    const capex = Math.round(revenue * inputs.capexRatioOfRevenue);
    const depreciation = Math.round(capex * 0.85);
    
    // Working Capital
    const incrementalRev = revenue - prevRevenue;
    const deltaNwc = Math.round(incrementalRev * inputs.deltaNwcRatioOfRevenue);

    // Free cash flow to firm
    const fcff = nopat + depreciation - capex - deltaNwc;

    const discountFactor = 1 / Math.pow(1 + inputs.wacc, t);
    const pvFcff = Math.round(fcff * discountFactor);
    pvExplicitFcff += pvFcff;

    forecastYears.push({
      year: t,
      calendarYear,
      deliveries,
      asp,
      revenue,
      grossProfit,
      operatingExpenses: opex,
      ebit,
      nopat,
      depreciation,
      capex,
      deltaNwc,
      fcff,
      discountFactor: Number(discountFactor.toFixed(4)),
      pvFcff
    });

    prevDeliveries = deliveries;
    prevAsp = asp;
    prevRevenue = revenue;
  }

  // Terminal Value (Gordon Growth Model)
  const lastYear = forecastYears[9];
  const terminalYearFcff = Math.round(lastYear.fcff * (1 + inputs.terminalGrowthRate));
  const denominator = Math.max(inputs.wacc - inputs.terminalGrowthRate, 0.01);
  const terminalValue = Math.round(terminalYearFcff / denominator);
  const terminalDiscountFactor = 1 / Math.pow(1 + inputs.wacc, 10);
  const pvTerminalValue = Math.round(terminalValue * terminalDiscountFactor);

  const enterpriseValue = pvExplicitFcff + pvTerminalValue;
  const equityValue = enterpriseValue - netDebt;
  const valuePerShare = Number((equityValue / sharesOutstanding).toFixed(2));
  const marginOfSafety = Number(((valuePerShare - currentPrice) / currentPrice).toFixed(4));

  // Steady-state earning power (Zero growth value)
  const baseNopat = forecastYears[0].nopat;
  const steadyStateValue = Math.round(baseNopat / inputs.wacc);
  const growthValuePvgo = equityValue - steadyStateValue;
  const terminalValueShare = enterpriseValue > 0 ? Number((pvTerminalValue / enterpriseValue).toFixed(4)) : 0;

  // Bull / Base / Bear scenario calculation
  const bullInputs = {
    ...inputs,
    volumeGrowthYears1to5: inputs.volumeGrowthYears1to5 + 0.10,
    targetGrossMargin: Math.min(inputs.targetGrossMargin + 0.03, 0.40)
  };
  const bearInputs = {
    ...inputs,
    volumeGrowthYears1to5: Math.max(inputs.volumeGrowthYears1to5 - 0.10, -0.05),
    targetGrossMargin: Math.max(inputs.targetGrossMargin - 0.03, 0.08)
  };
  const bullVal = calculateSimpleValuePerShare(baseDeliveries, baseAsp, baseRevenue, bullInputs, netDebt, sharesOutstanding);
  const bearVal = calculateSimpleValuePerShare(baseDeliveries, baseAsp, baseRevenue, bearInputs, netDebt, sharesOutstanding);
  const baseVal = valuePerShare;

  const weights = inputs.scenarioWeights || { bull: 0.2, base: 0.55, bear: 0.25 };
  const expectedValuePerShare = Number((bullVal * weights.bull + baseVal * weights.base + bearVal * weights.bear).toFixed(2));

  // Monte Carlo Simulation
  const monteCarlo = runMonteCarloSimulation(
    baseDeliveries,
    baseAsp,
    baseRevenue,
    inputs,
    netDebt,
    sharesOutstanding,
    currentPrice
  );

  return {
    forecastYears,
    pvExplicitFcff,
    terminalYearFcff,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    netDebt,
    equityValue,
    valuePerShare,
    currentPrice,
    marginOfSafety,
    expectedValuePerShare,
    bullPrice: bullVal,
    basePrice: baseVal,
    bearPrice: bearVal,
    steadyStateValue,
    growthValuePvgo,
    terminalValueShare,
    monteCarlo
  };
}

function calculateSimpleValuePerShare(
  baseDeliveries: number,
  baseAsp: number,
  baseRevenue: number,
  inputs: ForecastInputs,
  netDebt: number,
  sharesOutstanding: number
): number {
  let prevDeliveries = baseDeliveries;
  let prevAsp = baseAsp;
  let prevRevenue = baseRevenue;
  let pvExplicit = 0;
  let lastFcff = 0;

  for (let t = 1; t <= 10; t++) {
    const volumeGrowth = t <= 5 ? inputs.volumeGrowthYears1to5 : inputs.volumeGrowthYears6to10;
    const deliveries = prevDeliveries * (1 + volumeGrowth);
    const asp = prevAsp * (1 + inputs.aspGrowthYearly);
    const revenue = baseRevenue * (deliveries / baseDeliveries) * (asp / baseAsp);
    const grossProfit = revenue * inputs.targetGrossMargin;
    const opex = revenue * (inputs.rdRatioOfRevenue + inputs.sgaRatioOfRevenue);
    const ebit = grossProfit - opex;
    const nopat = ebit > 0 ? ebit * (1 - inputs.taxRate) : ebit;
    const capex = revenue * inputs.capexRatioOfRevenue;
    const deltaNwc = (revenue - prevRevenue) * inputs.deltaNwcRatioOfRevenue;
    const fcff = nopat + capex * 0.85 - capex - deltaNwc;
    pvExplicit += fcff / Math.pow(1 + inputs.wacc, t);
    lastFcff = fcff;
    prevDeliveries = deliveries;
    prevAsp = asp;
    prevRevenue = revenue;
  }

  const tv = (lastFcff * (1 + inputs.terminalGrowthRate)) / Math.max(inputs.wacc - inputs.terminalGrowthRate, 0.01);
  const pvTv = tv / Math.pow(1 + inputs.wacc, 10);
  const ev = pvExplicit + pvTv;
  const eq = ev - netDebt;
  return Number(Math.max(eq / sharesOutstanding, 0).toFixed(2));
}

// Monte Carlo Simulation Engine (1,000 iterations)
export function runMonteCarloSimulation(
  baseDeliveries: number,
  baseAsp: number,
  baseRevenue: number,
  inputs: ForecastInputs,
  netDebt: number,
  sharesOutstanding: number,
  currentPrice: number,
  iterations = 1000
): MonteCarloResult {
  const simulatedPrices: number[] = [];

  // Seeded deterministic pseudo-random generator
  let seed = 42;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const randomGaussian = (mean: number, stdDev: number) => {
    const u = 1 - random();
    const v = random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdDev;
  };

  for (let i = 0; i < iterations; i++) {
    const simGrowth = Math.max(randomGaussian(inputs.volumeGrowthYears1to5, 0.06), -0.10);
    const simMargin = Math.min(Math.max(randomGaussian(inputs.targetGrossMargin, 0.025), 0.06), 0.45);
    const simWacc = Math.min(Math.max(randomGaussian(inputs.wacc, 0.008), 0.06), 0.14);

    const simInputs: ForecastInputs = {
      ...inputs,
      volumeGrowthYears1to5: simGrowth,
      volumeGrowthYears6to10: simGrowth * 0.4,
      targetGrossMargin: simMargin,
      wacc: simWacc
    };

    const price = calculateSimpleValuePerShare(baseDeliveries, baseAsp, baseRevenue, simInputs, netDebt, sharesOutstanding);
    simulatedPrices.push(price);
  }

  simulatedPrices.sort((a, b) => a - b);
  const p10 = simulatedPrices[Math.floor(iterations * 0.10)];
  const p50 = simulatedPrices[Math.floor(iterations * 0.50)];
  const p90 = simulatedPrices[Math.floor(iterations * 0.90)];
  const mean = simulatedPrices.reduce((a, b) => a + b, 0) / iterations;

  // Percentile of current price
  let rank = 0;
  while (rank < iterations && simulatedPrices[rank] < currentPrice) {
    rank++;
  }
  const percentileCurrentPrice = Number(((rank / iterations) * 100).toFixed(1));

  // Build 10 histogram buckets
  const minP = simulatedPrices[0];
  const maxP = simulatedPrices[iterations - 1];
  const bucketWidth = Math.max((maxP - minP) / 10, 1);
  const buckets: MonteCarloBucket[] = [];

  for (let b = 0; b < 10; b++) {
    const bMin = minP + b * bucketWidth;
    const bMax = bMin + bucketWidth;
    const count = simulatedPrices.filter((p) => (b === 9 ? p >= bMin && p <= bMax : p >= bMin && p < bMax)).length;
    buckets.push({
      priceMin: Math.round(bMin),
      priceMax: Math.round(bMax),
      count,
      percentage: Number(((count / iterations) * 100).toFixed(1))
    });
  }

  return {
    iterations,
    meanPrice: Number(mean.toFixed(2)),
    p10Price: Number(p10.toFixed(2)),
    p50Price: Number(p50.toFixed(2)),
    p90Price: Number(p90.toFixed(2)),
    percentileCurrentPrice,
    buckets
  };
}

// Reverse DCF Root Solver: find implied 5-year volume CAGR that matches target market cap
export function solveImpliedGrowthRate(
  targetEquityValue: number,
  baseDeliveries: number,
  baseAsp: number,
  baseRevenue: number,
  inputs: ForecastInputs,
  netDebt: number,
  sharesOutstanding: number,
  currentPrice: number
): number {
  let low = -0.30;
  let high = 1.00;
  let bestG = 0.10;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const testInputs = { ...inputs, volumeGrowthYears1to5: mid, volumeGrowthYears6to10: mid * 0.4 };
    const val = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, testInputs, netDebt, sharesOutstanding, currentPrice);
    
    if (Math.abs(val.equityValue - targetEquityValue) < 10) {
      return Number(mid.toFixed(4));
    }
    if (val.equityValue < targetEquityValue) {
      low = mid;
    } else {
      high = mid;
    }
    bestG = mid;
  }
  return Number(bestG.toFixed(4));
}

// Reverse DCF Margin Solver: find implied gross margin given consensus growth
export function solveImpliedGrossMargin(
  targetEquityValue: number,
  baseDeliveries: number,
  baseAsp: number,
  baseRevenue: number,
  inputs: ForecastInputs,
  netDebt: number,
  sharesOutstanding: number,
  currentPrice: number
): number {
  let low = 0.05;
  let high = 0.60;
  let bestM = 0.20;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const testInputs = { ...inputs, targetGrossMargin: mid };
    const val = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, testInputs, netDebt, sharesOutstanding, currentPrice);

    if (Math.abs(val.equityValue - targetEquityValue) < 10) {
      return Number(mid.toFixed(4));
    }
    if (val.equityValue < targetEquityValue) {
      low = mid;
    } else {
      high = mid;
    }
    bestM = mid;
  }
  return Number(bestM.toFixed(4));
}

// Dynamic MICAP (Market-Implied Competitive Advantage Period) Fade Solver
export function solveImpliedCapYears(
  targetEnterpriseValue: number,
  baseNopat: number,
  baseIc: number,
  wacc: number
): { capYears: number; fadeCurve: FadePoint[] } {
  // Initial ROIC
  const roic0 = baseIc > 0 ? baseNopat / baseIc : wacc * 1.5;
  
  // Numerical bisection for CAP N in [1, 25] years
  let lowN = 1.0;
  let highN = 25.0;
  let bestN = 7.0;

  for (let iter = 0; iter < 30; iter++) {
    const midN = (lowN + highN) / 2;
    // Calculate EV with midN years of fade
    let evEstimate = 0;
    const maxT = 20;

    for (let t = 1; t <= maxT; t++) {
      let roicT = wacc;
      if (t <= midN) {
        // Linear fade from roic0 to wacc over midN years
        const fraction = t / midN;
        roicT = roic0 - fraction * (roic0 - wacc);
      }
      const nopatT = baseNopat * Math.pow(1.04, Math.min(t, midN));
      const reinvestmentT = roicT > 0 ? (nopatT * 0.04) / roicT : 0;
      const fcffT = nopatT - reinvestmentT;
      evEstimate += fcffT / Math.pow(1 + wacc, t);
    }
    // Terminal value at competitive equilibrium
    const terminalNopat = baseNopat * Math.pow(1.04, midN);
    const tv = terminalNopat / wacc;
    evEstimate += tv / Math.pow(1 + wacc, maxT);

    if (Math.abs(evEstimate - targetEnterpriseValue) < 100) {
      bestN = midN;
      break;
    }
    if (evEstimate < targetEnterpriseValue) {
      lowN = midN;
    } else {
      highN = midN;
    }
    bestN = midN;
  }

  // Generate 15-year fade curve
  const fadeCurve: FadePoint[] = [];
  for (let yr = 1; yr <= 15; yr++) {
    let r = wacc;
    if (yr <= bestN) {
      r = roic0 - (yr / bestN) * (roic0 - wacc);
    }
    fadeCurve.push({
      year: yr,
      roic: Number(r.toFixed(4)),
      wacc: Number(wacc.toFixed(4))
    });
  }

  return {
    capYears: Number(bestN.toFixed(1)),
    fadeCurve
  };
}

// Generate Reverse Valuation 2D Sensitivity Grid
export function generateReverseSensitivityGrid(
  baseDeliveries: number,
  baseAsp: number,
  baseRevenue: number,
  inputs: ForecastInputs,
  netDebt: number,
  sharesOutstanding: number,
  currentPrice: number
) {
  const growthRates = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40];
  const margins = [0.12, 0.15, 0.18, 0.21, 0.24, 0.27, 0.30];

  const grid: { growth: number; margin: number; sharePrice: number }[][] = [];

  for (const margin of margins) {
    const row: { growth: number; margin: number; sharePrice: number }[] = [];
    for (const g of growthRates) {
      const testInputs = {
        ...inputs,
        volumeGrowthYears1to5: g,
        volumeGrowthYears6to10: g * 0.4,
        targetGrossMargin: margin
      };
      const val = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, testInputs, netDebt, sharesOutstanding, currentPrice);
      row.push({
        growth: g,
        margin,
        sharePrice: val.valuePerShare
      });
    }
    grid.push(row);
  }

  return { growthRates, margins, grid };
}
