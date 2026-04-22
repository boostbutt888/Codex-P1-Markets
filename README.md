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

You can also use the helper scripts:

- Mac/Linux: `./run.sh`
- Windows: `run.bat`

On Mac, make the script executable once if needed:

```bash
chmod +x run.sh
```

## Use It Across Your Computers

On each machine, keep the project in sync with GitHub:

```bash
git pull
```

After you make changes:

```bash
git add .
git commit -m "Describe the change"
git push
```

Typical workflow:

1. On the machine you are using, open the repo folder.
2. Run `git pull` before starting work.
3. Start the app with `./run.sh` on Mac or `run.bat` on Windows.
4. Make your changes.
5. Run `git add .`
6. Run `git commit -m "Your message"`
7. Run `git push`

On a new machine, clone it first:

```bash
git clone https://github.com/boostbutt888/Codex-P1-Markets.git
```

## Windows 11 Setup

Before using the app on Windows:

1. Install Python 3
2. Install Git for Windows
3. Clone the repository
4. Run `run.bat`

Check Python:

```bash
py --version
```

If `py` does not work, try:

```bash
python --version
```

Clone and run on Windows:

```bash
git clone https://github.com/boostbutt888/Codex-P1-Markets.git
cd Codex-P1-Markets
run.bat
```

Set your Git identity once on Windows:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

If port `8000` is already in use, the app will automatically fall back to another
available localhost port and print the new URL in the terminal.

## Customize it

- Add or remove symbols in the UI
- Or edit `watchlist.json` directly
- Set a custom port with `STOCK_DASHBOARD_PORT=9000 python3 app.py`

## Notes

- The app stays on your Mac and binds only to `127.0.0.1`
- It still needs internet access when fetching market prices
- The default symbol mapping assumes U.S. tickers like `AAPL` -> `aapl.us`
- Stooq is a simple external data source, so availability can vary
