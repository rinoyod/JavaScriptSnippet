//node ./js/quickVal/QuikVal.test.js

import assert from "node:assert/strict";
import QuickVal from './QuickVal.js';

function runTest(name, fn) {
	try {
		fn();
		console.log(`✅ ${name}`);
	} catch (err) {
		console.error(`❌ ${name}`);
		console.error(err);
	}
}

/* ========================================
   require
======================================== */

runTest("require - 正常", () => {
	const val = new QuickVal().require();
	const result = val.validate("abc");
	assert.strictEqual(result.success, true);
});

runTest("require - エラー", () => {
	const val = new QuickVal().require();
	const result = val.validate("");
	assert.strictEqual(result.success, false);
});

/* ========================================
   isString
======================================== */

runTest("isString - 正常", () => {
	const val = new QuickVal().isString();
	assert.strictEqual(val.validate("abc").success, true);
});

runTest("isString - エラー", () => {
	const val = new QuickVal().isString();
	assert.strictEqual(val.validate(123).success, false);
});

/* ========================================
   isNumericString
======================================== */

runTest("isNumericString - 正常", () => {
	const val = new QuickVal().isNumericString();
	assert.strictEqual(val.validate("123.45").success, true);
});

runTest("isNumericString - エラー", () => {
	const val = new QuickVal().isNumericString();
	assert.strictEqual(val.validate("abc").success, false);
});

/* ========================================
   isIntegerString
======================================== */

runTest("isIntegerString - 正常", () => {
	const val = new QuickVal().isIntegerString();
	assert.strictEqual(val.validate("-123").success, true);
});

runTest("isIntegerString - エラー", () => {
	const val = new QuickVal().isIntegerString();
	assert.strictEqual(val.validate("123.4").success, false);
});

/* ========================================
   isInteger
======================================== */

runTest("isInteger - 正常", () => {
	const val = new QuickVal().isInteger();
	assert.strictEqual(val.validate(10).success, true);
});

runTest("isInteger - エラー", () => {
	const val = new QuickVal().isInteger();
	assert.strictEqual(val.validate(10.5).success, false);
});

/* ========================================
   min
======================================== */

runTest("min - 正常", () => {
	const val = new QuickVal().min(10);
	assert.strictEqual(val.validate(20).success, true);
});

runTest("min - エラー", () => {
	const val = new QuickVal().min(10);
	assert.strictEqual(val.validate(5).success, false);
});

/* ========================================
   max
======================================== */

runTest("max - 正常", () => {
	const val = new QuickVal().max(10);
	assert.strictEqual(val.validate(5).success, true);
});

runTest("max - エラー", () => {
	const val = new QuickVal().max(10);
	assert.strictEqual(val.validate(20).success, false);
});

/* ========================================
   minLength
======================================== */

runTest("minLength - 正常", () => {
	const val = new QuickVal().minLength(3);
	assert.strictEqual(val.validate("abcd").success, true);
});

runTest("minLength - エラー", () => {
	const val = new QuickVal().minLength(5);
	assert.strictEqual(val.validate("abc").success, false);
});

/* ========================================
   maxLength
======================================== */

runTest("maxLength - 正常", () => {
	const val = new QuickVal().maxLength(5);
	assert.strictEqual(val.validate("abc").success, true);
});

runTest("maxLength - エラー", () => {
	const val = new QuickVal().maxLength(3);
	assert.strictEqual(val.validate("abcd").success, false);
});

/* ========================================
   exactLength
======================================== */

runTest("exactLength - 正常", () => {
	const val = new QuickVal().exactLength(3);
	assert.strictEqual(val.validate(123).success, true);
});

runTest("exactLength - エラー", () => {
	const val = new QuickVal().exactLength(4);
	assert.strictEqual(val.validate(123).success, false);
});

/* ========================================
   equal
======================================== */

runTest("equal - 正常", () => {
	const val = new QuickVal().equal(10);
	assert.strictEqual(val.validate(10).success, true);
});

runTest("equal - エラー", () => {
	const val = new QuickVal().equal(10);
	assert.strictEqual(val.validate(5).success, false);
});

/* ========================================
   notEqual
======================================== */

runTest("notEqual - 正常", () => {
	const val = new QuickVal().notEqual(10);
	assert.strictEqual(val.validate(5).success, true);
});

runTest("notEqual - エラー", () => {
	const val = new QuickVal().notEqual(10);
	assert.strictEqual(val.validate(10).success, false);
});

/* ========================================
   in
======================================== */

runTest("in - 正常", () => {
	const val = new QuickVal().in([1, 2, 3]);
	assert.strictEqual(val.validate(2).success, true);
});

runTest("in - エラー", () => {
	const val = new QuickVal().in([1, 2, 3]);
	assert.strictEqual(val.validate(5).success, false);
});

/* ========================================
   notIn
======================================== */

runTest("notIn - 正常", () => {
	const val = new QuickVal().notIn([1, 2, 3]);
	assert.strictEqual(val.validate(5).success, true);
});

runTest("notIn - エラー", () => {
	const val = new QuickVal().notIn([1, 2, 3]);
	assert.strictEqual(val.validate(2).success, false);
});

/* ========================================
   regex
======================================== */

runTest("regex - 正常", () => {
	const val = new QuickVal().regex(/^\d+$/);
	assert.strictEqual(val.validate("123").success, true);
});

runTest("regex - エラー", () => {
	const val = new QuickVal().regex(/^\d+$/);
	assert.strictEqual(val.validate("abc").success, false);
});

/* ========================================
   custom
======================================== */

runTest("custom - 正常", () => {
	const val = new QuickVal().custom(
		"greaterThan",
		(value, min) => value > min
	);
	assert.strictEqual(val.validate(10, 5).success, true);
});

runTest("custom - エラー", () => {
	const val = new QuickVal().custom(
		"greaterThan",
		(value, min) => value > min
	);
	assert.strictEqual(val.validate(3, 5).success, false);
});

/* ========================================
   stopOnFirstError
======================================== */

runTest("stopOnFirstError - 正常", () => {
	const val = new QuickVal(true)
		.isString()
		.minLength(3);

	assert.strictEqual(val.validate("abc").success, true);
});

runTest("stopOnFirstError - エラーで1件のみ", () => {
	const val = new QuickVal(true)
		.isString()
		.isNumericString();

	const result = val.validate(123);
	assert.strictEqual(result.errors.length, 1);
});

/* ========================================
   数値文字列と数値の境界テスト
======================================== */

runTest("numeric boundary - '10' と 10 は同じmin判定", () => {
	const val = new QuickVal().min(10);
	assert.strictEqual(val.validate("10").success, true);
	assert.strictEqual(val.validate(10).success, true);
});

runTest("numeric boundary - 小数文字列と数値", () => {
	const val = new QuickVal().max(10.5);
	assert.strictEqual(val.validate("10.5").success, true);
	assert.strictEqual(val.validate(10.5).success, true);
});

runTest("numeric boundary - 不正数値文字列", () => {
	const val = new QuickVal().min(5);
	const result = val.validate("10abc");
	assert.strictEqual(result.success, false); // toNumberがnull → エラー扱い
});

/* ========================================
   null / undefined テスト
======================================== */

runTest("null - requireなし", () => {
	const val = new QuickVal().isString();
	const result = val.validate(null);
	assert.strictEqual(result.success, false);
});

runTest("undefined - requireなし", () => {
	const val = new QuickVal().isString();
	const result = val.validate(undefined);
	assert.strictEqual(result.success, false);
});

runTest("null - require(false)", () => {
	const val = new QuickVal()
		.require(false)
		.isNumericString();

	const result = val.validate(null);
	assert.strictEqual(result.success, true);
});

runTest("undefined - require(true)", () => {
	const val = new QuickVal().require(true);
	const result = val.validate(undefined);
	assert.strictEqual(result.success, false);
});

/* ========================================
   桁数 小数テスト
======================================== */

runTest("digitLength - 小数 number型", () => {
	const val = new QuickVal().exactLength(4);
	// 12.34 → "12.34" → 1234 → 4桁
	assert.strictEqual(val.validate(12.34).success, true);
});

runTest("digitLength - 小数 末尾0 (number型)", () => {
	const val = new QuickVal().exactLength(3);
	// 12.30 → JSでは12.3 → "12.3" → 123 → 3桁
	assert.strictEqual(val.validate(12.30).success, true);
});

runTest("digitLength - 小数 string型は文字数優先", () => {
	const val = new QuickVal().exactLength(5);
	// stringはそのまま長さ
	assert.strictEqual(val.validate("12.30").success, true);
});

runTest("digitLength - 符号は桁数に含まれない", () => {
	const val = new QuickVal().exactLength(3);
	assert.strictEqual(val.validate(-123).success, true);
});

/* ========================================
   required(false) 分岐テスト
======================================== */

runTest("required(false) - 空なら他ルールスキップ", () => {
	const val = new QuickVal()
		.require(false)
		.isString()
		.minLength(5);

	const result = val.validate("");
	assert.strictEqual(result.success, true);
});

runTest("required(false) - 値ありなら後続実行", () => {
	const val = new QuickVal()
		.require(false)
		.min(10);

	const result = val.validate(5);
	assert.strictEqual(result.success, false);
});

runTest("required(false) - stopOnFirstError併用", () => {
	const val = new QuickVal(true)
		.require(false)
		.isNumericString();

	const result = val.validate("");
	assert.strictEqual(result.success, true);
});

console.log("\n=== 全テスト完了 ===");
