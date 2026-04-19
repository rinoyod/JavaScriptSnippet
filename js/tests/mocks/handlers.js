// tests/mocks/handlers.js
import { http, HttpResponse } from "msw";

const bseURL = "http://localhost";
export const handlers = [

	// GET: ユーザー一覧
	http.get(bseURL + "/api/users", () => {
		return HttpResponse.json([
			{ id: 1, name: "taro" },
			{ id: 2, name: "jiro" }
		]);
	}),

	// POST: ログイン
	http.post(bseURL + "/api/login", async ({ request }) => {
		const body = await request.json();

		if (body.id === "user" && body.password === "pass") {
			return HttpResponse.json({
				token: "abc123"
			});
		}

		return new HttpResponse("Unauthorized", { status: 401 });
	}),

	// ファイル（blob）
	http.get(bseURL + "/api/file", () => {
		const blob = new Blob(["hello file"], { type: "text/plain" });
		return new HttpResponse(blob, {
			headers: { "Content-Type": "text/plain" }
		});
	}),

];
