// Simulated stock prices — used when dataMode === "mock" (market closed or offline)
// Prices fluctuate randomly every 3s in the components that use this.

const BASE_PRICES = {
  RELIANCE:   2847.35, TCS:        3921.50, HDFCBANK:   1678.90,
  INFY:       1542.75, ICICIBANK:  1089.40, BHARTIARTL: 1423.80,
  WIPRO:       487.25, SBIN:        812.60, TATAMOTORS:  924.30,
  MARUTI:    12456.00, BAJFINANCE: 7234.50, SUNPHARMA:  1567.80,
  LT:         3456.70, ASIANPAINT: 2789.40, NESTLEIND:  2234.60,
};

const SECTORS = {
  RELIANCE: "Energy", TCS: "IT", HDFCBANK: "Banking", INFY: "IT",
  ICICIBANK: "Banking", BHARTIARTL: "Telecom", WIPRO: "IT", SBIN: "Banking",
  TATAMOTORS: "Auto", MARUTI: "Auto", BAJFINANCE: "NBFC",
  SUNPHARMA: "Pharma", LT: "Infrastructure", ASIANPAINT: "Consumer", NESTLEIND: "FMCG",
};

const NAMES = {
  RELIANCE: "Reliance Industries Ltd", TCS: "Tata Consultancy Services",
  HDFCBANK: "HDFC Bank Ltd", INFY: "Infosys Ltd", ICICIBANK: "ICICI Bank Ltd",
  BHARTIARTL: "Bharti Airtel Ltd", WIPRO: "Wipro Ltd", SBIN: "State Bank of India",
  TATAMOTORS: "Tata Motors Ltd", MARUTI: "Maruti Suzuki India",
  BAJFINANCE: "Bajaj Finance Ltd", SUNPHARMA: "Sun Pharmaceutical",
  LT: "Larsen & Toubro Ltd", ASIANPAINT: "Asian Paints Ltd", NESTLEIND: "Nestle India Ltd",
};

// In-memory state so prices persist across component re-renders in same session
let _prices = { ...BASE_PRICES };
let _changes = {};
Object.keys(BASE_PRICES).forEach((sym) => { _changes[sym] = (Math.random() - 0.48) * 2; });

export function getMockStocks() {
  // Tick all prices slightly
  Object.keys(_prices).forEach((sym) => {
    const drift = (Math.random() - 0.49) * _prices[sym] * 0.001;
    _prices[sym] = parseFloat(Math.max(_prices[sym] + drift, BASE_PRICES[sym] * 0.7).toFixed(2));
    _changes[sym] = parseFloat((_prices[sym] - BASE_PRICES[sym]).toFixed(2));
  });

  return Object.keys(BASE_PRICES).map((sym) => ({
    symbol:        sym,
    name:          NAMES[sym],
    price:         _prices[sym],
    change:        _changes[sym],
    changePercent: parseFloat(((_changes[sym] / BASE_PRICES[sym]) * 100).toFixed(2)),
    volume:        (Math.random() * 10 + 1).toFixed(1) + "M",
    high:          parseFloat((_prices[sym] * 1.005).toFixed(2)),
    low:           parseFloat((_prices[sym] * 0.995).toFixed(2)),
    open:          parseFloat((_prices[sym] * 1.001).toFixed(2)),
    prevClose:     BASE_PRICES[sym],
    sector:        SECTORS[sym],
    marketCap:     "N/A",
  }));
}

export function getMockHistory(symbol, period) {
  const days = period === "1W" ? 7 : period === "1M" ? 30 : period === "3M" ? 90 : 365;
  const base  = BASE_PRICES[symbol] || 1000;
  let price   = base * 0.85;
  const now   = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    const change = (Math.random() - 0.47) * price * 0.02;
    price = Math.max(price + change, base * 0.5);
    return {
      date:  date.toISOString().split("T")[0],
      open:  parseFloat((price * 0.999).toFixed(2)),
      high:  parseFloat((price * 1.005).toFixed(2)),
      low:   parseFloat((price * 0.995).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      value: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000 + 500000),
    };
  });
}
