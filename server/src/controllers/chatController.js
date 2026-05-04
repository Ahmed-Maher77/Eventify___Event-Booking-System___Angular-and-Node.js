import aiChatProvider from "../services/aiChatProvider.js";
import AppError from "../middlewares/AppError.js";

/**
 * Chat Controller
 * Manages chatbot interactions
 */
export const getChatCompletion = async (req, res, next) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            throw AppError.badRequest("Messages are required and must be an array.");
        }

        // Validate message structure and roles
        const validRoles = ["user", "assistant", "system"];
        const sanitizedMessages = messages
            .filter(msg => msg.content && validRoles.includes(msg.role))
            .map(msg => ({
                role: msg.role,
                content: msg.content.trim()
            }));

        if (sanitizedMessages.length === 0) {
            throw AppError.badRequest("At least one valid message is required.");
        }

        // Add a system prompt if not present to guide the AI
        const hasSystemPrompt = sanitizedMessages.some(msg => msg.role === "system");
        if (!hasSystemPrompt) {
            sanitizedMessages.unshift({
                role: "system",
                content: "You are Eventify AI, a helpful assistant for the Eventify event booking system. You help users discover events by category, budget, or location. Keep your answers concise and professional."
            });
        }

        // Limit context to last 11 messages (System + 10 messages history)
        const contextMessages = sanitizedMessages.slice(-11);

        const reply = await aiChatProvider.generateChatReply(contextMessages);

        res.status(200).json({
            status: "success",
            data: {
                reply
            }
        });
    } catch (error) {
        next(error);
    }
};
