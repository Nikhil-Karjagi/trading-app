"use client";

import { useState, useMemo } from "react";
import { ShieldAlert } from "lucide-react";

type StockType = "indian" | "us";

export default function RiskCalculator() {
  const [amount, setAmount] = useState(50000);
  const [stockType, setStockType] = useState<StockType>("indian");

  const breakdown = useMemo(() => {
    const brokerage = 20;
    const stt = amount * 0.001;
    const exchange = amount * 0.0000345;
    const sebi = amount * 0.000001;
    const gst = brokerage * 0.18;
    const stamp = amount * 0.00015;
    let forex = 0, bankWire = 0, tcs = 0;
    if (stockType === "us") {
      forex = amount * 0.015;
      bankWire = 500;
      tcs = amount <= 700000 ? amount * 0.05 : (amount - 700000) * 0.20 + 700000 * 0.05;
    }
    const totalCharges = brokerage + stt + exchange + sebi + gst + stamp + forex + bankWire + tcs;
    const actualInvested = amount - totalCharges;
    const breakeven = totalCharges / amount * 100;
    return { brokerage, stt, exchange, sebi, gst, stamp, forex, bankWire, tcs, totalCharges, actualInvested, breakeven };
  }, [amount, stockType]);

  const fmt = (n: number) => "₹" + n.toFixed(2);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="text-rose-400" size={20} />
        <h2 className="text-base font-bold text-white">Risk & Charges Calculator</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Investment Amount</span>
            <span className="text-white font-mono">₹{amount.toLocaleString("en-IN")}</span>
          </div>
          <input type="range" min={5000} max={2000000} step={5000} value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full accent-rose-400 cursor-pointer" />
        </div>

        <div className="flex gap-2">
          {(["indian", "us"] as StockType[]).map(t => (
            <button key={t} onClick={() => setStockType(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${stockType === t ? "bg-emerald-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {t === "indian" ? "🇮🇳 Indian Stock" : "🇺🇸 US Stock"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-xs font-mono">
        {[
          { label: "Brokerage", value: fmt(breakdown.brokerage) },
          { label: "STT (0.1%)", value: fmt(breakdown.stt) },
          { label: "Exchange Charge", value: fmt(breakdown.exchange) },
          { label: "SEBI Charge", value: fmt(breakdown.sebi) },
          { label: "GST on Brokerage", value: fmt(breakdown.gst) },
          { label: "Stamp Duty", value: fmt(breakdown.stamp) },
          ...(stockType === "us" ? [
            { label: "Forex Markup (1.5%)", value: fmt(breakdown.forex) },
            { label: "Bank Wire", value: fmt(breakdown.bankWire) },
            { label: "TCS", value: fmt(breakdown.tcs) },
          ] : []),
        ].map(item => (
          <div key={item.label} className="flex justify-between text-gray-400 border-b border-gray-800 pb-1">
            <span>{item.label}</span>
            <span className="text-rose-400">{item.value}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-200 pt-1">
          <span>Total Charges</span>
          <span className="text-rose-400">{fmt(breakdown.totalCharges)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-200">
          <span>Actual Amount Invested</span>
          <span className="text-emerald-400">₹{breakdown.actualInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Break-even Move Needed</span>
          <span className="text-yellow-400">{breakdown.breakeven.toFixed(3)}%</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Break-even Move Needed</span>
          <span className="text-yellow-400">{breakdown.breakeven.toFixed(3)}%</span>
        </div>

        {/* Risk Assessment Section */}
        <div className="space-y-3 pt-2 border-t border-gray-800">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Risk Assessment</h3>
          <div className="space-y-2">
            {[
              {
                label: "Break-even Risk",
                value: breakdown.breakeven < 0.5 ? "LOW" : breakdown.breakeven < 1 ? "MEDIUM" : "HIGH",
                color: breakdown.breakeven < 0.5 ? "text-emerald-400" : breakdown.breakeven < 1 ? "text-yellow-400" : "text-rose-400",
                desc: `Stock must move ${breakdown.breakeven.toFixed(3)}% just to cover charges`
              },
              {
                label: "Forex Risk",
                value: stockType === "us" ? "HIGH" : "NONE",
                color: stockType === "us" ? "text-rose-400" : "text-emerald-400",
                desc: stockType === "us" ? "Currency fluctuation can erode profits even if stock goes up" : "No forex risk for Indian stocks"
              },
              {
                label: "TCS Liquidity Risk",
                value: stockType === "us" && amount > 700000 ? "HIGH" : stockType === "us" ? "LOW" : "NONE",
                color: stockType === "us" && amount > 700000 ? "text-rose-400" : stockType === "us" ? "text-yellow-400" : "text-emerald-400",
                desc: stockType === "us" && amount > 700000
                  ? `₹${breakdown.tcs.toFixed(0)} blocked till ITR refund — opportunity cost!`
                  : stockType === "us" ? "5% TCS applies — refundable via ITR"
                  : "No TCS applicable"
              },
              {
                label: "Overtrading Risk",
                value: amount < 10000 ? "HIGH" : amount < 50000 ? "MEDIUM" : "LOW",
                color: amount < 10000 ? "text-rose-400" : amount < 50000 ? "text-yellow-400" : "text-emerald-400",
                desc: amount < 10000
                  ? "Charges eat too much of small investments — consider larger amounts"
                  : amount < 50000 ? "Charges are manageable but watch frequency"
                  : "Good amount — charges are proportionally small"
              },
            ].map(item => (
              <div key={item.label} className="bg-gray-950 rounded-xl p-3 border border-gray-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                </div>
                <p className="text-[11px] text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}