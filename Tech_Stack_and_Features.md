# FridgeForager App: Tech Stack & Features Documentation

## 1. Technical Architecture

### Core Framework
- **Frontend Framework**: Next.js 16 (App Router based)
- **Language**: TypeScript
- **Styling Engine**: Tailwind CSS 4 (Zero-runtime utility class styling)
- **Runtime Environment**: Node.js

### Authentication & Security
- **Auth Provider**: Clerk (`@clerk/nextjs`)
- **Implements**: Secure Middleware, Protected Routes, User Sessions, and OAuth (Google/GitHub supported).

### Database Layer
- **Database**: PostgreSQL (Relational Database)
- **ORM (Object-Relational Mapping)**: Prisma 5.10.0 (Stable)
- **Data Models**:
  - `User`: Synchronized with Clerk auth ID.
  - `UserProfile`: Stores onboarding data (Allergies, Diet, Health Goals).
  - `Ingredient`: Stores scanned food items.
  - `Recipe`: Stores AI-generated recipes.

---

## 2. Artificial Intelligence Integration

The app uses a **Zero-Cost Multi-Model Architecture** via OpenRouter API.

### Vision AI (Ingredient Scanning)
- **Primary Model**: `qwen/qwen2.5-vl-72b-instruct:free`
- **Fallback Models**: `google/gemma-3-12b-it:free`, `nvidia/nemotron-nano-12b-v2-vl:free`
- **Functionality**:
  1. Captures camera frame as Base64.
  2. Sends to AI with a prompt to "Identify all edible items".
  3. Returns a JSON array with `name`, `quantity`, and `expiry_status`.

### Generative AI (Recipe Creation)
- **Primary Model**: `meta-llama/llama-3.3-70b-instruct:free`
- **Fallback Models**: `deepseek/deepseek-r1:free`, `mistralai/mistral-nemo:free`
- **Functionality**:
  1. Combines user's **Health Profile** (from DB) + **Scanned Ingredients**.
  2. Generates a structured JSON recipe ensuring safety (allergen awareness) and nutritional optimization.

---

## 3. Key Features

### 🌍 Application Internationalization (i18n)
- **Library**: `next-intl`
- **Implementation**: Middleware detects user locale (English `en` / Spanish `es`) and serves translated UI components.

### 🎥 Localized YouTube Recommendations
This feature dynamically finds cooking videos in the user's preferred language.

**How it works:**
1. **Trigger**: When a recipe is generated.
2. **Logic**: The backend constructs a specific search query.
   - Format: `"{Recipe Title} recipe in {Language}"`
   - *Example 1*: If user selects **Gujarati**, query = `"Dal Bati recipe in Gujarati"`
   - *Example 2*: If user selects **Spanish**, query = `"Paella recipe in Spanish"`
3. **API**: Calls **YouTube Data API v3** with this localized query string.
4. **Result**: Displays video thumbnails that match the user's linguistic preference.

### 🏠 Robust Onboarding Flow
- **One-Time Logic**: System checks database for existing profile.
- **Back-Button Trap**: Uses `history.pushState` to prevent users from accidentally navigating back to the onboarding screen after completion.
- **Session Persistence**: Uses a module-level fallback. If the database connection is unstable, the app remembers the "Completed" status in-memory for the session to prevent navigation loops.

### 📊 Health Dashboard
- Visualizes "Health Score" (1-10 based on ingredients).
- Tracks "Waste Saved" percentage.
- Displays history of cooked recipes.

### 📱 Progressive Web App (PWA)
- Uses `@ducanh2912/next-pwa`.
- Generating manifest and service workers to allow "Add to Home Screen" functionality on mobile devices.

---

## 4. Dependencies List (Summary)
- `next`, `react`, `react-dom`: Core UI.
- `@clerk/nextjs`: Auth.
- `@prisma/client`: Database access.
- `openai` (used for OpenRouter compatibility): AI client.
- `framer-motion`: Animations.
- `lucide-react`: Icons.
- `next-intl`: Translations.
