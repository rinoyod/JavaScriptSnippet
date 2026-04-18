import { ApiClient } from "./ApiClient";

export class ApiService {
	private static instance: ApiClient;

	static getInstance(): ApiClient {
		if (!this.instance) {
			this.instance = new ApiClient({
				baseUrl: import.meta.env.VITE_API_URL,
				credentials: "include",
			});

			this.instance.setHeader("X-App-Version", "1.0");
		}

		// 最新トークン反映
		const token = localStorage.getItem("token");
		if (token) {
			this.instance.setAuthToken(token);
		}

		return this.instance;
	}

	// テスト用差し替え
	static setInstance(client: ApiClient) {
		this.instance = client;
	}
}
