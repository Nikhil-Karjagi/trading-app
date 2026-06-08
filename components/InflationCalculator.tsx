"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, IndianRupee } from "lucide-react";

export default function InflationCalculator() {
  const [currentValue, setCurrentValue] = useState(100000);
  const [years, setYears] = useState(10);
  const [inflation, setInflation] = useState(6);
  const [investReturn, setInvestReturn] = useState(12);

  const { futureValue, monthlyNeeded, realReturn, purchasingLoss } = useMemo(() => {
    const futureValue = Math.round(currentValue * Math.pow(1 + inflation / 100, years));
    const realReturn = ((1 + investReturn / 100) / (1 + inflation / 100) - 1) * 100;
    const monthlyRate = investReturn / 100 / 12;
    const months = years * 12;
    const monthlyNeeded = Math.round(
      futureValue * monthlyRate / ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate))
    );
    const purchasingLoss = futureValue - currentValue;
    return { futureValue, monthlyNeeded, realReturn, purchasingLoss };
  }, [currentValue, years, inflation, investReturn]);

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-yellow-400" size={20} />
        <h2 className="text-base font-bold text-white">Inflation Calculator</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Current Value", value: currentValue, min: 10000, max: 10000000, step: 10000, set: setCurrentValue, prefix: "₹" },
          { label: "Years", value: years, min: 1, max: 40, step: 1, set: setYears, prefix: "" },
          { label: "Inflation Rate %", value: inflation, min: 1, max: 20, step: 0.5, set: setInflation, prefix: "" },
          { label: "Investment Return %", value: investReturn, min: 1, max: 30, step: 0.5, set: setInvestReturn, prefix: "" },
        ].map(({ label, value, min, max, step, set, prefix }) => (
          <div key={label} className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{label}</span>
              <span className="text-white font-mono">{prefix}{value.toLocaleString("en-IN")}{label.includes("%") ? "%" : label === "Years" ? " yrs" : ""}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Future Value Needed", value: fmt(futureValue), color: "text-rose-400", sub: "to match today's purchasing power" },
          { label: "Purchasing Power Loss", value: fmt(purchasingLoss), color: "text-orange-400", sub: "eroded by inflation" },
          { label: "Real Return", value: realReturn.toFixed(2) + "%", color: realReturn > 0 ? "text-emerald-400" : "text-rose-400", sub: "after inflation adjustment" },
          { label: "Monthly SIP Needed", value: fmt(monthlyNeeded), color: "text-blue-400", sub: "to beat inflation" },
        ].map(s => (
          <div key={s.label} className="bg-gray-950 rounded-xl p-3 border border-gray-800">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-600">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}