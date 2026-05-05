Merges `develop` into `main` for release v1.4.3.

## Changes

- Fixed: Flow meter sensor now correctly reports "Unexpected flow" instead of "Wet soil" in irrigation history (issue #36)
- Fixed: Safety sweep — all zone valves are explicitly closed when the last active zone finishes
- Fixed: Manual start now supports a "Force start" option to bypass active sensor blocks
- New: Pump control — configure a pump entity (e.g. well pump) that starts/stops with irrigation
- New: Settings page — language selector (EN/PL/DE) and 6 customisable interface colours, persisted to DB

See [CHANGELOG](addon/CHANGELOG.md) for full details.
