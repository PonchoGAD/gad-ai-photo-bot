export * from "./render.js";
export * from "./schema.js";

export type TemplatePack = {
  id: string;
  name: string;
};

export async function renderTemplatePack(
  pack: TemplatePack,
  input: any
) {
  return [];
}
