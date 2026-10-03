BACKEND_PORT ?= 8000
FRONTEND_PORT ?= 5000

.PHONY: install-backend install-frontend run-backend run-frontend

install-backend:
	cd backend && npm install

install-frontend:
	cd frontend && npm install

run-backend:
	cd backend && PORT=$(BACKEND_PORT) npm run dev

run-frontend:
	$(if $(BASE_BE_ENDPOINT),,$(error BASE_BE_ENDPOINT is not set))
	printf 'VITE_API_URL=%s\n' "$(BASE_BE_ENDPOINT)" > frontend/.env
	cd frontend && npm run dev -- --host 0.0.0.0 --port $(FRONTEND_PORT)
