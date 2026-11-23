.PHONY: up down smoke load logs

up:
	docker compose up -d api influxdb grafana

down:
	docker compose down -v

smoke:
	docker compose run --rm k6 run /scripts/smoke.js

load:
	docker compose run --rm k6 run /scripts/load.js

logs:
	docker compose logs -f api influxdb grafana
