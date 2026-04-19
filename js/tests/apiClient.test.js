// tests/apiClient.test.js
import { describe, it, expect } from "vitest";
import { ApiClient } from "../fetchWrapper/ApiClient.js";

const bseURL = "http://localhost";

describe("ApiClient + MSW", () => {

	it("GET: ユーザー一覧取得", async () => {
		const api = new ApiClient({
			baseUrl: bseURL
		});

		const res = await api.get("/api/users");
		const data = await res.data();

		expect(res.status).toBe(200);
		expect(res.ok).toBe(true);
		expect(data.length).toBe(2);
		expect(data[0].name).toBe("taro");
	});

	it("POST: ログイン成功", async () => {
		const api = new ApiClient({
			baseUrl: bseURL
		});

		const res = await api.post("/api/login", {
			json: {
				id: "user",
				password: "pass"
			}
		});

		const data = await res.data();

		expect(res.ok).toBe(true);
		expect(data.token).toBe("abc123");
	});

	it("POST: ログイン失敗", async () => {
		const api = new ApiClient({
			baseUrl: bseURL
		});

		const res = await api.post("/api/login", {
			json: {
				id: "wrong",
				password: "xxx"
			}
		});

		expect(res.status).toBe(401);
		expect(res.ok).toBe(false);
	});

	it("blob取得", async () => {
		const api = new ApiClient({
			baseUrl: bseURL
		});

		const res = await api.get("/api/file", {
			responseType: "blob"
		});

		const blob = await res.data();
		const text = await blob.text();

		expect(text).toBe("hello file");
	});

});
