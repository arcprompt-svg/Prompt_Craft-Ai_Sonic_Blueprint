const express = require('express');
const path = require('path');
const { createServer: createViteServer } = require('vite');
const { GoogleGenerativeAI } = require('@google/genai');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy
  app.post('/api/generate-prompt', async (req, res) => {
    try {
      const { formState } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: formState.temperature ?? 0.7,
          topP: formState.topP ?? 0.9,
          frequencyPenalty: formState.frequencyPenalty ?? 0,
        }
      });

      const prompt = `
        You are an expert music prompt architect for AI music generators like Suno and Udio.
        Refine the following music parameters into a cohesive, high-quality descriptive prompt for an AI music model.
        
        Parameters:
        - Core Genre: ${formState.genre1}
        - Modern Mix: ${formState.genre2}
        - Vocals: ${formState.vocals}
        - Instruments: ${formState.instruments}
        - Original Logic: ${formState.logic}
        
        Requirements:
        1. Keep it concise (under 200 words).
        2. Use evocative, sensory language.
        3. Do not use generic buzzwords like "masterpiece" unless they fit the specific style.
        4. Focus on texture, energy, and specific musical techniques.
        
        Output only the refined prompt text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.json({ text: text.trim() });
    } catch (error) {
      console.error('Gemini Error:', error);
      res.status(500).json({ error: 'Failed to generate prompt' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
