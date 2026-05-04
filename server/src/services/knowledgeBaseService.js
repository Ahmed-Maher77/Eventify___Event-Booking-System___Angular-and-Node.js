import Event from "../models/Event.js";

/**
 * Knowledge Base Service
 * Handles retrieving relevant event data to provide context to the AI
 */
class KnowledgeBaseService {
  /**
   * Searches for relevant events based on the user's query
   * @param {string} query - The user's message/query
   * @returns {Promise<Array>} - Array of relevant events
   */
  async findRelevantEvents(query) {
    try {
      // Simple keyword-based search for RAG MVP
      const searchTerms = this._extractKeywords(query);

      if (searchTerms.length === 0) {
        // If no specific keywords found, return upcoming events as default context
        return await Event.find({ status: "upcoming" })
          .sort({ date: 1 })
          .limit(5)
          .select(
            "title description date location category price availableSeats",
          );
      }

      // Expand search terms with synonyms
      const expandedTerms = this._expandSynonyms(searchTerms);
      const regexPattern = expandedTerms.join("|");

      const filter = {
        status: "upcoming",
        $or: [
          { title: { $regex: regexPattern, $options: "i" } },
          { category: { $regex: regexPattern, $options: "i" } },
          { location: { $regex: regexPattern, $options: "i" } },
          { description: { $regex: regexPattern, $options: "i" } },
        ],
      };

      return await Event.find(filter)
        .sort({ date: 1 })
        .limit(10) // Increase limit for better context
        .select(
          "title description date location category price availableSeats",
        );
    } catch (error) {
      console.error("Knowledge Base Search Error:", error);
      return [];
    }
  }

  /**
   * Formats events into a string for the AI prompt
   * @param {Array} events - List of event objects
   * @returns {string} - Formatted context string
   */
  formatEventsForContext(events) {
    if (!events || events.length === 0) {
      return "No specific events found matching the criteria in our database.";
    }

    return events
      .map((event) => {
        const dateStr = new Date(event.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return `Title: ${event.title}
Category: ${event.category}
Date: ${dateStr}
Location: ${event.location}
Price: ${event.price === 0 ? "Free" : "$" + event.price}
Available Seats: ${event.availableSeats}
Description: ${event.description}
---`;
      })
      .join("\n");
  }

  /**
   * Extracts potential keywords from a query
   * @private
   */
  _extractKeywords(query) {
    const stopWords = [
      "a",
      "an",
      "the",
      "is",
      "are",
      "can",
      "help",
      "me",
      "find",
      "show",
      "what",
      "events",
      "happening",
      "in",
      "at",
      "for",
      "to",
      "of",
      "with",
      "any",
      "there",
      "some",
      "about",
      "please",
      "tell",
      "searching",
      "look",
      "looking",
      "want",
      "need",
      "could",
      "would",
    ];

    // Remove common punctuation and split into words
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word));

    // Basic plural handling (extremely naive: remove trailing 's')
    return words.map((word) => (word.endsWith("s") ? word.slice(0, -1) : word));
  }

  /**
   * Expands search terms with common synonyms/related terms
   * @private
   */
  _expandSynonyms(terms) {
    const synonymMap = {
      music: ["concert", "jazz", "band", "festival", "performance", "singer"],
      tech: [
        "conference",
        "workshop",
        "summit",
        "innovation",
        "startup",
        "design",
      ],
      sport: ["run", "cup", "match", "game", "tournament", "volleyball"],
      business: [
        "seminar",
        "roundtable",
        "executive",
        "leadership",
        "readiness",
      ],
      food: ["dining", "festival", "culture", "artisan"],
      party: ["festival", "concert", "night", "celebration"],
    };

    const expanded = new Set(terms);
    terms.forEach((term) => {
      if (synonymMap[term]) {
        synonymMap[term].forEach((syn) => expanded.add(syn));
      }
    });

    return Array.from(expanded);
  }
}

export default new KnowledgeBaseService();
