export type Marketplace = "WB" | "OZON";

export type JobCreateCardsInput = {
  marketplace: Marketplace;
  productTitle: string;
  brand?: string;
  category?: string;
  colors: { name: string; hex?: string }[];
  features: string[];
  specs: Record<string, string>;
  images: { key: string; kind: "RAW" | "CUTOUT" }[];
  templatePack: string;
  cardsPerColor: number;
  premiumDesign: boolean;
  wantVideo?: boolean;
};

export type JobEnhanceInput = {
  images: { key: string }[];
  upscale: boolean;
  colorCorrect: boolean;
};

export type JobBackgroundInput = {
  images: { key: string }[];
  mode: "REMOVE" | "REPLACE";
  background: "WHITE" | "GRADIENT" | "SCENE";
};

export type RenderCardSpec = {
  marketplace: Marketplace;
  width: number;
  height: number;
  quality: number;
  safeMarginsPx: number;
};
