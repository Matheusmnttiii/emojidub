/**
 * main.js — EmojiDub
 * Ponto de entrada: inicialização da aplicação
 */

(function init() {

  // ── Verificações de suporte ────────────────────────────
  function checkSupport() {
    const warnings = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      warnings.push('getUserMedia não suportado — grave num browser moderno (Chrome, Firefox, Safari 14+)');
    }

    if (!window.MediaRecorder) {
      warnings.push('MediaRecorder não suportado — use Chrome 47+ ou Firefox 29+');
    }

    if (!window.AudioContext && !window.webkitAudioContext) {
      warnings.push('Web Audio API não suportada — use um browser moderno');
    }

    if (warnings.length) {
      const msg = warnings.join('\n');
      console.warn('[EmojiDub]', msg);
      UI.showToast('⚠️ ' + warnings[0], 'error');
    }

    return warnings.length === 0;
  }

  // ── Atalhos de teclado ────────────────────────────────
  function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Espaço ou Enter no botão de gravação quando estúdio aberto
      if (e.key === 'Escape') {
        Audio.stop();
        Library.stopPlay();
        UI.setStatus('reprodução interrompida');
      }
    });
  }

  // ── Inicialização ─────────────────────────────────────
  function boot() {
    console.log('[EmojiDub] Inicializando...');

    // Renderiza grade de emojis
    UI.renderGrid();

    // Renderiza biblioteca vazia
    Library.render();

    // Verifica suporte do browser
    const supported = checkSupport();

    // Keyboard shortcuts
    bindKeyboard();

    // Status inicial
    UI.setStatus('pronto para gravar · selecione um emoji acima');

    if (supported) {
      console.log('[EmojiDub] ✓ Todos os recursos suportados');
    }

    console.log(`[EmojiDub] ${EMOJI_DATA.length} emojis carregados`);
  }

  // Aguarda DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
