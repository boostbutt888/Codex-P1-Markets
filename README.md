# Daily Stock Dashboard

A lightweight local-only stock dashboard that runs on your Mac and stores your
watchlist in a file on disk.

This repository is the shared stock market monitoring app intended to work
across your computers while still running locally on each machine.

## What it does

- Serves a dashboard on `http://127.0.0.1:8000`
- Saves your selected tickers in `watchlist.json`
- Fetches daily market data from Stooq at runtime
- Renders one chart card per stock with current price and day change

## Run it

```bash
python3 app.py
```

Then open `http://127.0.0.1:8000` in your browser.

## Customize it

- Add or remove symbols in the UI
- Or edit `watchlist.json` directly
- Set a custom port with `STOCK_DASHBOARD_PORT=9000 python3 app.py`

## Notes

- The app stays on your Mac and binds only to `127.0.0.1`
- It still needs internet access when fetching market prices
- The default symbol mapping assumes U.S. tickers like `AAPL` -> `aapl.us`
- Stooq is a simple external data source, so availability can vary
