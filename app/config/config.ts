/**
 * This file imports configuration objects from either the config.dev.ts file
 * or the config.prod.ts file depending on whether we are in __DEV__ or not.
 *
 */
import BaseConfig from "./config.base"
import ProdConfig from "./config.prod"
import DevConfig from "./config.dev"

let ExtraConfig = ProdConfig

if (__DEV__) {
  ExtraConfig = DevConfig
}

const Config = { ...BaseConfig, ...ExtraConfig }

export default Config
