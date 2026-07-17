# 🔴 QA Code Review — AI-Generated Test (Scenario 3: reversed roles)

**Reviewer:** Mateusz Klepacki · **Date:** 2026-07-17
**Target app:** jobs.ikea.com (Radancy) · **Stack:** Playwright / TypeScript
**Files under review:** `pages/JobsResultsPage.ts`, `tests/jobs-filter.spec.ts` (AI-generated)
**Process note:** findings 1–17 come from the initial review pass; findings P1–P3 and A1 were added after a self-review pass. Two errors made in the initial review are documented openly in the **Errata** section — review culture applies to reviews, too.

---

## 1. Context — checklist map (what was checked)

| Checklist category                | Status  | Quick note                                                                                                          |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| **POM correctness**               | 🔴 FAIL | Search page object missing; search logic lives in the test; fragile positional selector in `filterRegion`.          |
| **Test / PO separation**          | 🔴 FAIL | Raw selectors (`.search-keyword`, `.search-form__submit-button`, `.job-list__title`) used directly in the spec.     |
| **Naming (tests, methods, vars)** | 🟡 WEAK | `checkCountryFilter` misleads (action named as verification); `openFirstResult` is vague; test title lies (see P2). |
| **Locator quality**               | 🔴 FAIL | Hash-based dynamic ID; positional `nth-child`; class selectors where role/label locators exist.                     |
| **Assertion quality**             | 🔴 FAIL | Missing `await` on `expect`; conditional assertion that can silently skip; `try/catch` swallowing an assertion.     |
| **DRY**                           | 🟡 WEAK | Selectors duplicated across layers; `.first()` sprinkled without justification.                                     |
| **Hardcoded values**              | 🔴 FAIL | Full URL in the spec; `waitForTimeout(3000)`; test data inline.                                                     |
| **Stability / flakiness**         | 🔴 FAIL | Blind sleep; missing `await` on `.click()`; no consent-banner handling (see P1); no wait for post-filter state.     |
| **Maintainability / scalability** | 🟡 WEAK | No shared constants for the jobs domain; no doc comments on PO methods.                                             |

---

## 2. Rituals — evidence demanded before approval

Before any approval, the author must run these checks in the target environment and attach evidence (screenshot / log / console output). Locator claims are verified with data, not memory.

**Ritual 1 — dynamic ID (`resultsHeader`):**

```js
document.querySelectorAll("#search-results-heading-7bc40434ae").length;
document.querySelector("#search-results-heading-7bc40434ae")?.innerText;
```

> Does this ID survive a page refresh? Does the `7bc40434ae` hash change between builds/sessions? (Evidence from this project: analogous hashed IDs on this site have changed between visits.)

**Ritual 2 — positional filter selector (`filterRegion`)** _(corrected — see Errata E1)_:

```js
document.querySelectorAll("div.search-filters > div > section").length;
document.querySelectorAll("div.search-filters > div > section")[3]?.innerText; // is the 4th section really "Country/Region" today?
```

> How many filter sections exist, and is "Country/Region" guaranteed to stay 4th when a new filter is added?

**Ritual 3 — `waitForTimeout` as a flakiness source:** run the test 5× with `DEBUG=pw:api` and attach logs. Does `waitForTimeout(3000)` wait for anything real, or does it merely sleep?

**Ritual 4 — missing `await`:** run with `DEBUG=pw:api` and show whether `click()` in `openFirstResult()` is awaited, and whether `expect(page).toHaveURL(...)` resolves after the test already finished.

**Ritual 5 — uniqueness of raw selectors used in the spec:**

```js
document.querySelectorAll(".search-keyword").length;
document.querySelectorAll(".search-form__submit-button button").length;
```

> Are these unique? (Evidence from this project: `.search-keyword` matches **two** inputs on jobs.ikea.com — global nav search and hero search — a known strict-mode trap.) Can they be replaced with `getByRole` / `getByLabel`?

---

## 3. Findings — numbered, weighted, with reasoning and fix direction

### 1. 🔴 POM — missing search page object · _POM correctness_

**Observed:** the spec interacts with the search form directly (`.search-keyword`, `.search-form__submit-button`); the page object starts only at the results page.
**Why it matters:** any change to the search form forces edits in specs, not in one page object; search cannot be reused by other scenarios.
**Fix direction:** extract a search page object with a `searchForJob(query)`-style method; the spec should read as user steps only. _(Note: this repository already contains `JobsSearchPage` used by scenario 1 — reuse it instead of writing a new one.)_

### 2. 🔴 Locators — positional `nth-child` in `filterRegion` · _Locators / Stability_ _(diagnosis corrected — see Errata E1)_

**Observed:** `page.locator('div.search-filters > div > section:nth-child(4)')` — syntactically valid CSS (tag + class), likely working **today**.
**Why it matters:** `nth-child(4)` assumes the "Country/Region" filter section is 4th in the DOM _today_. When the vendor adds a new filter (e.g. "Remote work"), the order shifts and the test clicks a different section — potentially opening the wrong panel and checking the wrong checkbox, with no red failure that names the real cause. A **false green** waiting to happen.
**Fix direction:** select the section semantically — by its accessible name / heading text (e.g. a `section` that contains "Country/Region"), never by position among siblings.

### 3. 🔴 Locators — hash-based dynamic ID (`resultsHeader`) · _Stability_

**Observed:** `#search-results-heading-7bc40434ae` — a build/session-generated hash.
**Why it matters:** the ID changes with rebuilds/visits; the test turns red with zero functional change — a classic maintenance flake. This project has direct evidence: hashed IDs on this site differed between recon sessions and test runs.
**Fix direction:** role/text-based locator, e.g. `getByRole('heading', { name: /results/i })`.

### 4. 🔴 Naming — `checkCountryFilter`, `openFirstResult` · _Naming_

**Observed:** `checkCountryFilter` suggests verification but performs actions (click, check, wait); `openFirstResult` does not say what it opens.
**Why it matters:** readers must open the implementation to learn what a call does; names are the contract.
**Fix direction:** `filterResultsByCountry(country)`; `openFirstJobDetails()`. Action = verb describing the action; `expect...` prefix reserved for verifications.

### 5. 🔴 Separation — search logic inside the spec · _Test / PO separation_

**Observed:** `page.locator('.search-keyword').first().fill('Manager')` and the submit click live in the spec.
**Why it matters:** the spec should describe the user scenario, not element mechanics; duplication follows the moment a second test needs search.
**Fix direction:** move all form interaction into the page object; the spec keeps a single business call.

### 6. 🟡 Maintainability — hardcoded jobs URL, no shared constant · _(claim corrected — see Errata E2)_

**Observed:** `await page.goto('https://jobs.ikea.com/en/search-jobs')` — a full URL inline in the spec.
**Why it matters:** environment changes require editing specs. Note the nuance: the project's `baseURL` points at `www.ikea.com`, and `jobs.ikea.com` is a **different application** (Radancy) — so "use a relative path" is _not_ an applicable fix here.
**Fix direction:** either a named constant (e.g. `JOBS_SEARCH_URL`) in one place, or a separate Playwright project with its own `baseURL` for the jobs domain — an explicit configuration decision, not an inline string.

### 7. 🔴 Assertions — missing `await` on `expect(page).toHaveURL(...)` · _Hidden bug A_

**Observed:** `expect(page).toHaveURL(/job/);` — no `await`.
**Why it matters:** the web-first assertion returns a Promise; without `await` the test can finish before the assertion resolves — a **false positive**: the test passes even when the URL is wrong. This is the missing single word that makes the assertion never wait for its result.
**Proof idea:** point the flow at a broken URL — the test still passes.
**Fix direction:** `await` before every Playwright assertion, no exceptions.

### 8. 🔴 Assertions — `getResultsCount()` + `if (count > 0)` · _Hidden bug B_

**Observed:** `Number(text?.split(' ')[0])` yields `NaN` when the header is missing (`text` = `null`); in the spec, `if (count > 0) { expect(count).toBeGreaterThan(0); }` — `NaN > 0` is `false`, so the assertion is **silently skipped** and the test continues.
**Why it matters:** **the test passes on a broken page.** A conditional wrapped around an assertion converts "must hold" into "checked only when convenient" — the exact opposite of what a test is for. This is the most dangerous finding in the file.
**Proof idea:** remove/rename the header element — the test should go red but stays green.
**Fix direction:** guard inside the method (`expect(text).toBeTruthy()` before conversion, or throw a descriptive error) and an **unconditional** assertion in the spec: `expect(await resultsPage.getResultsCount()).toBeGreaterThan(0);` — an invariant, never an `if`.

### 9. 🔴 Assertions — `try/catch` around `expect` · _Anti-pattern_

**Observed:** `try { await expect(...).toContainText('Manager'); } catch (e) { console.log('Title check skipped'); }`
**Why it matters:** swallowing an assertion failure breaks the fundamental contract: a test must fail when the expected state does not hold. This produces a permanent false green with a friendly log line.
**Fix direction:** remove the `try/catch`. If the check is genuinely optional, use `expect.soft(...)` — failures are collected and reported without being silenced.

### 10. 🟡 Stability — click without confirming actionable state · _Stability_

**Observed:** `openFirstResult()` clicks with no visibility check on a positional selector.
**Why it matters:** the element may exist in DOM yet be hidden behind a loader/overlay; combined with finding 14 this becomes an untraceable race.
**Fix direction:** rely on Playwright auto-waiting **through an awaited click** (see 14) and a semantic locator; add an explicit `toBeVisible` checkpoint where the flow needs a synchronization point.

### 11. 🔴 DRY — selectors duplicated across layers · _DRY_

**Observed:** `.job-list__title` appears in both the PO and the spec; search selectors live in the spec although a page object layer exists.
**Why it matters:** one selector change requires edits in multiple files; the layer boundary stops meaning anything.
**Fix direction:** every selector lives in exactly one pocket in one class; specs call methods only.

### 12. 🔴 Hardcode — `waitForTimeout(3000)`, inline test data · _Hardcode_

**Observed:** a blind 3-second sleep in `checkCountryFilter`; `'Manager'`, `'Poland'` inline in the spec.
**Why it matters:** sleeps are simultaneously too short (flake) and too long (waste); inline data prevents parametrization.
**Fix direction:** replace the sleep with a state wait (e.g. `await expect(filterPanel).toBeVisible()`); lift test data into named constants above the describe block (project convention).

### 13. 🔴 Stability — `waitForTimeout` instead of a state wait · _Stability_

**Observed:** as above — the sleep does not check anything about the page.
**Why it matters:** if the filter opens in 500 ms the test wastes 2.5 s; if the page needs 4 s the next step fails with a misleading message. This sleep also **masks** finding 2: even a wrong section click "survives" thanks to the pause.
**Fix direction:** wait for the concrete post-condition of the click (panel visible / checkbox actionable), never for the clock.

### 14. 🔴 Stability — missing `await` on `.click()` in `openFirstResult` · _Stability_

**Observed:** `this.page.locator(...).first().click();` — the async method returns before the click completes.
**Why it matters:** the spec's `await openFirstResult()` awaits the _function_, not the _action_; navigation races the next assertion, and combined with finding 7 the failure is fully masked.
**Fix direction:** `await` the click.

### 15. 🔴 Stability — unawaited final assertion (stability angle of finding 7)

**Observed:** the last assertion of the test cannot fail the test.
**Why it matters:** the single most load-bearing checkpoint (did we reach the job details page?) is decorative.
**Fix direction:** as in 7 — and see P3 for why the regex itself is also too weak.

### 16. 🟡 Maintainability — no doc comments, no step comments · _(claim corrected — see Errata E2)_

**Observed:** the PO methods and the spec carry no business-step comments (project convention in scenarios 1–2: `// Step N: ...`), and non-obvious decisions are undocumented.
**Fix direction:** adopt the existing project conventions — step comments in specs, one-line rationale comments on non-obvious PO logic.

### 17. 🟢 Nit — `console.log('Title check skipped')`

**Observed:** debug logging committed inside a spec.
**Fix direction:** remove; local debugging belongs to local runs (`DEBUG=pw:api`), not to the repository.

---

## 4. Findings added after self-review (P-series and A1)

### P1. 🔴 Must — no consent-banner handling at all · _Stability / domain gotcha_

**Observed:** the spec opens `jobs.ikea.com` in a fresh context with no consent handling — no handler registration, no settle step. This repository already contains a battle-tested `CookieBanner` component (auto-accept handlers + a deterministic settle method), used successfully by scenarios 1 and 2 — and it is simply not wired in.
**Why it matters:** in a fresh context the consent dialog **always** appears and intercepts clicks (filter button, first result). This exact failure mode cost days of debugging in scenarios 1–2 of this project; leaving it unhandled guarantees flaky or falsely-failing runs.
**Fix direction:** integrate the existing component: instantiate `CookieBanner` in `beforeEach`, call `registerAutoAccept()` before navigation, and settle consent deterministically (`waitForJobsConsentSettled()`) after landing on the jobs domain, before touching filters. Do **not** duplicate banner logic in the spec.
**Meta-lesson (why the first pass missed it):** generic checklists are blind to what they do not list. A domain-specific gotcha list (section 6) is now part of my review template.

### P2. 🟡 Should — the test title lies · _Naming_

**Observed:** `test('user can search for jobs', ...)` — while the test filters by country, verifies the count, and opens a job's details.
**Why it matters:** the title is the contract read in CI reports at 3 a.m.; a lying title sends the reader to the wrong suspect. (Same pattern as finding M3 in this project's own PR #1 review — a known, previously-fixed class of defect.)
**Fix direction:** e.g. `'user can filter jobs by country and open the first result'`; or split into separate scenarios if search itself deserves its own test.

### P3. 🔴 Must — `/job/` regex is a limp checkpoint · _Assertions_

**Observed:** `expect(page).toHaveURL(/job/)` — even with `await` added, the results-page URL (`.../search-jobs...`) **also contains "job"**, so the assertion passes without any navigation to the details page.
**Why it matters:** the final checkpoint verifies nothing — a structural false positive independent of the missing `await`.
**Fix direction:** a regex the results page cannot satisfy, e.g. `/\/job\//`; optionally reinforce with a visible details-page element (h1 heading).

### A1. 🟡 Should — hidden assertion inside an action method · _Separation_

**Observed:** `checkCountryFilter` ends with `expect(this.page.locator('.job-list__title').first()).toBeVisible()` — an assertion on the results list, inside a filter action, on an element outside the method's responsibility.
**Why it matters:** project rule since the training framework: no hidden assertions inside actions. When this expect fails, the error points at the filter method while the real cause may be the results (e.g. zero jobs in Poland) — misleading triage. A wait-for-own-state (filter panel) would be acceptable; an assertion on a foreign element is not.
**Fix direction:** move the verification to the spec (or a dedicated `expect...` method on the results); the action method may wait for **its own** post-condition only.

---

## 5. The two hidden bugs — deep dive

**Hidden bug A — the missing `await` (finding 7/15):** in an async test, every Playwright assertion returns a Promise. Without `await`, the test function can resolve before the assertion does — the runner records a pass, and the assertion's failure (if any) lands nowhere. Classic false positive; reproducible by pointing the flow at a wrong URL.

**Hidden bug B — `NaN` + `if` (finding 8):** when the header is absent, `textContent()` → `null` → `Number(undefined)` → `NaN`; `NaN > 0` is `false`, so the _conditional_ assertion silently skips. The test then proceeds through an unawaited click (14) to an unawaited, too-weak final assertion (7 + P3) — three defects interlocking into a test that **passes on a broken page**. This chain is the strongest argument in this review: each defect alone is bad; together they form a green-painted hole.

---

## 6. Domain-specific gotchas — jobs.ikea.com (added to my review template)

| Gotcha                              | Symptom                                                                                                                          | How to detect                                                                                         | Protection                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Consent dialog (Radancy)**        | Always appears in a fresh context; intercepts clicks; accepting it mid-form **re-initializes form modules and wipes user input** | `intercepts pointer events` in call logs; inputs silently cleared (trace evidence from scenarios 1–2) | Register auto-accept handlers before navigation; settle consent deterministically before form interaction (existing `CookieBanner` component) |
| **Hash-suffixed IDs**               | `#...-7bc40434ae` changes between builds/sessions                                                                                | Compare IDs across two visits                                                                         | Role/label/text locators; stable BEM classes; `data-*` hooks                                                                                  |
| **Duplicate modules**               | Two search forms (`--global` / `--home`), two mindreader listboxes, duplicate Save buttons (styling variants)                    | `querySelectorAll(...).length` ritual — expected count: 1                                             | Anchor to a named container; `aria-controls` for combobox→listbox pairing                                                                     |
| **Positional filter sections**      | `nth-child(N)` breaks when a filter is added                                                                                     | Selector contains `nth-child`                                                                         | Select sections by accessible name / heading text                                                                                             |
| **Different domain than `baseURL`** | `baseURL` = `www.ikea.com`, jobs live on `jobs.ikea.com`                                                                         | Full URLs in specs                                                                                    | Named constant or a dedicated Playwright project with its own `baseURL`                                                                       |
| **Optimistic UI states**            | `aria-pressed` flips before the action truly persists                                                                            | State attribute says "done", counters say otherwise                                                   | Assert on truthful attributes (`data-job-saved`) / server-confirmed state                                                                     |

> **Iron rule:** checklists are blind to what they do not contain. At every review, also ask: _"what does this app always surprise me with?"_ and _"what existing project asset should be integrated here, but is not?"_

---

## 7. Errata — corrections to my own initial review

**E1 — fabricated code quote (initial finding 2).** I originally quoted the selector as `[div.search]-filters > ...` and diagnosed it as an attribute selector returning `null`. The actual code reads `div.search-filters > div > section:nth-child(4)` — valid CSS that likely works today. The real defect is **positional fragility**, not a syntax error; the finding has been rewritten accordingly (finding 2 above).
_Lesson: a code quote in a review is Ctrl+C from the diff — never from memory. One fabricated finding undermines ten real ones._

**E2 — unverified claims about the config (initial findings 6/12/16).** I claimed the project lacks `baseURL` and project configuration. The repository's `playwright.config.ts` contains both (`baseURL: 'https://www.ikea.com'`, a chromium project). The valid nuance is different: the jobs domain is a separate application not covered by that `baseURL` (rewritten in finding 6).
_Lesson: before writing "X is missing", open the file. A review happens in the context of a project, not in a vacuum._

---

## 8. Summary — required changes (directions, not ready-mades)

1. Reuse the existing `JobsSearchPage`; move all search interaction out of the spec.
2. Replace `nth-child(4)` with semantic section selection; verify via Ritual 2.
3. Replace the hash ID with a role-based heading locator; verify via Ritual 1.
4. Add `await` to every assertion and to the click in `openFirstResult`.
5. Remove `waitForTimeout(3000)`; wait for the click's real post-condition.
6. Make the results-count assertion **unconditional**; add a guard inside `getResultsCount`.
7. Remove the `try/catch` around the title assertion (or `expect.soft` if genuinely optional).
8. Integrate the existing `CookieBanner` (register + deterministic settle) — P1.
9. Fix the test title (P2) and tighten the URL regex to `/\/job\//` (P3).
10. Move the hidden assertion out of `checkCountryFilter` (A1).
11. Replace the inline jobs URL with a named constant or a dedicated project `baseURL`.
12. Remove `console.log`; add step comments per project convention.
13. Execute Rituals 1–5 and attach evidence before requesting re-review.

---

## 9. Verdict

```
╔════════════════════════════════════════════════════════════╗
║  🔴 CHANGES REQUESTED — NOT APPROVED FOR MERGE             ║
╚════════════════════════════════════════════════════════════╝
```

**Rationale:** two interlocking hidden defects produce **false-positive runs** (unawaited final assertion + conditionally-skipped count assertion — the test passes on a broken page); the consent dialog, this application's best-documented stability killer, is entirely unhandled despite an existing, battle-tested component in the repository; layer separation and locator quality fall below the project's own established conventions.

**Approval conditions:** all items in section 8 addressed, Rituals 1–5 evidenced, re-review requested.

---

_Review balance: 13/16 seeded defects caught in the first pass (including both hidden bugs), 3 added after self-review (P1–P3), 1 boundary finding (A1), 2 review errors found and corrected in the Errata. Verdict upheld._
