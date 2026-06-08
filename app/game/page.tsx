"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Gamepad2, TrendingUp, TrendingDown, Trophy,
  RotateCcw, Share2, Loader2, Info, ArrowRight,
  Play, Brain, CheckCircle, XCircle, Newspaper,
  AlertTriangle, Timer, ExternalLink
} from "lucide-react";
import html2canvas from "html2canvas";

// ── Constants ─────────────────────────────────────────────────────────────────
const FOREX_RATE = 83.5;
const FOREX_MARKUP = 0.015;
const BANK_WIRE = 500;

const STOCKS = [
  { id: "RELIANCE", name: "Reliance Industries", exchange: "NSE", country: "IN", basePrice: 2850, volatility: 0.018, beta: 1.1, sector: "Energy/Retail" },
  { id: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", country: "IN", basePrice: 780, volatility: 0.028, beta: 1.8, sector: "Automobile" },
  { id: "INFOSYS", name: "Infosys", exchange: "NSE", country: "IN", basePrice: 1580, volatility: 0.016, beta: 0.9, sector: "IT Services" },
  { id: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", country: "IN", basePrice: 1650, volatility: 0.014, beta: 0.8, sector: "Banking" },
  { id: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", country: "US", basePrice: 185, volatility: 0.016, beta: 1.2, sector: "Technology" },
  { id: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", country: "US", basePrice: 245, volatility: 0.038, beta: 2.1, sector: "EV/Energy" },
  { id: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", country: "US", basePrice: 142, volatility: 0.018, beta: 1.1, sector: "Technology" },
  { id: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", country: "US", basePrice: 378, volatility: 0.014, beta: 0.9, sector: "Technology" },
];

const TIMEFRAMES = [
  { days: 5, label: "5 Days", animSpeed: 600 },
  { days: 10, label: "10 Days", animSpeed: 400 },
  { days: 20, label: "20 Days", animSpeed: 250 },
  { days: 30, label: "30 Days", animSpeed: 200 },
];

type GameMode = "beginner" | "advanced";
type Step = "mode" | "amount" | "stocks" | "timeframe" | "analyze" | "result";
type Decision = "BUY" | "HOLD" | "SELL";

interface Allocation { stockId: string; percent: number }
interface CandleData { time: string; price: number; open: number; high: number; low: number; close: number }
interface NewsItem { headline: string; source: string; url: string; datetime: number }

interface StockGameData {
  history: CandleData[];   // 30 days before window
  future: CandleData[];    // timeframe.days to animate
  news: NewsItem[];
  windowStart: number;     // random offset used
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSynthetic(stock: typeof STOCKS[0], days = 400): CandleData[] {
  const data: CandleData[] = [];
  // Random seed for variety each game
  let price = stock.basePrice * (0.7 + Math.random() * 0.6);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const trend = (Math.random() - 0.47) * stock.volatility * price;
    price = Math.max(price * 0.3, price + trend);
    const o = price * (1 + (Math.random() - 0.5) * 0.004);
    const h = price * (1 + Math.random() * stock.volatility * 0.6);
    const l = price * (1 - Math.random() * stock.volatility * 0.6);
    data.push({
      time: d.toISOString().split("T")[0],
      open: parseFloat(o.toFixed(2)),
      high: parseFloat(h.toFixed(2)),
      low: parseFloat(l.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
}

function pickRandomWindow(candles: CandleData[], historyDays: number, futureDays: number): { history: CandleData[]; future: CandleData[]; windowStart: number } {
  const minStart = historyDays;
  const maxStart = candles.length - futureDays - 1;
  if (maxStart <= minStart) {
    return {
      history: candles.slice(0, historyDays),
      future: candles.slice(historyDays, historyDays + futureDays),
      windowStart: historyDays,
    };
  }
  const windowStart = Math.floor(Math.random() * (maxStart - minStart)) + minStart;
  return {
    history: candles.slice(windowStart - historyDays, windowStart),
    future: candles.slice(windowStart, windowStart + futureDays),
    windowStart,
  };
}

function calcMA(data: CandleData[], window: number): number | null {
  if (data.length < window) return null;
  const slice = data.slice(-window);
  return parseFloat((slice.reduce((s, d) => s + d.close, 0) / window).toFixed(2));
}

function calcRSI(data: CandleData[], period = 14): number | null {
  if (data.length < period + 1) return null;
  const changes = data.slice(-period - 1).map((d, i, arr) => i === 0 ? 0 : d.close - arr[i - 1].close).slice(1);
  const gains = changes.filter(c => c > 0).reduce((s, c) => s + c, 0) / period;
  const losses = Math.abs(changes.filter(c => c < 0).reduce((s, c) => s + c, 0)) / period;
  if (losses === 0) return 100;
  return parseFloat((100 - 100 / (1 + gains / losses)).toFixed(1));
}

function calcCharges(amount: number, isUS: boolean) {
  const brokerage = 20;
  const stt = amount * 0.001;
  const exchCharge = amount * 0.0000345;
  const sebi = amount * 0.000001;
  const gst = brokerage * 0.18;
  const stamp = amount * 0.00015;
  let forex = 0, wire = 0, tcs = 0;
  if (isUS) {
    forex = amount * FOREX_MARKUP;
    wire = BANK_WIRE;
    tcs = amount <= 700000 ? amount * 0.05 : 35000 + (amount - 700000) * 0.20;
  }
  return { brokerage, stt, exchCharge, sebi, gst, stamp, forex, wire, tcs, total: brokerage + stt + exchCharge + sebi + gst + stamp + forex + wire + tcs };
}

function calcTax(profit: number, days: number, isUS: boolean): number {
  if (profit <= 0) return 0;
  if (isUS) return days >= 730 ? profit * 0.125 : profit * 0.30;
  return days >= 365 && profit > 125000 ? (profit - 125000) * 0.125 : days < 365 ? profit * 0.20 : 0;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GamePage() {
  const router = useRouter();
  const resultRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>("beginner");
  const [step, setStep] = useState<Step>("mode");
  const [amount, setAmount] = useState(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [stockData, setStockData] = useState<Record<string, StockGameData>>({});
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [decision, setDecision] = useState<Record<string, Decision>>({});
  const [earlyExit, setEarlyExit] = useState<Record<string, number>>({});
  const [sharing, setSharing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Per-stock animation state
  const [animFrames, setAnimFrames] = useState<Record<string, number>>({});
  const [animating, setAnimating] = useState<Record<string, boolean>>({});
  const [animDone, setAnimDone] = useState<Record<string, boolean>>({});
  const [earlyExitCountdown, setEarlyExitCountdown] = useState<Record<string, number>>({});
  const animRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const countdownRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const [results, setResults] = useState<{
    stockId: string; buyPrice: number; sellPrice: number;
    invested: number; grossProfit: number; charges: number;
    tax: number; netProfit: number; roi: number;
    bestDecision: Decision; wasCorrect: boolean;
    exitDay: number | null;
  }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
      else setUserId(user.id);
      setAuthLoading(false);
    });
  }, [router]);

  const fetchAllStocks = useCallback(async () => {
    setLoadingStocks(true);
    const data: Record<string, StockGameData> = {};
    await Promise.all(allocations.map(async alloc => {
      const stock = STOCKS.find(s => s.id === alloc.stockId)!;
      try {
        const res = await fetch(`/api/stock?symbol=${alloc.stockId}&exchange=${stock.exchange}`);
        const json = await res.json();
        let candles: CandleData[] = [];
        if (!json.fallback && json.candles?.length >= 60) {
          candles = json.candles;
        } else {
          candles = generateSynthetic(stock);
        }
        const { history, future, windowStart } = pickRandomWindow(candles, 30, timeframe.days);
        data[alloc.stockId] = { history, future, news: json.news || [], windowStart };
      } catch {
        const candles = generateSynthetic(stock);
        const { history, future, windowStart } = pickRandomWindow(candles, 30, timeframe.days);
        data[alloc.stockId] = { history, future, news: [], windowStart };
      }
    }));
    setStockData(data);
    setLoadingStocks(false);
  }, [allocations, timeframe]);

  useEffect(() => {
    if (step === "analyze") fetchAllStocks();
  }, [step]);

  // Smart allocation
  function toggleStock(stockId: string) {
    setAllocations(prev => {
      const exists = prev.find(a => a.stockId === stockId);
      if (exists) {
        const remaining = prev.filter(a => a.stockId !== stockId);
        if (remaining.length === 0) return [];
        const total = remaining.reduce((s, a) => s + a.percent, 0);
        const adjusted = remaining.map(a => ({ ...a, percent: Math.round(a.percent / total * 100) }));
        const diff = 100 - adjusted.reduce((s, a) => s + a.percent, 0);
        if (adjusted.length > 0) adjusted[adjusted.length - 1].percent += diff;
        return adjusted;
      }
      if (prev.length >= 4) return prev;
      const newList = [...prev, { stockId, percent: 0 }];
      const equal = Math.floor(100 / newList.length);
      const rem = 100 - equal * newList.length;
      return newList.map((a, i) => ({ ...a, percent: i === newList.length - 1 ? equal + rem : equal }));
    });
  }

  function updatePercent(stockId: string, val: number) {
    setAllocations(prev => {
      const others = prev.filter(a => a.stockId !== stockId);
      if (others.length === 0) return [{ stockId, percent: 100 }];
      const remaining = 100 - val;
      const totalOthers = others.reduce((s, a) => s + a.percent, 0);
      const adjusted = others.map(a => ({
        ...a,
        percent: totalOthers > 0 ? Math.max(0, Math.round(a.percent / totalOthers * remaining)) : Math.floor(remaining / others.length)
      }));
      const diff = remaining - adjusted.reduce((s, a) => s + a.percent, 0);
      if (adjusted.length > 0) adjusted[adjusted.length - 1].percent += diff;
      return [...adjusted.filter(a => a.stockId !== stockId), { stockId, percent: val }]
        .sort((a, b) => prev.findIndex(p => p.stockId === a.stockId) - prev.findIndex(p => p.stockId === b.stockId));
    });
  }

  // Per-stock animation
  function startStockAnimation(stockId: string) {
    setAnimFrames(prev => ({ ...prev, [stockId]: 0 }));
    setAnimating(prev => ({ ...prev, [stockId]: true }));
    setAnimDone(prev => ({ ...prev, [stockId]: false }));
    setEarlyExitCountdown(prev => ({ ...prev, [stockId]: 0 }));
  }

  useEffect(() => {
    allocations.forEach(alloc => {
      const stockId = alloc.stockId;
      if (!animating[stockId]) return;
      const maxFrames = timeframe.days;
      animRefs.current[stockId] = setInterval(() => {
        setAnimFrames(prev => {
          const next = (prev[stockId] || 0) + 1;
          if (next >= maxFrames) {
            setAnimating(a => ({ ...a, [stockId]: false }));
            setAnimDone(d => ({ ...d, [stockId]: true }));
            clearInterval(animRefs.current[stockId]);
          }
          // Start early exit countdown after day 3
          if (next === 3) {
            setEarlyExitCountdown(e => ({ ...e, [stockId]: 12 }));
          }
          return { ...prev, [stockId]: next };
        });
      }, timeframe.animSpeed);
    });
    return () => { allocations.forEach(a => clearInterval(animRefs.current[a.stockId])); };
  }, [animating, timeframe]);

  // Early exit countdown
  useEffect(() => {
    Object.entries(earlyExitCountdown).forEach(([stockId, count]) => {
      if (count <= 0 || earlyExit[stockId] !== undefined) return;
      countdownRefs.current[stockId] = setInterval(() => {
        setEarlyExitCountdown(prev => {
          const next = (prev[stockId] || 0) - 1;
          if (next <= 0) clearInterval(countdownRefs.current[stockId]);
          return { ...prev, [stockId]: next };
        });
      }, 1000);
    });
    return () => { Object.values(countdownRefs.current).forEach(clearInterval); };
  }, [earlyExitCountdown]);

  function handleEarlyExit(stockId: string) {
    const frame = animFrames[stockId] || 0;
    setEarlyExit(prev => ({ ...prev, [stockId]: frame }));
    clearInterval(animRefs.current[stockId]);
    setAnimating(prev => ({ ...prev, [stockId]: false }));
    setAnimDone(prev => ({ ...prev, [stockId]: true }));
  }

  function calculateResults() {
    const res = allocations.map(alloc => {
      const stock = STOCKS.find(s => s.id === alloc.stockId)!;
      const data = stockData[alloc.stockId];
      if (!data) return null;
      const isUS = stock.country === "US";
      const invested = Math.round(amount * alloc.percent / 100);
      const buyPrice = data.history[data.history.length - 1]?.price || stock.basePrice;
      const exitDay = earlyExit[alloc.stockId] ?? null;
      const sellPrice = exitDay !== null
        ? (data.future[exitDay - 1]?.price || buyPrice)
        : (data.future[data.future.length - 1]?.price || buyPrice);

      const buyCharges = calcCharges(invested, isUS);
      const actualInvested = invested - buyCharges.total;
      const priceInINR = isUS ? buyPrice * FOREX_RATE : buyPrice;
      const units = actualInvested / priceInINR;
      const dec = decision[alloc.stockId] || "HOLD";

      let grossProfit = 0;
      if (dec === "BUY") {
        const sellPriceINR = isUS ? sellPrice * FOREX_RATE : sellPrice;
        const saleValue = units * sellPriceINR;
        const sellCharges = calcCharges(saleValue, isUS);
        grossProfit = saleValue - actualInvested - sellCharges.total;
      } else if (dec === "SELL") {
        const priceDrop = (buyPrice - sellPrice) / buyPrice;
        grossProfit = actualInvested * priceDrop - buyCharges.total;
      }

      const tax = calcTax(grossProfit, exitDay ?? timeframe.days, isUS);
      const netProfit = grossProfit - tax;

      const priceChange = (sellPrice - buyPrice) / buyPrice;
      const bestDecision: Decision = priceChange > 0.005 ? "BUY" : priceChange < -0.005 ? "SELL" : "HOLD";
      const wasCorrect = dec === bestDecision;

      return {
        stockId: alloc.stockId,
        buyPrice: parseFloat(buyPrice.toFixed(2)),
        sellPrice: parseFloat(sellPrice.toFixed(2)),
        invested,
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        charges: parseFloat(buyCharges.total.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        roi: parseFloat(((netProfit / invested) * 100).toFixed(2)),
        bestDecision,
        wasCorrect,
        exitDay,
      };
    }).filter(Boolean) as typeof results;
    setResults(res);
    setStep("result");
    saveResult(res);
  }

  async function saveResult(res: typeof results) {
  if (!userId) {
    console.log("No userId — not saving");
    return;
  }
  const totalNet = res.reduce((s, r) => s + r.netProfit, 0);
  const payload = {
    user_id: userId,
    starting_amount: amount,
    final_amount: amount + totalNet,
    roi_percent: parseFloat(((totalNet / amount) * 100).toFixed(2)),
    stocks_played: allocations,
    timeframe: timeframe.days,
    charges_paid: res.reduce((s, r) => s + r.charges, 0),
    tax_paid: res.reduce((s, r) => s + r.tax, 0),
    mode: gameMode,
  };
  console.log("Saving game result:", payload);
  const { error } = await supabase.from("game_results").insert(payload);
  if (error) console.error("Save error:", error);
  else console.log("Saved successfully!");
}

  async function shareResult() {
  if (!resultRef.current) return;
  setSharing(true);
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(resultRef.current, {
      backgroundColor: "#111827",
      scale: 2,
      logging: false,
      useCORS: true,
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "trade-result.png";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  } catch {
    alert("Screenshot failed. Right-click the result card and save as image.");
  } finally {
    setSharing(false);
  }
}

  function resetGame() {
    setStep("mode");
    setAllocations([]);
    setDecision({});
    setResults([]);
    setStockData({});
    setAnimFrames({});
    setAnimating({});
    setAnimDone({});
    setEarlyExit({});
    setEarlyExitCountdown({});
    setActiveTab(0);
  }

  const totalPercent = allocations.reduce((s, a) => s + a.percent, 0);
  const allDecisionsMade = allocations.length > 0 && allocations.every(a => decision[a.stockId]);
  const allAnimDone = allocations.length > 0 && allocations.every(a => animDone[a.stockId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  const stepList: Step[] = ["mode", "amount", "stocks", "timeframe", "analyze", "result"];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="text-emerald-400" size={26} />
            <div>
              <h1 className="text-xl font-bold">Trading Game</h1>
              <p className="text-xs text-gray-500">Real data · Virtual money · Real lessons</p>
            </div>
          </div>
          {step !== "mode" && (
            <button onClick={resetGame}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-800 px-3 py-1.5 rounded-lg transition-colors">
              <RotateCcw size={12} /> Restart
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {stepList.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${stepList.indexOf(step) >= i ? "bg-emerald-500" : "bg-gray-800"}`} />
          ))}
        </div>

        {/* ── MODE ── */}
        {step === "mode" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold mb-2">Welcome to the Trading Game</h2>
              <p className="text-sm text-gray-400">Real historical data · Random windows · Virtual money</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { mode: "beginner" as GameMode, title: "Beginner", subtitle: "Guided with hints", color: "emerald", icon: <Brain size={22} className="text-emerald-400" />, features: ["RSI signal shown", "MA position shown", "Beta explained", "Decision hints"], desc: "Shows all indicators and hints. Perfect for learning what each signal means." },
                { mode: "advanced" as GameMode, title: "Advanced", subtitle: "Chart only", color: "yellow", icon: <TrendingUp size={22} className="text-yellow-400" />, features: ["Raw chart only", "No indicator hints", "You read the signals", "Post-result explanation"], desc: "Just the chart. Test your real trading knowledge." },
              ].map(opt => (
                <button key={opt.mode} onClick={() => { setGameMode(opt.mode); setStep("amount"); }}
                  className={`bg-gray-900 border border-gray-800 hover:border-${opt.color}-500/50 rounded-2xl p-6 text-left space-y-3 transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${opt.color}-500/10 rounded-xl`}>{opt.icon}</div>
                    <div>
                      <div className="font-bold text-white">{opt.title} Mode</div>
                      <div className="text-xs text-gray-500">{opt.subtitle}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                  <ul className="space-y-1">
                    {opt.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CheckCircle size={11} className={`text-${opt.color}-400`} /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── AMOUNT ── */}
        {step === "amount" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">How much to invest?</h2>
              <p className="text-xs text-gray-500">Virtual INR — no real money</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[10000, 50000, 100000, 500000].map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${amount === a && !customAmount ? "bg-emerald-500 border-emerald-500 text-gray-950" : "bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-500/40"}`}>
                  ₹{a.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Custom (min ₹5,000)</label>
              <input type="number" placeholder="Enter amount..." value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(Number(e.target.value)); }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 text-xs text-gray-400 flex gap-2">
              <Info size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>US stocks: forex markup ({(FOREX_MARKUP * 100)}%), bank wire ₹{BANK_WIRE}, TCS charges applied automatically.</span>
            </div>
            <button onClick={() => amount >= 5000 && setStep("stocks")} disabled={amount < 5000}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STOCKS ── */}
        {step === "stocks" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">Pick your stocks</h2>
              <p className="text-xs text-gray-500">Up to 4 · Must total 100%</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STOCKS.map(stock => {
                const sel = allocations.find(a => a.stockId === stock.id);
                return (
                  <button key={stock.id} onClick={() => toggleStock(stock.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${sel ? "bg-emerald-950/20 border-emerald-500/40" : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{stock.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${stock.country === "US" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                        {stock.country === "US" ? "🇺🇸" : "🇮🇳"} {stock.exchange}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{stock.name}</p>
                    <div className="flex gap-3 mt-1 text-[11px] text-gray-500">
                      <span>Beta: <span className={stock.beta > 1.5 ? "text-rose-400" : stock.beta > 1 ? "text-yellow-400" : "text-emerald-400"}>{stock.beta}</span></span>
                      <span>Vol: {(stock.volatility * 100).toFixed(1)}%</span>
                      <span>{stock.sector}</span>
                    </div>
                    {stock.country === "US" && <p className="text-[10px] text-yellow-500 mt-1">⚠️ Forex + TCS charges</p>}
                  </button>
                );
              })}
            </div>

            {allocations.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-300">Allocate Capital</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${totalPercent === 100 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                    {totalPercent}% / 100%
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">Adjusting one auto-redistributes others</p>
                {allocations.map(alloc => (
                  <div key={alloc.stockId} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span className="font-semibold text-gray-300">{alloc.stockId}
                        <span className="font-normal text-gray-600 ml-1.5">₹{Math.round(amount * alloc.percent / 100).toLocaleString("en-IN")}</span>
                      </span>
                      <span className="text-white font-mono">{alloc.percent}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={alloc.percent}
                      onChange={e => updatePercent(alloc.stockId, Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer" />
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => totalPercent === 100 && allocations.length > 0 && setStep("timeframe")}
              disabled={totalPercent !== 100 || allocations.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── TIMEFRAME ── */}
        {step === "timeframe" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">Choose timeframe</h2>
              <p className="text-xs text-gray-500">How many days to simulate?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TIMEFRAMES.map(tf => (
                <button key={tf.days} onClick={() => setTimeframe(tf)}
                  className={`p-4 rounded-xl border text-left transition-all ${timeframe.days === tf.days ? "bg-emerald-950/20 border-emerald-500/40" : "bg-gray-800 border-gray-700 hover:border-gray-600"}`}>
                  <div className="font-bold text-white">{tf.label}</div>
                  <div className="text-xs text-gray-500 mt-1">Animation: ~{(tf.days * tf.animSpeed / 1000).toFixed(0)}s</div>
                  <div className="text-[10px] text-gray-600 mt-1">STCG: 20% IN / 30% US</div>
                </button>
              ))}
            </div>
            <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-white">Early exit available after Day 3</p>
              <p>You can panic sell anytime after Day 3. See if it was the right call!</p>
            </div>
            <button onClick={() => setStep("analyze")}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              Load Stock Data <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── ANALYZE + ANIMATE ── */}
        {step === "analyze" && (
          <div className="space-y-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <h2 className="text-base font-bold mb-0.5">Analyze · Decide · Watch</h2>
              <p className="text-xs text-gray-500">Study each stock, make your decision, then press Play to animate.</p>
            </div>

            {/* Tabs */}
            {!loadingStocks && allocations.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allocations.map((alloc, i) => {
                  const isDone = animDone[alloc.stockId];
                  const hasDecision = !!decision[alloc.stockId];
                  return (
                    <button key={alloc.stockId} onClick={() => setActiveTab(i)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                        activeTab === i
                          ? "bg-emerald-500 border-emerald-500 text-gray-950"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}>
                      {alloc.stockId}
                      {isDone && <CheckCircle size={12} className={activeTab === i ? "text-gray-950" : "text-emerald-400"} />}
                      {hasDecision && !isDone && <div className={`w-2 h-2 rounded-full ${activeTab === i ? "bg-gray-950" : "bg-yellow-400"}`} />}
                    </button>
                  );
                })}
              </div>
            )}

            {loadingStocks ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Loader2 className="animate-spin text-emerald-400" size={32} />
                <p className="text-sm text-gray-400">Loading real stock data...</p>
                <p className="text-xs text-gray-600">Using random window from past year</p>
              </div>
            ) : (
              allocations.map((alloc, tabIdx) => {
                if (tabIdx !== activeTab) return null;
                const stock = STOCKS.find(s => s.id === alloc.stockId)!;
                const data = stockData[alloc.stockId];
                if (!data) return null;
                const isUS = stock.country === "US";
                const invested = Math.round(amount * alloc.percent / 100);
                const charges = calcCharges(invested, isUS);

                const histData = data.history;
                const futureData = data.future;
                const currentFrame = animFrames[alloc.stockId] || 0;
                const isAnim = animating[alloc.stockId] || false;
                const isDone = animDone[alloc.stockId] || false;
                const earlyExitDay = earlyExit[alloc.stockId];
                const countdown = earlyExitCountdown[alloc.stockId] || 0;

                const ma20 = calcMA(histData, 20);
                const rsi = calcRSI(histData);
                const buyPrice = histData[histData.length - 1]?.price || stock.basePrice;
                const high52 = Math.max(...histData.map(d => d.price));
                const low52 = Math.min(...histData.map(d => d.price));

                // Visible data: history + animated future
                const visibleFuture = isDone ? futureData : futureData.slice(0, currentFrame);
                const chartData = [...histData.slice(-60), ...visibleFuture];
                const currentPrice = chartData[chartData.length - 1]?.price || buyPrice;
                const priceChange = ((currentPrice - buyPrice) / buyPrice * 100).toFixed(2);
                const isPositive = Number(priceChange) >= 0;

                return (
                  <div key={alloc.stockId} className="space-y-4">
                    {/* Stock header */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{stock.id}</h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${isUS ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                              {isUS ? "🇺🇸" : "🇮🇳"} {stock.exchange}
                            </span>
                            {isDone && earlyExitDay !== undefined && (
                              <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded">
                                Early exit Day {earlyExitDay}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{stock.name} · {stock.sector}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold font-mono">{isUS ? "$" : "₹"}{currentPrice.toFixed(2)}</div>
                          {(isAnim || isDone) && (
                            <div className={`text-xs font-mono flex items-center justify-end gap-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                              {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {isPositive ? "+" : ""}{priceChange}% from buy
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chart */}
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="time" tick={{ fill: "#4b5563", fontSize: 8 }}
                              tickFormatter={(v, i) => i % 15 === 0 ? String(v).slice(5) : ""} />
                            <YAxis tick={{ fill: "#4b5563", fontSize: 9 }} domain={["auto", "auto"]} />
                            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }}
                              formatter={(v: number | undefined) => [
  v !== undefined ? `${isUS ? "$" : "₹"}${v.toFixed(2)}` : "Loading...", 
  "Price"
]} />
                            {ma20 && <ReferenceLine y={ma20} stroke="#f59e0b" strokeDasharray="4 2"
                              label={{ value: "MA20", fill: "#f59e0b", fontSize: 9 }} />}
                            {(isAnim || isDone) && <ReferenceLine x={histData[histData.length - 1]?.time}
                              stroke="#10b981" strokeDasharray="4 2" label={{ value: "Buy", fill: "#10b981", fontSize: 9 }} />}
                            <Line type="monotone" dataKey="price"
                              stroke={isAnim || isDone ? (isPositive ? "#10b981" : "#ef4444") : "#3b82f6"}
                              strokeWidth={2} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Indicators — beginner mode */}
                      {gameMode === "beginner" && !isAnim && (
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              label: "RSI (14)", value: rsi ? `${rsi}` : "N/A",
                              color: !rsi ? "text-gray-400" : rsi < 30 ? "text-emerald-400" : rsi > 70 ? "text-rose-400" : "text-yellow-400",
                              hint: !rsi ? "Not enough data" : rsi < 30 ? "Oversold — potential BUY zone" : rsi > 70 ? "Overbought — potential SELL zone" : "Neutral — follow MA direction"
                            },
                            {
                              label: "MA20 Position", value: ma20 ? (currentPrice > ma20 ? `${((currentPrice - ma20) / ma20 * 100).toFixed(1)}% above` : `${((ma20 - currentPrice) / ma20 * 100).toFixed(1)}% below`) : "N/A",
                              color: !ma20 ? "text-gray-400" : currentPrice > ma20 ? "text-emerald-400" : "text-rose-400",
                              hint: !ma20 ? "Not enough data" : currentPrice > ma20 ? "Price above MA — uptrend signal" : "Price below MA — downtrend signal"
                            },
                            {
                              label: "Beta", value: `${stock.beta}`,
                              color: stock.beta > 1.5 ? "text-rose-400" : stock.beta > 1 ? "text-yellow-400" : "text-emerald-400",
                              hint: stock.beta > 1.5 ? "Very volatile — high risk/reward" : stock.beta > 1 ? "More volatile than market" : "Stable — less volatile than market"
                            },
                            {
                              label: "52W Range", value: `${((currentPrice - low52) / (high52 - low52) * 100).toFixed(0)}% of range`,
                              color: ((currentPrice - low52) / (high52 - low52)) > 0.7 ? "text-rose-400" : ((currentPrice - low52) / (high52 - low52)) < 0.3 ? "text-emerald-400" : "text-yellow-400",
                              hint: `High: ${isUS ? "$" : "₹"}${high52.toFixed(0)} · Low: ${isUS ? "$" : "₹"}${low52.toFixed(0)}`
                            },
                          ].map(ind => (
                            <div key={ind.label} className="bg-gray-950 rounded-xl p-3 border border-gray-800">
                              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{ind.label}</div>
                              <div className={`text-xs font-semibold ${ind.color}`}>{ind.value}</div>
                              <div className="text-[10px] text-gray-600 mt-0.5">{ind.hint}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Charges */}
                      <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 text-xs">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><div className="text-gray-600">Investing</div><div className="text-white font-mono">₹{invested.toLocaleString("en-IN")}</div></div>
                          <div><div className="text-gray-600">Charges</div><div className="text-rose-400 font-mono">₹{charges.total.toFixed(0)}</div></div>
                          <div><div className="text-gray-600">Net Invested</div><div className="text-emerald-400 font-mono">₹{(invested - charges.total).toFixed(0)}</div></div>
                        </div>
                        {isUS && (
                          <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] text-yellow-500">
                            💱 ₹{invested.toLocaleString()} → ${(invested / FOREX_RATE).toFixed(0)} USD · Markup: ₹{charges.forex.toFixed(0)} · TCS: ₹{charges.tcs.toFixed(0)}
                          </div>
                        )}
                      </div>

                      {/* News */}
                      {data.news.length > 0 && (
                        <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                            <Newspaper size={12} className="text-blue-400" /> Recent News
                          </div>
                          {data.news.map((n, i) => (
                            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-start justify-between gap-2 group">
                              <p className="text-[11px] text-gray-400 group-hover:text-white transition-colors line-clamp-2">{n.headline}</p>
                              <ExternalLink size={10} className="text-gray-600 shrink-0 mt-0.5" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Decision buttons */}
                      {!isAnim && !isDone && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">Your decision:</p>
                          <div className="flex gap-2">
                            {(gameMode === "advanced" ? ["BUY", "HOLD", "SELL"] : ["BUY", "HOLD"] as Decision[]).map(d => (
                              <button key={d} onClick={() => setDecision(prev => ({ ...prev, [alloc.stockId]: d }))}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                                  decision[alloc.stockId] === d
                                    ? d === "BUY" ? "bg-emerald-500 border-emerald-500 text-gray-950 scale-105"
                                      : d === "SELL" ? "bg-rose-500 border-rose-500 text-white scale-105"
                                      : "bg-gray-500 border-gray-500 text-white scale-105"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                                }`}>
                                {d === "BUY" ? "📈 INVEST" : d === "SELL" ? "📉 SHORT" : "⏸ SKIP"}
                              </button>
                            ))}
                          </div>
                          {gameMode === "beginner" && decision[alloc.stockId] && (
  <div className="text-[11px] text-gray-500 bg-gray-950 rounded-lg p-2.5 border border-gray-800">
    {decision[alloc.stockId] === "BUY" && "📈 INVEST: Your ₹" + invested.toLocaleString("en-IN") + " buys shares now. You profit if price goes UP."}
    {decision[alloc.stockId] === "HOLD" && "⏸ SKIP: You keep your ₹" + invested.toLocaleString("en-IN") + " as cash. No charges, no profit, no loss."}
  </div>
)}
                        </div>
                      )}

                      {/* Play button */}
                      {decision[alloc.stockId] && !isAnim && !isDone && (
                        <button onClick={() => startStockAnimation(alloc.stockId)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                          <Play size={16} /> Play {timeframe.label} Animation
                        </button>
                      )}

                      {/* Animation status + early exit */}
                      {isAnim && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-gray-950 rounded-xl p-3 border border-gray-800">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Loader2 size={14} className="animate-spin text-emerald-400" />
                              Day {currentFrame} of {timeframe.days}
                            </div>
                            <div className="w-32 bg-gray-800 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${(currentFrame / timeframe.days) * 100}%` }} />
                            </div>
                          </div>

                          {currentFrame >= 3 && earlyExit[alloc.stockId] === undefined && decision[alloc.stockId] === "BUY" && earlyExitCountdown[alloc.stockId] !== -1 && (
                            <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-red-400">
                                <AlertTriangle size={16} />
                                PANIC SELL WINDOW — Day {currentFrame}
                              </div>
                              <p className="text-xs text-gray-400">
                                Market is moving! Exit early or hold your nerve?
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
  Day {currentFrame} of {timeframe.days} — market is volatile!
  {countdown > 0 && (
    <span className="ml-2 text-yellow-400">{countdown}s left to decide</span>
  )}
</div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
  clearInterval(countdownRefs.current[alloc.stockId]);
  setEarlyExitCountdown(prev => ({ ...prev, [alloc.stockId]: -1 }));
}}
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors">
  Stay Invested 💪
</button>
                                  <button
                                    onClick={() => handleEarlyExit(alloc.stockId)}
                                    className="bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors">
                                    PANIC SELL
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Done state */}
                      {isDone && (
                        <div className={`rounded-xl p-3 border flex items-center justify-between ${
                          isPositive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
                        }`}>
                          <div className="text-xs text-gray-400">
                            {earlyExitDay !== undefined
                              ? `Exited early on Day ${earlyExitDay}`
                              : `Completed ${timeframe.label}`}
                          </div>
                          <span className={`font-bold text-sm ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{priceChange}% {isPositive ? "📈" : "📉"}
                          </span>
                        </div>
                      )}

                      {/* Next stock tab */}
                      {isDone && tabIdx < allocations.length - 1 && (
                        <button onClick={() => setActiveTab(tabIdx + 1)}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                          Next: {allocations[tabIdx + 1].stockId} <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* See results — only when all done */}
            {allAnimDone && (
              <button onClick={calculateResults}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-base transition-colors">
                <Trophy size={18} /> See Combined Results
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === "result" && (
          <div className="space-y-5">
            <div ref={resultRef} id="result-capture" className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <div className="text-center pb-4 border-b border-gray-800">
                <h2 className="text-xl font-bold">Combined Trade Receipt</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {timeframe.label} simulation · ₹{amount.toLocaleString("en-IN")} starting capital · {gameMode} mode
                </p>
              </div>

              {results.map(r => {
                const stock = STOCKS.find(s => s.id === r.stockId)!;
                const isUS = stock.country === "US";
                const priceChange = ((r.sellPrice - r.buyPrice) / r.buyPrice * 100);

                return (
                  <div key={r.stockId} className="bg-gray-950 rounded-xl p-4 border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{r.stockId}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${decision[r.stockId] === "BUY" ? "bg-emerald-500/10 text-emerald-400" : decision[r.stockId] === "SELL" ? "bg-rose-500/10 text-rose-400" : "bg-gray-700 text-gray-400"}`}>
                          {decision[r.stockId]}
                        </span>
                        {r.exitDay !== null && (
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">
                            Early exit Day {r.exitDay}
                          </span>
                        )}
                        {r.wasCorrect
  ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle size={11} /> Great call!</span>
  : r.bestDecision === "BUY"
    ? <span className="flex items-center gap-1 text-[10px] text-yellow-400"><Info size={11} /> Investing would have earned more</span>
    : <span className="flex items-center gap-1 text-[10px] text-gray-400"><Info size={11} /> Skipping was the safer choice</span>
}
                      </div>
                      <span className={`font-bold text-lg ${r.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {r.netProfit >= 0 ? "+" : ""}₹{r.netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 text-xs font-mono text-gray-400 space-y-1">
                      <div className="flex justify-between"><span>Invested</span><span className="text-white">₹{r.invested.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Price moved</span>
                        <span className={priceChange >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between"><span>Gross P&L</span>
                        <span className={r.grossProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {r.grossProfit >= 0 ? "+" : ""}₹{r.grossProfit.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between"><span>Charges</span><span className="text-rose-400">-₹{r.charges.toFixed(0)}</span></div>
                      <div className="flex justify-between"><span>Tax ({isUS ? "30" : "20"}% STCG)</span><span className="text-rose-400">-₹{r.tax.toFixed(0)}</span></div>
                      <div className="flex justify-between font-bold"><span className="text-gray-300">Net ROI</span>
                        <span className={r.roi >= 0 ? "text-emerald-400" : "text-rose-400"}>{r.roi >= 0 ? "+" : ""}{r.roi}%</span>
                      </div>
                    </div>

                    {/* Early exit lesson */}
                    {r.exitDay !== null && (
                      <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-2.5 text-[11px] text-yellow-400">
                        <span className="font-semibold">Panic sell analysis: </span>
                        {r.wasCorrect
                          ? "Good call! The stock continued in the direction you feared."
                          : `Panic sell hurt you. If you held till Day ${timeframe.days}, the outcome was: ${r.bestDecision === "BUY" ? "price went UP 📈" : "price went DOWN 📉"}`
                        }
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Portfolio summary */}
              {(() => {
                const totalNet = results.reduce((s, r) => s + r.netProfit, 0);
                const totalRoi = (totalNet / amount) * 100;
                const totalCharges = results.reduce((s, r) => s + r.charges, 0);
                const totalTax = results.reduce((s, r) => s + r.tax, 0);
                const correctCalls = results.filter(r => r.wasCorrect).length;
                const panicSells = results.filter(r => r.exitDay !== null).length;

                return (
                  <div className="space-y-3">
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
                      <h3 className="text-sm font-bold text-emerald-400 mb-3">Portfolio Summary</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                        {[
                          { label: "Net P&L", value: `${totalNet >= 0 ? "+" : ""}₹${Math.round(totalNet).toLocaleString("en-IN")}`, color: totalNet >= 0 ? "text-emerald-400" : "text-rose-400" },
                          { label: "Total ROI", value: `${totalRoi >= 0 ? "+" : ""}${totalRoi.toFixed(2)}%`, color: totalRoi >= 0 ? "text-emerald-400" : "text-rose-400" },
                          { label: "Charges+Tax", value: `₹${Math.round(totalCharges + totalTax).toLocaleString("en-IN")}`, color: "text-rose-400" },
                          { label: "Correct Calls", value: `${correctCalls}/${results.length}`, color: correctCalls === results.length ? "text-emerald-400" : correctCalls > 0 ? "text-yellow-400" : "text-rose-400" },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                            <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-gray-500">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lessons */}
                    <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 space-y-2">
                      <div className="text-sm font-bold text-blue-400 flex items-center gap-2">
                        <Brain size={15} /> What you learned
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                        {results.some(r => STOCKS.find(s => s.id === r.stockId)?.country === "US") && (
                          <li>US stocks: forex markup + TCS charges applied — currency risk eats returns!</li>
                        )}
                        <li>Total charges+tax: ₹{Math.round(totalCharges + totalTax).toLocaleString("en-IN")} lost regardless of whether you profited</li>
                        {results.some(r => !r.wasCorrect) && (
                          <li>Wrong calls: {results.filter(r => !r.wasCorrect).map(r => `${r.stockId} (best was ${r.bestDecision})`).join(", ")}</li>
                        )}
                        {panicSells > 0 && (
                          <li>{panicSells} early exit(s) — {results.filter(r => r.exitDay !== null && !r.wasCorrect).length} were unnecessary panic sells</li>
                        )}
                        {gameMode === "beginner" && (
                          <li>RSI &lt; 30 = oversold (BUY zone) · RSI &gt; 70 = overbought (SELL zone)</li>
                        )}
                        <li>Holding &gt;1 year → LTCG 12.5% vs STCG 20% — patience saves tax money!</li>
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => window.print()}
  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
  <Share2 size={15} /> Save / Print
</button>
              <button onClick={() => router.push("/leaderboard")}
                className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                <Trophy size={15} /> Leaderboard
              </button>
              <button onClick={resetGame}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                <RotateCcw size={15} /> Play Again
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}