// Only chart/generator helpers remain here.
// All user, trade, and stock data now comes from the backend API.

export const generateCandleData = (days = 90, basePrice = 1000) => {
  const data = [];
  let price = basePrice;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const open   = price;
    const change = (Math.random() - 0.48) * price * 0.025;
    const close  = Math.max(price + change, price * 0.85);
    const high   = Math.max(open, close) + Math.random() * price * 0.01;
    const low    = Math.min(open, close) - Math.random() * price * 0.01;
    const volume = Math.floor(Math.random() * 5000000 + 1000000);
    data.push({
      date: date.toISOString().split("T")[0],
      open:   parseFloat(open.toFixed(2)),
      high:   parseFloat(high.toFixed(2)),
      low:    parseFloat(low.toFixed(2)),
      close:  parseFloat(close.toFixed(2)),
      volume, value: parseFloat(close.toFixed(2)),
    });
    price = close;
  }
  return data;
};

export const generatePortfolioHistory = (days = 30, startValue = 1000000) => {
  const data = [];
  let value = startValue;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.45) * value * 0.015;
    data.push({ date: date.toISOString().split("T")[0], value: parseFloat(value.toFixed(2)) });
  }
  return data;
};

export const BACKTESTING_STRATEGIES = [
  "Simple Moving Average (SMA) Crossover",
  "Exponential Moving Average (EMA) Crossover",
  "RSI Overbought/Oversold",
  "MACD Signal Line Crossover",
  "Bollinger Band Breakout",
  "Support & Resistance Breakout",
];

export const generateBacktestResult = (strategy, symbol, startDate, endDate, capital) => {
  const trades   = Math.floor(Math.random() * 40 + 10);
  const winRate  = (Math.random() * 30 + 45).toFixed(1);
  const totalReturn  = (Math.random() * 60 - 15).toFixed(2);
  const maxDrawdown  = (Math.random() * 20 + 5).toFixed(2);
  const sharpe       = (Math.random() * 1.5 + 0.3).toFixed(2);
  const finalCapital = capital * (1 + parseFloat(totalReturn) / 100);
  const equityCurve  = generatePortfolioHistory(60, capital);
  const tradeLog = Array.from({ length: trades }, (_, i) => {
    const isWin = Math.random() > (1 - parseFloat(winRate) / 100);
    const pnl   = isWin ? (Math.random() * 8000 + 500) : -(Math.random() * 5000 + 200);
    return {
      id: i + 1,
      type: Math.random() > 0.5 ? "BUY→SELL" : "SHORT→COVER",
      entryPrice: (Math.random() * 2000 + 500).toFixed(2),
      exitPrice:  (Math.random() * 2000 + 500).toFixed(2),
      pnl: parseFloat(pnl.toFixed(2)),
      result: isWin ? "WIN" : "LOSS",
    };
  });
  return { strategy, symbol, trades, winRate, totalReturn, maxDrawdown, sharpe, finalCapital, equityCurve, tradeLog };
};
