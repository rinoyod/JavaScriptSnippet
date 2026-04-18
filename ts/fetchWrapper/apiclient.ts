/**
 * レスポンスの取得形式
 */
type ResponseType = "auto" | "json" | "text" | "blob" | "arrayBuffer";

/**
 * APIリクエストオプション
 */
export type ApiOptions = {
	/** HTTPメソッド（GET / POST / PUT / DELETE） */
	method?: string;

	/** ヘッダー */
	headers?: Record<string, string>;

	/** JSON送信（自動でContent-Type付与） */
	json?: any;

	/** FormData送信（multipart） */
	form?: Record<string, any>;

	/** 任意ボディ（Blob / string など） */
	body?: any;

	/** レスポンスの取得形式（auto推奨） */
	responseType?: ResponseType;

	/** Cookie送信制御 */
	credentials?: RequestCredentials;
};

/**
 * fetchのResponseをラップしたクラス
 * - bodyは1回しか読めないためキャッシュして再利用
 * - json/text/blobなどを安全に複数回取得可能
 */
export class ApiResponse {
	/** HTTPステータスコード */
	status: number;

	/** ステータスが2xxならtrue */
	ok: boolean;

	/** レスポンスヘッダー */
	headers: Headers;

	private _res: Response;
	private _type: ResponseType;

	/** パース結果キャッシュ */
	private _cache: {
		text?: string;
		json?: any;
		blob?: Blob;
		buffer?: ArrayBuffer;
		data?: any;
	} = {};

	/**
	 * @param res fetchのResponse
	 * @param type レスポンス取得形式
	 */
	constructor(res: Response, type: ResponseType = "auto") {
		this._res = res;
		this._type = type;
		this.status = res.status;
		this.ok = res.ok;
		this.headers = res.headers;
	}

	/**
	 * テキストとして取得
	 */
	async text(): Promise<string> {
		if (this._cache.text) return this._cache.text;
		this._cache.text = await this._res.text();
		return this._cache.text;
	}

	/**
	 * JSONとして取得
	 * @throws JSON parse error
	 */
	async json<T = any>(): Promise<T> {
		if (this._cache.json) return this._cache.json;

		const txt = await this.text();
		try {
			this._cache.json = JSON.parse(txt);
			return this._cache.json;
		} catch {
			throw new Error("JSON parse error");
		}
	}

	/**
	 * Blobとして取得（画像・PDFなど）
	 */
	async blob(): Promise<Blob> {
		if (this._cache.blob) return this._cache.blob;
		this._cache.blob = await this._res.blob();
		return this._cache.blob;
	}

	/**
	 * ArrayBufferとして取得（バイナリ）
	 */
	async arrayBuffer(): Promise<ArrayBuffer> {
		if (this._cache.buffer) return this._cache.buffer;
		this._cache.buffer = await this._res.arrayBuffer();
		return this._cache.buffer;
	}

	/**
	 * レスポンスを自動または指定形式で取得
	 *
	 * 優先順位：
	 * 1. responseType指定
	 * 2. Content-Type自動判定
	 * 3. fallback
	 */
	async data<T = any>(): Promise<T> {
		if (this._cache.data) return this._cache.data;

		// 明示指定
		if (this._type !== "auto") {
			this._cache.data = await this.parseByType(this._type);
			return this._cache.data;
		}

		// 自動判定
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

	/**
	 * 指定形式でパース
	 */
	private async parseByType(type: ResponseType) {
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
 * - fetchのラッパー
 * - headers / credentials / baseURL管理
 */
export class ApiClient {
	private baseUrl: string;
	private defaultHeaders: Record<string, string>;
	private defaultCredentials: RequestCredentials;

	/**
	 * @param config 初期設定
	 */
	constructor(config?: {
		baseUrl?: string;
		headers?: Record<string, string>;
		credentials?: RequestCredentials;
	}) {
		this.baseUrl = config?.baseUrl ?? "";
		this.defaultHeaders = config?.headers ?? {};
		this.defaultCredentials = config?.credentials ?? "same-origin";
	}

	/**
	 * デフォルトヘッダー設定
	 */
	setHeader(key: string, value: string) {
		this.defaultHeaders[key] = value;
	}

	/**
	 * Authorizationヘッダー設定
	 */
	setAuthToken(token: string) {
		this.defaultHeaders["Authorization"] = `Bearer ${token}`;
	}

	/**
	 * credentials設定（cookie制御）
	 */
	setCredentials(c: RequestCredentials) {
		this.defaultCredentials = c;
	}

	/**
	 * APIリクエスト実行
	 */
	async request(url: string, options: ApiOptions = {}) {
		const {
			method = "GET",
			headers = {},
			json,
			form,
			body,
			responseType = "auto",
			credentials,
		} = options;

		let finalBody: BodyInit | undefined;

		const finalHeaders = {
			...this.defaultHeaders,
			...headers,
		};

		// body生成
		if (json) {
			finalBody = JSON.stringify(json);
			finalHeaders["Content-Type"] = "application/json";
		} else if (form) {
			const fd = new FormData();
			Object.entries(form).forEach(([k, v]) => fd.append(k, v as any));
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

	/** GETリクエスト */
	get(url: string, opt?: ApiOptions) {
		return this.request(url, { ...opt, method: "GET" });
	}

	/** POSTリクエスト */
	post(url: string, opt?: ApiOptions) {
		return this.request(url, { ...opt, method: "POST" });
	}

	/** PUTリクエスト */
	put(url: string, opt?: ApiOptions) {
		return this.request(url, { ...opt, method: "PUT" });
	}

	/** DELETEリクエスト */
	delete(url: string, opt?: ApiOptions) {
		return this.request(url, { ...opt, method: "DELETE" });
	}
}
