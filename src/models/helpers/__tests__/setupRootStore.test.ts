import { RootStoreModel } from "@models/RootStore";
import { setupRootStore } from "../setupRootStore";

// In-memory, key-aware stand-in for AsyncStorage so tests can seed individual keys
// (user state vs. versioned cache vs. legacy root-vN) and inspect what was written.
const mockStorage = new Map<string, unknown>();

jest.mock("@utils/storage", () => ({
  load: jest.fn(async (key: string) => (mockStorage.has(key) ? mockStorage.get(key) : null)),
  save: jest.fn(async (key: string, value: unknown) => {
    mockStorage.set(key, JSON.parse(JSON.stringify(value)));
    return true;
  }),
  remove: jest.fn(async (key: string) => {
    mockStorage.delete(key);
  }),
  getAllKeys: jest.fn(async () => [...mockStorage.keys()]),
}));

// Pin the cache key so tests don't depend on the app version / OTA update id.
jest.mock("../storageKeys", () => ({
  ...jest.requireActual("../storageKeys"),
  getCacheStorageKey: () => "store-cache-1.0.99999-embedded",
}));

// Debug-flag and mock-replay plumbing read their own storage keys; stub them so
// they don't interact with the root-store keys under test.
jest.mock("@utils/debugFlags", () => ({
  loadDebugFlags: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@services/mockReplay/mockReplayState", () => ({
  loadMockReplay: jest.fn().mockResolvedValue(undefined),
  isMockReplayActive: jest.fn().mockReturnValue(false),
}));

// setupRootStore calls api.setHeader when an auth token is present. Stub it.
jest.mock("@services/api", () => ({
  api: {
    setHeader: jest.fn(),
    removeHeader: jest.fn(),
  },
}));

// Locale plumbing — imported by setupRootStore. AuthSession.ts also imports
// { i18n } and reads i18n.locale at model-definition time.
jest.mock("@i18n/i18n", () => ({ changeLocale: jest.fn(), i18n: { locale: "en" } }));
jest.mock("@services/localDayJs", () => ({
  __esModule: true,
  default: { locale: jest.fn() },
}));

const { save } = jest.requireMock("@utils/storage") as { save: jest.Mock };
const { api } = jest.requireMock("@services/api") as { api: { setHeader: jest.Mock } };
const { isMockReplayActive } = jest.requireMock("@services/mockReplay/mockReplayState") as {
  isMockReplayActive: jest.Mock;
};

const USER_KEY = "store-user-v1";
const CACHE_KEY = "store-cache-1.0.99999-embedded";

const loggedInAuth = {
  sessionState: "loggedIn",
  authToken: "tok-123",
  preferredLocale: "es",
  gageSubscriptions: ["USGS-38"],
};

const cachedGages = {
  gagesStore: {
    gages: [
      { locationId: "USGS-38", _isStub: false },
      { locationId: "USGS-22", _isStub: false },
    ],
  },
  locationInfoStore: {
    locationInfos: [{ id: "USGS-38" }, { id: "USGS-22" }],
  },
};

beforeEach(() => {
  mockStorage.clear();
  save.mockClear();
  api.setHeader.mockClear();
  isMockReplayActive.mockReturnValue(false);
});

describe("setupRootStore stub rehydration", () => {
  it("repopulates stubs for hidden locations when showHiddenOffline rehydrates as true", async () => {
    // A session that ended with the toggle ON. Stubs were stripped during persist
    // (postProcessSnapshot), so only real gauges are present in the cache.
    mockStorage.set(USER_KEY, { showHiddenOffline: true });
    mockStorage.set(CACHE_KEY, {
      gagesStore: {
        gages: [
          { locationId: "USGS-38", _isStub: false },
          { locationId: "USGS-22", _isStub: false },
        ],
      },
      locationInfoStore: {
        locationInfos: [
          { id: "USGS-38" },
          { id: "SVPA-29" }, // hidden — no corresponding real gauge
          { id: "USGS-22" },
          { id: "SVPA-25" }, // hidden — no corresponding real gauge
        ],
      },
    });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    const locationIds = rootStore.gagesStore.gages.map((g) => g.locationId).sort();
    expect(locationIds).toEqual(["SVPA-25", "SVPA-29", "USGS-22", "USGS-38"]);

    const svpa29 = rootStore.gagesStore.gages.find((g) => g.locationId === "SVPA-29");
    expect(svpa29?._isStub).toBe(true);

    // The list the gauge details screen consumes — must include hidden locations
    // in locationInfos order, so initialIndex doesn't shift after fetchData runs.
    expect(rootStore.getLocationWithGagesIds()).toEqual([
      "USGS-38",
      "SVPA-29",
      "USGS-22",
      "SVPA-25",
    ]);
  });

  it("does not add stubs when showHiddenOffline rehydrates as false", async () => {
    mockStorage.set(USER_KEY, { showHiddenOffline: false });
    mockStorage.set(CACHE_KEY, {
      gagesStore: {
        gages: [
          { locationId: "USGS-38", _isStub: false },
          { locationId: "USGS-22", _isStub: false },
        ],
      },
      locationInfoStore: {
        locationInfos: [{ id: "USGS-38" }, { id: "SVPA-29" }, { id: "USGS-22" }],
      },
    });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect(rootStore.gagesStore.gages.map((g) => g.locationId).sort()).toEqual([
      "USGS-22",
      "USGS-38",
    ]);
  });
});

describe("setupRootStore user state vs. versioned cache", () => {
  it("persists login + prefs under the user key and gauge data under the cache key", async () => {
    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    rootStore.authSessionStore.setProp("authToken", "tok-123");
    rootStore.setShowHiddenOffline(true);
    rootStore.gagesStore.setIsFetching(true);

    const user = mockStorage.get(USER_KEY) as Record<string, any>;
    const cache = mockStorage.get(CACHE_KEY) as Record<string, any>;

    expect(user.authSessionStore.authToken).toBe("tok-123");
    expect(user.showHiddenOffline).toBe(true);
    expect(user.gagesStore).toBeUndefined();

    expect(cache.gagesStore).toBeDefined();
    expect(cache.authSessionStore).toBeUndefined();
    expect(cache.showHiddenOffline).toBeUndefined();
  });

  it("keeps the user logged in when the app version changes (no cache for this version)", async () => {
    mockStorage.set(USER_KEY, { authSessionStore: loggedInAuth, showHiddenOffline: false });
    mockStorage.set("store-cache-1.0.99998-embedded", cachedGages);

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect(rootStore.authSessionStore.isLoggedIn).toBe(true);
    expect(rootStore.authSessionStore.authToken).toBe("tok-123");
    expect(api.setHeader).toHaveBeenCalledWith("Authorization", "Bearer tok-123");
    // The old version's cache is ignored — the app starts with no gauges and refetches.
    expect(rootStore.gagesStore.gages).toHaveLength(0);
  });

  it("restores both login and gauge data when the cache matches the current version", async () => {
    mockStorage.set(USER_KEY, { authSessionStore: loggedInAuth, showHiddenOffline: false });
    mockStorage.set(CACHE_KEY, cachedGages);

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect(rootStore.authSessionStore.isLoggedIn).toBe(true);
    expect(rootStore.gagesStore.gages.map((g) => g.locationId).sort()).toEqual([
      "USGS-22",
      "USGS-38",
    ]);
  });

  it("migrates login + prefs from a legacy root-v3 snapshot without restoring its gauge data", async () => {
    mockStorage.set("root-v3", {
      authSessionStore: loggedInAuth,
      showHiddenOffline: true,
      ...cachedGages,
    });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect(rootStore.authSessionStore.isLoggedIn).toBe(true);
    expect(rootStore.authSessionStore.preferredLocale).toBe("es");
    expect(rootStore.showHiddenOffline).toBe(true);
    expect(rootStore.gagesStore.gages.filter((g) => !g._isStub)).toHaveLength(0);

    const user = mockStorage.get(USER_KEY) as Record<string, any>;
    expect(user.authSessionStore.authToken).toBe("tok-123");
    expect(mockStorage.has("root-v3")).toBe(false);
  });

  it("falls back to root-v2 when root-v3 is absent (users who skipped 1.0.36)", async () => {
    mockStorage.set("root-v2", { authSessionStore: loggedInAuth, ...cachedGages });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect(rootStore.authSessionStore.isLoggedIn).toBe(true);
    expect(mockStorage.has("root-v2")).toBe(false);
  });

  it("prefers the user key over a leftover legacy snapshot", async () => {
    mockStorage.set(USER_KEY, { authSessionStore: { sessionState: "notLoggedIn" } });
    mockStorage.set("root-v3", { authSessionStore: loggedInAuth });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect(rootStore.authSessionStore.isLoggedIn).toBe(false);
  });

  it("deletes stale cache and legacy root keys but leaves unrelated keys alone", async () => {
    mockStorage.set(USER_KEY, { authSessionStore: loggedInAuth });
    mockStorage.set(CACHE_KEY, cachedGages);
    mockStorage.set("store-cache-1.0.99998-embedded", cachedGages);
    mockStorage.set("store-cache-1.0.99999-abc123", cachedGages);
    mockStorage.set("root-v2", {});
    mockStorage.set("root-v3", {});
    mockStorage.set("debug-flags-v1", { verbose: true });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    expect([...mockStorage.keys()].sort()).toEqual([CACHE_KEY, "debug-flags-v1", USER_KEY].sort());
  });

  it("does not rewrite the user key when only gauge data changes", async () => {
    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    rootStore.authSessionStore.setProp("authToken", "tok-123");
    save.mockClear();

    rootStore.gagesStore.setIsFetching(true);

    const savedKeys = save.mock.calls.map(([key]) => key);
    expect(savedKeys).toContain(CACHE_KEY);
    expect(savedKeys).not.toContain(USER_KEY);
  });
});

describe("setupRootStore mock-replay mode", () => {
  it("boots from a clean store (ignores persisted gauges) when a mock scenario is active", async () => {
    isMockReplayActive.mockReturnValue(true);
    mockStorage.set(CACHE_KEY, {
      gagesStore: {
        gages: [{ locationId: "USGS-38", _isStub: false }],
      },
    });

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    // Persisted gauges are NOT rehydrated — the engine repopulates on fetch.
    expect(rootStore.gagesStore.gages).toHaveLength(0);
  });

  it("does not persist snapshots while a mock scenario is active", async () => {
    isMockReplayActive.mockReturnValue(true);

    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);
    save.mockClear();

    // Trigger a snapshot change; the onSnapshot handler must skip saving.
    rootStore.gagesStore.setIsFetching(true);

    expect(save).not.toHaveBeenCalled();
  });

  it("persists snapshots normally when no mock scenario is active", async () => {
    const rootStore = RootStoreModel.create({});
    await setupRootStore(rootStore);

    rootStore.gagesStore.setIsFetching(true);

    expect(save).toHaveBeenCalled();
  });
});
