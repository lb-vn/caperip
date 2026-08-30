.PHONY: dev check deploy-worker

up-dev:
	@docker compose -f compose.dev.yml up -d --wait
	@trap 'docker compose -f compose.dev.yml down' EXIT; trap : INT; npm run dev

check:
	npm run format
	npm run check

deploy-worker:
	cd worker && npx wrangler deploy
