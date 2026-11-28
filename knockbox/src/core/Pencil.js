/**
 * Pencil and ink on the pads (ADR-0058, ADR-0059). A pad the drummer lit is
 * in pencil until the take is kept; a pad the maker lit is theirs and every
 * take is drawn around it. Works on the store's
 * `steps` and gives back new ones. No DOM.
 */

const trackOf = (id) => Number(id.slice(id.indexOf("-") + 1, id.indexOf("_")));

/** Whether a drum row is the maker's: a lit pad on it that they lit themselves */
export function isMakers(steps, track) {
  return Object.values(steps).some(
    (step) => trackOf(step.id) === track && step.active && step.mine,
  );
}

/** Whether anything on the pads is still in pencil */
export function hasPencil(steps) {
  return Object.values(steps).some((step) => step.active && step.pencil);
}

/**
 * The drummer plays a take: every pad the maker did not light themselves is
 * cleared, and the take's pads are lit in pencil around theirs. A pad of
 * theirs is left exactly as it is.
 * @param {Object} steps
 * @param {string[]} pads - Ids of the pads the take lights
 * @param {Object} [arts] - The NOTE REPEAT key on any of them, by pad id
 */
export function playAlong(steps, pads, arts = {}) {
  const lit = new Set(pads);
  const next = {};
  for (const step of Object.values(steps)) {
    next[step.id] =
      step.active && step.mine
        ? step
        : {
            ...step,
            active: lit.has(step.id),
            art: (lit.has(step.id) && arts[step.id]) || null,
            pencil: lit.has(step.id),
            mine: false,
          };
  }
  return next;
}

/**
 * The maker's drums stand aside for a run of his takes (ADR-0070): no pad is
 * theirs while it lasts, so each take is a whole beat. The desk as it stood is
 * kept by whoever asked, to put back. A pad they light during the run is theirs.
 */
export function standAside(steps) {
  const next = {};
  for (const step of Object.values(steps))
    next[step.id] = step.mine ? { ...step, mine: false } : step;
  return next;
}

/** The take is kept: what was pencil is ink. It is still his to change if he is asked back */
export function keepTake(steps) {
  const next = { ...steps };
  for (const step of Object.values(steps)) {
    if (step.pencil) next[step.id] = { ...step, pencil: false };
  }
  return next;
}

/**
 * An idea of his on trial: pads lit in pencil, and pads taken off. Whose a pad
 * was is kept, so putting the idea back returns the desk as it stood.
 */
export function tryPads(steps, on = [], off = [], arts = {}) {
  const next = { ...steps };
  for (const id of on) {
    next[id] = { ...steps[id], active: true, art: arts[id] ?? null, pencil: true };
  }
  for (const id of off) next[id] = { ...steps[id], active: false, art: null, pencil: false };
  return next;
}

/** An idea is kept: what was pencil is ink, and the maker's, since they chose it */
export function keepIdea(steps) {
  const next = { ...steps };
  for (const step of Object.values(steps)) {
    if (step.pencil) next[step.id] = { ...step, pencil: false, mine: true };
  }
  return next;
}

/** The drum rows with none of the maker's pads on them: he offers to play while there is one, and their ghost dials are his */
export function rowsToPlay(steps) {
  return [0, 1, 2, 3].filter((track) => !isMakers(steps, track));
}

export { trackOf };
