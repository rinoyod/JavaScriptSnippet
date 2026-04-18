# 基本（GET）

```ts
import { ApiService } from "./ApiService";

const api = ApiService.getInstance();

const res = await api.get("/api/users");

console.log(res.status); // 200
console.log(res.ok);     // true

const data = await res.data(); // 自動判定（JSONならJSON）
console.log(data);
```

---

# JSON送信（POST）

```ts
const res = await api.post("/api/users", {
  json: {
    name: "taro",
    age: 20
  }
});

const data = await res.data();
```

---

# responseTypeを明示指定

```ts
const res = await api.get("/api/users", {
  responseType: "json"
});

const data = await res.data(); // 必ずJSONとして取得
```

---

# textレスポンス（HTMLなど）

```ts
const res = await api.get("/page", {
  responseType: "text"
});

const html = await res.data();
```

---

# ファイルダウンロード（blob）

```ts
const res = await api.get("/file", {
  responseType: "blob"
});

const blob = await res.data();

// ダウンロード
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "file.pdf";
a.click();
```

---

# ArrayBuffer（バイナリ処理）

```ts
const res = await api.get("/binary", {
  responseType: "arrayBuffer"
});

const buffer = await res.data();
```

---

# FormData（ファイルアップロード）

```ts
const res = await api.post("/upload", {
  form: {
    file: fileInput.files[0],
    name: "test"
  }
});

const data = await res.data();
```

※ Content-Typeは自動で設定されるので指定しない

---

# ヘッダー指定

```ts
const res = await api.get("/api/secure", {
  headers: {
    "X-Request-ID": "123"
  }
});
```

---

# credentials（Cookie送信）

```ts
const res = await api.get("/api/auth", {
  credentials: "include"
});
```

---

# 個別パース（data()以外）

```ts
const res = await api.get("/api/test");

// JSONとして取得
const json = await res.json();

// textとして取得
const text = await res.text();

// blobとして取得
const blob = await res.blob();
```

---

# エラーハンドリング

```ts
const res = await api.get("/api/test");

if (!res.ok) {
  const errorText = await res.text();
  console.error("APIエラー:", res.status, errorText);
}
```

---

# try-catchで囲うパターン

```ts
try {
  const res = await api.get("/api/test");
  const data = await res.data();
  console.log(data);
} catch (e) {
  console.error("通信エラー", e);
}
```

---

# 認証トークン設定（自動）

```ts
const api = ApiService.getInstance();

api.setAuthToken("your-token");
```

※ ApiService内で毎回自動セットしてる場合は不要

---

# baseURL込みで使う

```ts
// ApiServiceで設定済み
const api = ApiService.getInstance();

await api.get("/users"); 
// → https://api.example.com/users
```

---

# テスト用差し替え

```ts
import { ApiService } from "./ApiService";
import { ApiClient } from "./ApiClient";

const mockApi = new ApiClient({
  baseUrl: "http://mock"
});

ApiService.setInstance(mockApi);
```

---

# よく使うパターン（実務）

```ts
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

const data = await res.data();
```

---

# まとめ（使い方のコア）

基本はこれだけ👇

```ts
const res = await api.get("/api");
const data = await res.data();
```

---
