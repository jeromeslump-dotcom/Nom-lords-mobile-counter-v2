export function reorderArray<T>(
  arr: T[],
  from: number,
  to: number
): T[] {
  const next = [...arr];

  const [moved] = next.splice(from, 1);

  next.splice(to, 0, moved);

  return next;
}