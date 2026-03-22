/**
 * ui.js — EmojiDub
 * Renderização da interface: grade de emojis, status, toasts, helpers
 */

const UI = (() => {

  let toastTimer = null;

  // ── Grade de Emojis ───────────────────────────────────
  function renderGrid() {
    const grid = document.getElementById('emojiGrid');
    const selected = Studio.getSelected();

    grid.innerHTML = EMOJI_DATA.map(em => {
      const isSelected  = selected && selected.e === em.e;
      const hasDub      = Library.has(em.e);
      const cp          = em.e.codePointAt(0);

      return `
        <div
          class="ecard ${isSelected ? 'selected' : ''} ${hasDub ? 'has-voice' : ''}"
          id="ecard-${cp}"
          role="listitem"
          tabindex="0"
          aria-label="${em.name} — ${em.desc}"
          aria-pressed="${isSelected}"
          onclick="Studio.selectEmoji('${em.e}')"
          onkeydown="if(event.key==='Enter'||event.key===' ')Studio.selectEmoji('${em.e}')"
        >
          <span class="eglyph" aria-hidden="true">${em.e}</span>
          <span class="ename">${em.name}</span>
          <span class="etag">${em.tags?.[0] || ''}</span>
        </div>`;
    }).join('');
  }

  // ── Status bar ────────────────────────────────────────
  function setStatus(msg) {
    const el = document.getElementById('statusTxt');
    if (el) el.textContent = msg;
  }

  // ── Modifier sliders ──────────────────────────────────
  function updateMod(id, value, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = parseFloat(value).toFixed(1) + suffix;
  }

  // ── Toast notifications ───────────────────────────────
  function showToast(msg, type = '') {
    // Remove toast existente
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    clearTimeout(toastTimer);

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);

    // Anima entrada
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    // Remove após 3s
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  }

  return {
    renderGrid,
    setStatus,
    updateMod,
    showToast,
  };

})();
