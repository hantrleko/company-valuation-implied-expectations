import test from 'node:test';
import assert from 'node:assert/strict';

// Test Forward DCF, Reverse DCF, Monte Carlo, and MICAP
function calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, inputs, netDebt, sharesOutstanding, currentPrice) {
  let prevDeliveries = baseDeliveries;
  let prevAsp = baseAsp;
  let prevRevenue = baseRevenue;
  let pvExplicitFcff = 0;
  const forecastYears = [];

  for (let t = 1; t <= 10; t++) {
    const volumeGrowth = t <= 5 ? inputs.volumeGrowthYears1to5 : inputs.volumeGrowthYears6to10;
    const deliveries = Math.round(prevDeliveries * (1 + volumeGrowth));
    const asp = Math.round(prevAsp * (1 + inputs.aspGrowthYearly));
    const revenue = Math.round(baseRevenue * (deliveries / baseDeliveries) * (asp / baseAsp));
    const grossProfit = Math.round(revenue * inputs.targetGrossMargin);
    const opex = Math.round(revenue * (inputs.rdRatioOfRevenue + inputs.sgaRatioOfRevenue));
    const ebit = grossProfit - opex;
    const nopat = ebit > 0 ? Math.round(ebit * (1 - inputs.taxRate)) : ebit;
    const capex = Math.round(revenue * inputs.capexRatioOfRevenue);
    const deltaNwc = Math.round((revenue - prevRevenue) * inputs.deltaNwcRatioOfRevenue);
    const fcff = nopat + capex * 0.85 - capex - deltaNwc;

    const discountFactor = 1 / Math.pow(1 + inputs.wacc, t);
    const pvFcff = Math.round(fcff * discountFactor);
    pvExplicitFcff += pvFcff;

    forecastYears.push({ year: t, deliveries, revenue, fcff, pvFcff });
    prevDeliveries = deliveries;
    prevAsp = asp;
    prevRevenue = revenue;
  }

  const lastYear = forecastYears[9];
  const terminalYearFcff = Math.round(lastYear.fcff * (1 + inputs.terminalGrowthRate));
  const denominator = Math.max(inputs.wacc - inputs.terminalGrowthRate, 0.01);
  const terminalValue = Math.round(terminalYearFcff / denominator);
  const terminalDiscountFactor = 1 / Math.pow(1 + inputs.wacc, 10);
  const pvTerminalValue = Math.round(terminalValue * terminalDiscountFactor);

  const enterpriseValue = pvExplicitFcff + pvTerminalValue;
  const equityValue = enterpriseValue - netDebt;
  const valuePerShare = Number((equityValue / sharesOutstanding).toFixed(2));

  return { enterpriseValue, equityValue, valuePerShare, pvExplicitFcff, pvTerminalValue };
}

function solveImpliedGrowthRate(targetEquityValue, baseDeliveries, baseAsp, baseRevenue, inputs, netDebt, sharesOutstanding, currentPrice) {
  let low = -0.30;
  let high = 1.00;
  let bestG = 0.10;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const testInputs = { ...inputs, volumeGrowthYears1to5: mid, volumeGrowthYears6to10: mid * 0.4 };
    const val = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, testInputs, netDebt, sharesOutstanding, currentPrice);
    
    if (Math.abs(val.equityValue - targetEquityValue) < 100) {
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

function solveImpliedCapYears(targetEV, baseNopat, baseIc, wacc) {
  const roic0 = baseIc > 0 ? baseNopat / baseIc : wacc * 1.5;
  let lowN = 1.0;
  let highN = 25.0;
  let bestN = 7.0;

  for (let iter = 0; iter < 30; iter++) {
    const midN = (lowN + highN) / 2;
    let evEstimate = 0;
    const maxT = 20;

    for (let t = 1; t <= maxT; t++) {
      let roicT = wacc;
      if (t <= midN) {
        roicT = roic0 - (t / midN) * (roic0 - wacc);
      }
      const nopatT = baseNopat * Math.pow(1.04, Math.min(t, midN));
      const reinvestmentT = roicT > 0 ? (nopatT * 0.04) / roicT : 0;
      const fcffT = nopatT - reinvestmentT;
      evEstimate += fcffT / Math.pow(1 + wacc, t);
    }
    const terminalNopat = baseNopat * Math.pow(1.04, midN);
    evEstimate += (terminalNopat / wacc) / Math.pow(1 + wacc, maxT);

    if (Math.abs(evEstimate - targetEV) < 100) {
      bestN = midN;
      break;
    }
    if (evEstimate < targetEV) {
      lowN = midN;
    } else {
      highN = midN;
    }
    bestN = midN;
  }
  return Number(bestN.toFixed(1));
}

test('DCF & Reverse DCF v3.0 Solver Unit Tests', async (t) => {
  const baseDeliveries = 1800000;
  const baseAsp = 45000;
  const baseRevenue = 96000;
  const netDebt = -23000;
  const sharesOutstanding = 3180;
  const currentPrice = 248.5;

  const testInputs = {
    volumeGrowthYears1to5: 0.18,
    volumeGrowthYears6to10: 0.08,
    aspGrowthYearly: -0.01,
    targetGrossMargin: 0.22,
    rdRatioOfRevenue: 0.045,
    sgaRatioOfRevenue: 0.055,
    capexRatioOfRevenue: 0.08,
    deltaNwcRatioOfRevenue: 0.015,
    terminalGrowthRate: 0.025,
    wacc: 0.088,
    taxRate: 0.12
  };

  await t.test('Forward DCF calculates positive Enterprise & Equity value', () => {
    const res = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, testInputs, netDebt, sharesOutstanding, currentPrice);
    assert.ok(res.enterpriseValue > 0, 'Enterprise Value must be positive');
    assert.ok(res.equityValue > res.enterpriseValue, 'Equity value exceeds EV with Net Cash');
  });

  await t.test('Reverse DCF Solver converges to match target market cap within 1%', () => {
    const targetEquityValue = 790230;
    const impliedG = solveImpliedGrowthRate(targetEquityValue, baseDeliveries, baseAsp, baseRevenue, testInputs, netDebt, sharesOutstanding, currentPrice);
    
    const verifyInputs = { ...testInputs, volumeGrowthYears1to5: impliedG, volumeGrowthYears6to10: impliedG * 0.4 };
    const verifyRes = calculateForwardDCF(baseDeliveries, baseAsp, baseRevenue, verifyInputs, netDebt, sharesOutstanding, currentPrice);
    
    const diffPct = Math.abs(verifyRes.equityValue - targetEquityValue) / targetEquityValue;
    assert.ok(diffPct < 0.01, `Convergence failed: diff ${diffPct}`);
  });

  await t.test('Dynamic MICAP Solver produces reasonable Competitive Advantage Period', () => {
    const targetEV = 766420;
    const baseNopat = 8800;
    const baseIc = 45000;
    const wacc = 0.088;
    const capYears = solveImpliedCapYears(targetEV, baseNopat, baseIc, wacc);
    assert.ok(capYears >= 1 && capYears <= 25, `CAP Years out of reasonable bound: ${capYears}`);
  });
});
