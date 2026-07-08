import { getSnapshot } from "mobx-state-tree";

import { GageModel } from "@models/Gage";

// The crash itself (lazy types.array materialized during React's commit-phase
// prop walk) only manifests under React 19's dev renderer and isn't reproducible
// in Jest. These guard that the WaterTrend afterCreate hook creates cleanly and
// the trendValues array is materialized/accessible right after create.
describe("WaterTrend trendValues materialization", () => {
  it("creates with trendValues provided and exposes them", () => {
    const g = GageModel.create({
      locationId: "USGS-1",
      status: {
        floodLevel: "Flooding",
        levelTrend: "Rising",
        waterTrend: { trendValues: [0.1, 0.2], trendValue: 0.2 },
      },
    });
    expect(g.status!.waterTrend!.trendValue).toBeCloseTo(0.2, 5);
    expect([...g.status!.waterTrend!.trendValues]).toEqual([0.1, 0.2]);
  });

  it("creates with trendValues omitted — array is a materialized empty array", () => {
    const g = GageModel.create({
      locationId: "USGS-2",
      status: { floodLevel: "Normal", levelTrend: "Steady", waterTrend: { trendValue: 0 } },
    });
    expect(g.status!.waterTrend!.trendValues.length).toBe(0);
    expect(getSnapshot(g).status!.waterTrend).toBeDefined();
  });
});
