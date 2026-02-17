// src/controller/chat.controller.js
import { StatusCodes } from "http-status-codes";
import OpenAI from "openai";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

const normalize = (t = "") => t.toLowerCase().trim();

const buildResponse = ({ reply, quickReplies = [], action = null, sessionId = null }) => ({
  success: true,
  message: "Chat reply",
  data: { reply, quickReplies, action, ...(sessionId && { sessionId }) },
});

/** Check if message matches service intent (dispatch, parkngo, waste, support) */
function detectServiceIntent(text) {
  const wantsDispatch =
    text.includes("dispatch") || text.includes("send package") || text.includes("delivery") || text.includes("book dispatch");
  const wantsParkNgo =
    text.includes("park") || text.includes("move") || text.includes("relocation") || text.includes("pack n go") || text.includes("parkngo");
  const wantsWaste =
    text.includes("waste") || text.includes("pickup") || text.includes("recycle") || text.includes("trash") || text.includes("recyclable");
  const wantsSupport =
    text.includes("support") || text.includes("help") || text.includes("complain") || text.includes("issue") || text.includes("contact");

  if (wantsDispatch) return "dispatch";
  if (wantsParkNgo) return "parkngo";
  if (wantsWaste) return "waste";
  if (wantsSupport) return "support";
  return null;
}

/** Check if user is asking about the company, services in general, or informational queries */
function detectGeneralInfoQuery(text) {
  const infoKeywords = [
    "about", "service", "services", "company", "what do you", "tell me",
    "who are you", "what are you", "what does", "explain", "information",
    "know about", "learn about", "offer", "provide", "do you do",
    "your business", "your company", "logistics", "help with",
  ];
  const t = text.toLowerCase().trim();
  return infoKeywords.some((k) => t.includes(k));
}

/** Static company overview for when OpenAI is unavailable on general info queries */
const COMPANY_OVERVIEW = `CNC Logistics Solutions is a Nigerian logistics company that helps individuals and businesses with:

Dispatch – Fast package delivery with real-time tracking. Send documents, parcels, and goods across Lagos and beyond.

Park 'N' Go – Moving and relocation services. Whether you're moving to a new home or office, we help with packing and transport.

Waste Pickup – Recycling collection for plastics, paper, and other recyclables. Minimum 5kg for pickup.

We're here to make logistics simple and reliable. You can book any service through our website, or say "Talk to Support" to connect with our customer care team for personalized help.`;

/** Check if user wants to speak with a real agent (direct request or affirmative to agent offer) */
function detectAgentHandoffRequest(text, history = []) {
  const agentKeywords = [
    "speak to agent", "speak to an agent", "speak with agent", "speak with an agent",
    "talk to agent", "talk to an agent", "talk with agent", "talk with an agent",
    "talk to support", "speak to support", "talk with support", "speak with support",
    "human agent", "real agent", "customer care", "customer care agent",
    "live agent", "real person", "human", "speak to someone", "talk to someone",
    "connect me to agent", "transfer to agent", "agent please", "need an agent",
    "want to speak with agent", "want to talk to agent", "like to speak to agent",
    "speak to a human", "talk to a human", "speak to real person",
  ];
  const t = text.toLowerCase().trim();
  if (agentKeywords.some((k) => t.includes(k))) return true;
  if (/\b(speak|talk|connect|transfer|want|need)\b.*\bagent\b/.test(t)) return true;
  if (/\b(speak|talk)\b.*\bsupport\b/.test(t)) return true;

  const affirmative = ["yes", "yeah", "sure", "ok", "okay", "please", "yes please", "ok please"];
  if (affirmative.includes(t) && history.length > 0) {
    const lastAssistant = [...history].reverse().find((h) => h.role === "assistant");
    if (lastAssistant) {
      const content = (lastAssistant.content || "").toLowerCase();
      if (content.includes("agent") || content.includes("customer care") || content.includes("real agent")) {
        return true;
      }
    }
  }
  return false;
}

/** Call OpenAI for casual conversation when API key is set */
async function getOpenAIReply(message, history = []) {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const systemPrompt = `You are a friendly, helpful assistant for CNC Logistics Solutions, a Nigerian logistics company.

**Company & Services:**
- CNC Logistics Solutions offers three main services in Nigeria:
  1. **Dispatch** – Package delivery with real-time tracking. Send documents, parcels, goods across Lagos and beyond.
  2. **Park 'N' Go** – Moving and relocation services. We help with packing and transport for home or office moves.
  3. **Waste Pickup** – Recycling collection for plastics, paper, and recyclables. Minimum 5kg for pickup.

**Your role:**
- Answer any question about the company, services, or logistics in a conversational, helpful way.
- When users ask "tell me about your service" or "what do you do", give a clear, friendly overview of all three services.
- Don't just repeat "I can help you book..." – actually explain what each service does and how it helps.
- Be concise (2–3 short paragraphs max). Don't make up prices or specific details—direct users to the booking pages (/dispatch, /parkngo, /waste) for details.
- For complex issues, payment problems, or personalized help, offer: "Would you like to speak with a customer care agent? They can assist you directly."`;
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });
    const content = completion.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (err) {
    logger.warn("OpenAI chat error", { err: err?.message });
    return null;
  }
}

export const chatReply = async (req, res) => {
  try {
    const { message, sessionId: clientSessionId, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "message is required",
      });
    }

    const text = normalize(message);
    const sessionId = clientSessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Agent handoff FIRST – before support (so "talk to support" opens Tawk.to, not contact page)
    if (detectAgentHandoffRequest(text, history)) {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Connecting you to a customer care agent. You may be placed in a queue if other visitors are ahead. An agent will join shortly—please wait.",
          quickReplies: [],
          action: { type: "HANDOFF_TAWK" },
          sessionId: clientSessionId ? undefined : sessionId,
        })
      );
    }

    // Intent-based routing for service discovery
    const intent = detectServiceIntent(text);

    if (intent === "dispatch") {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Great choice! Our Dispatch service handles fast package delivery with tracking. You can book at /dispatch.",
          quickReplies: ["Book Dispatch", "Track Order", "Talk to Support"],
          action: { type: "NAVIGATE", url: "/dispatch" },
          sessionId: clientSessionId ? undefined : sessionId,
        })
      );
    }

    if (intent === "parkngo") {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Park N Go helps with moving & relocation. You can book a move at /parkngo.",
          quickReplies: ["Book Park N Go", "Talk to Support"],
          action: { type: "NAVIGATE", url: "/parkngo" },
          sessionId: clientSessionId ? undefined : sessionId,
        })
      );
    }

    if (intent === "waste") {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Waste Pickup is available at /waste. Note: minimum 5kg for pickup.",
          quickReplies: ["Request Waste Pickup", "Talk to Support"],
          action: { type: "NAVIGATE", url: "/waste" },
          sessionId: clientSessionId ? undefined : sessionId,
        })
      );
    }

    if (intent === "support") {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "You can reach support via /contact. Tell me what's wrong and I can guide you too. Would you like to speak with a customer care agent?",
          quickReplies: ["Speak to Customer Care", "Open Contact Page", "Dispatch Issue", "Payment Issue"],
          action: { type: "NAVIGATE", url: "/contact" },
          sessionId: clientSessionId ? undefined : sessionId,
        })
      );
    }

    // Casual conversation: use OpenAI when available
    const openaiReply = await getOpenAIReply(message, history);
    if (openaiReply) {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply: openaiReply,
          quickReplies: ["Book Dispatch", "Book Park N Go", "Request Waste Pickup", "Talk to Support"],
          sessionId: clientSessionId ? undefined : sessionId,
        })
      );
    }

    // Fallback: use company overview for general info queries; generic prompt otherwise
    const isGeneralInfo = detectGeneralInfoQuery(text);
    const fallbackReply = isGeneralInfo
      ? COMPANY_OVERVIEW
      : "I can help you book Dispatch, Park N Go, or Waste Pickup. What would you like to do?";
    return res.status(StatusCodes.OK).json(
      buildResponse({
        reply: fallbackReply,
        quickReplies: ["Book Dispatch", "Book Park N Go", "Request Waste Pickup", "Talk to Support"],
        sessionId: clientSessionId ? undefined : sessionId,
      })
    );
  } catch (err) {
    logger.error("chatReply error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};
