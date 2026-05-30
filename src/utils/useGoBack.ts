import { type Href, useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";

export function useGoBack(fallbackPathname: string): () => void {
  const navigation = useNavigation();
  const router = useRouter();

  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push({ pathname: fallbackPathname } as Href);
    }
  }, [navigation, router, fallbackPathname]);
}
