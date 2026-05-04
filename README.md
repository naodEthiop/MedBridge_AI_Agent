
<<<<<<< HEAD
---
```markdown
# 🏥 MedBridge — AI Healthcare Agent Platform
=======

MedBridge is a Next.js (App Router) + Tailwind v4 project styled from a Stitch design system (Sahara-inspired palette).
>>>>>>> bb3bce9 (chore: format README.md for better readability and structure)

> From symptoms to solutions — powered by AI agents.

MedBridge is an AI-powered healthcare agent system that connects patients and doctors through real-time triage, intelligent diagnostics support, and structured clinical insights. Built for the **Zero to Agent Hackathon**, it transforms healthcare into an AI-first, real-time, connected experience.

---

## 🚀 Problem

Healthcare systems today are:
- Slow and overloaded
- Fragmented across tools
- Hard for patients to navigate
- Lacking real-time clinical support

---

## 💡 Solution

MedBridge introduces an **AI agent-driven healthcare platform** that:

- Understands patient symptoms in natural language
- Provides intelligent triage (urgent / normal / self-care)
- Assists doctors with AI-generated summaries
- Syncs all data in real-time across the system

---

## ✨ Key Features

### 🧠 AI Medical Agent
- Symptom analysis using LLM reasoning
- Smart triage classification
- Context-aware medical guidance

### 👨‍⚕️ Doctor Dashboard
- AI-generated patient summaries
- Real-time updates on cases
- Clinical decision support tools

### 🏥 Patient Experience
- Smart symptom checker
- Instant AI feedback
- Guided care recommendations

### ⚡ Real-Time System
- Supabase real-time sync
- Event-driven updates (appointments, AI analysis, notes)
- No manual refresh required

---

## 🧱 Tech Stack

- **Frontend:** React / Next.js  
- **Backend:** Node.js / API Routes  
- **Database:** Supabase (PostgreSQL + Realtime)  
- **AI Layer:** LLM Agents (Gemini / OpenAI)  
- **Deployment:** Vercel  

---

## 🔁 System Flow

1. Patient enters symptoms  
2. AI agent analyzes input  
3. System determines urgency level  
4. Doctor dashboard updates instantly  
5. AI generates clinical insights  
6. Patient receives recommendations  

---

## 🧠 AI Architecture

MedBridge is built as a multi-agent system:

- Input Understanding Agent  
- Medical Reasoning Agent  
- Risk Scoring Engine  
- Doctor Assistant Agent  
- Real-Time Sync Agent  

---

## 📦 Project Structure

<<<<<<< HEAD
=======
---
```
---

---
```go

```
---

npm run dev
>>>>>>> bb3bce9 (chore: format README.md for better readability and structure)
---
```
---

/src
/ai            → AI agents & orchestration
/api           → backend endpoints
/components    → UI components
/hooks         → realtime logic
/services      → Supabase + AI services

<<<<<<< HEAD
=======
- The UI fetches data from Next.js route handlers under `src/app/api/*`.
- The server-side repository layer lives in `src/lib/server/repositories.ts`.
- If you set Supabase env vars, the API switches from mock data to Supabase automatically:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Routes (from Stitch screens)

- `/` Welcome to MedBridge AI
- `/onboarding` Patient Onboarding
- `/patient` Patient Dashboard
- `/patient/symptom-checker` Patient: AI Symptom Checker
- `/patient/scanners` Patient: AI Scanners
- `/patient/care-finder` Patient: Emergency & Care Finder
- `/patient/health-card` My Digital Health Card
- `/doctor` Doctor: Clinical Dashboard
- `/doctor/patients/[id]` Doctor: Patient Detail View
- `/provider/verification` Provider Verification

### Stitch sync

- Screen mapping manifest: `src/stitch/manifest.json`
- Sync all Stitch HTML exports:

---
```
---
npm run sync:stitch
>>>>>>> bb3bce9 (chore: format README.md for better readability and structure)
---
```
---

---

## 🔥 Why MedBridge

- Real AI agent system (not just API calls)
- Real-time clinical workflow simulation
- Solves a high-impact global healthcare problem
- Full-stack + AI + realtime integration
- Production-level architecture

---
<<<<<<< HEAD

## 🌍 Impact

MedBridge aims to:
- Reduce diagnosis delays
- Support overwhelmed healthcare systems
- Improve access to medical guidance
- Bring AI into real clinical workflows

---

## 🧪 Status

🚧 Hackathon Build — Zero to Agent

---

## 👨‍💻 Built With

Built with ❤️ for the **Zero to Agent Hackathon**  
Focused on AI agents, healthcare innovation, and real-world impact.

---

## 🏁 Vision

> “Healthcare should be instant, intelligent, and accessible to everyone.”
```
---
=======
---
```bash
npm run test:smoke
```
---
### Production build

---
```bash
npm run lint
npm run build
npm run start
```
---
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> bb3bce9 (chore: format README.md for better readability and structure)
