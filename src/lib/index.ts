

export function typed<Type>(): Type | undefined;
export function typed<Type>(def: Type): Type;
export function typed<Type>(def?: Type): Type | undefined {
  return def;
}