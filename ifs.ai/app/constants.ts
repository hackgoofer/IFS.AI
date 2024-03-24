export const IMAGE_URLS_KEY = "IFS_IMAGE_URLS";
export const RANT_KEY = "IFS_RANT";
export const getImageUrlsKeyForId = (id: number): string => `${IMAGE_URLS_KEY}_${id}`;
export const getRantKeyForId = (id: number): string => `${RANT_KEY}_${id}`;
export type PartImageUrls = { manager: string; firefighter: string; exile: string };
