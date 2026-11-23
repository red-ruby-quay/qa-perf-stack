# qa-perf-stack

A small, reproducible performance-testing stack built with **k6**, **InfluxDB**, **Grafana**, and a synthetic demo API. Every endpoint, credential, and dataset in this repository is fake and exists only to exercise the test harness.

## What it demonstrates

- k6 smoke and ramping-load scenarios with service-level thresholds.
- Custom business metrics (`business_errors`, `login_duration`) alongside standard HTTP metrics.
- InfluxDB output and a provisioned Grafana dashboard.
- Docker Compose orchestration with API health checks.
- A GitHub Actions smoke run that starts the stack and writes results to InfluxDB.

## Architecture

```text
+-----------+       +-----------+       +-----------+
|   k6      | ----> |  demo API |       |  Grafana  |
|  scripts  |       |  Node.js  |       |  :3001    |
+-----+-----+       +-----+-----+       +-----+-----+
      |                   |                   |
      |                   |                   |
      v                   v                   v
+-----------+       +-----------+       +-----------+
| InfluxDB  | <---- |  results  | ----> | dashboard |
|  :8086    |       |  metrics  |       | provision |
+-----------+       +-----------+       +-----------+
```

## Quick start

Prerequisites: Docker with the Compose plugin.

```bash
cp .env.example .env
# set a non-default Grafana password in .env
docker compose up -d api influxdb grafana
docker compose run --rm k6
```

Open Grafana at <http://localhost:3001>. The provisioned dashboard is under the **Performance** folder.

Run the ramping-load scenario:

```bash
docker compose run --rm k6 run /scripts/load.js
```

Stop the stack:

```bash
docker compose down -v
```

## Demo API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| POST | `/login` | Returns a demo token for `demo` / `demo` |
| GET | `/items?limit=10` | Returns synthetic catalog items |
| POST | `/orders` | Creates an in-memory order |
| GET | `/orders/:id` | Reads a created order |

`BASE_LATENCY_MS` adds deterministic baseline latency (default `40` ms) plus small jitter so the dashboard has something meaningful to show.

## Scenarios

| Script | Load profile | Thresholds |
| --- | --- | --- |
| `k6/scripts/smoke.js` | 5 VUs for 15 s | p95 < 500 ms, failures < 1%, business errors < 1% |
| `k6/scripts/load.js` | ramp 0 -> 10 -> 20 -> 0 VUs over 60 s | p95 < 800 ms, failures < 2%, business errors < 2% |

The shared flow lives in `k6/scripts/lib/flow.js` so both scenarios exercise the same user journey.

## CI

`.github/workflows/perf.yml` runs on every push and pull request:

1. validates the Compose file and dashboard JSON;
2. starts the API and InfluxDB;
3. waits for the API health check;
4. runs the k6 smoke scenario with InfluxDB output;
5. tears the stack down.

## Design notes

- The API is intentionally in-memory. It is a target for the performance harness, not a production service.
- InfluxDB 1.8 is used because k6's native `--out influxdb` writer targets the 1.x line.
- The Grafana dashboard is provisioned as code; there is no manual clicking required.
- Log shipping (Loki/Alloy) is deliberately out of scope so the core stack stays fast and easy to reproduce.

## License

MIT. See [LICENSE](LICENSE).

## Author

Rihan Yosral — QA Automation Engineer · <https://github.com/red-ruby-quay>
