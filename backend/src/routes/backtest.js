import express from "express";
import yahooFinance from "yahoo-finance2";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const toYF = (sym) => sym.startsWith("^") ? sym : `${sym}.NS`;

// ─────────────────────────────────────────────────────────────────
// Technical Indicator Helpers
// ─────────────────────────────────────────────────────────────────

const calculateSMA = (closes, period) => {
  if (closes.length < period) return null;
  const sum = closes.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
};

const calculateEMA = (closes, period) => {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
};

const calculateRSI = (closes, period = 14) => {
  if (closes.length < period + 1) return null;
  
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return avgGain > 0 ? 100 : 0;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (closes) => {
  if (closes.length < 26) return null;
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12 - ema26;
  
  // Signal line is 9-day EMA of MACD
  // Simplified: use recent MACD values
  let signalLine = macdLine;
  if (closes.length >= 35) {
    const k = 2 / (9 + 1);
    signalLine = macdLine * k + (ema12 - ema26) * (1 - k);
  }
  
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
};

const calculateBollingerBands = (closes, period = 20, stdDev = 2) => {
  if (closes.length < period) return null;
  
  const sma = calculateSMA(closes, period);
  const recentCloses = closes.slice(-period);
  const variance = recentCloses.reduce((sum, c) => sum + Math.pow(c - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    middle: sma,
    upper: sma + std * stdDev,
    lower: sma - std * stdDev,
  };
};

// ─────────────────────────────────────────────────────────────────
// Strategy Implementations: Return buy/sell signals array
// ─────────────────────────────────────────────────────────────────

const strategySMA = (candles) => {
  const signals = []; // { index, type: "BUY"|"SELL", price }
  const closes = candles.map((c) => c.close);
  
  for (let i = 50; i < closes.length; i++) {
    const fastSMA = calculateSMA(closes.slice(0, i + 1), 20);
    const slowSMA = calculateSMA(closes.slice(0, i + 1), 50);
    const prevFastSMA = calculateSMA(closes.slice(0, i), 20);
    const prevSlowSMA = calculateSMA(closes.slice(0, i), 50);
    
    if (!fastSMA || !slowSMA || !prevFastSMA || !prevSlowSMA) continue;
    
    // Golden cross: buy
    if (prevFastSMA <= prevSlowSMA && fastSMA > slowSMA) {
      signals.push({ index: i, type: "BUY", price: candles[i].close });
    }
    // Death cross: sell
    else if (prevFastSMA >= prevSlowSMA && fastSMA < slowSMA) {
      signals.push({ index: i, type: "SELL", price: candles[i].close });
    }
  }
  
  return signals;
};

const strategyEMA = (candles) => {
  const signals = [];
  const closes = candles.map((c) => c.close);
  
  for (let i = 26; i < closes.length; i++) {
    const fastEMA = calculateEMA(closes.slice(0, i + 1), 12);
    const slowEMA = calculateEMA(closes.slice(0, i + 1), 26);
    const prevFastEMA = calculateEMA(closes.slice(0, i), 12);
    const prevSlowEMA = calculateEMA(closes.slice(0, i), 26);
    
    if (!fastEMA || !slowEMA || !prevFastEMA || !prevSlowEMA) continue;
    
    if (prevFastEMA <= prevSlowEMA && fastEMA > slowEMA) {
      signals.push({ index: i, type: "BUY", price: candles[i].close });
    } else if (prevFastEMA >= prevSlowEMA && fastEMA < slowEMA) {
      signals.push({ index: i, type: "SELL", price: candles[i].close });
    }
  }
  
  return signals;
};

const strategyRSI = (candles) => {
  const signals = [];
  const closes = candles.map((c) => c.close);
  
  for (let i = 15; i < closes.length; i++) {
    const rsi = calculateRSI(closes.slice(0, i + 1), 14);
    const prevRSI = calculateRSI(closes.slice(0, i), 14);
    
    if (rsi === null || prevRSI === null) continue;
    
    // Oversold bounce: buy when RSI crosses above 30
    if (prevRSI <= 30 && rsi > 30) {
      signals.push({ index: i, type: "BUY", price: candles[i].close });
    }
    // Overbought peak: sell when RSI crosses below 70
    else if (prevRSI >= 70 && rsi < 70) {
      signals.push({ index: i, type: "SELL", price: candles[i].close });
    }
  }
  
  return signals;
};

const strategyMACD = (candles) => {
  const signals = [];
  const closes = candles.map((c) => c.close);
  
  for (let i = 35; i < closes.length; i++) {
    const macd = calculateMACD(closes.slice(0, i + 1));
    const prevMACD = calculateMACD(closes.slice(0, i));
    
    if (!macd || !prevMACD) continue;
    
    // MACD crosses above signal line: buy
    if (prevMACD.macd <= prevMACD.signal && macd.macd > macd.signal) {
      signals.push({ index: i, type: "BUY", price: candles[i].close });
    }
    // MACD crosses below signal line: sell
    else if (prevMACD.macd >= prevMACD.signal && macd.macd < macd.signal) {
      signals.push({ index: i, type: "SELL", price: candles[i].close });
    }
  }
  
  return signals;
};

const strategyBollinger = (candles) => {
  const signals = [];
  const closes = candles.map((c) => c.close);
  
  for (let i = 20; i < closes.length; i++) {
    const bands = calculateBollingerBands(closes.slice(0, i + 1), 20, 2);
    if (!bands) continue;
    
    const price = candles[i].close;
    
    // Touch lower band: buy signal
    if (price <= bands.lower) {
      signals.push({ index: i, type: "BUY", price });
    }
    // Touch upper band or middle: sell signal
    else if (price >= bands.upper) {
      signals.push({ index: i, type: "SELL", price });
    }
  }
  
  return signals;
};

const strategySupport = (candles) => {
  // Simplified S&R: identify local highs/lows and trade breakouts
  const signals = [];
  const closes = candles.map((c) => c.close);
  const window = 10; // lookback window for local extrema
  
  // Identify swing points
  const swingHigh = [], swingLow = [];
  for (let i = window; i < closes.length - window; i++) {
    const isHigh = closes[i] > closes[i - 1] && closes[i] > closes[i + 1];
    const isLow = closes[i] < closes[i - 1] && closes[i] < closes[i + 1];
    
    if (isHigh) swingHigh.push({ index: i, price: closes[i] });
    if (isLow) swingLow.push({ index: i, price: closes[i] });
  }
  
  // Trade breakouts of recent S&R
  for (let i = window + 5; i < closes.length; i++) {
    const recentHigh = Math.max(...swingHigh.filter((h) => h.index < i).slice(-3).map((h) => h.price), 0);
    const recentLow = Math.min(...swingLow.filter((l) => l.index < i).slice(-3).map((l) => l.price), Infinity);
    
    if (recentHigh > 0 && closes[i] > recentHigh * 1.01) {
      signals.push({ index: i, type: "BUY", price: candles[i].close });
    } else if (recentLow < Infinity && closes[i] < recentLow * 0.99) {
      signals.push({ index: i, type: "SELL", price: candles[i].close });
    }
  }
  
  return signals;
};

// ─────────────────────────────────────────────────────────────────
// Trade Simulation & Metrics
// ─────────────────────────────────────────────────────────────────

const simulateTrades = (signals, initialCapital, candles) => {
  const trades = [];
  let cash = initialCapital;
  let shares = 0;
  let position = null; // { entryPrice, entryIndex, quantity }
  
  const portfolio = []; // For drawdown calculation
  portfolio.push(initialCapital);
  
  for (const signal of signals) {
    const candle = candles[signal.index];
    
    if (signal.type === "BUY" && !position && cash > 0) {
      // Buy with all available cash (risk per trade)
      const quantity = Math.floor(cash * 0.95 / signal.price); // Use 95% of cash
      if (quantity > 0) {
        shares += quantity;
        cash -= quantity * signal.price;
        position = {
          entryPrice: signal.price,
          entryIndex: signal.index,
          quantity,
        };
      }
    } else if (signal.type === "SELL" && position) {
      // Sell entire position
      const proceeds = position.quantity * signal.price;
      cash += proceeds;
      
      const pnl = proceeds - (position.quantity * position.entryPrice);
      trades.push({
        entryPrice: position.entryPrice,
        entryIndex: position.entryIndex,
        exitPrice: signal.price,
        exitIndex: signal.index,
        quantity: position.quantity,
        pnl,
        pnlPercent: (pnl / (position.quantity * position.entryPrice)) * 100,
      });
      
      position = null;
      shares = 0;
    }
    
    // Calculate portfolio value at each signal
    const portfolioValue = cash + shares * signal.price;
    portfolio.push(portfolioValue);
  }
  
  // Close any open position at end
  if (position && candles.length > 0) {
    const lastClose = candles[candles.length - 1].close;
    const proceeds = position.quantity * lastClose;
    cash += proceeds;
    
    const pnl = proceeds - (position.quantity * position.entryPrice);
    trades.push({
      entryPrice: position.entryPrice,
      entryIndex: position.entryIndex,
      exitPrice: lastClose,
      exitIndex: candles.length - 1,
      quantity: position.quantity,
      pnl,
      pnlPercent: (pnl / (position.quantity * position.entryPrice)) * 100,
    });
  }
  
  // Final portfolio value
  const finalValue = cash + shares * (candles[candles.length - 1]?.close || 0);
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
  
  // Win rate
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  
  // Max drawdown
  let peak = portfolio[0];
  let maxDrawdown = 0;
  for (const value of portfolio) {
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // Sharpe ratio (simplified: assuming 0% risk-free rate, daily returns)
  const returns = [];
  for (let i = 1; i < portfolio.length; i++) {
    returns.push((portfolio[i] - portfolio[i - 1]) / portfolio[i - 1]);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length || 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  
  return {
    trades,
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
  };
};

// ─────────────────────────────────────────────────────────────────
// Main POST /api/backtest endpoint
// ─────────────────────────────────────────────────────────────────

router.post("/", protect, async (req, res) => {
  const { symbol, strategy, startDate, endDate, capital = 100000 } = req.body;
  
  if (!symbol || !strategy) {
    return res.status(400).json({ message: "symbol and strategy are required" });
  }
  
  const validStrategies = ["SMA", "EMA", "RSI", "MACD", "Bollinger", "S&R"];
  if (!validStrategies.includes(strategy)) {
    return res.status(400).json({ message: `Invalid strategy. Choose from: ${validStrategies.join(", ")}` });
  }
  
  try {
    const sym = symbol.toUpperCase();
    
    // Fetch historical data from Yahoo Finance
    const result = await yahooFinance.historical(toYF(sym), {
      period1: new Date(startDate || "2023-01-01"),
      period2: new Date(endDate || new Date()),
      interval: "1d",
    });
    
    if (!result || result.length === 0) {
      return res.status(400).json({ message: `No historical data found for ${sym}` });
    }
    
    // Convert to candle format
    const candles = result.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
    
    // Run selected strategy
    let signals = [];
    switch (strategy) {
      case "SMA":
        signals = strategySMA(candles);
        break;
      case "EMA":
        signals = strategyEMA(candles);
        break;
      case "RSI":
        signals = strategyRSI(candles);
        break;
      case "MACD":
        signals = strategyMACD(candles);
        break;
      case "Bollinger":
        signals = strategyBollinger(candles);
        break;
      case "S&R":
        signals = strategySupport(candles);
        break;
    }
    
    // Simulate trades
    const metrics = simulateTrades(signals, capital, candles);
    
    res.json({
      symbol: sym,
      strategy,
      period: `${startDate || "2023-01-01"} to ${endDate || new Date().toISOString().split("T")[0]}`,
      candles: candles.length,
      signals: signals.length,
      capital,
      ...metrics,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
