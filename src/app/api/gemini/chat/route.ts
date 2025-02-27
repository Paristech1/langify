// Define our own Message type since we're not using the AI SDK
type Message = {
  role: string;
  content: string;
};

export const runtime = "edge";

// Spanish teaching rules extracted from prompt.md
const SPANISH_TEACHING_RULES = `
Role: Spanish Language Teacher
    
Teaching Instructions: 
    - The student is going to provide you an English sentence.
    - You need to help the student transcribe the sentence into Spanish.

Language level - A1 Beginner: Basic communication skills, understanding everyday expressions and phrases. Learners can introduce themselves and ask simple questions

**Strict Rules**
    
    - Don't give away the answer, help the student work through via clues
    - Provide us a table of vocabulary.
    - Do not provide particles in the vocabulary, student needs to figure out correct particles to use
    - If the student asks for the answer, tell them you cannot but you can provide them clues.
    - Do not provide the answer, help the student work through via clues
    - Provide words in their dictionary form, student needs to figure out conjugations

**After answer is revealed**
     - Score the Users' attempt on a scale of 1-100 based on proper completion of sentence. 
    
    - After answer is revealed, provide 2 sentences that use the words that are part of this translation in a different variant of the sentence to improve knowledge deepening

EXAMPLE: 
[STUDENT input]: "Cats are at the door, did you leave the catnip out?"

[YOUR output]: "Los gatos están en la puerta, ¿dejaste la hierba gatera afuera?"

<example of user input / assistant output> 

    User input : "My password and alarm are not working in my station."

 assistant output :

### **Vocabulary Table:**  

| **English**      | **Spanish**      | **Notes** |
|-----------------|----------------|----------|
| password       | contraseña      | noun |
| alarm         | alarma          | noun |
| to work       | funcionar       | verb (dictionary form) |
| not           | no              | negation |
| station       | estación        | noun |
| my            | mi              | possessive adjective |

---

### **Sentence Structure Clues:**  
- **"My password and alarm"** → Think about how to correctly join two nouns.  
- **"Are not working"** → The verb **funcionar** needs to be in the correct form for **password + alarm** (third-person plural).  
- **"In my station"** → Think about the correct preposition for location.

---

 Write your best attempt, and I'll guide you further.  

Once you get it right, I will provide **two extra sentences** to help you deepen your understanding! 🚀
`;

// Hardcoded API key for Edge runtime compatibility
const GEMINI_API_KEY = "AIzaSyBCmxHLlrPUiIdmEFFEHqyO4GpwpXIEjBU";
const GEMINI_MODEL = "gemini-2.0-flash";

// Detect if the input is a Spanish translation attempt by checking message structure
function isSpanishTranslationAttempt(messages: Message[]): boolean {
  // Look at the most recent user message
  const lastMessage = messages[messages.length - 1];
  
  // If the message doesn't exist or isn't from the user, return false
  if (!lastMessage || lastMessage.role !== 'user') return false;
  
  const content = lastMessage.content.toLowerCase();
  
  // If this is the first message and it looks like an English sentence, it's not a translation attempt
  if (messages.length === 1) {
    // Basic heuristic: if it has multiple words and doesn't contain Spanish characters, likely English
    const words = content.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1 && 
        !content.includes('ñ') && 
        !content.includes('á') && 
        !content.includes('é') && 
        !content.includes('í') && 
        !content.includes('ó') && 
        !content.includes('ú')) {
      return false;
    }
  }
  
  // Check the message history - if we have an assistant message before this, it might be a translation attempt
  if (messages.length > 1) {
    const prevMessage = messages[messages.length - 2];
    if (prevMessage.role === 'assistant' && 
        (prevMessage.content.includes('Vocabulary Table') || 
         prevMessage.content.includes('Sentence Structure Clues'))) {
      return true;
    }
  }
  
  // Check if the message appears to be a translation attempt
  // This is a simple heuristic and might need refinement based on app usage patterns
  return (
    // Contains Spanish-specific characters
    content.includes('ñ') || 
    content.includes('á') || 
    content.includes('é') || 
    content.includes('í') || 
    content.includes('ó') || 
    content.includes('ú') || 
    // Or contains common Spanish words
    content.includes(' el ') || 
    content.includes(' la ') || 
    content.includes(' los ') || 
    content.includes(' las ') ||
    content.includes(' y ') ||
    content.includes(' es ') ||
    // Or if it explicitly mentions translation
    content.includes('translate') ||
    content.includes('spanish') ||
    // Advanced check - if it starts with "Mi " or "Yo ", likely Spanish
    content.trim().startsWith('mi ') ||
    content.trim().startsWith('yo ') || 
    content.trim().startsWith('el ') ||
    content.trim().startsWith('la ')
  );
}

// Extract original English sentence from previous messages
function getOriginalEnglishSentence(messages: Message[]): string | null {
  // If there's only one message, there's no original English to extract
  if (messages.length <= 1) return null;
  
  // First, look for the first user message that received a response with Vocabulary Table
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && 
        messages[i+1].role === 'assistant' && 
        messages[i+1].content.includes('Vocabulary Table')) {
      return messages[i].content;
    }
  }
  
  // If not found, fall back to the previous user message before the attempt
  for (let i = messages.length - 2; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content;
    }
  }
  
  return null;
}

// Convert our messages to Gemini API format
function convertMessagesToGeminiFormat(messages: Message[], systemMessage: string) {
  // Start with the system message as the first message content
  const geminiMessages = [
    {
      role: "user",
      parts: [{ text: systemMessage }]
    },
    {
      role: "model",
      parts: [{ text: "I understand and will follow these instructions. I will provide vocabulary tables, sentence structure clues, and follow the teaching methodology without giving away the answer." }]
    }
  ];

  // Add the conversation messages
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    // Convert roles: 'user' stays as 'user', 'assistant' becomes 'model'
    const role = message.role === 'assistant' ? 'model' : 'user';
    
    geminiMessages.push({
      role,
      parts: [{ text: message.content }]
    });
  }

  return geminiMessages;
}

// This function makes a non-streaming request to Gemini API
async function callGeminiAPI(messages: Message[], systemMessage: string): Promise<string> {
  try {
    // Convert messages to Gemini format
    const geminiMessages = convertMessagesToGeminiFormat(messages, systemMessage);
    
    // Prepare the request payload
    const payload = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    };
    
    // Make the API call (non-streaming)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts[0] && 
        data.candidates[0].content.parts[0].text) {
        
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error("Unexpected response format from Gemini API");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Create system message - default to Spanish teaching rules as required by prompt.md
    let systemMessage = SPANISH_TEACHING_RULES;
    let messageType = 'Spanish teaching rules';
    
    // Determine if this is a Spanish translation attempt for continuation messages
    const isTranslationAttempt = messages.length > 1 ? isSpanishTranslationAttempt(messages) : true;
    console.log('Is translation attempt:', isTranslationAttempt);
    
    // Get original English message if this is a continuation of a translation attempt
    const originalEnglish = (isTranslationAttempt && messages.length > 1) ? getOriginalEnglishSentence(messages) : null;
    console.log('Original English:', originalEnglish);
    
    // For continuation messages, check if we should still use Spanish teaching rules
    if (messages.length > 1 && !isTranslationAttempt) {
      // Only for non-first messages that aren't translation attempts, use general assistant
      systemMessage = "You are a helpful AI assistant";
      messageType = 'General assistant';
    }
    
    // If we found the original English sentence in a translation conversation, add it to the system message
    if (isTranslationAttempt && originalEnglish) {
      systemMessage += `\nOriginal English sentence: "${originalEnglish}"`;
    }
    
    // For first messages with English text, add the message as the sentence to translate
    if (messages.length === 1) {
      const firstMessage = messages[0].content;
      systemMessage += `\nOriginal English sentence: "${firstMessage}"`;
    }
    
    console.log('Using system message type:', messageType);

    try {
      // Use the non-streaming API instead since we're having issues with streaming
      const result = await callGeminiAPI(messages, systemMessage);
      
      // Return the result as JSON
      return new Response(JSON.stringify({ text: result }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      console.error("Error in Gemini API call:", error);
      return new Response(JSON.stringify({ 
        error: "Could not complete translation. Please try again." 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error: unknown) {
    console.error('Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 