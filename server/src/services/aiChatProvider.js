import OpenAI from "openai";

/**
 * AI Chat Provider service
 * Handles communication with the Groq API using OpenAI-compatible SDK
 */
class AIChatProvider {
  constructor() {
    this.client = null;
    this.model = null;
  }

  /**
   * Initializes the OpenAI client lazily
   * @private
   */
  _initialize() {
    if (this.client) return;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not defined in environment variables.");
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    this.model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  }
  /**
   * Generates a chat completion reply
   * @param {Array} messages - Array of message objects { role, content }
   * @returns {Promise<string>} - The assistant's reply
   */
  async generateChatReply(messages) {
    try {
      this._initialize();

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Groq API Error:", error.message);
      throw new Error(
        error.message || "Failed to get a response from the AI assistant.",
      );
    }
  }
}

export default new AIChatProvider();
