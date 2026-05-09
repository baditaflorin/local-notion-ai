import { z } from "zod";

const STORAGE_KEY = "local-notion-ai:settings:v1";

const settingsSchema = z.object({
  schemaVersion: z.literal(1),
  debugByDefault: z.boolean(),
  autoRunSummaryAfterImport: z.boolean(),
  showNormalizedPreview: z.boolean()
});

export type UserSettings = z.infer<typeof settingsSchema>;

export const defaultSettings: UserSettings = {
  schemaVersion: 1,
  debugByDefault: false,
  autoRunSummaryAfterImport: false,
  showNormalizedPreview: true
};

export type SettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storageOrNull(): SettingsStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function parseSettings(input: unknown): UserSettings {
  const parsed = settingsSchema.partial().safeParse(input);
  if (!parsed.success) {
    return defaultSettings;
  }

  return {
    ...defaultSettings,
    ...parsed.data,
    schemaVersion: 1
  };
}

export function loadSettings(storage = storageOrNull()): UserSettings {
  if (!storage) {
    return defaultSettings;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }

    return parseSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings, storage = storageOrNull()): void {
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(parseSettings(settings)));
}

export function clearSettings(storage = storageOrNull()): void {
  storage?.removeItem(STORAGE_KEY);
}
