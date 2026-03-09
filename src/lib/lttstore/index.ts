
export function sum(counts: {[k: string | number | symbol]: number | null}) {
  return Object.values(counts)
    .filter(c => c !== null)
    .reduce((previousValue, currentValue) => {
      if(currentValue == null || currentValue < 0) return previousValue;
      return (previousValue ?? 0) + currentValue;
    }, 0) ?? undefined;
}