import { keepIdea, keepTake, playAlong, rowsToPlay, standAside, tryPads } from "./Pencil.js";
import store from "./state.js";

const initSteps = (stepsObject) => {
  const nextSteps = {};

  for (const currentValue of Object.keys(stepsObject)) {
    //  track-0_0, track-0_1, track-0_2
    nextSteps[currentValue] = {
      ...stepsObject[currentValue],
      active: false,
      art: null,
      pencil: false,
      mine: false,
    };
  }

  return nextSteps;
};

/**
 * Tiny immutable store for sequencer state.
 *
 * It intentionally mirrors a Redux-like dispatch/reducer shape without adding a
 * runtime dependency. Components subscribe to either all state changes or a
 * focused selector when they only care about one slice.
 */
export class Store {
  constructor() {
    this.state = structuredClone(store);
    this.observers = [];
    // A saved beat is being put on the desk (Project.restore): what changes meanwhile is not the maker at work
    this.opening = false;
  }

  getState() {
    return this.state;
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const filteredList = this.observers.filter((cb) => cb !== callback);
      this.observers = filteredList;
    };
  }

  /**
   * Subscribe to changes in a specific slice of state
   * Only fires callback when the selected value changes
   * @param {Function} selector - Function that extracts the value to watch (e.g., state => state.transport.bpm)
   * @param {Function} callback - Called with (newValue, oldValue) when selected value changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToSelector(selector, callback) {
    let lastValue = selector(this.state);
    return this.subscribe((newState) => {
      const newValue = selector(newState);
      if (newValue !== lastValue) {
        const oldValue = lastValue;
        lastValue = newValue;
        callback(newValue, oldValue);
      }
    });
  }

  dispatch(action) {
    const newState = this.reducer(this.state, action);

    if (newState === this.state) return;

    this.state = newState;
    this.notify();
  }

  reducer(state, action) {
    switch (action.type) {
      case "SET_TEMPO":
        return {
          ...state,
          transport: {
            ...state.transport,
            bpm: action.payload,
          },
        };
      case "TOGGLE": {
        // Switching a step off also drops its articulation. A pad the maker
        // lights is theirs, in ink; the drummer draws around it
        const pad = state.steps[action.payload];
        const lit = !pad.active;
        return {
          ...state,
          steps: {
            ...state.steps,
            [action.payload]: { ...pad, active: lit, art: null, pencil: false, mine: lit },
          },
        };
      }
      case "PAINT_ART": {
        // Tap a pad with a NOTE REPEAT key armed: put that articulation on
        // the step (switching it on if needed); tap again to take it off.
        const { id, art } = action.payload;
        const step = state.steps[id];
        const sameArt = step.active && step.art === art;
        const steps = { ...state.steps };
        steps[id] = { ...step, active: true, art: sameArt ? null : art, pencil: false, mine: true };
        return { ...state, steps };
      }
      case "PLAY_ALONG": {
        // The drummer's take around the maker's pads, and his setting of the dials
        const { pads, arts, mode, swing, ghost } = action.payload;
        const played = rowsToPlay(state.steps);
        const trackSettings = { ...state.trackSettings };
        for (const track of played) {
          if (ghost[track] === undefined) continue;
          trackSettings[track] = { ...trackSettings[track], ghostQuantity: ghost[track] };
        }
        return {
          ...state,
          steps: playAlong(state.steps, pads, arts),
          humanizeValue: swing,
          grooveSettings: { ...state.grooveSettings, hihatMode: mode },
          trackSettings,
        };
      }
      case "STAND_ASIDE":
        // The maker's drums make way for a run of his takes
        return { ...state, steps: standAside(state.steps) };
      case "KEEP_TAKE":
        return { ...state, steps: keepTake(state.steps) };
      case "TRY_PADS":
        // An idea of the drummer's on trial
        return {
          ...state,
          steps: tryPads(state.steps, action.payload.on, action.payload.off, action.payload.arts),
        };
      case "KEEP_IDEA":
        return { ...state, steps: keepIdea(state.steps) };
      case "PUT_BACK":
        // His idea is taken off: the pads, the loop's row, the voice's and the feel exactly as they stood
        return {
          ...state,
          steps: action.payload.steps,
          smp: action.payload.smp,
          vox: action.payload.vox ?? state.vox,
          humanizeValue: action.payload.humanizeValue ?? state.humanizeValue,
          grooveSettings: action.payload.grooveSettings ?? state.grooveSettings,
          trackSettings: action.payload.trackSettings ?? state.trackSettings,
        };
      case "SET_ARMED_ART":
        return { ...state, armedArt: action.payload };
      case "TOGGLE_PLAY":
        return {
          ...state,
          transport: {
            ...state.transport,
            isPlaying: !state.transport.isPlaying,
          },
        };
      case "RESET_STEPS":
        return {
          ...state,
          steps: initSteps(state.steps), //dont spread state object here as its not iteraeble
        };
      case "SET_PATTERN": {
        // Replace the whole pattern: only the listed step ids are on
        const steps = initSteps(state.steps);
        for (const id of action.payload) {
          if (steps[id]) steps[id] = { ...steps[id], active: true, mine: true };
        }
        return { ...state, steps };
      }
      case "SET_HUMANIZE":
        return { ...state, humanizeValue: action.payload };
      case "SET_TRACK_GHOST_QUANTITY":
        return {
          ...state,
          trackSettings: {
            ...state.trackSettings,
            [action.payload.track]: {
              ...state.trackSettings[action.payload.track],
              ghostQuantity: action.payload.value,
            },
          },
        };
      case "SET_TRACK_SOUND":
        return {
          ...state,
          trackSettings: {
            ...state.trackSettings,
            [action.payload.track]: {
              ...state.trackSettings[action.payload.track],
              sound: action.payload.sound,
            },
          },
        };
      case "TOGGLE_TRACK_SWING_LOCK":
        return {
          ...state,
          trackSettings: {
            ...state.trackSettings,
            [action.payload]: {
              ...state.trackSettings[action.payload],
              swingLocked: !state.trackSettings[action.payload].swingLocked,
            },
          },
        };
      case "TOGGLE_TRACK_MUTE":
        return {
          ...state,
          trackSettings: {
            ...state.trackSettings,
            [action.payload]: {
              ...state.trackSettings[action.payload],
              muted: !state.trackSettings[action.payload].muted,
            },
          },
        };
      // Any row, drum or take: soloed rows are the only ones heard while any is
      case "TOGGLE_SOLO":
        return { ...state, solo: { ...state.solo, [action.payload]: !state.solo[action.payload] } };
      // The take lanes ("vox": the mic take, "smp": the loaded loop) share
      // these; action.lane says which one
      case "SET_VOX_TAKE": {
        // A new take replaces the old one; the lane's settings are kept
        const lane = action.lane || "vox";
        return { ...state, [lane]: { ...state[lane], erased: false, ...action.payload } };
      }
      case "SET_VOX_SETTING": {
        const lane = action.lane || "vox";
        return {
          ...state,
          [lane]: { ...state[lane], [action.payload.key]: action.payload.value },
        };
      }
      case "TOGGLE_VOX_SLICES": {
        // Mute the slices on a pad, or bring them back if they're all muted
        const lane = action.lane || "vox";
        const ids = new Set(action.payload);
        const hit = state[lane].slices.filter((slice) => ids.has(slice.id));
        const muted = !hit.every((slice) => slice.muted);
        return {
          ...state,
          [lane]: {
            ...state[lane],
            slices: state[lane].slices.map((slice) =>
              ids.has(slice.id) ? { ...slice, muted } : slice,
            ),
          },
        };
      }
      case "CLEAR_VOX": {
        // The lane goes; VoxEngine holds on to the take so it can come back
        const lane = action.lane || "vox";
        return { ...state, [lane]: { ...state[lane], slices: [], muted: false, erased: true } };
      }
      case "SET_MIX_LEVEL":
        return { ...state, mix: { ...state.mix, [action.payload.key]: action.payload.value } };
      case "LOAD_PROJECT": {
        // A saved beat replaces what is on the desk. Whatever it doesn't
        // mention (it was saved before that existed) takes its default;
        // playback and a held NOTE REPEAT key carry on as they are.
        const saved = action.payload;
        const steps = {};
        for (const id of Object.keys(store.steps)) {
          // A beat that is loaded is its maker's: no pencil comes with it
          const step = { id, active: false, art: null, ...saved.steps?.[id] };
          steps[id] = { ...step, pencil: false, mine: Boolean(step.active) };
        }
        const trackSettings = {};
        for (const track of Object.keys(store.trackSettings)) {
          trackSettings[track] = { ...store.trackSettings[track], ...saved.trackSettings?.[track] };
        }
        return {
          ...state,
          transport: { ...state.transport, bpm: saved.transport?.bpm ?? store.transport.bpm },
          steps,
          humanizeValue: saved.humanizeValue ?? store.humanizeValue,
          grooveSettings: { ...store.grooveSettings, ...saved.grooveSettings },
          trackSettings,
          mix: { ...store.mix, ...saved.mix },
          vox: { ...store.vox, ...saved.vox },
          smp: { ...store.smp, ...saved.smp },
          // A solo is for listening now: none comes with a beat, and none is left over it
          solo: {},
        };
      }
      case "SET_SWITCH_UP":
        return {
          ...state,
          grooveSettings: { ...state.grooveSettings, switchUp: Boolean(action.payload) },
        };
      case "SET_HIHAT_MODE":
        return {
          ...state,
          grooveSettings: {
            ...state.grooveSettings,
            hihatMode: action.payload, // 'friction' | 'limp'
          },
        };
      default:
        return state;
    }
  }

  notify() {
    this.observers.forEach((observer) => {
      observer(this.state);
    });
  }
}
