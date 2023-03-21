/**
 * A collection of colors available across the app.
 */

export enum Palette {
  transparent = "transparent",
  white = "#fff",

  black = "#18191F",
  black800 = "#474A57",
  black700 = "#969BAB",
  black400 = "#DADADA",
  black300 = "#D6D8D6",
  black200 = "#EEEFF4",
  black100 = "#F4F5F7",

  blue = "#1947E5",
  blue800 = "#8094FF",
  blue100 = "#E9E7FC",

  yellow = "#FFBD00",
  yellow800 = "#F9D262",
  yellow100 = "#FFE8B2",

  orange = "#ff7f00",
  orange800 = "#ff9832",
  orange100 = "#fff2e5",

  green = "#00C6AE",
  green800 = "#61E4C5",
  green100 = "#D6FCF7",

  red = "#F95A2C",
  red800 = "#FF9692",
  red100 = "#FFE8E8",

  pink = "#FF89BB",
  pink800 = "#FFC7DE",
  pink100 = "#FFF3F8",

  violette = "#925FF1",
  violette800 = "#a77ef3",
  violette100 = "#e9dffc",
}

export const Colors = {
  dark: Palette.black, // dark, used for blacks
  lightDark: Palette.black800, // light dark
  primary: Palette.orange,
  danger: Palette.red, // red
  warning: Palette.yellow, // yellow
  success: Palette.green, // green
  info: Palette.pink, // light blue
  
  darkGrey: Palette.black700, // dark grey
  midGrey: Palette.black300, // mid grey
  lightGrey: Palette.black100, // light grey

  separator: Palette.black300, // separator color
  text: Palette.black, // text color
  tint: Palette.black300, // tint color
  background: Palette.white,
  grayBackground: Palette.black100, // background color

  tagBackground: Palette.red800, // tag background color
  tabBackground: Palette.white, // tab background color

  chartBarOver: Palette.yellow,
  chartBarNormal: Palette.yellow800,
  chartBarUnder: Palette.yellow100,

  sliderBackground: Palette.black400, // slider background color
  sliderFill: Palette.yellow800, // slider fill color
  
  // colors
  transparent: Palette.transparent,
  white: Palette.white,

  // generic
  blue: Palette.blue,
  lightBlue: Palette.blue800,
  softBlue: Palette.blue100,
  
  yellow: Palette.yellow,
  lightYellow: Palette.yellow800,
  softYellow: Palette.yellow100,

  green: Palette.green,
  lightGreen: Palette.green800,
  softGreen: Palette.green100,

  red: Palette.red,
  lightRed: Palette.red800,
  softRed: Palette.red100,

  pink: Palette.pink,
  lightPink: Palette.pink800,
  softPink: Palette.pink100,

  violette: Palette.violette,
  lightViolette: Palette.violette800,
  softViolette: Palette.violette100,
}

/**
 * Primary ColorTypes that can be used in some components like Button or Label.
 */
export enum ColorTypes {
  primary = "primary",
  danger = "danger",
  warning = "warning",
  success = "success",
  info = "info",

  blue = "blue",
  lightBlue = "lightBlue",
  softBlue = "softBlue",
  
  yellow = "yellow",
  lightYellow = "lightYellow",
  softYellow = "softYellow",
  
  green = "green",
  lightGreen = "lightGreen",
  softGreen = "softGreen",
  
  red = "red",
  lightRed = "lightRed",
  softRed = "softRed",
  
  pink = "pink",
  lightPink = "lightPink",
  softPink = "softPink",
}
