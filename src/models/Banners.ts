import { Instance, SnapshotIn, SnapshotOut, types, flow } from "mobx-state-tree";
import { api } from "@services/api";

import { dataFetchingProps, withDataFetchingActions } from "./helpers/withDataFetchingProps";
import { withSetPropAction } from "./helpers/withSetPropsAction";

// Banner example data:
// "regionBanner": "....",
// "regionBannerType": "Warning",
// "gaugeBanners": {
//   "SVPA-21": {
//    "banner": "...",
//    "bannerType": "Info",
//   },
//   ....
// }

export enum BannerTypes {
  info = "info",
  warning = "warning",
  danger = "danger",
}

const GaugeBannerModel = types.model("GaugeBanner").props({
  id: types.string,
  banner: types.maybe(types.string),
  bannerType: types.maybe(types.string),
});

const RegionBannersModel = types.model("Banners").props({
  regionBanner: types.maybe(types.string),
  regionBannerType: types.maybe(types.string),
  gaugeBanners: types.map(GaugeBannerModel),
});

type RegionGaugeBannerResponse = {
  banner?: string;
  bannerType?: string;
};

type RegionBannerResponse = {
  regionBanner?: string;
  regionBannerType?: string;
  gaugeBanners: Record<string, RegionGaugeBannerResponse>;
};

export const RegionBannersModelStore = types
  .model("RegionBannersStore")
  .props({
    regionBanners: RegionBannersModel,
    ...dataFetchingProps,
  })
  .actions(withDataFetchingActions)
  .actions(withSetPropAction)
  .actions((store) => {
    const fetchData = flow(function* () {
      store.setIsFetching(true);

      const response = yield api.getRegionBanners<RegionBanners>();
      if (response.kind === "ok") {
        // Looks like output provides "data" as a string so we'll parse it here
        buildData(response.data);
      } else {
        store.setError(response.kind);
      }

      store.setIsFetching(false);
    });

    const buildData = (response: RegionBannerResponse) => {
      store.regionBanners.regionBanner = response.regionBanner;
      store.regionBanners.regionBannerType = response.regionBannerType;
      Object.keys(response.gaugeBanners).forEach((gaugeId) => {
        const value = response.gaugeBanners[gaugeId];

        if (!value) {
          return;
        }

        store.regionBanners.gaugeBanners.set(gaugeId, {
          id: gaugeId,
          banner: value.banner,
          bannerType: value.bannerType,
        });
      });
    };

    return {
      fetchData,
      buildData,
    };
  });

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RegionBannersStore extends Instance<typeof RegionBannersModelStore> {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RegionBannersStoreSnapshot extends SnapshotOut<typeof RegionBannersModelStore> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RegionBanners extends Instance<typeof RegionBannersModel> {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RegionBannersSnapshotOut extends SnapshotOut<typeof RegionBannersModel> {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RegionBannersSnapshotIn extends SnapshotIn<typeof RegionBannersModel> {}
