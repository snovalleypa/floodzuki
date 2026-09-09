// src/services/mockReplay/mockReplayState.ts
import * as storage from "@utils/storage";
import { resolveScenario } from "./scenarios";
import { MockReplayScenario } from "./types";

const STORAGE_KEY = "mock-replay-v1";
const TTL_MS = 24 * 60 * 60 * 1000;
const URL_PARAM = "mock";
const RESET_TOKEN = "reset";

type Stored = { id: string; expiresAt: number };

let activeId: string | null = null;

export function __resetMockReplayForTest() {
  activeId = null;
}

export function isMockReplayActive(): boolean {
  return getActiveScenario() !== null;
}

export function getActiveScenario(): MockReplayScenario | null {
  if (!activeId) {
    return null;
  }
  return resolveScenario(activeId) ?? null;
}

export async function loadMockReplay(): Promise<void> {
  const stored = (await storage.load(STORAGE_KEY)) as Stored | null;
  if (!stored || typeof stored !== "object") {
    return;
  }
  if (!stored.expiresAt || stored.expiresAt < Date.now() || !resolveScenario(stored.id)) {
    await storage.remove(STORAGE_KEY);
    return;
  }
  activeId = stored.id;
}

async function persist(): Promise<void> {
  if (!activeId) {
    await storage.remove(STORAGE_KEY);
    return;
  }
  await storage.save(STORAGE_KEY, { id: activeId, expiresAt: Date.now() + TTL_MS });
}

export async function applyMockReplayFromParams(
  params: Record<string, string | string[] | undefined>
): Promise<void> {
  const raw = params[URL_PARAM];
  if (raw === undefined || raw === null) {
    return;
  }
  const token = String(Array.isArray(raw) ? raw[0] : raw).trim();
  if (!token) {
    return;
  }
  if (token === RESET_TOKEN) {
    activeId = null;
    await storage.remove(STORAGE_KEY);
    return;
  }
  if (resolveScenario(token)) {
    activeId = token;
    await persist();
  }
}
