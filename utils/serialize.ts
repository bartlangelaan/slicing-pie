import { formatISO } from 'date-fns';

export function serialize<T extends object>(item: T): T {
  return mapValues(item, (value) => {
    if (value instanceof Date) {
      return formatISO(value);
    }

    if (value !== null && typeof value === 'object') {
      return serialize(value);
    }

    return value;
  });
}

const dateRegex = /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/;

export function unserialize<T extends object>(item: T): T {
  return mapValues(item, (value) => {
    if (typeof value === 'string' && dateRegex.test(value)) {
      return new Date(value);
    }

    if (value !== null && typeof value === 'object') {
      return unserialize(value);
    }

    return value;
  });
}

function mapValues<T extends object>(
  object: T,
  fn: (value: unknown) => any,
): T {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [key, fn(value)]),
  ) as any;
}
