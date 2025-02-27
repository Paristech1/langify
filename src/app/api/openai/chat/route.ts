import { convertToCoreMessages, streamText, type Message } from "ai";

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
`;

// Detect if the input is a Spanish translation attempt by checking message structure
function isSpanishTranslationAttempt(messages: Message[]): boolean {
  // Look at the most recent user message
  const lastMessage = messages[messages.length - 1];
  
  // If the message doesn't exist or isn't from the user, return false
  if (!lastMessage || lastMessage.role !== 'user') return false;
  
  const content = lastMessage.content.toLowerCase();
  
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
    // Or if it mentions translation
    content.includes('translate')
  );
}

// Extract original English sentence from previous messages
function getOriginalEnglishSentence(messages: Message[]): string | null {
  // If there's only one message, there's no original English to extract
  if (messages.length <= 1) return null;
  
  // Look for the previous user message before the attempt
  for (let i = messages.length - 2; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content;
    }
  }
  
  return null;
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Determine if this is a Spanish translation attempt
  const isTranslationAttempt = isSpanishTranslationAttempt(messages);
  
  // Get original English message if this is a translation attempt
  const originalEnglish = isTranslationAttempt ? getOriginalEnglishSentence(messages) : null;
  
  // Create system message based on whether this is a translation attempt
  let systemMessage = "You are a helpful AI assistant";
  
  if (isTranslationAttempt) {
    systemMessage = SPANISH_TEACHING_RULES;
    
    // If we found the original English sentence, add it to the system message
    if (originalEnglish) {
      systemMessage += `\nOriginal English sentence: "${originalEnglish}"`;
    }
  }

  // TODO: Replace with Gemini API call
  // Will need Gemini API details from the user
  const result = await streamText({
    model: /* Will be replaced with Gemini model */,
    messages: convertToCoreMessages(messages),
    system: systemMessage,
  });

  return result.toDataStreamResponse();
}
