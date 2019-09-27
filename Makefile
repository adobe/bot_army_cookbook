
build: node_modules
	node index.js

node_modules: package.json
	npm install

dev:
	node index.js --dev

.PHONY: build
