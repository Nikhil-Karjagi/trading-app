"use client";

import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface DataPoint {
  time: string;
  price: number;
  ma?: number;
  signal?: "BUY" | "SELL" | null;
}

function generateData() {
  const points: { time: string; price: number }[] = [];
  let price = 100;
  for (let i = 1; i <= 50; i++) {
    price = parseFloat((price + (Math.random() - 0.48) * 4).toFixed(2));
    points.push({ time: `D${i}`, price });
  }
  return points;
}

export default function TradingSandbox() {
  const [mounted, setMounted] = useState(false);
  const [baseData] = useState(generateData);
  const [maWindow, setMaWindow] = useState(10);
  const [rsiThreshold, setRsiThreshold] = useState(30);

  useEffect(() => {
    const ma = localStorage.getItem("sandbox_ma");
    const rsi = localStorage.getItem("sandbox_rsi");
    if (ma) setMaWindow(Number(ma));
    if (rsi) setRsiThreshold(Number(rsi));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sandbox_ma", maWindow.toString());
    localStorage.setItem("sandbox_rsi", rsiThreshold.toString());
  }, [maWindow, rsiThreshold, mounted]);

  const { chartData, finalRoi } = useMemo(() => {
    const computed: DataPoint[] = baseData.map(d => ({ ...d }));

    for (let i = 0; i < computed.length; i++) {
      if (i >= maWindow - 1) {
        const sum = computed.slice(i - maWindow + 1, i + 1).reduce((a, c) => a + c.price, 0);
        computed[i].ma = parseFloat((sum / maWindow).toFixed(2));
      }
    }

    let position: "LONG" | null = null;
    let entryPrice = 0;
    let totalRoi = 0;

    for (let i = 1; i < computed.length; i++) {
      const prev = computed[i - 1];
      const curr = computed[i];
      if (prev.ma && curr.ma) {
        if (prev.price <= prev.ma && curr.price > curr.ma && !position && (computed[i].rsi === undefined || computed[i].rsi! < rsiThreshold)) {
  curr.signal = "BUY";
          position = "LONG";
          entryPrice = curr.price;
        } else if (prev.price >= prev.ma && curr.price < curr.ma && position === "LONG" && (computed[i].rsi === undefined || computed[i].rsi! > (100 - rsiThreshold))) {
  curr.signal = "SELL";
          position = null;
          totalRoi += ((curr.price - entryPrice) / entryPrice) * 100;
        }
      }
    }

    return { chartData: computed, finalRoi: parseFloat(totalRoi.toFixed(2)) };
  }, [baseData, maWindow]);

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Strategy Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="font-medium text-gray-300">MA Window</label>
              <span className="text-gray-400">{maWindow} Days</span>
            </div>
            <Slider value={[maWindow]} min={5} max={20} step={1}
  onValueChange={(val) => setMaWindow(val[0])} />
<p className="text-[10px] text-gray-600 leading-relaxed">
  (Moving Average) Smooths price over {maWindow} days. 
  Blue line crosses above yellow = BUY signal 📈
</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="font-medium text-gray-300">RSI Trigger</label>
              <span className="text-gray-400">&lt; {rsiThreshold}</span>
            </div>
            <Slider value={[rsiThreshold]} min={10} max={90} step={5}
  onValueChange={(val) => setRsiThreshold(val[0])} />
<p className="text-[10px] text-gray-600 leading-relaxed">
  (Relative Strength Index) Below {rsiThreshold} = oversold/undervalued. 
  Above 70 = overbought ⚠️
</p>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-500">Hypothetical ROI</div>
            <div className={`text-2xl font-bold mt-1 ${finalRoi >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {finalRoi >= 0 ? "+" : ""}{finalRoi}%
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Backtest Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} interval={9} />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
              <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Price" />
              <Line type="monotone" dataKey="ma" stroke="#f59e0b" strokeWidth={1.5} dot={false}
                strokeDasharray="4 2" name={`MA(${maWindow})`} connectNulls />
              {chartData.map((item, i) => {
                if (item.signal === "BUY")
                  return <ReferenceDot key={`b-${i}`} x={item.time} y={item.price} r={6} fill="#10b981" stroke="#fff" />;
                if (item.signal === "SELL")
                  return <ReferenceDot key={`s-${i}`} x={item.time} y={item.price} r={6} fill="#ef4444" stroke="#fff" />;
                return null;
              })}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}