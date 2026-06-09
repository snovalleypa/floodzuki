/**
 * Lightweight, persisted debug flags for power users (data managers, devs).
 *
 * Flags are toggled via URL params (e.g. `?debug=showDeletedReadings`),
 * persisted to AsyncStorage with a TTL, and read synchronously from API
 * code via getDebugFlag(). Not user-facing UX — intentionally undocumented.
 *
 * URL grammar:
 *   ?debug=showDeletedReadings           enable one flag
 *   ?debug=showDeletedReadings,otherFlag enable multiple
 *   ?debug=reset                         clear all flags
 */
import * as storage from "./storage";

const STORAGE_KEY = "debug-flags-v1";
const TTL_MS = 24 * 60 * 60 * 1000; // 1 day

const URL_PARAM = "debug";
const RESET_TOKEN = "reset";

export enum DebugFlag {
  ShowDeletedReadings = "showDeletedReadings",
}

// Derived from the enum — single source of truth for the valid flag set.
const VALID_FLAGS: readonly string[] = Object.values(DebugFlag);

type StoredShape = {
  flags: Partial<Record<DebugFlag, boolean>>;
  expiresAt: number;
};

let cached: Partial<Record<DebugFlag, boolean>> = {};

export function getDebugFlag(name: DebugFlag): boolean {
  return !!cached[name];
}

export async function loadDebugFlags(): Promise<void> {
  const stored = (await storage.load(STORAGE_KEY)) as StoredShape | null;
  if (!stored || typeof stored !== "object") {
    return;
  }
  if (!stored.expiresAt || stored.expiresAt < Date.now()) {
    await storage.remove(STORAGE_KEY);
    return;
  }
  cached = stored.flags ?? {};
}

async function persist(): Promise<void> {
  if (Object.keys(cached).length === 0) {
    await storage.remove(STORAGE_KEY);
    return;
  }
  const payload: StoredShape = {
    flags: cached,
    expiresAt: Date.now() + TTL_MS,
  };
  await storage.save(STORAGE_KEY, payload);
}

export async function resetDebugFlags(): Promise<void> {
  cached = {};
  await storage.remove(STORAGE_KEY);
}

function isValidFlag(value: string): value is DebugFlag {
  return VALID_FLAGS.includes(value);
}

export async function applyDebugFlagsFromParams(
  params: Record<string, string | string[] | undefined>
): Promise<void> {
  const raw = params[URL_PARAM];
  if (raw === undefined || raw === null) {
    return;
  }
  const tokens = (Array.isArray(raw) ? raw : [raw])
    .flatMap((s) => String(s).split(","))
    .map((s) => s.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return;
  }
  if (tokens.includes(RESET_TOKEN)) {
    await resetDebugFlags();
    return;
  }

  let changed = false;
  for (const token of tokens) {
    if (isValidFlag(token) && !cached[token]) {
      cached[token] = true;
      changed = true;
    }
  }
  if (changed) {
    await persist();
  } else {
    // No new flag changes, but the user re-visited the URL — bump TTL.
    if (Object.keys(cached).length > 0) {
      await persist();
    }
  }
}
