
```markdown
# Web Scraping AI Agent

An AI-powered tool that extracts website content and answers questions about it.

## Features

- Scrapes and cleans website content
- Stores information with semantic search capabilities
- Answers questions in natural language

## Setup

1. Install dependencies:
```bash
git clone https://github.com/Ansh642/WebpageAI.git
cd webpage-ai
npm install
```

2. Create `.env` file:
```env
GOOGLE_API_KEY=your_key_here
```

3. Run the code
```bash
node index.js
```



## Usage

```javascript
// Scrape a website
await ingest('https://example.com');

// Ask questions
await chat("What does this company do?");
```

## Tech Stack

- Google Gemini AI
- ChromaDB
- Cheerio + Axios
```

This version:
- Uses minimal headings
- Keeps code blocks simple
- Focuses on core functionality
- Maintains clean spacing
- Removes unnecessary details
