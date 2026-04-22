#!/usr/bin/env python3
from __future__ import annotations

import csv
import io
import json
import os
import socket
import subprocess
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from errno import EADDRINUSE
from html import unescape
from http import cookies
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
WATCHLIST_FILE = ROOT / "watchlist.json"
HOST = os.environ.get("STOCK_DASHBOARD_HOST", "127.0.0.1")
PORT = int(os.environ.get("STOCK_DASHBOARD_PORT", "8000"))
ACCESS_CODE = "1010"
MARKET_SEGMENTS = [
    {"symbol": "SPY", "label": "S&P 500", "group": "Broad Market"},
    {"symbol": "QQQ", "label": "Nasdaq 100", "group": "Broad Market"},
    {"symbol": "DIA", "label": "Dow", "group": "Broad Market"},
    {"symbol": "IWM", "label": "Russell 2000", "group": "Broad Market"},
    {"symbol": "XLK", "label": "Technology", "group": "Sectors"},
    {"symbol": "XLF", "label": "Financials", "group": "Sectors"},
    {"symbol": "XLV", "label": "Health Care", "group": "Sectors"},
    {"symbol": "XLY", "label": "Consumer Discretionary", "group": "Sectors"},
    {"symbol": "XLP", "label": "Consumer Staples", "group": "Sectors"},
    {"symbol": "XLI", "label": "Industrials", "group": "Sectors"},
    {"symbol": "XLE", "label": "Energy", "group": "Sectors"},
    {"symbol": "XLB", "label": "Materials", "group": "Sectors"},
    {"symbol": "XLU", "label": "Utilities", "group": "Sectors"},
    {"symbol": "XLRE", "label": "Real Estate", "group": "Sectors"},
    {"symbol": "XLC", "label": "Communication Services", "group": "Sectors"},
]
MARKET_SECTOR_STOCKS = {
    "XLK": [
        {"symbol": "MSFT", "label": "Microsoft"},
        {"symbol": "AAPL", "label": "Apple"},
        {"symbol": "NVDA", "label": "NVIDIA"},
        {"symbol": "AVGO", "label": "Broadcom"},
        {"symbol": "ORCL", "label": "Oracle"},
        {"symbol": "ADBE", "label": "Adobe"},
        {"symbol": "CRM", "label": "Salesforce"},
        {"symbol": "AMD", "label": "AMD"},
    ],
    "XLF": [
        {"symbol": "BRK-B", "label": "Berkshire Hathaway"},
        {"symbol": "JPM", "label": "JPMorgan"},
        {"symbol": "V", "label": "Visa"},
        {"symbol": "MA", "label": "Mastercard"},
        {"symbol": "BAC", "label": "Bank of America"},
        {"symbol": "WFC", "label": "Wells Fargo"},
        {"symbol": "GS", "label": "Goldman Sachs"},
        {"symbol": "MS", "label": "Morgan Stanley"},
    ],
    "XLV": [
        {"symbol": "LLY", "label": "Eli Lilly"},
        {"symbol": "JNJ", "label": "Johnson & Johnson"},
        {"symbol": "UNH", "label": "UnitedHealth"},
        {"symbol": "MRK", "label": "Merck"},
        {"symbol": "ABBV", "label": "AbbVie"},
        {"symbol": "TMO", "label": "Thermo Fisher"},
        {"symbol": "PFE", "label": "Pfizer"},
        {"symbol": "ABT", "label": "Abbott"},
    ],
    "XLY": [
        {"symbol": "AMZN", "label": "Amazon"},
        {"symbol": "TSLA", "label": "Tesla"},
        {"symbol": "HD", "label": "Home Depot"},
        {"symbol": "MCD", "label": "McDonald's"},
        {"symbol": "NKE", "label": "Nike"},
        {"symbol": "SBUX", "label": "Starbucks"},
        {"symbol": "LOW", "label": "Lowe's"},
        {"symbol": "BKNG", "label": "Booking"},
    ],
    "XLP": [
        {"symbol": "PG", "label": "Procter & Gamble"},
        {"symbol": "COST", "label": "Costco"},
        {"symbol": "KO", "label": "Coca-Cola"},
        {"symbol": "PEP", "label": "PepsiCo"},
        {"symbol": "WMT", "label": "Walmart"},
        {"symbol": "PM", "label": "Philip Morris"},
        {"symbol": "MDLZ", "label": "Mondelez"},
        {"symbol": "CL", "label": "Colgate"},
    ],
    "XLI": [
        {"symbol": "GE", "label": "GE Aerospace"},
        {"symbol": "RTX", "label": "RTX"},
        {"symbol": "CAT", "label": "Caterpillar"},
        {"symbol": "UBER", "label": "Uber"},
        {"symbol": "HON", "label": "Honeywell"},
        {"symbol": "ETN", "label": "Eaton"},
        {"symbol": "LMT", "label": "Lockheed Martin"},
        {"symbol": "DE", "label": "Deere"},
    ],
    "XLE": [
        {"symbol": "XOM", "label": "Exxon Mobil"},
        {"symbol": "CVX", "label": "Chevron"},
        {"symbol": "COP", "label": "ConocoPhillips"},
        {"symbol": "SLB", "label": "Schlumberger"},
        {"symbol": "EOG", "label": "EOG Resources"},
        {"symbol": "MPC", "label": "Marathon Petroleum"},
        {"symbol": "PSX", "label": "Phillips 66"},
        {"symbol": "OXY", "label": "Occidental"},
    ],
    "XLB": [
        {"symbol": "LIN", "label": "Linde"},
        {"symbol": "APD", "label": "Air Products"},
        {"symbol": "SHW", "label": "Sherwin-Williams"},
        {"symbol": "FCX", "label": "Freeport-McMoRan"},
        {"symbol": "ECL", "label": "Ecolab"},
        {"symbol": "NUE", "label": "Nucor"},
        {"symbol": "DD", "label": "DuPont"},
        {"symbol": "CTVA", "label": "Corteva"},
    ],
    "XLU": [
        {"symbol": "NEE", "label": "NextEra Energy"},
        {"symbol": "SO", "label": "Southern"},
        {"symbol": "DUK", "label": "Duke Energy"},
        {"symbol": "AEP", "label": "American Electric Power"},
        {"symbol": "SRE", "label": "Sempra"},
        {"symbol": "D", "label": "Dominion"},
        {"symbol": "XEL", "label": "Xcel Energy"},
        {"symbol": "PEG", "label": "Public Service Enterprise"},
    ],
    "XLRE": [
        {"symbol": "AMT", "label": "American Tower"},
        {"symbol": "PLD", "label": "Prologis"},
        {"symbol": "EQIX", "label": "Equinix"},
        {"symbol": "WELL", "label": "Welltower"},
        {"symbol": "SPG", "label": "Simon Property"},
        {"symbol": "O", "label": "Realty Income"},
        {"symbol": "PSA", "label": "Public Storage"},
        {"symbol": "DLR", "label": "Digital Realty"},
    ],
    "XLC": [
        {"symbol": "GOOGL", "label": "Alphabet"},
        {"symbol": "META", "label": "Meta"},
        {"symbol": "NFLX", "label": "Netflix"},
        {"symbol": "DIS", "label": "Disney"},
        {"symbol": "TMUS", "label": "T-Mobile"},
        {"symbol": "VZ", "label": "Verizon"},
        {"symbol": "CMCSA", "label": "Comcast"},
        {"symbol": "T", "label": "AT&T"},
    ],
}


def load_watchlist() -> dict:
    if not WATCHLIST_FILE.exists():
        default = {
            "symbols": [
                {"symbol": "AAPL", "label": "Apple"},
                {"symbol": "MSFT", "label": "Microsoft"},
                {"symbol": "NVDA", "label": "NVIDIA"},
            ]
        }
        save_watchlist(default)
        return default

    with WATCHLIST_FILE.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    data.setdefault("symbols", [])
    return data


def save_watchlist(payload: dict) -> None:
    clean_symbols = []
    for item in payload.get("symbols", []):
        symbol = str(item.get("symbol", "")).strip().upper()
        label = str(item.get("label", symbol)).strip() or symbol
        position_value = item.get("position")
        position = None
        if position_value not in (None, ""):
            try:
                position = float(position_value)
            except (TypeError, ValueError):
                position = None
        if symbol:
            clean_item = {"symbol": symbol, "label": label}
            if position is not None:
                clean_item["position"] = position
            clean_symbols.append(clean_item)

    with WATCHLIST_FILE.open("w", encoding="utf-8") as handle:
        json.dump({"symbols": clean_symbols}, handle, indent=2)
        handle.write("\n")


def range_to_days(range_value: str) -> int | None:
    mapping = {
        "1mo": 31,
        "3mo": 92,
        "6mo": 183,
        "1y": 366,
        "5y": 366 * 5,
        "max": None,
    }
    return mapping.get(range_value, 92)


def normalize_symbol_for_stooq(symbol: str) -> str:
    normalized = symbol.strip().lower()
    if "." in normalized or ":" in normalized:
        return normalized.replace(":", ".")
    return f"{normalized}.us"


def stooq_chart_url(symbol: str) -> str:
    query = urllib.parse.urlencode({"s": normalize_symbol_for_stooq(symbol), "i": "d"})
    return f"https://stooq.com/q/d/l/?{query}"


def yahoo_chart_url(symbol: str, range_value: str = "3mo") -> str:
    query = urllib.parse.urlencode({"range": range_value, "interval": "1d"})
    return f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?{query}"


def yahoo_quote_url(symbol: str) -> str:
    query = urllib.parse.urlencode({"symbols": symbol})
    return f"https://query1.finance.yahoo.com/v7/finance/quote?{query}"


def google_news_rss_url(symbol: str, label: str) -> str:
    query = f'"{symbol}" stock OR "{label}" stock when:3d'
    encoded_query = urllib.parse.quote(query)
    return f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"


def fetch_text(url: str, accept: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": accept,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.read().decode("utf-8")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        try:
            result = subprocess.run(
                [
                    "curl",
                    "-fsSL",
                    "-A",
                    "Mozilla/5.0",
                    "-H",
                    f"Accept: {accept}",
                    url,
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=20,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as exc:
            raise ConnectionError(f"Unable to reach data provider at {url}") from exc
        return result.stdout


def fetch_chart_from_stooq(symbol: str, range_value: str = "3mo") -> dict:
    url = stooq_chart_url(symbol)
    try:
        payload = fetch_text(url, "text/csv")
    except ConnectionError as exc:
        raise ConnectionError(f"Unable to reach Stooq for {symbol}") from exc

    rows = list(csv.DictReader(io.StringIO(payload)))
    days = range_to_days(range_value)
    cutoff = None if days is None else datetime.utcnow().date() - timedelta(days=days)
    points = []
    for row in rows:
        date_text = (row.get("Date") or "").strip()
        close_text = (row.get("Close") or "").strip()
        if not date_text or not close_text or close_text.lower() == "n/d":
            continue
        try:
            point_date = datetime.strptime(date_text, "%Y-%m-%d").date()
            close_value = round(float(close_text), 2)
        except ValueError:
            continue
        if cutoff is not None and point_date < cutoff:
            continue
        points.append(
            {
                "timestamp": int(datetime.combine(point_date, datetime.min.time()).timestamp()),
                "close": close_value,
            }
        )

    if not points:
        raise ValueError(f"No pricing data available for {symbol}")

    current_price = points[-1]["close"]
    previous_close = points[-2]["close"] if len(points) > 1 else None

    day_change = None
    day_change_pct = None
    if previous_close not in (None, 0):
        day_change = round(float(current_price) - float(previous_close), 2)
        day_change_pct = round((day_change / float(previous_close)) * 100, 2)

    return {
        "symbol": symbol,
        "price": round(float(current_price), 2),
        "currency": "USD",
        "exchange": "Stooq",
        "dayChange": day_change,
        "dayChangePct": day_change_pct,
        "preMarketPrice": None,
        "preMarketChange": None,
        "preMarketChangePct": None,
        "marketState": "CLOSED",
        "isLive": False,
        "dataSource": "Stooq",
        "points": points,
    }


def fetch_chart_from_yahoo(symbol: str, range_value: str = "3mo") -> dict:
    url = yahoo_chart_url(symbol, range_value)
    quote_url = yahoo_quote_url(symbol)
    try:
        payload = json.loads(fetch_text(url, "application/json"))
    except ConnectionError as exc:
        raise ConnectionError(f"Unable to reach Yahoo Finance for {symbol}") from exc

    chart = payload.get("chart", {})
    errors = chart.get("error")
    if errors:
        description = errors.get("description") or "Unknown error"
        raise ValueError(description)

    result = (chart.get("result") or [{}])[0]
    timestamps = result.get("timestamp") or []
    indicators = (((result.get("indicators") or {}).get("quote") or [{}])[0]).get("close") or []
    meta = result.get("meta") or {}
    quote_result = {}
    try:
        quote_payload = json.loads(fetch_text(quote_url, "application/json"))
        quote_result = ((quote_payload.get("quoteResponse") or {}).get("result") or [{}])[0]
    except (ConnectionError, json.JSONDecodeError, KeyError, IndexError):
        quote_result = {}

    points = []
    for timestamp, close_value in zip(timestamps, indicators):
        if close_value is None:
            continue
        points.append({"timestamp": timestamp, "close": round(float(close_value), 2)})

    if not points:
        raise ValueError(f"No pricing data available for {symbol}")

    previous_close = quote_result.get("regularMarketPreviousClose") or meta.get("previousClose")
    if previous_close in (None, 0) and len(points) > 1:
        previous_close = points[-2]["close"]
    current_price = quote_result.get("regularMarketPrice") or meta.get("regularMarketPrice") or points[-1]["close"]
    currency = quote_result.get("currency") or meta.get("currency") or "USD"

    day_change = None
    day_change_pct = None
    if previous_close not in (None, 0):
        day_change = round(float(current_price) - float(previous_close), 2)
        day_change_pct = round((day_change / float(previous_close)) * 100, 2)

    premarket_price = quote_result.get("preMarketPrice")
    premarket_change = quote_result.get("preMarketChange")
    premarket_change_pct = quote_result.get("preMarketChangePercent")
    market_state = quote_result.get("marketState") or ""

    return {
        "symbol": symbol,
        "price": round(float(current_price), 2),
        "currency": currency,
        "exchange": quote_result.get("fullExchangeName") or meta.get("exchangeName") or "Yahoo Finance",
        "dayChange": day_change,
        "dayChangePct": day_change_pct,
        "preMarketPrice": round(float(premarket_price), 2) if premarket_price is not None else None,
        "preMarketChange": round(float(premarket_change), 2) if premarket_change is not None else None,
        "preMarketChangePct": round(float(premarket_change_pct), 2) if premarket_change_pct is not None else None,
        "marketState": market_state,
        "isLive": True,
        "dataSource": "Yahoo Finance",
        "points": points,
    }


def fetch_chart(symbol: str, range_value: str = "3mo") -> dict:
    failures = []
    for fetcher in (fetch_chart_from_yahoo, fetch_chart_from_stooq):
        try:
            return fetcher(symbol, range_value)
        except (ValueError, ConnectionError) as exc:
            failures.append(str(exc))

    raise ConnectionError("; ".join(failures))


def build_quote_snapshot(quote_result: dict, segment: dict) -> dict:
    previous_close = quote_result.get("regularMarketPreviousClose")
    current_price = quote_result.get("regularMarketPrice")
    day_change = quote_result.get("regularMarketChange")
    day_change_pct = quote_result.get("regularMarketChangePercent")

    if current_price is None and previous_close is None:
        raise ValueError(f"No live quote available for {segment['symbol']}")

    if day_change is None and current_price is not None and previous_close not in (None, 0):
        day_change = float(current_price) - float(previous_close)
    if day_change_pct is None and day_change is not None and previous_close not in (None, 0):
        day_change_pct = (float(day_change) / float(previous_close)) * 100

    return {
        "symbol": segment["symbol"],
        "label": segment["label"],
        "group": segment["group"],
        "price": round(float(current_price), 2) if current_price is not None else None,
        "dayChange": round(float(day_change), 2) if day_change is not None else None,
        "dayChangePct": round(float(day_change_pct), 2) if day_change_pct is not None else None,
        "isLive": True,
        "dataSource": "Yahoo Finance",
    }


def fetch_market_snapshots(segments: list[dict]) -> tuple[list[dict], list[str]]:
    symbols = ",".join(segment["symbol"] for segment in segments)
    snapshots = []
    failures = []

    try:
        payload = json.loads(fetch_text(yahoo_quote_url(symbols), "application/json"))
        results = ((payload.get("quoteResponse") or {}).get("result") or [])
        by_symbol = {
            str(item.get("symbol", "")).upper(): item
            for item in results
            if item.get("symbol")
        }
        for segment in MARKET_SEGMENTS:
            quote_result = by_symbol.get(segment["symbol"])
            if not quote_result:
                raise ValueError(f"Missing quote for {segment['symbol']}")
            snapshots.append(build_quote_snapshot(quote_result, segment))
    except (ConnectionError, ValueError, json.JSONDecodeError) as exc:
        failures.append(str(exc))
        snapshots = []
        for segment in segments:
            try:
                fallback = fetch_chart(segment["symbol"], range_value="1mo")
                snapshots.append(
                    {
                        "symbol": segment["symbol"],
                        "label": segment["label"],
                        "group": segment["group"],
                        "price": fallback.get("price"),
                        "dayChange": fallback.get("dayChange"),
                        "dayChangePct": fallback.get("dayChangePct"),
                        "isLive": fallback.get("isLive", False),
                        "dataSource": fallback.get("dataSource") or "Fallback",
                    }
                )
            except (ConnectionError, ValueError) as fallback_exc:
                snapshots.append(
                    {
                        "symbol": segment["symbol"],
                        "label": segment["label"],
                        "group": segment["group"],
                        "error": str(fallback_exc),
                    }
                )

    return snapshots, failures


def fetch_market_overview() -> dict:
    snapshots, failures = fetch_market_snapshots(MARKET_SEGMENTS)
    return {"segments": snapshots, "errors": failures}


def fetch_market_sector(symbol: str) -> dict:
    sector_symbol = symbol.strip().upper()
    entries = MARKET_SECTOR_STOCKS.get(sector_symbol)
    if not entries:
        raise ValueError(f"Unsupported market sector: {sector_symbol}")

    sector_label = next((segment["label"] for segment in MARKET_SEGMENTS if segment["symbol"] == sector_symbol), sector_symbol)
    stock_segments = [
        {"symbol": entry["symbol"], "label": entry["label"], "group": sector_label}
        for entry in entries
    ]
    snapshots, failures = fetch_market_snapshots(stock_segments)
    return {
        "sectorSymbol": sector_symbol,
        "sectorLabel": sector_label,
        "stocks": snapshots,
        "errors": failures,
    }


def parse_news_pub_date(raw_value: str) -> datetime | None:
    if not raw_value:
        return None
    try:
        return parsedate_to_datetime(raw_value)
    except (TypeError, ValueError, IndexError):
        return None


def extract_source_name(item: ET.Element) -> str | None:
    source_node = item.find("source")
    if source_node is not None and source_node.text:
        return source_node.text.strip()
    return None


def clean_news_title(raw_title: str) -> str:
    title = unescape(raw_title or "").strip()
    if " - " in title:
        title = title.rsplit(" - ", 1)[0].strip()
    return title


def fetch_news_for_entry(entry: dict) -> dict:
    symbol = str(entry.get("symbol", "")).strip().upper()
    label = str(entry.get("label", symbol)).strip() or symbol
    url = google_news_rss_url(symbol, label)
    try:
        payload = fetch_text(url, "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8")
    except ConnectionError as exc:
        raise ConnectionError(f"Unable to reach Google News for {symbol}") from exc

    try:
        root = ET.fromstring(payload)
    except ET.ParseError as exc:
        raise ValueError(f"Unable to parse news feed for {symbol}") from exc

    cutoff = datetime.now(timezone.utc) - timedelta(days=3)
    items = []
    for item in root.findall("./channel/item"):
        title = clean_news_title(item.findtext("title", default=""))
        link = item.findtext("link", default="").strip()
        published_at = parse_news_pub_date(item.findtext("pubDate", default=""))
        if not title or not link or published_at is None:
            continue

        published_utc = published_at.astimezone(timezone.utc)
        if published_utc < cutoff:
            continue

        items.append(
            {
                "title": title,
                "link": link,
                "source": extract_source_name(item),
                "publishedAt": published_utc.isoformat(),
            }
        )

    return {
        "symbol": symbol,
        "label": label,
        "items": items[:5],
    }


def fetch_watchlist_news() -> dict:
    watchlist = load_watchlist().get("symbols", [])
    groups = []
    for entry in watchlist:
        symbol = str(entry.get("symbol", "")).strip().upper()
        if not symbol:
            continue
        try:
            groups.append(fetch_news_for_entry(entry))
        except (ConnectionError, ValueError) as exc:
            groups.append(
                {
                    "symbol": symbol,
                    "label": str(entry.get("label", symbol)).strip() or symbol,
                    "items": [],
                    "error": str(exc),
                }
            )

    return {"groups": groups}


def reachable_urls(host: str, port: int) -> list[str]:
    if host not in {"0.0.0.0", "::"}:
        return [f"http://{host}:{port}"]

    urls = [f"http://127.0.0.1:{port}"]
    try:
        host_name = socket.gethostname()
        ip_addresses = {
            info[4][0]
            for info in socket.getaddrinfo(host_name, None, family=socket.AF_INET, type=socket.SOCK_STREAM)
        }
    except socket.gaierror:
        ip_addresses = set()

    for ip_address in sorted(ip_addresses):
        if ip_address.startswith("127."):
            continue
        urls.append(f"http://{ip_address}:{port}")
    return urls


class StockDashboardHandler(BaseHTTPRequestHandler):
    def is_authenticated(self) -> bool:
        raw_cookie = self.headers.get("Cookie", "")
        if not raw_cookie:
            return False

        jar = cookies.SimpleCookie()
        try:
            jar.load(raw_cookie)
        except cookies.CookieError:
            return False

        token = jar.get("stock_dashboard_auth")
        return bool(token and token.value == ACCESS_CODE)

    def respond_login_required(self) -> None:
        if self.path.startswith("/api/"):
            self.respond_json({"error": "Authentication required"}, status=HTTPStatus.UNAUTHORIZED)
            return
        self.serve_login_page()

    def serve_login_page(self, error_message: str | None = None) -> None:
        error_html = ""
        if error_message:
            error_html = f'<p style="margin:0;color:#ee8a74;font:500 15px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;">{error_message}</p>'

        html = f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unlock Dashboard</title>
    <style>
      :root {{
        color-scheme: dark;
      }}
      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #1a1f23 0%, #14181b 46%, #101316 100%);
        color: #eef2f5;
        font-family: "Avenir Next", "Helvetica Neue", sans-serif;
      }}
      .login-card {{
        width: min(420px, calc(100% - 32px));
        padding: 28px;
        border-radius: 28px;
        background: rgba(34, 38, 42, 0.92);
        border: 1px solid rgba(111, 123, 132, 0.28);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.32);
        display: grid;
        gap: 16px;
      }}
      h1 {{
        margin: 0;
        font-size: 2rem;
        letter-spacing: -0.04em;
      }}
      p {{
        margin: 0;
        color: #aab2ba;
        line-height: 1.6;
      }}
      form {{
        display: grid;
        gap: 12px;
      }}
      input {{
        min-height: 52px;
        padding: 0 16px;
        border-radius: 999px;
        border: 1px solid #4e5861;
        background: #252b30;
        color: #eef2f5;
        font: inherit;
      }}
      button {{
        min-height: 52px;
        border: none;
        border-radius: 999px;
        background: #5a636c;
        color: #f6f8fa;
        font: inherit;
        cursor: pointer;
      }}
    </style>
  </head>
  <body>
    <section class="login-card">
      <p style="text-transform:uppercase;letter-spacing:0.12em;color:#72c1ad;font-size:0.78rem;font-weight:700;">Protected Access</p>
      <h1>Enter passcode</h1>
      <p>This dashboard is protected for LAN access. Enter the passcode to continue.</p>
      {error_html}
      <form method="post" action="/login">
        <input type="password" name="code" placeholder="Passcode" autocomplete="current-password" autofocus />
        <button type="submit">Unlock</button>
      </form>
    </section>
  </body>
</html>"""
        data = html.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/login":
            self.serve_login_page()
            return

        if not self.is_authenticated():
            self.respond_login_required()
            return

        if parsed.path == "/":
            self.serve_file("index.html", "text/html; charset=utf-8")
            return

        if parsed.path == "/api/watchlist":
            self.respond_json(load_watchlist())
            return

        if parsed.path == "/api/news":
            self.respond_json(fetch_watchlist_news())
            return

        if parsed.path == "/api/market-overview":
            self.respond_json(fetch_market_overview())
            return

        if parsed.path == "/api/market-sector":
            params = urllib.parse.parse_qs(parsed.query)
            symbol = (params.get("symbol") or [""])[0].strip().upper()
            if not symbol:
                self.respond_json({"error": "symbol is required"}, status=HTTPStatus.BAD_REQUEST)
                return
            try:
                self.respond_json(fetch_market_sector(symbol))
            except ValueError as exc:
                self.respond_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return

        if parsed.path == "/api/chart":
            params = urllib.parse.parse_qs(parsed.query)
            symbol = (params.get("symbol") or [""])[0].strip().upper()
            range_value = (params.get("range") or ["3mo"])[0]
            if not symbol:
                self.respond_json({"error": "symbol is required"}, status=HTTPStatus.BAD_REQUEST)
                return

            try:
                payload = fetch_chart(symbol, range_value=range_value)
            except (ValueError, ConnectionError) as exc:
                self.respond_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
                return

            self.respond_json(payload)
            return

        if parsed.path.startswith("/static/"):
            file_name = parsed.path.removeprefix("/static/")
            self.serve_file(file_name, self.content_type(file_name))
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/login":
            length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(length).decode("utf-8")
            params = urllib.parse.parse_qs(raw_body)
            code = (params.get("code") or [""])[0].strip()
            if code != ACCESS_CODE:
                self.serve_login_page(error_message="Incorrect passcode.")
                return

            self.send_response(HTTPStatus.SEE_OTHER)
            self.send_header("Location", "/")
            self.send_header("Set-Cookie", "stock_dashboard_auth=1010; Path=/; HttpOnly; SameSite=Lax")
            self.end_headers()
            return

        if not self.is_authenticated():
            self.respond_login_required()
            return

        if parsed.path != "/api/watchlist":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length)
        try:
            payload = json.loads(raw_body or b"{}")
            save_watchlist(payload)
        except json.JSONDecodeError:
            self.respond_json({"error": "Invalid JSON body"}, status=HTTPStatus.BAD_REQUEST)
            return

        self.respond_json(load_watchlist(), status=HTTPStatus.CREATED)

    def serve_file(self, relative_path: str, content_type: str) -> None:
        target = STATIC_DIR / relative_path
        if not target.exists() or not target.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        data = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.end_headers()
        self.wfile.write(data)

    def respond_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    @staticmethod
    def content_type(file_name: str) -> str:
        if file_name.endswith(".css"):
            return "text/css; charset=utf-8"
        if file_name.endswith(".js"):
            return "application/javascript; charset=utf-8"
        if file_name.endswith(".html"):
            return "text/html; charset=utf-8"
        return "application/octet-stream"

    def log_message(self, format: str, *args) -> None:
        return


def main() -> None:
    selected_host = HOST
    selected_port = PORT
    try:
        server = ThreadingHTTPServer((selected_host, selected_port), StockDashboardHandler)
    except OSError as exc:
        if exc.errno != EADDRINUSE:
            raise
        server = ThreadingHTTPServer((selected_host, 0), StockDashboardHandler)
        selected_port = int(server.server_address[1])

    if selected_port != PORT:
        print(f"Port {PORT} was busy, so the dashboard moved to port {selected_port}.", flush=True)

    print("Stock dashboard running at:", flush=True)
    for url in reachable_urls(selected_host, selected_port):
        print(f"  {url}", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
