import { QuarterData } from '../../types/financial';
import { createAudited } from './helper';

// Helper to construct a QuarterData object cleanly with full disclosure metadata
export function buildQuarter(
  period: string,
  periodLabel: string,
  deliveries: number,
  asp: number,
  unitCost: number,
  autoRev: number,
  otherRev: number,
  totalRev: number,
  cogs: number,
  autoGrossProfit: number,
  totalGrossProfit: number,
  autoGrossMargin: number,
  totalGrossMargin: number,
  rd: number,
  sga: number,
  ebit: number,
  netIncome: number,
  ocf: number,
  capex: number,
  fcf: number,
  da: number,
  ar: number,
  inv: number,
  ap: number,
  cash: number,
  debt: number,
  filingType: '10-K' | '10-Q' | '20-F' | '6-K' | 'A股年度报告' | 'A股半年度报告' | 'A股季度报告' | '港股业绩公告',
  filingDate: string,
  accessionNumber: string,
  url: string,
  currency: 'USD' | 'RMB' | 'EUR' | 'NTD'
): QuarterData {
  const opex = rd + sga;
  const opMargin = totalRev > 0 ? Number(((ebit / totalRev) * 100).toFixed(2)) : 0;

  return {
    period,
    periodLabel,
    isAnnual: period.includes('FY'),
    deliveries: createAudited(
      deliveries,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Management\'s Discussion & Analysis / 产销经营数据',
      'Vehicle deliveries (units) / 新能源汽车产销量',
      currency,
      `Period ${periodLabel} vehicle deliveries: ${deliveries.toLocaleString()} units.`
    ),
    asp: createAudited(
      asp,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Operating Metrics / 经营分项测算',
      'Derived ASP per vehicle (ex-credits) / 单车销售均价',
      currency,
      `Calculated Automotive ASP: ${currency} ${asp.toLocaleString()} per vehicle.`
    ),
    unitCost: createAudited(
      unitCost,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Operating Metrics / 生产成本拆解',
      'Unit Cost of Sales / 单车制造与BOM成本',
      currency,
      `Calculated Unit Cost: ${currency} ${unitCost.toLocaleString()} per vehicle.`
    ),
    automotiveRevenue: createAudited(
      autoRev,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Statement of Operations / 营业收入分项表',
      'Automotive Revenues / 汽车业务收入',
      currency,
      `Automotive revenue: ${autoRev.toLocaleString()} M ${currency}.`
    ),
    otherRevenue: createAudited(
      otherRev,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Statement of Operations / 其他业务分项',
      'Energy / Services / Other revenue / 其他业务收入',
      currency,
      `Non-automotive revenue: ${otherRev.toLocaleString()} M ${currency}.`
    ),
    totalRevenue: createAudited(
      totalRev,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 合并利润表',
      'Total revenues / 营业总收入',
      currency,
      `Total revenues reported: ${totalRev.toLocaleString()} M ${currency}.`
    ),
    costOfGoodsSold: createAudited(
      cogs,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 合并利润表',
      'Total cost of revenues / 营业总成本',
      currency,
      `Cost of revenues: ${cogs.toLocaleString()} M ${currency}.`
    ),
    automotiveGrossProfit: createAudited(
      autoGrossProfit,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Segment Information / 分部毛利披露',
      'Automotive Gross Profit / 汽车分部毛利',
      currency,
      `Automotive gross profit: ${autoGrossProfit.toLocaleString()} M ${currency}.`
    ),
    totalGrossProfit: createAudited(
      totalGrossProfit,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 综合毛利',
      'Gross profit / 毛利总额',
      currency,
      `Gross profit reported: ${totalGrossProfit.toLocaleString()} M ${currency}.`
    ),
    automotiveGrossMargin: createAudited(
      autoGrossMargin,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Financial Highlights / 财务分析比率',
      'Automotive gross margin % / 汽车销售毛利率',
      currency,
      `Vehicle gross margin: ${autoGrossMargin.toFixed(2)}%.`
    ),
    totalGrossMargin: createAudited(
      totalGrossMargin,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Financial Highlights / 综合毛利率',
      'Total gross margin % / 综合销售毛利率',
      currency,
      `Total gross margin: ${totalGrossMargin.toFixed(2)}%.`
    ),
    rdExpense: createAudited(
      rd,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 研发费用',
      'Research and development expense / 研发费用',
      currency,
      `R&D expense: ${rd.toLocaleString()} M ${currency}.`
    ),
    sgaExpense: createAudited(
      sga,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 销管费用',
      'Selling, general and administrative / 销售与行政费用',
      currency,
      `SG&A expense: ${sga.toLocaleString()} M ${currency}.`
    ),
    operatingExpenses: createAudited(
      opex,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 期间费用总额',
      'Total operating expenses / 经营费用总计',
      currency,
      `Operating expenses: ${opex.toLocaleString()} M ${currency}.`
    ),
    operatingProfit: createAudited(
      ebit,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 营业利润',
      'Operating income (EBIT) / 营业利润',
      currency,
      `Operating income: ${ebit.toLocaleString()} M ${currency}.`
    ),
    operatingMargin: createAudited(
      opMargin,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Financial Highlights / 营业利润率',
      'Operating margin % / 营业利润率',
      currency,
      `Operating margin: ${opMargin.toFixed(2)}%.`
    ),
    netIncome: createAudited(
      netIncome,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Operations / 净利润',
      'Net income attributable to common shareholders / 归母净利润',
      currency,
      `Net income: ${netIncome.toLocaleString()} M ${currency}.`
    ),
    operatingCashFlow: createAudited(
      ocf,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Cash Flows / 现金流量表',
      'Net cash provided by operating activities / 经营活动产生的现金流量净额',
      currency,
      `Operating cash flow: ${ocf.toLocaleString()} M ${currency}.`
    ),
    capex: createAudited(
      capex,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Cash Flows / 投资现金流',
      'Capital expenditures / 资本性支出 (购建固定资产等)',
      currency,
      `Capital expenditures: ${capex.toLocaleString()} M ${currency}.`
    ),
    freeCashFlow: createAudited(
      fcf,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Non-GAAP Financial Measures / 自由现金流披露',
      'Free cash flow (OCF - CapEx) / 自由现金流',
      currency,
      `Free cash flow: ${fcf.toLocaleString()} M ${currency}.`
    ),
    depreciationAmortization: createAudited(
      da,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Statement of Cash Flows / 折旧摊销',
      'Depreciation and amortization / 折旧与摊销',
      currency,
      `Depreciation & amortization: ${da.toLocaleString()} M ${currency}.`
    ),
    accountsReceivable: createAudited(
      ar,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Balance Sheets / 应收账款',
      'Accounts receivable, net / 应收账款与票据',
      currency,
      `Accounts receivable: ${ar.toLocaleString()} M ${currency}.`
    ),
    inventory: createAudited(
      inv,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Balance Sheets / 存货',
      'Inventories / 存货余额',
      currency,
      `Inventories: ${inv.toLocaleString()} M ${currency}.`
    ),
    accountsPayable: createAudited(
      ap,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Balance Sheets / 应付账款',
      'Accounts payable / 应付账款与应付票据',
      currency,
      `Accounts payable: ${ap.toLocaleString()} M ${currency}.`
    ),
    cashAndEquivalents: createAudited(
      cash,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Balance Sheets / 货币资金',
      'Cash and cash equivalents & ST investments / 现金及现金等价物及短期投资',
      currency,
      `Cash and equivalents: ${cash.toLocaleString()} M ${currency}.`
    ),
    totalDebt: createAudited(
      debt,
      filingType,
      filingDate,
      accessionNumber,
      url,
      'Consolidated Balance Sheets / 有息负债',
      'Total debt and finance leases / 短期借款及长期负债总额',
      currency,
      `Total debt: ${debt.toLocaleString()} M ${currency}.`
    )
  };
}
