import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {buildSymbolIndex} from "@/lib/api-docs/symbol-index";
import {buildNamespacePageModel, NamespaceNotFoundError} from "@/lib/api-docs/build-namespace-page-model";

describe("build view model of the page", () => {
  it("builds namespace page model", () => {

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
        id: "T:Foo.Class1",
        type: "class",
        name: "Foo.Class1",
        namespace: "Foo",
        accessibility: "public",
        summary: "Class1",
      },

      {
        id: "T:Foo.Interface1",
        type: "interface",
        name: "Foo.Interface1",
        namespace: "Foo",
        accessibility: "public",
        summary: "Interface1",
      },
    ])

    const model =
      buildNamespacePageModel(
        index,
        "Foo",
      )

    assert.equal(model.children.length, 1)
    assert.equal(model.classes.length, 1)
    assert.equal(model.interfaces.length, 1)
  })
  it("throws when namespace not found", () => {

    const index = buildSymbolIndex([])

    assert.throws(
      () =>
        buildNamespacePageModel(
          index,
          "Foo",
        ),
      NamespaceNotFoundError,
    )
  })
  it("groups type kinds", () => {

    const index = buildSymbolIndex([
      {
        id: "N:Foo",
        type: "namespace",
        name: "Foo",
        summary: "Foo",
      },

      {
        id: "T:Foo.MyStruct",
        type: "struct",
        name: "Foo.MyStruct",
        namespace: "Foo",
        accessibility: "public",
        summary: "MyStruct",
      },

      {
        id: "T:Foo.MyEnum",
        type: "enum",
        name: "Foo.MyEnum",
        namespace: "Foo",
        accessibility: "public",
        summary: "MyEnum",
      },

      {
        id: "D:Foo.MyDelegate",
        type: "delegate",
        name: "Foo.MyDelegate",
        namespace: "Foo",
        accessibility: "public",
        summary: "MyDelegate",
        returns: {
          type: {
            kind: "named",
            name: "System.Void",
          },
        },
      },
    ])

    const model =
      buildNamespacePageModel(
        index,
        "Foo",
      )

    assert.equal(model.structs.length, 1)
    assert.equal(model.enums.length, 1)
    assert.equal(model.delegates.length, 1)
  })
})