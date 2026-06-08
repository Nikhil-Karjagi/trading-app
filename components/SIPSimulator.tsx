"use client";

import { useState, useMemo } from "react";
import { TrendingUp, IndianRupee } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SIPSimulator() {
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  const { chartData, totalInvested, finalCorpus, totalGain } = useMemo(() => {
    const data = [];
    let corpus = 0;
    const monthlyRate = rate / 100 / 12;
    for (let y = 1; y <= years; y++) {
      const months = y * 12;
      corpus = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      data.push({ year: `Y${y}`, corpus: Math.round(corpus), invested: monthly * months });
    }
    const invested = monthly * years * 12;
    return {
      chartData: data,
      totalInvested: invested,
      finalCorpus: Math.round(corpus),
      totalGain: Math.round(corpus - invested),
    };
  }, [monthly, years, rate]);

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="text-emerald-400" size={20} />
        <h2 className="text-base font-bold text-white">SIP Simulator</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Monthly Investment", value: monthly, min: 500, max: 100000, step: 500, set: setMonthly, prefix: "₹" },
          { label: "Duration (Years)", value: years, min: 1, max: 30, step: 1, set: setYears, prefix: "" },
          { label: "Expected Return %", value: rate, min: 1, max: 30, step: 0.5, set: setRate, prefix: "" },
        ].map(({ label, value, min, max, step, set, prefix }) => (
          <div key={label} className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{label}</span>
              <span className="text-white font-mono">{prefix}{value}{label.includes("%") ? "%" : label.includes("Years") ? " yrs" : ""}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Invested", value: fmt(totalInvested), color: "text-blue-400" },
          { label: "Total Gain", value: fmt(totalGain), color: "text-emerald-400" },
          { label: "Final Corpus", value: fmt(finalCorpus), color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-950 rounded-xl p-3 text-center border border-gray-800">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="year" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => "₹" + (v / 100000).toFixed(0) + "L"} />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="corpus" stroke="#10b981" strokeWidth={2} dot={false} name="Corpus" />
            <Line type="monotone" dataKey="invested" stroke="#3b82f6" strokeWidth={2} dot={false} name="Invested" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}