/**
 * Tests run against the real data file, not a hand-made sample. A fixture that is a subset of
 * the corpus cannot catch the failures these tests exist for — they are all failures of the
 * corpus's messiness rather than of the happy path.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FundingScheme, ProgrammeRecord } from '../../types';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'public', 'data');

function read<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA, name), 'utf8')) as T;
}

export const records: ProgrammeRecord[] = read<ProgrammeRecord[]>('programmes.json');
export const schemes: FundingScheme[] = read<FundingScheme[]>('funding.json');

export function byId(id: number): ProgrammeRecord {
  const rec = records.find((r) => r.id === id);
  if (!rec) throw new Error(`no record with id ${id}`);
  return rec;
}
