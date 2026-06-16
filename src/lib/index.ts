

export function typed<Type>(): Type;
export function typed<Type>(def: Type): Type;
export function typed<Type>(def?: Type): Type {
  return def as Type;
}