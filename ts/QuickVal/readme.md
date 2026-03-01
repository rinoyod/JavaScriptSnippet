
# QuickVal

シンプルで拡張しやすい、チェーン型バリデーションライブラリ。

QuickVal は以下を目指しています：

* ✅ シンプルな設計
* ✅ チェーン可能なAPI
* ✅ 型を尊重した検証
* ✅ 依存ゼロ
* ✅ カスタムルール対応


## 🚀 基本的な使い方

QuickVal は

* ルール定義
* validate 実行

を分けて使用する設計です。

```ts
import QuickVal from "quickval";

const validator = new QuickVal();

const val = validator
  .require()
  .isNumericString()
  .min(10)
  .max(100);

const result = val.validate("50");

console.log(result);
```

---

## 🔎 戻り値

```ts
{
  success: boolean,
  errors: [
    {
      rule: string,
      message: string,
      ...追加情報
    }
  ]
}
```

---

## 🛑 最初のエラーで停止

```ts
const validator = new QuickVal(true); // trueで最初のエラーで停止
```

---

## 📏 桁数ルール（length系）

桁数ルールは型によって動作が異なります。

| 型      | 挙動                   |
| ------ | -------------------- |
| string | 文字数をそのまま使用           |
| number | 符号を除外し、小数点を除去して桁数を算出 |
| その他    | ルールをスキップ             |

### 例

```ts
const val = new QuickVal()
  .exactLength(3);

val.validate(12.30);   // 3桁として扱われる（123）
```

```ts
const val = new QuickVal()
  .exactLength(6);

val.validate("12.300"); // 6文字として扱われる
```

※ JavaScript の仕様上、数値型では小数点以下の末尾の0は保持されません。

---

## 🔢 数値系ルール

### 数値文字列

```ts
const val = new QuickVal()
  .isNumericString();

val.validate("123.45");
```

---

### 整数文字列

```ts
const val = new QuickVal()
  .isIntegerString();

val.validate("-10");
```

---

### 整数（number型）

```ts
const val = new QuickVal()
  .isInteger();

val.validate(10);
```

---

## 📊 範囲チェック

```ts
const val = new QuickVal()
  .min(10)
  .max(20);

val.validate("15"); // 数値文字列も判定可能
```

---

## 🔍 等価チェック

```ts
const val = new QuickVal()
  .equal(10);

val.validate(10);
```

```ts
const val = new QuickVal()
  .notEqual("admin");

val.validate("user");
```

---

## 📚 配列内チェック

```ts
const val = new QuickVal()
  .in(["red", "green", "blue"]);

val.validate("green");
```

---

## 🧪 正規表現

```ts
const val = new QuickVal()
  .regex(/^[a-z]+$/);

val.validate("hello");
```

---

## 🛠 カスタムルール

custom で独自ルールを追加できます。
validate 実行時の引数がカスタム関数へ渡されます。

```ts
const val = new QuickVal()
  .custom("greaterThanBase", (value, base) => value > base);

val.validate(10, 5);
```

---

## 🧠 設計思想

QuickVal は以下を重視しています：

* 入力型を尊重する
* 型検証と値検証を分離する
* length系は string / number のみに適用
* ルールごとに責務を明確化する
* チェーンでスキーマを定義し、validateで実行する
