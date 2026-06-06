import { z } from "zod"

export const ApiDocumentTypeSchema = z.enum([
  "namespace", "class", "interface", "struct", "enum",
  "delegate", "method", "property", "field", "event",
])

export const AccessibilitySchema = z.enum([
  "public", "protected", "internal", "private", "protected internal",
])

export const SymbolIdSchema = z.string().regex(/^[NTMPFED]:\S[\s\S]*$/)

export type ApiDocumentType = z.infer<typeof ApiDocumentTypeSchema>
export type Accessibility = z.infer<typeof AccessibilitySchema>
export type SymbolId = z.infer<typeof SymbolIdSchema>

export {
  TypeNodeSchema, TypeNodeValueSchema, TypeReferenceSchema,
  TypeReferenceValueSchema, TupleElementSchema,
} from "./type-node"

export type {
  ArrayTypeNode, NamedTypeNode, TupleElement, TupleTypeNode,
  TypeNode, TypeNodeValue, TypeReference, TypeReferenceValue,
} from "./type-node"

import { TypeNodeSchema, TypeReferenceSchema } from "./type-node"

export const DeclaringTypeSchema = z.object({ id: SymbolIdSchema }).strict()

export const ParameterModifierSchema = z.enum(["ref", "out", "in"])

export const ParameterSchema = z
  .object({
    name: z.string().min(1),
    modifier: ParameterModifierSchema.optional(),
    type: TypeNodeSchema,
  })
  .strict()

const GenericParametersSchema = z.array(z.string().min(1)).min(1)

export const ApiDocumentBaseSchema = z
  .object({
    id: SymbolIdSchema,
    type: ApiDocumentTypeSchema,
    name: z.string().min(1),
    namespace: z.string().min(1).optional(),
    summary: z.string().min(1),
    assembly: z.string().min(1).optional(),
    since: z.union([z.string().min(1), z.number()]).optional(),
    obsolete: z.union([z.string().min(1), z.number()]).optional(),
    accessibility: AccessibilitySchema.optional(),
    remarks: z.string().optional(),
    examples: z.string().optional(),
  })
  .strict()

const NamespaceDocumentSchemaBase = ApiDocumentBaseSchema
  .omit({ accessibility: true })
  .extend({
    id: z.string().regex(/^N:\S[\s\S]*$/),
    type: z.literal("namespace"),
    namespace: z.string().min(1).optional(),
  })

export const NamespaceDocumentSchema = NamespaceDocumentSchemaBase
  .superRefine((doc, ctx) => {
    if (doc.name !== doc.id.slice(2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "namespace の name は id から 'N:' を除いた文字列と一致しなければならない",
      })
    }

    if (doc.namespace === doc.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "namespace の namespace フィールドに自己参照は禁止",
      })
    }
  })

const TypeDocumentBaseSchema = ApiDocumentBaseSchema.extend({
  id: z.string().regex(/^T:\S[\s\S]*$/),
  type: z.enum(["class", "interface", "struct", "enum"]),
  namespace: z.string().min(1),
  genericParameters: GenericParametersSchema.optional(),
  base: TypeReferenceSchema.optional(),
  externalInheritance: z.array(TypeReferenceSchema).min(1).optional(),
  implements: z.array(TypeReferenceSchema).min(1).optional(),
  code: z.string().optional(),
})

export const ClassDocumentSchema = TypeDocumentBaseSchema.extend({ type: z.literal("class") })
export const InterfaceDocumentSchema = TypeDocumentBaseSchema.extend({ type: z.literal("interface") })
export const StructDocumentSchema = TypeDocumentBaseSchema.extend({ type: z.literal("struct") })
export const EnumDocumentSchema = TypeDocumentBaseSchema.extend({ type: z.literal("enum") })

export const DelegateDocumentSchema = ApiDocumentBaseSchema.extend({
  id: z.string().regex(/^D:\S[\s\S]*$/),
  type: z.literal("delegate"),
  namespace: z.string().min(1),
  genericParameters: GenericParametersSchema.optional(),
  parameters: z.array(ParameterSchema).min(1).optional(),
  returns: TypeReferenceSchema,
  code: z.string().optional(),
})

const MemberDocumentBaseSchema = ApiDocumentBaseSchema.extend({
  namespace: z.string().min(1),
  declaringType: DeclaringTypeSchema,
  code: z.string().optional(),
})

export const MethodDocumentSchema = MemberDocumentBaseSchema.extend({
  id: z.string().regex(/^M:\S[\s\S]*$/),
  type: z.literal("method"),
  genericParameters: GenericParametersSchema.optional(),
  parameters: z.array(ParameterSchema).min(1).optional(),
  returns: TypeReferenceSchema,
})

export const PropertyDocumentSchema = MemberDocumentBaseSchema.extend({
  id: z.string().regex(/^P:\S[\s\S]*$/),
  type: z.literal("property"),
  propertyType: TypeReferenceSchema.optional(),
})

export const FieldDocumentSchema = MemberDocumentBaseSchema.extend({
  id: z.string().regex(/^F:\S[\s\S]*$/),
  type: z.literal("field"),
  fieldType: TypeReferenceSchema.optional(),
})

export const EventDocumentSchema = MemberDocumentBaseSchema.extend({
  id: z.string().regex(/^E:\S[\s\S]*$/),
  type: z.literal("event"),
  eventType: TypeReferenceSchema.optional(),
})

export const ApiYamlDocumentV1Schema = z
  .discriminatedUnion("type", [
    NamespaceDocumentSchemaBase,  // ZodObject のまま渡す
    ClassDocumentSchema,
    InterfaceDocumentSchema,
    StructDocumentSchema,
    EnumDocumentSchema,
    DelegateDocumentSchema,
    MethodDocumentSchema,
    PropertyDocumentSchema,
    FieldDocumentSchema,
    EventDocumentSchema,
  ])
  .superRefine((doc, ctx) => {
    if (doc.type !== "namespace") return

    if (doc.name !== doc.id.slice(2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "namespace の name は id から 'N:' を除いた文字列と一致しなければならない",
      })
    }

    if (doc.namespace === doc.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "namespace の namespace フィールドに自己参照は禁止",
      })
    }
  })

export type Parameter = z.infer<typeof ParameterSchema>
export type ApiYamlDocumentV1 = z.infer<typeof ApiYamlDocumentV1Schema>
export type NamespaceDocument = z.infer<typeof NamespaceDocumentSchema>
export type ClassDocument = z.infer<typeof ClassDocumentSchema>
export type InterfaceDocument = z.infer<typeof InterfaceDocumentSchema>
export type StructDocument = z.infer<typeof StructDocumentSchema>
export type EnumDocument = z.infer<typeof EnumDocumentSchema>
export type DelegateDocument = z.infer<typeof DelegateDocumentSchema>
export type MethodDocument = z.infer<typeof MethodDocumentSchema>
export type PropertyDocument = z.infer<typeof PropertyDocumentSchema>
export type FieldDocument = z.infer<typeof FieldDocumentSchema>
export type EventDocument = z.infer<typeof EventDocumentSchema>
