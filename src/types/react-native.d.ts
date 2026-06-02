// react-native 0.83 ships PressableStateCallbackType without `hovered`.
// `hovered` is valid at runtime via react-native-web for pointer-event hover
// styling on web. `export {}` makes this a module so the declaration below
// augments (merges with) the existing react-native types rather than replacing them.
export {};

declare module "react-native" {
  interface PressableStateCallbackType {
    hovered?: boolean;
  }
}
