import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
// Allow large payloads for image inputs if needed
app.use(express.json({ limit: '10mb' }));

// Initialize SDK with Server-Side Key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.post('/api/generate', async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    
    // Proxy the request to Google Gemini
    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    // Send the full response object back to client
    res.json(response);
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Gemini Proxy Server running on port ${PORT}`);
});