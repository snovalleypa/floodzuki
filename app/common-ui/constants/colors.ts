/**
 * A collection of colors available across the app.
 */

export enum Palette {
  transparent = "transparent",
  white = "#fff",
  whiteish = "#fffffe",

  black = "#18191F",
  black800 = "#474A57",
  black750 = "#707070",
  black700 = "#969BAB",
  black400 = "#DADADA",
  black300 = "#D6D8D6",
  black200 = "#EEEFF4",
  black100 = "#F4F5F7",

  gray = "#fbfcfd",

  blue = "#0a66c2",
  blue800 = "#378fe9",
  blue100 = "#E9E7FC",

  greenishBlue = "#069ba8",

  yellow = "#FFBD00",
  yellow800 = "#F9D262",
  yellow100 = "#FFE8B2",

  orange = "#ff7f00",
  orange800 = "#ff9832",
  orange100 = "#fff2e5",

  green = "#2cb67d",
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

  chartBlue = "#44b5f2",
  chartRed = "#ff0000",
  chartOrange = "#ff7f00",
  chartGreen = "#00FF00",
  chartPink = "#ff00ff",
}

export const Colors = {
  dark: Palette.black, // dark, used for blacks
  lightDark: Palette.black800, // light dark
  primary: Palette.orange,
  danger: Palette.red, // red
  warning: Palette.yellow, // yellow
  success: Palette.green, // green
  info: Palette.pink, // light blue
  
  darkerGrey: Palette.black750,
  darkGrey: Palette.black700, // dark grey
  midGrey: Palette.black300, // mid grey
  lightGrey: Palette.black200, // light grey
  lightestGrey: Palette.black100, // lightest grey

  separator: Palette.black300, // separator color
  text: Palette.black, // text color
  tint: Palette.black300, // tint color
  background: Palette.gray,
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

  svpaBrand: Palette.greenishBlue,

  // Chart colors
  gageChartColor: Palette.chartBlue,
  gageChartDeletedLineColor: Palette.chartRed,
  gageChartPredictionsLineColor: Palette.chartOrange,
  gageChartActualDataLineColor: Palette.chartGreen,
  gageChartForecastDataLineColor: Palette.chartPink,
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

export const ChartColorsHex = ['#0000FF', '#008000', '#800000', '#800080', '#FF4500', '#00FF00'];


export function lightenHexColor(hexColor: string): string {
  // Convert the hex color to an RGB color
  const rgbColor = hexToRgb(hexColor);

  // Calculate the new RGB values by adding 40% to each value
  const newRed = Math.min(Math.round(rgbColor.r * 1.4), 255);
  const newGreen = Math.min(Math.round(rgbColor.g * 1.4), 255);
  const newBlue = Math.min(Math.round(rgbColor.b * 1.4), 255);

  // Convert the new RGB values back to a hex color
  const newHexColor = rgbToHex(newRed, newGreen, newBlue);

  return newHexColor;
}

function hexToRgb(hexColor: string): { r: number, g: number, b: number } {
  // Remove the # symbol from the hex color
  const hex = hexColor.replace('#', '');

  // Convert the hex color to an RGB color
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

function rgbToHex(red: number, green: number, blue: number): string {
  // Convert the RGB values to a hex color
  const rHex = red.toString(16).padStart(2, '0');
  const gHex = green.toString(16).padStart(2, '0');
  const bHex = blue.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}