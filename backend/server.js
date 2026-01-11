import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
// Allow large payloads for potential file uploads or large contexts
app.use(express.json({ limit: '10mb' }));

// Initialize SDK with Server-Side Key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.post('/api/generate', async (req, res) => {
  try {
    // Deconstruct the request expected from the frontend
    const { model, contents, config } = req.body;
    
    // Call the Google GenAI SDK
    // This runs securely on the server
    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    // Send the full response object back to client
    // The SDK's GenerateContentResponse serializes to JSON automatically
    res.json(response);
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
        error: error.message || 'Internal Server Error',
        details: error.toString() 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Gemini Proxy Server running on port ${PORT}`);
});