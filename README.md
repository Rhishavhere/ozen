<div align="center">
  <img src="public/logo.svg" alt="Ozen Logo" width="120" />
  <h1>Ozen</h1>
  <p><strong>The Near-Invisible OS Layer for Local Intelligence</strong></p>

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?style=for-the-badge)](https://github.com/Rhishavhere/ozen)
[![Electron](https://img.shields.io/badge/Electron-30.0-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Local AI](https://img.shields.io/badge/Local_AI-Ollama-FF69B4?style=for-the-badge&logo=ollama)](https://ollama.com/)
[![Cloud AI](https://img.shields.io/badge/Cloud_AI-Groq-F55036?style=for-the-badge&logo=groq)](https://groq.com/)

</div>

<div align="center">
  
  | | | |
  |:---:|:---:|:---:|
  | ![AI Response](Docs/image%20copy.png) | ![Code Generation](Docs/image%20copy%202.png) | ![Web Search](Docs/image%20copy%203.png) |
</div>

---

## 🌊 Rethinking Interaction

There is a cognitive gap between **Action** and **Knowledge**. Today, using AI requires you to break your flow: leave your code, open a browser, switch tabs, and copy-paste.

**Ozen kills this gap.**

Ozen is not an app you "go to." It is a fluid layer that lives exactly where your cursor is. It appears when summoned, provides intelligence instantly, remembers your context permanently, and vanishes without a trace—returning you to your work with zero friction.

---

## ✨ Key Pillars

### 📍 Contextual Presence

Summon the AI Panel anywhere by typing `@ozen`. The interface spawns exactly at your cursor position. No window switching, no focus loss from your primary task.

![Ozen Input Bar](Docs/image.png)

### 💨 Zero-Friction Dismissal

Press `Esc` to instantly hide the panel. Ozen uses a "minimize-then-hide" orchestration to ensure focus is returned precisely to the application you were using before.

### 🧠 Persistent Semantic Memory

Powered by the **Membrain Semantic Memory Service**, Ozen doesn't just forget you after the chat ends. Ozen permanently understands your developer preferences, conversational context, and custom instructions through an advanced spatial knowledge graph that connects your historical interactions together.

### 🔮 The Orb

A minimalist, ambient status indicator that tracks your cursor. It provides a subtle visual signal that Ozen is ready to assist, then auto-fades into the background.

### 🏠 Local-First & Private

Powered by [Ollama](https://ollama.com/) running lightweight models locally on your machine. Your sensitive data never leaves your OS. It’s fast, private, and works offline. (Fallback to the lightning-fast Groq API is available when needed.)

![Local AI Code Generation](Docs/image%20copy%202.png)

---

## 🛠️ The "Magic" Interaction

1. **The `@ozen` Trigger**
   Type `@ozen` in any text field or application. Ozen detects this sequence globally and spawns the input bar right under your cursor.
2. **Selection Flow**
   Select any text and press `Shift + Enter`. Ozen captures the selection, opens the panel, and prepares to process the context immediately.
3. **Upward Expansion**
   The panel starts as a minimalist input bar. Upon query, it "zoops" upward into a full chat module, preserving your vertical context natively over your desktop windows.

![Web Search Perspective](Docs/image%20copy%203.png)

---

## 🏗️ Architecture

Ozen leverages Electron's multi-window orchestration capabilities to seamlessly run three concurrent rendering processes without draining system resources:

| Window        | Purpose                                       | Route      |
| ------------- | --------------------------------------------- | ---------- |
| **The Orb**   | Ambient status cursor tracking                | `/#/orb`   |
| **The Panel** | Floating interactive overlay                  | `/#/panel` |
| **The Hub**   | Settings, Membrain Visual Graph, & Full Chats | `/`        |

![Semantic Memory Graph](Docs/image%20copy%205.png)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Ollama CLI** (Ensure `ollama` is installed on your PATH)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rhishavhere/ozen.git
   cd ozen
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the default local AI model:
   ```bash
   ollama run gemma3:1b
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

---

## ⚖️ License & Credits

Built with ❤️ by [Rhishavhere](https://github.com/Rhishavhere).
Licensed under the [MIT License](LICENSE).
