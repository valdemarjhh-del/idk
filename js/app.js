(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const $ = (selector) => document.querySelector(selector);
    const listNav = $("#list-nav");
    const listName = $("#list-name");
    const listInput = $("#input-text");
    const resultCountInput = $("#result-count");
    const noDuplicatesInput = $("#no-duplicates");
    const generateButton = $("#generate-button");
    const resultsList = $("#results");
    const emptyState = $("#empty-state");
    const resultCountBadge = $("#result-count-badge");
    const validationMessage = $("#validation-message");
    const outputMessage = $("#output-message");
    const lineCount = $("#line-count");
    const saveIndicator = $("#save-indicator");
    const copyAllButton = $("#copy-all");
    const clearButton = $("#clear-results");
    const importFile = $("#import-file");

    const requiredElements = [listNav, listName, listInput, resultCountInput, noDuplicatesInput,
      generateButton, resultsList, emptyState, resultCountBadge, validationMessage,
      outputMessage, lineCount, saveIndicator, copyAllButton, clearButton, importFile];

    if (requiredElements.some((element) => !element)) {
      console.error("Weighted Random Generator: a required page element is missing. Check index.html and use the complete project files.");
      return;
    }

    const sampleText = "Apple / 5\n  Apple, Green / 2\n  Apple, Yellow / 5\n  Apple, Red / 3\nBanana / 2\nOrange / 4";
    let lists = WRGStorage.loadLists();
    if (!lists.length) {
      lists = [{ id: makeId(), name: "My first list", text: sampleText }];
      WRGStorage.saveLists(lists);
    }

    let activeListIndex = 0;
    let latestResults = [];
    const preferences = WRGStorage.loadPreferences();

    applyPreferences();
    renderLists();
    loadActiveList();
    updateLineCount();
    registerServiceWorker();
    setupInstallPrompt();

    $("#add-list").addEventListener("click", addList);
    $("#delete-list").addEventListener("click", deleteCurrentList);
    listNav.addEventListener("click", handleListNavigation);
    listName.addEventListener("input", handleNameChange);
    listInput.addEventListener("input", handleTextChange);
    generateButton.addEventListener("click", generate);
    copyAllButton.addEventListener("click", () => copyText(latestResults.join("\n"), "All results copied."));
    clearButton.addEventListener("click", clearResults);
    $("#import-button").addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", importSelectedFile);
    $("#export-button").addEventListener("click", exportCurrentList);
    $("#export-backup").addEventListener("click", exportAllLists);
    $("#theme-toggle").addEventListener("click", toggleTheme);
    $("#accent-colour").addEventListener("input", changeAccent);

    function makeId() {
      return `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function persistLists() {
      try {
        WRGStorage.saveLists(lists);
        saveIndicator.innerHTML = '<span class="save-dot"></span> Saved automatically';
      } catch (error) {
        saveIndicator.textContent = "Could not save in this browser";
        showValidation("Browser storage is unavailable or full. Export your list to keep a copy.", true);
      }
    }

    function renderLists() {
      listNav.innerHTML = "";
      lists.forEach((list, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.index = String(index);
        button.textContent = list.name;
        button.classList.toggle("active", index === activeListIndex);
        button.setAttribute("aria-current", index === activeListIndex ? "page" : "false");
        listNav.appendChild(button);
      });
    }

    function loadActiveList() {
      const current = lists[activeListIndex];
      if (!current) return;
      listName.value = current.name;
      listInput.value = current.text;
      updateLineCount();
      clearResults();
      renderLists();
    }

    function handleListNavigation(event) {
      const button = event.target.closest("button[data-index]");
      if (!button) return;
      const index = Number(button.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index >= lists.length) return;
      activeListIndex = index;
      loadActiveList();
    }

    function addList() {
      const nextNumber = lists.length + 1;
      lists.push({ id: makeId(), name: `List ${nextNumber}`, text: "" });
      activeListIndex = lists.length - 1;
      persistLists();
      loadActiveList();
      listName.focus();
      listName.select();
    }

    function deleteCurrentList() {
      if (lists.length === 1) {
        lists[0].name = "My first list";
        lists[0].text = "";
        activeListIndex = 0;
      } else {
        lists.splice(activeListIndex, 1);
        activeListIndex = Math.max(0, activeListIndex - 1);
      }
      persistLists();
      loadActiveList();
      showValidation("Current list deleted.", false, true);
    }

    function handleNameChange() {
      lists[activeListIndex].name = listName.value.slice(0, 60);
      persistLists();
      renderLists();
    }

    function handleTextChange() {
      lists[activeListIndex].text = listInput.value;
      persistLists();
      updateLineCount();
      validationMessage.textContent = "List updated. Press Generate list when you're ready.";
      validationMessage.className = "validation-message";
    }

    function updateLineCount() {
      const count = listInput.value.split("\n").filter((line) => line.trim()).length;
      lineCount.textContent = `${count} ${count === 1 ? "line" : "lines"}`;
    }

    function generate() {
      const count = Number(resultCountInput.value);
      if (!Number.isInteger(count) || count < 1 || count > 500) {
        showValidation("Choose a result count between 1 and 500.", true);
        return;
      }

      const outcome = WeightedRandomizer.generateResults(listInput.value, count, noDuplicatesInput.checked);
      latestResults = outcome.results;
      renderResults(latestResults);

      if (outcome.errors.length) {
        const first = outcome.errors[0];
        const extra = outcome.errors.length > 1 ? ` (+${outcome.errors.length - 1} more)` : "";
        showValidation(`Line ${first.line}: ${first.message}${extra}`, true);
      } else if (!outcome.results.length) {
        showValidation("No active options found. Add a valid option with a weight greater than 0.", true);
      } else if (outcome.shortened) {
        showValidation(`There are only ${outcome.availableCount} unique active results, so all ${outcome.results.length} were returned.`, false, true);
      } else {
        showValidation(`Generated ${outcome.results.length} ${outcome.results.length === 1 ? "result" : "results"}.`, false, true);
      }
    }

    function renderResults(items) {
      resultsList.innerHTML = "";
      resultCountBadge.textContent = String(items.length);
      emptyState.hidden = items.length > 0;
      copyAllButton.disabled = items.length === 0;
      clearButton.disabled = items.length === 0;
      outputMessage.textContent = "";

      items.forEach((item, index) => {
        const row = document.createElement("li");
        row.className = "result-row";

        const number = document.createElement("span");
        number.className = "result-number";
        number.textContent = String(index + 1);

        const text = document.createElement("span");
        text.className = "result-text";
        text.textContent = item;

        const copyButton = document.createElement("button");
        copyButton.className = "copy-one";
        copyButton.type = "button";
        copyButton.textContent = "⧉";
        copyButton.title = `Copy ${item}`;
        copyButton.setAttribute("aria-label", `Copy result ${index + 1}`);
        copyButton.addEventListener("click", () => copyText(item, `Copied: ${item}`));

        row.append(number, text, copyButton);
        resultsList.appendChild(row);
      });
    }

    function clearResults() {
      latestResults = [];
      resultsList.innerHTML = "";
      resultCountBadge.textContent = "0";
      emptyState.hidden = false;
      copyAllButton.disabled = true;
      clearButton.disabled = true;
      outputMessage.textContent = "";
    }

    function showValidation(message, isError, isSuccess) {
      validationMessage.textContent = message;
      validationMessage.className = `validation-message${isError ? " error" : isSuccess ? " success" : ""}`;
    }

    async function copyText(text, successMessage) {
      if (!text) return;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const temporary = document.createElement("textarea");
          temporary.value = text;
          temporary.style.position = "fixed";
          temporary.style.opacity = "0";
          document.body.appendChild(temporary);
          temporary.select();
          const copied = document.execCommand("copy");
          temporary.remove();
          if (!copied) throw new Error("Clipboard copy failed");
        }
        outputMessage.textContent = successMessage;
      } catch (error) {
        outputMessage.textContent = "Copy was blocked by the browser. Select the result text and copy it manually.";
      }
    }

    function downloadFile(filename, content, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function exportCurrentList() {
      const current = lists[activeListIndex];
      const safeName = current.name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "weighted-list";
      downloadFile(`${safeName}.txt`, current.text, "text/plain;charset=utf-8");
    }

    function exportAllLists() {
      const backup = { app: "Weighted Random Generator", version: 1, exportedAt: new Date().toISOString(), lists };
      downloadFile("weighted-random-generator-backup.json", JSON.stringify(backup, null, 2), "application/json");
    }

    async function importSelectedFile() {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (file.name.toLowerCase().endsWith(".json")) {
          const data = JSON.parse(text);
          const importedLists = Array.isArray(data) ? data : data.lists;
          if (!Array.isArray(importedLists)) throw new Error("That JSON file does not contain a lists array.");
          const normalized = importedLists
            .filter((item) => item && typeof item.text === "string")
            .map((item, index) => ({ id: makeId(), name: String(item.name || `Imported list ${index + 1}`).slice(0, 60), text: item.text }));
          if (!normalized.length) throw new Error("No usable lists were found in that backup.");
          lists = normalized;
          activeListIndex = 0;
          persistLists();
          loadActiveList();
          showValidation(`Imported ${normalized.length} ${normalized.length === 1 ? "list" : "lists"}.`, false, true);
        } else {
          lists[activeListIndex].text = text;
          persistLists();
          loadActiveList();
          showValidation("Text list imported.", false, true);
        }
      } catch (error) {
        showValidation(`Import failed: ${error.message}`, true);
      } finally {
        importFile.value = "";
      }
    }

    function applyPreferences() {
      const theme = preferences.theme === "light" ? "light" : "dark";
      document.body.dataset.theme = theme;
      updateThemeButton();
      if (typeof preferences.accent === "string" && /^#[0-9a-f]{6}$/i.test(preferences.accent)) {
        document.documentElement.style.setProperty("--accent", preferences.accent);
        $("#accent-colour").value = preferences.accent;
      }
    }

    function updateThemeButton() {
      const light = document.body.dataset.theme === "light";
      const button = $("#theme-toggle");
      button.textContent = light ? "☾" : "☼";
      button.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
      button.title = light ? "Switch to dark theme" : "Switch to light theme";
    }

    function toggleTheme() {
      preferences.theme = document.body.dataset.theme === "light" ? "dark" : "light";
      document.body.dataset.theme = preferences.theme;
      updateThemeButton();
      savePreferences();
    }

    function changeAccent(event) {
      const accent = event.target.value;
      document.documentElement.style.setProperty("--accent", accent);
      preferences.accent = accent;
      savePreferences();
    }

    function savePreferences() {
      try { WRGStorage.savePreferences(preferences); } catch (error) { /* Preferences are optional. */ }
    }

    function registerServiceWorker() {
      if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.warn("Offline support could not be registered:", error);
      });
    }

    function setupInstallPrompt() {
      let installPrompt = null;
      const installButton = $("#install-button");
      window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        installPrompt = event;
        installButton.hidden = false;
      });
      installButton.addEventListener("click", async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        installButton.hidden = true;
      });
      window.addEventListener("appinstalled", () => {
        installButton.hidden = true;
      });
    }
  }
})();
