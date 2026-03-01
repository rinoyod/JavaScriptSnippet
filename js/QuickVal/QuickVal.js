export class QuickVal {

	/** @type {Array<{ rule: string, fn: Function, options: any }>} */
	#validationRules = [];

	/** @type {{ success: boolean, errors: Array<{ rule: string, message: string, [key: string]: any }> }} */
	#result = {
		success: true,
		errors: []
	};

	/** @type {boolean} */
	#stopOnFirstError = false;

	/**
	 * QuickValインスタンスを生成します。
	 * @param {boolean} [stopOnFirstError=false] trueの場合、最初のエラー発生時に検証を停止します。
	 */
	constructor(stopOnFirstError = false) {
		this.#stopOnFirstError = stopOnFirstError;
	}

	/** @private */
	#ruleRequired(value, options) {

		const isEmpty = value === null || value === undefined || value === '';

		if (options.value === false && isEmpty) {
			return false;
		}

		if (options.value === true && isEmpty) {
			this.#pushError('required', { message: options.message });
			return false;
		}

		return true;
	}

	/**
	 * 値が必須であることを検証するルールを追加します。
	 * @param {boolean} [value=true]
	 * @param {{ message?: string }} [options]
	 * @returns {QuickVal}
	 */
	require(value = true, options) {
		const message = options?.message || "Value is required";

		this.#validationRules.unshift(
			{ rule: 'required', fn: this.#ruleRequired.bind(this), options: { value, message } }
		);
		return this;
	}

	/** @private */
	#ruleIsString(targetValue, options) {
		if (typeof targetValue !== 'string') {
			this.#pushError('isString', { message: options.message });
			return false;
		}
		return true;
	}

	/**
	 * 値が文字列であることを検証するルールを追加します。
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	isString(params) {
		const message = params?.message || "Value is not a string";

		this.#validationRules.push(
			{ rule: 'isString', fn: this.#ruleIsString.bind(this), options: { message } }
		);
		return this;
	}

	/** @private */
	#ruleIsNumericString(targetValue, options) {

		if (typeof targetValue !== 'string') {
			this.#pushError('isNumericString', { message: options.message });
			return false;
		}

		const trimmed = targetValue.trim();

		if (trimmed === '') {
			this.#pushError('isNumericString', { message: options.message });
			return false;
		}

		const numericPattern = /^[-+]?\d+(\.\d+)?$/;

		if (!numericPattern.test(trimmed)) {
			this.#pushError('isNumericString', { message: options.message });
			return false;
		}

		return true;
	}

	/**
	 * 値が数値の文字列であることを検証するルールを追加します。
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	isNumericString(params) {
		const message = params?.message || "Value is not a numeric string";

		this.#validationRules.push(
			{ rule: 'isNumericString', fn: this.#ruleIsNumericString.bind(this), options: { message } }
		);
		return this;
	}

	/** @private */
	#ruleIsIntegerString(targetValue, options) {

		if (typeof targetValue !== 'string') {
			this.#pushError('isIntegerString', { message: options.message });
			return false;
		}

		const trimmed = targetValue.trim();

		if (trimmed === '') {
			this.#pushError('isIntegerString', { message: options.message });
			return false;
		}

		const integerPattern = /^[-+]?\d+$/;

		if (!integerPattern.test(trimmed)) {
			this.#pushError('isIntegerString', { message: options.message });
			return false;
		}

		return true;
	}

	/**
	 * 値が整数の文字列であることを検証します。
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	isIntegerString(params) {
		const message = params?.message || "Value is not a valid integer string";

		this.#validationRules.push({
			rule: 'isIntegerString',
			fn: this.#ruleIsIntegerString.bind(this),
			options: { message }
		});

		return this;
	}

	/** @private */
	#ruleIsInteger(targetValue, options) {

		if (typeof targetValue !== 'number') {
			this.#pushError('isInteger', { message: options.message });
			return false;
		}

		if (!Number.isFinite(targetValue)) {
			this.#pushError('isInteger', { message: options.message });
			return false;
		}

		if (!Number.isInteger(targetValue)) {
			this.#pushError('isInteger', { message: options.message });
			return false;
		}

		return true;
	}

	/**
	 * 値が整数（number型）であることを検証します。
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	isInteger(params) {

		const message = params?.message || "Value is not a valid integer";

		this.#validationRules.push({
			rule: 'isInteger',
			fn: this.#ruleIsInteger.bind(this),
			options: { message }
		});

		return this;
	}

	/**
	 * 値を数値に変換します。
	 * @private
	 * @param {*} value
	 * @returns {number|null}
	 */
	#toNumber(value) {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : null;
		}

		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed === '') return null;

			const numericPattern = /^[-+]?\d+(\.\d+)?$/;
			if (!numericPattern.test(trimmed)) return null;

			return Number(trimmed);
		}

		return null;
	}

	/** @private */
	#ruleMin(targetValue, options) {
		const numericValue = this.#toNumber(targetValue);

		if (numericValue === null) {
			this.#pushError('min', { message: options.message, value: options.value });
			return true;
		}

		if (numericValue < options.value) {
			this.#pushError('min', { message: options.message, value: options.value });
		}

		return true;
	}

	/**
	 * 値が指定された数値以上であることを検証するルールを追加します。
	 * @param {number} value
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	min(value, params) {
		const message = params?.message || `The value is less than ${value}.`;
		this.#validationRules.push(
			{ rule: 'min', fn: this.#ruleMin.bind(this), options: { value, message } }
		);
		return this;
	}

	/** @private */
	#ruleMax(targetValue, options) {
		const numericValue = this.#toNumber(targetValue);

		if (numericValue === null) {
			this.#pushError('max', { message: options.message, value: options.value });
			return true;
		}

		if (numericValue > options.value) {
			this.#pushError('max', { message: options.message, value: options.value });
		}

		return true;
	}

	/**
	 * 値が指定された数値以下であることを検証するルールを追加します。
	 * @param {number} value
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	max(value, params) {
		const message = params?.message || `The value is greater than ${value}.`;
		this.#validationRules.push(
			{ rule: 'max', fn: this.#ruleMax.bind(this), options: { value, message } }
		);
		return this;
	}

	/** @private */
	#ruleMinLength(targetValue, options) {
		const digitLength = this.#getDigitLength(targetValue);
		if (digitLength === null) return true;

		if (digitLength < options.length) {
			this.#pushError('minLength', { message: options.message, length: options.length });
		}
		return true;
	}

	/**
	 * @param {number} length
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	minLength(length, params) {
		const message = params?.message || `Value must be at least ${length} characters long`;
		this.#validationRules.push(
			{ rule: 'minLength', fn: this.#ruleMinLength.bind(this), options: { length, message } }
		);
		return this;
	}

	/** @private */
	#ruleMaxLength(targetValue, options) {
		const digitLength = this.#getDigitLength(targetValue);
		if (digitLength === null) return true;

		if (digitLength > options.length) {
			this.#pushError('maxLength', { message: options.message, length: options.length });
		}
		return true;
	}

	/**
	 * @param {number} length
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	maxLength(length, params) {
		const message = params?.message || `Value must be at most ${length} characters long`;
		this.#validationRules.push(
			{ rule: 'maxLength', fn: this.#ruleMaxLength.bind(this), options: { length, message } }
		);
		return this;
	}

	/** @private */
	#ruleEqual(targetValue, options) {
		if (targetValue !== options.value) {
			this.#pushError('equal', { message: options.message, value: options.value });
		}
		return true;
	}

	/**
	 * @param {*} value
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	equal(value, params) {
		const message = params?.message || `Value must be equal to ${value}`;
		this.#validationRules.push(
			{ rule: 'equal', fn: this.#ruleEqual.bind(this), options: { value, message } }
		);
		return this;
	}

	/**
	 * 値の桁数を取得します。
	 * @private
	 * @param {*} value
	 * @returns {number|null}
	 */
	#getDigitLength(value) {
		if (typeof value === 'string') return value.length;

		if (typeof value === 'number') {
			if (!Number.isFinite(value)) return null;
			return Math.abs(value).toString().replace('.', '').length;
		}

		return null;
	}

	/** @private */
	#ruleExactLength(targetValue, options) {
		const digitLength = this.#getDigitLength(targetValue);
		if (digitLength === null) return true;

		if (digitLength !== options.length) {
			this.#pushError('exactLength', {
				message: options.message,
				length: options.length
			});
		}

		return true;
	}

	/**
	 * @param {number} length
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	exactLength(length, params) {
		const message =
			params?.message || `Value must be exactly ${length} characters long`;

		this.#validationRules.push({
			rule: 'exactLength',
			fn: this.#ruleExactLength.bind(this),
			options: { length, message }
		});

		return this;
	}

	/** @private */
	#ruleNotEqual(targetValue, options) {
		if (targetValue === options.value) {
			this.#pushError('notEqual', { message: options.message, value: options.value });
		}
		return true;
	}

	/**
	 * @param {*} value
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	notEqual(value, params) {
		const message = params?.message || `Value must not be equal to ${value}`;
		this.#validationRules.push(
			{ rule: 'notEqual', fn: this.#ruleNotEqual.bind(this), options: { value, message } }
		);
		return this;
	}

	/** @private */
	#ruleIn(targetValue, options) {
		if (!options.values.includes(targetValue)) {
			this.#pushError('in', { message: options.message, values: options.values });
		}
		return true;
	}

	/**
	 * @param {Array<any>} values
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	in(values, params) {
		const message = params?.message || `Value must be one of ${values.join(', ')}`;
		this.#validationRules.push(
			{ rule: 'in', fn: this.#ruleIn.bind(this), options: { values, message } }
		);
		return this;
	}

	/** @private */
	#ruleNotIn(targetValue, options) {
		if (options.values.includes(targetValue)) {
			this.#pushError('notIn', { message: options.message, values: options.values });
		}
		return true;
	}

	/**
	 * @param {Array<any>} values
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	notIn(values, params) {
		const message = params?.message || `Value must not be one of ${values.join(', ')}`;
		this.#validationRules.push(
			{ rule: 'notIn', fn: this.#ruleNotIn.bind(this), options: { values, message } }
		);
		return this;
	}

	/** @private */
	#ruleRegex(targetValue, options) {
		if (typeof targetValue !== 'string' || !options.pattern.test(targetValue)) {
			this.#pushError('regex', { message: options.message, pattern: options.pattern });
		}
		return true;
	}

	/**
	 * @param {RegExp} pattern
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	regex(pattern, params) {
		const message = params?.message || `Value does not match the required pattern`;
		this.#validationRules.push(
			{ rule: 'regex', fn: this.#ruleRegex.bind(this), options: { pattern, message } }
		);
		return this;
	}

	/** @private */
	#ruleCustom(targetValue, options, ...args) {
		if (!options.validateFn(targetValue, ...args)) {
			this.#pushError(`custom_${options.ruleName}`, { message: options.message, params: args });
		}
		return true;
	}

	/**
	 * カスタムルールを追加します。
	 * @param {string} ruleName
	 * @param {(value: any, ...args: any[]) => boolean} validateFn
	 * @param {{ message?: string }} [params]
	 * @returns {QuickVal}
	 */
	custom(ruleName, validateFn, params) {
		const message = params?.message || `Value does not satisfy the ${ruleName} rule`;
		this.#validationRules.push(
			{ rule: `custom_${ruleName}`, fn: this.#ruleCustom.bind(this), options: { validateFn, message, ruleName } }
		);
		return this;
	}

	/**
	 * エラー情報を結果オブジェクトに追加します。
	 * @private
	 * @param {string} rule
	 * @param {{ message: string, [key: string]: any }} options
	 */
	#pushError(rule, options) {
		this.#result.success = false;
		this.#result.errors.push({ rule, ...options });
	}

	/**
	 * 登録されたルールに基づいて値を検証します。
	 * @param {*} targetValue
	 * @param {...any} args customルールへ渡される可変引数
	 * @returns {{
	 *   success: boolean,
	 *   errors: Array<{ rule: string, message: string, [key: string]: any }>
	 * }}
	 */
	validate(targetValue, ...args) {

		this.#result = {
			success: true,
			errors: []
		};

		for (const rule of this.#validationRules) {

			const result = rule.fn(targetValue, rule.options, ...args);

			if (result === false) break;

			if (this.#stopOnFirstError && this.#result.success === false) break;
		}

		return typeof structuredClone === 'function'
			? structuredClone(this.#result)
			: JSON.parse(JSON.stringify(this.#result));
	}
}

export default QuickVal;
