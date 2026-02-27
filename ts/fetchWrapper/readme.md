

# 📦 mini-fetch

軽量・依存ゼロのブラウザ専用 Fetch ラッパー。



## ✨ 特徴

* 依存なし
* 自動JSON変換
* FormData自動対応（POST / PUT / PATCH）
* 自動ファイルダウンロード判定
* timeout（AbortController）
* retry（指数バックオフ）
* ApiError にレスポンス情報を保持
* 各メソッドごとに個別ヘッダー指定可能
* グローバル + 動的ヘッダー対応
* axios風APIを超軽量で実現


## 📥 インポート
JavaScript
```js
import { createApi, ApiError } from "./mini-fetch.js";
```


## 🚀 基本使用
JavaScript
```js
const api = createApi("https://api.example.com");

const user = await api.get("/users/1");
```


## 🏗 createApi
TypeScript
```ts
createApi(baseURL?: string, defaults?: ApiDefaults)
```


## ⚙ ApiDefaults（グローバル設定）
TypeScript
```ts
{
  headers?: HeadersInit;
  timeout?: number;
  credentials?: RequestCredentials;
  retry?: number;
  retryDelay?: number;
  getHeaders?: () => HeadersInit;
}
```

### 🔹 headers

全リクエスト共通の固定ヘッダー。


### 🔹 timeout

共通タイムアウト（ms）。

* AbortControllerで中断
* timeoutエラーは retry 対象


### 🔹 credentials

```
"omit" | "same-origin" | "include"
```

### 🔹 retry

共通リトライ回数。

* デフォルト: 0
* GETのみ自動リトライ
* 500系エラー対象


### 🔹 retryDelay

初期待機時間（ms）

指数バックオフ：

```
delay = retryDelay * 2^(attempt-1)
```

### 🔹 getHeaders（動的ヘッダー）

```ts
() => HeadersInit
```

毎リクエスト時に実行される。

```js
const api = createApi("", {
  getHeaders: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`
  })
});
```


## 🔀 ヘッダーマージ優先順位

```
1 自動JSONヘッダー
↓
2 defaults.headers
↓
3 defaults.getHeaders()
↓
4 各メソッド options.headers（最優先）
```

## 📡 メソッド一覧

| メソッド                         | 説明     | 個別ヘッダー |
| ---------------------------- | ------ | ------ |
| get(path, options?)          | データ取得  | ✅      |
| post(path, body?, options?)  | 作成     | ✅      |
| put(path, body?, options?)   | 全体更新   | ✅      |
| patch(path, body?, options?) | 部分更新   | ✅      |
| delete(path, options?)       | 削除     | ✅      |
| download(path, options?)     | ダウンロード | ✅      |


## 🧩 RequestOptions

```ts
{
  query?: Record<string, any>;
  headers?: HeadersInit;
  timeout?: number;
  credentials?: RequestCredentials;
  responseType?: "auto" | "json" | "text" | "blob" | "arrayBuffer";
  download?: boolean;
  filename?: string;

  retry?: number;
  retryDelay?: number;
  retryOn?: (error: any) => boolean;
}
```


## 🔎 RequestOptions 詳細

### 🔹 query

```js
await api.get("/users", {
  query: { page: 1, size: 20 }
});
```

→ `/users?page=1&size=20`

* String()で文字列化
* 配列は自動展開しない


### 🔹 headers（各メソッド個別指定可）

全メソッドで個別指定可能。

#### GET

```js
await api.get("/users", {
  headers: {
    "X-App-Version": "1.2.3"
  }
});
```

#### POST

```js
await api.post("/orders", orderData, {
  headers: {
    "X-Request-ID": crypto.randomUUID()
  }
});
```

#### PUT

```js
await api.put("/users/1", data, {
  headers: {
    "X-Update-Reason": "admin-change"
  }
});
```

#### PATCH

```js
await api.patch("/users/1", data, {
  headers: {
    "X-Partial-Update": "true"
  }
});
```

#### DELETE

```js
await api.delete("/users/1", {
  headers: {
    "X-Soft-Delete": "true"
  }
});
```

#### download

```js
await api.download("/export", {
  headers: {
    "X-Export-Type": "full"
  }
});
```

#### 🔹 timeout（個別指定可）

```js
await api.get("/slow", { timeout: 3000 });
```


#### 🔹 credentials（個別指定可）

```js
await api.get("/me", { credentials: "include" });
```


### 🔹 responseType

```
"auto" | "json" | "text" | "blob" | "arrayBuffer"
```

#### auto判定

| content-type     | 処理     |
| ---------------- | ------ |
| application/json | json() |
| text/*           | text() |
| その他              | blob() |


### 🔹 download

```
true  → 強制DL
false → 無効
未指定 → 自動判定
```

自動判定条件：

* Content-Disposition: attachment
* content-type に octet-stream / pdf / vnd


### 🔹 filename

未指定時：

* Content-Disposition から抽出
* なければ `"download"`

### 🔹 retry（個別指定可）

* GETは自動対象
* POST/PUT/PATCHは明示指定時のみ

```js
await api.post("/retryable", data, {
  retry: 3,
  retryOn: () => true
});
```


### 🔹 retryDelay

指数バックオフ適用。


### 🔹 retryOn

```js
retryOn: (err) => boolean
```

独自リトライ条件。


## 📥 データ取得（GET）

### 基本

```js
const user = await api.get("/users/1");
```

### 一覧

```js
const users = await api.get("/users");
```

### クエリ付き

```js
await api.get("/users", {
  query: { page: 1 }
});
```

### text取得

```js
await api.get("/version", {
  responseType: "text"
});
```

### blob取得（DLしない）

```js
const blob = await api.get("/image/1", {
  responseType: "blob",
  download: false
});
```

### arrayBuffer取得

```js
await api.get("/binary", {
  responseType: "arrayBuffer"
});
```



## 📤 データ送信（POST / PUT / PATCH）

### POST（JSON）

```js
await api.post("/users", {
  name: "John"
});
```

* 自動JSON化
* Content-Type自動付与


### POST（FormData）

```js
const form = new FormData();
form.append("file", file);

await api.post("/upload", form);
```

* Content-Type自動削除（ブラウザ任せ）


### PUT（全体更新）

```js
await api.put("/users/1", {
  name: "Updated"
});
```


### PATCH（部分更新）

```js
await api.patch("/users/1", {
  email: "new@example.com"
});
```


### PUT/PATCH（FormData）

```js
await api.patch("/users/1/avatar", form);
```


## ⬇ ファイルダウンロード

### 自動判定

```js
await api.get("/export");
```

### 強制

```js
await api.get("/export", { download: true });
```


## ❌ エラーハンドリング

```js
try {
  await api.get("/notfound");
} catch (e) {
  if (e instanceof ApiError) {
    console.log(e.status);
    console.log(e.data);
    console.log(e.headers);
  }
}
```

---

### ApiError構造

```ts
{
  name: "ApiError";
  status: number;
  data: any;
  headers: Headers;
  response: Response;
}
```

## 🏁 実務向けフル構成例

```js
const api = createApi("https://api.example.com", {
  timeout: 5000,
  retry: 2,
  credentials: "include",
  getHeaders: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`
  })
});

await api.post("/upload", formData, {
  retry: 3,
  timeout: 10000,
  headers: {
    "X-Upload-Type": "avatar"
  }
});
```

---
## 🧠 設計思想

* 軽量優先
* axios風API
* 依存ゼロ
* フロント専用最適化
* 実務利用前提
* 明示的ヘッダー設計
* 拡張可能なretry設計
