/**
 * Proportions —— 体格滑杆（大小 / 躯干粗细）
 *
 * 两个 range 控件 → 档位表 closestStep() → 回调 OverheadCat.setThickness()，
 * 同时写 localStorage（按猫种分别记）。restore() 在换猫时恢复该猫上次的体型。
 */

'use strict';
const { Proportions } = (() => {
  const storageKey = 'pet-the-cat.proportions.shared';
  const legacyKey = 'pet-the-cat.proportions.v1';
  function readSettings(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data && typeof data === 'object' && !Array.isArray(data)) return data;
    } catch {}
    return null;
  }
  const sizes = [65, 72, 79, 86, 93, 100, 103, 106, 108, 111, 114];
  const widths = [80, 84, 88, 92, 96, 100, 108, 116, 124, 132, 140];
  function closestStep(value, stops) {
    if (!Number.isFinite(value)) return 5;
    return stops.reduce(
      (best, stop, i) => (Math.abs(stop - value) < Math.abs(stops[best] - value) ? i : best),
      0,
    );
  }
  class Proportions {
    constructor(onChange) {
      const find = (id) => document.getElementById(id);
      this.onChange = onChange;
      this.dirty = false;
      this.toggle = find('proportions-toggle');
      this.panel = find('proportions-panel');
      this.size = find('cat-size');
      this.width = find('cat-width');
      this.toggle.addEventListener('click', (event) => {
        this.setOpen(this.panel.hidden);
        if (!this.panel.hidden && event.detail === 0) this.size.focus();
      });
      const closeOutside = (event) => {
        if (
          !this.panel.hidden &&
          !this.panel.contains(event.target) &&
          !this.toggle.contains(event.target)
        )
          this.setOpen(false);
      };
      document.addEventListener('pointerdown', closeOutside, true);
      document.addEventListener('focusin', closeOutside);
      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key !== 'Escape' || this.panel.hidden) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          this.setOpen(false);
          this.toggle.focus({ preventScroll: true });
        },
        true,
      );
      for (const input of [this.size, this.width]) {
        input.addEventListener('input', () => this.update());
        input.addEventListener('change', () => this.persist());
      }
      window.addEventListener('pagehide', () => this.persist());
    }
    restore(initialCat) {
      let saved = readSettings(storageKey);
      if (!saved) {
        const previous = readSettings(legacyKey);
        if (previous) {
          const valid = (item) =>
            item && (Number.isFinite(item.size) || Number.isFinite(item.width));
          saved = [previous[initialCat], ...Object.values(previous)].find(valid);
          this.dirty = Boolean(saved);
        }
      }
      this.size.value = closestStep(saved?.size, sizes);
      this.width.value = closestStep(saved?.width, widths);
      if (
        saved &&
        (saved.size !== sizes[this.size.value] || saved.width !== widths[this.width.value])
      )
        this.dirty = true;
      this.apply();
      this.persist();
    }
    setOpen(open) {
      this.panel.hidden = !open;
      this.toggle.setAttribute('aria-expanded', String(open));
      if (!open) this.persist();
    }
    apply() {
      const size = sizes[this.size.value];
      const width = widths[this.width.value];
      this.size.setAttribute('aria-valuetext', size + '%');
      this.width.setAttribute('aria-valuetext', width + '%');
      this.onChange(size / 100, width / 100);
    }
    update() {
      this.dirty = true;
      this.apply();
    }
    persist() {
      if (!this.dirty) return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ size: sizes[this.size.value], width: widths[this.width.value] }),
        );
      } catch {}
      this.dirty = false;
    }
  }
  return { Proportions };
})();
