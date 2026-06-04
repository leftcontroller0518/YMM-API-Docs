import {buildSymbolIndex, DuplicateSymbolIdError} from "@/lib/api-docs/symbol-index";
import {describe, it} from "node:test";
import assert from "node:assert/strict";

describe("ApiSymbolIndexing", () => {
  it("builds index from one document", () => {
    const index = buildSymbolIndex([
      {
        id: "N:Foo",
        type: "namespace",
        name: "Foo",
        summary: "Foo",
      },
    ])

    assert.equal(index.byId.size, 1)
    assert.ok(index.byId.has("N:Foo"))
  })
  it("builds index from multiple documents", () => {
    const index = buildSymbolIndex([
      {
        id: "N:Foo",
        type: "namespace",
        name: "Foo",
        summary: "Foo",
      },
      {
        id: "T:Foo.Bar",
        type: "class",
        name: "Foo.Bar",
        namespace: "Foo",
        accessibility: "public",
        summary: "Bar",
      },
    ])

    assert.equal(index.byId.size, 2)
  })
  it("throws on duplicate symbol ids", () => {
    assert.throws(
      () => buildSymbolIndex([
        {
          id: "N:Foo",
          type: "namespace",
          name: "Foo",
          summary: "Foo",
        },
        {
          id: "N:Foo",
          type: "namespace",
          name: "Foo",
          summary: "Foo2",
        },
      ]),
      DuplicateSymbolIdError,
    )
  })
})