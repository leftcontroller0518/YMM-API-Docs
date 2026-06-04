import type { TupleElement, TypeNode, TypeNodeValue } from "./type-node"

export function renderTypeNode(node: TypeNode): string {
  const base = renderTypeNodeValue(node.type)
  const withGenerics = renderGenericArguments(base, node.genericArguments)
  return node.nullable ? `${withGenerics}?` : withGenerics
}

function renderTypeNodeValue(value: TypeNodeValue): string {
  switch (value.kind) {
    case "named":
      return value.name

    case "genericParameter":
      return value.name

    case "array":
      return `${renderTypeNode(value.elementType)}[]`

    case "tuple":
      return renderTuple(value.elements)
  }
}

function renderGenericArguments(base: string, args: TypeNode[] | undefined): string {
  if (args === undefined || args.length === 0) return base
  return `${base}<${args.map(renderTypeNode).join(", ")}>`
}

function renderTuple(elements: TupleElement[]): string {
  const inner = elements.map(el => {
    const rendered = renderTypeNode(el)
    return el.name !== undefined ? `${el.name}: ${rendered}` : rendered
  })
  return `(${inner.join(", ")})`
}