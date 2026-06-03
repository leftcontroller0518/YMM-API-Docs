import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { TypeNodeSchema } from "../lib/api-docs/type-node"

describe("TypeNodeSchema", () => {
  it("accepts named type nodes", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "named",
        name: "System.String",
      },
    })

    assert.equal(result.success, true)
  })

  it("accepts nullable named type nodes", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "named",
        name: "System.String",
      },
      nullable: true,
    })

    assert.equal(result.success, true)
  })

  it("accepts generic arguments", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "named",
        name: "System.Threading.Tasks.Task",
      },
      genericArguments: [
        {
          type: {
            kind: "named",
            name: "YukkuriMovieMaker.FrameBuffer",
          },
        },
      ],
    })

    assert.equal(result.success, true)
  })

  it("accepts nested generic arguments", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "named",
        name: "System.Collections.Generic.Dictionary",
      },
      genericArguments: [
        {
          type: {
            kind: "named",
            name: "System.String",
          },
        },
        {
          type: {
            kind: "named",
            name: "System.Collections.Generic.List",
          },
          genericArguments: [
            {
              type: {
                kind: "named",
                name: "YukkuriMovieMaker.FrameBuffer",
              },
            },
          ],
        },
      ],
    })

    assert.equal(result.success, true)
  })

  it("accepts array type nodes", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "array",
        elementType: {
          type: {
            kind: "named",
            name: "YukkuriMovieMaker.FrameBuffer",
          },
        },
      },
    })

    assert.equal(result.success, true)
  })

  it("accepts tuple type nodes", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "tuple",
        elements: [
          {
            name: "name",
            type: {
              kind: "named",
              name: "System.String",
            },
          },
          {
            name: "age",
            type: {
              kind: "named",
              name: "System.Int32",
            },
          },
        ],
      },
    })

    assert.equal(result.success, true)
  })

  it("rejects empty named type names", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "named",
        name: "",
      },
    })

    assert.equal(result.success, false)
  })

  it("rejects empty tuple elements", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "tuple",
        elements: [],
      },
    })

    assert.equal(result.success, false)
  })

  it("rejects unknown type node kinds", () => {
    const result = TypeNodeSchema.safeParse({
      type: {
        kind: "pointer",
        name: "System.String",
      },
    })

    assert.equal(result.success, false)
  })
})
