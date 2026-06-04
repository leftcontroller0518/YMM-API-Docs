import { z } from "zod"

export type TypeNode = {
  type: TypeNodeValue
  nullable?: boolean
  genericArguments?: TypeNode[]
}

export type TypeNodeValue =
  | NamedTypeNode
  | ArrayTypeNode
  | TupleTypeNode

export type NamedTypeNode = {
  kind: "named"
  name: string
}

export type ArrayTypeNode = {
  kind: "array"
  elementType: TypeNode
}

export type TupleTypeNode = {
  kind: "tuple"
  elements: TupleElement[]
}

export type TupleElement = TypeNode & {
  name?: string
}

export const TypeNodeSchema: z.ZodType<TypeNode> = z.lazy(() =>
  z
    .object({
      type: TypeNodeValueSchema,
      nullable: z.boolean().optional(),
      genericArguments: z.array(TypeNodeSchema).optional(),
    })
    .strict(),
)

export const TupleElementSchema: z.ZodType<TupleElement> = z.lazy(() =>
  z
    .object({
      name: z.string().min(1).optional(),
      type: TypeNodeValueSchema,
      nullable: z.boolean().optional(),
      genericArguments: z.array(TypeNodeSchema).optional(),
    })
    .strict(),
)

export const TypeNodeValueSchema: z.ZodType<TypeNodeValue> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z
      .object({
        kind: z.literal("named"),
        name: z.string().min(1),
      })
      .strict(),
    z
      .object({
        kind: z.literal("array"),
        elementType: TypeNodeSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("tuple"),
        elements: z.array(TupleElementSchema).min(1),
      })
      .strict(),
  ]),
)

export const TypeReferenceSchema = TypeNodeSchema
export const TypeReferenceValueSchema = TypeNodeValueSchema

export type TypeReference = TypeNode
export type TypeReferenceValue = TypeNodeValue
