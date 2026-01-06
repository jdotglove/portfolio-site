import { Request, Response } from "../../plugins/express";
import { SERVER_RESPONSE_CODES, decodeSessionToken } from "../../utils/constants";

/**
 * @function knowledgeNest
 * @param req
 * @member body.message - Message to use for access to knowledge
 * @member body.conversationId - Conversation ID to use for access to knowledge
 */
export const knowledgeNest = async (req: Request, res: Response) => {
  try {
    // Get session token from cookies
    const sessionToken = req.cookies?.session_token;
    if (!sessionToken) {
      res.status(SERVER_RESPONSE_CODES.FORBIDDEN).send({
        success: false,
        message: "No session token found",
      }).end();
      return;
    }

    const decodedToken = decodeSessionToken(sessionToken);
    if (!decodedToken) {
      res.status(SERVER_RESPONSE_CODES.FORBIDDEN).send({
        success: false,
        message: "Invalid session token",
      }).end();
      return;
    }

    const message = req.query.message || req.body.message;
    const conversationId = req.query.conversationId || req.body.conversationId;
    const userId = req.query.userId || req.body.userId;

    if (!message) {
      res.status(SERVER_RESPONSE_CODES.BAD_PAYLOAD).send({
        success: false,
        message: "Message is required",
      }).end();
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control"
    });

    res.write(`data: ${JSON.stringify({ type: "connected", message: "Connected to knowledge stream" })}\n\n`);

    const streamExternalAPI = async () => {
      try {
        const externalResponse = await fetch(`${process.env.API_BASE_URL}/knowledge?message=${encodeURIComponent(message)}&conversationId=${conversationId || ''}&userId=${userId}`, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${process.env.API_KEY}`,
          }
        });

        if (!externalResponse.ok) {
          throw new Error(`External API error: ${externalResponse.status} ${externalResponse.statusText}`);
        }

        const reader = externalResponse.body?.getReader();
        if (!reader) {
          throw new Error("No response body reader available");
        }

        const sleepNow = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split("\n");
          for (const line of lines) {
            if (line !== "" && line.trim() !== "") {
              try {
                const { data } = JSON.parse(line);
                if (data.message && data.message !== "") {
                  const chunk = {
                    type: "message",
                    body: data.message,
                    sender: data.personaName,
                    conversationId: conversationId,
                    userId: decodedToken.userId,
                    createdAt: new Date(data.timestamp).toISOString(),
                  };
                  
                  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }
              } catch (parseError) {
                console.error("Error parsing external API response:", parseError);
              }
            }
          }

          await sleepNow(10000);
        }

        const completion = {
          type: "complete",
          message: "Response complete",
          conversationId: conversationId
        };
        
        res.write(`data: ${JSON.stringify(completion)}\n\n`);
        res.end();

      } catch (error) {
        console.error(`External API streaming error: ${error}`);
        
        const fallbackResponses = [
          "I'm having trouble connecting to the knowledge service.",
          "Let me try a different approach...",
          "Based on my available knowledge:",
          "Here's what I can tell you about that:",
          "I hope this information is helpful!"
        ];

        for (let i = 0; i < fallbackResponses.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const chunk = {
            type: "chunk",
            content: fallbackResponses[i],
            conversationId: conversationId,
            userId: decodedToken.userId
          };
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        const completion = {
          type: "complete",
          message: "Response complete (fallback mode)",
          conversationId: conversationId
        };
        
        res.write(`data: ${JSON.stringify(completion)}\n\n`);
        res.end();
      }
    };

    streamExternalAPI().catch(error => {
      console.error("Streaming error:", error);
      res.write(`data: { "type": "error", "message": "Streaming error occurred" }\n\n`);
      res.end();
    });

  } catch (error: any) {
    console.error(`Error in knowledge streaming: ${error.message}`);
    
    if (!res.headersSent) {
      res.status(SERVER_RESPONSE_CODES.SERVER_ERROR).send({
        success: false,
        error: error.message,
      }).end();
    } else {
      res.write(`data: { "type": "error", "message": "${error.message}" }\n\n`);
      res.end();
    }
  }
}