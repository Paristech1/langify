# Langify: AI-Powered Language Learning Application

This is a full-stack application for learning Spanish through interactive translation with intelligent teaching feedback. The application uses Gemini AI to provide vocabulary hints, clues, and guidance rather than direct translations.

## Features

- Interactive Spanish language learning with AI teaching assistance
- Vocabulary tables and learning hints
- Sentence structure clues instead of direct answers
- Scoring of translation attempts
- Example sentences to reinforce learning
- Modern, responsive UI with real-time streaming responses

## Technologies Used

- Next.js 14 with App Router
- TailwindCSS for styling
- Gemini 2.0 Flash API for AI capabilities
- Edge Runtime for API routes
- Streaming responses for real-time feedback

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- A Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Paristech1/langify.git
   cd langify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.0-flash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Spanish Learning Process

1. Enter an English sentence you want to translate to Spanish
2. The system will provide vocabulary hints and clues rather than direct answers
3. Use the hints to attempt your own translation
4. Submit your attempt and receive feedback, scoring, and additional examples
5. Practice with new sentences to improve your skills

## Project Structure

- `/src/app/api/gemini`: API routes for the Gemini AI integration
- `/src/components`: React components including the main TranslationUI
- `/src/lib`: Utility functions, hooks, and context providers

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.