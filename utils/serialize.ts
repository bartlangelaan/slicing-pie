import { formatISO } from 'date-fns';

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return formatISO(value);
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value !== null && typeof value === 'object') {
    return serialize(value);
  }

  return value;
}

export function serialize<T extends object>(item: T): T {
  return mapValues(item, serializeValue);
}

const dateRegex = /\d\d\d\d-\d\d-\d\d(T\d\d:\d\d:\d\d.\d\d\dZ)?/;

function unserializeValue(value: unknown): unknown {
  if (typeof value === 'string' && dateRegex.test(value)) {
    return new Date(value);
  }

  if (Array.isArray(value)) {
    return value.map(unserializeValue);
  }

  if (value !== null && typeof value === 'object') {
    return unserialize(value);
  }

  return value;
}

export function unserialize<T extends object>(item: T): T {
  return mapValues(item, unserializeValue);
}

function mapValues<T extends object>(
  object: T,
  fn: (value: unknown) => any,
): T {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [key, fn(value)]),
  ) as any;
}
