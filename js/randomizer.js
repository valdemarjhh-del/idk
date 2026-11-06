(function (global) {
  "use strict";

  function parseList(text) {
    const lines = String(text ?? "").replace(/\r/g, "").split("\n");
    const groups = [];
    const errors = [];
    let currentGroup = null;

    lines.forEach((rawLine, index) => {
      if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) return;

      const normalized = rawLine.replace(/\t/g, "    ");
      const match = normalized.match(/^(\s*)(.*?)\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*$/);
      if (!match) {
        errors.push({ line: index + 1, message: "Use the format Name / Weight." });
        return;
      }

      const indent = match[1].length;
      const name = match[2].trim();
      const weight = Number(match[3]);

      if (!name) {
        errors.push({ line: index + 1, message: "The option name is missing." });
        return;
      }
      if (!Number.isFinite(weight) || weight < 0) {
        errors.push({ line: index + 1, message: "Weight must be zero or a positive number." });
        return;
      }

      if (indent === 0) {
        currentGroup = { name, weight, variants: [], line: index + 1 };
        groups.push(currentGroup);
      } else if (!currentGroup) {
        errors.push({ line: index + 1, message: "An indented variant needs a parent option above it." });
      } else {
        currentGroup.variants.push({ name, weight, line: index + 1 });
      }
    });

    const candidateWeights = new Map();
    groups.forEach((group) => {
      if (group.weight <= 0) return;

      if (group.variants.length === 0) {
        candidateWeights.set(group.name, (candidateWeights.get(group.name) || 0) + group.weight);
        return;
      }

      const enabledVariants = group.variants.filter((variant) => variant.weight > 0);
      const variantTotal = enabledVariants.reduce((sum, variant) => sum + variant.weight, 0);
      if (variantTotal <= 0) return;

      enabledVariants.forEach((variant) => {
        const effectiveWeight = group.weight * (variant.weight / variantTotal);
        candidateWeights.set(variant.name, (candidateWeights.get(variant.name) || 0) + effectiveWeight);
      });
    });

    const candidates = Array.from(candidateWeights, ([name, weight]) => ({ name, weight }));
    return { groups, candidates, errors };
  }

  function pickIndex(items, totalWeight) {
    let target = Math.random() * totalWeight;
    for (let index = 0; index < items.length; index += 1) {
      target -= items[index].weight;
      if (target < 0) return index;
    }
    return items.length - 1;
  }

  function generateResults(text, requestedCount, noDuplicates) {
    const parsed = parseList(text);
    const count = Math.max(1, Math.min(500, Math.floor(Number(requestedCount) || 1)));
    const basePool = parsed.candidates.filter((item) => item.weight > 0);
    const availablePool = basePool.slice();
    const results = [];

    if (noDuplicates) {
      const drawCount = Math.min(count, availablePool.length);
      for (let draw = 0; draw < drawCount; draw += 1) {
        const total = availablePool.reduce((sum, item) => sum + item.weight, 0);
        if (total <= 0) break;
        const chosenIndex = pickIndex(availablePool, total);
        results.push(availablePool[chosenIndex].name);
        availablePool.splice(chosenIndex, 1);
      }
    } else {
      const total = basePool.reduce((sum, item) => sum + item.weight, 0);
      if (total > 0) {
        for (let draw = 0; draw < count; draw += 1) {
          const chosenIndex = pickIndex(basePool, total);
          results.push(basePool[chosenIndex].name);
        }
      }
    }

    return {
      results,
      errors: parsed.errors,
      availableCount: basePool.length,
      requestedCount: count,
      shortened: Boolean(noDuplicates && results.length < count && basePool.length > 0)
    };
  }

  global.WeightedRandomizer = Object.freeze({ parseList, generateResults });
})(window);
