/**
 * studio.js — EmojiDub
 * Lógica do estúdio de dublagem: gravar, ouvir, salvar, descartar
 */

const Studio = (() => {

  // Estado
  let state = {
    selectedEmoji: null,
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    recSeconds: 0,
    timerInterval: null,
    MAX_REC_SECONDS: 15,
  };

  // ── Seleção de emoji ──────────────────────────────────
  function selectEmoji(glyph) {
    const emoji = EMOJI_DATA.find(e => e.e === glyph);
    if (!emoji) return;

    // Para qualquer gravação/reprodução em andamento
    if (state.isRecording) _forceStopRecording();
    Audio.stop();
    Library.stopPlay();

    state.selectedEmoji = emoji;
    state.audioBlob = null;
    state.audioUrl = null;

    // Popula a UI do estúdio
    _showStudio(emoji);

    // Se já existe dublagem salva, carrega
    const saved = Library.get(glyph);
    if (saved) {
      state.audioBlob = saved.blob;
      state.audioUrl = URL.createObjectURL(saved.blob);
      _setRecZoneState('has-audio');
      _setRecHint('<strong>Dublagem existente carregada!</strong><br>Ouça, ou grave novamente para substituir.');
      _setBtnState({ preview: true, save: true, clear: true });
      UI.setStatus(`dublagem carregada para ${emoji.name} · clique ouvir`);
    } else {
      _setRecZoneState('');
      _setRecHint('<strong>Grave sua dublagem!</strong><br>Clique em gravar e faça o som do emoji com sua voz.');
      _setBtnState({ preview: false, save: false, clear: false });
      UI.setStatus(`estúdio pronto · grave a voz do ${emoji.name}`);
    }

    // Aplica defaults de pitch/rate do emoji
    document.getElementById('pitchSlider').value = emoji.defaultPitch || 1.0;
    document.getElementById('rateSlider').value  = emoji.defaultRate  || 1.0;
    UI.updateMod('pitchVal', emoji.defaultPitch || 1.0, '×');
    UI.updateMod('rateVal',  emoji.defaultRate  || 1.0, '×');
  }

  function _showStudio(emoji) {
    document.getElementById('studioEmpty').style.display   = 'none';
    document.getElementById('studioContent').style.display = 'block';
    document.getElementById('stEmoji').textContent = emoji.e;
    document.getElementById('stName').textContent  = emoji.name;
    document.getElementById('stDesc').textContent  = emoji.desc;
    document.getElementById('stHint').textContent  = emoji.hint;

    const tagsEl = document.getElementById('stTags');
    tagsEl.innerHTML = (emoji.tags || []).map(t => `<span class="stag">${t}</span>`).join('');
  }

  // ── Gravação ──────────────────────────────────────────
  async function toggleRecord() {
    if (state.isRecording) {
      _stopRecording();
    } else {
      await _startRecording();
    }
  }

  async function _startRecording() {
    if (!state.selectedEmoji) return;

    try {
      UI.setStatus('🔴 gravando · aguardando áudio do microfone...');
      _setRecZoneState('recording');
      _setRecHint('<strong>Gravando...</strong><br>Faça o som do emoji — seja criativo!');

      const recBtn = document.getElementById('btnRec');
      recBtn.textContent = '⏹ Parar';
      recBtn.classList.add('recording');

      const timer = document.getElementById('recTimer');
      timer.classList.add('visible');
      state.recSeconds = 0;
      timer.textContent = '00:00';

      state.timerInterval = setInterval(() => {
        state.recSeconds++;
        const m = String(Math.floor(state.recSeconds / 60)).padStart(2, '0');
        const s = String(state.recSeconds % 60).padStart(2, '0');
        timer.textContent = `${m}:${s}`;
        if (state.recSeconds >= state.MAX_REC_SECONDS) _stopRecording();
      }, 1000);

      // Começa gravação de áudio
      await Audio.startRecording(
        null,
        (blob) => _onRecordingStop(blob)
      );

      // Waveform ao vivo
      Audio.drawLiveWaveform(document.getElementById('waveCanvas'));

      state.isRecording = true;
      UI.setStatus('🔴 gravando · máximo 15 segundos · clique parar quando pronto');

    } catch (err) {
      _setRecZoneState('');
      UI.setStatus('erro: ' + err.message);
      UI.showToast('Microfone bloqueado — permita o acesso nas configurações do browser', 'error');
      _resetRecBtn();
    }
  }

  function _stopRecording() {
    if (!state.isRecording) return;
    state.isRecording = false;
    clearInterval(state.timerInterval);
    Audio.stopRecording();
    _resetRecBtn();
    document.getElementById('recTimer').classList.remove('visible');
  }

  function _forceStopRecording() {
    state.isRecording = false;
    clearInterval(state.timerInterval);
    Audio.stopRecording();
    _resetRecBtn();
    document.getElementById('recTimer').classList.remove('visible');
  }

  function _onRecordingStop(blob) {
    state.audioBlob = blob;
    state.audioUrl  = URL.createObjectURL(blob);

    _setRecZoneState('has-audio');
    _setRecHint('<strong>Pronto! 🎉</strong><br>Ouça sua dublagem, ajuste os efeitos e salve na biblioteca.');
    _setBtnState({ preview: true, save: true, clear: true });

    // Desenha waveform estático (representação da gravação)
    Audio.drawFlatWaveform(document.getElementById('waveCanvas'));

    UI.setStatus('gravação concluída · ouça e salve!');
    UI.showToast('Gravação concluída!', 'success');
  }

  function _resetRecBtn() {
    const recBtn = document.getElementById('btnRec');
    recBtn.textContent = '⏺ Regravar';
    recBtn.classList.remove('recording');
  }

  // ── Preview ───────────────────────────────────────────
  function preview() {
    if (!state.audioBlob && !state.audioUrl) return;
    Audio.stop();

    const pitch  = parseFloat(document.getElementById('pitchSlider').value);
    const rate   = parseFloat(document.getElementById('rateSlider').value);
    const volume = parseFloat(document.getElementById('volSlider').value) / 100;

    Audio.play(
      state.audioBlob || state.audioUrl,
      { pitch, rate, volume },
      () => UI.setStatus('pronto · ouça novamente ou salve')
    );

    UI.setStatus(`▶ reproduzindo dublagem de ${state.selectedEmoji?.name || ''}`);
  }

  // ── Salvar ────────────────────────────────────────────
  function save() {
    if (!state.audioBlob || !state.selectedEmoji) {
      UI.showToast('Nada para salvar — grave primeiro!', 'error');
      return;
    }

    const dur = state.recSeconds || Math.ceil(state.audioBlob.size / 8000);

    Library.add({
      emoji:    state.selectedEmoji.e,
      name:     state.selectedEmoji.name,
      blob:     state.audioBlob,
      url:      state.audioUrl,
      duration: Math.max(1, dur),
      pitch:    parseFloat(document.getElementById('pitchSlider').value),
      rate:     parseFloat(document.getElementById('rateSlider').value),
      volume:   parseFloat(document.getElementById('volSlider').value) / 100,
      savedAt:  new Date().toISOString(),
    });

    Library.render();
    UI.renderGrid();
    UI.showToast(`💾 ${state.selectedEmoji.name} salvo na biblioteca!`, 'success');
    UI.setStatus(`dublagem de ${state.selectedEmoji.name} salva · ${Library.count()} total`);
    document.getElementById('statusRight').textContent = `${Library.count()} dublagem(ns) salva(s)`;
  }

  // ── Descartar ─────────────────────────────────────────
  function clear() {
    if (state.isRecording) _forceStopRecording();
    Audio.stop();

    state.audioBlob = null;
    state.audioUrl  = null;

    _setRecZoneState('');
    _setRecHint('<strong>Grave sua dublagem!</strong><br>Clique em gravar e faça o som do emoji com sua voz.');
    _setBtnState({ preview: false, save: false, clear: false });

    const recBtn = document.getElementById('btnRec');
    recBtn.textContent = '⏺ Gravar';
    recBtn.classList.remove('recording');
    document.getElementById('recTimer').classList.remove('visible');

    Audio.clearWaveform(document.getElementById('waveCanvas'));
    UI.setStatus(`estúdio limpo · pronto para nova gravação`);
  }

  // ── Helpers de UI ─────────────────────────────────────
  function _setRecZoneState(state) {
    const zone = document.getElementById('recZone');
    zone.className = 'record-zone';
    if (state) zone.classList.add(state);
  }

  function _setRecHint(html) {
    document.getElementById('recHint').innerHTML = html;
  }

  function _setBtnState({ preview, save, clear }) {
    document.getElementById('btnPreview').disabled = !preview;
    document.getElementById('btnSave').disabled    = !save;
    document.getElementById('btnClear').style.display = clear ? 'inline-flex' : 'none';
  }

  // ── Getters ───────────────────────────────────────────
  function getSelected() { return state.selectedEmoji; }
  function hasRecording() { return !!state.audioBlob; }

  return {
    selectEmoji,
    toggleRecord,
    preview,
    save,
    clear,
    getSelected,
    hasRecording,
  };

})();
