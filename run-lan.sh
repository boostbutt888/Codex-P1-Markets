#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
export STOCK_DASHBOARD_HOST="0.0.0.0"
python3 app.py
