import { describe, expect, it } from "vitest";
import { formatTime, LOCALE_PREFERENCE_VERSION_KEY, localizeMessage, localizeSearchStopReason, localizeSyntheticText, localizeSyntheticValue, localizeTerm, PUBLIC_SYNTHETIC_PLAYGROUND_ID, readStoredLocale, translate } from "../web/src/i18n";

describe("workbench localization", () => {
  it("renders complete Simplified Chinese chrome without changing unknown domain content", () => {
    expect(translate("zh-CN", "mainLineVariations")).toBe("正谱 + 变化分支");
    expect(translate("zh-CN", "positionCounts", { pawns: 6, relations: 2, flows: 0 })).toBe("6 个棋子 · 2 条关系 · 0 条流");
    expect(localizeTerm("zh-CN", "counterfactual")).toBe("反事实");
    expect(localizeTerm("zh-CN", "relation")).toBe("关系");
    expect(localizeTerm("zh-CN", "flow")).toBe("流");
    expect(localizeTerm("zh-CN", "not-applicable")).toBe("不适用");
    expect(localizeTerm("zh-CN", "candidate")).toBe("候选");
    expect(localizeTerm("zh-CN", "succeeded")).toBe("已成功");
    expect(localizeTerm("zh-CN", "adopted")).toBe("已采纳");
    expect(localizeTerm("zh-CN", "medium")).toBe("中等");
    expect(localizeSearchStopReason("zh-CN", "maxDepth", "策略终止")).toBe("达到最大深度");
    expect(localizeSearchStopReason("zh-CN", undefined, "策略终止")).toBe("策略终止");
    expect(localizeTerm("zh-CN", "decision-authority")).toBe("决策授权关系");
    expect(localizeMessage("zh-CN", "Evidence accepted.")).toBe("证据已接受。");
    expect(localizeMessage("zh-CN", "verbatim model output")).toBe("verbatim model output");
  });

  it("defaults fresh and invalid preferences to Simplified Chinese while retaining an explicit choice", () => {
    expect(readStoredLocale(undefined)).toBe("zh-CN");
    expect(readStoredLocale({ getItem: () => "invalid" })).toBe("zh-CN");
    expect(readStoredLocale({ getItem: () => "zh-CN" })).toBe("zh-CN");
    expect(readStoredLocale({ getItem: () => "en" })).toBe("zh-CN");
    expect(readStoredLocale({ getItem: (key) => key === LOCALE_PREFERENCE_VERSION_KEY ? "2" : "en" })).toBe("en");
    expect(readStoredLocale({ getItem: () => { throw new Error("storage blocked"); } })).toBe("zh-CN");
    expect(formatTime("zh-CN", "2026-08-17T10:20:00Z")).toContain("8月");
  });

  it("localizes only repository-owned synthetic presentation content", () => {
    expect(localizeSyntheticText("zh-CN", PUBLIC_SYNTHETIC_PLAYGROUND_ID, "Clarify the decision boundary")).toBe("明确决策边界");
    expect(localizeSyntheticText("zh-CN", PUBLIC_SYNTHETIC_PLAYGROUND_ID, "improve decision clarity")).toBe("提升决策清晰度");
    expect(localizeSyntheticText("en", PUBLIC_SYNTHETIC_PLAYGROUND_ID, "Clarify the decision boundary")).toBe("Clarify the decision boundary");
    expect(localizeSyntheticText("zh-CN", "playground-real", "Clarify the decision boundary")).toBe("Clarify the decision boundary");
    expect(localizeSyntheticText("zh-CN", PUBLIC_SYNTHETIC_PLAYGROUND_ID, "user supplied text")).toBe("user supplied text");
    expect(localizeSyntheticValue("zh-CN", PUBLIC_SYNTHETIC_PLAYGROUND_ID, { status: "synchronous-alignment-first" })).toEqual({ status: "优先同步对齐" });
  });
});
