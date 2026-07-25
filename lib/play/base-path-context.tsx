"use client";

import { createContext, useContext } from "react";

export type PlayBasePath = "/play" | "/admin/play";

const PlayBasePathContext = createContext<PlayBasePath>("/play");

export function PlayBasePathProvider({
  basePath,
  children,
}: {
  basePath: PlayBasePath;
  children: React.ReactNode;
}) {
  return <PlayBasePathContext.Provider value={basePath}>{children}</PlayBasePathContext.Provider>;
}

export function usePlayBasePath(): PlayBasePath {
  return useContext(PlayBasePathContext);
}

export function playPaths(basePath: PlayBasePath) {
  return {
    home: basePath,
    decks: `${basePath}/decks`,
    match: (id: number | string) => `${basePath}/matches/${id}`,
  };
}
