export type TemplatePack = {
    id: string;
    layoutHtmlPath: string;
    templateJsonPath: string;
};
export type RenderPayload = {
    title: string;
    subtitle?: string;
    features: string[];
    specs: Record<string, string>;
    imageUrl: string;
    colorName?: string;
    brand?: string;
};
//# sourceMappingURL=schema.d.ts.map