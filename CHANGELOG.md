# Changelog

All notable changes to this project should be documented in this file.

This log is written in a practical release-note style so the project can be understood without reading every git commit individually.

## [0.9.0] - 2026-04-28

### Added

- Separate watchlist support for `US` and `SGP` markets
- `All` watchlist view so both regional watchlists can be shown together
- Dedicated `View Watchlist` selector in the ticker section
- Market-aware benchmark behavior that follows the selected watchlist region
- Ticker search and company-name search suggestions in the add-watchlist form
- Search result selection that auto-fills ticker, label, and market
- Expanded `Random` theme option with a broader set of palette variants
- Release log file for tracking project changes by version

### Changed

- Watchlist cards in `All` view are now ordered with `US` first and `SGP` second
- Benchmark view now pauses comparison in `All` mode and prompts for regional selection
- Watchlist storage now includes market assignment per symbol
- Hero copy now refers to the dashboard running on your devices instead of only your Mac

### Notes

- Existing watchlist items are backward-compatible and default to `US` if no market was previously stored

## [0.8.0] - 2026-04-23

### Added

- Project manual in `MANUAL.md`
- Market heatmap drilldown behavior for sectors and broad-market groups
- Denser heatmap layout with higher stock-count options
- Position modal workflow for editing position sizes on each ticker card

### Changed

- Stock card chart moved higher in the card layout
- Premarket fallback logic improved when Yahoo omits explicit premarket change fields

## [0.7.0] - 2026-04-22

### Added

- Network/LAN launcher scripts for future dedicated-machine access
- Auto port fallback when `8000` is already in use
- `.gitattributes` for safer cross-platform line endings
- Windows setup notes in the README
- Login gate with hardcoded passcode protection
- Benchmark view with `S&P 500`, `Nasdaq`, `Dow`, and `VIX`
- Watchlist total value display
- LIVE / EOD quote badges
- Watchlist News section
- Market View heatmap section

### Changed

- Dark mode softened to use less harsh surfaces
- UI hierarchy and spacing improved across cards and benchmark controls

## [0.6.0] - 2026-04-21

### Added

- Optional stored positions per ticker
- Position-based value calculations
- Currency selector for `USD` and `SGD`
- Toggle for change display as percent or value
- Live and premarket quote display when available

### Changed

- Consolidated chart replaced by watchlist average vs benchmark view
- Global range filter expanded up to `Max`

## [0.5.0] - 2026-04-20

### Added

- Combined watchlist chart and later benchmark comparison chart
- Multiple benchmark overlays
- Individual stock cards with daily chart rendering

## [0.4.0] - 2026-04-19

### Added

- Local Python server for the dashboard
- Static frontend structure using HTML, CSS, and JavaScript
- Local watchlist persistence in `watchlist.json`
- Cross-machine git workflow support

## [0.1.0] - 2026-04-18

### Added

- Initial stock dashboard scaffold
- Basic local-only app setup
