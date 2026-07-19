"use client";

import { useEffect } from "react";

export function useCardModalNavigation<T extends { id: number }>(
  items: T[],
  viewingId: number | null,
  setViewingId: (id: number | null) => void,
) {
  const viewingIndex = viewingId !== null ? items.findIndex((item) => item.id === viewingId) : -1;
  const viewing = viewingIndex >= 0 ? items[viewingIndex] : null;

  function goToPrevious() {
    if (viewingIndex > 0) setViewingId(items[viewingIndex - 1].id);
  }

  function goToNext() {
    if (viewingIndex >= 0 && viewingIndex < items.length - 1) {
      setViewingId(items[viewingIndex + 1].id);
    }
  }

  useEffect(() => {
    if (viewingId !== null && viewingIndex === -1) setViewingId(null);
  }, [viewingId, viewingIndex, setViewingId]);

  return {
    viewing,
    viewingIndex,
    onPrevious: viewingIndex > 0 ? goToPrevious : undefined,
    onNext: viewingIndex >= 0 && viewingIndex < items.length - 1 ? goToNext : undefined,
    positionLabel:
      items.length > 1 && viewingIndex >= 0 ? `${viewingIndex + 1} / ${items.length}` : undefined,
  };
}
