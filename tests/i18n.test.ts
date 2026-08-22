import { describe, expect, it } from "vitest";
import { formatTime, localizeMessage, localizeTerm, readStoredLocale, translate } from "../web/src/i18n";

describe("workbench localization", () => {
  it("renders complete Simplified Chinese chrome without changing unknown domain content", () => {
    expect(translate("zh-CN", "mainLineVariations")).toBe("正谱 + 变化分支");
    expect(translate("zh-CN", "positionCounts", { pawns: 6, relations: 2, flows: 0 })).toBe("6 个棋子 · 2 条关系 · 0 条流");
    expect(localizeTerm("zh-CN", "counterfactual")).toBe("反事实");
    expect(localizeTerm("zh-CN", "decision-authority")).toBe("decision authority");
    expect(localizeMessage("zh-CN", "Evidence accepted.")).toBe("证据已接受。");
    expect(localizeMessage("zh-CN", "verbatim model output")).toBe("verbatim model output");
  });

  it("defaults invalid preferences to English and formats dates by locale", () => {
    expect(readStoredLocale(undefined)).toBe("en");
    expect(readStoredLocale({ getItem: () => "invalid" })).toBe("en");
    expect(readStoredLocale({ getItem: () => "zh-CN" })).toBe("zh-CN");
    expect(readStoredLocale({ getItem: () => { throw new Error("storage blocked"); } })).toBe("en");
    expect(formatTime("zh-CN", "2026-08-17T10:20:00Z")).toContain("8月");
  });
});
