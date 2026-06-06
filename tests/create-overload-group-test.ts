import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {buildSymbolIndex} from "@/lib/api-docs/symbol-index";
import {buildOverloadIndex, getOverloadGroup, getOverloadGroupKey} from "@/lib/api-docs/overload-group";
import {ApiYamlDocumentV1} from "@/lib/api-docs/yaml-v1-schema";

describe("Create Overload Group", () => {
  it("creates one group from one method", () => {

    const index = buildSymbolIndex([
      {
        id: "M:Foo.Bar.Process()",
        type: "method",
        name: "Process",
        namespace: "Foo",
        accessibility: "public",
        summary: "Process",
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

    const overloads =
      buildOverloadIndex(index)

    assert.equal(
      overloads.groups.size,
      1,
    )
  })
  it("groups overloads by declaringType and name", () => {

    const index = buildSymbolIndex([
      createMethod(
        "M:Foo.Bar.Process(System.Int32)",
        "Process",
        "T:Foo.Bar",
      ),
      createMethod(
        "M:Foo.Bar.Process(System.String)",
        "Process",
        "T:Foo.Bar",
      ),
    ])

    const overloads =
      buildOverloadIndex(index)

    assert.equal(
      overloads.groups.size,
      1,
    )

    const group =
      [...overloads.groups.values()][0]

    assert.equal(group.length, 2)
  })
  it("does not group different method names", () => {

    const index = buildSymbolIndex([
      createMethod(
        "M:Foo.Bar.Process()",
        "Process",
        "T:Foo.Bar",
      ),
      createMethod(
        "M:Foo.Bar.Save()",
        "Save",
        "T:Foo.Bar",
      ),
    ])

    const overloads =
      buildOverloadIndex(index)

    assert.equal(
      overloads.groups.size,
      2,
    )
  })
  it("does not group methods from different types", () => {

    const index = buildSymbolIndex([
      createMethod(
        "M:Foo.Bar.Process()",
        "Process",
        "T:Foo.Bar",
      ),
      createMethod(
        "M:Foo.Baz.Process()",
        "Process",
        "T:Foo.Baz",
      ),
    ])

    const overloads =
      buildOverloadIndex(index)

    assert.equal(
      overloads.groups.size,
      2,
    )
  })
  it("ignores non-method documents", () => {

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

    const overloads =
      buildOverloadIndex(index)

    assert.equal(
      overloads.groups.size,
      0,
    )
  })
  it("ignores properties", () => {

    const index = buildSymbolIndex([
      {
        id: "P:Foo.Bar.Value",
        type: "property",
        name: "Value",
        namespace: "Foo",
        accessibility: "public",
        summary: "Value",
        declaringType: {
          id: "T:Foo.Bar",
        },
      },
    ])

    const overloads =
      buildOverloadIndex(index)

    assert.equal(
      overloads.groups.size,
      0,
    )
  })
  it("builds overload group key", () => {

    const key =
      getOverloadGroupKey(
        createMethod(
          "M:Foo.Bar.Process()",
          "Process",
          "T:Foo.Bar",
        ),
      )

    assert.equal(
      key,
      "T:Foo.Bar::Process",
    )
  })
  it("returns overload group", () => {

    const process1 =
      createMethod(
        "M:Foo.Bar.Process(System.Int32)",
        "Process",
        "T:Foo.Bar",
      )

    const process2 =
      createMethod(
        "M:Foo.Bar.Process(System.String)",
        "Process",
        "T:Foo.Bar",
      )

    const index =
      buildSymbolIndex([
        process1,
        process2,
      ])

    const overloads =
      buildOverloadIndex(index)

    const group =
      getOverloadGroup(
        overloads,
        process1,
      )

    assert.equal(group.length, 2)
  })
  it("returns empty array when group does not exist", () => {

    const overloads = {
      groups: new Map(),
    }

    const group =
      getOverloadGroup(
        overloads,
        createMethod(
          "M:Foo.Bar.Process()",
          "Process",
          "T:Foo.Bar",
        ),
      )

    assert.deepEqual(group, [])
  })
})

function createMethod(
  id: string,
  name: string,
  declaringTypeId: string,
): ApiYamlDocumentV1 {
  return {
    id,
    type: "method",
    name,
    namespace: "Foo",
    accessibility: "public",
    summary: name,
    declaringType: {
      id: declaringTypeId,
    },
    returns: {
      type: {
        kind: "named",
        name: "System.Void",
      },
    },
  }
}