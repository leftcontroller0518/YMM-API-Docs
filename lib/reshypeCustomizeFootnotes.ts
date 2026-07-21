import { visit } from "unist-util-visit"
import { h } from "hastscript"

export function rehypeCustomizeFootnotes() {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (
        node.tagName === "section" &&
        node.properties?.dataFootnotes !== undefined
      ) {
        node.children = node.children.filter(
          (child: any) =>
            !(
              child.type === "element" &&
              child.tagName === "h2"
            )
        )

        node.children.unshift(
          h("p", { className: ["text-xl font-semibold mt-8 mb-4"] }, "注釈")
        )
        node.children.unshift(
          h("hr")
        )
      }
    })
  }
}