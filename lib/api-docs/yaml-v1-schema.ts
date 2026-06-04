import { z } from "zod"

export const ApiDocumentTypeSchema = z.enum([
  "namespace",
  "class",
  "interface",
  "struct",
  "enum",
  "delegate",
  "method",
  "property",
  "field",
  "event",
])

export const AccessibilitySchema = z.enum([
  "public",
  "protected",
  "internal",
  "private",
  "protected internal",
])

export const SymbolIdSchema = z.string().regex(/^[NTMPFED]:\S[\s\S]*$/)

export type ApiDocumentType = z.infer<typeof ApiDocumentTypeSchema>
export type Accessibility = z.infer<typeof AccessibilitySchema>
export type SymbolId = z.infer<typeof SymbolIdSchema>

export {
  TypeNodeSchema,
  TypeNodeValueSchema,
  TypeReferenceSchema,
  TypeReferenceValueSchema,
  TupleElementSchema,
} from "./type-node"

export type {
  ArrayTypeNode,
  NamedTypeNode,
  TupleElement,
  TupleTypeNode,
  TypeNode,
  TypeNodeValue,
  TypeReference,
  TypeReferenceValue,
} from "./type-node"

import { TypeNodeValueSchema, TypeReferenceSchema } from "./type-node"

export const DeclaringTypeSchema = z
  .object({
    id: SymbolIdSchema,
  })
  .strict()

export const ParameterModifierSchema = z.enum(["ref", "out", "in"])

export const ParameterSchema = z
  .object({
    name: z.string().min(1),
    modifier: ParameterModifierSchema.optional(),
    type: TypeNodeValueSchema,
    nullable: z.boolean().optional(),
    genericArguments: z.array(TypeReferenceSchema).optional(),
  })
  .strict()

export const ApiDocumentBaseSchema = z
  .object({
    id: SymbolIdSchema,
    type: ApiDocumentTypeSchema,
    name: z.string().min(1),
    namespace: z.string().min(1),
    summary: z.string().min(1),
    assembly: z.string().min(1).optional(),
    since: z.union([z.string().min(1), z.number()]).optional(),
    obsolete: z.union([z.string().min(1), z.number()]).optional(),
    accessibility: AccessibilitySchema.optional(),
    remarks: z.string().optional(),
    examples: z.string().optional(),
  })
  .strict()

export const NamespaceDocumentSchema = ApiDocumentBaseSchema.extend({
  id: z.string().regex(/^N:\S[\s\S]*$/),
  type: z.literal("namespace"),
})

const TypeDocumentBaseSchema = ApiDocumentBaseSchema.extend({
  id: z.string().regex(/^T:\S[\s\S]*$/),
  type: z.enum(["class", "interface", "struct", "enum"]),
  base: TypeReferenceSchema.optional(),
  externalInheritance: z.array(TypeReferenceSchema).optional(),
  implements: z.array(TypeReferenceSchema).optional(),
  code: z.string().optional(),
})

export const ClassDocumentSchema = TypeDocumentBaseSchema.extend({
  type: z.literal("class"),
})

export const InterfaceDocumentSchema = TypeDocumentBaseSchema.extend({
  type: z.literal("interface"),
})

export const StructDocumentSchema = TypeDocumentBaseSchema.extend({
  type: z.literal("struct"),
})

export const EnumDocumentSchema = TypeDocumentBaseSchema.extend({
  type: z.literal("enum"),
})

export const DelegateDocumentSchema = ApiDocumentBaseSchema.extend({
  id: z.string().regex(/^D:\S[\s\S]*$/),
  type: z.literal("delegate"),
  parameters: z.array(ParameterSchema).optional(),
  returns: TypeReferenceSchema.optional(),
  code: z.string().optional(),
})

const MemberDocumentBaseSchema = ApiDocumentBaseSchema.extend({
  declaringType: DeclaringTypeSchema,
  code: z.string().optional(),
})

export const MethodDocumentSchema = MemberDocumentBaseSchema.extend({
  id: z.string().regex(/^M:\S[\s\S]*$/),
  type: z.literal("method"),
  parameters: z.array(ParameterSchema).optional(),
  returns: TypeReferenceSchema.optional(),
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

export const ApiYamlDocumentV1Schema = z.discriminatedUnion("type", [
  NamespaceDocumentSchema,
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
