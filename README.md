Here’s your **README** file for the **AI Agentic Web Support App** in the same format:

---

# 🕸️ AI Agentic Web Support App

An intelligent support assistant that scrapes website content, generates semantic embeddings using Google Gemini, and stores them in a vector database (ChromaDB) for meaningful question answering — just like a smart chatbot for websites.

---

## 🚀 Features

* Structured web scraping (headings, paragraphs, metadata)
* Gemini 1.5 & Embedding-001 integration for vector generation
* Semantic search using ChromaDB
* Context-aware AI answers to user queries
* CLI-based chat interface
* Fully agentic behavior with web content ingestion → vectorization → QA

---

## 🛠 Tech Stack

* Node.js
* Axios + Cheerio (for web scraping)
* Google Generative AI (Gemini)
* ChromaDB (self-hosted)
* dotenv
* pnpm

---

## 📦 Setup

1. Clone the repo & install dependencies:

```bash
git clone https://github.com/Ansh642/WebpageAI.git
cd ai-agentic-web-support
npm install
```

2. Create a `.env` file:

```env
GOOGLE_API_KEY=your_google_api_key
```

3. Start ChromaDB locally:

```bash
docker run -d -p 8000:8000 ghcr.io/chroma-core/chroma:latest
```

4. Run the app:

```bash
node index.js
```

---

## 💬 Example Interaction

```bash
>> What is Universal Agent about in atomic work?

✅ AI Response:
The Universal Agent by Atomicwork is designed to...
```

---

## 👤 Author

**Ansh Agarwal**
📧 [anshagarwal642@gmail.com](mailto:anshagarwal642@gmail.com)
🔗 [GitHub](https://github.com/Ansh642) | [LinkedIn](https://www.linkedin.com/in/ansh-agarwal-b830b3218)

---
