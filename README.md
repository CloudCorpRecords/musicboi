# MusicBoi 🎵🤖

**Free, open-source AI-powered music creation for everyone.**

Professional audio tools like Final Cut Pro, Logic Pro, and Ableton Live cost hundreds of dollars. We believe music creation should be accessible to everyone, regardless of their budget. MusicBoi is our answer: a completely free, locally-run DAW with built-in AI music generation.

---

## ✨ Features

- **🤖 AI Music Generation** - Generate music from text prompts using Meta's MusicGen models. No subscriptions, no cloud costs, everything runs on YOUR machine.
- **🎛️ Full DAW Functionality** - Multi-track audio editing, effects rack (EQ, Compressor, Reverb, Delay, Distortion), and a mixing console.
- **💻 Runs Locally** - Your music, your computer, your privacy. No data leaves your machine.
- **🚀 One-Click Launch** - Electron-based desktop app that "just works".

## 🆓 Why Free?

Creative tools shouldn't be gatekept behind paywalls. Period.

Big companies charge $300-600 for software that runs on hardware YOU already own. We think that's ridiculous. MusicBoi uses open-source AI models and frameworks to give you professional-grade capabilities at zero cost.

**This is not a "freemium" product.** There are no paid tiers, no feature locks, no subscriptions. It's free because we believe it should be.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Python** 3.10+
- **~4GB RAM** (for AI model inference)

### Installation

```bash
# Clone the repo
git clone https://github.com/CloudCorpRecords/musicboi.git
cd musicboi

# Install dependencies and run
npm install
npm start
```

Or on Mac, just double-click `start.command`.

The first time you run the app, it will:
1. Set up a Python virtual environment
2. Let you download AI models on-demand (choose Small for speed, Large for quality)

---

## 🧠 AI Models

MusicBoi uses [MusicGen](https://huggingface.co/facebook/musicgen-small) from Meta AI. Models are downloaded to your local cache and managed through the app:

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| Small | ~1GB | Good | Fast |
| Medium | ~3GB | Better | Slower |
| Large | ~7GB | Best | Slowest |

---

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📖 Documentation improvements
- 🎨 UI/UX suggestions

Just fork, branch, and submit a PR. Let's make music creation accessible together.

---

## 📜 License

MIT License - Use it, modify it, share it, sell it. We don't care. Just make music.

---

## 💖 Support the Mission

If you believe in free creative tools:
- ⭐ Star this repo
- 🐦 Share it with musicians who can't afford expensive software
- 🛠️ Contribute code or ideas

**Music is for everyone. Let's keep it that way.**
