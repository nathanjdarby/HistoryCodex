"use client";

import { use } from "react";
import { PackDetailView } from "@/components/pack-detail-view";

export default function PackDetailPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId: packIdParam } = use(params);
  const packId = Number(packIdParam);

  if (!Number.isInteger(packId) || packId <= 0) {
    return <p className="text-sm text-red-400">Invalid pack link.</p>;
  }

  return <PackDetailView packId={packId} />;
}
