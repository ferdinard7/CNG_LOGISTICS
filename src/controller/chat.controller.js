// src/controllers/chat.controller.js
import { StatusCodes } from "http-status-codes";
import logger from "../config/logger.js";

const normalize = (t = "") => t.toLowerCase().trim();

const buildResponse = ({ reply, quickReplies = [], action = null }) => ({
  success: true,
  message: "Chat reply",
  data: { reply, quickReplies, action },
});

export const chatReply = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "message is required",
      });
    }

    const text = normalize(message);

    // ---- Intent detection (simple MVP) ----
    const wantsDispatch =
      text.includes("dispatch") || text.includes("send package") || text.includes("delivery");

    const wantsParkNgo =
      text.includes("park") || text.includes("move") || text.includes("relocation") || text.includes("pack n go");

    const wantsWaste =
      text.includes("waste") || text.includes("pickup") || text.includes("recycle") || text.includes("trash");

    const wantsSupport =
      text.includes("support") || text.includes("help") || text.includes("complain") || text.includes("issue");

    if (wantsDispatch) {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Great choice! Our Dispatch service handles fast package delivery with tracking. You can book at /dispatch.",
          quickReplies: ["Book Dispatch", "Track Order", "Talk to Support"],
          action: { type: "NAVIGATE", url: "/dispatch" },
        })
      );
    }

    if (wantsParkNgo) {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Park N Go helps with moving & relocation. You can book a move at /park-n-go.",
          quickReplies: ["Book Park N Go", "Talk to Support"],
          action: { type: "NAVIGATE", url: "/park-n-go" },
        })
      );
    }

    if (wantsWaste) {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Waste Pickup request is available at /waste. Note: minimum 5kg for pickup.",
          quickReplies: ["Request Waste Pickup", "Talk to Support"],
          action: { type: "NAVIGATE", url: "/waste" },
        })
      );
    }

    if (wantsSupport) {
      return res.status(StatusCodes.OK).json(
        buildResponse({
          reply:
            "Sure — you can reach support via /contact. If you tell me what’s wrong, I can guide you too.",
          quickReplies: ["Open Contact Page", "Dispatch Issue", "Payment Issue"],
          action: { type: "NAVIGATE", url: "/contact" },
        })
      );
    }

    // Default fallback
    return res.status(StatusCodes.OK).json(
      buildResponse({
        reply:
          "I can help you book Dispatch, Park N Go, or Waste Pickup. What do you want to do?",
        quickReplies: ["Book Dispatch", "Book Park N Go", "Request Waste Pickup", "Talk to Support"],
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