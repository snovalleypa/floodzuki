import { types } from "mobx-state-tree";
import { GageStoreModel } from "../Gage";

const LocationStub = types.model("LocationStub", {
  id: types.identifier,
  isMetagage: types.optional(types.boolean, false),
});

describe("GageStore.syncHiddenStubs", () => {
  const buildStore = () => {
    const store = GageStoreModel.create({
      gages: [
        { locationId: "A", _isStub: false } as any,
        { locationId: "B", _isStub: false } as any,
      ],
    });
    return store;
  };

  const locations = [
    LocationStub.create({ id: "A" }),
    LocationStub.create({ id: "B" }),
    LocationStub.create({ id: "C" }),
    LocationStub.create({ id: "D" }),
    LocationStub.create({ id: "META", isMetagage: true }),
  ];

  it("adds stubs for hidden locations when called with showHidden=true", () => {
    const store = buildStore();
    store.syncHiddenStubs(true, locations);

    const ids = store.gages.map((g) => g.locationId).sort();
    expect(ids).toEqual(["A", "B", "C", "D"]);
    const stub = store.gages.find((g) => g.locationId === "C");
    expect(stub?._isStub).toBe(true);
    expect(stub?.isOffline).toBe(true);
  });

  it("removes all stubs when called with showHidden=false", () => {
    const store = buildStore();
    store.syncHiddenStubs(true, locations);
    store.syncHiddenStubs(false, locations);
    expect(store.gages.map((g) => g.locationId).sort()).toEqual(["A", "B"]);
    expect(store.gages.every((g) => !g._isStub)).toBe(true);
  });

  it("preserves the MST identity of real gauges across repeated sync calls", () => {
    const store = buildStore();
    const realA = store.gages.find((g) => g.locationId === "A");
    store.syncHiddenStubs(true, locations);
    store.syncHiddenStubs(false, locations);
    store.syncHiddenStubs(true, locations);
    const realAAfter = store.gages.find((g) => g.locationId === "A");
    expect(realAAfter).toBe(realA);
  });

  it("is idempotent — a second call with the same inputs is a no-op", () => {
    const store = buildStore();
    store.syncHiddenStubs(true, locations);
    const snapshotIds = store.gages.map((g) => g.locationId);
    store.syncHiddenStubs(true, locations);
    expect(store.gages.map((g) => g.locationId)).toEqual(snapshotIds);
  });

  it("skips metagage locations when building stubs", () => {
    const store = buildStore();
    store.syncHiddenStubs(true, locations);
    expect(store.gages.find((g) => g.locationId === "META")).toBeUndefined();
  });
});
