import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company") || "";

  const FINNHUB_KEY = process.env.FINNHUB_KEY || "";
  const NEWS_KEY = process.env.NEWS_API_KEY || "";

  let ticker = "";
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(company)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    const results = data.result || [];
    const usStock = results.find((r: any) => r.type === "Common Stock" && r.displaySymbol.indexOf(".") === -1);
    ticker = usStock ? usStock.symbol : (results[0]?.symbol || company.toUpperCase());
  } catch (e) {
    ticker = company.toUpperCase();
  }

  let stockTrend: "up" | "down" | "flat" = "flat";
  let stockChangePercent = 0;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    if (data && typeof data.dp === "number") {
      stockChangePercent = Math.round(data.dp * 10) / 10;
      stockTrend = data.dp > 0.5 ? "up" : data.dp < -0.5 ? "down" : "flat";
    }
  } catch (e) {
    console.error("Finnhub quote failed", e);
  }

  let recentLayoffs = false;
  let executiveChanges = false;
  let secKeywords: string[] = [];
  const LAYOFF_TERMS = ["reduction in force","workforce reduction","headcount reduction","job elimination","restructuring plan","severance","workforce realignment","reorganization"];
  const EXEC_TERMS = ["departure","resignation","appointed","chief executive","chief financial","president"];
  try {
    const today = new Date().toISOString().split("T")[0];
    const sixMonthsAgo = new Date(Date.now() - 180*24*60*60*1000).toISOString().split("T")[0];
    const edgarRes = await fetch(
      `https://efts.sec.gov/LATEST/search-index?q="${encodeURIComponent(company)}"&forms=8-K&dateRange=custom&startdt=${sixMonthsAgo}&enddt=${today}`,
      { headers: { "User-Agent": "LayoffWeather contact@layoffweather.net" } }
    );
    const edgarData = await edgarRes.json();
    const hits = edgarData.hits?.hits || [];
    for (const hit of hits.slice(0, 10)) {
      const text = JSON.stringify(hit._source || "").toLowerCase();
      for (const term of LAYOFF_TERMS) {
        if (text.includes(term.toLowerCase())) { recentLayoffs = true; secKeywords.push(term); }
      }
      for (const term of EXEC_TERMS) {
        if (text.includes(term.toLowerCase())) { executiveChanges = true; }
      }
    }
  } catch (e) {
    console.error("SEC EDGAR failed", e);
  }

  let newsSentiment: "positive" | "neutral" | "negative" = "neutral";
  let newsKeywords: string[] = [];
  let hiringTrend: "increasing" | "decreasing" | "flat" = "flat";
  let contractorCuts = false;
  const RISK_KEYWORDS = ["layoff","layoffs","laid off","job cuts","restructuring","cost cutting","workforce reduction","headcount","right-sizing","streamlining","hiring freeze","downsizing","redundancies","reorg"];
  const POSITIVE_KEYWORDS = ["hiring","growth","expansion","record revenue","beat expectations","strong earnings","new product","acquisition","partnership"];
  try {
    const newsRes = await fetch(
      `https://newsapi.org/v2/everything?q="${encodeURIComponent(company)}"&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWS_KEY}`
    );
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];
    let riskScore = 0;
    let positiveScore = 0;
    const foundKeywords = new Set<string>();
    for (const article of articles) {
      const title = (article.title || "").toLowerCase();
      const desc = (article.description || "").toLowerCase();
      if (!title.includes(company.toLowerCase())) continue;
      const text = `${title} ${desc}`;
      for (const kw of RISK_KEYWORDS) {
        if (text.includes(kw)) { riskScore++; foundKeywords.add(kw); if (kw.includes("hiring freeze")) hiringTrend = "decreasing"; if (kw.includes("contractor")) contractorCuts = true; }
      }
      for (const kw of POSITIVE_KEYWORDS) {
        if (text.includes(kw)) { positiveScore++; if (kw === "hiring" && hiringTrend !== "decreasing") hiringTrend = "increasing"; }
      }
    }
    newsKeywords = Array.from(foundKeywords).slice(0, 5);
    if (riskScore >= 2) newsSentiment = "negative";
    else if (positiveScore >= 3 && riskScore === 0) newsSentiment = "positive";
    else newsSentiment = "neutral";
  } catch (e) {
    console.error("NewsAPI failed", e);
  }

  const allKeywords = Array.from(new Set([...secKeywords, ...newsKeywords])).slice(0, 5);
  if (recentLayoffs && newsSentiment === "neutral") newsSentiment = "negative";
  const layoffSeverity = recentLayoffs ? Math.min(85, 50 + allKeywords.length * 6) : Math.min(30, allKeywords.length * 5);
  if (stockTrend === "down" && newsSentiment === "negative" && hiringTrend === "flat") hiringTrend = "decreasing";

  return NextResponse.json({
    stockTrend, stockChangePercent, ticker, newsSentiment, keywords: allKeywords,
    hiringTrend, recentLayoffs, layoffSeverity,
    earningsKeywords: allKeywords[0] || "no major signals",
    executiveChanges, contractorCuts, hiringFreezes: hiringTrend === "decreasing",
    secFilingsFound: secKeywords.length > 0,
  });
}
