export const IMAGE_URLS_KEY = "IFS_IMAGE_URLS";
export const getImageUrlsKeyForId = (id: number): string => `${IMAGE_URLS_KEY}_${id}`;
export const RANT_KEY = "IFS_RANT";
export const getRantKeyForId = (id: number): string => `${RANT_KEY}_${id}`;
export const SYSTEM_PROMPTS_KEY = "IFS_SP";
export const getSystemPromptsKeyForId = (id: number): string => `${SYSTEM_PROMPTS_KEY}_${id}`;
export type PartImageUrls = { manager: string; firefighter: string; exile: string };
