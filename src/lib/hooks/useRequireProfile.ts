import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRequireProfile(user: any) {
  const router = useRouter();

  useEffect(() => {
    if (!user?.profileCompleted) {
      router.replace("/onboarding");
    }
  }, [user, router]);
}
