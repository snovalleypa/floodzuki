import { Linking } from "react-native";

/**
 * Helper for opening a give URL in an external browser.
 */
export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url))
}

/**
 * useLocalSearchParams() and useSearchParams() are hooks that return the
 * search params from the current URL. The result returned can be either
 * a string or a string[]
 * 
 * But we need to normalize the result to always be a string.
 * 
 * @param searchParams - The search params from the current URL
 * 
 */
export function normalizeSearchParams(searchParams: string | string[]) {
  return Array.isArray(searchParams) ? searchParams.join(", ") : searchParams
}
