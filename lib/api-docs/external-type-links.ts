import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import type { ExternalTypeLinks } from "./resolve-type-link"

export function loadExternalTypeLinks(): ExternalTypeLinks {

  const filePath = path.join(
    process.cwd(),
    "config",
    "external-type-links.yaml",
  )

  const raw = fs.readFileSync(filePath, "utf-8")
  const parsed = yaml.load(raw)

  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
  ) {
    throw new Error("external-type-links.yaml の形式が不正です")
  }

  const map = new Map<string, string>()

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(
        `external-type-links.yaml: キー "${key}" の値が文字列ではありません`,
      )
    }
    map.set(key, value)
  }

  return map
}