clean:
	rm -rf node_modules
install:
	pnpm i
reinstall:
	make clean
	make install
docs-dev:
	cd docs && \
	rm -rf node_modules && \
	rm -rf .vitepress/cache && \
	pnpm i && \
	pnpm dev