import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AgentRole, ProductionMode, StoryInput } from "../types";

// Helper to get client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Director Agent
export const runDirectorAgent = async (input: StoryInput): Promise<string> => {
  const ai = getClient();
  const prompt = `
    You are the Lead Director of a prestigious film studio.
    
    STORY:
    "${input.content}"

    GENRE: ${input.genre || 'Unspecified'}
    MODE: ${input.mode}
    TARGET LANGUAGE: ${input.language}

    TASK:
    1. Interpret the story deeply. Identify the core theme, tone, and emotional arc.
    2. Create detailed CHARACTER PROFILES for the main cast. For each character, provide:
       - Name & Role
       - Backstory & Personality
       - Core Motivation (What do they want?)
       - Key Emotional Arc (How do they change?)
    3. Divide the story into a clear 3-Act Structure (or alternative if Mode is Festival).
    4. Break down key scenes with specific directorial notes on performance.
    
    LOCALIZATION INSTRUCTION:
    You are also the Localization Director. 
    - Write your entire response (headers, scene descriptions, dialogue) in ${input.language}.
    - Adapt the dialogue to be culturally authentic to the language, avoiding literal translations.
    - Preserve the emotional subtext specific to the cultural context of the language.

    Output in clean Markdown format with headers.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a visionary film director known for strong structural storytelling and cultural authenticity.",
    }
  });

  return response.text || "Director failed to generate output.";
};

// 2. Cinematographer Agent
export const runCinematographerAgent = async (input: StoryInput, directorOutput: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    You are an Oscar-winning Cinematographer (DOP).
    
    DIRECTOR'S VISION:
    ${directorOutput}

    MODE: ${input.mode}
    TARGET LANGUAGE: ${input.language}

    TASK:
    1. Convert the key scenes into a visual shot list.
    2. Define the visual language: Color palette, lighting style (e.g., chiaroscuro, high-key), and camera movement.
    3. Specify lenses and aspect ratio suitable for the ${input.mode} mode.

    Output in clean Markdown format in ${input.language}. Use tables for shot lists where appropriate.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a master of light and composition. You speak in visual terms.",
    }
  });

  return response.text || "Cinematographer failed to generate output.";
};

// 3. Producer Agent
export const runProducerAgent = async (input: StoryInput, dpOutput: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    You are a pragmatic and experienced Executive Producer.

    CINEMATOGRAPHY PLAN:
    ${dpOutput}

    MODE: ${input.mode}
    TARGET LANGUAGE: ${input.language}

    TASK:
    1. Analyze the feasibility of the proposed shots and scenes.
    2. Identify expensive elements (CGI, locations, cast size).
    3. ${input.mode === 'Budget' ? 'CRITICAL: Rewrite or flag scenes to reduce cost drastically.' : ''}
    4. ${input.mode === 'Netflix' ? 'Ensure the pacing is binge-worthy and commercial.' : ''}
    5. ${input.mode === 'Festival' ? 'Focus on artistic merit over commercial viability, but keep it producible.' : ''}

    Output a production report in Markdown in ${input.language}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are the reality check. You care about budget, schedule, and marketability.",
    }
  });

  return response.text || "Producer failed to generate output.";
};

// 4. Editor Agent
export const runEditorAgent = async (input: StoryInput, directorOutput: string, producerOutput: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    You are a Master Film Editor.

    SCRIPT STRUCTURE:
    ${directorOutput}

    PRODUCER NOTES:
    ${producerOutput}
    
    TARGET LANGUAGE: ${input.language}

    TASK:
    1. Review the scene order. Suggest reordering for maximum emotional impact.
    2. Flag slow sections or pacing issues.
    3. Suggest where to cut early or enter late in scenes.
    4. Create a "Rhythm and Pacing" guide for the final cut.

    Output in Markdown in ${input.language}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are the final rewrite. You control time and tension.",
    }
  });

  return response.text || "Editor failed to generate output.";
};

// 5. Marketing Agent
export const runMarketingAgent = async (input: StoryInput, finalScript: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    You are a Head of Marketing at a major studio.

    FINAL VISION:
    ${finalScript}

    MODE: ${input.mode}
    TARGET LANGUAGE: ${input.language}

    TASK:
    1. Write a compelling Logline (1 sentence).
    2. Write a Tagline.
    3. Write a Trailer Script (Voiceover + Visual cues).
    4. ${input.mode === 'Festival' ? 'Draft a Director Statement for Sundance/Cannes.' : 'Draft a pitch blurb for Netflix/Amazon executives.'}

    LOCALIZATION INSTRUCTION:
    - Write ALL marketing copy in ${input.language}.
    - Adapt cultural references to resonate with the ${input.language}-speaking audience.
    - Ensure the tone fits the ${input.language} film market.

    Output in Markdown.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You sell the dream. You are hype, precision, and audience psychology.",
    }
  });

  return response.text || "Marketing failed to generate output.";
};

// 6. Asset Generation (Storyboard Prompts)
export const generateStoryboardPrompts = async (fullContext: string): Promise<string[]> => {
  const ai = getClient();
  const prompt = `
    Based on the following film production package, generate 4 distinct, highly visual image prompts for a text-to-image AI model.
    These should represent the 4 most iconic frames of the movie.
    
    CONTEXT:
    ${fullContext.substring(0, 10000)}... (truncated)

    IMPORTANT: Even if the context is in another language, generate the image prompts in ENGLISH for best image generation results.

    RETURN JSON ONLY:
    {
      "prompts": ["prompt 1", "prompt 2", "prompt 3", "prompt 4"]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    const json = JSON.parse(response.text || "{}");
    return json.prompts || [];
  } catch (e) {
    console.error("Failed to parse prompts", e);
    return [];
  }
};

// 7. Image Generation
export const generateImage = async (imagePrompt: string): Promise<string | undefined> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt + ", cinematic lighting, photorealistic, movie still, 8k, detailed" }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    // Extract image
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return undefined;
  } catch (e) {
    console.error("Image gen failed", e);
    return undefined;
  }
};
