# ① ApiClient 単体での使い方

## 基本

```js
import { ApiClient } from "./ApiClient.js";

const api = new ApiClient({
  baseUrl: "https://api.example.com",
  credentials: "include"
});

const res = await api.get("/users");
const data = await res.data();

console.log(data);
```

---

## ApiClient 初期化オプション（重要）

```js
new ApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "X-App-Version": "1.0"
  },
  credentials: "include"
});
```

### 各オプション説明

### ■ baseUrl

```js
baseUrl: "https://api.example.com"
```

* 全リクエストに自動で付与される
* `/users` → `https://api.example.com/users`
* 環境ごとに切り替える（dev / prod）

---

### ■ headers

```js
headers: {
  Authorization: "Bearer xxx"
}
```

* 全リクエストに共通で付与
* 後から `setHeader()` で追加可能

---

### ■ credentials

```js
credentials: "include"
```

| 値           | 意味           |
| ----------- | ------------ |
| omit        | Cookie送らない   |
| same-origin | 同一オリジンのみ     |
| include     | 常に送る（CORS含む） |

👉 認証ありなら `"include"` が基本

---

# リクエスト時のオプション（超重要）

```js
api.get("/users", {
  method,
  headers,
  json,
  form,
  body,
  responseType,
  credentials
});
```

---

## ■ method

```js
method: "GET"
```

* 通常は `get/post` メソッドで自動設定
* 直接 `request()` のときだけ使う

---

## ■ headers

```js
headers: {
  "X-Request-ID": "123"
}
```

* 個別リクエスト専用ヘッダー
* **defaultHeadersより優先される**

---

## ■ json（最もよく使う）

```js
json: {
  name: "taro"
}
```

* 自動で `JSON.stringify`
* `Content-Type: application/json` 自動付与
* bodyに直接書くよりこれを使う

---

## ■ form（ファイルアップロード）

```js
form: {
  file: file,
  name: "test"
}
```

* FormDataに変換される
* multipart/form-dataになる
* **Content-Typeは自分で指定しない（重要）**

---

## ■ body（低レベル）

```js
body: "raw text"
```

または

```js
body: blob
```

* json/form使わない場合
* 自分でContent-Type管理する必要あり

---

## ■ responseType（かなり重要）

```js
responseType: "json"
```

| 値           | 説明           |
| ----------- | ------------ |
| auto        | 自動判定（推奨）     |
| json        | JSONとして強制パース |
| text        | テキスト         |
| blob        | ファイル         |
| arrayBuffer | バイナリ         |

---

## ■ credentials（個別指定）

```js
credentials: "include"
```

* インスタンス設定を上書きする

---

# 使用パターン

---

## JSON送信

```js
const res = await api.post("/users", {
  json: { name: "taro" }
});

const data = await res.data();
```

---

## ファイルアップロード

```js
const res = await api.post("/upload", {
  form: {
    file: fileInput.files[0]
  }
});
```

---

## ファイルダウンロード

```js
const res = await api.get("/file", {
  responseType: "blob"
});

const blob = await res.data();
```

---

## HTML取得

```js
const res = await api.get("/page", {
  responseType: "text"
});

const html = await res.data();
```

---

## エラーハンドリング

```js
const res = await api.get("/users");

if (!res.ok) {
  const err = await res.text();
  console.error(res.status, err);
}
```

---

# ② ApiService（シングルトン）の使い方

## 基本

```js
import { ApiService } from "./ApiService.js";

const api = ApiService.getInstance();

const res = await api.get("/users");
const data = await res.data();
```

---

## 特徴

* インスタンスは1つだけ
* 共通設定が自動適用される
* トークンも自動反映

---

## JSON送信

```js
const api = ApiService.getInstance();

const res = await api.post("/users", {
  json: { name: "taro" }
});

const data = await res.data();
```

---

## 認証（自動）

```js
const api = ApiService.getInstance();

await api.get("/secure");
```

👉 内部で `Authorization` が毎回セットされる

---

## トークン更新

```js
const api = ApiService.getInstance();
api.setAuthToken("new-token");
```

---

## Cookie認証

```js
const res = await api.get("/auth");
```

👉 `credentials: "include"` がデフォルト

---

## data()短縮パターン

```js
const data = await (await api.get("/users")).data();
```

---

# ③ 使い分け

| 方法         | 使う場面        |
| ---------- | ----------- |
| ApiClient  | テスト / 複数API |
| ApiService | 本番 / 共通     |

---

# ④ 実務テンプレ（よく使う形）

```js
const api = ApiService.getInstance();

const res = await api.post("/login", {
  json: {
    id: "user",
    password: "pass"
  }
});

if (!res.ok) {
  throw new Error("ログイン失敗");
}

const user = await res.data();
```

---

# まとめ

一番大事なのはこれ👇

```js
const res = await api.get("/api");
const data = await res.data();
```

---
