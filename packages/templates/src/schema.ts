export type TemplatePack = {
  id: string;               // "minimal-dark"
  layoutHtmlPath: string;   // packs/minimal-dark/layout.html
  templateJsonPath: string; // packs/minimal-dark/template.json
};

export type RenderPayload = {
  title: string;
  subtitle?: string;
  features: string[];
  specs: Record<string, string>;
  imageUrl: string;     // cutout/background-ready
  colorName?: string;
  brand?: string;
};
