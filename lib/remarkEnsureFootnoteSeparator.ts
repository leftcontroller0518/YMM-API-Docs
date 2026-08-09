export function remarkEnsureFootnoteSeparator() {
  return (tree: any) => {
    const children = tree.children

    if (!Array.isArray(children)) {
      return
    }

    const firstFootnoteIndex = children.findIndex(
      (child: any) =>
        child.type === "footnoteDefinition"
    )

    if (firstFootnoteIndex === -1) {
      return
    }

    const previous = children[firstFootnoteIndex - 1]

    if (
      !previous ||
      previous.type !== "thematicBreak"
    ) {
      children.splice(firstFootnoteIndex, 0, {
        type: "thematicBreak",
        children: []
      })
    }
  }
}