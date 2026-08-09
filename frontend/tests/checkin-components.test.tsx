import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import StepMood from "../src/components/checkin/StepMood.tsx"
import StepSleepWorkload from "../src/components/checkin/StepSleepWorkload.tsx"
import StepText from "../src/components/checkin/StepText.tsx"
import StepTrigger from "../src/components/checkin/StepTrigger.tsx"

function noop() {}

Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    getItem: () => null,
    setItem: noop,
    removeItem: noop,
  },
})

test("check-in starts without a default mood and exposes one labelled radio group", () => {
  const html = renderToStaticMarkup(<StepMood value={null} onChange={noop} onNext={noop} />)
  assert.equal((html.match(/type="radio"/g) || []).length, 10)
  assert.equal((html.match(/checked=""/g) || []).length, 0)
  assert.match(html, /<fieldset/)
  assert.match(html, /<legend/)
  assert.match(html, /Mood from 1/)
  assert.match(html, /Choose the number that feels closest/)
})

test("sleep and workload are separate native radio fieldsets", () => {
  const html = renderToStaticMarkup(<StepSleepWorkload sleep="6_to_8" onSleepChange={noop} workload="moderate" onWorkloadChange={noop} onNext={noop} onBack={noop} />)
  assert.equal((html.match(/<fieldset/g) || []).length, 2)
  assert.equal((html.match(/type="radio"/g) || []).length, 8)
  assert.equal((html.match(/checked=""/g) || []).length, 2)
  assert.match(html, /Sleep last night/)
  assert.match(html, /Academic workload/)
})

test("topic choices are checkboxes and talk preference is a radio choice", () => {
  const html = renderToStaticMarkup(<StepTrigger values={["academics", "sleep"]} onChange={noop} wantsToTalk={false} onWantsToTalkChange={noop} onNext={noop} onBack={noop} />)
  assert.equal((html.match(/type="checkbox"/g) || []).length, 13)
  assert.equal((html.match(/type="radio"/g) || []).length, 2)
  assert.equal((html.match(/checked=""/g) || []).length, 3)
  assert.match(html, /id="trigger-limit"/)
  assert.match(html, /role="status"/)
})

test("optional text has a programmatic label and no college control", () => {
  const html = renderToStaticMarkup(<StepText value="" onChange={noop} onSubmit={noop} onBack={noop} loading={false} error="" />)
  assert.match(html, /for="checkin-context"/)
  assert.match(html, /id="checkin-context"/)
  assert.doesNotMatch(html, /checkin-college/)
  assert.match(html, /never added to the saved draft/)
})

test("flow source exposes one non-clinical progress description", () => {
  const source = readFileSync(join(process.cwd(), "src", "components", "checkin", "CheckInFlow.tsx"), "utf8")
  assert.match(source, /role="progressbar"/)
  assert.match(source, /Part \{step\} of \{TOTAL_STEPS\}/)
  assert.equal(source.includes("% complete"), false)
  assert.equal(source.includes("Step {step} of"), false)
})
