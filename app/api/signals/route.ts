import { NextRequest, NextResponse } from "next/server";

const TICKER_MAP: Record<string, string> = {
  "snapchat": "SNAP", "snap": "SNAP",
  "google": "GOOGL", "alphabet": "GOOGL",
  "meta": "META", "facebook": "META",
  "amazon": "AMZN", "apple": "AAPL",
  "microsoft": "MSFT", "netflix": "NFLX",
  "tesla": "TSLA", "nvidia": "NVDA",
  "intel": "INTC", "salesforce": "CRM",
  "uber": "UBER", "lyft": "LYFT",
  "airbnb": "ABNB", "shopify": "SHOP",
  "palantir": "PLTR", "zoom": "ZM",
  "pinterest": "PINS", "reddit": "RDDT",
  "etsy": "ETSY", "dropbox": "DBX",
  "robinhood": "HOOD", "coinbase": "COIN",
  "doordash": "DASH", "instacart": "CART",
  "oracle": "ORCL", "ibm": "IBM",
  "cisco": "CSCO", "dell": "DELL",
  "adobe": "ADBE", "spotify": "SPOT",
  "paypal": "PYPL", "ebay": "EBAY",
  "amd": "AMD", "qualcomm": "QCOM",
  "hp": "HPQ",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company") || "";
  const companyLower = company.toLowerCase().trim();
  const FINNHUB_KEY = process.env.FINNHUB_KEY || "";
  const NEWS_KEY = process.env.NEWS_API_KEY || "";

  let ticker = TICKER_MAP[companyLower] || "";
  if (!ticker) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(company)}&token=${FINNHUB_KEY}`);
      const data = await res.json();
      const results = data.result || [];
      const usStock = results.find((r: any) => r.type === "Common Stock" && r.displaySymbol.indexOf(".") === -1);
      ticker = usStock ? usStock.symbol : (results[0]?.symbol || "");
    } catch (e) { console.error("Ticker lookup failed", e); }
  }

  let stockTrend: "up" | "down" | "flat" = "flat";
  let stockChangePercent = 0;
  let yearChangePercent = 0;
  let weekHigh52 = 0;
  let weekLow52 = 0;
  let stockStory = "flat";

  if (ticker) {
    try {
      const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_KEY}`);
      const quote = await quoteRes.json();
      const currentPrice = quote.c || 0;
      if (typeof quote.dp === "number") stockChangePercent = Math.round(quote.dp * 10) / 10;

      const metricRes = await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all&token=${FINNHUB_KEY}`);
      const metricData = await metricRes.json();
      const metric = metricData.metric || {};
      weekHigh52 = metric["52WeekHigh"] || 0;
      weekLow52 = metric["52WeekLow"] || 0;

      if (weekHigh52 > 0 && currentPrice > 0) {
        yearChangePercent = Math.round(((currentPrice - weekHigh52) / weekHigh52) * 100 * 10) / 10;
      }

      const todayDown = stockChangePercent < -1;
      const todayUp = stockChangePercent > 1;
      const yearNearHigh = yearChangePercent > -10;
      const yearNearLow = yearChangePercent < -30;
      const yearMidRange = yearChangePercent >= -30 && yearChangePercent <= -10;

      if (yearNearLow && todayDown) stockStory = "collapsing";
      else if (yearNearLow) stockStory = "depressed";
      else if (yearMidRange && todayDown) stockStory = "declining";
      else if (yearMidRange) stockStory = "mixed";
      else if (yearNearHigh && todayUp) stockStory = "strong";
      else if (yearNearHigh && todayDown) stockStory = "pullback";
      else if (todayDown) stockStory = "down";
      else if (todayUp) stockStory = "up";
      else stockStory = "flat";

      if (yearNearLow || stockStory === "collapsing" || stockStory === "declining") stockTrend = "down";
      else if (yearNearHigh && !todayDown) stockTrend = "up";
      else if (todayDown) stockTrend = "down";
      else if (todayUp) stockTrend = "up";
      else stockTrend = "flat";

    } catch (e) { console.error("Finnhub failed", e); }
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
        if (text.includes(term.toLowerCase())) executiveChanges = true;
      }
    }
  } catch (e) { console.error("SEC EDGAR failed", e); }

  let newsSentiment: "positive" | "neutral" | "negative" = "neutral";
  let newsKeywords: string[] = [];
  let hiringTrend: "increasing" | "decreasing" | "flat" = "flat";
  let contractorCuts = false;
  const RISK_KEYWORDS = ["layoff","layoffs","laid off","job cuts","restructuring","cost cutting","workforce reduction","headcount","right-sizing","streamlining","hiring freeze","downsizing","redundancies","reorg"];
  const POSITIVE_KEYWORDS = ["hiring","growth","expansion","record revenue","beat expectations","strong earnings","new product","acquisition","partnership"];

  try {
    const newsRes = await fetch(`https://newsapi.org/v2/everything?q="${encodeURIComponent(company)}"&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWS_KEY}`);
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];
    let riskScore = 0;
    let positiveScore = 0;
    const foundKeywords = new Set<string>();
    for (const article of articles) {
      const title = (article.title || "").toLowerCase();
      const desc = (article.description || "").toLowerCase();
      if (!title.includes(companyLower)) continue;
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
  } catch (e) { console.error("NewsAPI failed", e); }

  const allKeywords = Array.from(new Set([...secKeywords, ...newsKeywords])).slice(0, 5);
  if (recentLayoffs && newsSentiment === "neutral") newsSentiment = "negative";
  const layoffSeverity = recentLayoffs ? Math.min(85, 50 + allKeywords.length * 6) : Math.min(30, allKeywords.length * 5);
  if (stockTrend === "down" && newsSentiment === "negative" && hiringTrend === "flat") hiringTrend = "decreasing";

  return NextResponse.json({
    stockTrend, stockChangePercent, yearChangePercent,
    weekHigh52, weekLow52, stockStory, ticker,
    newsSentiment, keywords: allKeywords, hiringTrend,
    recentLayoffs, layoffSeverity,
    earningsKeywords: allKeywords[0] || "no major signals",
    executiveChanges, contractorCuts,
    hiringFreezes: hiringTrend === "decreasing",
    secFilingsFound: secKeywords.length > 0,
  });
}
