# WAVE 2 — funding CSV schema (exact column order)

```
scholarship_id, region, scholarship_name, scholarship_name_original, provider, provider_type,
applies_to_institution, applies_to_city, applies_to_programs, degree_level_covered,
coverage_level, amount_eur_per_year, amount_notes, duration_covered, number_of_awards,
nationality_restrictions, tunisia_eligible, tunisia_eligible_evidence, other_eligibility,
requires_admission_first, application_window, deadline, deadline_source_cycle,
apply_via, funding_url, source_urls, verification_status, verifier_agent, verified_date,
red_flags, notes
```

Field rules
- `scholarship_id` — `<REGIONCODE>-<3-digit>`, e.g. `FES-001`, `FNL-014`, `FBE-007`, `FEM-002`.
- `region` ∈ {spain, netherlands, berlin, germany_other, erasmus_mundus, eu_wide, international}
- `provider_type` ∈ {university, government_national, government_regional, eu, foundation, bank, private_company, embassy, ngo}
- `applies_to_institution` — the exact institution, or `any` for portable schemes. This is the JOIN KEY onto
  Wave 1 program rows, so write the institution name EXACTLY as it appears on its own website.
- `applies_to_programs` — `all` / `all_masters` / a specific list, pipe-separated (`|`).
- `coverage_level` ∈ {full+stipend, full_tuition, partial, none_found}
- `amount_eur_per_year` — a number or a range; `TBC` if not published. **Never estimate or interpolate.**
- `tunisia_eligible` ∈ {yes, no, likely, unclear} — refers to the scholarship's NATIONALITY rules.
  `tunisia_eligible_evidence` — quote the actual eligibility sentence from the official page (≤200 chars).
  Tunisia is a non-EU, North African, Mediterranean-partner, Middle-Income country and an Erasmus+
  Partner Country — some schemes name it explicitly, some cover it via a region list, some exclude it.
  Check the actual list. `unclear` is an honest and acceptable answer; a guess is not.
- `requires_admission_first` ∈ {yes, no, unclear} — critical for the timeline: it determines whether the
  scholarship deadline sits before or after the program deadline.
- `deadline_source_cycle` — if only 2026-intake dates exist, record them and write "2026 cycle — 2027 TBC".
  **Never present a past cycle's deadline as the 2027 deadline.** Today is 2026-08-22; the 2027 cycle is live.
- `verification_status` ∈ {VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, CONFLICT, DEAD_LINK}
- `source_urls` — pipe-separated (`|`), no commas.
- Quote every field containing a comma. Write with a real Python `csv.DictWriter`, never by hand.

**Hard rule:** no scheme enters `VERIFIED` without a URL you actually opened this session. Aggregator sites
(scholarshipportal, scholars4dev, etc.) are LEAD GENERATORS ONLY — every fact must come from the provider's
own domain.
