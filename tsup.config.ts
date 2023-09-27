import { defineConfig } from "tsup"

export default defineConfig({
  dts: true,
  entry: ["src/**"],
  format: ["cjs", "esm"],
})
