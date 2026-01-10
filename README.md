# CineMind Studio 🎬

**CineMind Studio** is an autonomous, multi-agent AI film production suite designed to transform simple story ideas or raw scripts into professional, greenlight-ready pitch packages.

Built with React and the Google Gemini API (`gemini-3-pro-preview`, `gemini-2.5-flash-image`), it simulates a real-world production office where specialized AI agents collaborate to develop your film.

## 🚀 Key Features

### 🤖 Autonomous Multi-Agent Pipeline
CineMind employs a sequential chain of specialized AI agents, each performing a distinct role in the production process:

1.  **Screenwriter Agent** ✍️
    *   **Generation**: Turns a one-sentence logline into a professionally formatted short film script.
    *   **Polishing**: Optionally rewrites, formats, and enhances dialogue for uploaded scripts.
2.  **Director Agent** 🎬
    *   Creates comprehensive character profiles (backstory, motivation, emotional arcs).
    *   Breaks down the script into a structural analysis (3-Act structure).
    *   Provides specific directorial notes on performance and theme.
3.  **Cinematographer Agent** 🎥
    *   Translates the director's vision into a technical shot list.
    *   Defines lighting styles (chiaroscuro, high-key, etc.), color palettes, and lens choices.
4.  **Producer Agent** 💰
    *   Analyzes production feasibility and budget risks.
    *   Adapts recommendations based on the selected Production Mode (e.g., cutting costs for "Budget" mode).
5.  **Editor Agent** ✂️
    *   Analyzes pacing and rhythm.
    *   Suggests cuts, reordering scenes, and transition strategies.
6.  **Marketing Agent** 📣
    *   Generates commercial loglines, taglines, and trailer scripts.
    *   Drafts pitch blurbs (for streamers) or director statements (for festivals).

### 📄 Intelligent Input Handling
*   **Logline Mode**: Start from scratch with just a concept.
*   **Script Mode**: Upload existing screenplays.
    *   **File Support**: Auto-parses `.pdf` and `.docx` files.
    *   **AI Reformatter**: Optional checkbox to let the AI Screenwriter fix formatting and polish dialogue before processing.

### 🎨 AI Storyboarding & Visualization
*   **Scene Visualization**: Automatically identifies the 4 most iconic frames in the movie.
*   **Image Generation**: Uses **Gemini 2.5 Flash Image** to generate high-fidelity, cinematic 16:9 storyboards matching the Cinematographer's visual style.

### 🌍 Deep Localization
*   **Multi-Language Support**: Fully localize the entire production package into English, Spanish, French, German, Italian, Japanese, Korean, Chinese, Hindi, or Portuguese.
*   **Cultural Adaptation**: Agents don't just translate; they adapt cultural references and dialogue nuances to fit the target language's film market.

### 🎭 Production Modes
Customize the AI's output bias based on your target audience:
*   **Netflix**: Prioritizes commercial viability, binge-worthy pacing, and broad appeal.
*   **Festival**: Prioritizes artistic merit, thematic depth, and unique directorial voice.
*   **Budget**: Prioritizes feasibility, low location counts, and cost-effective storytelling.

## 🛠️ Tech Stack
*   **Frontend**: React 19, Tailwind CSS, Lucide React
*   **AI Core**: Google GenAI SDK (`@google/genai`)
    *   Text Models: `gemini-3-pro-preview`
    *   Image Models: `gemini-2.5-flash-image`
*   **File Processing**: `pdfjs-dist` (PDF), `mammoth` (DOCX)

## 📦 Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables:
    *   Create a `.env` file and add your Google Gemini API key:
        ```
        API_KEY=your_api_key_here
        ```
4.  Run the development server:
    ```bash
    npm start
    ```

---
*Powered by Google Gemini*
