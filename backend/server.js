import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// 1. Enable CORS for all origins (Crucial for Vercel -> Railway communication)
// This fixes CORS errors often confused with 405s
app.use(cors());
app.options('*', cors()); // Enable pre-flight across-the-board

// Allow large payloads for potential file uploads or large contexts
app.use(express.json({ limit: '10mb' }));

// 2. Health Check Route
// If you visit your Railway URL in a browser and see this message, the backend is active.
// If you see 404 or 405, your Root Directory setting in Railway is likely wrong.
app.get('/', (req, res) => {
  res.status(200).send('CineMind Backend is Active via Express!');
});

// Initialize SDK with Server-Side Key
// Ensure your Railway Variable is named API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.post('/api/generate', async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    
    if (!process.env.API_KEY) {
        throw new Error("API_KEY not found in environment variables");
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    res.json(response);
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return 500 so frontend knows it failed
    res.status(500).json({ 
        error: error.message || 'Internal Server Error',
        details: error.toString() 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Gemini Backend running on port ${PORT}`);
});