import { AuditedMetric } from '../../types/financial';

export function createAudited<T>(
  value: T,
  filingType: '10-K' | '10-Q' | '20-F' | '6-K' | 'A股年度报告' | 'A股半年度报告' | 'A股季度报告' | '港股业绩公告',
  filingDate: string,
  accessionNumber: string,
  url: string,
  section: string,
  lineItem: string,
  currency: 'USD' | 'RMB' | 'EUR' | 'NTD',
  quote: string
): AuditedMetric<T> {
  return {
    value,
    disclosure: {
      filingType,
      filingDate,
      accessionNumber,
      secOrCninfoUrl: url,
      section,
      lineItem,
      reportedCurrency: currency,
      quote,
      verified: true
    }
  };
}
