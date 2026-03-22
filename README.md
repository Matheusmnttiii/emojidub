# 🎭 EmojiDub — Sua voz, seu emoji

> Duble emojis com sua própria voz, igual ao My Voice Zoo — mas com emojis!

---

## Como funciona

1. **Selecione** um emoji na grade
2. Leia a **dica de dublagem** e se inspire
3. Clique **⏺ Gravar** — o microfone captura sua voz em tempo real com waveform animada
4. Ouça a **prévia** com os ajustes de Pitch, Velocidade e Volume
5. **Salve** na biblioteca — o emoji ganha o ícone 🎙
6. Na **biblioteca**, clique em qualquer emoji para tocar sua dublagem, baixar ou excluir

---

## Estrutura do projeto

```
emojidub/
├── index.html          # Markup principal
├── css/
│   └── style.css       # Todo o CSS (dark studio aesthetic)
├── js/
│   ├── data.js         # Banco de dados de emojis e personalidades
│   ├── audio.js        # Motor de áudio (gravação, reprodução, waveform)
│   ├── studio.js       # Lógica do estúdio de dublagem
│   ├── library.js      # Gerencia a biblioteca de dublagens salvas
│   ├── ui.js           # Renderização da interface
│   └── main.js         # Inicialização da aplicação
└── README.md
```

---

## Requisitos técnicos

| API               | Uso                              | Suporte                      |
|-------------------|----------------------------------|------------------------------|
| `getUserMedia`    | Acesso ao microfone              | Chrome 53+, Firefox 36+, Safari 14+ |
| `MediaRecorder`   | Gravação de áudio                | Chrome 47+, Firefox 29+      |
| `Web Audio API`   | Waveform ao vivo, playback       | Todos os browsers modernos   |
| `localStorage`    | Persistência de metadados        | Universal                    |

> **Nota**: Blobs de áudio não persistem entre sessões (limitação do browser). Os metadados (nome, duração) são salvos no localStorage, mas as gravações ficam na memória enquanto a aba estiver aberta.

---

## Emojis incluídos (20)

| Emoji | Nome            | Personalidade              |
|-------|-----------------|----------------------------|
| 😂    | Gargalhada      | Risada explosiva           |
| 😭    | Choro Dramático | Teatral, exagerado         |
| 😡    | Furiosa         | Raiva pura, bufante        |
| 😴    | Sonâmbulo       | Bocejando, arrastado       |
| 🤩    | Maravilhado     | Empolgação extrema         |
| 🥺    | Carente         | Fofa, suplicante           |
| 😱    | Apavorada       | Horror, chocada            |
| 🤣    | Histérica       | Rindo rolando no chão      |
| 😏    | Debochado       | Irônico, arrogante         |
| 🥰    | Apaixonada      | Derretendo de amor         |
| 😤    | Indignado       | Bufando de indignação      |
| 🤔    | Pensativo       | Reflexivo, pensando alto   |
| 🎉    | Festeiro        | Eufórico de festa          |
| 😎    | Coolzão         | Confiante, estiloso        |
| 🤯    | Mente Explodida | Incrédulo, caótico         |
| 😫    | Exausta         | Completamente esgotada     |
| 🤗    | Calorosa        | Acolhedora, calorosa       |
| 😬    | Constrangido    | Awkward, nervoso           |
| 🥹    | Emocionada      | Segurando o choro          |
| 😆    | Alegre          | Feliz, risonho             |

---

## Como rodar

### Opção 1 — Servidor local (recomendado)

```bash
# Python 3
python -m http.server 8080

# Node.js (com npx)
npx serve .

# PHP
php -S localhost:8080
```

Acesse `http://localhost:8080` no browser.

> ⚠️ **Não abra o `index.html` diretamente como arquivo** (`file://`). O `getUserMedia` requer HTTPS ou `localhost` para funcionar.

### Opção 2 — Deploy estático

Faça upload de todos os arquivos para qualquer host estático:
- **Netlify**: arraste a pasta para [netlify.com/drop](https://netlify.com/drop)
- **Vercel**: `npx vercel`
- **GitHub Pages**: push para branch `gh-pages`

---

## Roadmap / Expansões futuras

### V2 — Efeitos de voz por IA
- [ ] Integração com ElevenLabs API para transformação de voz
- [ ] Pitch shifting real via Web Audio API (PitchShifter node)
- [ ] Reverb com ConvolverNode
- [ ] Distorção emocional automática por emoji

### V3 — Social & Compartilhamento
- [ ] Exportar como `.mp3` / `.ogg` via FFmpeg.wasm
- [ ] Link de compartilhamento com preview de áudio
- [ ] Ranking das melhores dublagens da comunidade
- [ ] Reações em tempo real (WebSockets)

### V4 — SDK & Integrações
- [ ] SDK JavaScript para embed em qualquer plataforma
- [ ] Plugin para WhatsApp Web (extensão Chrome)
- [ ] API REST para integração mobile
- [ ] Webhook para envio de áudio em chats

### V5 — Marketplace
- [ ] Upload de pacotes de vozes da comunidade
- [ ] Vozes de celebridades (com permissão)
- [ ] Monetização de criadores de vozes
- [ ] Sistema de licenciamento

---

## Licença

MIT — use, modifique e distribua à vontade.

---

*Criado com ❤️ e muita voz*
