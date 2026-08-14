/**
 * The data contract. Every interface here is derived from the actual JSON in
 * `public/data/`, field by field — not from prose. All 47 programme fields and all
 * 20 funding fields are present on every record in the source files, so nothing is
 * optional: absent information is the empty string, never `undefined`.
 */

export const DATA_SCHEMA_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Enums. Every value below was read out of the data, not out of the spec.
// meta.json carries the same vocabularies; components read those, not these.
// ─────────────────────────────────────────────────────────────────────────────

/** `verdict` is empty on 249 of 398 records. Empty is a state, not a missing value. */
export type Verdict = 'WORTH IT' | 'CONDITIONAL' | 'AVOID' | '';

export type Chance = 'Strong' | 'Possible' | 'Weak';

export type CostBand =
  | 'Free'
  | 'Under EUR 1.5k/yr'
  | 'EUR 1.5k-5k/yr'
  | 'EUR 5k-15k/yr'
  | 'Over EUR 15k/yr'
  | 'Not published';

/** The cost bands that a "cheap" selection may draw from, before disputes are applied. */
export const CHEAP_BANDS: readonly CostBand[] = ['Free', 'Under EUR 1.5k/yr', 'EUR 1.5k-5k/yr'];

export type FundingLevel = 'Full' | 'Partial' | 'None' | 'Not stated';

export type PublicPrivate = 'Public' | 'Private' | 'Not stated';

export type Region =
  | 'Southern Europe'
  | 'France & Benelux'
  | 'Central & Eastern'
  | 'UK & Ireland'
  | 'German-speaking'
  | 'Nordics & Baltics'
  | 'Other';

/** The six raw gate values as exported. */
export type Gate =
  | 'Portfolio + exam/interview'
  | 'None found in the text'
  | 'Portfolio only'
  | 'Exam/interview only'
  | 'Not published — ask them'
  | 'AUDITION — hardest for you';

/**
 * Provenance of `auditionDisputed`, straight from the export.
 * `confirmed` = the phrase came from verified prose (`correction` / `verdictWhy`).
 * `suspected` = it came from the raw, never-re-checked `audition` field.
 * `''`        = no audition phrase fired at all.
 * Collapsing these three into `needsAudition` is the mistake the spec forbids.
 */
export type AuditionSource = 'confirmed' | 'suspected' | '';

// ─────────────────────────────────────────────────────────────────────────────
// The programme record — the 47 fields of public/data/programmes.json, verbatim.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgrammeRecord {
  /** Positional. Reassigned on every re-export. Never persist anything against it. */
  id: number;
  country: string;
  region: Region | string;
  city: string;
  institution: string;
  programme: string;
  subtype: string;
  level: string;
  isDegree: boolean;
  gate: Gate | string;
  needsAudition: boolean;
  /** The matched phrase, or ''. Provenance is in `auditionSource`. */
  auditionDisputed: string;
  auditionSource: AuditionSource;
  auditionSuspected: boolean;
  /** The matched phrase, or ''. Always from verified `correction` prose. */
  costDisputed: string;
  /** The matched phrase, or ''. Always from verified `correction` prose. */
  existenceDisputed: string;
  hasVerifiedDispute: boolean;
  chance: Chance | string;
  whyChance: string;
  costBand: CostBand | string;
  language: string;
  languageOk: boolean;
  publicPrivate: PublicPrivate | string;
  funding: FundingLevel | string;
  scholarship: string;
  verdict: Verdict;
  verdictWhy: string;
  /** May contain "DUPLICATE of index N". Those pointers are stale — display, never follow. */
  correction: string;
  qualification: string;
  accreditation: string;
  tuition: string;
  otherFees: string;
  totalCost: string;
  scholarshipDetail: string;
  entry: string;
  acceptsNonMusic: string;
  portfolio: string;
  audition: string;
  /** 186 of these contain "PRIOR CYCLE"; see `deadlineDisplay()` in lib/format.ts. */
  deadline: string;
  opens: string;
  duration: string;
  languageReq: string;
  englishTest: string;
  study: string;
  recommendation: string;
  /** A citation list, frequently several URLs separated by " ; ". */
  url: string;
  foundBy: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// The index / detail split, produced by scripts/build-data.mjs.
// ─────────────────────────────────────────────────────────────────────────────

/** Fields that stay on the card row. Kept in sync with INDEX_FIELDS in build-data.mjs. */
export type IndexField =
  | 'id'
  | 'country'
  | 'region'
  | 'city'
  | 'institution'
  | 'programme'
  | 'subtype'
  | 'level'
  | 'isDegree'
  | 'gate'
  | 'needsAudition'
  | 'auditionDisputed'
  | 'auditionSource'
  | 'auditionSuspected'
  | 'costDisputed'
  | 'existenceDisputed'
  | 'hasVerifiedDispute'
  | 'chance'
  | 'whyChance'
  | 'costBand'
  | 'language'
  | 'languageOk'
  | 'publicPrivate'
  | 'funding'
  | 'verdict';

/** Everything else, including `url`. Fetched after first paint. */
export type DetailField = Exclude<keyof ProgrammeRecord, IndexField>;

/** Fields added by the build step. None of them exist in programmes.json. */
export interface DerivedIndexFields {
  /**
   * Durable record identity: hash(institution + programme + url), 12 hex chars.
   * This — never `id` — is what personal state and detail.json key on.
   */
  key: string;
  /** Dedup group ordinal (data/dedup.ts). Equal `g` means "the same programme". */
  g: number;
  /** True on the one member of the group the list shows. */
  primary: boolean;
  /** How many source rows are in this record's group. 1 for a singleton. */
  rows: number;
}

export type ProgrammeIndex = Pick<ProgrammeRecord, IndexField> & DerivedIndexFields;

export type ProgrammeDetail = Pick<ProgrammeRecord, DetailField>;

/** detail.json — an object keyed by `ProgrammeIndex["key"]`, not by id. */
export type DetailMap = Record<string, ProgrammeDetail>;

/** An index row with its detail merged in, once detail.json has arrived. */
export type ProgrammeFull = ProgrammeIndex & Partial<ProgrammeDetail>;

// ─────────────────────────────────────────────────────────────────────────────
// The funding scheme — the 20 fields of public/data/funding.json, verbatim.
// ─────────────────────────────────────────────────────────────────────────────

export interface FundingScheme {
  /** Positional, in its own id space. Same instability caveat as ProgrammeRecord.id. */
  id: number;
  name: string;
  provider: string;
  country: string;
  whoCanApply: string;
  ageLimit: string;
  subjectScope: string;
  coverage: string;
  duration: string;
  numberOfAwards: string;
  deadline: string;
  opens: string;
  howToApply: string;
  requiresAdmissionFirst: string;
  requiresWorkExperience: string;
  languageRequirement: string;
  competitiveness: string;
  notes: string;
  url: string;
  foundBy: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// meta.json
// ─────────────────────────────────────────────────────────────────────────────

export interface Meta {
  scope: string;
  /** Data vintage, e.g. "2026-08". Changing it means ids moved. */
  generated: string;
  total: number;
  funding: number;
  counts: Record<string, number>;
  /** facet name → value → count over the whole corpus. The UI reads its vocabularies here. */
  facets: Record<string, Record<string, number>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal state — BUILD-SPEC §Personal state.
// ─────────────────────────────────────────────────────────────────────────────

export type Status =
  | 'none'
  | 'shortlist'
  | 'emailed'
  | 'applying'
  | 'applied'
  | 'rejected'
  | 'ruled-out';

export const STATUSES: readonly Status[] = [
  'none',
  'shortlist',
  'emailed',
  'applying',
  'applied',
  'rejected',
  'ruled-out',
];

export interface Entry {
  /** hash(institution + programme + url) — `ProgrammeIndex.key`. Survives re-export. */
  key: string;
  status: Status;
  note: string;
  nextAction: string;
  /** ISO 8601 timestamp of the last edit. */
  updated: string;
}

export const PERSONAL_SCHEMA_VERSION = 1;
export const PERSONAL_STORAGE_KEY = 'door3.personal.v1';

export interface PersonalState {
  schemaVersion: number;
  /** Keyed by `Entry.key`. */
  entries: Record<string, Entry>;
  /** ISO 8601, or null if never exported. */
  lastExportedAt: string | null;
  /** `meta.generated` seen at the last load; a change means ids moved. */
  dataGenerated: string;
}

export interface PersonalExport {
  format: 'door3-personal';
  version: number;
  exportedAt: string;
  state: PersonalState;
}
