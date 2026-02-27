/**
 * mini-fetch.ts
 * Lightweight Fetch wrapper for browser front-end.
 */

/**
 * レスポンスの型を表す列挙。
 *
 * - "auto": Content-Typeに応じて自動判定
 * - "json": JSONとしてパース
 * - "text": テキストとして取得
 * - "blob": Blobとして取得（ファイル等）
 * - "arrayBuffer": ArrayBufferとして取得（バイナリデータ）
 */
export type ResponseType =
	| "auto"
	| "json"
	| "text"
	| "blob"
	| "arrayBuffer";

/**
 * APIリクエストのオプション。
 *
 * 各プロパティはリクエストごとに個別設定可能。
 *
 * @property query クエリパラメータ（URLに付加）
 * @property headers 追加ヘッダー
 * @property timeout タイムアウト（ミリ秒）
 * @property credentials fetchの認証設定（"include"等）
 * @property responseType レスポンス型
 * @property download ファイルダウンロードフラグ
 * @property filename ダウンロード時のファイル名
 * @property retry リトライ回数
 * @property retryDelay リトライ間隔（ミリ秒）
 * @property retryOn リトライ判定関数
 */
export interface RequestOptions {
	query?: Record<string, any>;
	headers?: HeadersInit;
	timeout?: number;
	credentials?: RequestCredentials;
	responseType?: ResponseType;
	download?: boolean;
	filename?: string;

	retry?: number;
	retryDelay?: number;
	retryOn?: (err: any) => boolean;
}

/**
 * APIのデフォルト設定。
 *
 * createApi()で指定する全体の共通設定。
 *
 * @property headers 共通ヘッダー
 * @property timeout デフォルトタイムアウト
 * @property credentials デフォルト認証設定
 * @property retry デフォルトリトライ回数
 * @property retryDelay デフォルトリトライ間隔
 * @property getHeaders 実行時に動的ヘッダー取得関数
 */
export interface ApiDefaults {
	headers?: HeadersInit;
	timeout?: number;
	credentials?: RequestCredentials;
	retry?: number;
	retryDelay?: number;
	getHeaders?: () => HeadersInit;
}

/**
 * APIリクエストのエラーを表すクラス。
 *
 * fetchリクエスト失敗時にスローされる。
 *
 * @property status HTTPステータスコード
 * @property data レスポンスデータ（パース済み）
 * @property headers レスポンスヘッダー
 * @property response fetch Responseオブジェクト
 */
export class ApiError extends Error {
	status: number;
	data: any;
	headers: Headers;
	response: Response;

	constructor(res: Response, data: any) {
		super(`HTTP ${res.status}`);
		this.name = "ApiError";
		this.status = res.status;
		this.data = data;
		this.headers = res.headers;
		this.response = res;
	}
}

export function createApi(baseURL = "", defaults: ApiDefaults = {}) {
	/**
	 * APIリクエストを送信します。
	 * @param method HTTPメソッド
	 * @param path リクエストパス
	 * @param body リクエストボディ
	 * @param opt オプション
	 * @returns レスポンスデータ
	 */
	async function request(
		method: string,
		path: string,
		body?: any,
		opt: RequestOptions = {}
	): Promise<any> {
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

	/**
	 * fetchリクエストを実行します。
	 * @param method HTTPメソッド
	 * @param path リクエストパス
	 * @param body リクエストボディ
	 * @param opt オプション
	 * @returns レスポンスデータ
	 */
	async function executeRequest(
		method: string,
		path: string,
		body: any,
		opt: RequestOptions
	): Promise<any> {
		const url = buildUrl(baseURL, path, opt.query);

		const controller = new AbortController();
		const timeout = opt.timeout ?? defaults.timeout;

		let timer: ReturnType<typeof setTimeout> | undefined;
		if (timeout) {
			timer = setTimeout(() => controller.abort(), timeout);
		}

		const preparedBody = prepareBody(body);

		const mergedHeaders: HeadersInit = {
			...(shouldSetJsonHeader(preparedBody) && {
				"Content-Type": "application/json",
			}),
			...(defaults.headers || {}),
			...(defaults.getHeaders?.() || {}),
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
		} catch (e: any) {
			if (e.name === "AbortError") {
				throw new Error("Request timeout");
			}
			throw e;
		} finally {
			if (timer) clearTimeout(timer);
		}
	}

	return {
		/**
		 * GETリクエストを送信します。
		 * @param p パス
		 * @param o オプション
		 */
		get: (p: string, o?: RequestOptions) =>
			request("GET", p, undefined, o),

		/**
		 * POSTリクエストを送信します。
		 * @param p パス
		 * @param b ボディ
		 * @param o オプション
		 */
		post: (p: string, b?: any, o?: RequestOptions) =>
			request("POST", p, b, o),

		/**
		 * PUTリクエストを送信します。
		 * @param p パス
		 * @param b ボディ
		 * @param o オプション
		 */
		put: (p: string, b?: any, o?: RequestOptions) =>
			request("PUT", p, b, o),

		/**
		 * PATCHリクエストを送信します。
		 * @param p パス
		 * @param b ボディ
		 * @param o オプション
		 */
		patch: (p: string, b?: any, o?: RequestOptions) =>
			request("PATCH", p, b, o),

		/**
		 * DELETEリクエストを送信します。
		 * @param p パス
		 * @param o オプション
		 */
		delete: (p: string, o?: RequestOptions) =>
			request("DELETE", p, undefined, o),

		/**
		 * ファイルダウンロード用GETリクエストを送信します。
		 * @param p パス
		 * @param o オプション
		 */
		download: (p: string, o?: RequestOptions) =>
			request("GET", p, undefined, { ...o, download: true }),
	};
}

/* -------------------- Helpers -------------------- */

/**
 * URLを組み立てます。
 * @param base ベースURL
 * @param path パス
 * @param query クエリパラメータ
 * @returns 完成したURL
 */
function buildUrl(
	base: string,
	path: string,
	query?: Record<string, any>
): string {
	const url = new URL(path, base);
	if (query) {
		for (const k in query) {
			url.searchParams.append(k, String(query[k]));
		}
	}
	return url.toString();
}

/**
 * リクエストボディを適切な形式に変換します。
 * @param body ボディ
 * @returns BodyInitまたはundefined
 */
function prepareBody(body: any): BodyInit | undefined {
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
 * JSONヘッダーを付与すべきか判定します。
 * @param body ボディ
 * @returns 判定結果
 */
function shouldSetJsonHeader(body: any): boolean {
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
 * レスポンスボディをパースします。
 * @param res Responseオブジェクト
 * @param contentType Content-Type
 * @param type レスポンスタイプ
 * @returns パース済みデータ
 */
async function parseBody(
	res: Response,
	contentType: string,
	type: ResponseType = "auto"
): Promise<any> {
	if (type === "json") return res.json();
	if (type === "text") return res.text();
	if (type === "blob") return res.blob();
	if (type === "arrayBuffer") return res.arrayBuffer();

	if (contentType.includes("application/json")) return res.json();
	if (contentType.includes("text")) return res.text();

	return res.blob();
}

/**
 * ファイルダウンロード処理を行います。
 * @param res Responseオブジェクト
 * @param disposition Content-Disposition
 * @param opt オプション
 */
async function handleDownload(
	res: Response,
	disposition: string,
	opt: RequestOptions
): Promise<void> {
	const blob = await res.blob();
	save(blob, extractFilename(disposition, opt));
}

/**
 * ファイル名を抽出します。
 * @param disposition Content-Disposition
 * @param opt オプション
 * @returns ファイル名
 */
function extractFilename(
	disposition: string,
	opt: RequestOptions
): string {
	if (opt.filename) return opt.filename;
	const m = disposition.match(/filename="?(.+?)"?$/);
	return m?.[1] || "download";
}

/**
 * ブラウザでファイルを保存します。
 * @param blob Blobデータ
 * @param name ファイル名
 */
function save(blob: Blob, name: string): void {
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
 * リトライすべきか判定します。
 * @param err エラー
 * @param method HTTPメソッド
 * @param opt オプション
 * @returns 判定結果
 */
function shouldRetryRequest(
	err: any,
	method: string,
	opt: RequestOptions
): boolean {
	if (typeof opt.retryOn === "function") {
		return opt.retryOn(err);
	}

	if (method !== "GET") return false;

	if (!(err instanceof ApiError)) return true;

	return err.status >= 500;
}

/**
 * 指定ミリ秒待機します。
 * @param ms ミリ秒
 * @returns Promise<void>
 */
function wait(ms: number): Promise<void> {
	return new Promise((res) => setTimeout(res, ms));
}
