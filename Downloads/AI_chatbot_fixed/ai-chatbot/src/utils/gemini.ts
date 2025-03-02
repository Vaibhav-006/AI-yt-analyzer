// Initialize the Gemini API
export const initializeGemini = async (apiKey: string) => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Test the connection
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello"
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    // Return an object with the API key and URL for future use
    return { apiKey, url };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to initialize Gemini API. Please verify your API key and permissions.');
  }
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'audio';
  mediaUrl?: string;
};

// Helper function to handle chat responses
export async function* streamChat(
  model: { apiKey: string; url: string },
  messages: ChatMessage[],
  onPartialResponse?: (partial: string) => void
) {
  try {
    // Prepare the chat history
    const contents = messages.map(msg => ({
      parts: [{
        text: msg.content
      }],
      role: msg.role === 'assistant' ? 'model' : 'user'
    }));

    // Send request to Gemini API
    const response = await fetch(model.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.5, // Lower temperature for more focused responses
          topK: 1,         // More deterministic output
          topP: 0.8,       // Balance between creativity and consistency
          maxOutputTokens: 1024,
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate response');
    }

    const result = await response.json();
    const text = result.candidates[0]?.content?.parts?.[0]?.text || '';

    if (onPartialResponse) {
      onPartialResponse(text);
    }

    yield text;
  } catch (error: any) {
    console.error('Chat Error:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
} 