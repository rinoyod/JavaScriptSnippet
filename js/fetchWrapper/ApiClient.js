/**
 * @typedef {"auto" | "json" | "text" | "blob" | "arrayBuffer"} ResponseType
 */

/**
 * @typedef {Object} ApiOptions
 * @property {string} [method]
 * @property {Object.<string, string>} [headers]
 * @property {any} [json]
 * @property {Object.<string, any>} [form]
 * @property {any} [body]
 * @property {ResponseType} [responseType]
 * @property {RequestCredentials} [credentials]
 */

/**
 * fetchのResponseラッパー
 */
export class ApiResponse {
	/**
	 * @param {Response} res
	 * @param {ResponseType} [type]
	 */
	constructor(res, type = "auto") {
		this._res = res;
		this._type = type;

		/** @type {number} */
		this.status = res.status;

		/** @type {boolean} */
		this.ok = res.ok;

		/** @type {Headers} */
		this.headers = res.headers;

		this._cache = {};
	}

	/** @returns {Promise<string>} */
	async text() {
		if (this._cache.text) return this._cache.text;
		this._cache.text = await this._res.text();
		return this._cache.text;
	}

	/** @template T @returns {Promise<T>} */
	async json() {
		if (this._cache.json) return this._cache.json;

		const txt = await this.text();
		try {
			this._cache.json = JSON.parse(txt);
			return this._cache.json;
		} catch {
			throw new Error("JSON parse error");
		}
	}

	/** @returns {Promise<Blob>} */
	async blob() {
		if (this._cache.blob) return this._cache.blob;
		this._cache.blob = await this._res.blob();
		return this._cache.blob;
	}

	/** @returns {Promise<ArrayBuffer>} */
	async arrayBuffer() {
		if (this._cache.buffer) return this._cache.buffer;
		this._cache.buffer = await this._res.arrayBuffer();
		return this._cache.buffer;
	}

	/**
	 * デフォルト取得（auto or 指定）
	 * @template T
	 * @returns {Promise<T>}
	 */
	async data() {
		if (this._cache.data) return this._cache.data;

		// 明示指定
		if (this._type !== "auto") {
			this._cache.data = await this._parseByType(this._type);
			return this._cache.data;
		}

		const ct = this.headers.get("content-type") || "";

		if (ct.includes("application/json")) {
			this._cache.data = await this.json();
			return this._cache.data;
		}

		if (ct.includes("text/") || ct.includes("html") || ct.includes("xml")) {
			this._cache.data = await this.text();
			return this._cache.data;
		}

		if (
			ct.includes("image/") ||
			ct.includes("pdf") ||
			ct.includes("zip") ||
			ct.includes("octet-stream")
		) {
			this._cache.data = await this.blob();
			return this._cache.data;
		}

		// fallback
		try {
			const txt = await this.text();
			if (txt.startsWith("{") || txt.startsWith("[")) {
				this._cache.data = JSON.parse(txt);
				return this._cache.data;
			}
			this._cache.data = txt;
			return this._cache.data;
		} catch {
			this._cache.data = await this.arrayBuffer();
			return this._cache.data;
		}
	}

	/** @private */
	async _parseByType(type) {
		switch (type) {
			case "json":
				return this.json();
			case "text":
				return this.text();
			case "blob":
				return this.blob();
			case "arrayBuffer":
				return this.arrayBuffer();
			default:
				return this.text();
		}
	}
}

/**
 * APIクライアント
 */
export class ApiClient {
	/**
	 * @param {{
	 *  baseUrl?: string,
	 *  headers?: Object.<string, string>,
	 *  credentials?: RequestCredentials
	 * }} [config]
	 */
	constructor(config = {}) {
		this.baseUrl = config.baseUrl || "";
		this.defaultHeaders = config.headers || {};
		this.defaultCredentials = config.credentials || "same-origin";
	}

	/** @param {string} key @param {string} value */
	setHeader(key, value) {
		this.defaultHeaders[key] = value;
	}

	/** @param {string} token */
	setAuthToken(token) {
		this.defaultHeaders["Authorization"] = `Bearer ${token}`;
	}

	/** @param {RequestCredentials} c */
	setCredentials(c) {
		this.defaultCredentials = c;
	}

	/**
	 * @param {string} url
	 * @param {ApiOptions} [options]
	 */
	async request(url, options = {}) {
		const {
			method = "GET",
			headers = {},
			json,
			form,
			body,
			responseType = "auto",
			credentials,
		} = options;

		let finalBody;

		const finalHeaders = {
			...this.defaultHeaders,
			...headers,
		};

		if (json) {
			finalBody = JSON.stringify(json);
			finalHeaders["Content-Type"] = "application/json";
		} else if (form) {
			const fd = new FormData();
			Object.entries(form).forEach(([k, v]) => fd.append(k, v));
			finalBody = fd;
		} else if (body) {
			finalBody = body;
		}

		const res = await fetch(this.baseUrl + url, {
			method,
			headers: finalHeaders,
			body: finalBody,
			credentials: credentials ?? this.defaultCredentials,
		});

		return new ApiResponse(res, responseType);
	}

	get(url, opt) {
		return this.request(url, { ...opt, method: "GET" });
	}

	post(url, opt) {
		return this.request(url, { ...opt, method: "POST" });
	}

	put(url, opt) {
		return this.request(url, { ...opt, method: "PUT" });
	}

	delete(url, opt) {
		return this.request(url, { ...opt, method: "DELETE" });
	}
}
