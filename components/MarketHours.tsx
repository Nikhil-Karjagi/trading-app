"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Globe, Circle } from "lucide-react";

interface MarketStatus {
  isOpen: boolean;
  currentLocalTime: string;
  nextSessionText: string;
}

export default function MarketHours() {
  const [mounted, setMounted] = useState(false);
  const [nseStatus, setNseStatus] = useState<MarketStatus>({ isOpen: false, currentLocalTime: "", nextSessionText: "" });
  const [nyseStatus, setNyseStatus] = useState<MarketStatus>({ isOpen: false, currentLocalTime: "", nextSessionText: "" });

  const checkMarketHours = () => {
    const now = new Date();

    // --- NSE Calculation (Asia/Kolkata) ---
    const nseTimeString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const nseDate = new Date(nseTimeString);
    const nseDay = nseDate.getDay(); // 0 = Sunday, 6 = Saturday
    const nseHours = nseDate.getHours();
    const nseMinutes = nseDate.getMinutes();
    const nseTotalMinutes = nseHours * 60 + nseMinutes;

    const isNseWeekend = nseDay === 0 || nseDay === 6;
    const isNseTime = nseTotalMinutes >= (9 * 60 + 15) && nseTotalMinutes < (15 * 60 + 30);
    const isNseOpen = !isNseWeekend && isNseTime;

    // --- NYSE Calculation (America/New_York) ---
    const nyseTimeString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const nyseDate = new Date(nyseTimeString);
    const nyseDay = nyseDate.getDay();
    const nyseHours = nyseDate.getHours();
    const nyseMinutes = nyseDate.getMinutes();
    const nyseTotalMinutes = nyseHours * 60 + nyseMinutes;

    const isNyseWeekend = nyseDay === 0 || nyseDay === 6;
    const isNyseTime = nyseTotalMinutes >= (9 * 60 + 30) && nyseTotalMinutes < (16 * 60);
    const isNyseOpen = !isNyseWeekend && isNyseTime;

    // Format display string options
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    setNseStatus({
      isOpen: isNseOpen,
      currentLocalTime: nseDate.toLocaleTimeString("en-US", timeOptions) + " IST",
      nextSessionText: isNseWeekend ? "Opens Monday at 09:15 AM" : nseTotalMinutes < (9 * 60 + 15) ? "Opens today at 09:15 AM" : "Closed until tomorrow 09:15 AM",
    });

    setNyseStatus({
      isOpen: isNyseOpen,
      currentLocalTime: nyseDate.toLocaleTimeString("en-US", timeOptions) + " EST",
      nextSessionText: isNyseWeekend ? "Opens Monday at 09:30 AM" : nyseTotalMinutes < (9 * 60 + 30) ? "Opens today at 09:30 AM" : "Closed until tomorrow 09:30 AM",
    });
  };

  useEffect(() => {
    setMounted(true);
    checkMarketHours();
    
    // Refresh calculations every 30 seconds to keep times accurate
    const interval = setInterval(checkMarketHours, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 border-b border-gray-800/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold tracking-wide uppercase text-gray-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Global Trading Desks
        </CardTitle>
        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
          <Globe className="w-3 h-3" /> Live Clock
        </span>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* NSE Widget Item */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-gray-100">NSE Index Desk</span>
              <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.2 rounded font-mono">🇮🇳 IND</span>
            </div>
            <p className="text-xs font-mono text-gray-400">{nseStatus.currentLocalTime}</p>
          </div>
          
          <div className="text-right space-y-1">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              nseStatus.isOpen ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              <Circle className={`w-2 h-2 fill-current animate-pulse`} />
              {nseStatus.isOpen ? "OPEN" : "CLOSED"}
            </div>
            {!nseStatus.isOpen && (
              <p className="text-[11px] text-gray-500 block">{nseStatus.nextSessionText}</p>
            )}
          </div>
        </div>

        {/* NYSE Widget Item */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-gray-100">NYSE Capital Desk</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-mono">🇺🇸 USA</span>
            </div>
            <p className="text-xs font-mono text-gray-400">{nyseStatus.currentLocalTime}</p>
          </div>
          
          <div className="text-right space-y-1">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              nyseStatus.isOpen ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              <Circle className={`w-2 h-2 fill-current animate-pulse`} />
              {nyseStatus.isOpen ? "OPEN" : "CLOSED"}
            </div>
            {!nyseStatus.isOpen && (
              <p className="text-[11px] text-gray-500 block">{nyseStatus.nextSessionText}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}