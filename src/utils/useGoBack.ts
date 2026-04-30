import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";

export function useGoBack(fallbackPathname: string): () => void {
  const navigation = useNavigation();
  const router = useRouter();

  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push({ pathname: fallbackPathname });
    }
  }, [navigation, router, fallbackPathname]);
}
