.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview clean release hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_-]+:.*## / {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev: ## Run the frontend dev server
	npm run dev

build: ## Build the GitHub Pages-ready frontend into docs/
	npm run build

test: ## Run unit tests
	npm run test

test-integration: ## Run integration tests
	npm run test:e2e

smoke: ## Build, serve docs/, and run Playwright smoke tests
	npm run smoke

lint: ## Run all linters
	npm run fmt:check
	npm run lint
	npm run typecheck
	npm run audit

fmt: ## Autoformat source and docs
	npm run fmt

pages-preview: ## Serve docs/ locally like GitHub Pages
	npm run pages-preview

hooks-pre-commit: ## Run the pre-commit hook manually
	.githooks/pre-commit

hooks-commit-msg: ## Run the commit-msg hook manually with MSG=.git/COMMIT_EDITMSG
	.githooks/commit-msg $${MSG:-.git/COMMIT_EDITMSG}

hooks-pre-push: ## Run the pre-push hook manually
	.githooks/pre-push

release: ## Tag the current commit with the package version
	make test
	make build
	make smoke
	git tag "v$$(node -p "require('./package.json').version")"
	git push --tags

clean: ## Remove transient build artifacts
	rm -rf docs/assets docs/index.html docs/404.html docs/icon.svg docs/manifest.webmanifest docs/sw.js docs/version.json coverage tmp
