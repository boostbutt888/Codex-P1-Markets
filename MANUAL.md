# Stock Dashboard Manual

This manual explains how to run and use the local stock dashboard.

## Overview

The app is a local web dashboard for monitoring:

- your personal watchlist
- daily and live stock prices
- watchlist performance against benchmarks
- recent ticker-specific news
- market heatmaps by broad market and sector

It stores your watchlist locally in `watchlist.json` and runs from your own machine.

## Starting The App

### Mac

From the project folder:

```bash
python3 app.py
```

or:

```bash
./run.sh
```

### Windows

From the project folder:

```bat
run.bat
```

If the default port is busy, the app will automatically move to another available local port and print the correct URL in the terminal.

## Opening The Dashboard

When the app starts, open the printed URL in your browser.

Typical local address:

```text
http://127.0.0.1:8000
```

## Passcode

The dashboard currently uses a simple built-in passcode gate.

- Passcode: `1010`

You must enter this code before the dashboard becomes available.

## Main Areas

### 1. Controls

This section manages how the dashboard behaves.

Available controls:

- `Refresh`: manually reloads dashboard data
- `Refresh mode`: switch between manual refresh and automatic refresh
- `Auto refresh every`: appears when auto refresh is enabled
- `Theme`: `Auto`, `Light`, or `Dark`
- `Currency`: `USD` or `SGD`
- `Change`: show stock movement as `%` or `Value`
- `Range`: change the chart period

### 2. Tickers

This is your watchlist section.

You can:

- add a ticker
- add an optional label
- remove a ticker
- view one card per stock

Each stock card shows:

- ticker and label
- LIVE or EOD badge
- mini chart
- current price
- change from yesterday
- exchange and currency
- quote source
- premarket line when available
- position and current value at the bottom

### 3. Position Button

Each stock card has a small `Position` button.

Clicking it opens a popup where you can:

- enter the number of shares or units you own
- clear the saved position
- save the new value

The card then calculates:

- `Position`
- `Value`

based on the current stock price.

### 4. Benchmark View

This compares your watchlist average against market benchmarks.

Available benchmark lines:

- `S&P 500`
- `Nasdaq`
- `Dow`
- `VIX`

You can toggle each benchmark independently.

This section also shows:

- normalized trend comparison
- total watchlist value

If all benchmarks are turned off, the watchlist line can still be shown by itself.

### 5. Watchlist News

This section groups recent headlines by ticker.

Features:

- news from roughly the past 3 days
- grouped by stock
- each ticker group can be expanded or collapsed
- headlines open in a new browser tab

### 6. Market View

This section provides a heatmap-style market overview similar to a simplified Finviz concept.

It includes:

- broad market tiles
- sector tiles
- green/red color intensity based on daily movement

Broad market and sector tiles can be selected to drill down into stocks within that group.

The drill-down view supports:

- smaller dense heatmap tiles
- sorting from strongest green at the top-left to strongest red at the bottom-right
- stock-count selector for showing more names in the expanded view

## Themes

The app supports:

- `Auto`
- `Light`
- `Dark`

`Auto` currently switches based on local time.

## Currency Display

You can switch display currency between:

- `USD`
- `SGD`

This affects:

- shown stock price
- position value
- watchlist total value
- value-based change displays

## Live Data Notes

The app tries to use live quote data when available.

Badge meanings:

- `LIVE`: live or near-real-time quote source
- `EOD`: end-of-day fallback data

Premarket data depends on what the upstream quote source provides. If a stock shows:

```text
Premarket: --
```

that means no usable premarket quote was returned for that ticker at that moment.

## Collapsible Sections

These sections can be expanded or collapsed:

- Controls
- Tickers
- Benchmark View
- Watchlist News
- Market View

The dashboard remembers the open or closed state in the browser.

## Watchlist Storage

Your watchlist is stored locally in:

```text
watchlist.json
```

This file may include:

- ticker symbol
- custom label
- saved position

## Using Git Across Computers

To continue the project on another machine:

```bash
git pull
```

After making changes:

```bash
git add .
git commit -m "Describe the change"
git push
```

## Troubleshooting

### App does not open

- make sure the Python process is still running
- check the terminal for the actual printed URL
- if port `8000` is busy, use the fallback port shown at startup

### Browser does not show the latest UI

Try a hard refresh:

- Chrome or Edge on Mac: `Cmd + Shift + R`
- Safari on Mac: `Option + Cmd + R`

### No live data

Possible reasons:

- upstream quote source unavailable
- network issue
- symbol not supported by the live endpoint

### Premarket line is empty

Possible reasons:

- there is no premarket session for that symbol at the time
- the quote source did not return usable premarket fields
- the symbol is falling back to end-of-day data

### Phone or other device cannot access the app

If the app is running in local-only mode, only the current computer can open it.

For same-network access later, run the LAN helper script instead:

- Mac/Linux: `./run-lan.sh`
- Windows: `run-lan.bat`

## Suggested Daily Workflow

1. Start the app.
2. Enter the passcode.
3. Refresh data.
4. Review watchlist cards.
5. Check benchmark performance.
6. Scan watchlist news.
7. Use Market View for a broad market read.

## Repo Files

Important files in this project:

- `app.py`: Python server and data-fetch logic
- `static/index.html`: dashboard structure
- `static/app.js`: dashboard behavior
- `static/styles.css`: dashboard styling
- `watchlist.json`: local watchlist storage
- `README.md`: setup and repo notes
- `MANUAL.md`: this manual
