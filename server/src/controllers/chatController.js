import AppError from "../middlewares/AppError.js";
import aiChatProvider from "../services/aiChatProvider.js";
import knowledgeBaseService from "../services/knowledgeBaseService.js";

/**
 * Chat Controller
 * Manages chatbot interactions with RAG support
 */
export const getChatCompletion = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw AppError.badRequest("Messages are required and must be an array.");
    }

    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. RAG: Retrieve relevant event context based on the user's query
    const relevantEvents =
      await knowledgeBaseService.findRelevantEvents(lastMessage);
    const eventContext =
      knowledgeBaseService.formatEventsForContext(relevantEvents);

    // 2. Validate message structure and roles
    const validRoles = ["user", "assistant", "system"];
    const sanitizedMessages = messages
      .filter((msg) => msg.content && validRoles.includes(msg.role))
      .map((msg) => ({
        role: msg.role,
        content: msg.content.trim(),
      }));

    if (sanitizedMessages.length === 0) {
      throw AppError.badRequest("At least one valid message is required.");
    }

    // 3. Construct System Prompt with Dynamic Knowledge
    const systemPrompt = `You are Eventify AI, a helpful assistant for the Eventify event booking system.
You help users discover events by category, budget, or location. 
Keep your answers concise, professional, and friendly.

Below is the current list of relevant events from our database that you should use to answer the user's questions:
---
${eventContext}
---

Always prioritize these events when making recommendations. If the user asks for something not in the list, politely tell them we don't have exact matches but suggest the closest alternative or ask for more details.`;

    // Ensure system prompt is at the start
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...sanitizedMessages.filter((msg) => msg.role !== "system").slice(-10), // Keep last 10 messages for context
    ];

    const reply = await aiChatProvider.generateChatReply(chatMessages);

    res.status(200).json({
      status: "success",
      data: {
        reply,
      },
    });
  } catch (error) {
    next(error);
  }
};
