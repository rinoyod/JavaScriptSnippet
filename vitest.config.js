// vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: "./js/tests/setup.js",
	},
});

//テスト実行コマンド
//nom run test
//
//詳細みながら
//npm run test -- --reporter=verbose
