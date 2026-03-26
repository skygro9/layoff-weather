
"use client";

import { useState, useEffect } from "react";

// ─── DATA LAYER ───────────────────────────────────────────────────────────────

const BIG_TECH = ["google","meta","amazon","microsoft","apple","netflix","twitter","x","salesforce","oracle","ibm","intel","snap","lyft","uber","airbnb","shopify","stripe","palantir","zoom","slack","dropbox","pinterest","reddit","linkedin"];

function getCompanySignals(company: string) {
  const name = company.toLowerCase();
  const isBigTech = BIG_TECH.some((t: string) => name.includes(t));
  const seed = name.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  const rng = (min: number, max: number, offset: number = 0) => min + ((seed + offset) % (max - min + 1));

  const stockDir = isBigTech ? (rng(0,2,1) === 0 ? "down" : "flat") : ["up","down","flat"][rng(0,2,3)];
  const stockChange = stockDir === "down" ? -(rng(3,22,7)) : stockDir === "up" ? rng(1,18,5) : rng(-3,3,2);
  const sentimentPool = isBigTech ? ["negative","neutral","neutral"] : ["positive","neutral","negative"];
  const sentiment = sentimentPool[rng(0,2,9)];
  const allKeywords = ["efficiency","restructuring","cost discipline","streamlining","AI investment","right-sizing","operational excellence","profitability focus","headcount optimization","runway extension"];
  const kwCount = isBigTech ? rng(3,5,11) : rng(1,3,13);
  const keywords = [...allKeywords].sort(() => (rng(0,9,seed) % 2 === 0 ? 1 : -1)).slice(0, kwCount);
  const hiringTrend = isBigTech ? (rng(0,1,15) === 0 ? "flat" : "decreasing") : ["increasing","flat","decreasing"][rng(0,2,17)];
  const recentLayoffs = isBigTech ? rng(0,1,19) === 0 : rng(0,2,21) === 0;
  const layoffSeverity = recentLayoffs ? rng(40,80,23) : rng(0,35,25);
  const earningsKeywords = ["beat expectations","missed estimates","guidance cut","revenue growth","margin compression","cost reduction","workforce optimization","strategic pivot"][rng(0,7,31)];
  const executiveChanges = rng(0,2,33) === 0;
  const contractorCuts = rng(0,2,37) === 0;
  const hiringFreezes = isBigTech ? rng(0,1,41) === 0 : rng(0,3,41) === 0;

  return { stockTrend: stockDir, stockChangePercent: stockChange, newsSentiment: sentiment, keywords, hiringTrend, recentLayoffs, layoffSeverity, earningsKeywords, executiveChanges, contractorCuts, hiringFreezes };
}

const DEPT_SCORES = { "HR / Recruiting": 20, "Marketing": 10, "Sales": 5, "Engineering": -5, "Product": 0, "Operations": 5 };
const SENIORITY_SCORES = { "Entry": 10, "Mid": 0, "Senior": -5, "Leadership": -10 };

function calculateRisk(signals: ReturnType<typeof getCompanySignals>, department: string, seniority: string) {
  let score = 0;
  if (signals.stockTrend === "down") score += 15 + Math.abs(signals.stockChangePercent);
  if (signals.newsSentiment === "negative") score += 20;
  if (signals.recentLayoffs) score += 25;
  if (signals.hiringTrend === "decreasing") score += 15;
  if (signals.hiringFreezes) score += 10;
  if (signals.executiveChanges) score += 8;
  score += signals.layoffSeverity * 0.2;
  score += DEPT_SCORES[department] || 0;
  score += SENIORITY_SCORES[seniority] || 0;
  score = Math.min(100, Math.max(0, Math.round(score)));
  const level = score < 30 ? "Low" : score < 55 ? "Moderate" : score < 75 ? "Elevated" : "High";
  const weather = score < 30 ? "Clear" : score < 55 ? "Cloudy" : score < 75 ? "Storm Watch" : "Severe";
  return { score, level, weather };
}

const SNARK = {
  Low: ["Not every meeting is a PIP meeting. This one's probably fine.", "You might actually be safe. Don't let it go to your head.", "Relax. But maybe update your LinkedIn bio. Just to feel alive."],
  Moderate: ["Not panic territory, but maybe don't ignore that recruiter DM.", "The vibes are ambiguous. Like a 'quick chat' invite with no agenda.", "Your company hasn't said 'restructuring' yet. Key word: yet."],
  Elevated: ["If your company just said 'efficiency,' it's rarely about the snacks.", "Might be a good week to casually update LinkedIn. Very casually.", "The forecast says 'maybe fine.' History says that's what everyone thinks."],
  High: ["Start treating every all-hands like it could be the all-hands.", "Your manager's manager just went very quiet on Slack. Fun fact.", "This is not a drill. Well, technically it is. But also kind of isn't."]
};

const POST_ANGLES = {
  Engineering: ["A simple system that saved our team hours","The debugging mindset I wish I'd developed earlier","Why I stopped writing clever code"],
  Product: ["A product decision I'd rethink if I could go back","The metric we optimized that was quietly wrong","What shipping fast taught me about what matters"],
  Marketing: ["3 creative trends I'm seeing in brand work right now","The campaign that flopped and what I actually learned","Why the best copy I've written was the shortest"],
  Sales: ["The deal I lost that made me a better closer","What buyers actually want to talk about right now","The follow-up strategy that stopped feeling like chasing"],
  "HR / Recruiting": ["What candidates are actually asking in final rounds now","The interview question I stopped asking — and why","What retention looks like before people start leaving"],
  Operations: ["The process we killed that everyone thought was essential","What 'scalable' actually means when you're in it","The ops change with the highest ROI no one expected"]
};

function generateVisibilityContent(department: string) {
  const angles = POST_ANGLES[department] || POST_ANGLES["Engineering"];
  const angle = angles[Math.floor(Math.random() * angles.length)];
  return {
    angle,
    postDrafts: {
      safe: `Been thinking a lot about "${angle.toLowerCase()}." It's one of those things that looks obvious in retrospect but took real time to internalize. Happy to share what I learned if it's useful to anyone navigating something similar.`,
      thoughtful: `${angle}. I've been sitting with this one for a while. The honest version isn't a clean lesson — it's messier than that. But the messy version is the one that actually changed how I work.`,
      bold: `${angle}. Most advice on this is wrong, or at least incomplete. Here's what I've actually seen work — and what the polished takes leave out.`
    }
  };
}

function buildDeepDive(signals: ReturnType<typeof getCompanySignals>, company: string, department: string) {
  const items = [];
  if (signals.stockTrend === "down") {
    items.push({ icon: "📉", label: "Stock Pressure", summary: `Down ${Math.abs(signals.stockChangePercent)}% recently`, detail: `When stock drops this sharply, boards start asking hard questions about headcount costs. Expect earnings call language to shift toward "discipline" and "efficiency." That's when HR starts getting quiet emails.` });
  } else if (signals.stockTrend === "up") {
    items.push({ icon: "📈", label: "Stock Momentum", summary: `Up ${signals.stockChangePercent}% — generally a good sign`, detail: `Rising stock reduces pressure for immediate cost-cutting. Leadership has more runway to invest rather than cut. That said, growth can mean rapid hiring that gets walked back later.` });
  } else {
    items.push({ icon: "📊", label: "Stock Flat", summary: "No major movement detected", detail: `Flat stock isn't inherently bad, but it reduces leadership's ability to use equity for retention. It can also signal that analysts aren't confident in growth — which makes internal cost reduction look more attractive.` });
  }
  if (signals.newsSentiment === "negative") {
    items.push({ icon: "📰", label: "News Sentiment: Negative", summary: "Coverage has turned unfavorable recently", detail: `Negative press puts management on the defensive. It tends to accelerate internal decisions that were already being considered. "Restructuring" announcements often follow a bad PR cycle by 30–90 days.` });
  } else if (signals.newsSentiment === "positive") {
    items.push({ icon: "📰", label: "News Sentiment: Positive", summary: "Coverage is favorable", detail: `Positive coverage gives leadership cover to invest and take risks. It's harder to announce layoffs when the narrative is momentum. Enjoy it while it lasts — press cycles can turn quickly.` });
  }
  if (signals.keywords.length > 0) {
    items.push({ icon: "🔍", label: "Language Analysis", summary: `Terms like "${signals.keywords[0]}" appearing in coverage`, detail: `These aren't random words. Earnings call language is carefully chosen. When "efficiency," "cost discipline," or "streamlining" appear, leadership is already framing the narrative for what comes next. Analysts notice. Employees should too.` });
  }
  if (signals.recentLayoffs) {
    items.push({ icon: "⚠️", label: "Prior Layoff Activity Confirmed", summary: "Reductions have already occurred", detail: `Companies that have laid off recently are statistically more likely to do so again within 12 months. The first round is rarely the last. If headcount goals weren't met or conditions worsened, a second wave is a real possibility.` });
  }
  if (signals.hiringTrend === "decreasing" || signals.hiringFreezes) {
    items.push({ icon: "🧊", label: "Hiring Slowdown", summary: signals.hiringFreezes ? "Possible freeze in effect" : "Open roles declining", detail: `Slowing external hiring is almost always a leading indicator. It happens 2–6 months before internal reductions. If ${department} specifically isn't hiring, that's a more direct signal than company-wide trends.` });
  }
  if (signals.executiveChanges) {
    items.push({ icon: "🔄", label: "Leadership Movement", summary: "Executive-level changes detected", detail: `New C-suite hires or departures often precede organizational restructuring. New leadership wants to put their own stamp on structure. Either way — watch the next 90 days closely.` });
  }
  if (signals.contractorCuts) {
    items.push({ icon: "✂️", label: "Contractor Reductions", summary: "Signs of vendor/contractor pullback", detail: `Companies cut contractors before full-time employees — it's faster, cheaper, and doesn't show up as a layoff. Widespread contractor cuts are a canary in the coal mine. They often precede FTE reductions by 1–2 quarters.` });
  }
  if (items.length === 0) {
    items.push({ icon: "✅", label: "No Major Signals", summary: "Public signals look quiet", detail: `No major hiring changes, no alarming language, stock is stable. That doesn't guarantee anything, but the external picture is calm. Keep an eye on next quarter's guidance.` });
  }
  return items;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#060618;--teal-bg:#002222;--purple-bg:#100022;--green-bg:#001400;
  --maroon-bg:#160000;--gold-bg:#120a00;
  --cyan:#00ffff;--lime:#00ff41;--magenta:#ff44ff;--yellow:#ffff00;
  --orange:#ff8c00;--red:#ff3333;--blue:#4488ff;
}
body{font-family:'Share Tech Mono',monospace;background:var(--navy);
  background-image:radial-gradient(ellipse at 15% 40%,rgba(74,0,128,.25) 0%,transparent 55%),
  radial-gradient(ellipse at 85% 10%,rgba(0,100,100,.2) 0%,transparent 55%),
  url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v1H0zM0 0v40h1V0z' fill='%23ffffff' fill-opacity='.018'/%3E%3C/svg%3E");
  min-height:100vh;color:#fff;padding-bottom:56px}

/* browser chrome */
.browser{max-width:820px;width:100%;margin:20px auto 0;padding:0 10px}
.b-chrome{background:linear-gradient(180deg,#d4d0c8,#b8b4ac);border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:3px 3px 0 #000}
.title-bar{background:linear-gradient(90deg,#000080,#1084d0 60%,#000080);padding:3px 6px;display:flex;align-items:center;justify-content:space-between}
.title-bar-text{color:#fff;font-family:'VT323',monospace;font-size:17px;letter-spacing:1px}
.tb-btns{display:flex;gap:2px}
.tb-btn{width:16px;height:14px;background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;font-size:9px;font-family:'VT323',monospace;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#000}
.toolbar{background:#c0c0c0;border-bottom:2px solid #808080;padding:3px 6px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.tool-btn{background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;padding:1px 8px;font-family:'VT323',monospace;font-size:14px;cursor:pointer;color:#000;white-space:nowrap}
.tool-btn:active{border-color:#404040 #fff #fff #404040}
.addr-input{flex:1;background:#fff;border:1px solid;border-color:#808080 #fff #fff #808080;padding:1px 6px;font-family:'Share Tech Mono',monospace;font-size:11px;color:#000080;min-width:0}
.page-content{background:var(--navy);border:2px solid;border-color:#404040 #fff #fff #404040}

/* site header */
.site-header{text-align:center;padding:28px 16px 18px;border-bottom:3px solid var(--cyan);position:relative;overflow:hidden;
  background:linear-gradient(160deg,#060618 0%,#0d0028 45%,#001818 100%)}
.site-header::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(0,255,255,.025) 3px,rgba(0,255,255,.025) 4px)}
.site-title{font-family:'VT323',monospace;font-size:clamp(44px,11vw,74px);letter-spacing:6px;line-height:1;color:var(--yellow);
  text-shadow:3px 3px 0 var(--orange),6px 6px 0 rgba(255,136,0,.35),0 0 40px rgba(255,230,0,.25)}
.site-sub{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--cyan);margin-top:6px;opacity:.8;text-transform:uppercase}
.visitor-bar{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:10px;font-size:10px;color:rgba(0,255,255,.5);letter-spacing:2px}
.counter{background:#000;border:1px solid var(--cyan);padding:1px 8px;color:var(--lime);font-size:12px;letter-spacing:3px;text-shadow:0 0 6px var(--lime)}

/* sections */
.sp{border-bottom:2px solid rgba(255,255,255,.1)}
.sp-teal{background:linear-gradient(135deg,#001f1f,#003333)}
.sp-purple{background:linear-gradient(135deg,#0d001a,#1e0040)}
.sp-navy{background:linear-gradient(135deg,#00000f,#080830)}
.sp-maroon{background:linear-gradient(135deg,#0f0000,#280000)}
.sp-forest{background:linear-gradient(135deg,#001000,#002600)}
.sp-gold{background:linear-gradient(135deg,#0e0800,#200f00)}
.si{padding:18px 18px}
.sh{font-family:'VT323',monospace;font-size:20px;letter-spacing:3px;text-transform:uppercase;
  padding:5px 12px;margin:-18px -18px 14px;border-bottom:2px solid;display:flex;align-items:center;gap:6px}
.sp-teal .sh{background:#003333;border-color:var(--cyan);color:var(--cyan)}
.sp-purple .sh{background:#1e0040;border-color:var(--magenta);color:var(--magenta)}
.sp-navy .sh{background:#080830;border-color:#6666ff;color:#9999ff}
.sp-maroon .sh{background:#280000;border-color:#ff5555;color:#ff7777}
.sp-forest .sh{background:#002600;border-color:var(--lime);color:var(--lime)}
.sp-gold .sh{background:#200f00;border-color:var(--orange);color:var(--orange)}

/* form */
.fl{display:block;font-family:'VT323',monospace;font-size:15px;letter-spacing:2px;color:var(--cyan);text-transform:uppercase;margin-bottom:3px}
.fi{width:100%;background:#000d1a;border:2px solid var(--teal-bg);color:var(--cyan);padding:7px 10px;font-family:'Share Tech Mono',monospace;font-size:13px;outline:none;transition:border-color .15s}
.fi:focus{border-color:var(--cyan);box-shadow:0 0 8px rgba(0,255,255,.18)}
.fi option{background:#001520;color:var(--cyan)}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:540px){.two-col{grid-template-columns:1fr}}

/* buttons */
.cta{font-family:'VT323',monospace;font-size:22px;letter-spacing:3px;text-transform:uppercase;
  padding:10px 30px;background:var(--yellow);color:#000;border:3px solid;
  border-color:#ffff88 #888800 #888800 #ffff88;cursor:pointer;box-shadow:3px 3px 0 #000;white-space:nowrap}
.cta:hover{background:#ffff44}
.cta:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #000}
.cta:disabled{opacity:.4;cursor:default;transform:none}
.sm-btn{font-family:'VT323',monospace;font-size:15px;letter-spacing:1px;text-transform:uppercase;
  padding:5px 12px;background:#c0c0c0;color:#000;border:2px solid;border-color:#fff #404040 #404040 #fff;cursor:pointer;box-shadow:2px 2px 0 #000;white-space:nowrap}
.sm-btn:active{transform:translate(1px,1px);box-shadow:1px 1px 0 #000}
.sm-btn.li{background:#0a66c2;color:#fff;border-color:#5599dd #003377 #003377 #5599dd}
.sm-btn.teal{background:#006060;color:var(--cyan);border-color:var(--cyan) #002020 #002020 var(--cyan)}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}

/* weather card */
.wcard{border:3px solid;position:relative;overflow:hidden;margin-bottom:14px}
.wcard::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent 0,transparent 2px,rgba(255,255,255,.018) 2px,rgba(255,255,255,.018) 3px)}
.wc-clear{background:linear-gradient(135deg,#001030,#002050);border-color:var(--blue)}
.wc-cloudy{background:linear-gradient(135deg,#181400,#2a2400);border-color:#cccc00}
.wc-storm{background:linear-gradient(135deg,#180800,#301200);border-color:var(--orange)}
.wc-severe{background:linear-gradient(135deg,#180000,#300000);border-color:var(--red)}
.wtop{display:flex;align-items:stretch;border-bottom:2px solid rgba(255,255,255,.12)}
.wicon{display:flex;align-items:center;justify-content:center;padding:18px 22px;font-size:78px;line-height:1;flex-shrink:0;border-right:2px solid rgba(255,255,255,.12)}
.wtxt{flex:1;padding:14px 18px;display:flex;flex-direction:column;justify-content:center}
.w-dateline{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;opacity:.5;text-transform:uppercase;margin-bottom:4px}
.w-condition{font-family:'VT323',monospace;font-size:clamp(30px,7vw,54px);letter-spacing:4px;line-height:1;text-transform:uppercase}
.wc-clear .w-condition{color:var(--blue)}
.wc-cloudy .w-condition{color:#dddd33}
.wc-storm .w-condition{color:var(--orange)}
.wc-severe .w-condition{color:var(--red);text-shadow:0 0 18px rgba(255,50,50,.5)}
.wscrow{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap}
.score-badge{font-family:'VT323',monospace;font-size:28px;letter-spacing:2px;padding:2px 12px;border:2px solid;line-height:1.3}
.wc-clear .score-badge{border-color:var(--blue);color:var(--blue)}
.wc-cloudy .score-badge{border-color:#dddd33;color:#dddd33}
.wc-storm .score-badge{border-color:var(--orange);color:var(--orange)}
.wc-severe .score-badge{border-color:var(--red);color:var(--red)}
.level-tag{font-family:'VT323',monospace;font-size:17px;letter-spacing:2px;padding:2px 10px;text-transform:uppercase}
.wc-clear .level-tag{background:var(--blue);color:#000}
.wc-cloudy .level-tag{background:#dddd33;color:#000}
.wc-storm .level-tag{background:var(--orange);color:#000}
.wc-severe .level-tag{background:var(--red);color:#fff}
/* progress */
.prog-outer{height:18px;background:rgba(0,0,0,.55);border-top:1px solid rgba(255,255,255,.1);position:relative;overflow:hidden}
.prog-fill{height:100%;transition:width 1s steps(30,end)}
.wc-clear .prog-fill{background:repeating-linear-gradient(90deg,#1144aa 0,var(--blue) 10px,#1144aa 20px)}
.wc-cloudy .prog-fill{background:repeating-linear-gradient(90deg,#888800 0,#dddd33 10px,#888800 20px)}
.wc-storm .prog-fill{background:repeating-linear-gradient(90deg,#993300 0,var(--orange) 10px,#993300 20px)}
.wc-severe .prog-fill{background:repeating-linear-gradient(90deg,#880000 0,var(--red) 10px,#880000 20px)}
.prog-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'VT323',monospace;font-size:13px;color:#fff;mix-blend-mode:difference;white-space:nowrap;letter-spacing:1px}
/* snark */
.snark{background:rgba(255,255,255,.06);border-top:1px solid rgba(255,255,255,.1);padding:8px 18px;font-size:11px;font-style:italic;opacity:.8;display:flex;align-items:center;gap:8px}
.snark-tag{font-style:normal;font-family:'VT323',monospace;font-size:12px;letter-spacing:2px;opacity:.55;flex-shrink:0}

/* terminal */
.terminal{background:#000;color:var(--lime);font-family:'Share Tech Mono',monospace;font-size:12px;padding:12px;border:2px solid #002200;line-height:1.9}
@keyframes flk{0%,100%{opacity:1}94%{opacity:1}95%{opacity:.87}98%{opacity:1}99%{opacity:.92}}
.terminal{animation:flk 5s infinite}
.line{display:block}.t-p{color:#00aa00}.t-ok{color:var(--lime)}.t-w{color:var(--yellow)}.t-b{color:#ff5555}.t-k{color:var(--orange)}.t-d{color:#335533}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.cursor{display:inline-block;animation:blink 1s step-end infinite}

/* dive deeper */
.dive-item{border:1px solid rgba(255,255,255,.1);margin-bottom:6px;overflow:hidden;transition:border-color .2s}
.dive-item.open{border-color:var(--cyan)}
.dive-trigger{width:100%;background:rgba(0,0,0,.4);border:none;color:#fff;padding:9px 12px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:11px;transition:background .15s}
.dive-trigger:hover{background:rgba(0,255,255,.06)}
.dive-ico{font-size:15px;flex-shrink:0}
.dive-lbl{font-family:'VT323',monospace;font-size:17px;letter-spacing:1px;color:var(--cyan);flex:1;min-width:0}
.dive-sum{opacity:.6;font-size:10px;flex:1.5;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dive-ch{margin-left:auto;font-size:9px;opacity:.5;transition:transform .2s;flex-shrink:0}
.dive-item.open .dive-ch{transform:rotate(180deg)}
.dive-body{background:rgba(0,255,255,.03);border-top:1px solid rgba(0,255,255,.12);padding:10px 12px 10px 42px;font-size:11px;color:rgba(255,255,255,.75);line-height:1.75;display:none}
.dive-item.open .dive-body{display:block}

/* visibility */
.tog-row{display:flex;gap:0;margin-bottom:8px}
.tog{flex:1;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.45);padding:5px 4px;font-family:'VT323',monospace;font-size:15px;letter-spacing:1px;cursor:pointer;text-align:center;text-transform:uppercase;transition:all .15s}
.tog.on{background:#004444;color:var(--cyan);border-color:var(--cyan)}
.rta{width:100%;background:#000a0a;border:2px solid #004444;color:var(--cyan);padding:8px 10px;font-family:'Share Tech Mono',monospace;font-size:12px;line-height:1.7;resize:vertical;min-height:84px;outline:none}
.rta:focus{border-color:var(--cyan)}
.char-row{display:flex;align-items:center;justify-content:space-between;font-size:9px;color:rgba(0,255,255,.35);margin-top:4px}

/* share */
.share-preview{background:#000;border:2px solid var(--yellow);padding:14px;text-align:center;margin-bottom:10px;position:relative}
.share-preview::before{content:'FORECAST CARD';position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:var(--yellow);color:#000;font-family:'VT323',monospace;font-size:12px;padding:0 8px;letter-spacing:2px}
.share-title{font-family:'VT323',monospace;font-size:26px;letter-spacing:3px;color:var(--yellow);line-height:1.2}
.share-sub{font-family:'Share Tech Mono',monospace;font-size:10px;color:rgba(255,255,255,.45);letter-spacing:1px;margin-top:3px}

/* actions */
.act-line{display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid rgba(0,255,0,.1);font-size:11px;line-height:1.5;color:rgba(255,255,255,.82)}
.act-line::before{content:'>>';color:var(--lime);font-family:'Share Tech Mono',monospace;font-size:10px;flex-shrink:0;padding-top:2px}

/* loading */
.loading-wrap{padding:28px;text-align:center}
.loading-title{font-family:'VT323',monospace;font-size:26px;letter-spacing:4px;color:var(--cyan);animation:flk 1.2s infinite}
.loading-msg{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--lime);margin-top:6px;letter-spacing:2px}

/* status bar */
.status-bar{background:#c0c0c0;border-top:2px solid;border-color:#fff #404040 #404040 #fff;padding:2px 8px;display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:10px;color:#404040}
.taskbar{position:fixed;bottom:0;left:0;right:0;height:30px;background:linear-gradient(180deg,#c0c0c0,#b0b0b0);border-top:2px solid #fff;display:flex;align-items:center;padding:0 4px;gap:4px;z-index:999}
.start-btn{background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;padding:2px 10px;font-family:'VT323',monospace;font-size:16px;font-weight:bold;cursor:pointer;letter-spacing:1px}
.tb-item{background:#c0c0c0;border:2px solid;border-color:#404040 #fff #fff #404040;padding:1px 10px;font-family:'VT323',monospace;font-size:14px;color:#000}
.tb-clock{margin-left:auto;border:1px solid;border-color:#808080 #fff #fff #808080;padding:2px 8px;font-family:'Share Tech Mono',monospace;font-size:11px;color:#000}
@keyframes fadeSlide{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.animate-in{animation:fadeSlide .35s ease forwards}
.copy-ok{font-family:'VT323',monospace;font-size:15px;color:var(--lime)}
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <>{t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>;
}

const CARD_CLS = { Clear: "wc-clear", Cloudy: "wc-cloudy", "Storm Watch": "wc-storm", Severe: "wc-severe" };
const WEATHER_ICON = { Clear: "☀", Cloudy: "⛅", "Storm Watch": "⛈", Severe: "⚡" };

function WeatherCard({ risk, company, snark }: { risk: ReturnType<typeof calculateRisk>, company: string, snark: string }) {
  const cls = CARD_CLS[risk.weather];
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  return (
    <div className={`wcard ${cls}`}>
      <div className="wtop">
        <div className="wicon">{WEATHER_ICON[risk.weather]}</div>
        <div className="wtxt">
          <div className="w-dateline">⛅ layoffweather.net — {date}</div>
          <div className="w-condition">{risk.weather}</div>
          <div className="wscrow">
            <span className="score-badge">{risk.score}/100</span>
            <span className="level-tag">{risk.level.toUpperCase()} RISK</span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, opacity: 0.45, letterSpacing: 1 }}>
              {company.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <div className="prog-outer">
        <div className="prog-fill" style={{ width: `${risk.score}%` }} />
        <span className="prog-label">RISK INDEX — {risk.score}%</span>
      </div>
      <div className="snark">
        <span className="snark-tag">// NOTE</span>
        {snark}
      </div>
    </div>
  );
}

function DiveItem({ item }: { item: { icon: string, label: string, summary: string, detail: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`dive-item${open ? " open" : ""}`}>
      <button className="dive-trigger" onClick={() => setOpen(o => !o)}>
        <span className="dive-ico">{item.icon}</span>
        <span className="dive-lbl">{item.label}</span>
        <span className="dive-sum">{item.summary}</span>
        <span className="dive-ch">▼</span>
      </button>
      <div className="dive-body">{item.detail}</div>
    </div>
  );
}

function TerminalSignals({ signals }: { signals: ReturnType<typeof getCompanySignals> }) {
  const sc = signals.stockTrend === "up" ? "t-ok" : signals.stockTrend === "down" ? "t-b" : "t-w";
  const nc = signals.newsSentiment === "positive" ? "t-ok" : signals.newsSentiment === "negative" ? "t-b" : "t-w";
  const hc = signals.hiringTrend === "increasing" ? "t-ok" : signals.hiringTrend === "decreasing" ? "t-b" : "t-w";
  return (
    <div className="terminal">
      <span className="line"><span className="t-p">$</span> <span className="t-d">run signal_scan --realtime</span></span>
      <span className="line"><span className="t-p">›</span> STOCK MOVEMENT ............. <span className={sc}>{signals.stockTrend.toUpperCase()} {signals.stockChangePercent > 0 ? "+" : ""}{signals.stockChangePercent}%</span></span>
      <span className="line"><span className="t-p">›</span> NEWS SENTIMENT ............. <span className={nc}>{signals.newsSentiment.toUpperCase()}</span></span>
      <span className="line"><span className="t-p">›</span> HIRING TREND ............... <span className={hc}>{signals.hiringTrend.toUpperCase()}</span></span>
      <span className="line"><span className="t-p">›</span> RECENT LAYOFFS ............. <span className={signals.recentLayoffs ? "t-b" : "t-ok"}>{signals.recentLayoffs ? "CONFIRMED" : "NOT DETECTED"}</span></span>
      <span className="line"><span className="t-p">›</span> EARNINGS LANGUAGE .......... <span className="t-k">"{signals.earningsKeywords}"</span></span>
      <span className="line"><span className="t-p">›</span> KEY TERMS .................. {signals.keywords.map((k, i) => (
        <span key={i}><span className="t-k">"{k}"</span>{i < signals.keywords.length - 1 ? <span className="t-d">, </span> : ""}</span>
      ))}</span>
      <span className="line"><span className="t-p">$</span> <span className="t-d">scan complete </span><span className="cursor">_</span></span>
    </div>
  );
}

function VisibilitySection({ department, riskLevel }: { department: string, riskLevel: string }) {
  const [mode, setMode] = useState("safe");
  const [copied, setCopied] = useState(false);
  const [liCopied, setLiCopied] = useState(false);
  const vis = generateVisibilityContent(department);
  const draft = vis.postDrafts[mode];

  const isHighRisk = riskLevel === "High" || riskLevel === "Elevated";
  const headline = isHighRisk ? "POST ON LINKEDIN BEFORE YOU NEED TO" : "BUILD YOUR LINKEDIN PRESENCE NOW";
  const sub = isHighRisk
    ? "Recruiters and colleagues can't vouch for you if they've forgotten you exist. A single post changes that."
    : "The best time to show up on recruiters' radars is before your name is in a layoff announcement.";

  const copy = () => { navigator.clipboard.writeText(draft).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const copyForLinkedIn = () => {
    navigator.clipboard.writeText(draft).then(() => { setLiCopied(true); setTimeout(() => setLiCopied(false), 2000); });
  };
  const openLinkedIn = () => {
    window.open("https://www.linkedin.com/feed/", "_blank");
  };

  return (
    <div className="sp sp-forest">
      <div className="si">
        <div className="sh">// LINKEDIN VISIBILITY</div>

        {/* Context strip */}
        <div style={{ background: "rgba(0,0,0,.5)", border: "1px solid rgba(0,255,65,.25)", padding: "10px 12px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>in</div>
          <div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: "var(--lime)", letterSpacing: 1, lineHeight: 1.2, marginBottom: 4 }}>{headline}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "rgba(0,255,65,.6)", lineHeight: 1.6 }}>{sub}</div>
          </div>
        </div>

        {/* Why it works */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          {[
            { stat: "10x", label: "more profile views after posting" },
            { stat: "~48h", label: "window before post reach drops" },
            { stat: "#1", label: "way recruiters vet warm candidates" }
          ].map(({ stat, label }) => (
            <div key={stat} style={{ background: "rgba(0,0,0,.4)", border: "1px solid rgba(0,255,65,.15)", padding: "7px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: "var(--lime)", lineHeight: 1 }}>{stat}</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "rgba(0,255,65,.5)", marginTop: 3, lineHeight: 1.4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Angle */}
        <div style={{ background: "rgba(0,0,0,.4)", border: "1px solid rgba(0,255,65,.18)", padding: "8px 12px", marginBottom: 10 }}>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 10, letterSpacing: 2, color: "rgba(0,255,65,.4)", marginBottom: 3 }}>SUGGESTED POST TOPIC FOR {department.toUpperCase()}</div>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 19, color: "var(--lime)", letterSpacing: 1 }}>{vis.angle}</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "rgba(0,255,65,.45)", marginTop: 4 }}>
            This kind of post signals expertise to recruiters without looking like you're job hunting.
          </div>
        </div>

        {/* Tone selector */}
        <div style={{ marginBottom: 5, fontFamily: "'VT323',monospace", fontSize: 13, letterSpacing: 2, color: "rgba(0,255,65,.6)", textTransform: "uppercase" }}>
          Generate Draft — pick a tone:
        </div>
        <div className="tog-row">
          {[
            { key: "safe", label: "SAFE", hint: "Professional & polished" },
            { key: "thoughtful", label: "THOUGHTFUL", hint: "Reflective & human" },
            { key: "bold", label: "BOLD", hint: "Confident & opinionated" }
          ].map(({ key, label, hint }) => (
            <button key={key} className={`tog${mode === key ? " on" : ""}`} onClick={() => setMode(key)}
              title={hint} style={{ flexDirection: "column", gap: 1 }}>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <textarea className="rta" value={draft} readOnly rows={4} />
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "rgba(0,255,65,.3)", marginTop: 3, marginBottom: 8 }}>
          Edit before posting — make it sound like you, not AI.
        </div>

        {/* Actions */}
        <div className="btn-row">
          <button className="sm-btn li" onClick={() => { copyForLinkedIn(); setTimeout(openLinkedIn, 300); }}>
            Copy + Open LinkedIn
          </button>
          <button className="sm-btn teal" onClick={copy}>Copy Draft</button>
          {(copied || liCopied) && <span className="copy-ok">✓ COPIED — paste into LinkedIn</span>}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function LayoffWeather() {
  const [company, setCompany] = useState("");
  const [dept, setDept] = useState("Engineering");
  const [seniority, setSeniority] = useState("Mid");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [result, setResult] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [visitors] = useState(() => 10000 + Math.floor(Math.random() * 9999));

  const MSGS = ["SCANNING PUBLIC SIGNALS...","PARSING EARNINGS LANGUAGE...","CROSS-REFERENCING HIRING DATA...","CALIBRATING RISK INDEX...","GENERATING FORECAST..."];

  const run = async () => {
    if (!company.trim()) return;
    setResult(null); setLoading(true);
    let i = 0;
    const iv = setInterval(() => { setLoadMsg(MSGS[i % MSGS.length]); i++; }, 420);
    await new Promise(r => setTimeout(r, 2300));
    clearInterval(iv);
    const signals = getCompanySignals(company);
    const risk = calculateRisk(signals, dept, seniority);
    const snarkList = SNARK[risk.level];
    const snark = snarkList[Math.floor(Math.random() * snarkList.length)];
    const deepDive = buildDeepDive(signals, company, dept);
    setResult({ signals, risk, snark, deepDive });
    setLoading(false);
  };

  const shareToLinkedIn = () => {
    if (!result) return;
    const text = encodeURIComponent(`Just checked Layoff Weather for ${company} — forecast is "${result.risk.weather}" (Risk: ${result.risk.score}/100).\n\nWorth a look if you're reading the signals at your company: http://layoffweather.net`);
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=http%3A%2F%2Flayoffweather.net&summary=${text}&title=Layoff+Weather`, "_blank", "width=600,height=500");
  };

  const copyCard = () => {
    if (!result) return;
    const txt = `⛅ LAYOFF WEATHER REPORT\n${result.risk.weather.toUpperCase()} @ ${company.toUpperCase()}\nRisk Index: ${result.risk.score}/100 — ${result.risk.level.toUpperCase()}\n\nCheck yours → layoffweather.net`;
    navigator.clipboard.writeText(txt).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
  };

  return (
    <>
      <style>{CSS}</style>

      <div className="site-header">
        <div className="site-title">⛅ LAYOFF WEATHER</div>
        <div className="site-sub">Public Signal Analysis System v2.1 — Est. 2024</div>
        <div className="visitor-bar">
          <span>VISITORS:</span>
          <span className="counter">{String(visitors).padStart(7, "0")}</span>
          <span>LAST UPDATED: JUST NOW</span>
        </div>
      </div>

      <div className="browser">
        <div className="b-chrome">
          <div className="title-bar">
            <span className="title-bar-text">⛅ Layoff Weather — Public Signal Analyzer</span>
            <div className="tb-btns">
              <button className="tb-btn">_</button>
              <button className="tb-btn">□</button>
              <button className="tb-btn">×</button>
            </div>
          </div>
          <div className="toolbar">
            <button className="tool-btn">◄</button>
            <button className="tool-btn">►</button>
            <button className="tool-btn">⟳</button>
            <div className="addr-input">http://layoffweather.net/forecast</div>
            <button className="tool-btn">Go</button>
          </div>
        </div>

        <div className="page-content">

          {/* INPUT */}
          <div className="sp sp-teal">
            <div className="si">
              <div className="sh">// ENTER COMPANY DETAILS</div>
              <div className="two-col">
                <div>
                  <label className="fl">Company Name</label>
                  <input className="fi" placeholder="e.g. Google, Meta, Acme Corp…"
                    value={company} onChange={e => setCompany(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && run()} />
                </div>
                <div>
                  <label className="fl">Department</label>
                  <select className="fi" value={dept} onChange={e => setDept(e.target.value)}>
                    {["Engineering","Product","Marketing","Sales","HR / Recruiting","Operations"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label className="fl">Seniority</label>
                  <select className="fi" value={seniority} onChange={e => setSeniority(e.target.value)}>
                    {["Entry","Mid","Senior","Leadership"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button className="cta" onClick={run} disabled={loading || !company.trim()}>CHECK FORECAST</button>
              </div>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="sp sp-navy">
              <div className="si loading-wrap">
                <div className="loading-title">ANALYZING SIGNALS <span className="cursor">_</span></div>
                <div className="loading-msg">{loadMsg}</div>
                <div style={{ marginTop: 12, height: 14, background: "rgba(0,0,0,.5)", border: "1px solid rgba(0,255,255,.15)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "55%", background: "repeating-linear-gradient(90deg,#004444 0,var(--cyan) 10px,#004444 20px)", animation: "flk .6s infinite" }} />
                </div>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {result && !loading && (
            <div className="animate-in">

              {/* WEATHER CARD */}
              <div className="sp sp-maroon">
                <div className="si">
                  <div className="sh">// LAYOFF WEATHER REPORT</div>
                  <WeatherCard risk={result.risk} company={company} snark={result.snark} />
                </div>
              </div>

              {/* SIGNALS + DIVE DEEPER */}
              <div className="sp sp-navy">
                <div className="si">
                  <div className="sh">// WHAT WE'RE SEEING</div>
                  <TerminalSignals signals={result.signals} />
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, letterSpacing: 2, color: "rgba(100,150,255,.6)", marginBottom: 7, textTransform: "uppercase" }}>
                      ▼ Dive Deeper — click any signal to expand
                    </div>
                    {result.deepDive.map((item, i) => <DiveItem key={i} item={item} />)}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="sp sp-purple">
                <div className="si">
                  <div className="sh">// {result.risk.score >= 60 ? "SUGGESTED NEXT MOVES" : "YOUR SITUATION"}</div>
                  {result.risk.score >= 60 ? (
                    <div>
                      {["Update your resume. Not later. This week.","Start soft applying to 2–3 roles you'd actually take.","Reach out to 2–3 people in your network. Just to reconnect.","Archive work you're proud of before you lose access.","Make sure your LinkedIn reflects what you've actually done."].map((a, i) => (
                        <div key={i} className="act-line">{a}</div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "rgba(255,255,255,.75)", lineHeight: 1.8 }}>
                      You're likely fine — but the best time to build leverage is before you need it.<br />
                      Keep doing good work. Stay visible. And update that resume anyway.
                    </div>
                  )}
                </div>
              </div>

              {/* VISIBILITY */}
              <VisibilitySection department={dept} riskLevel={result.risk.level} />

              {/* SHARE */}
              <div className="sp sp-gold">
                <div className="si">
                  <div className="sh">// SHARE YOUR FORECAST</div>
                  <div className="share-preview">
                    <div className="share-title">⛅ {result.risk.weather.toUpperCase()} @ {company.toUpperCase()}</div>
                    <div className="share-sub">layoffweather.net — RISK: {result.risk.score}/100 — {result.risk.level.toUpperCase()}</div>
                  </div>
                  <div className="btn-row">
                    <button className="sm-btn li" onClick={shareToLinkedIn}>Share on LinkedIn</button>
                    <button className="sm-btn" onClick={copyCard}>Copy Card Text</button>
                    <button className="sm-btn" onClick={() => setResult(null)}>New Forecast</button>
                    {shareCopied && <span className="copy-ok">✓ COPIED</span>}
                  </div>
                </div>
              </div>

            </div>
          )}

          <div style={{ padding: "10px 18px", textAlign: "center", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "rgba(255,255,255,.2)", lineHeight: 2, borderTop: "1px solid rgba(255,255,255,.07)" }}>
            Directional estimate based on public signals — not a prediction or guarantee. Not financial or career advice.<br />
            Best viewed on desktop &nbsp;|&nbsp; layoffweather.net
          </div>

        </div>

        <div className="status-bar">
          <span>⚡ Done</span><span>layoffweather.net</span><span>Internet Zone</span>
        </div>
      </div>

      <div className="taskbar">
        <button className="start-btn">Start</button>
        <div className="tb-item">⛅ Layoff Weather</div>
        <div className="tb-clock"><Clock /></div>
      </div>
    </>
  );
}
