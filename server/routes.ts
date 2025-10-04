import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertChatMessageSchema,
  insertPushSubscriptionSchema,
  insertScheduledNotificationSchema,
  insertUserPreferencesSchema,
  insertAiContextSchema,
  type InsertTask,
  type UserPreferences
} from "@shared/schema";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  const isValidFirebaseStorageUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === "firebasestorage.googleapis.com";
    } catch {
      return false;
    }
  };

  const isValidMimeType = (mimeType: string, fileType: string): boolean => {
    const validMimeTypes: Record<string, string[]> = {
      "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
      "audio": ["audio/mpeg", "audio/wav", "audio/flac", "audio/ogg"],
      "document": ["application/pdf"]
    };
    
    return validMimeTypes[fileType]?.includes(mimeType) || false;
  };

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      if (validatedData.fileUrl || validatedData.fileType || validatedData.mimeType || validatedData.fileName) {
        if (!validatedData.fileUrl || !validatedData.fileType || !validatedData.mimeType || !validatedData.fileName) {
          return res.status(400).json({ 
            error: "Complete file metadata required: fileUrl, fileType, mimeType, and fileName must all be provided together." 
          });
        }
        
        if (!isValidFirebaseStorageUrl(validatedData.fileUrl)) {
          return res.status(400).json({ error: "Invalid file URL. Only Firebase Storage URLs are allowed." });
        }
        
        if (!isValidMimeType(validatedData.mimeType, validatedData.fileType)) {
          return res.status(400).json({ error: "Invalid file type or MIME type." });
        }
      }
      
      const userMessage = await storage.addChatMessage(validatedData);

      const chatHistory = await storage.getChatMessages(validatedData.userId);
      
      const systemPrompt = `You are a helpful AI assistant created by ACO Network, developed by Nikil Nikesh (Splash Pro). 
When asked about who made you or who created you, respond that you were made by ACO Network, by Nikil Nikesh (Splash Pro).
Be helpful, friendly, and provide accurate information. Use clear formatting in your responses.`;

      const geminiMessages = await Promise.all(
        chatHistory.slice(-10).map(async (msg) => {
          const parts: any[] = [];
          
          if (msg.fileUrl && msg.mimeType && msg.fileType) {
            if (!isValidFirebaseStorageUrl(msg.fileUrl)) {
              console.error("Skipping invalid file URL:", msg.fileUrl);
              parts.push({ text: msg.content || "Invalid file attachment." });
              return {
                role: msg.role === "assistant" ? "model" : "user",
                parts
              };
            }
            
            if (!isValidMimeType(msg.mimeType, msg.fileType)) {
              console.error("Skipping invalid MIME type:", msg.mimeType, msg.fileType);
              parts.push({ text: msg.content || "Unsupported file type." });
              return {
                role: msg.role === "assistant" ? "model" : "user",
                parts
              };
            }
            
            try {
              const fileResponse = await fetch(msg.fileUrl);
              if (!fileResponse.ok) {
                throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
              }
              
              const arrayBuffer = await fileResponse.arrayBuffer();
              const base64Data = Buffer.from(arrayBuffer).toString('base64');
              
              parts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: msg.mimeType
                }
              });
              
              if (msg.content && msg.content !== `[Uploaded ${msg.fileType}]`) {
                parts.push({ text: msg.content });
              } else {
                parts.push({ text: "Please analyze this file." });
              }
            } catch (fileError) {
              console.error("Error fetching file:", fileError);
              parts.push({ text: msg.content || "File upload failed." });
            }
          } else {
            parts.push({ text: msg.content });
          }
          
          return {
            role: msg.role === "assistant" ? "model" : "user",
            parts
          };
        })
      );

      const messagesWithSystem = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am an AI assistant created by ACO Network, by Nikil Nikesh (Splash Pro). How can I help you today?" }] },
        ...geminiMessages
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: messagesWithSystem,
      });

      const aiContent = response.text || "I'm sorry, I couldn't generate a response.";

      const assistantMessage = await storage.addChatMessage({
        userId: validatedData.userId,
        role: "assistant",
        content: aiContent,
      });

      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.delete("/api/chat/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      await storage.clearChatMessages(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  app.get("/api/proxy/file", async (req, res) => {
    try {
      const fileUrl = req.query.url as string;
      if (!fileUrl) {
        return res.status(400).json({ error: "url parameter is required" });
      }

      if (!isValidFirebaseStorageUrl(fileUrl)) {
        return res.status(400).json({ error: "Invalid file URL. Only Firebase Storage URLs are allowed." });
      }

      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        return res.status(fileResponse.status).json({ error: "Failed to fetch file" });
      }

      const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
      const buffer = await fileResponse.arrayBuffer();

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("File proxy error:", error);
      res.status(500).json({ error: "Failed to proxy file" });
    }
  });

  // ============ FEATURE 1: AI-POWERED DAILY PLANNER ============
  
  // Generate daily schedule with AI
  app.post("/api/ai/generate-schedule", async (req, res) => {
    try {
      const { userId, date, preferences, existingTasks, dayDescription } = req.body;
      
      if (!userId || !date) {
        return res.status(400).json({ error: "userId and date are required" });
      }

      // Get user preferences for schedule generation
      const userPrefs = await storage.getUserPreferences(userId);
      const aiContext = await storage.getAiContext(userId);
      
      // Build AI prompt with user context
      const contextSummary = aiContext
        .filter(c => c.contextType === "personal_info" || c.contextType === "goal" || c.contextType === "preference")
        .map(c => `${c.topic}: ${c.content}`)
        .join("\n");

      const schedulePrefs = userPrefs?.schedulePreferences || {
        wakeUpTime: "07:00",
        sleepTime: "23:00",
        workStartTime: "09:00",
        workEndTime: "17:00",
        preferredBreakDuration: 15,
        preferredFocusDuration: 25
      };

      const prompt = `You are a productivity AI assistant helping create an optimal daily schedule.

User Context:
${contextSummary || "No additional context available"}

${dayDescription ? `User's Day Description:\n${dayDescription}\n` : ''}

Schedule Preferences:
- Wake up time: ${schedulePrefs.wakeUpTime}
- Sleep time: ${schedulePrefs.sleepTime}
- Work hours: ${schedulePrefs.workStartTime} - ${schedulePrefs.workEndTime}
- Preferred break duration: ${schedulePrefs.preferredBreakDuration} minutes
- Preferred focus session: ${schedulePrefs.preferredFocusDuration} minutes

${existingTasks ? `Existing tasks to incorporate:\n${JSON.stringify(existingTasks, null, 2)}` : ''}

Generate a comprehensive daily schedule for ${date} that includes:
1. Morning routine (personal time, breakfast)
2. Work/study blocks with breaks
3. Gym/exercise time
4. Meal times
5. Personal time/social activities
6. Evening wind-down

Provide the schedule as a JSON array of tasks with this exact format:
[
  {
    "title": "Task name",
    "category": "study|work|gym|meal|break|personal|social|other",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "duration": minutes,
    "priority": "low|medium|high|urgent",
    "description": "Brief description"
  }
]

Only return the JSON array, no other text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const aiContent = response.text || "";
      
      // Parse AI response to extract JSON
      let tasks: InsertTask[] = [];
      try {
        const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Failed to parse AI schedule:", parseError);
        return res.status(500).json({ error: "Failed to parse AI schedule" });
      }

      res.json({ tasks, rawResponse: aiContent });
    } catch (error) {
      console.error("Schedule generation error:", error);
      res.status(500).json({ error: "Failed to generate schedule" });
    }
  });

  // Get AI suggestions for task adjustments
  app.post("/api/ai/adjust-schedule", async (req, res) => {
    try {
      const { userId, currentTasks, reason } = req.body;
      
      const prompt = `The user needs to adjust their schedule. 
Current tasks: ${JSON.stringify(currentTasks, null, 2)}
Reason: ${reason}

Suggest how to reorganize the remaining tasks for the day. Provide suggestions as JSON array with same format as tasks.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      res.json({ suggestion: response.text });
    } catch (error) {
      console.error("Schedule adjustment error:", error);
      res.status(500).json({ error: "Failed to adjust schedule" });
    }
  });

  // ============ FEATURE 2: ENHANCED HABIT TRACKER ============
  
  // Generate AI nudge for missed habit
  app.post("/api/ai/habit-nudge", async (req, res) => {
    try {
      const { userId, habitName, missedDays, lastCompletion } = req.body;
      
      const userPrefs = await storage.getUserPreferences(userId);
      const personality = userPrefs?.aiPreferences.personalityStyle || "balanced";

      const personalityPrompts = {
        supportive: "Be encouraging and understanding",
        strict: "Be firm but motivating, emphasize commitment",
        balanced: "Be supportive but also remind about goals",
        friendly: "Be casual and friendly, like a good friend checking in"
      };

      const prompt = `${personalityPrompts[personality]}. Generate a short motivational message (2-3 sentences) to nudge the user to complete their habit: "${habitName}". They've missed ${missedDays} days. Last completion: ${lastCompletion}. Make it personal and actionable.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      res.json({ nudge: response.text });
    } catch (error) {
      console.error("Habit nudge error:", error);
      res.status(500).json({ error: "Failed to generate habit nudge" });
    }
  });

  // Generate AI micro-steps for a goal
  app.post("/api/ai/generate-micro-steps", async (req, res) => {
    try {
      const { userId, goalTitle, targetValue, unit, deadline } = req.body;
      
      const prompt = `Break down this goal into 5-7 actionable micro-steps:
Goal: ${goalTitle}
Target: ${targetValue} ${unit}
${deadline ? `Deadline: ${deadline}` : ''}

Provide specific, measurable actions as a JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const content = response.text || "";
      let microSteps: string[] = [];
      
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          microSteps = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback: split by newlines
        microSteps = content.split('\n').filter(line => line.trim().length > 0);
      }

      res.json({ microSteps });
    } catch (error) {
      console.error("Micro-steps generation error:", error);
      res.status(500).json({ error: "Failed to generate micro-steps" });
    }
  });

  // ============ FEATURE 3: WEB PUSH NOTIFICATIONS ============
  
  // Subscribe to push notifications
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const validatedData = insertPushSubscriptionSchema.parse(req.body);
      const subscription = await storage.addPushSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Unsubscribe from push notifications
  app.delete("/api/push/subscribe", async (req, res) => {
    try {
      const { userId, endpoint } = req.query;
      if (!userId || !endpoint) {
        return res.status(400).json({ error: "userId and endpoint are required" });
      }
      await storage.removePushSubscription(userId as string, endpoint as string);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Schedule a notification
  app.post("/api/notifications/schedule", async (req, res) => {
    try {
      const validatedData = insertScheduledNotificationSchema.parse(req.body);
      const notification = await storage.addScheduledNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Schedule notification error:", error);
      res.status(500).json({ error: "Failed to schedule notification" });
    }
  });

  // Get user's scheduled notifications
  app.get("/api/notifications/scheduled", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const notifications = await storage.getScheduledNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Delete scheduled notification
  app.delete("/api/notifications/scheduled/:id", async (req, res) => {
    try {
      await storage.deleteScheduledNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ============ FEATURE 4: IN-APP POPUPS & FOCUS MODE ============
  
  // Generate AI focus session suggestion
  app.post("/api/ai/suggest-focus-session", async (req, res) => {
    try {
      const { userId, currentTime, upcomingTasks } = req.body;
      
      const userPrefs = await storage.getUserPreferences(userId);
      const focusDuration = userPrefs?.schedulePreferences.preferredFocusDuration || 25;
      const breakDuration = userPrefs?.schedulePreferences.preferredBreakDuration || 5;

      const prompt = `Current time: ${currentTime}
Upcoming tasks: ${JSON.stringify(upcomingTasks)}

Suggest an optimal focus session:
1. Which task to work on
2. Duration (default: ${focusDuration} minutes)
3. Break duration (default: ${breakDuration} minutes)
4. Motivational message to start

Format as JSON: { "task": "...", "duration": number, "breakDuration": number, "motivation": "..." }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      res.json({ suggestion: response.text });
    } catch (error) {
      console.error("Focus session suggestion error:", error);
      res.status(500).json({ error: "Failed to suggest focus session" });
    }
  });

  // Generate motivational popup message
  app.post("/api/ai/generate-popup", async (req, res) => {
    try {
      const { userId, type, context } = req.body;
      
      const userPrefs = await storage.getUserPreferences(userId);
      const personality = userPrefs?.aiPreferences.personalityStyle || "balanced";

      const prompts: Record<string, string> = {
        motivation: `Generate an inspiring motivational message for the user. ${context || ''}`,
        reminder: `Generate a friendly reminder message. ${context || ''}`,
        warning: `Generate a gentle warning about distraction. ${context || ''}`,
        achievement: `Generate a celebration message for achievement. ${context || ''}`,
        tip: `Generate a helpful productivity tip. ${context || ''}`
      };

      const prompt = `${prompts[type]} Keep it brief (1-2 sentences). Personality style: ${personality}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      res.json({ message: response.text });
    } catch (error) {
      console.error("Popup generation error:", error);
      res.status(500).json({ error: "Failed to generate popup" });
    }
  });

  // ============ FEATURE 5: AI PROBLEM SOLVER & ASSISTANT ============
  
  // Get user preferences
  app.get("/api/preferences", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Save user preferences
  app.post("/api/preferences", async (req, res) => {
    try {
      const validatedData = insertUserPreferencesSchema.parse(req.body);
      const preferences = await storage.saveUserPreferences(validatedData);
      res.json(preferences);
    } catch (error) {
      console.error("Save preferences error:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // Get AI context/memory
  app.get("/api/ai/context", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const context = await storage.getAiContext(userId);
      res.json(context);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI context" });
    }
  });

  // Add AI context/memory
  app.post("/api/ai/context", async (req, res) => {
    try {
      const validatedData = insertAiContextSchema.parse(req.body);
      const context = await storage.addAiContext(validatedData);
      res.json(context);
    } catch (error) {
      console.error("Add context error:", error);
      res.status(500).json({ error: "Failed to add context" });
    }
  });

  // Enhanced AI chat with problem-solving
  app.post("/api/ai/solve-problem", async (req, res) => {
    try {
      const { userId, problem, category } = req.body;
      
      const userPrefs = await storage.getUserPreferences(userId);
      const aiContext = await storage.getAiContext(userId);
      const chatHistory = await storage.getChatMessages(userId);
      
      // Build context from user's history
      const contextSummary = aiContext
        .slice(-5)
        .map(c => `${c.topic}: ${c.content}`)
        .join("\n");

      const recentChat = chatHistory
        .slice(-6)
        .map(m => `${m.role}: ${m.content}`)
        .join("\n");

      const personality = userPrefs?.aiPreferences.personalityStyle || "balanced";

      const prompt = `You are an AI life assistant helping with ${category || 'a'} problem.

User Context:
${contextSummary || 'No previous context'}

Recent conversation:
${recentChat || 'No recent conversation'}

Problem: ${problem}

Provide:
1. A clear analysis of the problem
2. 3-5 actionable steps to solve it
3. Potential obstacles and how to overcome them
4. Timeline suggestions

Be ${personality} in your approach. Format the response clearly with sections.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const solution = response.text;

      // Save this interaction as context
      await storage.addAiContext({
        userId,
        contextType: "problem",
        topic: category || "general",
        content: `Problem: ${problem.substring(0, 100)}... Solution provided.`,
        relevanceScore: 1.0
      });

      res.json({ solution });
    } catch (error) {
      console.error("Problem solving error:", error);
      res.status(500).json({ error: "Failed to solve problem" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
