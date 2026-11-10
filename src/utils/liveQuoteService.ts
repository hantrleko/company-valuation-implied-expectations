export interface LiveQuoteItem {
  companyId: string;
  ticker: string;
  price: number;
  changePercent: number;
  timestamp: string;
  source: 'live' | 'snapshot';
}

// Curated latest market prices (2025/2026 current market valuation levels)
export const LATEST_MARKET_SNAPSHOT: Record<string, { price: number; changePercent: number }> = {
  tsla: { price: 285.50, changePercent: 2.15 },
  byd:  { price: 315.20, changePercent: 1.40 },
  li:   { price: 28.60,  changePercent: 3.10 },
  nio:  { price: 5.25,   changePercent: 0.95 },
  xpev: { price: 15.80,  changePercent: 4.25 },
  nvda: { price: 178.50, changePercent: 1.85 },
  tsm:  { price: 215.00, changePercent: 1.60 },
  amd:  { price: 168.40, changePercent: -0.65 },
  avgo: { price: 212.50, changePercent: 2.20 },
  asml: { price: 785.00, changePercent: 1.10 }
};

// Historical 10-K / Annual Filing Release Benchmark Prices
export const FILING_BENCHMARK_PRICES: Record<string, number> = {
  tsla: 248.50,
  byd:  285.20,
  li:   24.80,
  nio:  4.85,
  xpev: 12.30,
  nvda: 138.50,
  tsm:  195.00,
  amd:  156.20,
  avgo: 178.40,
  asml: 712.00
};

// Map companyId to Tencent Finance symbols
const TENCENT_SYMBOL_MAP: Record<string, string> = {
  tsla: 'usTSLA',
  byd:  'sz002594',
  li:   'usLI',
  nio:  'usNIO',
  xpev: 'usXPEV',
  nvda: 'usNVDA',
  tsm:  'usTSM',
  amd:  'usAMD',
  avgo: 'usAVGO',
  asml: 'usASML'
};

/**
 * Fetch live stock quotes in browser using dynamic script tag JSONP or fallback
 */
export async function fetchLiveQuotes(): Promise<Record<string, LiveQuoteItem>> {
  const result: Record<string, LiveQuoteItem> = {};
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // Default initialize with latest snapshot
  Object.keys(LATEST_MARKET_SNAPSHOT).forEach((cid) => {
    const snap = LATEST_MARKET_SNAPSHOT[cid];
    result[cid] = {
      companyId: cid,
      ticker: cid.toUpperCase(),
      price: snap.price,
      changePercent: snap.changePercent,
      timestamp: timeStr,
      source: 'snapshot'
    };
  });

  if (typeof window === 'undefined') {
    return result;
  }

  // Attempt in-browser dynamic script JSONP fetch
  return new Promise((resolve) => {
    try {
      const scriptId = 'tencent_qt_quote_script';
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }

      const script = document.createElement('script');
      script.id = scriptId;
      const symbols = Object.values(TENCENT_SYMBOL_MAP).join(',');
      script.src = `https://qt.gtimg.cn/q=${symbols}`;

      const timeout = setTimeout(() => {
        resolve(result); // Fallback on timeout
      }, 2500);

      script.onload = () => {
        clearTimeout(timeout);
        try {
          const w = window as any;
          Object.entries(TENCENT_SYMBOL_MAP).forEach(([cid, sym]) => {
            const varName = `v_${sym}`;
            const rawStr = w[varName];
            if (rawStr && typeof rawStr === 'string') {
              const parts = rawStr.split('~');
              if (parts.length > 5) {
                const livePrice = parseFloat(parts[3]);
                const changePct = parseFloat(parts[32] || parts[5] || '0');
                if (!isNaN(livePrice) && livePrice > 0) {
                  result[cid] = {
                    companyId: cid,
                    ticker: cid.toUpperCase(),
                    price: Number(livePrice.toFixed(2)),
                    changePercent: Number((changePct || 0).toFixed(2)),
                    timestamp: timeStr,
                    source: 'live'
                  };
                }
              }
            }
          });
        } catch {
          // ignore parsing error and keep snapshot
        }
        resolve(result);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        resolve(result);
      };

      document.body.appendChild(script);
    } catch {
      resolve(result);
    }
  });
}
