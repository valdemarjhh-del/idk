(function (global) {
  "use strict";

  const LISTS_KEY = "weightedRandomGenerator.lists.v1";
  const PREFS_KEY = "weightedRandomGenerator.preferences.v1";

  function readJson(key, fallback) {
    try {
      const stored = global.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function loadLists() {
    const value = readJson(LISTS_KEY, []);
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item === "object")
      .map((item, index) => ({
        id: typeof item.id === "string" ? item.id : `list-${index + 1}`,
        name: typeof item.name === "string" && item.name.trim() ? item.name.slice(0, 60) : `List ${index + 1}`,
        text: typeof item.text === "string" ? item.text : ""
      }));
  }

  function saveLists(lists) {
    global.localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  }

  function loadPreferences() {
    const value = readJson(PREFS_KEY, {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function savePreferences(preferences) {
    global.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }

  global.WRGStorage = Object.freeze({ loadLists, saveLists, loadPreferences, savePreferences });
})(window);
