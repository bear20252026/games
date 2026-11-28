/**
 * TapeTray
 * The cassette's J-card: after a bounce, the files that were made are
 * listed on a card under the tape as strips of masking tape. Each strip can
 * be dragged out of the browser (into a DAW or a folder) or clicked to save
 * it on its own. The card holds the last bounce only.
 */

// Dragging a file out of the page is a Chromium feature
const CAN_DRAG_OUT = "chrome" in window;

export class TapeTray {
  /** @param {HTMLElement} root - The (hidden) card element */
  constructor(root) {
    this.root = root;
    this.urls = [];
    this.root.addEventListener("dragstart", (e) => {
      const strip = e.target.closest?.(".tray-strip");
      if (strip) setDragFile(e, strip.dataset.mime, strip.download, strip.href);
    });
  }

  /**
   * Replace what is on the card.
   * @param {Array<{name: string, label: string, mime: string, bytes: Uint8Array}>} files
   */
  show(files) {
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls = [];
    this.root.replaceChildren();

    const heading = document.createElement("p");
    heading.className = "tray-heading";
    heading.textContent = CAN_DRAG_OUT ? "drag into your DAW ↗" : "click one to save it";
    this.root.append(heading);

    for (const file of files) {
      const url = URL.createObjectURL(new Blob([file.bytes], { type: file.mime }));
      this.urls.push(url);
      const strip = document.createElement("a");
      strip.className = "tray-strip";
      strip.href = url;
      strip.download = file.name;
      strip.draggable = true;
      strip.dataset.mime = file.mime;
      strip.dataset.tooltip = CAN_DRAG_OUT
        ? `${file.name} — drag it out, or click to save`
        : `${file.name} — click to save`;
      strip.textContent = file.label;
      this.root.append(strip);
    }
    this.root.hidden = false;
  }
}

/**
 * Make a drag carry a real file out of the browser.
 * @param {DragEvent} e - A dragstart event
 */
export function setDragFile(e, mime, name, url) {
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("DownloadURL", `${mime}:${name}:${url}`);
}
