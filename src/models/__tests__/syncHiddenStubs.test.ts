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

  it("is a no-op when called with showHidden=false — stubs persist in the tree (display layer hides them)", () => {
    const store = buildStore();
    store.syncHiddenStubs(true, locations);
    const beforeIds = store.gages.map((g) => g.locationId).sort();
    store.syncHiddenStubs(false, locations);
    // Stubs must NOT be removed: removing detaches MST nodes, and React DevTools'
    // commit-phase prop introspection then trips "Path upon death" /
    // "initializing phase" errors. The toggle filters at the display layer instead.
    const afterIds = store.gages.map((g) => g.locationId).sort();
    expect(afterIds).toEqual(beforeIds);
    const stubC = store.gages.find((g) => g.locationId === "C");
    expect(stubC?._isStub).toBe(true);
  });

  it("materializes lazy MST arrays on the stub so devtools reads don't trip 'initializing phase'", () => {
    const store = buildStore();
    store.syncHiddenStubs(true, locations);
    const stub = store.gages.find((g) => g.locationId === "C");
    // Reading these properties from outside an action must not throw — these are the
    // exact reads React DevTools performs when logging component props post-commit.
    expect(() => stub?.readings.length).not.toThrow();
    expect(() => stub?.actualReadings.length).not.toThrow();
    expect(() => stub?.predictions.length).not.toThrow();
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
