

export function typed<Type>(): Type;
export function typed<Type>(def: Type) : Type;
export function typed(def?: any) {
  return def;
}