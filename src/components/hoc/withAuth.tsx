import { useRouter } from "next/router";
import { useEffect } from "react";
import { useStore } from "../../store";
import { PAGES } from "../../config/pages";

export const WithAuth = (WrappedComponent: React.ComponentType) => {
  const WithAuthComponent = (props: any) => {
    const router = useRouter();
    const { authStore } = useStore();

    useEffect(() => {
      if (!authStore.state.profileId) {
        router.push(PAGES.AUTH);
      }
    }, [authStore.state.profileId]);

    if (!authStore.state.profileId) {
      return null; // или компонент загрузки
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithAuthComponent;
};
