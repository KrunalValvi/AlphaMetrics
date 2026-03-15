import express from "express";
import yahooFinance from "yahoo-finance2";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const NSE_SYMBOLS = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK",
  "BHARTIARTL","WIPRO","SBIN","TATAMOTORS","MARUTI",
  "BAJFINANCE","SUNPHARMA","LT","ASIANPAINT","NESTLEIND",
];
const INDICES = ["^NSEI","^BSESN","^NSEBANK"];

const toYF = (sym) => sym.startsWith("^") ? sym : `${sym}.NS`;

let stockCache   = { data: [], updatedAt: 0 };
let indicesCache = { data: [], updatedAt: 0 };

const SECTOR_MAP = {
  RELIANCE:"Energy",TCS:"IT",HDFCBANK:"Banking",INFY:"IT",ICICIBANK:"Banking",
  BHARTIARTL:"Telecom",WIPRO:"IT",SBIN:"Banking",TATAMOTORS:"Auto",MARUTI:"Auto",
  BAJFINANCE:"NBFC",SUNPHARMA:"Pharma",LT:"Infrastructure",ASIANPAINT:"Consumer",NESTLEIND:"FMCG",
};
const INDEX_NAMES = { "^NSEI":"NIFTY 50","^BSESN":"SENSEX","^NSEBANK":"NIFTY BANK" };

function fmtCap(v) {
  if (v >= 1e12) return (v/1e12).toFixed(1)+"T";
  if (v >= 1e9)  return (v/1e9).toFixed(1)+"B";
  return v?.toString() || "N/A";
}

function quoteToStock(q, sym) {
  return {
    symbol: sym,
    name: q.longName || q.shortName || sym,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: parseFloat((q.regularMarketChangePercent ?? 0).toFixed(2)),
    volume: q.regularMarketVolume ? (q.regularMarketVolume/1e6).toFixed(1)+"M" : "N/A",
    high: q.regularMarketDayHigh ?? 0,
    low: q.regularMarketDayLow ?? 0,
    open: q.regularMarketOpen ?? 0,
    prevClose: q.regularMarketPreviousClose ?? 0,
    week52High: q.fiftyTwoWeekHigh ?? 0,
    week52Low:  q.fiftyTwoWeekLow  ?? 0,
    pe: q.trailingPE ? parseFloat(q.trailingPE.toFixed(2)) : null,
    eps: q.epsTrailingTwelveMonths ? parseFloat(q.epsTrailingTwelveMonths.toFixed(2)) : null,
    sector: q.sector || SECTOR_MAP[sym] || "Other",
    marketCap: q.marketCap ? fmtCap(q.marketCap) : "N/A",
    avgVolume: q.averageDailyVolume3Month ? (q.averageDailyVolume3Month/1e6).toFixed(1)+"M" : "N/A",
    currency: q.currency || "INR",
    exchange: q.exchange || "NSE",
  };
}

async function fetchAll(symbols) {
  const results = await Promise.allSettled(
    symbols.map((s) => yahooFinance.quote(toYF(s)).then((q) => quoteToStock(q, s)))
  );
  return results.filter((r) => r.status==="fulfilled").map((r) => r.value);
}

// GET /api/stocks — all NSE quotes (60s cache)
router.get("/", protect, async (req, res) => {
  try {
    if (Date.now() - stockCache.updatedAt < 60_000 && stockCache.data.length > 0)
      return res.json(stockCache.data);
    const data = await fetchAll(NSE_SYMBOLS);
    stockCache = { data, updatedAt: Date.now() };
    res.json(data);
  } catch (err) {
    res.status(502).json({ message: "Failed to fetch stocks", error: err.message });
  }
});

// GET /api/stocks/indices — NIFTY, SENSEX, NIFTY BANK
router.get("/indices", protect, async (req, res) => {
  try {
    if (Date.now() - indicesCache.updatedAt < 60_000 && indicesCache.data.length > 0)
      return res.json(indicesCache.data);
    const results = await Promise.allSettled(
      INDICES.map((s) => yahooFinance.quote(s).then((q) => ({
        symbol: s, name: INDEX_NAMES[s] || s,
        value: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: parseFloat((q.regularMarketChangePercent ?? 0).toFixed(2)),
      })))
    );
    const data = results.filter((r) => r.status==="fulfilled").map((r) => r.value);
    indicesCache = { data, updatedAt: Date.now() };
    res.json(data);
  } catch (err) {
    res.status(502).json({ message: "Failed to fetch indices", error: err.message });
  }
});

// GET /api/stocks/:symbol — single detailed quote
router.get("/:symbol", protect, async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase();
    const q   = await yahooFinance.quote(toYF(sym));
    res.json(quoteToStock(q, sym));
  } catch (err) {
    res.status(502).json({ message: "Failed to fetch stock", error: err.message });
  }
});

// GET /api/stocks/:symbol/history?period=3M
router.get("/:symbol/history", protect, async (req, res) => {
  try {
    const sym    = req.params.symbol.toUpperCase();
    const period = req.query.period || "3M";
    const interval = period === "1W" ? "1d" : period === "1Y" ? "1wk" : "1d";

    const result = await yahooFinance.historical(toYF(sym), {
      period1: periodStart(period), interval,
    });

    const candles = result.map((d) => ({
      date:   d.date.toISOString().split("T")[0],
      open:   d.open,  high: d.high,
      low:    d.low,   close: d.close,
      volume: d.volume, value: d.close,
    }));
    res.json(candles);
  } catch (err) {
    res.status(502).json({ message: "Failed to fetch history", error: err.message });
  }
});

// GET /api/stocks/:symbol/news — latest headlines
router.get("/:symbol/news", protect, async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase();
    const result = await yahooFinance.search(toYF(sym), { newsCount: 8, quotesCount: 0 });
    const news = (result.news || []).map((n) => ({
      title:     n.title,
      publisher: n.publisher,
      link:      n.link,
      time:      n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : null,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url || null,
    }));
    res.json(news);
  } catch (err) {
    res.status(502).json({ message: "Failed to fetch news", error: err.message });
  }
});

function periodStart(p) {
  const d = new Date();
  if (p==="1W") d.setDate(d.getDate()-7);
  else if (p==="1M") d.setMonth(d.getMonth()-1);
  else if (p==="3M") d.setMonth(d.getMonth()-3);
  else if (p==="1Y") d.setFullYear(d.getFullYear()-1);
  return d;
}

export default router;
