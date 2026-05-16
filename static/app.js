const cardsRoot = document.querySelector("#cards");
const statusMessage = document.querySelector("#status-message");
const watchlistForm = document.querySelector("#watchlist-form");
const appVersionNode = document.querySelector("#app-version");
const appVersionFooterNode = document.querySelector("#app-version-footer");
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
const template = document.querySelector("#stock-card-template");
const overviewChart = document.querySelector("#overview-chart");
const overviewLegend = document.querySelector("#overview-legend");
const overviewSummary = document.querySelector("#overview-summary");
const overviewTotalValue = document.querySelector("#overview-total-value");
const benchmarkRegionNote = document.querySelector("#benchmark-region-note");
const benchmarkControls = document.querySelector("#benchmark-controls");
const newsGroupsRoot = document.querySelector("#news-groups");
const marketSummary = document.querySelector("#market-summary");
const marketGroupsRoot = document.querySelector("#market-groups");
const sectorDetailRoot = document.querySelector("#sector-detail");
const marketStockCountSelect = document.querySelector("#market-stock-count-select");
const positionModal = document.querySelector("#position-modal");
const positionModalClose = document.querySelector("#position-modal-close");
const positionModalSave = document.querySelector("#position-modal-save");
const positionModalClear = document.querySelector("#position-modal-clear");
const positionModalInput = document.querySelector("#position-modal-input");
const positionModalSymbol = document.querySelector("#position-modal-symbol");
const collapsiblePanels = document.querySelectorAll(".collapsible-panel");
const watchlistSearchResults = document.querySelector("#watchlist-search-results");

let watchlist = [];
let usdToSgdRate = 1;
let autoRefreshTimer = null;
let selectedMarketSector = null;
let activePositionTarget = null;
let watchlistSearchTimer = null;
let lastWatchlistSearchQuery = "";
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
  "5y": "5 years",
  max: "max history",
};
const THEME_STORAGE_KEY = "stock-dashboard-theme";
const COLLAPSE_STORAGE_PREFIX = "stock-dashboard-collapse-";
const REFRESH_MODE_STORAGE_KEY = "stock-dashboard-refresh-mode";
const REFRESH_INTERVAL_STORAGE_KEY = "stock-dashboard-refresh-interval";
const MARKET_STOCK_COUNT_STORAGE_KEY = "stock-dashboard-market-stock-count";
const ACTIVE_WATCHLIST_MARKET_STORAGE_KEY = "stock-dashboard-active-watchlist-market";
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

function openPositionModal(stock) {
  if (!positionModal || !positionModalInput || !positionModalSymbol) {
    return;
  }

  activePositionTarget = { symbol: stock.symbol, market: normalizeMarket(stock.market) };
  positionModalSymbol.textContent = `${stock.symbol}${stock.label && stock.label !== stock.symbol ? ` • ${stock.label}` : ""} • ${normalizeMarket(stock.market)}`;
  positionModalInput.value = formatPositionInput(stock.position);
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

function currentRangeLabel() {
  return RANGE_LABELS[rangeSelect.value] || rangeSelect.value;
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

function heatTileStyle(dayChangePct) {
  const numericValue = Number(dayChangePct);
  if (!Number.isFinite(numericValue)) {
    return "";
  }

  const intensity = Math.min(Math.abs(numericValue) / 3, 1);
  if (numericValue > 0) {
    return `background: linear-gradient(160deg, rgba(22, 138, 92, ${0.72 + intensity * 0.2}), rgba(12, 84, 57, ${0.84 + intensity * 0.14})); border-color: rgba(62, 214, 149, ${0.42 + intensity * 0.28}); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);`;
  }
  if (numericValue < 0) {
    return `background: linear-gradient(160deg, rgba(198, 63, 50, ${0.72 + intensity * 0.2}), rgba(122, 28, 28, ${0.84 + intensity * 0.14})); border-color: rgba(255, 120, 103, ${0.42 + intensity * 0.28}); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);`;
  }
  return "background: linear-gradient(160deg, rgba(84, 92, 101, 0.62), rgba(54, 60, 66, 0.82)); border-color: rgba(122, 132, 142, 0.36);";
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

  renderNews(payload.groups || []);
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

  (payload.stocks || [])
    .slice()
    .sort((left, right) => {
      const leftValue = Number(left.dayChangePct ?? -999);
      const rightValue = Number(right.dayChangePct ?? -999);
      return rightValue - leftValue;
    })
    .forEach((stock) => {
    const tile = document.createElement("article");
    tile.className = "market-tile sector-stock-tile";
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

function buildLinePath(points, width, height, padding, min, max) {
  const spread = Math.max(max - min, 1);
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);
  return points
    .map((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((point.close - min) / spread) * (height - padding * 2);
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

function renderOverview(stocks, benchmarks) {
  overviewChart.replaceChildren();
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
  const values = [...averageSeries, ...benchmarkSeries.flatMap((series) => series.points)].map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);

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
    path.setAttribute("d", buildLinePath(series.points, width, height, padding, min, max));
    overviewChart.appendChild(path);
  });

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
    overviewTotalValue.textContent = "Total watchlist value: --";
    renderOverview([], []);
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
  renderOverview(results, benchmarks);
  results.forEach(renderCard);
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
  positionValue.textContent = formatPositionValue(stock.position, stock.price, stock.currency);
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
    positionValue.textContent = formatPositionValue(stock.position, stock.price, stock.currency);
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
  positionValue.textContent = formatPositionValue(stock.position, stock.price, stock.currency);
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
positionModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
    closePositionModal();
  }
});
positionModalClear?.addEventListener("click", async () => {
  if (!activePositionTarget) {
    return;
  }

  try {
    await savePositionForSymbol(activePositionTarget.symbol, activePositionTarget.market, "");
    updateStatus(`Cleared position for ${activePositionTarget.symbol}.`);
    closePositionModal();
    await loadCharts();
  } catch (error) {
    handleError(error);
  }
});
positionModalSave?.addEventListener("click", async () => {
  if (!activePositionTarget || !positionModalInput) {
    return;
  }

  try {
    await savePositionForSymbol(activePositionTarget.symbol, activePositionTarget.market, positionModalInput.value.trim());
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
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && positionModal && !positionModal.hidden) {
    closePositionModal();
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
currencySelect.addEventListener("change", () => loadCharts().catch(handleError));
changeModeSelect.addEventListener("change", () => loadCharts().catch(handleError));
rangeSelect.addEventListener("change", () => loadCharts().catch(handleError));

function handleError(error) {
  console.error(error);
  updateStatus(error.message || "Something went wrong while loading data.", true);
}

async function init() {
  try {
    closePositionModal();
    await loadVersion();
    initializeMarketSelection();
    initializeTheme();
    initializeRefreshControls();
    initializeMarketControls();
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
