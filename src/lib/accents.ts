export const ACCENTS = [
  { value: "default", label: "Default", swatch: "oklch(0.269 0 0)" },
  { value: "blue", label: "Blue", swatch: "oklch(0.546 0.245 262.881)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.541 0.281 293.009)" },
  { value: "green", label: "Green", swatch: "oklch(0.627 0.194 149.214)" },
  { value: "orange", label: "Orange", swatch: "oklch(0.646 0.222 41.116)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.586 0.253 17.585)" },
] as const;

export type Accent = (typeof ACCENTS)[number]["value"];
