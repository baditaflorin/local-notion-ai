import { describe, expect, it } from "vitest";
import { defaultSettings, loadSettings, parseSettings, saveSettings } from "./settingsStore";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("settings store", () => {
  it("defaults invalid persisted settings", () => {
    expect(parseSettings({ schemaVersion: 99, debugByDefault: "yes" })).toEqual(defaultSettings);
  });

  it("persists validated settings", () => {
    const storage = new MemoryStorage();
    const settings = {
      ...defaultSettings,
      debugByDefault: true,
      autoRunSummaryAfterImport: true
    };

    saveSettings(settings, storage);

    expect(loadSettings(storage)).toEqual(settings);
  });
});
