import { useState, useEffect } from "react";
import { ref, onValue, runTransaction } from "firebase/database";
import { database, getCurrentMonth } from "../lib/firebase";

export function useLikes(imageId: string) {
  const [likeCount, setLikeCount] = useState<number>(0);
  // Read initial local storage state
  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`liked_${imageId}`) === "true";
  });

  useEffect(() => {
    if (!database) return;

    const likeRef = ref(database, `likes/${imageId}`);
    
    // Subscribe to real-time changes
    const unsubscribe = onValue(likeRef, (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data.count === "number") {
        setLikeCount(data.count);
      } else {
        setLikeCount(0);
      }
    });

    return () => unsubscribe();
  }, [imageId]);

  const toggleLike = async () => {
    if (!database) {
      // If Firebase isn't configured yet, just toggle local state so UI works
      const newState = !hasLiked;
      setHasLiked(newState);
      setLikeCount((prev) => (newState ? prev + 1 : prev - 1));
      if (newState) {
        localStorage.setItem(`liked_${imageId}`, "true");
      } else {
        localStorage.removeItem(`liked_${imageId}`);
      }
      return;
    }

    const likeRef = ref(database, `likes/${imageId}`);
    const newHasLiked = !hasLiked;
    
    // Optimistic UI update
    setHasLiked(newHasLiked);
    
    if (newHasLiked) {
      localStorage.setItem(`liked_${imageId}`, "true");
    } else {
      localStorage.removeItem(`liked_${imageId}`);
    }

    try {
      await runTransaction(likeRef, (currentData) => {
        const month = getCurrentMonth();

        if (currentData === null) {
          // First like ever on this image — always include count AND month
          return newHasLiked ? { count: 1, month } : { count: 0, month };
        }

        let newCount = (currentData.count || 0) + (newHasLiked ? 1 : -1);
        if (newCount < 0) newCount = 0;

        // Always return BOTH count and month so the .validate rule never fails
        return {
          count: newCount,
          month: currentData.month || month,
        };
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Firebase transaction failed:", errMsg);

      // Only revert the UI if it's a PERMISSION error (rules blocked the write).
      // For network errors, keep the optimistic state so the user isn't confused.
      const isPermissionError = errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("denied");
      
      if (isPermissionError) {
        // The database rules blocked this write — revert the UI
        setHasLiked(!newHasLiked);
        if (!newHasLiked) {
          localStorage.setItem(`liked_${imageId}`, "true");
        } else {
          localStorage.removeItem(`liked_${imageId}`);
        }
      }
      // For all other errors (network, timeout, etc.) keep the optimistic UI state
    }
  };

  return { likeCount, hasLiked, toggleLike };
}

export function useAllLikes() {
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!database) return;

    const likesRef = ref(database, 'likes');
    const unsubscribe = onValue(likesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLikesMap({});
        return;
      }

      const newMap: Record<string, number> = {};
      Object.keys(data).forEach((key) => {
        newMap[key] = data[key].count || 0;
      });
      setLikesMap(newMap);
    });

    return () => unsubscribe();
  }, []);

  return likesMap;
}
