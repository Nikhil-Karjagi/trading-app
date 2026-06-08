"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Globe, IndianRupee, ExternalLink, RefreshCw } from "lucide-react";

interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  category: string;
}

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const CACHE_KEY_US = "news_us_cache";
const CACHE_KEY_IN = "news_in_cache";
const CACHE_TTL = 30 * 1000;

async function fetchUSNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return data.slice(0, 5).map((item: NewsItem) => ({
      headline: item.headline,
      summary: item.summary,
      url: item.url,
      source: item.source,
      datetime: item.datetime,
      category: "US",
    }));
  } catch {
    return getMockUSNews();
  }
}

async function fetchIndiaNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms&count=5",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error("failed");
    const json = await res.json();
    return (json.items ?? []).slice(0, 5).map((item: {
      title: string;
      description: string;
      link: string;
      author: string;
      pubDate: string;
    }) => ({
      headline: item.title,
      summary: item.description?.replace(/<[^>]*>/g, "").slice(0, 100) + "...",
      url: item.link,
      source: "Economic Times",
      datetime: new Date(item.pubDate).getTime() / 1000,
      category: "India",
    }));
  } catch {
    return getMockIndiaNews();
  }
}

function getMockUSNews(): NewsItem[] {
  return [
    { headline: "Fed signals potential rate cuts in coming months", summary: "Federal Reserve officials indicated possible rate reductions.", url: "https://www.reuters.com/markets/", source: "Reuters", datetime: Date.now() / 1000, category: "US" },
    { headline: "S&P 500 reaches new all-time high amid tech rally", summary: "Major indices climbed as technology stocks led gains.", url: "https://www.bloomberg.com", source: "Bloomberg", datetime: Date.now() / 1000, category: "US" },
    { headline: "Apple reports record quarterly revenue", summary: "iPhone maker beats Wall Street expectations.", url: "https://www.cnbc.com", source: "CNBC", datetime: Date.now() / 1000, category: "US" },
    { headline: "Tesla deliveries exceed analyst expectations", summary: "EV maker delivered more vehicles than forecast.", url: "https://www.marketwatch.com", source: "MarketWatch", datetime: Date.now() / 1000, category: "US" },
    { headline: "Dollar weakens against major currencies", summary: "USD falls as investors await inflation data.", url: "https://www.ft.com", source: "FT", datetime: Date.now() / 1000, category: "US" },
  ];
}

function getMockIndiaNews(): NewsItem[] {
  return [
    { headline: "Sensex surges 500 points on strong FII inflows", summary: "Foreign institutional investors bought heavily.", url: "https://economictimes.indiatimes.com/markets", source: "Economic Times", datetime: Date.now() / 1000, category: "India" },
    { headline: "RBI keeps repo rate unchanged at 6.5%", summary: "Central bank maintains accommodative stance.", url: "https://www.moneycontrol.com", source: "Moneycontrol", datetime: Date.now() / 1000, category: "India" },
    { headline: "Reliance Industries posts record quarterly profit", summary: "Conglomerate beats estimates across segments.", url: "https://www.business-standard.com", source: "Business Standard", datetime: Date.now() / 1000, category: "India" },
    { headline: "SEBI tightens F&O trading regulations", summary: "New rules aimed at protecting retail investors.", url: "https://www.livemint.com", source: "Mint", datetime: Date.now() / 1000, category: "India" },
    { headline: "Nifty 50 crosses 25,000 mark for first time", summary: "Indian benchmark index hits historic milestone.", url: "https://economictimes.indiatimes.com", source: "Economic Times", datetime: Date.now() / 1000, category: "India" },
  ];
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className="block group p-3 rounded-xl hover:bg-gray-800/60 transition-all border border-transparent hover:border-gray-700">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-relaxed flex-1">
          {item.headline}
        </p>
        <ExternalLink size={11} className="text-gray-600 group-hover:text-emerald-400 mt-0.5 shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] text-gray-600">{item.source}</span>
        <span className="text-[10px] text-gray-700">·</span>
        <span className="text-[10px] text-gray-600">{timeAgo(item.datetime)}</span>
      </div>
    </a>
  );
}

function NewsPanel({ title, icon, news, loading, color }: {
  title: string;
  icon: React.ReactNode;
  news: NewsItem[];
  loading: boolean;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex-1">
      <div className={`flex items-center gap-2 mb-3 pb-3 border-b border-gray-800`}>
        <div className={`${color}`}>{icon}</div>
        <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1 animate-pulse">
              <div className="h-3 bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-800 rounded w-3/4" />
              <div className="h-2 bg-gray-800 rounded w-1/4 mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {news.map((item, i) => <NewsCard key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}

export default function NewsSection() {
  const [usNews, setUsNews] = useState<NewsItem[]>([]);
  const [indiaNews, setIndiaNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = useCallback(async (force = false) => {
    const now = Date.now();

    const usCached = localStorage.getItem(CACHE_KEY_US);
    const inCached = localStorage.getItem(CACHE_KEY_IN);

    const usValid = usCached && (now - JSON.parse(usCached).ts < CACHE_TTL) && !force;
    const inValid = inCached && (now - JSON.parse(inCached).ts < CACHE_TTL) && !force;

    const [usData, inData] = await Promise.all([
      usValid ? JSON.parse(usCached!).data : fetchUSNews(),
      inValid ? JSON.parse(inCached!).data : fetchIndiaNews(),
    ]);

    if (!usValid) localStorage.setItem(CACHE_KEY_US, JSON.stringify({ data: usData, ts: now }));
    if (!inValid) localStorage.setItem(CACHE_KEY_IN, JSON.stringify({ data: inData, ts: now }));

    setUsNews(usData);
    setIndiaNews(inData);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadNews();
    const interval = setInterval(() => loadNews(), CACHE_TTL);
    return () => clearInterval(interval);
  }, [loadNews]);

  function handleRefresh() {
    setRefreshing(true);
    loadNews(true);
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Market News
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-gray-600">
              Updated {timeAgo(lastUpdated.getTime() / 1000)}
            </span>
          )}
          <button onClick={handleRefresh} disabled={refreshing}
            className="text-gray-600 hover:text-emerald-400 transition-colors">
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <NewsPanel
          title="🇺🇸 US Markets"
          icon={<TrendingUp size={15} />}
          news={usNews}
          loading={loading}
          color="text-blue-400"
        />
        <NewsPanel
          title="🇮🇳 India Markets"
          icon={<IndianRupee size={15} />}
          news={indiaNews}
          loading={loading}
          color="text-orange-400"
        />
      </div>
    </div>
  );
}