import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { generateCompanionResponse } from './server/geminiChatService.ts';
import { analyzeJournalSentiment } from './server/sentimentService.ts';
import { generatePersonalizedRecommendations } from './server/recommendationService.ts';
import { analyzeCrisisIndicators, CRISIS_RESOURCES } from './server/crisisService.ts';
import { analyzeVoiceJournalAudio } from './server/voiceService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware with generous limits for audio recordings
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'MindBridge Mental Wellness API',
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      groqConfigured: true,
    });
  });

  // Chat API endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, userName, persona, userContext } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
      }

      const response = await generateCompanionResponse(
        message.trim(),
        Array.isArray(history) ? history : [],
        userName || 'Friend',
        persona || {},
        userContext
      );

      res.json(response);
    } catch (error) {
      console.error('Error in /api/chat endpoint:', error);
      res.status(500).json({
        error: 'Failed to generate companion response',
        details: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
  });

  // Sentiment Analysis endpoint for Journal entries
  app.post('/api/sentiment', async (req, res) => {
    try {
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: 'Content is required for sentiment analysis.' });
      }

      const result = await analyzeJournalSentiment(content.trim());
      res.json(result);
    } catch (error) {
      console.error('Error in /api/sentiment endpoint:', error);
      res.status(500).json({
        error: 'Failed to analyze sentiment',
        details: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
  });

  // Voice Journal Audio understanding endpoint (Groq / Multimodal AI)
  app.post('/api/voice-understand', async (req, res) => {
    try {
      const { audioBase64, mimeType, durationSeconds, spokenContextHint } = req.body;

      const result = await analyzeVoiceJournalAudio({
        audioBase64,
        mimeType,
        durationSeconds,
        spokenContextHint,
      });

      res.json(result);
    } catch (error) {
      console.error('Error in /api/voice-understand endpoint:', error);
      res.status(500).json({
        error: 'Failed to understand voice recording',
        details: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
  });

  // Personalized Wellness Recommendations endpoint
  app.post('/api/recommendations', async (req, res) => {
    try {
      const { recentMoods = [], recentSentiments = [] } = req.body;
      const recommendations = await generatePersonalizedRecommendations(
        Array.isArray(recentMoods) ? recentMoods : [],
        Array.isArray(recentSentiments) ? recentSentiments : []
      );
      res.json({ recommendations });
    } catch (error) {
      console.error('Error in /api/recommendations endpoint:', error);
      res.status(500).json({
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown server error',
      });
    }
  });

  // Crisis Detection Check endpoint
  app.post('/api/crisis-check', (req, res) => {
    try {
      const { text } = req.body;
      const result = analyzeCrisisIndicators(text || '');
      res.json(result);
    } catch (error) {
      console.error('Error in /api/crisis-check endpoint:', error);
      res.status(500).json({
        error: 'Crisis indicator check failed',
      });
    }
  });

  // Crisis Resources Directory
  app.get('/api/crisis-resources', (_req, res) => {
    res.json({ resources: CRISIS_RESOURCES });
  });

  // Vite Middleware integration for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MindBridge server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MindBridge server:', err);
  process.exit(1);
});
