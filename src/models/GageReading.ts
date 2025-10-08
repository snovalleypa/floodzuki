import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"

// GageReading 
// timestamp: "2019-12-20T23:45:03",
// waterHeight: 71.42,
// waterDischarge: 2400,
// groundHeight: 63.02,
// batteryMillivolt: 3891,
// roadSaddleHeight: 66.34,
// isDeleted: false,
// isMissing: false


export const GageReadingModel = types
  .model("GageReading")
  .props({
    id: types.maybe(types.number),
    timestamp: types.maybe(types.string),
    waterHeight: types.maybe(types.number),
    waterDischarge: types.maybe(types.number),
    groundHeight: types.maybe(types.number),
    batteryMillivolt: types.maybe(types.number),
    roadSaddleHeight: types.maybe(types.number),
    isDeleted: types.maybe(types.boolean),
    isMissing: types.maybe(types.boolean),
  })


export const GageReadingStoreModel = types
  .model("GageReadingStore")
  .props({
    readings: types.array(GageReadingModel),
  })

export interface GageReadingStore extends Instance<typeof GageReadingStoreModel> {}
export interface GageReadingStoreSnapshot extends SnapshotOut<typeof GageReadingStoreModel> {}

export interface GageReading extends Instance<typeof GageReadingModel> {}
export interface GageReadingSnapshotOut extends SnapshotOut<typeof GageReadingModel> {}
export interface GageReadingSnapshotIn extends SnapshotIn<typeof GageReadingModel> {}
