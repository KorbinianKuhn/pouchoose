export function clone<T>(value: T): T {
  if (typeof value !== 'object' || value === null) {
    return value;
  } else if (value instanceof Date) {
    return new Date(value) as any;
  } else if (Array.isArray(value)) {
    const length = value.length;
    const array = new Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = clone(value[i]);
    }
    return array as any;
  } else {
    const obj = {};
    const keys = Object.keys(value);
    for (const key of keys) {
      obj[key] = clone(value[key]);
    }
    return obj as any;
  }
}
