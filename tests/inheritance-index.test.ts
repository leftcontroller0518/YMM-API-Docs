import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildInheritanceIndex,
  getDerivedTypes,
  getImplementedBy,
} from "@/lib/api-docs/inheritance-index"

describe("InheritanceIndex", () => {

  it("indexes derived types", () => {

    const inheritance =
      buildInheritanceIndex({
        byId: new Map([
          [
            "T:VideoNode",
            {
              id: "T:VideoNode",
              type: "class",
              name: "VideoNode",
              namespace: "Foo",
              accessibility: "public",
              summary: "VideoNode",
              base: {
                type: {
                  kind: "named",
                  name: "NodeBase",
                },
              },
            },
          ],
          [
            "T:AudioNode",
            {
              id: "T:AudioNode",
              type: "class",
              name: "AudioNode",
              namespace: "Foo",
              accessibility: "public",
              summary: "AudioNode",
              base: {
                type: {
                  kind: "named",
                  name: "NodeBase",
                },
              },
            },
          ],
        ]),
      })

    const derived =
      getDerivedTypes(
        inheritance,
        "NodeBase",
      )

    assert.equal(derived.length, 2)
    assert.equal(derived[0].name, "AudioNode")
    assert.equal(derived[1].name, "VideoNode")
  })

  it("indexes implemented interfaces", () => {

    const inheritance =
      buildInheritanceIndex({
        byId: new Map([
          [
            "T:VideoNode",
            {
              id: "T:VideoNode",
              type: "class",
              name: "VideoNode",
              namespace: "Foo",
              accessibility: "public",
              summary: "VideoNode",
              implements: [
                {
                  type: {
                    kind: "named",
                    name: "System.IDisposable",
                  },
                },
              ],
            },
          ],
          [
            "T:AudioNode",
            {
              id: "T:AudioNode",
              type: "class",
              name: "AudioNode",
              namespace: "Foo",
              accessibility: "public",
              summary: "AudioNode",
              implements: [
                {
                  type: {
                    kind: "named",
                    name: "System.IDisposable",
                  },
                },
              ],
            },
          ],
        ]),
      })

    const implemented =
      getImplementedBy(
        inheritance,
        "System.IDisposable",
      )

    assert.equal(implemented.length, 2)
    assert.equal(implemented[0].name, "AudioNode")
    assert.equal(implemented[1].name, "VideoNode")
  })

  it("indexes multiple interfaces", () => {

    const inheritance =
      buildInheritanceIndex({
        byId: new Map([
          [
            "T:VideoNode",
            {
              id: "T:VideoNode",
              type: "class",
              name: "VideoNode",
              namespace: "Foo",
              accessibility: "public",
              summary: "VideoNode",
              implements: [
                {
                  type: {
                    kind: "named",
                    name: "System.IDisposable",
                  },
                },
                {
                  type: {
                    kind: "named",
                    name: "IVideoNode",
                  },
                },
              ],
            },
          ],
        ]),
      })

    assert.equal(
      getImplementedBy(
        inheritance,
        "System.IDisposable",
      ).length,
      1,
    )

    assert.equal(
      getImplementedBy(
        inheritance,
        "IVideoNode",
      ).length,
      1,
    )
  })

  it("ignores documents without base", () => {

    const inheritance =
      buildInheritanceIndex({
        byId: new Map([
          [
            "T:VideoNode",
            {
              id: "T:VideoNode",
              type: "class",
              name: "VideoNode",
              namespace: "Foo",
              accessibility: "public",
              summary: "VideoNode",
            },
          ],
        ]),
      })

    const derived =
      getDerivedTypes(
        inheritance,
        "NodeBase",
      )

    assert.equal(derived.length, 0)
  })
})