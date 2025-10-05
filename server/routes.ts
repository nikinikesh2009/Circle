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
import { authenticateUser, validateUserId, requireAdmin, type AuthRequest } from "./auth-middleware";
import { apiLimiter, aiLimiter, uploadLimiter } from "./rate-limit";
import DOMPurify from "isomorphic-dompurify";
import admin from "firebase-admin";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Sanitize user input to prevent XSS
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  app.use("/api", apiLimiter);
  
  app.get("/api/chat/messages", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  const isValidStorageUrl = (url: string): boolean => {
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

  app.post("/api/chat/messages", authenticateUser, validateUserId, aiLimiter, uploadLimiter, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      // Ensure userId matches authenticated user
      if (validatedData.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Sanitize content to prevent XSS
      if (validatedData.content) {
        validatedData.content = sanitizeInput(validatedData.content);
      }
      
      if (validatedData.fileUrl || validatedData.fileType || validatedData.mimeType || validatedData.fileName) {
        if (!validatedData.fileUrl || !validatedData.fileType || !validatedData.mimeType || !validatedData.fileName) {
          return res.status(400).json({ 
            error: "Complete file metadata required: fileUrl, fileType, mimeType, and fileName must all be provided together." 
          });
        }
        
        if (!isValidStorageUrl(validatedData.fileUrl)) {
          return res.status(400).json({ error: "Invalid file URL. Only authorized storage URLs are allowed." });
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
            if (!isValidStorageUrl(msg.fileUrl)) {
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

  app.delete("/api/chat/messages", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      await storage.clearChatMessages(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  app.get("/api/proxy/file", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const fileUrl = req.query.url as string;
      if (!fileUrl) {
        return res.status(400).json({ error: "url parameter is required" });
      }

      if (!isValidStorageUrl(fileUrl)) {
        return res.status(400).json({ error: "Invalid file URL. Only authorized storage URLs are allowed." });
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
  app.post("/api/ai/generate-schedule", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { date, preferences, existingTasks, dayDescription } = req.body;
      
      if (!date) {
        return res.status(400).json({ error: "date is required" });
      }
      
      const sanitizedDayDescription = dayDescription ? sanitizeInput(dayDescription) : undefined;

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

${sanitizedDayDescription ? `User's Day Description:\n${sanitizedDayDescription}\n` : ''}

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
  app.post("/api/ai/adjust-schedule", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { currentTasks, reason } = req.body;
      
      const sanitizedReason = reason ? sanitizeInput(reason) : "";
      
      const prompt = `The user needs to adjust their schedule. 
Current tasks: ${JSON.stringify(currentTasks, null, 2)}
Reason: ${sanitizedReason}

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
  app.post("/api/ai/habit-nudge", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { habitName, missedDays, lastCompletion } = req.body;
      
      const sanitizedHabitName = habitName ? sanitizeInput(habitName) : "";
      
      const userPrefs = await storage.getUserPreferences(userId);
      const personality = userPrefs?.aiPreferences.personalityStyle || "balanced";

      const personalityPrompts = {
        supportive: "Be encouraging and understanding",
        strict: "Be firm but motivating, emphasize commitment",
        balanced: "Be supportive but also remind about goals",
        friendly: "Be casual and friendly, like a good friend checking in"
      };

      const prompt = `${personalityPrompts[personality]}. Generate a short motivational message (2-3 sentences) to nudge the user to complete their habit: "${sanitizedHabitName}". They've missed ${missedDays} days. Last completion: ${lastCompletion}. Make it personal and actionable.`;

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
  app.post("/api/ai/generate-micro-steps", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { goalTitle, targetValue, unit, deadline } = req.body;
      
      const sanitizedGoalTitle = goalTitle ? sanitizeInput(goalTitle) : "";
      const sanitizedUnit = unit ? sanitizeInput(unit) : "";
      
      const prompt = `Break down this goal into 5-7 actionable micro-steps:
Goal: ${sanitizedGoalTitle}
Target: ${targetValue} ${sanitizedUnit}
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
  app.post("/api/push/subscribe", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPushSubscriptionSchema.parse(req.body);
      
      if (validatedData.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const subscription = await storage.addPushSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Unsubscribe from push notifications
  app.delete("/api/push/subscribe", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const endpoint = req.query.endpoint as string;
      if (!endpoint) {
        return res.status(400).json({ error: "endpoint is required" });
      }
      await storage.removePushSubscription(userId, endpoint);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Schedule a notification
  app.post("/api/notifications/schedule", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertScheduledNotificationSchema.parse(req.body);
      
      if (validatedData.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (validatedData.title) {
        validatedData.title = sanitizeInput(validatedData.title);
      }
      if (validatedData.body) {
        validatedData.body = sanitizeInput(validatedData.body);
      }
      
      const notification = await storage.addScheduledNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Schedule notification error:", error);
      res.status(500).json({ error: "Failed to schedule notification" });
    }
  });

  // Get user's scheduled notifications
  app.get("/api/notifications/scheduled", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const notifications = await storage.getScheduledNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Delete scheduled notification
  app.delete("/api/notifications/scheduled/:id", authenticateUser, async (req: AuthRequest, res) => {
    try {
      await storage.deleteScheduledNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ============ FEATURE 4: IN-APP POPUPS & FOCUS MODE ============
  
  // Generate AI focus session suggestion
  app.post("/api/ai/suggest-focus-session", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { currentTime, upcomingTasks } = req.body;
      
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
  app.post("/api/ai/generate-popup", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { type, context } = req.body;
      
      const sanitizedContext = context ? sanitizeInput(context) : "";
      
      const userPrefs = await storage.getUserPreferences(userId);
      const personality = userPrefs?.aiPreferences.personalityStyle || "balanced";

      const prompts: Record<string, string> = {
        motivation: `Generate an inspiring motivational message for the user. ${sanitizedContext}`,
        reminder: `Generate a friendly reminder message. ${sanitizedContext}`,
        warning: `Generate a gentle warning about distraction. ${sanitizedContext}`,
        achievement: `Generate a celebration message for achievement. ${sanitizedContext}`,
        tip: `Generate a helpful productivity tip. ${sanitizedContext}`
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
  app.get("/api/preferences", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Save user preferences
  app.post("/api/preferences", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertUserPreferencesSchema.parse(req.body);
      
      if (validatedData.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const preferences = await storage.saveUserPreferences(validatedData);
      res.json(preferences);
    } catch (error) {
      console.error("Save preferences error:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // Get AI context/memory
  app.get("/api/ai/context", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const context = await storage.getAiContext(userId);
      res.json(context);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI context" });
    }
  });

  // Add AI context/memory
  app.post("/api/ai/context", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAiContextSchema.parse(req.body);
      
      if (validatedData.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (validatedData.topic) {
        validatedData.topic = sanitizeInput(validatedData.topic);
      }
      if (validatedData.content) {
        validatedData.content = sanitizeInput(validatedData.content);
      }
      
      const context = await storage.addAiContext(validatedData);
      res.json(context);
    } catch (error) {
      console.error("Add context error:", error);
      res.status(500).json({ error: "Failed to add context" });
    }
  });

  // Enhanced AI chat with problem-solving
  app.post("/api/ai/solve-problem", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { problem, category } = req.body;
      
      const sanitizedProblem = problem ? sanitizeInput(problem) : "";
      const sanitizedCategory = category ? sanitizeInput(category) : "";
      
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

      const prompt = `You are an AI life assistant helping with ${sanitizedCategory || 'a'} problem.

User Context:
${contextSummary || 'No previous context'}

Recent conversation:
${recentChat || 'No recent conversation'}

Problem: ${sanitizedProblem}

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
        topic: sanitizedCategory || "general",
        content: `Problem: ${sanitizedProblem.substring(0, 100)}... Solution provided.`,
        relevanceScore: 1.0
      });

      res.json({ solution });
    } catch (error) {
      console.error("Problem solving error:", error);
      res.status(500).json({ error: "Failed to solve problem" });
    }
  });

  // ============ PRIVATE MESSAGING ROUTES ============
  
  // Get recent conversations
  app.get("/api/private-messages/conversations", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const conversations = await storage.getRecentConversations(userId);
      
      // Get user data from Firebase Admin for each conversation
      const db = admin.database();
      
      const conversationsWithUsers = await Promise.all(conversations.map(async (conv) => {
        try {
          const snapshot = await db.ref(`users/${conv.otherUserId}`).once('value');
          const userData = snapshot.val();
          
          return {
            ...conv,
            otherUser: userData ? {
              id: conv.otherUserId,
              email: userData.email || '',
            } : { id: conv.otherUserId, email: 'Unknown User' }
          };
        } catch (err) {
          console.error("Error fetching user data:", err);
          return {
            ...conv,
            otherUser: { id: conv.otherUserId, email: 'Unknown User' }
          };
        }
      }));
      
      res.json(conversationsWithUsers);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get conversation with a specific user
  app.get("/api/private-messages/:otherUserId", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { otherUserId } = req.params;
      
      const messages = await storage.getConversation(userId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  
  // Send a private message
  app.post("/api/private-messages", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ error: "receiverId and content are required" });
      }
      
      // Sanitize content
      const sanitizedContent = sanitizeInput(content);
      
      const message = await storage.sendPrivateMessage({
        senderId: userId,
        receiverId,
        content: sanitizedContent
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  
  // Mark message as read
  app.put("/api/private-messages/:messageId/read", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { messageId } = req.params;
      
      // Get all user's conversations to verify message ownership
      const conversations = await storage.getRecentConversations(userId);
      const allMessages = await Promise.all(
        conversations.map(c => storage.getConversation(userId, c.otherUserId))
      ).then(results => results.flat());
      
      const message = allMessages.find(m => m.id === messageId);
      if (!message || message.receiverId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });
  
  // Search for users
  app.get("/api/users/search", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const { query } = req.query;
      const currentUserId = req.user!.uid;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      // Use Firebase Admin SDK
      const db = admin.database();
      
      // Get all users from Firebase
      const snapshot = await db.ref('users').once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const allUsers = snapshot.val();
      const searchQuery = (query as string).toLowerCase();
      
      // Filter users by email
      const matchingUsers = Object.entries(allUsers)
        .filter(([userId, userData]: [string, any]) => {
          return userId !== currentUserId && 
                 userData.email && 
                 userData.email.toLowerCase().includes(searchQuery);
        })
        .map(([userId, userData]: [string, any]) => ({
          id: userId,
          email: userData.email
        }))
        .slice(0, 10); // Limit to 10 results
      
      res.json(matchingUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Register admin routes
  const { registerAdminRoutes } = await import("./admin-routes");
  registerAdminRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
