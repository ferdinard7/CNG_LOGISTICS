/**
 * CHAT SWAGGER
 * Mounted at: /api/chat
 * Routes source: chat.route.js
 *
 * Chatbot endpoint for CNC Logistics. Supports:
 * - Intent-based routing (dispatch, parkngo, waste, support)
 * - Agent handoff (HANDOFF_TAWK) to Tawk.to live chat
 * - OpenAI-powered conversational AI for company info, services, and general questions (when OPENAI_API_KEY is set)
 * - Fallback: company overview for "about services" queries; generic prompt for other messages
 */

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: Chatbot API for service discovery, agent handoff, and casual conversation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRequest:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           example: "I want to book a dispatch delivery"
 *         sessionId:
 *           type: string
 *           description: Optional session ID for conversation continuity
 *           example: "sess_1234567890_abc123"
 *         history:
 *           type: array
 *           description: Optional conversation history for OpenAI context and agent handoff detection
 *           items:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, assistant]
 *               content:
 *                 type: string
 *
 *     ChatAction:
 *       type: object
 *       description: |
 *         NAVIGATE - redirect user to a page (url required).
 *         HANDOFF_TAWK - hand off to Tawk.to live chat; user may be queued if agents are busy.
 *       properties:
 *         type:
 *           type: string
 *           enum: [NAVIGATE, HANDOFF_TAWK]
 *           example: NAVIGATE
 *         url:
 *           type: string
 *           description: Required for NAVIGATE; not used for HANDOFF_TAWK
 *           example: "/dispatch"
 *
 *     ChatResponseData:
 *       type: object
 *       properties:
 *         reply:
 *           type: string
 *           example: "Great choice! Our Dispatch service handles fast package delivery..."
 *         quickReplies:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Book Dispatch", "Track Order", "Talk to Support"]
 *         action:
 *           $ref: '#/components/schemas/ChatAction'
 *         sessionId:
 *           type: string
 *           description: Session ID (returned on first message when not provided)
 *
 *     ChatResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Chat reply"
 *         data:
 *           $ref: '#/components/schemas/ChatResponseData'
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message to the chatbot
 *     description: |
 *       Sends a user message and receives a reply. The chatbot can:
 *       - Route to Dispatch, Park N Go, Waste Pickup, or Support
 *       - Return quick reply buttons and optional action (NAVIGATE or HANDOFF_TAWK)
 *       - Agent handoff: when user requests "speak to agent" or says "yes" to agent offer,
 *         returns HANDOFF_TAWK. User may be placed in queue; Tawk.to handles agent assignment.
 *       - Handle conversational questions about the company and services via OpenAI (OPENAI_API_KEY required)
 *       - When OpenAI is unavailable, general info queries (e.g. "tell me about your service") return a company overview
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Chat reply with reply text, quickReplies, and optional action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chat reply"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reply:
 *                       type: string
 *                     quickReplies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     action:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [NAVIGATE, HANDOFF_TAWK]
 *                           example: "NAVIGATE"
 *                         url:
 *                           type: string
 *                           description: Present for NAVIGATE only
 *                           example: "/dispatch"
 *                     sessionId:
 *                       type: string
 *       400:
 *         description: Bad request - message is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "message is required"
 *       500:
 *         description: Internal server error
 */
