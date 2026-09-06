"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Rafraîchit la page serveur toutes les `seconds` secondes (max ~2 min). */
export default function AutoRefresh({ seconds = 4, maxTimes = 30 }: { seconds?: number; maxTimes?: number }) {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      if (count > maxTimes) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds, maxTimes]);
  return null;
}
