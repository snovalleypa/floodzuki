import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";

export function useGoBack(
  fallbackPathname: string,
  fallbackParams?: Record<string, any>
): () => void {
  const navigation = useNavigation();
  const router = useRouter();

  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (fallbackParams) {
      router.push({ pathname: fallbackPathname as any, params: fallbackParams });
    } else {
      router.push({ pathname: fallbackPathname as any });
    }
  }, [navigation, router, fallbackPathname, fallbackParams]);
}
