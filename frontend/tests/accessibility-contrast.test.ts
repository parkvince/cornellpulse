import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import test from "node:test"

function luminance(hex: string): number {
  const channels = hex.match(/[0-9a-f]{2}/gi)?.map(value => Number.parseInt(value, 16) / 255) ?? []
  const linear = channels.map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(foreground: string, background = "ffffff"): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

function sourceFiles(directory: URL): URL[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory)
    return entry.isDirectory() ? sourceFiles(child) : /\.(css|ts|tsx)$/.test(entry.name) && statSync(child).isFile() ? [child] : []
  })
}

test("primary text palette meets WCAG AA against white", () => {
  for (const color of ["C83C42", "A9461E", "007A70", "717171", "595959", "222222"]) {
    assert.ok(contrast(color) >= 4.5, `#${color} should meet 4.5:1 against white`)
  }
})

test("known legacy low-contrast text colors do not return", () => {
  const source = sourceFiles(new URL("../src/", import.meta.url)).map(file => readFileSync(file, "utf8")).join("\n")
  assert.doesNotMatch(source, /#(?:b0b0b0|aaa(?:aaa)?|888(?:888)?|999(?:999)?|ff5a5f|fc642d|00a699)\b/i)
})
