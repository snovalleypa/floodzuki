// src/services/mockReplay/__tests__/mockReplayState.test.ts
import * as storage from "@utils/storage";
import {
  applyMockReplayFromParams,
  getActiveScenario,
  isMockReplayActive,
  loadMockReplay,
  __resetMockReplayForTest,
} from "../mockReplayState";

jest.mock("@utils/storage");
const mockStorage = storage as jest.Mocked<typeof storage>;

describe("mockReplayState", () => {
  beforeEach(() => {
    __resetMockReplayForTest();
    jest.clearAllMocks();
  });

  it("is inert by default", () => {
    expect(isMockReplayActive()).toBe(false);
    expect(getActiveScenario()).toBeNull();
  });

  it("activates a valid scenario id from params and persists it", async () => {
    await applyMockReplayFromParams({ mock: "march-2022-major" });
    expect(isMockReplayActive()).toBe(true);
    expect(getActiveScenario()?.id).toBe("march-2022-major");
    expect(mockStorage.save).toHaveBeenCalled();
  });

  it("ignores an unknown scenario id", async () => {
    await applyMockReplayFromParams({ mock: "nope" });
    expect(isMockReplayActive()).toBe(false);
  });

  it("reset clears the active scenario", async () => {
    await applyMockReplayFromParams({ mock: "march-2022-major" });
    await applyMockReplayFromParams({ mock: "reset" });
    expect(isMockReplayActive()).toBe(false);
    expect(mockStorage.remove).toHaveBeenCalled();
  });

  it("rehydrates a non-expired stored id via loadMockReplay", async () => {
    mockStorage.load.mockResolvedValue({ id: "jan-2022-moderate", expiresAt: Date.now() + 100000 });
    await loadMockReplay();
    expect(getActiveScenario()?.id).toBe("jan-2022-moderate");
  });

  it("drops an expired stored id", async () => {
    mockStorage.load.mockResolvedValue({ id: "jan-2022-moderate", expiresAt: Date.now() - 1 });
    await loadMockReplay();
    expect(isMockReplayActive()).toBe(false);
  });
});
