/**
 * The Money screen is gone. What is left here is the alias its tests still hold.
 *
 * It was 120 schemes in one alphabetical scroll — 26,437px at 390px wide, the longest screen in
 * the app by three times, with four toggles that filtered 120 down to 120 in their default state.
 * Nobody reads 120 schemes. The question he actually has is per-programme — *can I afford Basel,
 * all in, with a scholarship I could win?* — and that answer now lives on the record of the
 * programme it is about, assembled by `src/data/money.ts`.
 *
 * The eligibility normalisers were duplicated: one copy here, one lifted into `data/money.ts` so
 * the join and the view could not disagree about what "no work-experience bar" means. The
 * duplicates are deleted. What remains is a re-export, and it remains for one specific reason:
 * `src/data/__tests__/money.test.ts` compares `views/Money` against `data/money` scheme by scheme
 * to catch drift between them. With the view gone there is nothing left to drift, and those two
 * assertions are now tautological — they should be deleted along with this file, by whoever is
 * happy to change the test count. Until then this keeps the suite honest about what it is
 * checking rather than silently green on a file that no longer exists.
 *
 * Nothing imports this at runtime. There is no default export, and no route reaches it.
 */

export {
  AGE_AT_APPLICATION,
  AGE_AT_ENTRY,
  admissionFirst,
  ageCap,
  readScheme,
  statedIneligible,
  subjectFit,
  tunisiaEligible,
  workExperienceBar,
  type AgeCap,
  type Nationality,
  type Normalised,
  type SchemeRead,
  type Subject,
  type Verdictish,
  type WorkExperience,
} from '../data/money';
