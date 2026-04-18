export class arrayUtils {

	/* =========================
	   internal helpers
	========================= */

	private static compileAccessor(path: string) {

		const keys = path.split(".")

		return (obj: any) => {

			let v = obj

			for (let i = 0; i < keys.length; i++) {
				if (v == null) return undefined
				v = v[keys[i]]
			}

			return v
		}

	}

	private static compileSort(sortKeys: string[]) {

		const accessors: ((o: any) => any)[] = []
		const desc: boolean[] = []

		for (let key of sortKeys) {

			let isDesc = false

			if (key.startsWith("-")) {
				isDesc = true
				key = key.substring(1)
			}

			accessors.push(this.compileAccessor(key))
			desc.push(isDesc)

		}

		return { accessors, desc }

	}

	private static compare(a: any, b: any): number {

		if (a == null && b == null) return 0
		if (a == null) return -1
		if (b == null) return 1

		if (typeof a === "string" && typeof b === "string") {
			return a.localeCompare(b)
		}

		if (a < b) return -1
		if (a > b) return 1

		return 0
	}

	/* =========================
	   ultra fast sort
	========================= */

	static sort<T>(array: T[], sortKeys: string[]): T[] {

		if (!array || array.length <= 1) return array

		const { accessors, desc } = this.compileSort(sortKeys)
		const keyLen = accessors.length

		const decorated = new Array(array.length)

		for (let i = 0; i < array.length; i++) {

			const obj = array[i]
			const keys = new Array(keyLen)

			for (let k = 0; k < keyLen; k++) {
				keys[k] = accessors[k](obj)
			}

			decorated[i] = { k: keys, v: obj }

		}

		decorated.sort((a, b) => {

			const ak = a.k
			const bk = b.k

			for (let i = 0; i < keyLen; i++) {

				const c = this.compare(ak[i], bk[i])

				if (c !== 0) return desc[i] ? -c : c

			}

			return 0

		})

		for (let i = 0; i < decorated.length; i++) {
			array[i] = decorated[i].v
		}

		return array

	}

	/* =========================
	   binary search
	========================= */

	static binarySearch<T>(
		array: T[],
		comparator: (value: T, index: number) => number
	): number | null {

		let left = 0
		let right = array.length - 1

		while (left <= right) {

			const mid = (left + right) >> 1
			const result = comparator(array[mid], mid)

			if (result === 0) return mid

			if (result < 0) {
				right = mid - 1
			} else {
				left = mid + 1
			}

		}

		return null
	}

	/* =========================
	   binary search by key
	========================= */

	static binarySearchByKey<T>(
		array: T[],
		key: string,
		target: any
	): number | null {

		const accessor = this.compileAccessor(key)

		return this.binarySearch(array, (v) => {

			const val = accessor(v)

			if (val === target) return 0
			return val > target ? -1 : 1

		})

	}

	/* =========================
	   group by
	========================= */

	static groupBy<T>(array: T[], key: string): Map<any, T[]> {

		const accessor = this.compileAccessor(key)

		const map = new Map<any, T[]>()

		for (const item of array) {

			const k = accessor(item)

			if (!map.has(k)) {
				map.set(k, [])
			}

			map.get(k)!.push(item)

		}

		return map

	}

	/* =========================
	   unique
	========================= */

	static uniqueBy<T>(array: T[], key: string): T[] {

		const accessor = this.compileAccessor(key)

		const seen = new Set()
		const result: T[] = []

		for (const item of array) {

			const k = accessor(item)

			if (!seen.has(k)) {
				seen.add(k)
				result.push(item)
			}

		}

		return result

	}

	/* =========================
	   index by key
	========================= */

	static indexBy<T>(array: T[], key: string): Map<any, T> {

		const accessor = this.compileAccessor(key)

		const map = new Map<any, T>()

		for (const item of array) {
			map.set(accessor(item), item)
		}

		return map

	}

}
