/**
 * audio.js — EmojiDub
 * Motor de áudio: gravação, reprodução e visualização de waveform
 */

const Audio = (() => {

  let audioCtx = null;
  let analyser = null;
  let animFrame = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let currentAudioEl = null;
  let stream = null;

  // ── Inicialização ──────────────────────────────────────
  function init() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Retoma o contexto se suspenso (política de autoplay)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ── Microfone ─────────────────────────────────────────
  async function getMic() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      return stream;
    } catch (err) {
      console.error('[Audio] Mic access denied:', err);
      throw new Error('Permissão de microfone negada. Por favor, permita o acesso e tente novamente.');
    }
  }

  function releaseMic() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  // ── Gravação ──────────────────────────────────────────
  async function startRecording(onData, onStop) {
    const ctx = init();
    const micStream = await getMic();

    // Conecta analyser para waveform ao vivo
    const source = ctx.createMediaStreamSource(micStream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    audioChunks = [];
    const options = { mimeType: getSupportedMimeType() };
    mediaRecorder = new MediaRecorder(micStream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.push(e.data);
        if (onData) onData(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const mimeType = getSupportedMimeType();
      const blob = new Blob(audioChunks, { type: mimeType });
      releaseMic();
      if (onStop) onStop(blob);
    };

    mediaRecorder.start(100); // Coleta chunks a cada 100ms
    return mediaRecorder;
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    cancelAnimationFrame(animFrame);
  }

  function getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }

  // ── Reprodução ────────────────────────────────────────
  function play(blobOrUrl, { pitch = 1.0, rate = 1.0, volume = 0.8 } = {}, onEnd) {
    const ctx = init();

    // Para reprodução anterior
    stop();

    const url = blobOrUrl instanceof Blob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
    currentAudioEl = new window.Audio(url);
    currentAudioEl.playbackRate = rate;
    currentAudioEl.volume = volume;

    try {
      const source = ctx.createMediaElementSource(currentAudioEl);

      // Pitch shift usando playbackRate (simples)
      // Para pitch real precisaria de Web Audio API PitchShifter
      source.connect(ctx.destination);
    } catch (e) {
      // Se já conectado, usa direto
      currentAudioEl.volume = volume;
    }

    currentAudioEl.play().catch(err => console.warn('[Audio] Play error:', err));

    currentAudioEl.onended = () => {
      if (onEnd) onEnd();
    };

    return currentAudioEl;
  }

  function stop() {
    if (currentAudioEl) {
      currentAudioEl.pause();
      currentAudioEl.currentTime = 0;
      currentAudioEl = null;
    }
  }

  function isPlaying() {
    return currentAudioEl && !currentAudioEl.paused;
  }

  // ── Waveform ao vivo ──────────────────────────────────
  function drawLiveWaveform(canvas) {
    if (!analyser) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    canvas.height = 120;

    const buffer = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      animFrame = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(buffer);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradiente da linha
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0,   'rgba(240,165,0,0.4)');
      grad.addColorStop(0.5, 'rgba(255,107,53,0.9)');
      grad.addColorStop(1,   'rgba(240,165,0,0.4)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const sliceWidth = canvas.width / buffer.length;
      let x = 0;

      for (let i = 0; i < buffer.length; i++) {
        const v = buffer[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    draw();
  }

  function drawFlatWaveform(canvas, color = '#2ed573') {
    cancelAnimationFrame(animFrame);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = color + 'aa';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const pts = 80;
    const seed = Math.random() * 100;

    for (let i = 0; i <= pts; i++) {
      const x = (i / pts) * canvas.width;
      const noise = Math.sin(i * 0.6 + seed) * Math.sin(i * 1.3) * 14;
      const y = canvas.height / 2 + noise;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  function clearWaveform(canvas) {
    cancelAnimationFrame(animFrame);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return {
    init,
    startRecording,
    stopRecording,
    play,
    stop,
    isPlaying,
    drawLiveWaveform,
    drawFlatWaveform,
    clearWaveform,
  };

})();
