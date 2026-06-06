import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  getInheritanceInfo,
  getInheritanceChain,
} from "@/lib/api-docs/get-inheritance-info"

describe("getInheritanceInfo", () => {

  it("returns class inheritance information", () => {

    const result = getInheritanceInfo({
      id: "T:Foo.Bar",
      type: "class",
      name: "Foo.Bar",
      namespace: "Foo",
      accessibility: "public",
      summary: "Bar",

      externalInheritance: [
        {
          type: {
            kind: "named",
            name: "System.Object",
          },
        },
      ],

      base: {
        type: {
          kind: "named",
          name: "Foo.Base",
        },
      },

      implements: [
        {
          type: {
            kind: "named",
            name: "System.IDisposable",
          },
        },
      ],
    })

    assert.equal(result.externalInheritance.length, 1)
    assert.equal(result.base?.type.kind, "named")
    assert.equal(result.implements.length, 1)
  })

  it("normalizes omitted fields", () => {

    const result = getInheritanceInfo({
      id: "T:Foo.Bar",
      type: "class",
      name: "Foo.Bar",
      namespace: "Foo",
      accessibility: "public",
      summary: "Bar",
    })

    assert.deepEqual(
      result,
      {
        externalInheritance: [],
        base: undefined,
        implements: [],
      },
    )
  })

  it("returns empty information for enum", () => {

    const result = getInheritanceInfo({
      id: "T:Foo.Color",
      type: "enum",
      name: "Foo.Color",
      namespace: "Foo",
      accessibility: "public",
      summary: "Color",
    })

    assert.deepEqual(
      result,
      {
        externalInheritance: [],
        implements: [],
      },
    )
  })

  it("returns empty information for delegate", () => {

    const result = getInheritanceInfo({
      id: "D:Foo.Handler",
      type: "delegate",
      name: "Foo.Handler",
      namespace: "Foo",
      accessibility: "public",
      summary: "Handler",

      returns: {
        type: {
          kind: "named",
          name: "System.Void",
        },
      },
    })

    assert.deepEqual(
      result,
      {
        externalInheritance: [],
        implements: [],
      },
    )
  })
})

describe("getInheritanceChain", () => {

  it("builds chain from externalInheritance and base", () => {

    const chain = getInheritanceChain({
      id: "T:Foo.VisualNode",
      type: "class",
      name: "Foo.VisualNode",
      namespace: "Foo",
      accessibility: "public",
      summary: "VisualNode",

      externalInheritance: [
        {
          type: {
            kind: "named",
            name: "System.Object",
          },
        },
        {
          type: {
            kind: "named",
            name: "AvaloniaObject",
          },
        },
      ],

      base: {
        type: {
          kind: "named",
          name: "Visual",
        },
      },
    })

    assert.deepEqual(
      chain.map(x => x.type.kind === "named"
        ? x.type.name
        : ""),
      [
        "System.Object",
        "AvaloniaObject",
        "Visual",
      ],
    )
  })

  it("returns only base when externalInheritance is absent", () => {

    const chain = getInheritanceChain({
      id: "T:Foo.Bar",
      type: "class",
      name: "Foo.Bar",
      namespace: "Foo",
      accessibility: "public",
      summary: "Bar",

      base: {
        type: {
          kind: "named",
          name: "Foo.Base",
        },
      },
    })

    assert.equal(chain.length, 1)
    assert.equal(
      chain[0].type.kind === "named"
        ? chain[0].type.name
        : "",
      "Foo.Base",
    )
  })

  it("returns empty chain when no inheritance exists", () => {

    const chain = getInheritanceChain({
      id: "T:Foo.Bar",
      type: "class",
      name: "Foo.Bar",
      namespace: "Foo",
      accessibility: "public",
      summary: "Bar",
    })

    assert.deepEqual(chain, [])
  })
})