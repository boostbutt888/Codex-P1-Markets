#!/usr/bin/env python3
from __future__ import annotations

import csv
import io
import json
import os
import subprocess
from datetime import datetime, timedelta
from errno import EADDRINUSE
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
WATCHLIST_FILE = ROOT / "watchlist.json"
HOST = "127.0.0.1"
PORT = int(os.environ.get("STOCK_DASHBOARD_PORT", "8000"))


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


class StockDashboardHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/":
            self.serve_file("index.html", "text/html; charset=utf-8")
            return

        if parsed.path == "/api/watchlist":
            self.respond_json(load_watchlist())
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
    selected_port = PORT
    try:
        server = ThreadingHTTPServer((HOST, selected_port), StockDashboardHandler)
    except OSError as exc:
        if exc.errno != EADDRINUSE:
            raise
        server = ThreadingHTTPServer((HOST, 0), StockDashboardHandler)
        selected_port = int(server.server_address[1])
        print(
            f"Port {PORT} was busy, so the dashboard moved to http://{HOST}:{selected_port}",
            flush=True,
        )
    else:
        print(f"Stock dashboard running at http://{HOST}:{selected_port}", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
