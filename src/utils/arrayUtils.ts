export function distinct<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index;
}

export function isArrayNotEmpty<T>(array: Array<T> | null | undefined): array is Array<T> {
  return Array.isArray(array) && array.length > 0;
}

export function isDefined<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

/**
 * Gets the highest number from a list. For example, ['Test1', 'Test2', 'Test3'] would return 3.
 */
export function getMaxItemNumber(itemName: string, numberedItems: Array<string>): number | null {
  const valuesWithItemName = numberedItems.filter((value) => value.startsWith(itemName));
  const numbers = valuesWithItemName
    .map((value) => Number(value.substring(itemName.length)))
    .filter(Number.isFinite);
  return numbers.length > 0 ? Math.max(...numbers) : null;
}

/**
 * Gets the next numbered item in a list. For example, ['Test1', 'Test2', 'Test3'] would return 'Test4'.
 */
export function getNextNumberedItem(itemName: string, currentNumberedItems: Array<string>) {
  const nextItemNumber = 1 + (getMaxItemNumber(itemName, currentNumberedItems) ?? 0);
  return `${itemName}${nextItemNumber}`;
}
