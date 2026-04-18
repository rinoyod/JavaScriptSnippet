import { ApiClient } from "./ApiClient.js";

/**
 * ApiClientのシングルトン管理
 */
export class ApiService {
	static instance;

	/**
	 * @returns {ApiClient}
	 */
	static getInstance() {
		if (!this.instance) {
			this.instance = new ApiClient({
				baseUrl: import.meta.env.VITE_API_URL,
				credentials: "include",
			});

			this.instance.setHeader("X-App-Version", "1.0");
		}

		// 毎回最新トークン反映
		const token = localStorage.getItem("token");
		if (token) {
			this.instance.setAuthToken(token);
		}

		return this.instance;
	}

	/**
	 * テスト用差し替え
	 * @param {ApiClient} client
	 */
	static setInstance(client) {
		this.instance = client;
	}
}
