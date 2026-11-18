const KEY = 'atelier-linkup:v1'

export function loadState<T>(fallback: T): T {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) }
  } catch {
    return fallback
  }
}

export function saveState<T>(state: T): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage may be full or blocked (private mode): the demo keeps working in memory.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Ignore: nothing to clear.
  }
}
