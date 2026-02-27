/**
 * mini-fetch.js
 * Lightweight Fetch wrapper for browser front-end.
 *
 * @module mini-fetch
 */

/**
 * HTTPエラー時にthrowされるカスタムエラー
 * @extends Error
 */
export class ApiError extends Error {
	/**
	 * @param {Response} res Fetch Responseオブジェクト
	 * @param {*} data パース済みレスポンスボディ
	 */
	constructor(res, data) {
		super(`HTTP ${res.status}`);
		this.name = "ApiError";

		/** @type {number} */
		this.status = res.status;

		/** @type {*} */
		this.data = data;

		/** @type {Headers} */
		this.headers = res.headers;

		/** @type {Response} */
		this.response = res;
	}
}

/**
 * APIクライアントを生成
 *
 * @param {string} [baseURL=""] ベースURL
 * @param {Object} [defaults={}] デフォルト設定
 * @param {HeadersInit} [defaults.headers] 共通ヘッダー
 * @param {number} [defaults.timeout] 共通タイムアウト(ms)
 * @param {RequestCredentials} [defaults.credentials] credentials設定
 * @param {number} [defaults.retry] 共通リトライ回数
 * @param {number} [defaults.retryDelay] 初期待機時間(ms)
 * @param {() => HeadersInit} [defaults.getHeaders] 動的ヘッダー取得関数
 *
 * @returns {{
 *  get: (path: string, options?: RequestOptions) => Promise<any>,
 *  post: (path: string, body?: any, options?: RequestOptions) => Promise<any>,
 *  put: (path: string, body?: any, options?: RequestOptions) => Promise<any>,
 *  patch: (path: string, body?: any, options?: RequestOptions) => Promise<any>,
 *  delete: (path: string, options?: RequestOptions) => Promise<any>,
 *  download: (path: string, options?: RequestOptions) => Promise<void>
 * }}
 */
export function createApi(baseURL = "", defaults = {}) {
	/**
	 * @typedef {Object} RequestOptions
	 * @property {Object.<string, any>} [query] クエリパラメータ
	 * @property {HeadersInit} [headers] 個別ヘッダー
	 * @property {number} [timeout] 個別タイムアウト(ms)
	 * @property {RequestCredentials} [credentials] credentials設定
	 * @property {"auto"|"json"|"text"|"blob"|"arrayBuffer"} [responseType]
	 * @property {boolean} [download] ダウンロード制御
	 * @property {string} [filename] ダウンロード時ファイル名
	 * @property {number} [retry] リトライ回数
	 * @property {number} [retryDelay] 初期待機時間(ms)
	 * @property {(error:any)=>boolean} [retryOn] 独自リトライ判定
	 */
	async function request(method, path, body, opt = {}) {
		const retries = opt.retry ?? defaults.retry ?? 0;
		const retryDelay = opt.retryDelay ?? defaults.retryDelay ?? 500;

		let attempt = 0;

		while (true) {
			try {
				return await executeRequest(method, path, body, opt);
			} catch (err) {
				const shouldRetry =
					attempt < retries &&
					shouldRetryRequest(err, method, opt);

				if (!shouldRetry) throw err;

				attempt++;
				const delay = retryDelay * Math.pow(2, attempt - 1);
				await wait(delay);
			}
		}
	}

	async function executeRequest(method, path, body, opt) {
		const url = buildUrl(baseURL, path, opt.query);

		const controller = new AbortController();
		const timeout = opt.timeout ?? defaults.timeout;

		let timer;
		if (timeout) {
			timer = setTimeout(() => controller.abort(), timeout);
		}

		const preparedBody = prepareBody(body);

		const mergedHeaders = {
			...(shouldSetJsonHeader(preparedBody) && {
				"Content-Type": "application/json",
			}),
			...(defaults.headers || {}),
			...(typeof defaults.getHeaders === "function"
				? defaults.getHeaders()
				: {}),
			...(opt.headers || {}),
		};

		try {
			const res = await fetch(url, {
				method,
				headers: mergedHeaders,
				body: preparedBody,
				credentials: opt.credentials ?? defaults.credentials,
				signal: controller.signal,
			});

			const contentType = res.headers.get("content-type") || "";
			const disposition = res.headers.get("content-disposition") || "";

			if (!res.ok) {
				const errorData = await parseBody(
					res,
					contentType,
					opt.responseType
				);
				throw new ApiError(res, errorData);
			}

			const isFile =
				disposition.includes("attachment") ||
				contentType.includes("octet-stream") ||
				contentType.includes("pdf") ||
				contentType.includes("vnd");

			const shouldDownload =
				opt.download === true ||
				(opt.download !== false && isFile);

			if (shouldDownload) {
				await handleDownload(res, disposition, opt);
				return;
			}

			return parseBody(res, contentType, opt.responseType);
		} catch (e) {
			if (e.name === "AbortError") {
				throw new Error("Request timeout");
			}
			throw e;
		} finally {
			if (timer) clearTimeout(timer);
		}
	}

	return {
		get: (p, o) => request("GET", p, undefined, o),
		post: (p, b, o) => request("POST", p, b, o),
		put: (p, b, o) => request("PUT", p, b, o),
		patch: (p, b, o) => request("PATCH", p, b, o),
		delete: (p, o) => request("DELETE", p, undefined, o),
		download: (p, o) =>
			request("GET", p, undefined, { ...o, download: true }),
	};
}

/* -------------------- Helpers -------------------- */

/**
 * URLを構築
 * @param {string} base
 * @param {string} path
 * @param {Object.<string, any>} [query]
 * @returns {string}
 */
function buildUrl(base, path, query) {
	const url = new URL(path, base);
	if (query) {
		for (const k in query) {
			url.searchParams.append(k, String(query[k]));
		}
	}
	return url.toString();
}

/**
 * リクエストボディを適切な形式に変換
 * @param {*} body
 * @returns {*}
 */
function prepareBody(body) {
	if (!body) return undefined;

	if (
		body instanceof FormData ||
		body instanceof Blob ||
		body instanceof File ||
		body instanceof URLSearchParams
	) return body;

	if (typeof body === "string") return body;

	return JSON.stringify(body);
}

/**
 * JSONヘッダーを自動付与するか判定
 * @param {*} body
 * @returns {boolean}
 */
function shouldSetJsonHeader(body) {
	return (
		body &&
		!(body instanceof FormData) &&
		!(body instanceof Blob) &&
		!(body instanceof File) &&
		!(body instanceof URLSearchParams) &&
		typeof body !== "string"
	);
}

/**
 * レスポンスボディをパース
 * @param {Response} res
 * @param {string} contentType
 * @param {"auto"|"json"|"text"|"blob"|"arrayBuffer"} [type]
 * @returns {Promise<any>}
 */
async function parseBody(res, contentType, type = "auto") {
	if (type === "json") return res.json();
	if (type === "text") return res.text();
	if (type === "blob") return res.blob();
	if (type === "arrayBuffer") return res.arrayBuffer();

	if (contentType.includes("application/json")) return res.json();
	if (contentType.includes("text")) return res.text();

	return res.blob();
}

/**
 * ダウンロード処理
 * @param {Response} res
 * @param {string} disposition
 * @param {Object} opt
 */
async function handleDownload(res, disposition, opt) {
	const blob = await res.blob();
	save(blob, extractFilename(disposition, opt));
}

/**
 * ファイル名抽出
 * @param {string} disposition
 * @param {Object} opt
 * @returns {string}
 */
function extractFilename(disposition, opt) {
	if (opt.filename) return opt.filename;
	const m = disposition.match(/filename="?(.+?)"?$/);
	return (m && m[1]) || "download";
}

/**
 * Blobを保存
 * @param {Blob} blob
 * @param {string} name
 */
function save(blob, name) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

/**
 * リトライ判定
 * @param {*} err
 * @param {string} method
 * @param {Object} opt
 * @returns {boolean}
 */
function shouldRetryRequest(err, method, opt) {
	if (typeof opt.retryOn === "function") {
		return opt.retryOn(err);
	}

	if (method !== "GET") return false;

	if (!(err instanceof ApiError)) return true;

	return err.status >= 500;
}

/**
 * 指定時間待機
 * @param {number} ms
 * @returns {Promise<void>}
 */
function wait(ms) {
	return new Promise((res) => setTimeout(res, ms));
}
