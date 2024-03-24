export const IMAGE_URLS_KEY = "IFS_IMAGE_URLS";
export const getImageUrlsKeyForId = (id: number): string => `${IMAGE_URLS_KEY}_${id}`;
export type PartImageUrls = { manager: string; firefighter: string; exile: string };
