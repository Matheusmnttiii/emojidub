/**
 * library.js — EmojiDub
 * Gerencia a biblioteca de dublagens salvas
 * Persiste no localStorage quando disponível
 */

const Library = (() => {

  const STORAGE_KEY = 'emojidub_library_meta'; // guarda metadados (blobs não persistem)
  let items = {}; // { [emoji_glyph]: { ...data, blob, url } }
  let playingKey = null;

  // ── CRUD ──────────────────────────────────────────────
  function add(entry) {
    items[entry.emoji] = { ...entry };
    _persistMeta();
  }

  function get(glyph) {
    return items[glyph] || null;
  }

  function remove(glyph) {
    if (items[glyph]) {
      // Revoga URL de objeto para liberar memória
      if (items[glyph].url) {
        try { URL.revokeObjectURL(items[glyph].url); } catch (_) {}
      }
      delete items[glyph];
      _persistMeta();
    }
  }

  function count() {
    return Object.keys(items).length;
  }

  function has(glyph) {
    return !!items[glyph];
  }

  function getAll() {
    return { ...items };
  }

  // ── Persistência (apenas metadados — blobs são temporários) ──
  function _persistMeta() {
    try {
      const meta = Object.entries(items).reduce((acc, [k, v]) => {
        acc[k] = {
          emoji:    v.emoji,
          name:     v.name,
          duration: v.duration,
          savedAt:  v.savedAt,
          pitch:    v.pitch,
          rate:     v.rate,
        };
        return acc;
      }, {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch (_) {}
  }

  // ── Reprodução ────────────────────────────────────────
  function playItem(glyph) {
    const item = items[glyph];
    if (!item) return;

    stopPlay();

    playingKey = glyph;
    render();

    // Pulsa o card da grade
    _highlightEmojiCard(glyph, true);

    Audio.play(
      item.blob || item.url,
      { pitch: item.pitch, rate: item.rate, volume: item.volume || 0.8 },
      () => {
        playingKey = null;
        render();
        _highlightEmojiCard(glyph, false);
        UI.setStatus('pronto');
      }
    );

    UI.setStatus(`▶ tocando dublagem: ${item.name}`);
  }

  function stopPlay() {
    if (playingKey) {
      _highlightEmojiCard(playingKey, false);
    }
    playingKey = null;
    Audio.stop();
    render();
  }

  function _highlightEmojiCard(glyph, on) {
    const cp = glyph.codePointAt(0);
    const card = document.getElementById(`ecard-${cp}`);
    if (card) {
      if (on) card.classList.add('playing-now');
      else    card.classList.remove('playing-now');
    }
  }

  // ── Download ──────────────────────────────────────────
  function download(glyph) {
    const item = items[glyph];
    if (!item || !item.blob) {
      UI.showToast('Blob não disponível — recarregue a página', 'error');
      return;
    }

    const ext  = _blobExtension(item.blob);
    const name = `emojidub-${item.name.toLowerCase().replace(/\s+/g, '-')}-${glyph.codePointAt(0)}${ext}`;
    const a    = document.createElement('a');
    a.href     = item.url || URL.createObjectURL(item.blob);
    a.download = name;
    a.click();

    UI.showToast(`Download iniciado: ${name}`, 'success');
  }

  function _blobExtension(blob) {
    if (blob.type.includes('webm')) return '.webm';
    if (blob.type.includes('ogg'))  return '.ogg';
    if (blob.type.includes('mp4'))  return '.mp4';
    return '.audio';
  }

  // ── Render ─────────────────────────────────────────────
  function render() {
    const grid = document.getElementById('libGrid');
    const keys = Object.keys(items);

    if (!keys.length) {
      grid.innerHTML = `
        <div class="empty-lib">
          nenhuma dublagem salva ainda<br>
          grave um emoji e clique em 💾 Salvar!
        </div>`;
      return;
    }

    grid.innerHTML = keys.map(k => {
      const it = items[k];
      const isPlaying = playingKey === k;
      return `
        <div class="lib-item ${isPlaying ? 'lib-playing' : ''}"
             role="listitem"
             onclick="Library.playItem('${k}')"
             aria-label="Tocar dublagem de ${it.name}">
          <span class="lib-emoji" aria-hidden="true">${it.emoji}</span>
          <span class="lib-name">${it.name}</span>
          <span class="lib-dur">⏱ ${it.duration}s</span>
          <div class="lib-actions" onclick="event.stopPropagation()">
            <button class="lib-btn"
                    onclick="Library.playItem('${k}')"
                    aria-label="Tocar ${it.name}">▶</button>
            <button class="lib-btn"
                    onclick="Library.download('${k}')"
                    aria-label="Baixar ${it.name}">⬇</button>
            <button class="lib-btn del"
                    onclick="Library.confirmDelete('${k}')"
                    aria-label="Excluir ${it.name}">✕</button>
          </div>
        </div>`;
    }).join('');
  }

  function confirmDelete(glyph) {
    const item = items[glyph];
    if (!item) return;
    if (!confirm(`Excluir a dublagem de "${item.name}"?`)) return;

    if (playingKey === glyph) stopPlay();
    remove(glyph);
    render();
    UI.renderGrid();
    UI.setStatus('dublagem removida da biblioteca');
    document.getElementById('statusRight').textContent = `${count()} dublagem(ns) salva(s)`;

    // Se era o emoji selecionado no estúdio, limpa
    const sel = Studio.getSelected();
    if (sel && sel.e === glyph) Studio.clear();
  }

  return {
    add,
    get,
    has,
    remove,
    count,
    getAll,
    playItem,
    stopPlay,
    download,
    render,
    confirmDelete,
  };

})();
