
class QuickVal {

	#validationRules: Array<{ rule: string, fn: (value: any, options: any, ...args: any[]) => boolean, options: any }> = [];

	#result = {
		success: true,
		errors: [] as Array<{ rule: string, message: string, [key: string]: any }>
	};

	#stopOnFirstError: boolean = false;

	/**
	  * QuickValインスタンスを生成します。
	  * @param stopOnFirstError trueの場合、最初のエラー発生時に検証を停止します。
	  */
	constructor(stopOnFirstError: boolean = false) {
		this.#stopOnFirstError = stopOnFirstError;
	}

	#ruleRequired(value: any, options: { value: boolean, message: string }) {

		const isEmpty = value === null || value === undefined || value === '';

		// optional(false)で空なら成功扱い（他ルール評価しないためfalseを返す）
		if (options.value === false && isEmpty) {
			return false; // validate側でbreakする想定
		}

		// required(true)で空ならエラー
		if (options.value === true && isEmpty) {
			this.#pushError('required', { message: options.message });
			return false;
		}

		// それ以外は後続チェックへ
		return true;
	}

	/**
	 * 値が必須であることを検証するルールを追加します。
	 * @param value trueの場合は必須項目として扱います。
	 *              falseの場合、値が空(null, undefined, '')であれば
	 *              他のルールを評価せず検証を終了します。
	 * @param options オプション設定
	 * @param options.message エラーメッセージ（省略可）
	 */
	require(value: boolean = true, options?: { message?: string }) {
		const message = options?.message || "Value is required";

		//配列の先頭に必須ルールを追加する	
		this.#validationRules.unshift(
			{ rule: 'required', fn: this.#ruleRequired.bind(this), options: { value: value, message } }
		);
		return this;
	}


	#ruleIsString(targetValue: any, options: { message: string }) {
		if (typeof targetValue !== 'string') {
			this.#pushError('isString', { message: options.message });
			return false;
		}

		return true;
	}


	/**
	 * 値が文字列であることを検証するルールを追加します。
	 * stopOnFirstErrorがfalseの場合でも、値が文字列でない場合は後続のルールを評価しないため、falseを返します。
	 * @param param 
	 * @param param.message エラーメッセージ（オプション）。デフォルトは "Value is not a string" です。
	 * @returns 
	 */
	isString(params?: { message?: string }) {
		const message = params?.message || "Value is not a string";

		this.#validationRules.push(
			{ rule: 'isString', fn: this.#ruleIsString.bind(this), options: { message } }
		);
		return this;
	}

	#ruleIsNumericString(targetValue: any, options: { message: string }) {

		if (typeof targetValue !== 'string') {
			this.#pushError('isNumericString', { message: options.message });
			return false;
		}

		const trimmed = targetValue.trim();

		// 空文字は数値としない
		if (trimmed === '') {
			this.#pushError('isNumericString', { message: options.message });
			return false;
		}

		// 符号付き整数・小数のみ許可
		const numericPattern = /^[-+]?\d+(\.\d+)?$/;

		if (!numericPattern.test(trimmed)) {
			this.#pushError('isNumericString', { message: options.message });
			return false;
		}

		return true;
	}

	/**
	 * 値が数値の文字列であることを検証するルールを追加します。
	 * stopOnFirstErrorがfalseの場合でも、値が数値の文字列でない場合は後続のルールを評価しないため、falseを返します。
	 * @param param 
	 * @param param.message エラーメッセージ（オプション）。デフォルトは "Value is not a numeric string" です。
	 * @returns
	 * @param params 
	 */
	isNumericString(params?: { message?: string }) {
		const message = params?.message || "Value is not a numeric string";

		this.#validationRules.push(
			{ rule: 'isNumericString', fn: this.#ruleIsNumericString.bind(this), options: { message } }
		);
		return this;
	}


	#ruleIsIntegerString(targetValue: any, options: { message: string }) {

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
	 */
	isIntegerString(params?: { message?: string }) {
		const message = params?.message || "Value is not a valid integer string";

		this.#validationRules.push({
			rule: 'isIntegerString', fn: this.#ruleIsIntegerString.bind(this), options: { message }
		});

		return this;
	}



	#ruleIsInteger(targetValue: any, options: { message: string }) {

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
	 * stopOnFirstErrorがfalseの場合でも、値が整数でない場合は後続のルールを評価しないため、falseを返します。
	 * @param params 
	 * @param params.message エラーメッセージ（オプション）。デフォルトは "Value is not a valid integer" です。
	 * @returns
	 */
	isInteger(params?: { message?: string }) {

		const message = params?.message || "Value is not a valid integer";

		this.#validationRules.push({
			rule: 'isInteger', fn: this.#ruleIsInteger.bind(this), options: { message }
		});

		return this;
	}

	/**
	 * 値を数値に変換します。
	 * number型の場合は有限数のみ許可します。
	 * string型の場合は符号付き整数・小数形式のみ許可します。
	 * 変換できない場合はnullを返します。
	 * @param value 対象の値
	 * @returns number または null
	 */
	#toNumber(value: any): number | null {
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

	#ruleMin(targetValue: any, options: { value: number, message: string }) {

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
	 * @param value 
	 * @param params 
	 * @returns 
	 */
	min(value: number, params?: { message?: string }) {
		const message = params?.message || `The value is less than ${value}.`;
		this.#validationRules.push(
			{ rule: 'min', fn: this.#ruleMin.bind(this), options: { value: value, message } }
		);
		return this;
	}

	#ruleMax(targetValue: any, options: { value: number, message: string }) {

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
	 * @param value 
	 * @param params 
	 * @returns 
	 */
	max(value: number, params?: { message?: string }) {
		const message = params?.message || `The value is greater than ${value}.`;
		this.#validationRules.push(
			{ rule: 'max', fn: this.#ruleMax.bind(this), options: { value, message } }
		);
		return this;
	}

	#ruleMinLength(targetValue: any, options: { length: number, message: string }) {

		const digitLength = this.#getDigitLength(targetValue);
		if (digitLength === null) {
			// 桁数が取れない場合はスルー（数値・文字列以外の型は桁数ルールを適用しない想定）
			return true;
		}

		if (digitLength < options.length) {
			this.#pushError('minLength', { message: options.message, length: options.length });
			return true;
		}

		return true;
	}


	/**
	 * 値が指定された数以上の桁数であることを検証するルールを追加します。
	 * @param length 
	 * @param params 
	 * @returns 
	 */
	minLength(length: number, params?: { message?: string }) {
		const message = params?.message || `Value must be at least ${length} characters long`;
		this.#validationRules.push(
			{ rule: 'minLength', fn: this.#ruleMinLength.bind(this), options: { length, message } }
		);
		return this;
	}

	#ruleMaxLength(targetValue: any, options: { length: number, message: string }) {

		const digitLength = this.#getDigitLength(targetValue);
		if (digitLength === null) {
			// 桁数が取れない場合はスルー（数値・文字列以外の型は桁数ルールを適用しない想定）
			return true;
		}

		if (digitLength > options.length) {
			this.#pushError('maxLength', { message: options.message, length: options.length });
			return true;
		}


		return true;
	}

	/**
	 * 値が指定された数以下の桁数であることを検証するルールを追加します。
	 * @param length 
	 * @param params 
	 * @returns 
	 */
	maxLength(length: number, params?: { message?: string }) {
		const message = params?.message || `Value must be at most ${length} characters long`;
		this.#validationRules.push(
			{ rule: 'maxLength', fn: this.#ruleMaxLength.bind(this), options: { length, message } }
		);
		return this;
	}

	#ruleEqual(targetValue: any, options: { value: any, message: string }) {
		if (targetValue !== options.value) {
			this.#pushError('equal', { message: options.message, value: options.value });
			return true;
		}
		return true;
	}

	/**
	 * 値が指定された値と等しいことを検証するルールを追加します。
	 * @param value 
	 * @param params 
	 * @returns 
	 */
	equal(value: any, params?: { message?: string }) {
		const message = params?.message || `Value must be equal to ${value}`;
		this.#validationRules.push(
			{ rule: 'equal', fn: this.#ruleEqual.bind(this), options: { value, message } }
		);
		return this;
	}

	/**
	 * 値の桁数を取得します。
	 * - string型: 文字数をそのまま返します。
	 * - number型: 符号を除外し、小数点を除去した桁数を返します。
	 *   小数点以下の末尾の0はJavaScriptの仕様上保持されません。
	 * - それ以外の型: nullを返します。
	 * @param value 対象の値
	 * @returns 桁数 または null
	 */
	#getDigitLength(value: any): number | null {

		if (typeof value === 'string') {
			return value.length;
		}

		if (typeof value === 'number') {
			if (!Number.isFinite(value)) return null;
			return Math.abs(value).toString().replace('.', '').length;
		}

		return null;
	}

	#ruleExactLength(targetValue: any, options: { length: number, message: string }) {

		const digitLength = this.#getDigitLength(targetValue);

		if (digitLength === null) {
			// 桁数が取れない場合はスルー（数値・文字列以外の型は桁数ルールを適用しない想定）
			return true;
		}

		if (digitLength !== options.length) {
			this.#pushError('exactLength', {
				message: options.message,
				length: options.length
			});
		}

		return true;
	}

	/**
	 * 値が指定された桁数であることを検証するルールを追加します。  
	 * 数値の場合は整数・小数を含む全桁数を、文字列の場合は文字数を検証します。  
	 * 小数点以下の数値の最後が０の場合も桁数に含めません
	 * 符号は桁数に含まれません。
	 * @param length 
	 * @param params 
	 * @returns 
	 */
	exactLength(length: number, params?: { message?: string }) {

		const message =
			params?.message || `Value must be exactly ${length} characters long`;

		this.#validationRules.push({
			rule: 'exactLength',
			fn: this.#ruleExactLength.bind(this),
			options: { length, message }
		});

		return this;
	}

	#ruleNotEqual(targetValue: any, options: { value: any, message: string }) {
		if (targetValue === options.value) {
			this.#pushError('notEqual', { message: options.message, value: options.value });
			return true;
		}
		return true;
	}

	/**
	 * 値が指定された値と等しくないことを検証するルールを追加します。
	 * @param value 
	 * @param params 
	 * @returns 
	 */
	notEqual(value: any, params?: { message?: string }) {
		const message = params?.message || `Value must not be equal to ${value}`;
		this.#validationRules.push(
			{ rule: 'notEqual', fn: this.#ruleNotEqual.bind(this), options: { value, message } }
		);
		return this;
	}

	#ruleIn(targetValue: any, options: { values: any[], message: string }) {
		if (!options.values.includes(targetValue)) {
			this.#pushError('in', { message: options.message, values: options.values });
			return true;
		}
		return true;
	}

	/**
	 * 値が指定された配列のいずれかであることを検証するルールを追加します。
	 * @param values 
	 * @param params 
	 * @returns 
	 */
	in(values: any[], params?: { message?: string }) {
		const message = params?.message || `Value must be one of ${values.join(', ')}`;
		this.#validationRules.push(
			{ rule: 'in', fn: this.#ruleIn.bind(this), options: { values, message } }
		);
		return this;
	}

	#ruleNotIn(targetValue: any, options: { values: any[], message: string }) {
		if (options.values.includes(targetValue)) {
			this.#pushError('notIn', { message: options.message, values: options.values });
			return true;
		}
		return true;
	}

	/**
	 * 値が指定された配列のいずれでもないことを検証するルールを追加します。
	 * @param values 
	 * @param params 
	 * @returns 
	 */
	notIn(values: any[], params?: { message?: string }) {
		const message = params?.message || `Value must not be one of ${values.join(', ')}`;
		this.#validationRules.push(
			{ rule: 'notIn', fn: this.#ruleNotIn.bind(this), options: { values, message } }
		);
		return this;
	}

	#ruleRegex(targetValue: any, options: { pattern: RegExp, message: string }) {
		if (typeof targetValue !== 'string' || !options.pattern.test(targetValue)) {
			this.#pushError('regex', { message: options.message, pattern: options.pattern });
			return true;
		}
		return true;
	}

	/**
	 * 値が指定された正規表現にマッチすることを検証するルールを追加します。
	 * @param pattern 
	 * @param params 
	 * @returns 
	 */
	regex(pattern: RegExp, params?: { message?: string }) {
		const message = params?.message || `Value does not match the required pattern`;
		this.#validationRules.push(
			{ rule: 'regex', fn: this.#ruleRegex.bind(this), options: { pattern, message } }
		);
		return this;
	}

	#ruleCustom(targetValue: any, options: { validateFn: (value: any, ...args: any[]) => boolean, message: string, ruleName: string }, ...args: any[]) {

		if (!options.validateFn(targetValue, ...args)) {
			this.#pushError(`custom_${options.ruleName}`, { message: options.message, params: args });
			return true;
		}
		return true;
	}

	/**
	 * カスタムルールを追加します。
	 * @param ruleName ルール識別名（エラー出力用）
	 * @param validateFn 検証関数。falseを返した場合にエラーになります。
	 * @param params オプション設定
	 * @param params.message エラーメッセージ（省略可）
	 */
	custom(ruleName: string, validateFn: (value: any, ...args: any[]) => boolean, params?: { message?: string }) {
		const message = params?.message || `Value does not satisfy the ${ruleName} rule`;
		this.#validationRules.push(
			{ rule: `custom_${ruleName}`, fn: this.#ruleCustom.bind(this), options: { validateFn, message, ruleName } }
		);
		return this;
	}

	/**
	 * エラー情報を結果オブジェクトに追加します。
	 * @param rule ルール名
	 * @param options エラー詳細情報（messageは必須）
	 */
	#pushError(rule: string, options: { message: string, [key: string]: any }) {
		this.#result.success = false;
		this.#result.errors.push({ rule, ...options });
	}

	/**
	 * 登録されたルールに基づいて値を検証します。
	 * @param targetValue 検証対象の値
	 * @param args customルールへ渡される可変引数
	 * @returns 検証結果オブジェクト
	 * {
	 *   success: boolean,
	 *   errors: Array<{ rule: string, message: string, ... }>
	 * }
	 */
	validate(targetValue: any, ...args: any[]) {

		this.#result = {
			success: true,
			errors: []
		};

		for (const rule of this.#validationRules) {

			const result = rule.fn(targetValue, rule.options, ...args);

			// 強制停止（required(false)など）
			if (result === false) break;

			// エラーで停止する設定
			if (this.#stopOnFirstError && this.#result.success === false) break;
		}
		// ディープコピーして返す
		if (typeof structuredClone === 'function') {
			return structuredClone(this.#result);
		} else {
			return JSON.parse(JSON.stringify(this.#result));
		}
	}
}
