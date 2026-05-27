import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Route: Generate weekly RPG quests based on workout history
app.post("/api/generate-quests", async (req, res) => {
  try {
    const { workoutHistory } = req.body;

    const historyPrompt = workoutHistory && workoutHistory.length > 0 
      ? `Here is the user's recent workout log history: ${JSON.stringify(workoutHistory)}. Prepare custom RPG fitness quests based on their habits. If they run a lot, challenge them with a strength quest or double down.`
      : `The user has no recorded workout logs yet. Create fresh starter quests to get them into the game (e.g., 'Initiate's First Lift', 'Path of the Agile Swift').`;

    const systemInstruction = 
      "You are the Game Master of a dark-fantasy RPG fitness world called 'LevelFit'. " +
      "Your job is to generate exactly 3 creative weekly fitness quests in JSON format. " +
      "Each quest represents a trial from a mythical guild. Make the title and description " +
      "highly dramatic, medieval, and immersive. " +
      "Specify realistic athletic objectives using simple target metrics.";

    const schema = {
      type: Type.ARRAY,
      description: "List of 3 weekly medieval RPG quests",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "An evocative, epic RPG name (e.g. 'Abyssal Heavy-Lifting' or 'Cardiomancy Ritual')."
          },
          description: {
            type: Type.STRING,
            description: "Lore explanation linking fitness to a gaming mission."
          },
          type: {
            type: Type.STRING,
            enum: ["Strength", "Cardio", "Flexibility", "Endurance", "Streak", "Any"],
            description: "The matching workout category target."
          },
          targetValue: {
            type: Type.INTEGER,
            description: "Numeric goal: for Strength, quantity of exercises/sets (e.g., 3). For Cardio/Endurance/Flexibility, minutes of activity (e.g., 40)."
          },
          xpReward: {
            type: Type.INTEGER,
            description: "Gamer experience points reward (must be between 100 and 500)."
          },
          badgeReward: {
            type: Type.STRING,
            description: "The name of a conceptual badge unlocked upon claiming this quest, or left blank."
          }
        },
        required: ["title", "description", "type", "targetValue", "xpReward"]
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: historyPrompt }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const textOutput = response.text || "[]";
    const quests = JSON.parse(textOutput.trim());
    res.json({ success: true, quests });
  } catch (error: any) {
    console.error("Gemini Quests Generation Error:", error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

// Implement Vite middleware for SPA and Asset serving
async function configureVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from public dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

configureVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LevelFit Fullstack] Live and listening on host 0.0.0.0 at port ${PORT}`);
  });
});
