/**
 * Service to manage custom presets for article types and genres.
 */
export const SettingsService = {
  getPresets: (key: string): string[] => {
    const stored = localStorage.getItem(`wbw_presets_${key}`);
    return stored ? JSON.parse(stored) : [];
  },
  
  savePreset: (key: string, value: string): void => {
    const presets = SettingsService.getPresets(key);
    if (!presets.includes(value)) {
      presets.push(value);
      localStorage.setItem(`wbw_presets_${key}`, JSON.stringify(presets));
    }
  }
};
