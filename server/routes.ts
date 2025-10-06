import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertChatMessageSchema,
  insertPushSubscriptionSchema,
  insertScheduledNotificationSchema,
  insertUserPreferencesSchema,
  insertAiContextSchema,
  insertSupportTicketSchema,
  insertBattleSchema,
  insertUserBadgeSchema,
  type InsertTask,
  type UserPreferences,
  type Battle,
  type Badge,
  type UserBadge
} from "@shared/schema";
import OpenAI from "openai";
import { authenticateUser, validateUserId, requireAdmin, type AuthRequest } from "./auth-middleware";
import { apiLimiter, aiLimiter, uploadLimiter } from "./rate-limit";
import DOMPurify from "isomorphic-dompurify";
import admin from "firebase-admin";

const ai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  timeout: 30000,
  maxRetries: 3
});

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

      let assistantMessage = null;
      
      try {
        const chatHistory = await storage.getChatMessages(validatedData.userId);
        
        const systemPrompt = `You are a helpful AI assistant created by ACO Network, developed by Nikil Nikesh (Splash Pro). 
When asked about who made you or who created you, respond that you were made by ACO Network, by Nikil Nikesh (Splash Pro).
Be helpful, friendly, and provide accurate information. Use clear formatting in your responses.`;

        const openaiMessages = chatHistory.slice(-10).map((msg) => {
          if (msg.role === "assistant") {
            return {
              role: "assistant" as const,
              content: msg.content || ""
            };
          } else {
            return {
              role: "user" as const,
              content: msg.content || ""
            };
          }
        });

        const messagesWithSystem: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...openaiMessages
        ];

        const response = await ai.chat.completions.create({
          model: "deepseek-chat",
          messages: messagesWithSystem,
          temperature: 0.7,
          max_tokens: 2000
        });

        const aiContent = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

        assistantMessage = await storage.addChatMessage({
          userId: validatedData.userId,
          role: "assistant",
          content: aiContent,
        });
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        assistantMessage = await storage.addChatMessage({
          userId: validatedData.userId,
          role: "assistant",
          content: "I'm experiencing technical difficulties right now. Please try again in a moment.",
        });
      }

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

      try {
        const response = await ai.chat.completions.create({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        });

        const aiContent = response.choices[0]?.message?.content || "";
        
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
      } catch (aiError: any) {
        const fallbackTasks = [
          {
            title: "Morning Routine",
            category: "personal" as const,
            startTime: schedulePrefs.wakeUpTime,
            endTime: "08:00",
            duration: 60,
            priority: "medium" as const,
            description: "Wake up, exercise, breakfast"
          },
          {
            title: "Work Session",
            category: "work" as const,
            startTime: schedulePrefs.workStartTime,
            endTime: "12:00",
            duration: 180,
            priority: "high" as const,
            description: "Focus on priority tasks"
          },
          {
            title: "Lunch Break",
            category: "meal" as const,
            startTime: "12:00",
            endTime: "13:00",
            duration: 60,
            priority: "medium" as const,
            description: "Healthy lunch"
          },
          {
            title: "Afternoon Work",
            category: "work" as const,
            startTime: "13:00",
            endTime: schedulePrefs.workEndTime,
            duration: 240,
            priority: "high" as const,
            description: "Continue with tasks"
          },
          {
            title: "Evening Wind Down",
            category: "personal" as const,
            startTime: "20:00",
            endTime: schedulePrefs.sleepTime,
            duration: 180,
            priority: "low" as const,
            description: "Relax and prepare for bed"
          }
        ];
        
        res.json({ 
          tasks: fallbackTasks, 
          rawResponse: "AI temporarily unavailable - using default schedule" 
        });
      }
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

      const response = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      res.json({ suggestion: response.choices[0]?.message?.content });
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

      const response = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      res.json({ nudge: response.choices[0]?.message?.content });
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

      const response = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content || "";
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

      const response = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      res.json({ suggestion: response.choices[0]?.message?.content });
    } catch (error) {
      console.error("Focus session suggestion error:", error);
      res.status(500).json({ error: "Failed to suggest focus session" });
    }
  });

  // Generate motivational popup message
  app.post("/api/ai/generate-popup", authenticateUser, aiLimiter, async (req: AuthRequest, res) => {
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

      try {
        const response = await ai.chat.completions.create({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        });

        res.json({ message: response.choices[0]?.message?.content });
      } catch (aiError: any) {
        const fallbackMessages: Record<string, string> = {
          motivation: "You've got this! Keep pushing forward, one step at a time. 💪",
          reminder: "Don't forget to stay focused on your goals today!",
          warning: "Take a moment to refocus. Your goals are waiting!",
          achievement: "Amazing work! You're making great progress! 🎉",
          tip: "Break your tasks into smaller steps - it makes everything more manageable!"
        };
        
        res.json({ message: fallbackMessages[type] || "Keep up the great work!" });
      }
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

      const response = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      const solution = response.choices[0]?.message?.content || "";

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

  // Support ticket endpoint
  app.post("/api/support/ticket", async (req, res) => {
    try {
      const validatedData = insertSupportTicketSchema.parse(req.body);
      
      // Sanitize inputs
      const sanitizedTicket = {
        ...validatedData,
        name: sanitizeInput(validatedData.name),
        subject: sanitizeInput(validatedData.subject),
        message: sanitizeInput(validatedData.message),
      };
      
      // Store ticket in Firebase
      const db = admin.database();
      const ticketRef = db.ref('supportTickets').push();
      const ticketId = ticketRef.key!;
      
      const ticket = {
        id: ticketId,
        ...sanitizedTicket,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      
      await ticketRef.set(ticket);
      
      res.status(201).json({ success: true, ticketId });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(400).json({ error: "Failed to create support ticket" });
    }
  });

  // ============ BATTLE SYSTEM ROUTES ============

  // Create a new battle
  app.post("/api/battles", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const validatedData = insertBattleSchema.parse(req.body);
      
      // Sanitize custom challenge text
      if (validatedData.customChallenge) {
        validatedData.customChallenge = sanitizeInput(validatedData.customChallenge);
      }
      
      const db = admin.database();
      const battleRef = db.ref('battles').push();
      const battleId = battleRef.key!;
      
      const battle: Battle = {
        id: battleId,
        ...validatedData,
        scores: {},
        createdAt: new Date(),
      };
      
      // Initialize scores for all participants
      validatedData.participants.forEach(participantId => {
        battle.scores[participantId] = 0;
      });
      
      await battleRef.set({
        ...battle,
        createdAt: battle.createdAt.toISOString(),
      });
      
      res.status(201).json(battle);
    } catch (error) {
      console.error("Error creating battle:", error);
      res.status(400).json({ error: "Failed to create battle" });
    }
  });

  // Get all battles (user's battles)
  app.get("/api/battles", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('battles').once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const allBattles = snapshot.val();
      
      // Filter battles where user is a participant
      const userBattles = Object.values(allBattles)
        .filter((battle: any) => battle.participants.includes(userId))
        .map((battle: any) => ({
          ...battle,
          createdAt: new Date(battle.createdAt),
          completedAt: battle.completedAt ? new Date(battle.completedAt) : undefined,
        }))
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      
      res.json(userBattles);
    } catch (error) {
      console.error("Error fetching battles:", error);
      res.status(500).json({ error: "Failed to fetch battles" });
    }
  });

  // Get all active/public battles (for discovery)
  app.get("/api/battles/discover", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('battles')
        .orderByChild('status')
        .equalTo('active')
        .once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const allBattles = snapshot.val();
      
      // Filter out user's own battles and format data
      const discoverBattles = Object.values(allBattles)
        .filter((battle: any) => !battle.participants.includes(userId))
        .map((battle: any) => ({
          ...battle,
          createdAt: new Date(battle.createdAt),
        }))
        .slice(0, 20); // Limit to 20 battles
      
      res.json(discoverBattles);
    } catch (error) {
      console.error("Error fetching discover battles:", error);
      res.status(500).json({ error: "Failed to fetch battles" });
    }
  });

  // Get specific battle
  app.get("/api/battles/:battleId", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const { battleId } = req.params;
      const db = admin.database();
      
      const snapshot = await db.ref(`battles/${battleId}`).once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      res.json({
        ...battle,
        createdAt: new Date(battle.createdAt),
        completedAt: battle.completedAt ? new Date(battle.completedAt) : undefined,
      });
    } catch (error) {
      console.error("Error fetching battle:", error);
      res.status(500).json({ error: "Failed to fetch battle" });
    }
  });

  // Update battle score
  app.post("/api/battles/:battleId/score", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { battleId } = req.params;
      const { score } = req.body;
      
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: "Invalid score" });
      }
      
      const db = admin.database();
      const battleRef = db.ref(`battles/${battleId}`);
      
      const snapshot = await battleRef.once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      // Check if user is a participant
      if (!battle.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant in this battle" });
      }
      
      // Update score
      await battleRef.child(`scores/${userId}`).set(score);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating battle score:", error);
      res.status(500).json({ error: "Failed to update score" });
    }
  });

  // Complete a battle and determine winner
  app.post("/api/battles/:battleId/complete", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const { battleId } = req.params;
      const db = admin.database();
      const battleRef = db.ref(`battles/${battleId}`);
      
      const snapshot = await battleRef.once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      if (battle.status === 'completed') {
        return res.status(400).json({ error: "Battle already completed" });
      }
      
      // Determine winner (highest score)
      let winnerId = '';
      let highestScore = -1;
      
      Object.entries(battle.scores).forEach(([participantId, score]: [string, any]) => {
        if (score > highestScore) {
          highestScore = score;
          winnerId = participantId;
        }
      });
      
      // Update battle status
      await battleRef.update({
        status: 'completed',
        winnerId: winnerId,
        completedAt: new Date().toISOString(),
      });
      
      // Award first win badge if this is their first win
      if (winnerId) {
        const userBattlesSnapshot = await db.ref('battles')
          .orderByChild('winnerId')
          .equalTo(winnerId)
          .once('value');
        
        const wins = userBattlesSnapshot.numChildren();
        
        if (wins === 1) {
          // Award "First Victory" badge
          const badgeId = 'first_victory';
          const userBadgeRef = db.ref(`userBadges/${winnerId}_${badgeId}`);
          const badgeExists = (await userBadgeRef.once('value')).exists();
          
          if (!badgeExists) {
            await userBadgeRef.set({
              id: `${winnerId}_${badgeId}`,
              userId: winnerId,
              badgeId: badgeId,
              battleId: battleId,
              earnedAt: new Date().toISOString(),
            });
          }
        }
      }
      
      res.json({ success: true, winnerId });
    } catch (error) {
      console.error("Error completing battle:", error);
      res.status(500).json({ error: "Failed to complete battle" });
    }
  });

  // AI matchmaking - suggest opponents
  app.post("/api/battles/matchmaking", authenticateUser, validateUserId, aiLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { battleType } = req.body; // "1v1" or "group"
      
      const db = admin.database();
      
      // Get current user's stats
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      const userData = userSnapshot.val();
      
      // Get all users
      const allUsersSnapshot = await db.ref('users').once('value');
      const allUsers = allUsersSnapshot.val();
      
      // Get user's battle history
      const battlesSnapshot = await db.ref('battles').once('value');
      const allBattles = battlesSnapshot.exists() ? Object.values(battlesSnapshot.val()) : [];
      
      const userBattles = allBattles.filter((b: any) => 
        b.participants.includes(userId)
      );
      
      const userWins = allBattles.filter((b: any) => b.winnerId === userId).length;
      
      // Prepare user data for AI
      const userStats = {
        streak: userData?.streak || 0,
        totalDays: userData?.totalDays || 0,
        wins: userWins,
        totalBattles: userBattles.length,
        winRate: userBattles.length > 0 ? (userWins / userBattles.length * 100).toFixed(0) : 0,
      };
      
      // Filter potential opponents (exclude current user)
      const potentialOpponents = Object.entries(allUsers)
        .filter(([uid]) => uid !== userId)
        .map(([uid, data]: [string, any]) => {
          const opponentBattles = allBattles.filter((b: any) => 
            b.participants.includes(uid)
          );
          const opponentWins = allBattles.filter((b: any) => b.winnerId === uid).length;
          
          return {
            id: uid,
            email: data.email,
            streak: data.streak || 0,
            totalDays: data.totalDays || 0,
            wins: opponentWins,
            totalBattles: opponentBattles.length,
            winRate: opponentBattles.length > 0 ? (opponentWins / opponentBattles.length * 100).toFixed(0) : 0,
          };
        })
        .slice(0, 50); // Limit to 50 for AI processing
      
      // Use AI to suggest best matches
      const prompt = `You are an AI matchmaking assistant for a productivity battle system.

User Stats:
- Streak: ${userStats.streak} days
- Total Active Days: ${userStats.totalDays}
- Battle Wins: ${userStats.wins}
- Total Battles: ${userStats.totalBattles}
- Win Rate: ${userStats.winRate}%

Potential Opponents:
${potentialOpponents.map((opp, idx) => 
  `${idx + 1}. ${opp.email} - Streak: ${opp.streak}, Days: ${opp.totalDays}, Wins: ${opp.wins}/${opp.totalBattles} (${opp.winRate}% win rate)`
).join('\n')}

Analyze these opponents and suggest the TOP 5 best matches for a competitive and fair ${battleType} battle. Consider:
1. Similar skill levels (streak, win rate)
2. Active users (high totalDays)
3. Fair competition (not too easy, not too hard)
4. Engagement potential

Return ONLY a JSON array of 5 opponent IDs in order of best match, like: ["id1", "id2", "id3", "id4", "id5"]`;

      const response = await ai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });
      
      const aiResponse = response.choices[0]?.message?.content || "";
      
      // Parse AI response
      let suggestedIds: string[] = [];
      try {
        const jsonMatch = aiResponse.match(/\[.*\]/);
        if (jsonMatch) {
          suggestedIds = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("AI response parsing error:", parseError);
        // Fallback: suggest top 5 by similar stats
        suggestedIds = potentialOpponents
          .sort((a, b) => {
            const aDiff = Math.abs(a.streak - userStats.streak) + Math.abs((a.winRate as number) - (userStats.winRate as number));
            const bDiff = Math.abs(b.streak - userStats.streak) + Math.abs((b.winRate as number) - (userStats.winRate as number));
            return aDiff - bDiff;
          })
          .slice(0, 5)
          .map(opp => opp.id);
      }
      
      // Get full user data for suggested opponents
      const suggestions = suggestedIds
        .map(id => potentialOpponents.find(opp => opp.id === id))
        .filter(Boolean);
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error in AI matchmaking:", error);
      res.status(500).json({ error: "Failed to generate matchmaking suggestions" });
    }
  });

  // Get user's badges
  app.get("/api/badges/user", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('userBadges')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const userBadges = Object.values(snapshot.val()).map((badge: any) => ({
        ...badge,
        earnedAt: new Date(badge.earnedAt),
      }));
      
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Get all available badges
  app.get("/api/badges", async (req, res) => {
    try {
      const db = admin.database();
      
      const snapshot = await db.ref('badges').once('value');
      
      if (!snapshot.exists()) {
        // Initialize default badges if none exist
        const defaultBadges: Partial<Badge>[] = [
          { id: 'first_victory', name: 'First Victory', description: 'Won your first battle', icon: '🏆', rarity: 'common', category: 'battle', requirementType: 'first_win', requirementValue: 1 },
          { id: 'battle_novice', name: 'Battle Novice', description: 'Participated in 5 battles', icon: '⚔️', rarity: 'common', category: 'battle', requirementType: 'total_battles', requirementValue: 5 },
          { id: 'battle_veteran', name: 'Battle Veteran', description: 'Participated in 25 battles', icon: '🛡️', rarity: 'rare', category: 'battle', requirementType: 'total_battles', requirementValue: 25 },
          { id: 'win_streak_5', name: 'Winning Streak', description: 'Won 5 battles in a row', icon: '🔥', rarity: 'rare', category: 'battle', requirementType: 'win_streak', requirementValue: 5 },
          { id: 'champion', name: 'Champion', description: 'Won 10 battles', icon: '👑', rarity: 'epic', category: 'battle', requirementType: 'total_wins', requirementValue: 10 },
          { id: 'legend', name: 'Legend', description: 'Won 50 battles', icon: '💎', rarity: 'legendary', category: 'battle', requirementType: 'total_wins', requirementValue: 50 },
          { id: 'focus_master', name: 'Focus Master', description: 'Won a focus time battle', icon: '🎯', rarity: 'rare', category: 'focus', requirementType: 'focus_battle_win', requirementValue: 1 },
          { id: 'habit_warrior', name: 'Habit Warrior', description: 'Won a habit streak battle', icon: '💪', rarity: 'rare', category: 'habit', requirementType: 'habit_battle_win', requirementValue: 1 },
        ];
        
        // Store default badges
        const badgesRef = db.ref('badges');
        for (const badge of defaultBadges) {
          await badgesRef.child(badge.id!).set({
            ...badge,
            createdAt: new Date().toISOString(),
          });
        }
        
        return res.json(defaultBadges);
      }
      
      const badges = Object.values(snapshot.val());
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Register admin routes
  const { registerAdminRoutes } = await import("./admin-routes");
  registerAdminRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
