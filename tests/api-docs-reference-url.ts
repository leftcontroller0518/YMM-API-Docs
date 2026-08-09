import {buildSymbolIndex, DuplicateSymbolIdError} from "@/lib/api-docs/symbol-index";
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {getReferenceUrl} from "@/lib/api-docs/reference-url";

describe("ApiReferenceUrl", () => {
  it("checks url of namespace", () => {
    assert.equal(
      getReferenceUrl("N:YukkuriMovieMaker.Plugin"),
      "/reference/N%3AYukkuriMovieMaker.Plugin",
    )
  })
  it("checks url of type", () => {
    assert.equal(
      getReferenceUrl("T:YukkuriMovieMaker.Plugin.VideoNode"),
      "/reference/T%3AYukkuriMovieMaker.Plugin.VideoNode",
    )
  })
  it("checks url of method", () => {
    assert.equal(
      getReferenceUrl(
        "M:YukkuriMovieMaker.Plugin.VideoNode.Process(YukkuriMovieMaker.FrameBuffer)",
      ),
      "/reference/M%3AYukkuriMovieMaker.Plugin.VideoNode.Process%28YukkuriMovieMaker.FrameBuffer%29",
    )
  })
  it("checks url of generic method", () => {
    assert.equal(
      getReferenceUrl(
        "M:Foo.Bar.Baz(System.Collections.Generic.List<System.String>)",
      ),
      "/reference/M%3AFoo.Bar.Baz%28System.Collections.Generic.List%3CSystem.String%3E%29",
    )
  })
  it("checks url keeping upper", () => {
    const url = getReferenceUrl("T:Foo.Bar")

    assert.ok(url.includes("T%3A"))
    assert.ok(!url.includes("t%3a"))
  })
})