
import { error } from '@sveltejs/kit';

export type MessageBody = { chats: { role: "user" | "assistant", content: string }[] }

const CHAT_ENDPOINT = 'http://127.0.0.1:8080/api/v1/chat-stream';

export const POST = async ({ request }) => {
    const body: MessageBody = await request.json();
    if (!body) throw error(400, 'Missing Data');

    const readableStream = new ReadableStream({
        async start(controller) {
            try {
                const response = await fetch(CHAT_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body.chats),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body!.getReader();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const decoder = new TextDecoder()

                    const text = decoder.decode(value, { stream: true });
                    controller.enqueue(text);
                }
            } catch (error) {
                console.error('Error in stream:', error);
                controller.error(error);
            } finally {
                controller.close();
            }
        }
    });

    return new Response(readableStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}

