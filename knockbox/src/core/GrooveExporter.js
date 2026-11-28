/**
 * GrooveExporter
 * Hands the feel over without the beat: one short MIDI clip per drum voice
 * with a hit on every 16th, each sitting where the current dial, hi-hat
 * mode and swing locks put it. Dropped into a DAW, a groove can be lifted
 * from each clip and laid over the producer's own drums.
 */

import { Toast } from "../components/Toast.js";
import { encodeZip } from "./FileUtils.js";
import { buildGrooveTemplate } from "./GrooveTemplate.js";

const PPQN = 480;
const NOTE_SECONDS = 0.05;
const VOICE_NAMES = ["kick", "snare", "hihat-closed", "hihat-open"];

export class GrooveExporter {
  constructor(store, midiExporter) {
    this.store = store;
    this.midiExporter = midiExporter;
  }

  /**
   * @returns {{filename: string, bytes: Uint8Array, mime: string, files: Array}|null}
   *   A zip of the clips and a how-to, plus the clips on their own
   */
  export() {
    const state = this.store.getState();
    const bpm = state.transport.bpm;
    const hihatMode = state.grooveSettings?.hihatMode || "friction";
    const swing = state.humanizeValue;
    if (swing === 0) {
      Toast.show("The swing dial is at zero — there's no groove to take yet", "warning");
      return null;
    }

    const template = buildGrooveTemplate({
      bpm,
      humanize: swing / 100,
      hihatMode,
      trackSettings: state.trackSettings,
    });
    const tag = `${bpm}bpm-${hihatMode}-swing${swing}`;
    const toTicks = (seconds) => Math.round(((seconds * bpm) / 60) * PPQN);

    const files = template.voices.map((voice) => {
      const events = voice.notes.map((note) => ({
        pitch: voice.pitch,
        tickStart: toTicks(note.time),
        tickEnd: toTicks(note.time + NOTE_SECONDS),
        velocity: note.velocity,
      }));
      const name = VOICE_NAMES[voice.track];
      return {
        name: `knockbox-groove-${name}-${tag}.mid`,
        label: `${name.replace("hihat-", "")} groove`,
        mime: "audio/midi",
        bytes: this.midiExporter.serialize([events], bpm, [
          `KNOCKBOX GROOVE ${name.toUpperCase()}`,
        ]),
      };
    });

    const howTo = new TextEncoder().encode(howToText(template, { bpm, hihatMode, swing }));
    const filename = `knockbox-groove-${tag}-${Date.now()}.zip`;
    const bytes = encodeZip([...files, { name: "HOW-TO.txt", bytes: howTo }]);
    Toast.show("Groove bounced — one clip per drum, with a how-to", "success");
    return { filename, bytes, mime: "application/zip", files };
  }
}

function howToText(template, { bpm, hihatMode, swing }) {
  const swingLines = template.voices
    .map((voice) => `  ${VOICE_NAMES[voice.track].padEnd(14)}${voice.swing}%`)
    .join("\n");
  const leadMs = Math.round(template.lead * 1000);

  return `KNOCKBOX GROOVE
${bpm} BPM, ${hihatMode} hats, swing dial at ${swing}%

Four one-bar MIDI clips, one per drum voice. Each has a hit on every 16th,
placed where Knockbox would play it, with the accents it would give it.
Use the kick clip on your kick, the snare clip on your snare, and so on:
the feel comes from the voices leaning against each other.

ABLETON LIVE
  Drop a clip on a MIDI track, right-click it and choose Extract Groove(s).
  The groove appears in the Groove Pool; drag it onto your own clip.
  Set Base to 1/16 and Timing to 100%.

LOGIC PRO
  Drop a clip on a track, select the region, then in the Region inspector
  open the Quantize menu and choose Make Groove Template. Pick that
  template as the quantize value on your own region.

FL STUDIO, REAPER, CUBASE, STUDIO ONE
  Each can make a groove or quantize template from a MIDI clip; look for
  "groove template" or "extract groove" in its quantize settings.

MPC
  Import a clip as a sequence and copy your sounds onto its pads to play
  the timing as it is. An MPC's swing setting is one number, so it can
  only say where the off-beat 16th sits. The nearest settings are:
${swingLines}
  A kick that drags or a snare that pushes on every hit is not swing, so
  it is not in those numbers; it is in the clips.

NOTES
  The timing was made at ${bpm} BPM. At another tempo the DAW scales it
  with the beat, so the lean stays in proportion.
  ${
    leadMs > 0
      ? `Every clip starts ${leadMs} ms late, all by the same amount, so that hits which
  push ahead of the beat still fall inside the bar. The feel between the
  voices is unchanged.`
      : "Nothing in this groove pushes ahead of the beat, so the clips start on the bar."
  }
`;
}
