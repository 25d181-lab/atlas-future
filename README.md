# Farmer's AI Ally

Build a full-stack MVP web application called **ATLAS** – The Decision Intelligence Infrastructure for Agriculture.

### Vision

ATLAS is an AI digital workforce for Indian farmers. Farmers interact only through WhatsApp voice notes (or a simulated WhatsApp chat in the demo). One voice command triggers a multi-agent system that checks crop health, finds the best market, negotiates price, reserves warehouse, books logistics, and prepares insurance — then asks the farmer for final approval before executing.

Tagline: “The farmer doesn’t operate AI. AI works for the farmer.”

### Core Demo Flow (Must work end-to-end)

1. Farmer sends a voice note or text: “I harvested 2 tons of tomatoes in [village name]”

2. ATLAS processes it through these specialized agents in sequence:

   - **AgroGuard**: Crop health & disease check

   - **Demand Agent**: Predicts best market & price

   - **Negotiation Agent**: Suggests optimal selling price

   - **Warehouse Agent**: Reserves nearest available cold storage

   - **Logistics Agent**: Books transport

   - **Insurance Agent**: Prepares claim readiness

   - **Digital Twin**: Runs “what-if” simulations (rain, price crash, full warehouse)

3. ATLAS replies with a clear summary + reasoning and asks: “Shall I proceed?”

4. Farmer says “Yes” → system confirms all actions are locked.

### Must-have Features for Hackathon Demo

- Beautiful dark-themed dashboard with green/gold accents (match the presentation style)

- Simulated WhatsApp chat interface on the left (voice note upload or text input + waveform animation)

- Live agent progress visualization (agents light up one by one as they work)

- Digital Twin panel showing scenario simulations

- Warehouse network map / capacity view (can be simulated)

- Final confirmation card with all actions taken

- Farmer profile + history of past decisions

- Toggle between “Farmer View” and “Admin/FPO Dashboard”

### Technical Requirements

- Frontend: Next.js 14+ (App Router) + Tailwind CSS + Framer Motion for smooth animations

- Backend: Next.js API routes or simple Node/Express

- AI: Use OpenAI / Groq / Anthropic for agent reasoning (make agents modular)

- Voice: Support text input + optional voice-to-text (Web Speech API or Whisper)

- State management: Zustand or React Context

- Mock realistic Indian agriculture data (tomato prices in major mandis, warehouse capacities near Bengaluru/Mysore, weather, etc.)

- Make the multi-agent system clearly visible and sequential (not just one big LLM call)

### UI Style

- Dark background (#0a0f0a or similar)

- Accent colors: gold/yellow for titles, green for success states

- Clean cards with soft glow effects

- Professional, futuristic but farmer-friendly

- Mobile responsive (important because farmers use phones)

### Extra Nice-to-haves (if time allows)

- Real-time capacity bars for warehouses

- Swarm intelligence example (disease alert to nearby farmers)

- Simple impact metrics (potential extra income, food waste reduced)

- Login as different roles (Farmer / FPO Manager / Admin)

### Important Notes

- Prioritize a working end-to-end demo over perfect backend integrations.

- Clearly mark simulated vs real data.

- Make the agent reasoning explainable (show short reasoning for each agent).

- Keep the farmer experience extremely simple — one message in, clear plan out.

Start by creating the complete project structure and the main dashboard + WhatsApp simulation interface. Then implement the sequential multi-agent flow.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://atlas-future.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/be871a10-2384-44b1-a905-99059814191c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
