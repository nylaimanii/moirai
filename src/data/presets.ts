export interface Preset { label: string; durationHours: number; powerKw: number; }

export const PRESETS: Preset[] = [
  { label: "GPU fine-tune", durationHours: 4, powerKw: 10 },
  { label: "Render farm", durationHours: 8, powerKw: 25 },
  { label: "Batch ETL", durationHours: 2, powerKw: 4 },
  { label: "LLM pretrain", durationHours: 12, powerKw: 60 },
];
