/**
 * Lookahead clock for the 16-step sequencer.
 *
 * The clock schedules ahead against `AudioContext.currentTime` so playback can
 * stay stable even though UI updates and store changes happen on the main
 * thread.
 */
// Gap between pressing play and the first step
const START_DELAY_SECONDS = 0.1;

export class Clock {
  /**
   * @param {Object} dependencies - Runtime dependencies for the clock.
   * @param {AudioContext} dependencies.audioContext - Browser audio host.
   * @param {Function} dependencies.getTempo - Returns the current BPM.
   * @param {Function} dependencies.onTick - Callback called as `(step, time, totalSteps)`.
   */
  constructor({ audioContext, getTempo, onTick }) {
    this.audioContext = audioContext;
    this.getTempo = getTempo;
    this.onTick = onTick;

    this.lookahead = 25.0;
    // Has to be longer than the earliest a hit can be pulled ahead of its
    // step (a drag on a pushed snare is ~120ms early), or that hit would be
    // asked for in the past and come out late
    this.scheduleAheadTime = 0.2;

    this.currentStep = 0;
    // Steps since start() — lets lanes longer than one bar know which bar they're in
    this.totalSteps = 0;
    this.nextNoteTime = 0.0;
    this.isPlaying = false;
    this.timerID = null;
  }

  start() {
    if (this.isPlaying) return;

    // Room for a pushed or flammed hit on the very first step
    this.nextNoteTime = this.audioContext.currentTime + START_DELAY_SECONDS;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.isPlaying = true;

    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
  }

  scheduler() {
    // Fallen behind (a stalled main thread, a throttled timer): the missed
    // steps are dropped rather than all fired at once, and the count carries
    // on so the pads and every take lane are still on the same bar
    while (this.nextNoteTime < this.audioContext.currentTime) this.advanceNote();

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceNote();
    }

    if (this.isPlaying) {
      this.timerID = setTimeout(() => {
        this.scheduler();
      }, this.lookahead);
    }
  }

  advanceNote() {
    const bpm = this.getTempo() || 120;
    const secondsPerBeat = 60.0 / bpm;

    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.currentStep = (this.currentStep + 1) % 16;
    this.totalSteps += 1;
  }

  /**
   * Tells the playback/UI layer to handle a step at an absolute AudioContext time.
   * @param {number} stepNumber - Current 16-step grid position.
   * @param {number} noteTime - Absolute AudioContext time in seconds.
   */
  scheduleNote(stepNumber, noteTime) {
    // One bad step must not end the loop: an error thrown here would skip
    // the next timer and leave the transport showing PLAY over silence
    try {
      this.onTick(stepNumber, noteTime, this.totalSteps);
    } catch (error) {
      console.error(`Clock: step ${stepNumber} failed`, error);
    }
  }
}
