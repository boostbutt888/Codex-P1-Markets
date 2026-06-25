const cardsRoot = document.querySelector("#cards");
const statusMessage = document.querySelector("#status-message");
const watchlistForm = document.querySelector("#watchlist-form");
const appVersionNode = document.querySelector("#app-version");
const appVersionFooterNode = document.querySelector("#app-version-footer");
const actionsRoot = document.querySelector("#watchlist-actions");
const mainContent = document.querySelector("main");
const sectionArrangeList = document.querySelector("#section-arrange-list");
const controlsOpenButton = document.querySelector("#controls-open-button");
const symbolInput = document.querySelector("#symbol-input");
const labelInput = document.querySelector("#label-input");
const refreshButton = document.querySelector("#refresh-button");
const refreshModeSelect = document.querySelector("#refresh-mode-select");
const refreshIntervalGroup = document.querySelector("#refresh-interval-group");
const refreshIntervalInput = document.querySelector("#refresh-interval-input");
const marketSelect = document.querySelector("#market-select");
const watchlistMarketSelect = document.querySelector("#watchlist-market-select");
const themeSelect = document.querySelector("#theme-select");
const currencySelect = document.querySelector("#currency-select");
const changeModeSelect = document.querySelector("#change-mode-select");
const rangeSelect = document.querySelector("#range-select");
const benchmarkRangeSelect = document.querySelector("#benchmark-range-select");
const template = document.querySelector("#stock-card-template");
const overviewChart = document.querySelector("#overview-chart");
const overviewTooltip = document.querySelector("#overview-tooltip");
const overviewLegend = document.querySelector("#overview-legend");
const overviewSummary = document.querySelector("#overview-summary");
const overviewTotalValue = document.querySelector("#overview-total-value");
const benchmarkRegionNote = document.querySelector("#benchmark-region-note");
const benchmarkControls = document.querySelector("#benchmark-controls");
const newsGroupsRoot = document.querySelector("#news-groups");
const optionsStockSelect = document.querySelector("#options-stock-select");
const optionsBiasSelect = document.querySelector("#options-bias-select");
const optionsSummary = document.querySelector("#options-summary");
const optionsIdeasRoot = document.querySelector("#options-ideas");
const marketSummary = document.querySelector("#market-summary");
const marketGroupsRoot = document.querySelector("#market-groups");
const sectorDetailRoot = document.querySelector("#sector-detail");
const marketStockCountSelect = document.querySelector("#market-stock-count-select");
const positionModal = document.querySelector("#position-modal");
const positionModalClose = document.querySelector("#position-modal-close");
const positionModalSave = document.querySelector("#position-modal-save");
const positionModalClear = document.querySelector("#position-modal-clear");
const positionModalInput = document.querySelector("#position-modal-input");
const positionModalAveragePriceInput = document.querySelector("#position-modal-average-price");
const positionModalSymbol = document.querySelector("#position-modal-symbol");
const controlsModal = document.querySelector("#controls-modal");
const controlsCloseButton = document.querySelector("#controls-close-button");
const collapsiblePanels = document.querySelectorAll(".collapsible-panel");
const watchlistSearchResults = document.querySelector("#watchlist-search-results");

let watchlist = [];
let usdToSgdRate = 1;
let autoRefreshTimer = null;
let selectedMarketSector = null;
let activePositionTarget = null;
let watchlistSearchTimer = null;
let lastWatchlistSearchQuery = "";
let latestChartResults = [];
let latestNewsGroups = [];
let selectedOptionsSymbol = "";
const MARKET_DRILLDOWN_SYMBOLS = new Set([
  "SPY",
  "QQQ",
  "DIA",
  "IWM",
  "XLK",
  "XLF",
  "XLV",
  "XLY",
  "XLP",
  "XLI",
  "XLE",
  "XLB",
  "XLU",
  "XLRE",
  "XLC",
]);
const WATCHLIST_AVERAGE_COLOR = "#1f6f5f";
const BENCHMARK_SETS = {
  US: [
    { key: "sp500", symbol: "SPY", label: "S&P 500", shortLabel: "S&P 500 (SPY)", color: "#c4672f", enabled: true },
    { key: "nasdaq", symbol: "QQQ", label: "Nasdaq", shortLabel: "Nasdaq (QQQ)", color: "#2d5b9a", enabled: true },
    { key: "dow", symbol: "DIA", label: "Dow", shortLabel: "Dow (DIA)", color: "#8a3ffc", enabled: true },
    { key: "vix", symbol: "^VIX", label: "VIX", shortLabel: "VIX (^VIX)", color: "#bc4749", enabled: false },
  ],
  SG: [
    { key: "sti", symbol: "^STI", label: "STI Index", shortLabel: "STI Index (^STI)", color: "#c4672f", enabled: true },
    { key: "spdrsti", symbol: "ES3.SI", label: "SPDR STI ETF", shortLabel: "SPDR STI ETF (ES3.SI)", color: "#2d5b9a", enabled: true },
    { key: "amovasti", symbol: "G3B.SI", label: "Singapore STI ETF", shortLabel: "Singapore STI ETF (G3B.SI)", color: "#8a3ffc", enabled: true },
    { key: "mscisg", symbol: "EWS", label: "MSCI Singapore", shortLabel: "MSCI Singapore (EWS)", color: "#bc4749", enabled: false },
  ],
};
const RANGE_LABELS = {
  "1mo": "1 month",
  "3mo": "3 months",
  "6mo": "6 months",
  "1y": "1 year",
  "2y": "2 years",
  "5y": "5 years",
  max: "max history",
};
const THEME_STORAGE_KEY = "stock-dashboard-theme";
const COLLAPSE_STORAGE_PREFIX = "stock-dashboard-collapse-";
const REFRESH_MODE_STORAGE_KEY = "stock-dashboard-refresh-mode";
const REFRESH_INTERVAL_STORAGE_KEY = "stock-dashboard-refresh-interval";
const MARKET_STOCK_COUNT_STORAGE_KEY = "stock-dashboard-market-stock-count";
const ACTIVE_WATCHLIST_MARKET_STORAGE_KEY = "stock-dashboard-active-watchlist-market";
const SECTION_ORDER_STORAGE_KEY = "stock-dashboard-section-order";
const RANDOM_THEME_VARIANTS = [
  { theme: "light", variant: "terracotta" },
  { theme: "light", variant: "ocean" },
  { theme: "light", variant: "sunrise" },
  { theme: "light", variant: "sage" },
  { theme: "light", variant: "lavender" },
  { theme: "light", variant: "citrus" },
  { theme: "dark", variant: "ember" },
  { theme: "dark", variant: "forest" },
  { theme: "dark", variant: "midnight-blue" },
  { theme: "dark", variant: "plum-night" },
  { theme: "dark", variant: "graphite" },
  { theme: "dark", variant: "moss-night" },
];

function resolveAutoTheme() {
  const currentHour = new Date().getHours();
  return currentHour >= 19 || currentHour < 7 ? "dark" : "light";
}

function randomThemeVariant() {
  return RANDOM_THEME_VARIANTS[Math.floor(Math.random() * RANDOM_THEME_VARIANTS.length)];
}

function applyTheme(themeMode) {
  if (themeMode === "random") {
    const variant = randomThemeVariant();
    document.body.dataset.theme = variant.theme;
    document.body.dataset.themeVariant = variant.variant;
    return;
  }

  const resolvedTheme = themeMode === "auto" ? resolveAutoTheme() : themeMode;
  document.body.dataset.theme = resolvedTheme;
  delete document.body.dataset.themeVariant;
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "auto";
  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
  applyTheme(savedTheme);
}

function normalizeMarket(value) {
  const normalized = String(value || "US").trim().toUpperCase();
  if (normalized === "ALL") {
    return "ALL";
  }
  return normalized === "SG" || normalized === "SGP" ? "SG" : "US";
}

function currentMarket() {
  return normalizeMarket(marketSelect?.value || "US");
}

function currentMarketLabel() {
  if (currentMarket() === "ALL") {
    return "all";
  }
  return currentMarket() === "SG" ? "Singapore" : "US";
}

function currentMarketDescriptor() {
  if (currentMarket() === "ALL") {
    return "all markets";
  }
  return currentMarket() === "SG" ? "Singapore" : "US";
}

function reorderableSections() {
  if (!mainContent) {
    return [];
  }
  return Array.from(mainContent.querySelectorAll("section.collapsible-panel[data-collapsible]"));
}

function sectionLabel(key) {
  const labels = {
    tickers: "Tickers",
    actions: "Watchlist Actions",
    options: "Options Ideas",
    benchmark: "Benchmark View",
    news: "Watchlist News",
    market: "Market View",
  };
  return labels[key] || key;
}

function getSavedSectionOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(SECTION_ORDER_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function effectiveSectionOrder() {
  const sections = reorderableSections();
  const keys = sections.map((section) => section.dataset.collapsible).filter(Boolean);
  const saved = getSavedSectionOrder();
  const ordered = saved.filter((key) => keys.includes(key));
  keys.forEach((key) => {
    if (!ordered.includes(key)) {
      ordered.push(key);
    }
  });
  return ordered;
}

function saveSectionOrder(order) {
  localStorage.setItem(SECTION_ORDER_STORAGE_KEY, JSON.stringify(order));
}

function applySectionOrder(order = effectiveSectionOrder()) {
  if (!mainContent) {
    return;
  }

  const sectionsByKey = new Map(
    reorderableSections().map((section) => [section.dataset.collapsible, section])
  );

  order.forEach((key) => {
    const section = sectionsByKey.get(key);
    if (section) {
      mainContent.appendChild(section);
    }
  });
}

function moveSection(key, direction) {
  const order = effectiveSectionOrder();
  const index = order.indexOf(key);
  if (index === -1) {
    return;
  }

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= order.length) {
    return;
  }

  [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
  saveSectionOrder(order);
  applySectionOrder(order);
  renderSectionArranger();
}

function renderSectionArranger() {
  if (!sectionArrangeList) {
    return;
  }

  const order = effectiveSectionOrder();
  sectionArrangeList.replaceChildren();

  order.forEach((key, index) => {
    const item = document.createElement("div");
    item.className = "section-arrange-item";

    const name = document.createElement("p");
    name.className = "section-arrange-name";
    name.textContent = sectionLabel(key);

    const controls = document.createElement("div");
    controls.className = "section-arrange-controls";

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "section-arrange-button";
    upButton.textContent = "Up";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => moveSection(key, -1));

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "section-arrange-button";
    downButton.textContent = "Down";
    downButton.disabled = index === order.length - 1;
    downButton.addEventListener("click", () => moveSection(key, 1));

    controls.append(upButton, downButton);
    item.append(name, controls);
    sectionArrangeList.appendChild(item);
  });
}

function initializeSectionOrder() {
  const order = effectiveSectionOrder();
  saveSectionOrder(order);
  applySectionOrder(order);
  renderSectionArranger();
}

function averageClose(points, count) {
  const sample = (points || []).slice(-count);
  if (!sample.length) {
    return null;
  }
  const total = sample.reduce((sum, point) => sum + Number(point.close || 0), 0);
  return total / sample.length;
}

function stockNewsGroup(symbol) {
  return latestNewsGroups.find((group) => group.symbol === symbol);
}

function stockNewsCount(symbol) {
  const group = stockNewsGroup(symbol);
  if (!group || !Array.isArray(group.items)) {
    return 0;
  }
  return group.items.length;
}

function stockSignalSnapshot(stock) {
  if (stock?.error || !Array.isArray(stock?.points) || !stock.points.length) {
    return null;
  }

  const points = stock.points;
  const latest = Number(stock.price ?? points.at(-1)?.close ?? 0);
  const sma5 = averageClose(points, 5) ?? latest;
  const sma20 = averageClose(points, 20) ?? averageClose(points, 10) ?? latest;
  const periodHigh = Math.max(...points.map((point) => Number(point.close || 0)));
  const periodLow = Math.min(...points.map((point) => Number(point.close || 0)));
  const distanceFromHigh = periodHigh ? (periodHigh - latest) / periodHigh : 0;
  const distanceFromLow = periodLow ? (latest - periodLow) / periodLow : 0;
  const shortTermSlope = sma5 ? ((latest - sma5) / sma5) * 100 : 0;
  const mediumTermSlope = sma20 ? ((latest - sma20) / sma20) * 100 : 0;
  const dayChangePct = Number(stock.dayChangePct || 0);
  const hasPosition = Number(stock.position) > 0;
  const newsCount = stockNewsCount(stock.symbol);

  return {
    latest,
    sma5,
    sma20,
    periodHigh,
    periodLow,
    distanceFromHigh,
    distanceFromLow,
    shortTermSlope,
    mediumTermSlope,
    dayChangePct,
    hasPosition,
    newsCount,
    aboveTrend: latest >= sma20,
    strongDay: dayChangePct >= 2,
    weakDay: dayChangePct <= -2,
    nearHigh: distanceFromHigh <= 0.03,
    nearLow: distanceFromLow <= 0.06,
  };
}

function actionToneClass(tone) {
  return tone === "positive" ? "is-positive" : tone === "warning" ? "is-warning" : "is-neutral";
}

function actionIdeasForStock(stock) {
  const snapshot = stockSignalSnapshot(stock);
  if (!snapshot) {
    return {
      tone: "neutral",
      tag: "Data check",
      title: `Refresh ${stock.symbol} before acting`,
      summary: "Price data is unavailable right now, so the dashboard cannot generate a reliable action prompt.",
      checklist: [
        "Refresh the dashboard and verify the ticker symbol is correct.",
        "Check the latest news before making any trade decision.",
      ],
    };
  }

  if (snapshot.strongDay && snapshot.aboveTrend && snapshot.nearHigh) {
    return {
      tone: "positive",
      tag: "Breakout watch",
      title: `Review ${stock.symbol} for continuation strength`,
      summary: `${stock.symbol} is trading near the top of its selected range and is holding above its medium trend.`,
      checklist: [
        "Check whether today's move is supported by news or earnings momentum.",
        "If entering, prefer scaling in instead of chasing a single large order.",
        "If you already hold it, review whether you want a trailing stop under the recent breakout area.",
      ],
    };
  }

  if (snapshot.weakDay && snapshot.hasPosition) {
    return {
      tone: "warning",
      tag: "Risk check",
      title: `Review risk on ${stock.symbol}`,
      summary: `${stock.symbol} is under pressure versus its recent trend while you already have position exposure.`,
      checklist: [
        "Review your stop level or invalidation point before the next session.",
        "Consider whether a hedge or a smaller position size makes more sense now.",
        "Read the latest headlines to see whether the weakness is event-driven or broad market noise.",
      ],
    };
  }

  if (snapshot.aboveTrend && snapshot.dayChangePct < 0 && snapshot.mediumTermSlope > 0) {
    return {
      tone: "positive",
      tag: "Pullback watch",
      title: `Watch ${stock.symbol} for a cleaner entry`,
      summary: `${stock.symbol} is still above trend but is pulling back from recent strength, which can be a better review point than chasing green candles.`,
      checklist: [
        "Look for support near the 20-period average or a prior breakout area.",
        "Wait for the pullback to stabilize before adding new size.",
        "Keep news flow in view in case the dip is driven by a fresh catalyst.",
      ],
    };
  }

  if (!snapshot.aboveTrend && snapshot.weakDay && !snapshot.hasPosition) {
    return {
      tone: "warning",
      tag: "Wait",
      title: `Avoid rushing into ${stock.symbol}`,
      summary: `${stock.symbol} is below trend and still weakening, so patience is more useful than forcing an entry.`,
      checklist: [
        "Wait for a base, reclaim, or reversal signal before planning a trade.",
        "Use the market view and benchmark panels to see if weakness is stock-specific or market-wide.",
        "Review earnings timing or company news before putting it back on an entry watch.",
      ],
    };
  }

  if (snapshot.hasPosition && snapshot.dayChangePct > 1.5) {
    return {
      tone: "positive",
      tag: "Manage winner",
      title: `Plan how to manage gains in ${stock.symbol}`,
      summary: `${stock.symbol} is working in your favor, so this is a good time to define profit-taking or hedge rules before emotion takes over.`,
      checklist: [
        "Decide whether to trim partial size into strength or keep holding with a tighter stop.",
        "If the move is extended, consider whether an income or hedge options structure fits your plan.",
        "Compare today's move against recent highs to see if it is approaching resistance.",
      ],
    };
  }

  return {
    tone: "neutral",
    tag: "Hold / wait",
    title: `Keep ${stock.symbol} on review, not on impulse`,
    summary: `${stock.symbol} is not giving a strong directional edge right now, so waiting for a cleaner trigger may be the better move.`,
    checklist: [
      "Watch for a break above resistance or a bounce from support before acting.",
      "Use the latest headlines as a catalyst check rather than trading every small move.",
      "If you hold a position, confirm your risk and target levels are still valid.",
    ],
  };
}

function renderWatchlistActions() {
  if (!actionsRoot) {
    return;
  }

  actionsRoot.replaceChildren();
  const activeStocks = latestChartResults.length ? latestChartResults : filteredWatchlist();
  if (!activeStocks.length) {
    const empty = document.createElement("p");
    empty.className = "decision-empty";
    empty.textContent = `Add a ${currentMarketDescriptor()} ticker to generate watchlist actions.`;
    actionsRoot.appendChild(empty);
    return;
  }

  activeStocks.forEach((stock) => {
    const action = actionIdeasForStock(stock);
    const card = document.createElement("article");
    card.className = `action-card ${actionToneClass(action.tone)}`;

    const header = document.createElement("div");
    header.className = "action-card-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "action-card-copy";

    const symbol = document.createElement("p");
    symbol.className = "action-card-symbol";
    symbol.textContent = action.tag;

    const title = document.createElement("h3");
    title.className = "action-card-title";
    title.textContent =
      stock.label && stock.label !== stock.symbol ? `${stock.label} (${stock.symbol})` : stock.symbol;

    const summary = document.createElement("p");
    summary.className = "action-card-summary";
    summary.textContent = action.title;

    const tag = document.createElement("span");
    tag.className = "action-tag";
    tag.textContent = "Action";

    const checklist = document.createElement("div");
    checklist.className = "action-checklist";
    const reason = document.createElement("p");
    reason.className = "action-check";
    reason.textContent = action.summary;
    checklist.appendChild(reason);
    action.checklist.forEach((item) => {
      const line = document.createElement("p");
      line.className = "action-check";
      line.textContent = item;
      checklist.appendChild(line);
    });

    const meta = document.createElement("p");
    meta.className = "action-card-meta";
    meta.textContent = [
      stock.label && stock.label !== stock.symbol ? stock.label : "",
      stockNewsCount(stock.symbol) ? `${stockNewsCount(stock.symbol)} recent headlines` : "No recent headlines cached",
      normalizeMarket(stock.market),
    ]
      .filter(Boolean)
      .join(" • ");

    titleWrap.append(symbol, title, summary);
    header.append(titleWrap, tag);
    card.append(header, checklist, meta);
    actionsRoot.appendChild(card);
  });
}

function optionIdeasForStock(stock) {
  const snapshot = stockSignalSnapshot(stock);
  if (!snapshot) {
    return [];
  }

  const ideas = [];
  const trendLabel = snapshot.aboveTrend ? "above trend" : "below trend";
  const dayLabel = snapshot.dayChangePct >= 0 ? `up ${snapshot.dayChangePct.toFixed(2)}% today` : `down ${Math.abs(snapshot.dayChangePct).toFixed(2)}% today`;

  ideas.push({
    bias: "bullish",
    strategy: "Bull call spread",
    fit: "Bullish",
    note: `${stock.symbol} is ${trendLabel}. Use a defined-risk bullish structure when you want upside without paying for an open-ended long call.`,
    setup: "Start with 30-60 DTE and consider buying near-the-money while selling a higher strike to reduce premium outlay.",
    risk: "Max loss is the debit paid. Upside is capped at the short strike.",
  });

  ideas.push({
    bias: "bullish",
    strategy: "Cash-secured put",
    fit: "Bullish / income",
    note: `Useful when you would be willing to own ${stock.symbol} on weakness rather than chase it higher immediately.`,
    setup: "Focus on a strike near a support zone or trend average so assignment would happen closer to your desired entry.",
    risk: "You can still be assigned into a falling stock, so only use this if you are comfortable owning shares.",
  });

  if (snapshot.hasPosition) {
    ideas.push({
      bias: "income",
      strategy: "Covered call",
      fit: "Income",
      note: `Because you already hold ${stock.symbol}, a covered call can turn a slower upside view into premium income.`,
      setup: "Look 2-6 weeks out and choose a strike above your desired exit price so assignment aligns with your plan.",
      risk: "You cap your upside if the stock runs through the strike quickly.",
    });

    ideas.push({
      bias: "hedge",
      strategy: "Protective put",
      fit: "Hedge",
      note: `This is the cleanest first hedge when you want to stay long ${stock.symbol} but define downside around a catalyst or weak tape.`,
      setup: "Start with a near-support strike or a delta around 0.25 to 0.40 depending on how much protection you want.",
      risk: "Protection costs premium, which can drag returns if the stock stabilizes instead of falling.",
    });

    ideas.push({
      bias: "hedge",
      strategy: "Collar",
      fit: "Hedge / income",
      note: `A collar can lower hedge cost by financing part of a protective put with a covered call when you are willing to limit upside.`,
      setup: "Pair a put below support with a call above your target exit so the position is protected inside a defined range.",
      risk: "Downside improves, but upside is capped and the trade is more restrictive than holding shares outright.",
    });
  }

  if (!snapshot.aboveTrend || snapshot.weakDay) {
    ideas.push({
      bias: "bearish",
      strategy: "Bear put spread",
      fit: "Bearish",
      note: `${stock.symbol} is showing weaker tape, so a debit put spread gives downside exposure with limited risk.`,
      setup: "Use 30-60 DTE and center the long strike near the breakdown area you expect to fail.",
      risk: "If the stock chops sideways or rebounds, the debit can decay quickly.",
    });
  }

  ideas.push({
    bias: "neutral",
    strategy: "Wait for implied move, then choose direction",
    fit: "Neutral / planning",
    note: `If ${stock.symbol} is not giving a clean signal, the best options idea may be to wait for a clearer setup instead of forcing premium exposure.`,
    setup: "Track earnings, news, and whether price reclaims trend or loses support before choosing bullish or bearish exposure.",
    risk: "The main risk is overtrading low-conviction setups just because options are available.",
  });

  return ideas;
}

function syncOptionsStockSelect() {
  if (!optionsStockSelect) {
    return;
  }

  const stocks = latestChartResults.filter((stock) => !stock.error);
  optionsStockSelect.replaceChildren();

  if (!stocks.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No watchlist stock available";
    optionsStockSelect.appendChild(option);
    optionsStockSelect.disabled = true;
    selectedOptionsSymbol = "";
    return;
  }

  optionsStockSelect.disabled = false;
  if (!selectedOptionsSymbol || !stocks.some((stock) => stock.symbol === selectedOptionsSymbol)) {
    selectedOptionsSymbol = stocks[0].symbol;
  }

  stocks.forEach((stock) => {
    const option = document.createElement("option");
    option.value = stock.symbol;
    option.textContent = stock.label && stock.label !== stock.symbol ? `${stock.symbol} — ${stock.label}` : stock.symbol;
    if (stock.symbol === selectedOptionsSymbol) {
      option.selected = true;
    }
    optionsStockSelect.appendChild(option);
  });
}

function renderOptionsIdeas() {
  if (!optionsIdeasRoot || !optionsSummary) {
    return;
  }

  optionsIdeasRoot.replaceChildren();
  const stocks = latestChartResults.filter((stock) => !stock.error);
  if (!stocks.length) {
    optionsSummary.textContent = `Add a ${currentMarketDescriptor()} ticker with available data to see options ideas.`;
    const empty = document.createElement("p");
    empty.className = "decision-empty";
    empty.textContent = "Options ideas appear here after the dashboard loads valid watchlist charts.";
    optionsIdeasRoot.appendChild(empty);
    return;
  }

  const selectedStock = stocks.find((stock) => stock.symbol === selectedOptionsSymbol) || stocks[0];
  selectedOptionsSymbol = selectedStock.symbol;
  if (optionsStockSelect) {
    optionsStockSelect.value = selectedOptionsSymbol;
  }

  const snapshot = stockSignalSnapshot(selectedStock);
  const selectedBias = optionsBiasSelect?.value || "all";
  const ideas = optionIdeasForStock(selectedStock).filter((idea) => selectedBias === "all" || idea.bias === selectedBias);

  optionsSummary.textContent = `${selectedStock.symbol} is ${snapshot?.aboveTrend ? "above" : "below"} trend, ${snapshot ? (snapshot.dayChangePct >= 0 ? "up" : "down") : "moving"} ${snapshot ? Math.abs(snapshot.dayChangePct).toFixed(2) : "0.00"}% today, and ${snapshot?.hasPosition ? "already has" : "does not have"} a saved position. These are educational setup ideas, not live contract quotes.`;

  if (!ideas.length) {
    const empty = document.createElement("p");
    empty.className = "decision-empty";
    empty.textContent = "No options ideas match the current filter. Switch the strategy focus to see more setups.";
    optionsIdeasRoot.appendChild(empty);
    return;
  }

  ideas.forEach((idea) => {
    const card = document.createElement("article");
    card.className = "options-card";

    const header = document.createElement("div");
    header.className = "options-card-header";

    const title = document.createElement("h3");
    title.className = "options-card-title";
    title.textContent = idea.strategy;

    const pill = document.createElement("span");
    pill.className = `options-pill ${idea.bias}`;
    pill.textContent = idea.fit;

    const note = document.createElement("p");
    note.className = "options-card-note";
    note.textContent = idea.note;

    const setup = document.createElement("p");
    setup.className = "options-card-detail";
    setup.textContent = `Setup: ${idea.setup}`;

    const risk = document.createElement("p");
    risk.className = "options-card-detail";
    risk.textContent = `Risk: ${idea.risk}`;

    header.append(title, pill);
    card.append(header, note, setup, risk);
    optionsIdeasRoot.appendChild(card);
  });
}

function refreshDecisionPanels() {
  renderWatchlistActions();
  syncOptionsStockSelect();
  renderOptionsIdeas();
}

function updateBenchmarkRegionNote() {
  if (!benchmarkRegionNote) {
    return;
  }
  if (currentMarket() === "ALL") {
    benchmarkRegionNote.textContent = "Benchmark View is paused in All mode. Switch to US or SGP for regional comparison.";
    return;
  }
  benchmarkRegionNote.textContent = `Benchmark View is following your ${currentMarketDescriptor()} watchlist region.`;
}

function filteredWatchlist() {
  if (currentMarket() === "ALL") {
    return [...watchlist].sort((left, right) => {
      const leftMarket = normalizeMarket(left.market);
      const rightMarket = normalizeMarket(right.market);
      if (leftMarket !== rightMarket) {
        return leftMarket === "US" ? -1 : 1;
      }
      return left.symbol.localeCompare(right.symbol);
    });
  }
  return watchlist.filter((entry) => normalizeMarket(entry.market) === currentMarket());
}

function initializeMarketSelection() {
  const savedMarket = normalizeMarket(localStorage.getItem(ACTIVE_WATCHLIST_MARKET_STORAGE_KEY) || "US");
  if (marketSelect) {
    marketSelect.value = savedMarket;
  }
  if (watchlistMarketSelect) {
    watchlistMarketSelect.value = savedMarket === "ALL" ? "US" : savedMarket;
  }
}

function clearWatchlistSearchResults() {
  if (!watchlistSearchResults) {
    return;
  }
  watchlistSearchResults.hidden = true;
  watchlistSearchResults.replaceChildren();
}

function renderWatchlistSearchResults(items, query) {
  if (!watchlistSearchResults) {
    return;
  }

  watchlistSearchResults.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "watchlist-search-empty";
    empty.textContent = `No matches found for "${query}".`;
    watchlistSearchResults.appendChild(empty);
    watchlistSearchResults.hidden = false;
    return;
  }

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "watchlist-search-item";

    const topline = document.createElement("div");
    topline.className = "watchlist-search-topline";

    const symbol = document.createElement("span");
    symbol.className = "watchlist-search-symbol";
    symbol.textContent = item.symbol;

    const market = document.createElement("span");
    market.className = "watchlist-search-market";
    market.textContent = item.market === "SG" ? "Singapore" : "US";

    const name = document.createElement("p");
    name.className = "watchlist-search-name";
    name.textContent = item.label || item.symbol;

    const meta = document.createElement("p");
    meta.className = "watchlist-search-meta";
    meta.textContent = [item.exchange, item.type].filter(Boolean).join(" • ");

    topline.append(symbol, market);
    button.append(topline, name);
    if (meta.textContent) {
      button.appendChild(meta);
    }

    button.addEventListener("click", () => {
      if (symbolInput) {
        symbolInput.value = item.symbol;
      }
      if (labelInput) {
        labelInput.value = item.label || item.symbol;
      }
      if (watchlistMarketSelect) {
        watchlistMarketSelect.value = normalizeMarket(item.market);
      }
      clearWatchlistSearchResults();
    });

    watchlistSearchResults.appendChild(button);
  });

  watchlistSearchResults.hidden = false;
}

async function searchWatchlistOptions(query) {
  const cleanedQuery = String(query || "").trim();
  lastWatchlistSearchQuery = cleanedQuery;
  if (cleanedQuery.length < 2) {
    clearWatchlistSearchResults();
    return;
  }

  const response = await fetch(
    `/api/search?q=${encodeURIComponent(cleanedQuery)}&market=${encodeURIComponent(
      normalizeMarket(watchlistMarketSelect?.value || currentMarket())
    )}`
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to search tickers");
  }

  if (lastWatchlistSearchQuery !== cleanedQuery) {
    return;
  }

  renderWatchlistSearchResults(payload.items || [], cleanedQuery);
}

function scheduleWatchlistSearch(query) {
  if (watchlistSearchTimer) {
    window.clearTimeout(watchlistSearchTimer);
  }
  watchlistSearchTimer = window.setTimeout(() => {
    searchWatchlistOptions(query).catch((error) => {
      console.error(error);
      clearWatchlistSearchResults();
    });
  }, 220);
}

function selectedMarketStockCount() {
  return Number(marketStockCountSelect?.value || 12);
}

function setRefreshIntervalVisibility() {
  const isAuto = refreshModeSelect?.value === "auto";
  if (refreshIntervalGroup) {
    refreshIntervalGroup.hidden = !isAuto;
  }
}

async function refreshDashboard() {
  await Promise.all([loadCharts(), loadNews(), loadMarketOverview(), loadSectorDetail()]);
}

function stopAutoRefresh() {
  if (autoRefreshTimer !== null) {
    window.clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  if (!refreshModeSelect || refreshModeSelect.value !== "auto") {
    return;
  }

  const minutes = Number(refreshIntervalInput?.value || 5);
  const intervalMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
  if (refreshIntervalInput) {
    refreshIntervalInput.value = String(intervalMinutes);
  }

  autoRefreshTimer = window.setInterval(() => {
    refreshDashboard().catch(handleError);
  }, intervalMinutes * 60 * 1000);
}

function initializeRefreshControls() {
  const savedMode = localStorage.getItem(REFRESH_MODE_STORAGE_KEY) || "manual";
  const savedInterval = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY) || "5";

  if (refreshModeSelect) {
    refreshModeSelect.value = savedMode;
  }

  if (refreshIntervalInput) {
    refreshIntervalInput.value = savedInterval;
  }

  setRefreshIntervalVisibility();
  startAutoRefresh();
}

function initializeMarketControls() {
  const savedCount = localStorage.getItem(MARKET_STOCK_COUNT_STORAGE_KEY) || "12";
  if (marketStockCountSelect) {
    marketStockCountSelect.value = savedCount;
  }
}

function initializeCollapsibles() {
  collapsiblePanels.forEach((panel) => {
    const key = panel.dataset.collapsible;
    const toggle = panel.querySelector(".panel-toggle");
    const body = panel.querySelector(".panel-body");
    if (!key || !toggle || !body) {
      return;
    }

    const storageKey = `${COLLAPSE_STORAGE_PREFIX}${key}`;
    const savedState = localStorage.getItem(storageKey);
    const isCollapsed = savedState === "collapsed";

    panel.classList.toggle("is-collapsed", isCollapsed);
    toggle.setAttribute("aria-expanded", String(!isCollapsed));

    toggle.addEventListener("click", () => {
      const nextCollapsed = !panel.classList.contains("is-collapsed");
      panel.classList.toggle("is-collapsed", nextCollapsed);
      toggle.setAttribute("aria-expanded", String(!nextCollapsed));
      localStorage.setItem(storageKey, nextCollapsed ? "collapsed" : "expanded");
    });
  });
}

function marketBenchmarks() {
  if (currentMarket() === "ALL") {
    return [];
  }
  return BENCHMARK_SETS[currentMarket()] || BENCHMARK_SETS.US;
}

function activeBenchmarks() {
  return marketBenchmarks().filter((benchmark) => benchmark.enabled);
}

function renderBenchmarkControls() {
  if (!benchmarkControls) {
    return;
  }

  benchmarkControls.replaceChildren();
  updateBenchmarkRegionNote();
  if (!marketBenchmarks().length) {
    const note = document.createElement("p");
    note.className = "news-empty";
    note.textContent = "Select US or SGP in Market view to compare against market benchmarks.";
    benchmarkControls.appendChild(note);
    return;
  }
  marketBenchmarks().forEach((benchmark) => {
    const toggle = document.createElement("label");
    toggle.className = "benchmark-toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = benchmark.enabled;
    input.addEventListener("change", () => {
      benchmark.enabled = input.checked;
      loadCharts().catch(handleError);
    });

    const label = document.createElement("span");
    label.className = "benchmark-toggle-label";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = benchmark.color;

    const text = document.createElement("span");
    text.textContent = benchmark.label;

    label.append(swatch, text);
    toggle.append(input, label);
    benchmarkControls.appendChild(toggle);
  });
}

function friendlyExchangeName(exchange) {
  const mapping = {
    NMS: "NASDAQ",
    NYQ: "NYSE",
    PCX: "NYSE Arca",
    ASE: "NYSE American",
  };
  return mapping[exchange] || exchange;
}
function currencyFormatter(currency) {
  if (!currency) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function displayCurrency() {
  return currencySelect?.value || "USD";
}

function convertCurrency(amount, fromCurrency, toCurrency = displayCurrency()) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return numericAmount;
  }

  const source = String(fromCurrency || "USD").toUpperCase();
  const target = String(toCurrency || "USD").toUpperCase();
  if (source === target) {
    return numericAmount;
  }
  if (source === "USD" && target === "SGD") {
    return numericAmount * usdToSgdRate;
  }
  if (source === "SGD" && target === "USD") {
    return numericAmount / usdToSgdRate;
  }
  return numericAmount;
}

function updateStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function formatPositionInput(position) {
  if (position === null || position === undefined || position === "") {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(Number(position));
}

function formatPositionValue(position, price, currency) {
  if (position === null || position === undefined || position === "") {
    return "Position: -- • Value: --";
  }

  const numericPosition = Number(position);
  const numericPrice = Number(price);
  if (Number.isNaN(numericPosition) || Number.isNaN(numericPrice)) {
    return "Position: -- • Value: --";
  }

  return `Position: ${formatPositionInput(numericPosition)} • Value: ${currencyFormatter(displayCurrency()).format(
    convertCurrency(numericPosition * numericPrice, currency || "USD")
  )}`;
}

function formatPositionSummary(position, averagePrice, price, currency) {
  if (position === null || position === undefined || position === "") {
    return "Shares: -- | Avg: -- | Value: -- | P/L: --";
  }

  const numericPosition = Number(position);
  const numericPrice = Number(price);
  const numericAveragePrice = Number(averagePrice);
  if (Number.isNaN(numericPosition) || Number.isNaN(numericPrice)) {
    return "Shares: -- | Avg: -- | Value: -- | P/L: --";
  }

  const displayFormatter = currencyFormatter(displayCurrency());
  const marketValue = displayFormatter.format(
    convertCurrency(numericPosition * numericPrice, currency || "USD")
  );
  const averagePriceText = Number.isFinite(numericAveragePrice)
    ? displayFormatter.format(convertCurrency(numericAveragePrice, currency || "USD"))
    : "--";

  let profitLossText = "--";
  if (Number.isFinite(numericAveragePrice) && numericAveragePrice > 0) {
    const totalProfitLoss = (numericPrice - numericAveragePrice) * numericPosition;
    const profitLossPercent = ((numericPrice - numericAveragePrice) / numericAveragePrice) * 100;
    const sign = totalProfitLoss > 0 ? "+" : totalProfitLoss < 0 ? "-" : "";
    profitLossText = `${sign}${displayFormatter.format(
      Math.abs(convertCurrency(totalProfitLoss, currency || "USD"))
    )} (${sign}${Math.abs(profitLossPercent).toFixed(2)}%)`;
  }

  return `Shares: ${formatPositionInput(numericPosition)} | Avg: ${averagePriceText} | Value: ${marketValue} | P/L: ${profitLossText}`;
}

function openPositionModal(stock) {
  if (!positionModal || !positionModalInput || !positionModalAveragePriceInput || !positionModalSymbol) {
    return;
  }

  activePositionTarget = { symbol: stock.symbol, market: normalizeMarket(stock.market) };
  positionModalSymbol.textContent = `${stock.symbol}${stock.label && stock.label !== stock.symbol ? ` • ${stock.label}` : ""} • ${normalizeMarket(stock.market)}`;
  positionModalInput.value = formatPositionInput(stock.position);
  positionModalAveragePriceInput.value = formatPositionInput(stock.averagePrice);
  positionModal.hidden = false;
  document.body.style.overflow = "hidden";
  positionModalInput.focus();
  positionModalInput.select();
}

function closePositionModal() {
  if (!positionModal) {
    return;
  }

  positionModal.hidden = true;
  document.body.style.overflow = "";
  activePositionTarget = null;
}

function openControlsModal() {
  if (!controlsModal) {
    return;
  }

  controlsModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeControlsModal() {
  if (!controlsModal) {
    return;
  }

  controlsModal.hidden = true;
  if (positionModal?.hidden !== false) {
    document.body.style.overflow = "";
  }
}

async function savePositionForSymbol(symbol, market, rawValue) {
  const nextPosition = rawValue === "" ? null : Number(rawValue);

  if (rawValue !== "" && Number.isNaN(nextPosition)) {
    throw new Error(`Position for ${symbol} must be a valid number.`);
  }

  watchlist = watchlist.map((entry) =>
    entry.symbol === symbol && normalizeMarket(entry.market) === normalizeMarket(market)
      ? {
          ...entry,
          ...(nextPosition === null ? { position: undefined } : { position: nextPosition }),
        }
      : entry
  );

  await saveWatchlist();
  return nextPosition;
}

async function savePositionDetailsForSymbol(symbol, market, rawValue, rawAveragePriceValue) {
  const nextPosition = rawValue === "" ? null : Number(rawValue);
  const nextAveragePrice = rawAveragePriceValue === "" ? null : Number(rawAveragePriceValue);

  if (rawValue !== "" && Number.isNaN(nextPosition)) {
    throw new Error(`Shares for ${symbol} must be a valid number.`);
  }
  if (rawAveragePriceValue !== "" && Number.isNaN(nextAveragePrice)) {
    throw new Error(`Average price for ${symbol} must be a valid number.`);
  }

  watchlist = watchlist.map((entry) =>
    entry.symbol === symbol && normalizeMarket(entry.market) === normalizeMarket(market)
      ? {
          ...entry,
          ...(nextPosition === null ? { position: undefined } : { position: nextPosition }),
          ...(nextAveragePrice === null ? { averagePrice: undefined } : { averagePrice: nextAveragePrice }),
        }
      : entry
  );

  await saveWatchlist();
  return { position: nextPosition, averagePrice: nextAveragePrice };
}

function currentRangeLabel() {
  return RANGE_LABELS[rangeSelect.value] || rangeSelect.value;
}

function syncRangeControls(activeValue) {
  if (rangeSelect && rangeSelect.value !== activeValue) {
    rangeSelect.value = activeValue;
  }
  if (benchmarkRangeSelect && benchmarkRangeSelect.value !== activeValue) {
    benchmarkRangeSelect.value = activeValue;
  }
}

function updateRange(activeValue) {
  syncRangeControls(activeValue);
  loadCharts().catch(handleError);
}

function formatChange(value, pct, currency) {
  if (value === null || pct === null) {
    return "Change from yesterday: --";
  }

  if (changeModeSelect && changeModeSelect.value === "value") {
    const sign = value > 0 ? "+" : "";
    return `Change from yesterday: ${sign}${currencyFormatter(displayCurrency()).format(
      Math.abs(convertCurrency(value, currency || "USD"))
    )}`;
  }

  const sign = value > 0 ? "+" : "";
  return `Change from yesterday: ${sign}${pct.toFixed(2)}%`;
}

function formatPremarket(change, pct, price, marketState, currency) {
  if (change === null || change === undefined || pct === null || pct === undefined) {
    return "Premarket: --";
  }

  if (changeModeSelect && changeModeSelect.value === "value") {
    const sign = change > 0 ? "+" : "";
    const valueText = `${sign}${currencyFormatter(displayCurrency()).format(Math.abs(convertCurrency(change, currency || "USD")))}`;
    const priceText =
      price === null || price === undefined
        ? ""
        : ` at ${currencyFormatter(displayCurrency()).format(convertCurrency(Number(price), currency || "USD"))}`;
    return `Premarket: ${valueText}${priceText}`;
  }

  const sign = change > 0 ? "+" : "";
  const stateText = marketState ? ` (${String(marketState).toLowerCase()})` : "";
  return `Premarket: ${sign}${pct.toFixed(2)}%${stateText}`;
}

function formatLiveStatus(stock) {
  if (stock.isLive) {
    return `Live quote source: ${stock.dataSource || "Yahoo Finance"}`;
  }
  return `Using end-of-day fallback: ${stock.dataSource || "Unknown"}`;
}

function liveBadgeLabel(stock) {
  return stock.isLive ? "LIVE" : "EOD";
}

function formatNewsTimestamp(value) {
  if (!value) {
    return "";
  }

  const publishedAt = new Date(value);
  if (Number.isNaN(publishedAt.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(publishedAt);
}

function formatSignedPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }
  const numericValue = Number(value);
  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(2)}%`;
}

function interpolateColor(startColor, endColor, ratio) {
  return startColor.map((channel, index) =>
    Math.round(channel + (endColor[index] - channel) * ratio)
  );
}

function heatTileStyle(dayChangePct) {
  const numericValue = Number(dayChangePct);
  if (!Number.isFinite(numericValue)) {
    return "";
  }

  const intensity = Math.min(Math.abs(numericValue) / 6, 1);
  if (numericValue > 0) {
    const top = interpolateColor([34, 78, 48], [49, 255, 112], intensity);
    const bottom = interpolateColor([18, 42, 28], [0, 132, 45], intensity);
    return `background: linear-gradient(160deg, rgb(${top.join(", ")}), rgb(${bottom.join(", ")})); border-color: transparent; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06); color: #f7fff9;`;
  }
  if (numericValue < 0) {
    const top = interpolateColor([88, 34, 34], [255, 72, 72], intensity);
    const bottom = interpolateColor([46, 18, 18], [148, 0, 0], intensity);
    return `background: linear-gradient(160deg, rgb(${top.join(", ")}), rgb(${bottom.join(", ")})); border-color: transparent; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06); color: #fff7f7;`;
  }
  return "background: linear-gradient(160deg, rgb(78, 86, 93), rgb(44, 49, 54)); border-color: transparent; color: #f3f5f7;";
}

function sectorTileSizeClass(stock, index, totalCount) {
  const move = Math.abs(Number(stock.dayChangePct ?? 0));
  if (index < 2 || move >= 4) {
    return "sector-stock-tile-xl";
  }
  if (index < 6 || move >= 2.25) {
    return "sector-stock-tile-lg";
  }
  if (index < 14 || totalCount <= 12) {
    return "sector-stock-tile-md";
  }
  return "sector-stock-tile-sm";
}

function renderNews(groups) {
  if (!newsGroupsRoot) {
    return;
  }

  newsGroupsRoot.replaceChildren();

  if (!filteredWatchlist().length) {
    const emptyState = document.createElement("p");
    emptyState.className = "news-empty";
    emptyState.textContent = `Add a ${currentMarketDescriptor()} ticker to start seeing recent watchlist headlines.`;
    newsGroupsRoot.appendChild(emptyState);
    return;
  }

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "news-group";

    const toggle = document.createElement("button");
    toggle.className = "news-group-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");

    const header = document.createElement("div");
    header.className = "news-group-header";

    const title = document.createElement("h3");
    title.className = "news-group-title";
    title.textContent = group.symbol;

    const subtitle = document.createElement("p");
    subtitle.className = "news-group-subtitle";
    subtitle.textContent = group.label || group.symbol;

    header.append(title, subtitle);

    const icon = document.createElement("span");
    icon.className = "news-group-icon";
    icon.setAttribute("aria-hidden", "true");

    toggle.append(header, icon);
    section.appendChild(toggle);

    if (group.error) {
      const error = document.createElement("p");
      error.className = "news-empty";
      error.textContent = group.error;
      error.hidden = true;
      section.appendChild(error);
      toggle.addEventListener("click", () => {
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isExpanded));
        section.classList.toggle("is-expanded", !isExpanded);
        error.hidden = isExpanded;
      });
      newsGroupsRoot.appendChild(section);
      return;
    }

    if (!Array.isArray(group.items) || !group.items.length) {
      const empty = document.createElement("p");
      empty.className = "news-empty";
      empty.textContent = `No recent headlines found for ${group.symbol}.`;
      empty.hidden = true;
      section.appendChild(empty);
      toggle.addEventListener("click", () => {
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isExpanded));
        section.classList.toggle("is-expanded", !isExpanded);
        empty.hidden = isExpanded;
      });
      newsGroupsRoot.appendChild(section);
      return;
    }

    const list = document.createElement("div");
    list.className = "news-list";
    list.hidden = true;

    group.items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "news-item";

      const link = document.createElement("a");
      link.className = "news-link";
      link.href = item.link;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = item.title;

      const meta = document.createElement("p");
      meta.className = "news-meta";
      meta.textContent = [item.source, formatNewsTimestamp(item.publishedAt)].filter(Boolean).join(" • ");

      article.append(link, meta);
      list.appendChild(article);
    });

    section.appendChild(list);
    toggle.addEventListener("click", () => {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isExpanded));
      section.classList.toggle("is-expanded", !isExpanded);
      list.hidden = isExpanded;
    });
    newsGroupsRoot.appendChild(section);
  });
}

async function loadNews() {
  if (!newsGroupsRoot) {
    return;
  }

  if (!filteredWatchlist().length) {
    renderNews([]);
    return;
  }

  const response = await fetch(`/api/news?market=${encodeURIComponent(currentMarket())}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load watchlist news");
  }

  latestNewsGroups = payload.groups || [];
  renderNews(latestNewsGroups);
  renderWatchlistActions();
}

async function loadVersion() {
  const versionNodes = [appVersionNode, appVersionFooterNode].filter(Boolean);
  if (!versionNodes.length) {
    return;
  }

  try {
    const response = await fetch("/api/version");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load version");
    }
    versionNodes.forEach((node) => {
      node.textContent = payload.display || "";
      node.title = payload.commit ? `Commit ${payload.commit}` : "";
    });
  } catch (error) {
    console.warn("Unable to load app version.", error);
    versionNodes.forEach((node) => {
      node.textContent = "";
      node.title = "";
    });
  }
}

function renderMarketOverview(segments) {
  if (!marketGroupsRoot || !marketSummary) {
    return;
  }

  marketGroupsRoot.replaceChildren();

  const availableSegments = (segments || []).filter(
    (segment) => segment.dayChangePct !== null && segment.dayChangePct !== undefined
  );
  if (!availableSegments.length) {
    marketSummary.textContent = "Market overview is unavailable right now.";
    return;
  }

  const positiveCount = availableSegments.filter((segment) => Number(segment.dayChangePct) > 0).length;
  const negativeCount = availableSegments.filter((segment) => Number(segment.dayChangePct) < 0).length;
  const flatCount = availableSegments.length - positiveCount - negativeCount;
  marketSummary.textContent = `${positiveCount} segments green • ${negativeCount} segments red • ${flatCount} flat`;

  const groupedSegments = new Map();
  (segments || []).forEach((segment) => {
    const key = segment.group || "Other";
    const bucket = groupedSegments.get(key) || [];
    bucket.push(segment);
    groupedSegments.set(key, bucket);
  });

  groupedSegments.forEach((items, groupName) => {
    const groupSection = document.createElement("section");
    groupSection.className = "market-group";

    const groupTitle = document.createElement("h3");
    groupTitle.className = "market-group-title";
    groupTitle.textContent = groupName;
    groupSection.appendChild(groupTitle);

    const grid = document.createElement("div");
    grid.className = "market-grid";

    items.forEach((segment) => {
      const isDrilldownTile = MARKET_DRILLDOWN_SYMBOLS.has(segment.symbol);
      const tile = document.createElement(isDrilldownTile ? "button" : "article");
      tile.className = "market-tile";
      if (isDrilldownTile) {
        tile.type = "button";
        tile.classList.add("market-tile-button");
        if (selectedMarketSector === segment.symbol) {
          tile.classList.add("active");
        }
        tile.addEventListener("click", () => {
          const nextSelection = selectedMarketSector === segment.symbol ? null : segment.symbol;
          selectedMarketSector = nextSelection;
          renderMarketOverview(segments);
          loadSectorDetail().catch(handleError);
        });
      }
      if (segment.dayChangePct !== null && segment.dayChangePct !== undefined) {
        tile.style.cssText = heatTileStyle(segment.dayChangePct);
      }

      const label = document.createElement("p");
      label.className = "market-tile-label";
      label.textContent = segment.label;

      const symbol = document.createElement("p");
      symbol.className = "market-tile-symbol";
      symbol.textContent = segment.symbol;

      const change = document.createElement("p");
      change.className = "market-tile-change";
      change.textContent = formatSignedPercent(segment.dayChangePct);

      const meta = document.createElement("p");
      meta.className = "market-tile-meta";
      meta.textContent = segment.error
        ? segment.error
        : [segment.price ? currencyFormatter("USD").format(Number(segment.price)) : null, segment.dataSource]
            .filter(Boolean)
            .join(" • ");

      tile.append(label, symbol, change, meta);
      grid.appendChild(tile);
    });

    groupSection.appendChild(grid);
    marketGroupsRoot.appendChild(groupSection);
  });
}

async function loadMarketOverview() {
  if (!marketGroupsRoot || !marketSummary) {
    return;
  }

  marketSummary.textContent = "Loading market overview…";
  const response = await fetch("/api/market-overview");
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load market overview");
  }

  renderMarketOverview(payload.segments || []);
  const sectorSymbols = new Set(
    (payload.segments || []).filter((segment) => MARKET_DRILLDOWN_SYMBOLS.has(segment.symbol)).map((segment) => segment.symbol)
  );
  if (selectedMarketSector && !sectorSymbols.has(selectedMarketSector)) {
    selectedMarketSector = null;
  }
  await loadSectorDetail();
}

async function loadSectorDetail() {
  if (!sectorDetailRoot) {
    return;
  }

  if (!selectedMarketSector) {
    renderSectorDetail(null);
    return;
  }

  sectorDetailRoot.hidden = false;
  sectorDetailRoot.textContent = "Loading sector stock map…";
  const response = await fetch(
    `/api/market-sector?symbol=${encodeURIComponent(selectedMarketSector)}&count=${encodeURIComponent(
      selectedMarketStockCount()
    )}`
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load sector stock map");
  }

  renderSectorDetail(payload);
}

function renderSectorDetail(payload) {
  if (!sectorDetailRoot) {
    return;
  }

  if (!payload || !selectedMarketSector) {
    sectorDetailRoot.hidden = true;
    sectorDetailRoot.replaceChildren();
    return;
  }

  sectorDetailRoot.hidden = false;
  sectorDetailRoot.replaceChildren();

  const header = document.createElement("div");
  header.className = "sector-detail-header";

  const title = document.createElement("h3");
  title.className = "sector-detail-title";
  title.textContent = `${payload.sectorLabel} stock map`;

  const note = document.createElement("p");
  note.className = "sector-detail-note";
  note.textContent = "Representative stocks inside the selected market segment.";

  header.append(title, note);

  const grid = document.createElement("div");
  grid.className = "market-grid sector-stock-grid";

  const sortedStocks = (payload.stocks || [])
    .slice()
    .sort((left, right) => {
      const leftValue = Number(left.dayChangePct ?? -999);
      const rightValue = Number(right.dayChangePct ?? -999);
      return rightValue - leftValue;
    });

  sortedStocks.forEach((stock, index) => {
    const tile = document.createElement("article");
    tile.className = `market-tile sector-stock-tile ${sectorTileSizeClass(stock, index, sortedStocks.length)}`;
    if (stock.dayChangePct !== null && stock.dayChangePct !== undefined) {
      tile.style.cssText = heatTileStyle(stock.dayChangePct);
    }

    const label = document.createElement("p");
    label.className = "market-tile-label";
    label.textContent = stock.label;

    const symbol = document.createElement("p");
    symbol.className = "market-tile-symbol";
    symbol.textContent = stock.symbol;

    const change = document.createElement("p");
    change.className = "market-tile-change";
    change.textContent = formatSignedPercent(stock.dayChangePct);

    const meta = document.createElement("p");
    meta.className = "market-tile-meta";
    meta.textContent = stock.error
      ? stock.error
      : [stock.price ? currencyFormatter("USD").format(Number(stock.price)) : null, stock.dataSource]
          .filter(Boolean)
          .join(" • ");

    tile.append(label, symbol, change, meta);
    grid.appendChild(tile);
    });

  sectorDetailRoot.append(header, grid);
}

function buildChart(points, positiveTrend) {
  const width = 360;
  const height = 140;
  const padding = 12;
  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const chartPoints = points.map((point, index) => {
    const x = padding + index * stepX;
    const y = height - padding - ((point.close - min) / spread) * (height - padding * 2);
    return [x, y];
  });

  const linePath = chartPoints
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const fillPath = `${linePath} L ${(width - padding).toFixed(2)} ${(height - padding).toFixed(
    2
  )} L ${padding.toFixed(2)} ${(height - padding).toFixed(2)} Z`;

  const stroke = positiveTrend ? "#1f6f5f" : "#b2432f";
  const fill = positiveTrend ? "rgba(31, 111, 95, 0.22)" : "rgba(178, 67, 47, 0.20)";

  return { linePath, fillPath, stroke, fill };
}

function timestampToChartX(timestamp, width, padding, minTimestamp, maxTimestamp) {
  if (maxTimestamp <= minTimestamp) {
    return width / 2;
  }
  const ratio = (Number(timestamp) - minTimestamp) / (maxTimestamp - minTimestamp);
  return padding + ratio * (width - padding * 2);
}

function chartXToTimestamp(x, width, padding, minTimestamp, maxTimestamp) {
  if (maxTimestamp <= minTimestamp) {
    return minTimestamp;
  }
  const ratio = (x - padding) / (width - padding * 2);
  return minTimestamp + ratio * (maxTimestamp - minTimestamp);
}

function pointCloseToChartY(close, height, padding, min, max) {
  const spread = Math.max(max - min, 1);
  return height - padding - ((Number(close) - min) / spread) * (height - padding * 2);
}

function buildLinePath(points, width, height, padding, min, max, minTimestamp, maxTimestamp) {
  return points
    .map((point, index) => {
      const x = timestampToChartX(point.timestamp, width, padding, minTimestamp, maxTimestamp);
      const y = pointCloseToChartY(point.close, height, padding, min, max);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function normalizeSeries(points) {
  if (!Array.isArray(points) || !points.length) {
    return [];
  }

  const base = points[0].close;
  if (!base) {
    return [];
  }

  return points.map((point) => ({
    timestamp: point.timestamp,
    close: Number(((point.close / base) * 100).toFixed(2)),
  }));
}

function buildAverageSeries(stocks) {
  const buckets = new Map();

  stocks.forEach((stock) => {
    normalizeSeries(stock.points).forEach((point) => {
      const bucket = buckets.get(point.timestamp) || { total: 0, count: 0 };
      bucket.total += point.close;
      bucket.count += 1;
      buckets.set(point.timestamp, bucket);
    });
  });

  return Array.from(buckets.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([timestamp, bucket]) => ({
      timestamp,
      close: Number((bucket.total / bucket.count).toFixed(2)),
    }));
}

function renderLegend(items) {
  overviewLegend.replaceChildren();
  items.forEach((item) => {
    const legendItem = document.createElement("span");
    legendItem.className = "legend-item";
    const legendSwatch = document.createElement("span");
    legendSwatch.className = "legend-swatch";
    legendSwatch.style.background = item.color;
    const legendLabel = document.createElement("span");
    legendLabel.textContent = item.label;
    legendItem.append(legendSwatch, legendLabel);
    overviewLegend.appendChild(legendItem);
  });
}

function formatOverviewDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Number(timestamp) * 1000));
}

function formatNormalizedPercent(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "--";
  }
  const performance = numericValue - 100;
  const sign = performance > 0 ? "+" : "";
  return `${sign}${performance.toFixed(2)}%`;
}

function findNearestSeriesPoint(series, timestamp) {
  if (!Array.isArray(series?.points) || !series.points.length) {
    return null;
  }

  let nearest = series.points[0];
  let nearestDistance = Math.abs(Number(nearest.timestamp) - Number(timestamp));
  for (const point of series.points) {
    const distance = Math.abs(Number(point.timestamp) - Number(timestamp));
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function hideOverviewTooltip() {
  if (!overviewTooltip) {
    return;
  }
  overviewTooltip.hidden = true;
  overviewChart.querySelector(".overview-hover-line")?.remove();
  overviewChart.querySelectorAll(".overview-hover-dot").forEach((node) => node.remove());
}

function showOverviewTooltip(
  seriesCollection,
  width,
  height,
  padding,
  min,
  max,
  minTimestamp,
  maxTimestamp,
  event
) {
  if (!overviewTooltip || !seriesCollection.length) {
    return;
  }

  const rect = overviewChart.getBoundingClientRect();
  const relativeX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const xRatio = rect.width ? relativeX / rect.width : 0;
  const chartX = padding + xRatio * (width - padding * 2);
  const primaryPoints = seriesCollection[0].points;
  if (!primaryPoints.length) {
    hideOverviewTooltip();
    return;
  }

  const targetTimestamp = chartXToTimestamp(chartX, width, padding, minTimestamp, maxTimestamp);
  const anchorPoint = findNearestSeriesPoint(seriesCollection[0], targetTimestamp);
  if (!anchorPoint) {
    hideOverviewTooltip();
    return;
  }

  const anchorX = timestampToChartX(anchorPoint.timestamp, width, padding, minTimestamp, maxTimestamp);
  const pointsForTooltip = seriesCollection
    .map((series) => {
      const point = findNearestSeriesPoint(series, anchorPoint.timestamp);
      if (!point) {
        return null;
      }
      const x = timestampToChartX(point.timestamp, width, padding, minTimestamp, maxTimestamp);
      const y = pointCloseToChartY(point.close, height, padding, min, max);
      return { ...series, point, x, y };
    })
    .filter(Boolean);

  overviewChart.querySelector(".overview-hover-line")?.remove();
  overviewChart.querySelectorAll(".overview-hover-dot").forEach((node) => node.remove());

  const hoverLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  hoverLine.setAttribute("class", "overview-hover-line");
  hoverLine.setAttribute("x1", anchorX.toFixed(2));
  hoverLine.setAttribute("x2", anchorX.toFixed(2));
  hoverLine.setAttribute("y1", String(padding));
  hoverLine.setAttribute("y2", String(height - padding));
  overviewChart.appendChild(hoverLine);

  pointsForTooltip.forEach((item) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("class", "overview-hover-dot");
    dot.setAttribute("cx", item.x.toFixed(2));
    dot.setAttribute("cy", item.y.toFixed(2));
    dot.setAttribute("r", "4.5");
    dot.setAttribute("fill", item.color);
    overviewChart.appendChild(dot);
  });

  const tooltipRows = pointsForTooltip
    .map(
      (item) =>
        `<div class="overview-tooltip-row"><span class="overview-tooltip-swatch" style="background:${item.color}"></span><span>${item.label}</span><strong>${formatNormalizedPercent(item.point.close)}</strong></div>`
    )
    .join("");

  overviewTooltip.innerHTML = `<p class="overview-tooltip-date">${formatOverviewDate(anchorPoint.timestamp)}</p>${tooltipRows}`;
  overviewTooltip.hidden = false;

  const tooltipX = rect.left + (anchorX / width) * rect.width;
  const prefersRight = relativeX < rect.width * 0.65;
  const left = prefersRight ? relativeX + 18 : relativeX - 230;
  const top = Math.max(12, (anchorPoint ? event.clientY - rect.top : 0) - 18);
  overviewTooltip.style.left = `${Math.max(10, Math.min(left, rect.width - 220))}px`;
  overviewTooltip.style.top = `${Math.min(top, rect.height - 20)}px`;
}

function renderOverview(stocks, benchmarks) {
  overviewChart.replaceChildren();
  hideOverviewTooltip();
  const availableStocks = stocks.filter((stock) => !stock.error && Array.isArray(stock.points) && stock.points.length);
  const totalValue = availableStocks.reduce((sum, stock) => {
    const position = Number(stock.position);
    if (Number.isNaN(position)) {
      return sum;
    }
    return sum + convertCurrency(position * Number(stock.price || 0), stock.currency || "USD", "USD");
  }, 0);
  overviewTotalValue.textContent = `Total watchlist value: ${currencyFormatter(displayCurrency()).format(
    convertCurrency(totalValue, "USD")
  )}`;
  const averageSeries = buildAverageSeries(availableStocks);
  const benchmarkSeries = (benchmarks || [])
    .filter((benchmark) => !benchmark.error && Array.isArray(benchmark.points) && benchmark.points.length)
    .map((benchmark) => ({ ...benchmark, points: normalizeSeries(benchmark.points) }))
    .filter((benchmark) => benchmark.points.length);

  if (!availableStocks.length || !averageSeries.length) {
    renderLegend([]);
    if (!availableStocks.length) {
      overviewTotalValue.textContent = "Total watchlist value: --";
    }
    overviewSummary.textContent = "Add stocks with available data to see your watchlist trend.";
    return;
  }

  const width = 960;
  const height = 320;
  const padding = 24;
  const allTimestampValues = [
    ...averageSeries.map((point) => Number(point.timestamp)),
    ...benchmarkSeries.flatMap((series) => series.points.map((point) => Number(point.timestamp))),
  ].filter(Number.isFinite);
  const values = [...averageSeries, ...benchmarkSeries.flatMap((series) => series.points)].map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const minTimestamp = Math.min(...allTimestampValues);
  const maxTimestamp = Math.max(...allTimestampValues);

  for (let index = 0; index < 4; index += 1) {
    const y = padding + ((height - padding * 2) / 3) * index;
    const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
    grid.setAttribute("class", index === 3 ? "overview-baseline" : "overview-grid");
    grid.setAttribute("x1", String(padding));
    grid.setAttribute("x2", String(width - padding));
    grid.setAttribute("y1", y.toFixed(2));
    grid.setAttribute("y2", y.toFixed(2));
    overviewChart.appendChild(grid);
  }

  [
    { label: "Watchlist average", color: WATCHLIST_AVERAGE_COLOR, points: averageSeries },
    ...benchmarkSeries.map((series) => ({
      label: series.shortLabel,
      color: series.color,
      points: series.points,
    })),
  ].forEach((series) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "overview-line");
    path.setAttribute("stroke", series.color);
    path.setAttribute(
      "d",
      buildLinePath(series.points, width, height, padding, min, max, minTimestamp, maxTimestamp)
    );
    overviewChart.appendChild(path);
  });

  const interactiveSeries = [
    { label: "Watchlist average", color: WATCHLIST_AVERAGE_COLOR, points: averageSeries },
    ...benchmarkSeries.map((series) => ({
      label: series.shortLabel,
      color: series.color,
      points: series.points,
    })),
  ];

  overviewChart.onmousemove = (event) =>
    showOverviewTooltip(
      interactiveSeries,
      width,
      height,
      padding,
      min,
      max,
      minTimestamp,
      maxTimestamp,
      event
    );
  overviewChart.onmouseleave = () => hideOverviewTooltip();

  renderLegend([
    { label: "Watchlist average", color: WATCHLIST_AVERAGE_COLOR },
    ...benchmarkSeries.map((series) => ({ label: series.shortLabel, color: series.color })),
  ]);

  if (!benchmarkSeries.length) {
    overviewSummary.textContent = `Showing your ${currentMarketDescriptor()} watchlist trend over ${currentRangeLabel()}. Turn on a benchmark to compare it against the market.`;
    return;
  }

  const watchlistLast = averageSeries.at(-1)?.close ?? 0;
  const comparisons = benchmarkSeries.map((series) => {
    const benchmarkLast = series.points.at(-1)?.close ?? 0;
    const spread = Number((watchlistLast - benchmarkLast).toFixed(2));
    if (spread === 0) {
      return `in line with ${series.label}`;
    }
    return `${Math.abs(spread).toFixed(2)} points ${spread > 0 ? "ahead of" : "behind"} ${series.label}`;
  });
  overviewSummary.textContent = `Over ${currentRangeLabel()}, your ${currentMarketDescriptor()} watchlist is ${comparisons.join(" • ")}.`;
}

async function getWatchlist() {
  const response = await fetch("/api/watchlist");
  if (!response.ok) {
    throw new Error("Unable to load watchlist");
  }

  const payload = await response.json();
  watchlist = (payload.symbols || []).map((entry) => ({
    ...entry,
    market: normalizeMarket(entry.market),
  }));
  return watchlist;
}

async function saveWatchlist() {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols: watchlist }),
  });

  if (!response.ok) {
    throw new Error("Unable to save watchlist");
  }
}

async function loadCharts() {
  cardsRoot.innerHTML = "";
  const activeWatchlist = filteredWatchlist();
  if (!activeWatchlist.length) {
    latestChartResults = [];
    overviewTotalValue.textContent = "Total watchlist value: --";
    renderOverview([], []);
    refreshDecisionPanels();
    updateStatus(`Your ${currentMarketDescriptor()} watchlist is empty. Add a ticker to get started.`);
    return;
  }

  updateStatus(`Refreshing ${activeWatchlist.length} ${currentMarketDescriptor()} stock${activeWatchlist.length === 1 ? "" : "s"}...`);

  const range = rangeSelect.value;
  const tasks = activeWatchlist.map(async (entry) => {
    const response = await fetch(`/api/chart?symbol=${encodeURIComponent(entry.symbol)}&range=${range}`);
    const payload = await response.json();
    if (!response.ok) {
      return { ...entry, error: payload.error || "Unknown error" };
    }

    return { ...entry, ...payload };
  });

  const benchmarkTasks = activeBenchmarks().map((benchmark) =>
    fetch(`/api/chart?symbol=${encodeURIComponent(benchmark.symbol)}&range=${range}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          return { ...benchmark, error: payload.error || "Unknown error" };
        }
        return { ...benchmark, ...payload };
      })
      .catch((error) => ({ ...benchmark, error: error.message || "Unknown error" }))
  );

  const [results, benchmarks] = await Promise.all([Promise.all(tasks), Promise.all(benchmarkTasks)]);
  latestChartResults = results;
  renderOverview(results, benchmarks);
  results.forEach(renderCard);
  refreshDecisionPanels();
  updateStatus(
    `Showing ${results.length} ${currentMarketDescriptor()} chart${results.length === 1 ? "" : "s"} for ${currentRangeLabel()}.`
  );
}

function renderCard(stock) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelector(".stock-label").textContent = stock.label || stock.symbol;
  node.querySelector(".stock-symbol").textContent = stock.symbol;
  const positionButton = node.querySelector(".stock-position-button");
  const positionValue = node.querySelector(".stock-position-value");
  const premarketNode = node.querySelector(".stock-premarket");
  const liveStatusNode = node.querySelector(".stock-live-status");
  const liveBadgeNode = node.querySelector(".stock-live-badge");
  positionValue.textContent = formatPositionSummary(
    stock.position,
    stock.averagePrice,
    stock.price,
    stock.currency
  );
  premarketNode.textContent = formatPremarket(
    stock.preMarketChange,
    stock.preMarketChangePct,
    stock.preMarketPrice,
    stock.marketState,
    stock.currency
  );
  liveStatusNode.textContent = formatLiveStatus(stock);
  liveBadgeNode.textContent = liveBadgeLabel(stock);
  liveBadgeNode.classList.add(stock.isLive ? "live" : "eod");

  const removeButton = node.querySelector(".remove-button");
  removeButton.addEventListener("click", async () => {
    watchlist = watchlist.filter(
      (entry) => !(entry.symbol === stock.symbol && normalizeMarket(entry.market) === normalizeMarket(stock.market))
    );
    await saveWatchlist();
    await loadNews();
    await loadCharts();
  });

  positionButton.addEventListener("click", () => openPositionModal(stock));

  if (stock.error) {
    node.querySelector(".stock-price").textContent = "Unavailable";
    node.querySelector(".stock-change").textContent = stock.error;
    node.querySelector(".stock-change").classList.add("negative");
    node.querySelector(".stock-meta").textContent = "Check the symbol or your network connection.";
    positionValue.textContent = formatPositionSummary(
      stock.position,
      stock.averagePrice,
      stock.price,
      stock.currency
    );
    premarketNode.textContent = "Premarket: --";
    liveStatusNode.textContent = "";
    liveBadgeNode.textContent = "";
    liveBadgeNode.classList.remove("live", "eod");
    node.querySelector(".chart").replaceChildren();
    cardsRoot.appendChild(node);
    return;
  }

  const displayFormatter = currencyFormatter(displayCurrency());
  const positiveTrend = (stock.dayChange || 0) >= 0;
  const chart = buildChart(stock.points, positiveTrend);

  node.querySelector(".stock-price").textContent = displayFormatter.format(
    convertCurrency(stock.price, stock.currency || "USD")
  );
  const changeNode = node.querySelector(".stock-change");
  changeNode.textContent = formatChange(stock.dayChange, stock.dayChangePct, stock.currency);
  changeNode.classList.add(positiveTrend ? "positive" : "negative");
  node.querySelector(".stock-meta").textContent = [
    friendlyExchangeName(stock.exchange),
    stock.currency || displayCurrency(),
    normalizeMarket(stock.market),
  ]
    .filter(Boolean)
    .join(" • ");
  positionValue.textContent = formatPositionSummary(
    stock.position,
    stock.averagePrice,
    stock.price,
    stock.currency
  );
  premarketNode.textContent = formatPremarket(
    stock.preMarketChange,
    stock.preMarketChangePct,
    stock.preMarketPrice,
    stock.marketState,
    stock.currency
  );
  liveStatusNode.textContent = formatLiveStatus(stock);

  const svg = node.querySelector(".chart");
  const fillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  fillPath.setAttribute("class", "fill");
  fillPath.setAttribute("d", chart.fillPath);
  fillPath.setAttribute("fill", chart.fill);

  const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  linePath.setAttribute("class", "line");
  linePath.setAttribute("d", chart.linePath);
  linePath.setAttribute("stroke", chart.stroke);

  svg.replaceChildren(fillPath, linePath);
  cardsRoot.appendChild(node);
}

watchlistForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(watchlistForm);
  const symbol = String(formData.get("symbol") || "").trim().toUpperCase();
  const label = String(formData.get("label") || "").trim() || symbol;
  const market = normalizeMarket(String(formData.get("market") || currentMarket()));

  if (!symbol) {
    updateStatus("Please enter a ticker symbol.", true);
    return;
  }

  if (watchlist.some((entry) => entry.symbol === symbol && normalizeMarket(entry.market) === market)) {
    updateStatus(`${symbol} is already on your ${market === "SG" ? "Singapore" : "US"} watchlist.`, true);
    return;
  }

  watchlist = [...watchlist, { symbol, label, market }];
  await saveWatchlist();
  watchlistForm.reset();
  if (watchlistMarketSelect) {
    watchlistMarketSelect.value = currentMarket();
  }
  clearWatchlistSearchResults();
  await loadNews();
  await loadCharts();
});

symbolInput?.addEventListener("input", () => {
  scheduleWatchlistSearch(symbolInput.value);
});

labelInput?.addEventListener("input", () => {
  scheduleWatchlistSearch(labelInput.value);
});

symbolInput?.addEventListener("blur", () => {
  window.setTimeout(clearWatchlistSearchResults, 150);
});

labelInput?.addEventListener("blur", () => {
  window.setTimeout(clearWatchlistSearchResults, 150);
});

symbolInput?.addEventListener("focus", () => {
  if (symbolInput.value.trim().length >= 2) {
    scheduleWatchlistSearch(symbolInput.value);
  }
});

labelInput?.addEventListener("focus", () => {
  if (labelInput.value.trim().length >= 2) {
    scheduleWatchlistSearch(labelInput.value);
  }
});

refreshButton.addEventListener("click", () => refreshDashboard().catch(handleError));
refreshModeSelect.addEventListener("change", () => {
  localStorage.setItem(REFRESH_MODE_STORAGE_KEY, refreshModeSelect.value);
  setRefreshIntervalVisibility();
  startAutoRefresh();
});
refreshIntervalInput.addEventListener("change", () => {
  const minutes = Number(refreshIntervalInput.value);
  const nextMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 5;
  refreshIntervalInput.value = String(nextMinutes);
  localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(nextMinutes));
  startAutoRefresh();
});
marketStockCountSelect.addEventListener("change", () => {
  localStorage.setItem(MARKET_STOCK_COUNT_STORAGE_KEY, marketStockCountSelect.value);
  if (selectedMarketSector) {
    loadSectorDetail().catch(handleError);
  }
});
positionModalClose?.addEventListener("click", closePositionModal);
controlsOpenButton?.addEventListener("click", openControlsModal);
controlsCloseButton?.addEventListener("click", closeControlsModal);
positionModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
    closePositionModal();
  }
});
controlsModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.closeControls === "true") {
    closeControlsModal();
  }
});
positionModalClear?.addEventListener("click", async () => {
  if (!activePositionTarget) {
    return;
  }

  try {
    await savePositionDetailsForSymbol(activePositionTarget.symbol, activePositionTarget.market, "", "");
    updateStatus(`Cleared position for ${activePositionTarget.symbol}.`);
    closePositionModal();
    await loadCharts();
  } catch (error) {
    handleError(error);
  }
});
positionModalSave?.addEventListener("click", async () => {
  if (!activePositionTarget || !positionModalInput || !positionModalAveragePriceInput) {
    return;
  }

  try {
    await savePositionDetailsForSymbol(
      activePositionTarget.symbol,
      activePositionTarget.market,
      positionModalInput.value.trim(),
      positionModalAveragePriceInput.value.trim()
    );
    updateStatus(`Saved position for ${activePositionTarget.symbol}.`);
    closePositionModal();
    await loadCharts();
  } catch (error) {
    handleError(error);
  }
});
positionModalInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    positionModalSave?.click();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closePositionModal();
  }
});
positionModalAveragePriceInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    positionModalSave?.click();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closePositionModal();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && positionModal && !positionModal.hidden) {
    closePositionModal();
  }
  if (event.key === "Escape" && controlsModal && !controlsModal.hidden) {
    closeControlsModal();
  }
});
themeSelect.addEventListener("change", () => {
  const selectedTheme = themeSelect.value;
  localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  applyTheme(selectedTheme);
});
marketSelect?.addEventListener("change", () => {
  const market = currentMarket();
  localStorage.setItem(ACTIVE_WATCHLIST_MARKET_STORAGE_KEY, market);
  if (watchlistMarketSelect) {
    watchlistMarketSelect.value = market;
  }
  renderBenchmarkControls();
  closePositionModal();
  refreshDashboard().catch(handleError);
});
optionsStockSelect?.addEventListener("change", () => {
  selectedOptionsSymbol = optionsStockSelect.value;
  renderOptionsIdeas();
});
optionsBiasSelect?.addEventListener("change", () => {
  renderOptionsIdeas();
});
currencySelect.addEventListener("change", () => loadCharts().catch(handleError));
changeModeSelect.addEventListener("change", () => loadCharts().catch(handleError));
rangeSelect.addEventListener("change", () => updateRange(rangeSelect.value));
benchmarkRangeSelect?.addEventListener("change", () => updateRange(benchmarkRangeSelect.value));

function handleError(error) {
  console.error(error);
  updateStatus(error.message || "Something went wrong while loading data.", true);
}

async function init() {
  try {
    closePositionModal();
    await loadVersion();
    syncRangeControls(rangeSelect?.value || "3mo");
    initializeMarketSelection();
    initializeTheme();
    initializeRefreshControls();
    initializeMarketControls();
    initializeSectionOrder();
    initializeCollapsibles();
    renderBenchmarkControls();
    try {
      const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=SGD");
      if (response.ok) {
        const payload = await response.json();
        usdToSgdRate = Number(payload?.rates?.SGD) || 1;
      }
    } catch (error) {
      console.warn("Unable to load USD/SGD rate, falling back to USD display parity.", error);
    }
    await getWatchlist();
    await refreshDashboard();
  } catch (error) {
    handleError(error);
  }
}

init();
