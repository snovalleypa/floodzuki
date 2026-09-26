import { getCacheStorageKey, isStaleStorageKey } from "../storageKeys";

const mockConstants: { expoConfig: { version?: string } | null } = {
  expoConfig: { version: "1.0.37" },
};
const mockUpdates: { updateId: string | null } = { updateId: null };

jest.mock("expo-constants", () => ({
  __esModule: true,
  get default() {
    return mockConstants;
  },
}));
jest.mock("expo-updates", () => ({
  get updateId() {
    return mockUpdates.updateId;
  },
}));

beforeEach(() => {
  mockConstants.expoConfig = { version: "1.0.37" };
  mockUpdates.updateId = null;
});

describe("getCacheStorageKey", () => {
  it("uses the app version and 'embedded' when running the bundled JS", () => {
    expect(getCacheStorageKey()).toBe("store-cache-1.0.37-embedded");
  });

  it("includes the OTA update id so a JS-only update gets a fresh cache", () => {
    mockUpdates.updateId = "0f9c-update";
    expect(getCacheStorageKey()).toBe("store-cache-1.0.37-0f9c-update");
  });

  it("still produces a key when the version is unavailable", () => {
    mockConstants.expoConfig = null;
    expect(getCacheStorageKey()).toBe("store-cache-unknown-embedded");
  });
});

describe("isStaleStorageKey", () => {
  const current = "store-cache-1.0.37-embedded";

  it("flags cache keys from other versions or updates", () => {
    expect(isStaleStorageKey("store-cache-1.0.36-embedded", current)).toBe(true);
    expect(isStaleStorageKey("store-cache-1.0.37-abc", current)).toBe(true);
  });

  it("flags legacy root-vN keys", () => {
    expect(isStaleStorageKey("root-v2", current)).toBe(true);
    expect(isStaleStorageKey("root-v3", current)).toBe(true);
  });

  it("keeps the current cache key, the user key, and unrelated keys", () => {
    expect(isStaleStorageKey(current, current)).toBe(false);
    expect(isStaleStorageKey("store-user-v1", current)).toBe(false);
    expect(isStaleStorageKey("debug-flags-v1", current)).toBe(false);
    expect(isStaleStorageKey("mock-replay-v1", current)).toBe(false);
  });
});

describe("isStaleStorageKey — shared web origin", () => {
  it("never touches keys outside our namespace, even ones that look like caches", () => {
    // On web, AsyncStorage is the origin's localStorage, shared with other scripts.
    expect(isStaleStorageKey("cache-something-else", "store-cache-1.0.37-embedded")).toBe(false);
    expect(isStaleStorageKey("root-v9-other-app", "store-cache-1.0.37-embedded")).toBe(false);
    expect(isStaleStorageKey("install_banner_dismissed_at", "store-cache-1.0.37-embedded")).toBe(
      false
    );
  });
});
