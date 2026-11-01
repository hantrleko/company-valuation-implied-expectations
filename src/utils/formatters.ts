export function formatNumber(val: number, decimals: number = 0): string {
  if (isNaN(val) || val === null || val === undefined) return '-';
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatCurrency(val: number, symbol: string = '¥', decimals: number = 0): string {
  if (isNaN(val) || val === null || val === undefined) return '-';
  return `${symbol}${formatNumber(val, decimals)}`;
}

export function formatPercent(val: number, decimals: number = 1): string {
  if (isNaN(val) || val === null || val === undefined) return '-';
  return `${(val * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(val: number, decimals: number = 1): string {
  if (isNaN(val) || val === null || val === undefined) return '-';
  return `${val.toFixed(decimals)}%`;
}

export function formatCompact(val: number, symbol: string = ''): string {
  if (isNaN(val) || val === null || val === undefined) return '-';
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (absVal >= 1000000) {
    return `${sign}${symbol}${(absVal / 1000000).toFixed(2)}M`;
  }
  if (absVal >= 1000) {
    return `${sign}${symbol}${(absVal / 1000).toFixed(1)}k`;
  }
  return `${sign}${symbol}${absVal.toFixed(0)}`;
}
