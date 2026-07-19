import { CARD_TYPE_ENUM } from "@/db/schema";
import type { LucideIcon } from "lucide-react";
import { Flag, MapPin, Swords, User } from "lucide-react";

export type CardType = (typeof CARD_TYPE_ENUM)[number];

export const CARD_TYPES = [...CARD_TYPE_ENUM] as const;

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  character: "Character",
  location: "Location",
  unit: "Unit",
  event: "Event",
};

export const CARD_TYPE_LABELS_PLURAL: Record<CardType, string> = {
  character: "Characters",
  location: "Locations",
  unit: "Units",
  event: "Events",
};

export const CARD_TYPE_ICONS: Record<CardType, LucideIcon> = {
  character: User,
  location: MapPin,
  unit: Flag,
  event: Swords,
};
