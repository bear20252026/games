import { AccountMenu, faceUrl } from "./components/AccountMenu.js";
import { AccountSheet } from "./components/AccountSheet.js";
import { BeatTag } from "./components/BeatTag.js";
import { BounceMenu } from "./components/BounceMenu.js";
import { BulkDropZone } from "./components/BulkDropZone.js";
import { Cables } from "./components/Cables.js";
import { Crate } from "./components/Crate.js";
import { Dial } from "./components/Dial.js";
import { DiskBox } from "./components/DiskBox.js";
import { DiskChooser } from "./components/DiskChooser.js";
import { DrummerThought } from "./components/DrummerThought.js";
import { Grid } from "./components/Grid.js";
import { HeldSign } from "./components/HeldSign.js";
import { KeepNote } from "./components/KeepNote.js";
import { LcdMessage } from "./components/LcdMessage.js";
import { MicProp } from "./components/MicProp.js";
import { Mixer } from "./components/Mixer.js";
import { PowerCycle } from "./components/PowerCycle.js";
import {
  BOOT_WORDS,
  DARK_MS,
  holdTheDesk,
  LAMP_MS,
  ROW_MS,
  SWEEP_REST_MS,
} from "./components/PowerOn.js";
import { PulseToast } from "./components/PulseToast.js";
import { LOOPS_AT, RecordBox } from "./components/RecordBox.js";
import { RiveAvatar } from "./components/RiveAvatar.js";
import { Room } from "./components/Room.js";
import { SampleUploader, TRACK_TO_SAMPLE_KEY } from "./components/SampleUploader.js";
import { SaveKey } from "./components/SaveKey.js";
import { SaveNudge } from "./components/SaveNudge.js";
import { SendNote } from "./components/SendNote.js";
import { Shortcuts } from "./components/Shortcuts.js";
import { setDragFile, TapeTray } from "./components/TapeTray.js";
import { tempoDrag } from "./components/TempoDrag.js";
import { Toast } from "./components/Toast.js";
import { Tooltip } from "./components/Tooltip.js";
import { Tour } from "./components/Tour.js";
import { VoxLane } from "./components/VoxLane.js";
import { NUM_TRACKS, TRACK_TO_PITCH } from "./constants/drums.js";
import { Account, keyFrom } from "./core/Account.js";
import { Api } from "./core/Api.js";
import { AudioEngine } from "./core/AudioEngine.js";
import { AudioExporter, BARS as LOOP_BARS } from "./core/AudioExporter.js";
import { AudioJobs } from "./core/AudioJobs.js";
import { Audition } from "./core/Audition.js";
import { clipLink } from "./core/Clip.js";
import { ClipExporter, clipRoute } from "./core/ClipExporter.js";
import { Clock } from "./core/Clock.js";
import { decodeAudio } from "./core/Decode.js";
import { DiskDrive } from "./core/DiskDrive.js";
import { loadBeat, loopOf, mixesOwed, sendMix } from "./core/Disks.js";
import { downloadBytes, encodeWav } from "./core/FileUtils.js";
import { chainWords } from "./core/Flips.js";
import { asks, forgetAsk, pendingAsk, rememberAsk } from "./core/Gate.js";
import { GrooveController } from "./core/GrooveController.js";
import { GrooveExporter } from "./core/GrooveExporter.js";
import { barOf } from "./core/Hand.js";
import { HANDOVER_CHANNEL, Handover } from "./core/Handover.js";
import { LoopTry } from "./core/LoopTry.js";
import { MidiExporter } from "./core/MidiExporter.js";
import { levelToGain } from "./core/MixLevels.js";
import { OPUS_RATE } from "./core/OggOpus.js";
import { Packer } from "./core/Packing.js";
import { Project } from "./core/Project.js";
import { guestCredit, loadRecords, loopRef } from "./core/Records.js";
import { inRoom } from "./core/Room.js";
import { beatIdFrom, beatLink, pendingSend, rememberSend, sendDisk } from "./core/Sending.js";
import { TRACK_KEYS } from "./core/Sounds.js";
import { Store } from "./core/Store.js";
import { Usage } from "./core/Usage.js";
import { VoxEngine } from "./core/VoxEngine.js";
import { VoxRecorder } from "./core/VoxRecorder.js";

export default function Init() {
  // Browsers only hand out the microphone on https or localhost. A dev server
  // opened by its bind address (http://0.0.0.0:8080, http://[::]:8080) is the
  // same machine but doesn't count, so move to localhost before anything loads.
  if (!window.isSecureContext && ["0.0.0.0", "[::]"].includes(window.location.hostname)) {
    const url = new URL(window.location.href);
    url.hostname = "localhost";
    window.location.replace(url.href);
    return;
  }

  Tooltip.init();

  // Initialize core modules
  const APP_STORE = new Store();
  // Where the desk doesn't fit nothing is played live into it, so the audio
  // is asked for in bigger blocks: a phone gets through them without dropouts
  const audioCtx = new window.AudioContext(NO_DESK ? { latencyHint: "playback" } : undefined);
  if (PLAYER_ONLY) {
    // The card is up from the start; the desk under it is never drawn
    document.body.classList.add("is-player");
    const card = document.querySelector("#player");
    const wait = document.createElement("p");
    wait.className = "player-by";
    wait.textContent = "Fetching the beat…";
    card.replaceChildren(wait);
    card.hidden = false;
  }
  // Booted without the desk's heavy parts: a window made big enough for the desk starts again
  if (NO_DESK) TOO_SMALL.addEventListener("change", () => window.location.reload());
  const AUDIO_ENGINE = new AudioEngine(audioCtx);

  // Initialize UI components
  const GRID = new Grid(APP_STORE, "#app");
  GRID.init();

  // A sound stepped to or picked on a row is heard once, when it has arrived
  const hearDrum = async (track) => {
    audioCtx.resume();
    await AUDIO_ENGINE.loadSamples().catch(() => {});
    AUDIO_ENGINE.scheduleNote(audioCtx.currentTime, TRACK_TO_PITCH[track]);
  };
  for (let track = 0; track < NUM_TRACKS; track++) {
    new SampleUploader(audioCtx, AUDIO_ENGINE, track, `.sample-drop-zone[data-track="${track}"]`, {
      store: APP_STORE,
      onHear: hearDrum,
    });
  }

  // Initialize bulk drop zone for multi-file upload
  new BulkDropZone(audioCtx, AUDIO_ENGINE, "#app");

  // VOX lane — a voice take sliced and dropped into the drums' pocket.
  // Its row is added under the drum rows and stays hidden until there is a take.
  // Two take lanes under the drum rows: SMP holds a loaded loop, VOX a take
  // sung into the mic over it
  // The heavy listening, stretching and packing of takes is done by a worker,
  // started the first time there is something for it to do
  const AUDIO_JOBS = new AudioJobs(
    () => new Worker(new URL("./workers/audioWorker.js", import.meta.url), { type: "module" }),
  );
  const LOOP_ENGINE = new VoxEngine(APP_STORE, AUDIO_ENGINE, "smp", AUDIO_JOBS);
  const VOX_ENGINE = new VoxEngine(APP_STORE, AUDIO_ENGINE, "vox", AUDIO_JOBS);
  // TUNE on the VOX row brings the voice to the loop's key, never the reverse
  VOX_ENGINE.tuneTo = LOOP_ENGINE;
  const TAKE_LANES = [LOOP_ENGINE, VOX_ENGINE].map(
    (engine) => new VoxLane(APP_STORE, engine, "#app"),
  );
  for (const lane of TAKE_LANES) lane.init();

  // Mixer: the MIXER key swaps every row's pads for a level fader. Drum
  // levels go to the audio engine; the take lanes read theirs from the store.
  new Mixer(APP_STORE, "#mixer-btn").init();
  APP_STORE.subscribeToSelector(
    (s) => s.mix,
    (mix) => {
      for (let track = 0; track < NUM_TRACKS; track++) {
        AUDIO_ENGINE.setTrackLevel(TRACK_TO_PITCH[track], levelToGain(mix[track]));
      }
    },
  );

  new Dial(APP_STORE, "#humanize-container");

  // Route the desk cables to the chassis jacks (after the grid has given it its size)
  new Cables(".cables", ".sampler").init();

  const Avatar = new RiveAvatar("#avatar-canvas");
  // The head-bobber is 5 MB of animation and its runtime: only where there is a desk to stand on
  if (!NO_DESK) Avatar.init();

  // Initialize tempo input
  const tempoElem = document.querySelector("#tempo-input");
  tempoElem.value = APP_STORE.getState().transport.bpm;

  // The groove controller: the pocket, the hand and the ghost notes
  const GROOVE_CONTROLLER = new GrooveController(APP_STORE, AUDIO_ENGINE);
  GROOVE_CONTROLLER.init();

  // Built-in loops are files of the site's, on records (ADR-0088): the list is fetched once
  const RECORD_LIST = loadRecords(() =>
    fetch(`${LOOPS_AT}records.json`).then((got) => (got.ok ? got.json() : [])),
  );
  const fetchLoop = async (ref) => {
    const got = await fetch(`${LOOPS_AT}${ref}.wav`);
    if (!got.ok) throw new Error(String(got.status));
    return got;
  };
  // A beat names its built-in loop and carries no file of it (FR-OPEN-15)
  const loopBytes = async (ref) => new Uint8Array(await (await fetchLoop(ref)).arrayBuffer());

  // The beat on the desk as one thing that can be saved and brought back
  const PROJECT = new Project({
    fetchLoop: loopBytes,
    store: APP_STORE,
    audioEngine: AUDIO_ENGINE,
    takeEngines: [LOOP_ENGINE, VOX_ENGINE],
    decode: (bytes) => decodeAudio(audioCtx, bytes),
    onLoaded: () => {
      // The tempo box and the drum rows' switches don't follow the store
      const { bpm } = APP_STORE.getState().transport;
      tempoElem.value = bpm;
      window.dispatchEvent(new CustomEvent("bpm-update", { detail: { bpm } }));
      window.dispatchEvent(new CustomEvent("sample-replaced"));
    },
  });
  // Drum sounds live outside the store, so they say for themselves when they change
  window.addEventListener("sample-replaced", () => PROJECT.touch());

  // Saved beats: the SAVE key on the transport, and the disks behind it
  // A take is packed down on its way to the server (Packing.js). It is read
  // at 48 kHz for that, the one rate the packing works at.
  const PACKER = new Packer({
    jobs: AUDIO_JOBS,
    decode: (bytes) => decodeAudio(new OfflineAudioContext(2, 1, OPUS_RATE), bytes),
  });
  const DISKS = new DiskDrive({
    api: new Api(),
    project: PROJECT,
    pack: (file) => PACKER.pack(file),
  });

  // How the desk is used, as counts: what happened in a visit, never who did it
  const USAGE = new Usage({ send: (name) => DISKS.api.count(name) });
  USAGE.count("visit");
  if (NO_DESK) USAGE.count("too_small");
  // A visit that stays: the time is counted only while the desk is in view
  setInterval(() => {
    if (document.visibilityState === "visible") USAGE.passed(STAY_TICK_SECONDS);
  }, STAY_TICK_SECONDS * 1000);
  // The feel's own tools under the maker's hand: the swing dial, and a drum row's ghost dial.
  // What the drummer or an opened beat turns them to is not a hand on them
  const dialHandled = (e) => {
    if (e.type === "keydown" && !e.key.startsWith("Arrow")) return;
    if (e.target.closest?.("#humanize-container .dial-container")) USAGE.count("feel");
    else if (e.target.closest?.(".track-dial-container .mini-dial-wrapper")) USAGE.count("ghost");
  };
  document.addEventListener("pointerdown", dialHandled, true);
  document.addEventListener("keydown", dialHandled, true);
  document.querySelector("#mixer-btn").addEventListener("click", () => USAGE.count("mixer"));
  // A beat coming back from a disk is unsaved for an instant; that is not an edit
  PROJECT.onDirtyChange((dirty) => {
    if (dirty) setTimeout(() => PROJECT.isDirty() && USAGE.count("edit"));
  });
  APP_STORE.subscribeToSelector(
    (s) => s.transport.isPlaying,
    (playing) => {
      if (!playing) return;
      USAGE.count("play");
      // Someone else's beat being heard is a play on its maker's count (FR-REACH-02)
      if (DISKS.visiting) USAGE.heard(DISKS.visiting.id, (id) => DISKS.api.playBeat(id));
    },
  );
  APP_STORE.subscribeToSelector(
    (s) => s.smp.slices.length > 0,
    (there) => there && USAGE.count("loop"),
  );
  APP_STORE.subscribeToSelector(
    (s) => s.vox.slices.length > 0,
    (there) => there && USAGE.count("vocal"),
  );
  // A drum sound of your own; a beat coming back from a disk names no drum
  window.addEventListener("sample-replaced", (e) => e.detail?.sampleKey && USAGE.count("drum"));
  // The tape that says where the beat on the desk came from: its chain and its flips.
  // Someone else's beat is not shown on the desk: it is in the listening room over it
  const showTag = () => {
    showRoom();
    const on = DISKS.disk;
    if (!on || DISKS.visiting) return BeatTag.hide();
    BeatTag.show({
      chain: chainWords(DISKS.chain, DISKS.user?.name),
      flips: DISKS.flips,
      listFlips: () => DISKS.api.listFlips(on.id),
    });
  };
  // Someone else's beat is listened to first, in a room of its own; FLIP IT is the way
  // to the desk (ADR-0044). Where the desk doesn't fit, the tape deck is up instead
  const showRoom = () => {
    const theirs = DISKS.visiting;
    if (!inRoom(theirs, TOO_SMALL.matches)) return Room.hide();
    Room.show({
      theirs,
      // Whose record its loop is from, once the list of records is in (FR-OPEN-15)
      loopFrom: RECORD_LIST.then(() => guestCredit(theirs.loop)),
      chain: chainWords(DISKS.chain, DISKS.user?.name),
      flips: DISKS.flips,
      onPlay: playVisiting,
      onQuiet: () => PREVIEW.stop(),
      onFlip: flip,
      onReport: (details) => DISKS.api.report(details),
      listFlips: () => DISKS.api.listFlips(theirs.id),
      onStick: (kind) => stickVisiting(theirs.id, kind, true),
      onPeel: (kind) => stickVisiting(theirs.id, kind, false),
    });
    // Made while the room is looked at, so PLAY is heard at once
    PREVIEW.make(theirs.id, theirs.updatedAt, () => DISKS.visiting?.id === theirs.id).catch(
      () => {},
    );
  };
  // A sticker from the room's sheet: the crate's sleeve for the beat, and the pile, are told too
  const stickVisiting = async (id, kind, on) => {
    const stickers = await DISKS.stick(id, kind, on);
    CRATE.refresh();
    return stickers;
  };
  // The room's PLAY: the beat as it was made, going round. Its maker's loop where it was
  // sent with its sounds, otherwise its pattern and feel on the stock drums (FR-OPEN-13)
  const playVisiting = async () => {
    const { id, updatedAt } = DISKS.visiting;
    const started = await PREVIEW.play(id, updatedAt);
    // Heard here, it is a play on its maker's count (FR-REACH-02)
    if (started) USAGE.heard(id, (heard) => DISKS.api.playBeat(heard));
    return started;
  };
  // FLIP IT: your version of the visiting beat goes on a disk of your own, without its maker's audio
  const flip = async () => {
    // A flip is credited, so it has a name on it: a guest signs in first (FR-ACC-13)
    if (DISKS.visiting && (await gate("flip", { id: DISKS.visiting.id }))) return;
    try {
      if (!(await DISKS.flip())) return;
      // The address was the beat it came from; the desk now holds a disk of yours
      window.history.replaceState(null, "", "/");
      LcdMessage.show(["Flipped: on your disk", "Loop slot empty. Load your own"], 5200);
      showTag();
      DISK_BOX.setDown();
    } catch (error) {
      if (error.code === "not_available") BeatTag.gone();
      Toast.show(FLIP_REFUSALS[error.code] ?? "Couldn't flip that. Try again.", "warning");
    }
  };
  const DISK_BOX = new DiskBox({
    disks: DISKS,
    onCopied: () => USAGE.count("link_copied"),
    onLoad: async (id) => {
      // Unsaved work is asked about first, on a sticky note
      const { loaded, full, missing } = await DISKS.loadOver(id, () => KeepNote.ask());
      // No blank disk for it: SAVE takes over, and asks which one to write over
      if (full) SAVE_KEY.press();
      if (!loaded) return false;
      DISK_BOX.refresh();
      LcdMessage.show(["Loaded", DISKS.disk.title]);
      if (missing.length)
        Toast.show("Loaded, but some of its audio couldn't be fetched", "warning");
      // Whatever was visiting the desk has made way for your own disk
      showTag();
      return true;
    },
    onSend: async (beat, where) => {
      // A public link has a reachable person behind it: a guest signs in first,
      // and the send carries on once they are back from their inbox
      if (DISKS.user?.guest) {
        rememberSend(window.localStorage, beat.id);
        // Signed in on the sheet, the send is picked up from there
        signInSheet({ what: "link", saved: true });
        return null;
      }
      return sendDisk({
        send: (choice) => DISKS.send(beat.id, choice),
        ask: () => SendNote.ask(beat, where),
        askRules: () => SendNote.askRules(where),
      });
    },
    // A disk that didn't fit at sign-in: which kept disk it replaces is asked, never assumed
    onFull: (beat, kept) =>
      DiskChooser.ask({
        beats: kept,
        from: document.querySelector("#disk-box"),
        title: beat.title,
      }),
  });
  DISK_BOX.init();
  const SAVE_KEY = new SaveKey({
    disks: DISKS,
    onFull: async () =>
      DiskChooser.ask({ beats: await DISKS.list(), from: document.querySelector("#disk-box") }),
    onSaved: () => DISK_BOX.refresh(),
    onNamed: (namer, id, overId) => DISK_BOX.takeIn(namer, id, overId),
  });
  SAVE_KEY.init();
  // A crate beat on its way to being flipped: it is put on the desk, as a flip is the desk as it stands
  const fromCrate = async ({ id }) => {
    // Unsaved work is asked about first, as when a disk is loaded
    const { opened, full, beat, missing } = await DISKS.openOver(id, () => KeepNote.ask());
    if (full) SAVE_KEY.press();
    if (!opened) return false;
    OPENED_GONE.is = false;
    DISK_BOX.refresh();
    if (missing.length) Toast.show("Loaded, but some of its audio couldn't be fetched", "warning");
    return true;
  };
  // A beat played where it sits in the crate, whole: made on a desk of its own, out of
  // sight, so the pads keep what is on them (FR-CRATE-07, ADR-0033)
  let auditionDesk = null;
  const deskForAudition = () => {
    if (auditionDesk) return auditionDesk;
    const store = new Store();
    const engine = new AudioEngine(audioCtx);
    const groove = new GrooveController(store, engine);
    groove.init();
    const takeEngines = ["smp", "vox"].map(
      (lane) => new VoxEngine(store, engine, lane, AUDIO_JOBS),
    );
    takeEngines[1].tuneTo = takeEngines[0];
    const project = new Project({
      fetchLoop: loopBytes,
      store,
      audioEngine: engine,
      takeEngines,
      decode: (bytes) => decodeAudio(audioCtx, bytes),
    });
    const exporter = new AudioExporter(store, engine, groove);
    exporter.setTakeEngines(takeEngines);
    auditionDesk = { project, exporter };
    return auditionDesk;
  };
  const PREVIEW = new Audition({
    context: audioCtx,
    bounce: async (id) => {
      const beat = await loadBeat(DISKS.api, id, { listening: true });
      // Sent with its sounds: the loop its maker's desk bounced, as it is. The files
      // it was made from never leave its maker (ADR-0042)
      if (beat.mix) return heardLoop(id, beat.mix);
      // Sent without them: the pattern and the feel, on the stock drums
      const { project, exporter } = deskForAudition();
      await project.restore(beat);
      const loop = await exporter.bounceLoop();
      return loop && { channels: loop.channels, sampleRate: loop.sampleRate };
    },
  });
  /** A sent beat's loop, fetched and ready to go round */
  const heardLoop = async (id, mix) =>
    loopOf(await decodeAudio(audioCtx, await DISKS.api.getAudio(mix.sha256, id)), LOOP_BARS);
  // A disk going out with its sounds, or saved again while it is out: its loop is bounced
  // out of sight on the desk auditions are made on, in its turn, and put with it
  DISKS.mixer = (id) =>
    PREVIEW.alone(async () => {
      const { project, exporter } = deskForAudition();
      await project.restore(await loadBeat(DISKS.api, id, { listening: true }));
      const loop = await exporter.bounceLoop({ quiet: true });
      if (loop) await sendMix(DISKS.api, id, encodeWav(loop.channels, loop.sampleRate));
    });
  const CRATE = new Crate({
    disks: DISKS,
    onFlip: async (beat) => {
      // Asked before anything is put on the desk. Signed in on the sheet, the flip has been
      // made by the time it is gone; put away, the crate comes back up at this sleeve
      const asked = await gate("flip", { id: beat.id });
      if (asked) return asked === "in";
      if (!(await fromCrate(beat))) return false;
      await flip();
      // A flip that was refused leaves their beat to be listened to, in the room
      showTag();
      return true;
    },
    onPreview: async ({ id, updatedAt }) => {
      // Only one thing plays at a time: the desk gives way to the crate
      if (APP_STORE.getState().transport.isPlaying) APP_STORE.dispatch({ type: "TOGGLE_PLAY" });
      // Heard here, it is a play on its maker's count (FR-REACH-02)
      const started = await PREVIEW.play(id, updatedAt);
      if (started) USAGE.heard(id, (heard) => DISKS.api.playBeat(heard));
      return started;
    },
    // Made while the sleeve is looked at, so the first press of PLAY IT HERE is heard at once
    onReady: ({ id, updatedAt }) => {
      PREVIEW.make(id, updatedAt, () => CRATE.picked === id).catch((error) => {
        // Taken back since the crate was read: gone before a key is pressed on it
        if (error.code === "not_available") CRATE.drop(id);
      });
      // A sleeve pulled and looked at, heard or not
      USAGE.count("crate");
    },
    onQuiet: () => PREVIEW.stop(),
  });
  CRATE.init();
  // What this desk saves, sends or takes back is in the crate at once, here as anywhere (FR-CRATE-08)
  DISKS.onOut = () => CRATE.refresh();
  // What the day's beats have been like, once a visit, with the way into the crate (FR-REACH-05)
  new PulseToast({
    fetch: () => DISKS.api.pulse(),
    isBusy: () =>
      APP_STORE.getState().transport.isPlaying ||
      Boolean(CRATE.open) ||
      Room.up !== null ||
      document.querySelector(".tour") !== null,
    canDig: () => CRATE.beats.length > 0,
    onDig: () => CRATE.unlock(),
  }).init();
  // And the crate gives way to the desk
  APP_STORE.subscribeToSelector(
    (s) => s.transport.isPlaying,
    (playing) => {
      if (!playing || !PREVIEW.playing) return;
      PREVIEW.stop();
      CRATE.hush();
      Room.hush();
    },
  );
  new SaveNudge({
    store: APP_STORE,
    disks: DISKS,
    isBusy: () => document.querySelector(".tour") !== null,
  }).init();
  // Who this browser is: the account button in the header, and the sheet that deals with email
  const ACCOUNT = new Account({ api: DISKS.api, disks: DISKS });
  // What is done for a sign-in that was waited on, by what was reached for (FR-ACC-13)
  const RESUME = {
    flip: async ({ id }) => {
      if (!id) return;
      // Their beat is in the room already, or is fetched to the desk as the crate does
      if (DISKS.visiting?.id !== id && !(await fromCrate({ id }))) return;
      await flip();
      showTag();
    },
  };
  /**
   * The sign-in sheet, and what follows from it.
   * @param {{what?: string, saved?: boolean}} [why] - What was reached for
   * @returns {Promise<"in"|"sent"|null>} Signed in here by the code; an email out; put away
   */
  const signInSheet = async (why) => {
    const got = await AccountSheet.signIn(ACCOUNT, why);
    if (!got) return null;
    // The link was opened in another tab: that desk has the beat and does what was asked
    if (got.elsewhere) return "sent";
    if (!got.signedIn) {
      ACCOUNT_MENU.linkSent(got.email);
      LcdMessage.show(["Email sent", "Check your inbox"], 5000);
      return "sent";
    }
    // Arriving is the other half of leaving: you are set down in the corner, your disks in the box
    ACCOUNT_MENU.linkSent(null);
    ACCOUNT_MENU.press();
    CRATE.refresh();
    await DISK_BOX.setDown();
    await welcomeIn({ left: got.left });
    return "in";
  };
  const sendLink = () => signInSheet();
  // The beat on the pads is put on a disk before anyone is sent to their inbox, where it can
  // be: true when it is on one as it stands
  const holdBeat = async () => {
    if (DISKS.visiting || DISKS.busy) return false;
    if (!PROJECT.isDirty()) return DISKS.disk !== null;
    try {
      const { saved } = await DISKS.save();
      if (saved) DISK_BOX.refresh();
      return saved;
    } catch {
      // Offline, or refused: the beat is still on the pads, and the sheet doesn't say it is saved
      return false;
    }
  };
  // Nobody is sent to their inbox for what would only be refused when they got back: empty
  // pads, a swing dial at zero. Those say so themselves, as they always have
  const nothingToTake = (what) => {
    if (what === "flip") return false;
    if (what === "groove") return APP_STORE.getState().humanizeValue === 0;
    if (what === "link") return !DISKS.visiting && !DISKS.disk && !PROJECT.isDirty();
    return MIDI_EXPORTER.build() === null;
  };
  /**
   * Ask for sign-in where what was reached for asks it of this person (FR-ACC-13).
   * @param {string} what
   * @param {{id?: string}} [about] - The beat a flip is of
   * @returns {Promise<false|"in"|"sent"|"away">} False when nothing was asked. Otherwise what
   *   was reached for is done after the sign-in, not by the caller: "in" when they signed in
   *   on the sheet and it is done, "sent" with an email out, "away" when the sheet was put away
   */
  const gate = async (what, about = {}) => {
    if (!asks(what, DISKS.user) || nothingToTake(what)) return false;
    const saved = await holdBeat();
    USAGE.count("gate");
    rememberAsk(window.localStorage, { what, ...about });
    const how = await signInSheet({ what, saved });
    // Put away with nothing sent: nothing waits
    if (how === null) forgetAsk(window.localStorage);
    return how ?? "away";
  };
  const ACCOUNT_MENU = new AccountMenu({
    account: ACCOUNT,
    disks: DISKS,
    onSignIn: sendLink,
    // Signing out is seen to happen: the machine is switched off while the disks leave with
    // you, and switched on again as nobody's
    onLeaving: async () => {
      if (APP_STORE.getState().transport.isPlaying) document.querySelector("#play-btn").click();
      await Promise.all([DISK_BOX.carryOff(), PowerCycle.down()]);
    },
    onSignedOut: async () => {
      await PowerCycle.up();
      CRATE.refresh();
      await DISK_BOX.setDown();
    },
  });
  ACCOUNT_MENU.init();
  // A guest's disks are held by this browser, not kept: the sign by SAVE says how (ADR-0035)
  new HeldSign({ disks: DISKS, onSignIn: sendLink }).init();

  // Opened from an emailed link: the key comes out of the address bar and is handed over
  const takeKey = () => {
    const key = keyFrom(window.location.hash);
    if (key) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    return key;
  };
  // The beat being made stays with whoever is making it: a sign-in link opens a new tab, and
  // the desk in the old one hands its beat over to it (ADR-0040)
  const HANDOVER =
    "BroadcastChannel" in window
      ? new Handover({
          channel: new BroadcastChannel(HANDOVER_CHANNEL),
          carry: () => {
            if (DISKS.busy || DISKS.visiting || !(PROJECT.isDirty() || DISKS.disk)) return null;
            const dirty = PROJECT.isDirty();
            return { snapshot: PROJECT.snapshot(DISKS.disk?.title), disk: DISKS.disk, dirty };
          },
          // This desk falls quiet and learns who the browser now is; its beat is on the other
          onGiven: async () => {
            if (APP_STORE.getState().transport.isPlaying)
              document.querySelector("#play-btn").click();
            await ACCOUNT.catchUp().catch(() => {});
            // The code was not needed after all
            AccountSheet.putAway();
            ACCOUNT_MENU.linkSent(null);
            ACCOUNT_MENU.press();
            DISK_BOX.refresh();
            LcdMessage.show(["Signed in", "Your beat is on the new tab"], 8000);
          },
        })
      : null;
  // Signed in, by the link or by the code: what was waiting for it is done
  const welcomeIn = async ({ left, carried = false }) => {
    // A send that was waiting for this picks up where it left off
    const waiting = pendingSend(window.localStorage);
    if (waiting && !ACCOUNT.user.guest) DISK_BOX.sendById(waiting);
    LcdMessage.show(
      [
        `Signed in: ${ACCOUNT.user.name}`,
        carried ? "Your beat came with you" : `${DISKS.tally()} disks, kept safe`,
      ],
      5000,
    );
    // The box was full: what didn't fit lies on top of it, and the first is asked about (ADR-0038)
    if (left) await DISK_BOX.offerWaiting();
    // What was reached for when sign-in was asked is done now, without a second press
    const asked = pendingAsk(window.localStorage);
    if (asked && !ACCOUNT.user.guest) await RESUME[asked.what]?.(asked);
  };
  const signInWith = async (key, { arrived = false } = {}) => {
    try {
      const { left } = await ACCOUNT.redeem(key);
      // Arriving is the other half of leaving: you are set down in the corner, your disks in the box
      ACCOUNT_MENU.press();
      CRATE.refresh();
      await DISK_BOX.setDown();
      // Arrived by the link in a tab of its own: the beat from the desk that asked comes too
      const carried = arrived ? await HANDOVER?.ask() : null;
      if (carried) {
        const missing = await DISKS.adopt(carried);
        if (missing.length)
          Toast.show("Some of the beat's audio couldn't be brought over", "warning");
        showTag();
        DISK_BOX.refresh();
      }
      await welcomeIn({ left, carried: Boolean(carried) });
    } catch (error) {
      const dead = error.code === "link_dead";
      Toast.show(
        dead
          ? "That sign-in link was used or ran out. Ask for a new one."
          : "Couldn't sign you in. Open the link again.",
        "warning",
      );
      DISK_BOX.refresh();
    }
  };
  const firstKey = takeKey();
  // Once the beat it spoke of is on no disk and isn't visiting, the tape comes off
  DISKS.onChange(() => {
    // Their beat has left the desk: the room goes with it
    if (!DISKS.visiting) Room.hide();
    if (!DISKS.visiting && !DISKS.disk && !OPENED_GONE.is) BeatTag.hide();
  });
  // On a screen too small for the desk a beat's link gets a player card; the
  // card is only fetched there
  let player = null;
  /** The loop of the beat a link opened, where it was sent with its sounds: { id, sha256 } */
  let openedMix = null;
  const playerFor = async () => {
    if (!TOO_SMALL.matches) return null;
    if (!player) {
      const { Player } = await import("./components/Player.js");
      // A phone plays the beat as one bounced loop, not note by note against the clock:
      // nothing is left to stutter once it has started (ADR-0036)
      const tape = new Audition({
        context: audioCtx,
        bounce: async () => {
          // Someone else's beat, sent with its sounds: their loop, as their desk bounced it
          if (openedMix) return heardLoop(openedMix.id, openedMix);
          const loop = await AUDIO_EXPORTER.bounceLoop();
          return (
            loop && {
              channels: loop.channels,
              sampleRate: loop.sampleRate,
              barSeconds: loop.barSeconds,
            }
          );
        },
      });
      player = new Player({
        store: APP_STORE,
        context: audioCtx,
        tape: {
          make: () => tape.make("tape").catch(() => {}),
          play: async () => ((await tape.play("tape")) ? tape.sounding : null),
          stop: () => tape.stop(),
        },
      }).init();
    }
    return player;
  };
  const showPlayer = async (beat) => {
    const card = await playerFor();
    if (!card) return;
    // The drum sounds are fetched now, so the play key answers at once
    AUDIO_ENGINE.loadSamples();
    card.show({
      title: beat.title,
      bpm: beat.bpm,
      by: beat.by ?? DISKS.user,
      link: beatLink(window.location.origin, beat.id),
      flips: DISKS.flips,
      listFlips: () => DISKS.api.listFlips(beat.id),
    });
  };
  // Opened from a beat's link: that beat goes on the pads, with a tag saying whose it is
  const openBeat = async (id) => {
    try {
      const { beat, missing } = await DISKS.open(id);
      openedMix = beat.mix ? { id: beat.id, ...beat.mix } : null;
      showPlayer(beat);
      // A phone turned on its side, or a window made smaller, gets the card then
      TOO_SMALL.addEventListener("change", () => {
        if (!player) showPlayer(beat);
        showRoom();
      });
      LcdMessage.show([`Loaded: ${beat.title}`, `${beat.bpm} bpm`], 5000);
      showTag();
      if (missing.length)
        Toast.show("Loaded, but some of its audio couldn't be fetched", "warning");
    } catch (error) {
      if (error.code !== "not_available") {
        Toast.show("Couldn't fetch that beat. Open the link again.", "warning");
        return;
      }
      OPENED_GONE.is = true;
      BeatTag.gone();
      (await playerFor())?.gone();
      LcdMessage.show(["Not available", "That beat was taken back"], 5000);
    }
  };
  DISKS.start().then(async () => {
    if (firstKey) await signInWith(firstKey, { arrived: true });
    else DISK_BOX.refresh();
    CRATE.refresh();
    if (OPENED_BEAT) openBeat(OPENED_BEAT);
    // Disks sent before loops were kept get theirs now, one at a time, without a word
    if (DISKS.user && !TOO_SMALL.matches) {
      for (const beat of mixesOwed(await DISKS.list().catch(() => []))) {
        await DISKS.mixer(beat.id).catch(() => {});
      }
    }
  });
  // The link opened in a tab the desk is already in: the page doesn't load again
  window.addEventListener("hashchange", () => {
    const key = takeKey();
    if (key) signInWith(key);
  });
  // A handle for trying things from the console (local only)
  if (window.location.hostname === "localhost")
    window.knockbox = {
      project: PROJECT,
      disks: DISKS,
      account: ACCOUNT,
      usage: USAGE,
      power: PowerCycle,
    };

  // MIDI export — bakes humanized timing + velocity + ghosts into a .mid download
  const MIDI_EXPORTER = new MidiExporter(APP_STORE, AUDIO_ENGINE, GROOVE_CONTROLLER);
  // Audio bounce — the same performance rendered to WAV, as a mix or as stems
  const AUDIO_EXPORTER = new AudioExporter(APP_STORE, AUDIO_ENGINE, GROOVE_CONTROLLER);
  AUDIO_EXPORTER.setTakeEngines([LOOP_ENGINE, VOX_ENGINE]);

  // The cassette is the tape deck: "Export as" on its label opens the list of formats
  const cassette = document.querySelector(".cassette--export");
  new BounceMenu({
    button: document.querySelector("#export-menu-btn"),
    menu: document.querySelector("#export-menu"),
  }).init();
  const cassetteConfirm = cassette.querySelector(".cassette-confirm");
  const confirmBounce = (text) => {
    cassetteConfirm.textContent = text;
    cassette.classList.add("is-confirming");
    setTimeout(() => cassette.classList.remove("is-confirming"), 1800);
  };
  // The J-card under the tape lists what the last bounce made, to drag out
  const TAPE_TRAY = new TapeTray(document.querySelector(".cassette-tray"));
  // Reels turn for as long as the offline render takes
  const bounceAudio = async (bounce, label, what) => {
    cassette.classList.add("is-rendering");
    const result = await bounce();
    cassette.classList.remove("is-rendering");
    if (!result) return;
    USAGE.count(what);
    confirmBounce(label);
    TAPE_TRAY.show(result.files);
  };

  const midiBtn = document.querySelector("#export-midi-btn");
  midiBtn.addEventListener("click", () => {
    const file = MIDI_EXPORTER.export();
    if (!file) return;
    USAGE.count("midi");
    confirmBounce("MIDI ON TAPE · 4 tracks");
    TAPE_TRAY.show([{ ...file, name: file.filename, label: "midi" }]);
  });
  // MIDI is made in an instant, so the line itself can be dragged straight
  // off the cassette into a DAW, with nothing bounced first
  let draggedMidiUrl = null;
  midiBtn.addEventListener("dragstart", (e) => {
    const file = MIDI_EXPORTER.build();
    if (!file) {
      e.preventDefault();
      Toast.show("Add some hits to the pattern first", "warning");
      return;
    }
    if (draggedMidiUrl) URL.revokeObjectURL(draggedMidiUrl);
    draggedMidiUrl = URL.createObjectURL(new Blob([file.bytes], { type: file.mime }));
    setDragFile(e, file.mime, file.filename, draggedMidiUrl);
  });

  const GROOVE_EXPORTER = new GrooveExporter(APP_STORE, MIDI_EXPORTER);
  RESUME.groove = () => {
    const groove = GROOVE_EXPORTER.export();
    if (!groove) return;
    downloadBytes(groove.bytes, groove.filename, groove.mime);
    USAGE.count("groove");
    confirmBounce("GROOVE ON TAPE · zip");
    TAPE_TRAY.show(groove.files);
  };
  RESUME.wav = () =>
    bounceAudio(() => AUDIO_EXPORTER.exportMix(), "WAV ON TAPE · 4-bar loop", "wav");
  RESUME.stems = () =>
    bounceAudio(() => AUDIO_EXPORTER.exportStems(), "STEMS ON TAPE · zip", "stems");
  // MIDI goes straight out. What leaves as sound, or as the feel alone, asks a guest to
  // sign in first, and is made once they have (FR-ACC-13)
  for (const what of ["wav", "stems", "groove"]) {
    document.querySelector(`#export-${what}-btn`).addEventListener("click", async () => {
      if (!(await gate(what))) RESUME[what]();
    });
  }
  // CLIP — the loop as a video to post, signed with whose beat it is (FR-REACH-01)
  const CLIP_EXPORTER = new ClipExporter({
    audioExporter: AUDIO_EXPORTER,
    describe: async () => {
      const beat = DISKS.visiting ?? DISKS.disk;
      const who = DISKS.visiting?.by ?? DISKS.user;
      // Its own link only once it is out; a beat still in the box has none to give
      const out =
        Boolean(DISKS.visiting) ||
        (DISKS.disk !== null &&
          (await DISKS.list().catch(() => [])).some((kept) => kept.id === beat.id && kept.sentAt));
      return {
        title: beat?.title ?? "untitled",
        by: who?.name ?? "",
        face: who ? faceUrl(who.face) : null,
        link: clipLink(out ? beat.id : null),
        out,
      };
    },
  });
  // Share: what other people open. A link to the beat, or a video of it (FR-REACH-06)
  new BounceMenu({
    button: document.querySelector("#share-btn"),
    menu: document.querySelector("#share-menu"),
  }).init();
  const videoBtn = document.querySelector("#share-video-btn");
  // Offered only where the browser can make an MP4
  clipRoute().then((route) => {
    videoBtn.hidden = !route;
  });
  RESUME.video = () =>
    bounceAudio(() => CLIP_EXPORTER.export(), "CLIP ON TAPE · ready to post", "clip");
  // A link is to a disk: the beat on the pads is put on one first, and then it is sent as
  // SEND on the disk sends it, through the same note
  RESUME.link = async () => {
    if (DISKS.visiting)
      return Toast.show("This one isn't yours to send. Flip it first.", "warning");
    if (!(await holdBeat())) return SAVE_KEY.press();
    await DISK_BOX.share(DISKS.disk.id);
  };
  for (const what of ["link", "video"]) {
    document.querySelector(`#share-${what}-btn`).addEventListener("click", async () => {
      if (!(await gate(what))) RESUME[what]();
    });
  }

  // LCD bindings — sync the chassis display with live state
  const lcdEls = {
    bpm: document.querySelector('.lcd .v[data-bind="bpm"]'),
    step: document.querySelector('.lcd .v[data-bind="step"]'),
    mode: document.querySelector('.lcd .v[data-bind="mode"]'),
    humanize: document.querySelector('.lcd .v[data-bind="humanize"]'),
  };
  const setLcd = (key, value) => {
    if (lcdEls[key]) lcdEls[key].textContent = value;
  };
  // Initial values from current state
  const _s0 = APP_STORE.getState();
  setLcd("bpm", String(_s0.transport.bpm).padStart(3, " "));
  setLcd("step", "--");
  setLcd("mode", (_s0.grooveSettings?.hihatMode || "friction").toUpperCase());
  setLcd("humanize", `${_s0.humanizeValue ?? 0}%`);
  // Live subscriptions
  APP_STORE.subscribeToSelector(
    (s) => s.transport.bpm,
    (bpm) => setLcd("bpm", String(bpm).padStart(3, " ")),
  );
  // MODE cell shows the hi-hat feel, or the articulation while a NOTE REPEAT key is down
  const ART_LCD_NAMES = {
    flam: "FLAM",
    drag: "DRAG",
    roll2: "ROLL x2",
    roll3: "ROLL x3",
    trip: "TRIPLET",
  };
  const updateLcdMode = () => {
    const s = APP_STORE.getState();
    setLcd(
      "mode",
      ART_LCD_NAMES[s.armedArt] || (s.grooveSettings?.hihatMode || "friction").toUpperCase(),
    );
  };
  APP_STORE.subscribeToSelector((s) => s.grooveSettings?.hihatMode, updateLcdMode);
  APP_STORE.subscribeToSelector((s) => s.armedArt, updateLcdMode);

  // NOTE REPEAT keys — latch one, then tap pads to paint flams, drags and rolls
  const noteRepeat = document.querySelector("#note-repeat");
  noteRepeat.addEventListener("click", (e) => {
    const key = e.target.closest(".mode-btn");
    if (!key) return;
    APP_STORE.dispatch({ type: "SET_ARMED_ART", payload: key.dataset.art || null });
  });
  APP_STORE.subscribeToSelector(
    (s) => s.armedArt,
    (armedArt) => {
      noteRepeat.querySelectorAll(".mode-btn").forEach((key) => {
        key.classList.toggle("active", (key.dataset.art || null) === armedArt);
      });
    },
  );
  APP_STORE.subscribeToSelector(
    (s) => s.humanizeValue,
    (v) => setLcd("humanize", `${v ?? 0}%`),
  );

  // Desk microphone — tap to record over the loop, or drop a file on it.
  // While a take is being made the LCD's MODE cell shows the count-in and bar.
  const MIC = new MicProp({
    store: APP_STORE,
    audioCtx,
    voxEngine: VOX_ENGINE,
    loopEngine: LOOP_ENGINE,
    recorder: new VoxRecorder(audioCtx),
    selector: "#vox-mic",
    startPlayback: () => {
      if (!APP_STORE.getState().transport.isPlaying) document.querySelector("#play-btn").click();
    },
    setPadsMuted: (muted) => {
      GROOVE_CONTROLLER.suspended = muted;
    },
    playClick: (time, accent) => AUDIO_ENGINE.playClick(time, accent),
    setDrumSample: (track, buffer) => {
      const sampleKey = TRACK_TO_SAMPLE_KEY[track];
      AUDIO_ENGINE.replaceSample(buffer, sampleKey);
      window.dispatchEvent(new CustomEvent("sample-replaced", { detail: { sampleKey } }));
    },
    onStatus: (text) => (text ? setLcd("mode", text) : updateLcdMode()),
  });
  // A take row's list sends for the mic: record again, load another
  for (const lane of TAKE_LANES) lane.mic = MIC;
  MIC.init();

  // The drummer thinks aloud: of a loop, of drums, and of the takes he brings (ADR-0058)
  const THOUGHT = new DrummerThought({
    store: APP_STORE,
    loopEngine: LOOP_ENGINE,
    voxEngine: VOX_ENGINE,
    jobs: AUDIO_JOBS,
    ownSound: (track) => AUDIO_ENGINE.hasCustomSample(TRACK_KEYS[track]),
    onDid: (what) => USAGE.count(what),
  });
  THOUGHT.init();
  // A beat is saved without what he has on trial (ADR-0073)
  PROJECT.standing = (state) => THOUGHT.standing(state);

  // The records built-in loops are kept on (ADR-0088). Until the list is in, and where it
  // is empty, the desk has nothing of them: no key on the loop's screen, no way into the box
  // A loop off a record is heard over the beat before it is taken, on a voice of its own:
  // the row keeps what is on it, and a loop already there is hushed meanwhile
  const LOOP_TRY = new LoopTry({
    context: audioCtx,
    dest: AUDIO_ENGINE.output,
    fetchBuffer: async (ref) =>
      audioCtx.decodeAudioData(await (await fetchLoop(ref)).arrayBuffer()),
    stretch: (channels, ratio, sampleRate) =>
      AUDIO_JOBS.run("stretch", { channels, ratio, sampleRate }),
    getBpm: () => APP_STORE.getState().transport.bpm,
  });
  const RECORDS = new RecordBox({
    onOpen: () => USAGE.count("records"),
    onTry: async (picked) => {
      LOOP_ENGINE.suspended = Boolean(picked);
      if (!picked) return LOOP_TRY.stop();
      try {
        const heard = await LOOP_TRY.want(loopRef(picked.record.id, picked.loop.id), picked.loop);
        if (heard) USAGE.count("record_heard");
        if (heard && !APP_STORE.getState().transport.isPlaying) {
          document.querySelector("#play-btn").click();
        }
        return heard;
      } catch {
        Toast.show("Couldn't fetch that loop. Try again.", "warning");
        return false;
      }
    },
    onUse: async ({ record, loop }) => {
      try {
        const got = await fetchLoop(loopRef(record.id, loop.id));
        const file = new File([await got.blob()], `${loop.id}.wav`, { type: "audio/wav" });
        MIC.loadFile(file, { asLoop: true, from: loopRef(record.id, loop.id) });
        USAGE.count("record_used");
      } catch {
        Toast.show("Couldn't fetch that loop. Try again.", "warning");
      }
    },
  });
  RECORD_LIST.then((list) => {
    if (list.length === 0) return;
    for (const lane of TAKE_LANES) {
      lane.records = RECORDS;
      lane.update();
    }
    // The records lying on the desk are the way in, where the desk is big enough to show them
    const fan = document.querySelector(".prop-lp-fan");
    if (!fan) return;
    fan.classList.add("is-tool");
    fan.setAttribute("role", "button");
    fan.setAttribute("tabindex", "0");
    fan.setAttribute("aria-label", "Records");
    fan.addEventListener("click", () => RECORDS.open());
    fan.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      RECORDS.open();
    });
  });

  // An audio file dropped anywhere on the desk (other than on a drum row,
  // which takes it as that drum's sample) goes onto the sample row. Catching
  // it here also stops a missed drop from navigating the page away.
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length !== 1 || e.target.closest?.(".sample-drop-zone, #vox-mic")) return;
    MIC.loadFile(files[0], { asLoop: true });
  });

  // Initialize clock with groove controller callback
  const CLOCK = new Clock({
    audioContext: audioCtx,
    getTempo: () => APP_STORE.getState().transport.bpm,
    onTick: (step, time, totalSteps) => {
      GROOVE_CONTROLLER.handleTick(step, time, totalSteps);
      LOOP_ENGINE.handleTick(totalSteps, time);
      VOX_ENGINE.handleTick(totalSteps, time);
      LOOP_TRY.handleTick(totalSteps, time);
      MIC.onTick(step, time, totalSteps);

      // Steps are scheduled ahead of time; the lights wait for the sound
      const untilHeard = time + (audioCtx.outputLatency || 0) - audioCtx.currentTime;
      setTimeout(
        () => {
          if (!CLOCK.isPlaying) return;
          // No desk to light
          if (NO_DESK) return;
          for (const lane of TAKE_LANES) lane.updatePlayhead(totalSteps);
          GRID.updatePlayhead(step);
          // A switched bar's step lights run dimmer, so the eye knows which bar it is (ADR-0078)
          const { switched } = barOf(APP_STORE.getState(), Math.floor(totalSteps / 16));
          document.body.classList.toggle("is-switched-bar", switched);
          // ...and the notes he adds at the turn are shown on their pads while that bar plays (ADR-0079)
          GRID.showTurn(GROOVE_CONTROLLER.turnPads(Math.floor(totalSteps / 16)));
          setLcd("step", String(step + 1).padStart(2, "0"));
        },
        Math.max(0, untilHeard * 1000),
      );
    },
  });
  if (NO_DESK) CLOCK.scheduleAheadTime = PLAYER_AHEAD_SECONDS;

  // Tempo input handler
  document.querySelector("#tempo-input").addEventListener("change", (e) => {
    e.preventDefault();
    const currentTempo = APP_STORE.getState().transport.bpm;
    const tempoVal = parseFloat(Number.parseFloat(e.target.value).toFixed(2));
    if (tempoVal === 0 || Number.isNaN(tempoVal)) {
      e.target.value = currentTempo;
    } else {
      APP_STORE.dispatch({
        type: "SET_TEMPO",
        payload: tempoVal,
      });

      // Update animation speed based on new BPM
      window.dispatchEvent(
        new CustomEvent("bpm-update", {
          detail: { bpm: tempoVal },
        }),
      );
    }
  });

  // Fire initial BPM event to set animation speed
  window.dispatchEvent(
    new CustomEvent("bpm-update", {
      detail: { bpm: APP_STORE.getState().transport.bpm },
    }),
  );

  // How it works: a sheet over the desk, opened from the header, with the keys and the tour
  const howButton = document.querySelector("#how-btn");
  const how = document.querySelector("#how");
  const showHow = (shown) => {
    if (how.hidden === !shown) return;
    how.hidden = !shown;
    howButton.setAttribute("aria-expanded", String(shown));
    if (shown) how.querySelector(".how-sheet").focus({ preventScroll: true });
    else howButton.focus({ preventScroll: true });
  };
  howButton.addEventListener("click", () => showHow(how.hidden));
  how.querySelector(".how-shut").addEventListener("click", () => showHow(false));
  // A press on the desk around the sheet puts it away
  how.addEventListener("pointerdown", (e) => {
    if (e.target === how) showHow(false);
  });
  how.addEventListener("keydown", (e) => {
    if (e.key === "Escape") showHow(false);
  });
  how.querySelector(".how-tour").addEventListener("click", () => {
    showHow(false);
    USAGE.count("tour");
    TOUR.start();
  });

  // Keyboard: the keys are listed in How it works, which ? opens
  const SHORTCUTS = new Shortcuts({
    lanes: TAKE_LANES,
    isBlocked: () =>
      TOO_SMALL.matches || Room.up !== null || document.querySelector(".tour") !== null,
    onHelp: () => showHow(how.hidden),
    // The row's own sound, even before the beat has ever been played: a key pressed while
    // the drum sounds are still on their way waits for them, never a stand-in tone (FR-DESK-14)
    onMute: (track) => APP_STORE.dispatch({ type: "TOGGLE_TRACK_MUTE", payload: track }),
    onHit: async (track) => {
      audioCtx.resume();
      await AUDIO_ENGINE.loadSamples().catch(() => {});
      AUDIO_ENGINE.scheduleNote(audioCtx.currentTime, TRACK_TO_PITCH[track]);
    },
  });
  SHORTCUTS.init();
  // What the T key and the arrows do to the tempo, a finger does too (ADR-0050): TAP is
  // pressed in time, and the readout is dragged up or down. Timed from the press going
  // down, not coming up; a key press on TAP (detail 0) counts as one too
  const tapBtn = document.querySelector("#tap-btn");
  tapBtn.addEventListener("pointerdown", (e) => SHORTCUTS.tap(e.timeStamp));
  tapBtn.addEventListener("click", (e) => e.detail === 0 && SHORTCUTS.tap(e.timeStamp));
  tempoDrag(document.querySelector("#tempo-input"), (bpm) => SHORTCUTS.setTempo(bpm));
  // The drum sounds are fetched at the first touch of the desk, so the keys answer at once
  const warmDrums = () => AUDIO_ENGINE.loadSamples().catch(() => {});
  document.addEventListener("pointerdown", warmDrums, { once: true });
  document.addEventListener("keydown", warmDrums, { once: true });

  // On a phone the desk is covered by a note; its one key copies the link
  const copyLinkBtn = document.querySelector(".too-small-copy");
  copyLinkBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyLinkBtn.textContent = "Copied — see you at the desk";
    } catch {
      copyLinkBtn.textContent = location.host;
    }
  });

  // Clear pattern button handler
  document.querySelector("#clear-btn").addEventListener("click", () => {
    APP_STORE.dispatch({ type: "RESET_STEPS" });
  });

  // Reset samples button handler
  const resetSamplesBtn = document.querySelector("#reset-samples-btn");

  // Update button state based on custom samples
  const updateResetBtnState = () => {
    const hasCustom = AUDIO_ENGINE.customSamples.size > 0;
    resetSamplesBtn.classList.toggle("has-custom", hasCustom);
  };

  // Listen for custom sample changes
  window.addEventListener("sample-replaced", updateResetBtnState);

  resetSamplesBtn.addEventListener("click", () => {
    if (AUDIO_ENGINE.customSamples.size === 0) {
      Toast.show("No custom samples to reset", "info");
      return;
    }

    AUDIO_ENGINE.resetSamples();
    // Tells each row's readout (and this button) what changed
    window.dispatchEvent(new CustomEvent("sample-replaced"));
    Toast.show("Samples restored to defaults", "success");
  });

  // Hi-hat mode toggle handler
  const hihatToggle = document.querySelector("#hihat-mode-toggle");
  if (hihatToggle) {
    hihatToggle.addEventListener("click", (e) => {
      const modeBtn = e.target.closest(".mode-btn");
      if (!modeBtn) return;

      const mode = modeBtn.dataset.mode;
      APP_STORE.dispatch({ type: "SET_HIHAT_MODE", payload: mode });
    });
    // The lit key follows the desk, whoever set the mode: a press, the drummer, a loaded beat
    APP_STORE.subscribeToSelector(
      (s) => s.grooveSettings?.hihatMode,
      (mode) => {
        for (const btn of hihatToggle.querySelectorAll(".mode-btn")) {
          btn.classList.toggle("active", btn.dataset.mode === (mode || "friction"));
        }
      },
    );
  }

  // Play button handler
  const playBtn = document.querySelector("#play-btn");

  playBtn.addEventListener("click", async () => {
    const isPlaying = APP_STORE.getState().transport.isPlaying;

    APP_STORE.dispatch({
      type: "TOGGLE_PLAY",
    });

    if (isPlaying) {
      CLOCK.stop();
      AUDIO_ENGINE.cancelScheduled();
      MIC.stop();
      // A loop being tried off a record stops with the beat
      RECORDS.letGo();
      for (const lane of TAKE_LANES) lane.updatePlayhead(-1);
      document.body.classList.remove("is-switched-bar");
      GRID.showTurn([]);
      Avatar.pause();
      playBtn.classList.remove("is-playing");
      playBtn.textContent = "▶ Play";
      setLcd("step", "--");
    } else {
      // Wake up the audio context (browsers suspend it by default)
      await audioCtx.resume();

      // Load drum samples (only loads once, subsequent calls are no-op)
      await AUDIO_ENGINE.loadSamples();

      // Stopped again while that was loading
      if (!APP_STORE.getState().transport.isPlaying) return;

      // Start the Clock and Avatar animation
      CLOCK.start();
      Avatar.play();
      playBtn.classList.add("is-playing");
      playBtn.textContent = "■ Stop";
    }
  });

  // Boot sequence — power-on animation that orchestrates the LCD boot messages,
  // the scene-prop entrance staggers (driven by CSS animation-delay), and the
  // pad self-test sweep before declaring the machine "powered-on".
  runBootSequence();
}

// The drummer and what he says come into view over this long after power-on
const ARRIVING_MS = 1500;
// The props are still landing for a moment after power-on
const TOUR_DELAY_MS = 1600;
// How often the time the desk has been in view is added up (Usage.passed)
const STAY_TICK_SECONDS = 15;
// Screens the desk doesn't fit on; matches the .too-small rule in main.css
const TOO_SMALL = window.matchMedia("(max-width: 899px), (max-height: 480px)");
const TOUR = new Tour();
// The link this desk was opened from led nowhere: the tape that says so stays up
const OPENED_GONE = { is: false };
const FLIP_REFUSALS = {
  box_full: "Your disk box is full. Bin a disk to make room for a flip.",
  not_available: "That beat was taken back before you could flip it.",
  offline: "Couldn't reach the server. Nothing was flipped.",
  slow_down: "Too many new desks from here today. Try again tomorrow.",
};
// The beat this address opens, when it is a beat's link (/b/<id>)
const OPENED_BEAT = beatIdFrom(window.location.pathname);
// Loaded where the desk doesn't fit: its heavy part (the head-bobber) is left out
const NO_DESK = TOO_SMALL.matches;
// ...and with a beat's link, the player card is all there is
const PLAYER_ONLY = NO_DESK && OPENED_BEAT !== null;
// How far ahead the card's beat is scheduled, in seconds. Nothing on the card
// changes the beat, so it can be well ahead: a phone's main thread stalls for
// longer than the desk's 0.2s, and a tab in the background ticks once a second
const PLAYER_AHEAD_SECONDS = 1.2;

async function runBootSequence() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const lcdBoot = document.querySelector(".lcd-boot");
  const trackRows = document.querySelectorAll(".track-row");

  // The room is dark, then its lamp comes on: a pool of light on the middle of the desk, the
  // sampler in it and not yet on. Where there is no desk (a phone) there is no room to light.
  const room = !reducedMotion && !NO_DESK;
  await sleep(room ? DARK_MS : 0);
  document.body.classList.add("lamp-on");
  await sleep(room ? LAMP_MS : 0);
  // Then the sampler finds its power, and the room fills in slowly around it while it boots
  document.body.classList.add("room-lit", "power-on-detected");

  // Its words while it boots, READY last
  const messages = reducedMotion ? [{ text: "READY", delay: 50 }] : BOOT_WORDS;

  if (lcdBoot) {
    for (const msg of messages) {
      lcdBoot.textContent = msg.text;
      await sleep(msg.delay);
    }
  }

  // Pad self-test sweep — fire each track row in sequence, each row's
  // .self-test class lights every pad in the row briefly before settling
  // into the pads as they stand when .powered-on is added.
  if (!reducedMotion) {
    for (const row of trackRows) {
      row.classList.add("self-test");
      await sleep(ROW_MS);
    }
    await sleep(SWEEP_REST_MS);
  }

  // Power on — LCD cells become visible, brand LED begins pulsing, every pad reveals its
  // real state, and the rest of the desk comes into view: its props, the keys along its
  // front edge and the drummer. From here the desk answers (holdTheDesk).
  document.body.classList.add("powered-on", "is-arriving");
  setTimeout(() => document.body.classList.remove("is-arriving"), ARRIVING_MS);

  // Clear the self-test sweep so .step.active styling takes over cleanly
  await sleep(reducedMotion ? 0 : 40);
  for (const row of trackRows) {
    row.classList.remove("self-test");
  }

  // A first-time visitor gets shown around once the desk has settled
  await sleep(reducedMotion ? 0 : TOUR_DELAY_MS);
  // Someone who came for a beat should be playing it within seconds, not being shown around
  if (!TOO_SMALL.matches && !OPENED_BEAT) TOUR.startIfNew();
}

// Until the sampler says READY nothing on the desk answers; a phone's card is not the desk
if (!NO_DESK) holdTheDesk(window, () => document.body.classList.contains("powered-on"));
Init();
