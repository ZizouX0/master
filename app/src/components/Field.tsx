/**
 * One labelled field, rendered through `renderField()`.
 *
 * The whole point is that its three kinds get three visibly different treatments, because in a
 * spreadsheet they look identical and that is the failure this app exists to prevent:
 *
 *   value       normal ink, normal weight — somebody published this
 *   unverified  amber, italic, dotted underline — we looked and nobody published it
 *   empty       dimmed, mono, inline with its own label — we never collected it
 *
 * The ordering is deliberate. `unverified` is a stronger statement than `empty` (a question was
 * asked and went unanswered), so it gets the louder treatment. `empty` still renders its label,
 * because the label's presence is the information: we know this question needs an answer.
 *
 * A fourth case rides on `value`: 139 deadline strings contain an inline `UNVERIFIED` caveat
 * inside an otherwise real sentence. Stripping it or letting it read as plain prose both lie,
 * so the token is split out and wrapped in an inline amber marker.
 */

import type { JSX } from 'preact';
import { renderField } from '../lib/format';

const UNVERIFIED_SPLIT = /(\bUNVERIFIED\b)/g;

/** Splits an inline `UNVERIFIED` out of prose so it can never read as an ordinary word. */
function withInlineCaveats(text: string): (string | JSX.Element)[] {
  return text.split(UNVERIFIED_SPLIT).map((part, i) =>
    part === 'UNVERIFIED' ? (
      <span key={i} class="inline-unverified" title="Nobody published this part.">
        unverified
      </span>
    ) : (
      part
    ),
  );
}

export function Field(p: { label: string; value: string; wide?: boolean }): JSX.Element {
  const f = renderField(p.value);
  const cls = ['field', 'field--' + f.kind, p.wide ? 'field--wide' : ''].filter(Boolean).join(' ');

  return (
    <div class={cls} data-kind={f.kind}>
      <span class="field__label">{p.label}</span>
      <div
        class="field__value"
        title={f.kind === 'value' ? undefined : f.kind === 'unverified' ? 'Checked — nobody published it.' : 'Never collected.'}
      >
        {f.kind === 'value' ? (f.caveated ? withInlineCaveats(f.text) : f.text) : f.text}
      </div>
    </div>
  );
}

/** A titled run of fields, separated from its neighbours by one hairline. */
export function FieldGroup(p: { title: string; children: any }): JSX.Element {
  return (
    <section class="fieldgroup">
      <h2 class="fieldgroup__title">{p.title}</h2>
      {p.children}
    </section>
  );
}
