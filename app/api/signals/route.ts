import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company") || "";

  const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY || "";
  const NEWS_KEY = process.env.NEWS_API_KEY || "";

  // ── STOCK DATA ──────────────────────────────────────────────────────────────
  let stockTrend: "up" | "down" | "flat" = "flat";
  let stockChangePercent = 0;

  try {
    const stockRes = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(company)}&apikey=${ALPHA_KEY}`
    );
    const stockData = await stockRes.json();
    const quote = stockData["Global Quote"];
    if (quote && quote["10. change percent"]) {
      const pct = parseFloat(quote["10. change percent"].replace("%", ""));
      stockChangePercent = Math.round(pct * 10) / 10;
      stockTrend = pct > 1 ? "up" : pct < -1 ? "down" : "flat";
    }
  } catch (e) {
    console.error("Stock fetch failed", e);
  }

  // ── NEWS + SENTIMENT ────────────────────────────────────────────────────────
  let newsSentiment: "positive" | "neutral" | "negative" = "neutral";
  let keywords: string[] = [];
  let recentLayoffs = false;
  let hiringTrend: "increasing" | "decreasing" | "flat" = "flat";

  const RISK_KEYWORDS = [
    "layoff", "layoffs", "laid off", "job cuts", "restructuring",
    "efficiency", "cost cutting", "cost discipline", "workforce reduction",
    "headcount", "right-sizing", "streamlining", "reorg", "reorganization",
    "hiring freeze", "downsizing", "redundancies"
  ];

  const POSITIVE_KEYWORDS = [
    "hiring", "growth", "expansion", "record revenue", "beat expectations",
    "strong earnings", "new product", "acquisition", "partnership"
  ];

  try {
    const newsRes = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(company)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWS_KEY}`
    );
    const newsData = await newsRes.json();
    const articles = newsData.articles || [];

    let riskScore = 0;
    let positiveScore = 0;
    const foundKeywords = new Set<string>();

    for (const article of articles) {
      const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

      for (const kw of RISK_KEYWORDS) {
        if (text.includes(kw)) {
          riskScore++;
          foundKeywords.add(kw);
          if (kw.includes("layoff") || kw.includes("laid off") || kw.includes("job cuts")) {
            recentLayoffs = true;
          }
          if (kw.includes("hiring freeze")) {
            hiringTrend = "decreasing";
          }
        }
      }

      for (const kw of POSITIVE_KEYWORDS) {
        if (text.includes(kw)) {
          positiveScore++;
          if (kw === "hiring" && hiringTrend !== "decreasing") {
            hiringTrend = "increasing";
          }
        }
      }
    }

    keywords = Array.from(foundKeywords).slice(0, 5);

    if (riskScore >= 3) newsSentiment = "negative";
    else if (positiveScore >= 3 && riskScore === 0) newsSentiment = "positive";
    else newsSentiment = "neutral";

  } catch (e) {
    console.error("News fetch failed", e);
  }

  // ── LAYOFF SEVERITY ─────────────────────────────────────────────────────────
  const layoffSeverity = recentLayoffs
    ? Math.min(80, 40 + keywords.length * 8)
    : Math.min(30, keywords.length * 5);

  return NextResponse.json({
    stockTrend,
    stockChangePercent,
    newsSentiment,
    keywords,
    hiringTrend,
    recentLayoffs,
    layoffSeverity,
    earningsKeywords: keywords[0] || "no major signals",
    executiveChanges: false,
    contractorCuts: false,
    hiringFreezes: hiringTrend === "decreasing",
  });
}
