import assert from "node:assert/strict"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"

import { buildLocalRecommendation, type QualifiedResourceOption } from "../src/checkin/localRecommendations.ts"
import { bookingHref, directionsHref, prepareResultOptions, saveLocalPlan } from "../src/checkin/resultPlan.ts"
import ResultCard from "../src/components/checkin/ResultCard.tsx"
import { getResource, type ResourceRecord } from "../src/resources/registry.ts"

function renderResult(result: ReturnType<typeof buildLocalRecommendation>, online = true) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ResultCard result={result} moodScore={6} triggers={[]} wantsToTalk={false} checkinId="test-checkin" aggregateNotice="No aggregate contribution was sent." onRestart={() => {}} onDelete={() => {}} onlineOverride={online} />
    </MemoryRouter>,
  )
}

test("crisis results stay separate and offer three qualified immediate pathways", () => {
  const result = buildLocalRecommendation({ mood: 6, sleep: "6_to_8", workload: "moderate", triggers: [], wantsToTalk: false, freeText: "I am going to kill myself" })
  const html = renderResult(result)
  assert.equal(result.safety.signal, "urgent")
  assert.equal(result.recommendation.options.length, 3)
  assert.match(html, /separate crisis pathways/)
  assert.match(html, /911 emergency response/)
  assert.match(html, /988 Suicide &amp; Crisis Lifeline/)
  assert.match(html, /Cornell Health 24\/7 phone consultation/)
  assert.equal((html.match(/Why it may fit:/g) || []).length, 3)
})

test("non-crisis results provide two to three reasons without best-match certainty", () => {
  const result = buildLocalRecommendation({ mood: 6, sleep: "6_to_8", workload: "heavy", triggers: ["academics"], wantsToTalk: false, freeText: "" })
  const html = renderResult(result)
  assert.equal(result.safety.signal, "none")
  assert.equal(result.recommendation.options.length, 3)
  assert.deepEqual(result.recommendation.options.map(option => option.resource.id), ["learning_strategies", "lets_talk", "caps_access"])
  assert.match(html, /Choose a next step that feels workable/)
  assert.equal(/best match/i.test(html), false)
  assert.equal((html.match(/Why it may fit:/g) || []).length, 3)
})

test("offline results retain local and phone actions while disabling web actions", () => {
  const result = buildLocalRecommendation({ mood: 5, sleep: "6_to_8", workload: "moderate", triggers: ["loneliness"], wantsToTalk: true, freeText: "" })
  const html = renderResult(result, false)
  assert.match(html, /You’re offline/)
  assert.match(html, /aria-disabled="true"/)
  assert.match(html, /Official website/)
  assert.match(html, /Choose this as my next step/)
})

test("malformed resources are rejected without hiding valid options", () => {
  const valid: QualifiedResourceOption = { resource: getResource("ears"), why: "May fit for informal peer listening." }
  const malformed = { resource: { id: "broken", officialName: "" } as ResourceRecord, why: "Incomplete record" }
  const prepared = prepareResultOptions([malformed, valid])
  assert.deepEqual(prepared.map(option => option.resource.id), ["ears"])
})

test("no-result state directs users to verified resources and crisis contacts", () => {
  const result = buildLocalRecommendation({ mood: 7, sleep: "6_to_8", workload: "moderate", triggers: [], wantsToTalk: false, freeText: "" })
  result.recommendation.options = []
  const html = renderResult(result)
  assert.match(html, /No verified result options are available/)
  assert.match(html, /Browse verified resources/)
  assert.match(html, /Call 988/)
})

test("save plan writes only the explicitly selected local summary", () => {
  const values = new Map<string, string>()
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }
  const saved = saveLocalPlan("checkin-1", 6, getResource("caps_access"), storage, new Date("2026-08-02T12:00:00Z"))
  assert.deepEqual(saved, { id: "checkin-1", date: "2026-08-02T12:00:00.000Z", mood: 6, resource: "Cornell Health CAPS access appointment", resourceId: "caps_access", status: "saved", updatedAt: "2026-08-02T12:00:00.000Z" })
  assert.deepEqual(JSON.parse(values.get("cornellpulse_history") || "[]"), [saved])
  assert.equal(JSON.stringify(saved).includes("freeText"), false)
})

test("resource-specific actions appear only when supported", () => {
  assert.equal(bookingHref(getResource("caps_access")), getResource("caps_access").url)
  assert.equal(bookingHref(getResource("ears")), undefined)
  assert.match(directionsHref(getResource("caps_access")) || "", /^https:\/\/www\.google\.com\/maps\/search/)
  assert.equal(directionsHref(getResource("cornell_health_247")), undefined)
})
