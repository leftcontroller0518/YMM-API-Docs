import { describe, it } from "node:test"
import assert from "node:assert/strict"
import * as fs from "fs"
import * as path from "path"
import * as yaml from "js-yaml"
import { ApiYamlDocumentV1Schema } from "@/lib/api-docs/yaml-v1-schema"

const samplesDir = path.join(__dirname, "samples")
const files = fs.readdirSync(samplesDir).filter(f => f.endsWith(".yaml"))

describe("YAML samples", () => {
  for (const file of files) {
    it(file, () => {
      const raw = fs.readFileSync(path.join(samplesDir, file), "utf-8")
      const parsed = yaml.load(raw)
      const result = ApiYamlDocumentV1Schema.safeParse(parsed)
      assert.ok(result.success, JSON.stringify(result.success ? null : result.error.format(), null, 2))
    })
  }
})