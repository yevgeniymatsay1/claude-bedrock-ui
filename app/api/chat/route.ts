import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";

// Initialize Bedrock client
// Uses default credential provider chain (IAM roles, env vars, etc.)
const getBedrockClient = () => {
  return new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    // credentials will be automatically picked up from:
    // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) in local dev
    // 2. IAM role when running in AWS Amplify
  });
};

// Define types for better type safety
interface MessageImage {
  data: string;
  format: string;
}

interface MessageDocument {
  data: string;
  format: string;
  name: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  images?: MessageImage[];
  documents?: MessageDocument[];
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, extendedThinking, searchResults } = await req.json();

    // Map model names to Bedrock model IDs
    const modelIds: Record<string, string> = {
      "sonnet-4.5": "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
      "opus-4.1": "us.anthropic.claude-opus-4-20250514-v1:0",
    };

    const modelId = modelIds[model as string] || modelIds["sonnet-4.5"];

    // Prepare messages for Bedrock
    const bedrockMessages = (messages as ChatMessage[]).map((msg) => {
      const content = [];

      // Add text content
      if (msg.text) {
        content.push({ text: msg.text });
      }

      // Add image content
      if (msg.images && msg.images.length > 0) {
        msg.images.forEach((image) => {
          content.push({
            image: {
              format: image.format,
              source: {
                bytes: Buffer.from(image.data, "base64"),
              },
            },
          });
        });
      }

      // Add document content
      if (msg.documents && msg.documents.length > 0) {
        msg.documents.forEach((doc) => {
          content.push({
            document: {
              format: doc.format,
              name: doc.name,
              source: {
                bytes: Buffer.from(doc.data, "base64"),
              },
            },
          });
        });
      }

      return {
        role: msg.role,
        content,
      };
    });

    // Add search results to system prompt if available
    const systemPrompts = [];
    if (searchResults && (searchResults as SearchResult[]).length > 0) {
      const searchContext = (searchResults as SearchResult[])
        .map((result) => `[${result.title}](${result.url})\n${result.content}`)
        .join("\n\n");
      systemPrompts.push({
        text: `You have access to the following web search results. Use them to provide up-to-date information:\n\n${searchContext}`,
      });
    }

    const client = getBedrockClient();

    // Prepare inference config
    const inferenceConfig = {
      maxTokens: 4096,
      temperature: 1.0,
    };

    // Add extended thinking if enabled
    const additionalModelRequestFields: Record<string, unknown> = {};
    if (extendedThinking) {
      additionalModelRequestFields.thinking = {
        type: "enabled",
        budget_tokens: 10000,
      };
    }

    const command = new ConverseStreamCommand({
      modelId,
      messages: bedrockMessages,
      ...(systemPrompts.length > 0 && { system: systemPrompts }),
      inferenceConfig,
      ...(Object.keys(additionalModelRequestFields).length > 0 && {
        additionalModelRequestFields: additionalModelRequestFields as never
      }),
    });

    const response = await client.send(command);

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!response.stream) {
            controller.close();
            return;
          }

          for await (const event of response.stream) {
            if (event.contentBlockDelta) {
              const delta = event.contentBlockDelta.delta;
              if (delta && "text" in delta && delta.text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`));
              }
            }

            if (event.messageStop) {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
