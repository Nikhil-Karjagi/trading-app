import { NextResponse } from "next/server";

async function fetchFinnhub(symbol: string): Promise<any[] | null> {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 24 * 60 * 60;
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.s === "no_data" || !data.c || data.c.length < 30) return null;
    return data.t.map((t: number, i: number) => ({
      time: new Date(t * 1000).toISOString().split("T")[0],
      open: parseFloat(data.o[i].toFixed(2)),
      high: parseFloat(data.h[i].toFixed(2)),
      low: parseFloat(data.l[i].toFixed(2)),
      close: parseFloat(data.c[i].toFixed(2)),
      price: parseFloat(data.c[i].toFixed(2)),
    }));
  } catch { return null; }
}

async function fetchYahoo(symbol: string): Promise<any[] | null> {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 24 * 60 * 60;
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${from}&period2=${to}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result?.timestamp) return null;
    const q = result.indicators.quote[0];
    return result.timestamp
      .map((t: number, i: number) => ({
        time: new Date(t * 1000).toISOString().split("T")[0],
        open: parseFloat((q.open[i] || 0).toFixed(2)),
        high: parseFloat((q.high[i] || 0).toFixed(2)),
        low: parseFloat((q.low[i] || 0).toFixed(2)),
        close: parseFloat((q.close[i] || 0).toFixed(2)),
        price: parseFloat((q.close[i] || 0).toFixed(2)),
      }))
      .filter((c: any) => c.price > 0);
  } catch { return null; }
}

async function fetchNews(symbol: string, exchange: string): Promise<any[]> {
  try {
    // For Indian stocks use general market news, for US use company news
    const finnSymbol = exchange === "NSE" ? "AAPL" : symbol; // fallback for NSE
    const to = new Date().toISOString().split("T")[0];
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${finnSymbol}&from=${fromDate}&to=${to}&token=${process.env.FINNHUB_API_KEY}`,
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      // fallback to general market news
      const res2 = await fetch(
        `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`,
        { next: { revalidate: 1800 } }
      );
      const data2 = await res2.json();
      if (!Array.isArray(data2)) return [];
      return data2.slice(0, 3).map((n: any) => ({
        headline: n.headline,
        source: n.source,
        url: n.url,
        datetime: n.datetime,
      }));
    }
    return data.slice(0, 3).map((n: any) => ({
      headline: n.headline,
      source: n.source,
      url: n.url,
      datetime: n.datetime,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const exchange = searchParams.get("exchange") || "US";

  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  let candles = null;
  if (exchange === "NSE") {
    candles = await fetchYahoo(`${symbol}.NS`);
    if (!candles) candles = await fetchYahoo(symbol);
  } else {
    candles = await fetchFinnhub(symbol);
    if (!candles) candles = await fetchYahoo(symbol);
  }

  const news = await fetchNews(symbol, exchange);

  if (!candles || candles.length < 30) {
    return NextResponse.json({ error: "No data", fallback: true, news });
  }

  return NextResponse.json({ candles, news, source: exchange === "NSE" ? "yahoo" : "finnhub" });
}