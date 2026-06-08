"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Clock } from "lucide-react";

interface Headline { title: string; source: string; url: string }

const CACHE_KEY = "fin_news_cache";
const CACHE_TTL = 10 * 60 * 1000;

const MOCK_HEADLINES: Headline[] = [
  { title: "Fed holds rates steady amid mixed inflation signals", source: "Reuters", url: "#" },
  { title: "Tech stocks rally as AI earnings beat expectations", source: "Bloomberg", url: "#" },
  { title: "Oil prices dip on rising US inventory data", source: "MarketWatch", url: "#" },
  { title: "Emerging markets see capital inflows as dollar weakens", source: "FT", url: "#" },
];

async function fetchHeadlines(): Promise<Headline[]> {
  try {
    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.finance.yahoo.com/rss/2.0/headline&count=4",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error("feed error");
    const json = await res.json();
    return (json.items ?? []).slice(0, 4).map((item: Record<string, string>) => ({
      title: item.title,
      source: item.author || "Yahoo Finance",
      url: item.link,
    }));
  } catch {
    return MOCK_HEADLINES;
  }
}

export default function NewsCache() {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) {
        setHeadlines(data);
        setLastFetched(ts);
        return;
      }
    }
    fetchHeadlines().then(data => {
      const ts = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts }));
      setHeadlines(data);
      setLastFetched(ts);
    });
  }, []);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-5 space-y-3 font-mono mt-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <TrendingUp size={15} className="text-emerald-400" /> Market Headlines
        </div>
        {lastFetched && (
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <Clock size={10} />
            {new Date(lastFetched).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      {headlines.length === 0
        ? <div className="text-slate-600 text-xs animate-pulse">Loading headlines…</div>
        : headlines.map((h, i) => (
          <a key={i} href={h.url} target="_blank" rel="noopener noreferrer"
            className="block group border-t border-slate-800 pt-2 first:border-0 first:pt-0">
            <p className="text-xs text-slate-300 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-relaxed">
              {h.title}
            </p>
            <span className="text-[10px] text-slate-600 mt-0.5 block">{h.source}</span>
          </a>
        ))}
    </div>
  );
}