export function distinct<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index;
}

export function isArrayNotEmpty<T>(array: Array<T> | null | undefined): array is Array<T> {
  return Array.isArray(array) && array.length > 0;
}

export function isDefined<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
