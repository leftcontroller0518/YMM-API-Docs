import { describe, it } from "node:test"
import {buildSymbolIndex} from "@/lib/api-docs/symbol-index";
import {resolveTypeLink} from "@/lib/api-docs/resolve-type-link";
import assert from "node:assert/strict"
import {getChildNamespaces} from "@/lib/api-docs/get-child-namespaces";
import {getTypesInNamespace} from "@/lib/api-docs/get-types-in-namespace";

describe("Resolve type linking", () => {
  it("resolves known type", () => {

    const index = buildSymbolIndex([
      {
        id: "T:Foo.Bar",
        type: "class",
        name: "Foo.Bar",
        namespace: "Foo",
        accessibility: "public",
        summary: "Bar",
      },
    ])

    const result = resolveTypeLink(
      {
        type: {
          kind: "named",
          name: "Foo.Bar",
        },
      },
      index,
    )

    assert.deepEqual(result, {
      text: "Foo.Bar",
      url: "/reference/T%3AFoo.Bar",
    })
  })
  it("returns plain text when unresolved", () => {

    const index = buildSymbolIndex([])

    const result = resolveTypeLink(
      {
        type: {
          kind: "named",
          name: "System.String",
        },
      },
      index,
    )

    assert.deepEqual(result, {
      text: "System.String",
    })
  })
  it("does not resolve generic parameter", () => {

    const index = buildSymbolIndex([])

    const result = resolveTypeLink(
      {
        type: {
          kind: "genericParameter",
          name: "T",
        },
      },
      index,
    )

    assert.deepEqual(result, {
      text: "T",
    })
  })
  it("collects child namespaces", () => {

    const index = buildSymbolIndex([
      {
        id: "N:Foo",
        type: "namespace",
        name: "Foo",
        summary: "Foo",
      },
      {
        id: "N:Foo.Bar",
        type: "namespace",
        name: "Foo.Bar",
        namespace: "Foo",
        summary: "Bar",
      },
      {
        id: "N:Foo.Baz",
        type: "namespace",
        name: "Foo.Baz",
        namespace: "Foo",
        summary: "Baz",
      },
    ])

    const result = getChildNamespaces(
      index,
      "Foo",
    )

    assert.equal(result.length, 2)
  })
  it("collects types in namespace", () => {

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
      {
        id: "M:Foo.Bar.Run()",
        type: "method",
        name: "Run",
        namespace: "Foo",
        accessibility: "public",
        summary: "Run",
        declaringType: {
          id: "T:Foo.Bar",
        },
        returns: {
          type: {
            kind: "named",
            name: "System.Void",
          },
        },
      },
    ])

    const result = getTypesInNamespace(
      index,
      "Foo",
    )

    assert.equal(result.length, 1)
  })
})