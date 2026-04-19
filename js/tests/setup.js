// tests/setup.js
import { beforeAll, afterAll, afterEach } from "vitest";
import { server } from "./mocks/server.js";

// MSW起動
beforeAll(() => server.listen());

// 各テスト後にハンドラリセット
afterEach(() => server.resetHandlers());

// 終了時
afterAll(() => server.close());
