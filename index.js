import axios from "axios";
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChromaClient } from "chromadb";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


const chroma = new ChromaClient({
    path: "http://localhost:8000"
});

await chroma.heartbeat();

const WEB_COLLECTION = `WEB_SCAPED_DATA_COLLECTION-1`;

// Clean previous data
await chroma.deleteCollection({ name: WEB_COLLECTION });

await chroma.getOrCreateCollection({ name: WEB_COLLECTION });

async function webscrape(url = '') {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, footer').remove();

    // Extract structured content
    const structuredContent = [];
    
    // Process headings and paragraphs in order
    $('body').find('h1, h2, h3, h4, h5, h6, p').each((_, el) => {
        const tag = $(el).prop('tagName').toLowerCase();
        const text = $(el).text().trim();
        
        if (text && text.length > 10) { // Minimum content length
            structuredContent.push({
                type: tag.startsWith('h') ? 'heading' : 'paragraph',
                level: tag.startsWith('h') ? parseInt(tag.substring(1)) : 0,
                content: text,
                tag
            });
        }
    });

    // Extract links (keep your existing link extraction)
    const internalLinks = new Set();
    const externalLinks = new Set();

    $('a').each((_, el) => {
        const link = $(el).attr('href');
        if (!link || link === '/') return;

        if (link.startsWith('http') || link.startsWith('https')) {
            externalLinks.add(link);
        } else {
            internalLinks.add(link);
        }
    });

    return {
        title: $('title').text(),
        metaDescription: $('meta[name="description"]').attr('content'),
        structuredContent,
        internalLinks: Array.from(internalLinks),
        externalLinks: Array.from(externalLinks),
        rawHtml: {
            head: $('head').html(),
            body: $('body').html()
        }
    };
}

// Generate embeddings using Gemini
async function generateVectorEmbeddings({ text }) {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    const result = await model.embedContent({
        content: { parts: [{ text }] }
    });

    return result.embedding.values;
}

// Insert embeddings into ChromaDB
async function insertIntoDb({ embedding, url, body = '', head }) {
    const collection = await chroma.getOrCreateCollection({
        name: WEB_COLLECTION,
    });

    await collection.add({
        ids: [url + Math.random()],
        embeddings: [embedding],
        metadatas: [{ url, body, head }]
    });
}

// Text chunking function
function chunkText(text, maxBytes = 20000) {
    if (typeof text !== 'string') throw new Error('Input must be a string');

    const encoder = new TextEncoder();
    const chunks = [];

    let currentChunk = '';
    for (const sentence of text.split(/(?<=[.?!])\s+/)) {
        const chunkBytes = encoder.encode(currentChunk + sentence).length;

        if (chunkBytes > maxBytes) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += sentence + ' ';
        }
    }

    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
}

// Ingest function
async function ingest(url = '') {
    if (!url.startsWith("http") || url.endsWith(".pdf")) {
        console.log(`Skipping unsupported URL: ${url}`);
        return;
    }

    console.log(`Ingesting... ${url}`);
    const { structuredContent, title, metaDescription, rawHtml } = await webscrape(url);

    // Convert structured content to text chunks while preserving hierarchy
    let currentSection = '';
    const chunks = [];
    
    for (const item of structuredContent) {
        const contentWithStructure = item.type === 'heading' 
            ? `\n${'#'.repeat(item.level)} ${item.content}\n` 
            : item.content + '\n';
            
        const potentialChunk = currentSection + contentWithStructure;
        
        if (potentialChunk.length > 20000 && currentSection) {
            chunks.push(currentSection.trim());
            currentSection = contentWithStructure;
        } else {
            currentSection = potentialChunk;
        }
    }
    
    if (currentSection.trim()) {
        chunks.push(currentSection.trim());
    }

    // Store each chunk with its embeddings
    for (const chunk of chunks) {
        const embedding = await generateVectorEmbeddings({ text: chunk });
        await insertIntoDb({
            embedding,
            url,
            body: chunk,
            head: JSON.stringify({ title, metaDescription }), // Store metadata
            structured: true // Mark as structured content
        });
    }

    console.log(`✅ Ingesting ${url} successful (${chunks.length} chunks)`);
}

// Start ingestion
await ingest('https://www.piyushgarg.dev/');
await ingest('https://www.piyushgarg.dev/about');
await ingest('https://www.piyushgarg.dev/cohort');

async function chat(question = '') {
    const questionEmbedding = await generateVectorEmbeddings({ text: question });
  
    const collection = await chroma.getOrCreateCollection({
      name: WEB_COLLECTION,
    });
  
    const collectionResult = await collection.query({
      nResults: 1,
      queryEmbeddings: questionEmbedding,
    });
  
    const bodies = collectionResult.metadatas[0]
      .map((e) => e.body)
      .filter((e) => e.trim() !== '' && !!e);
  
    const urls = collectionResult.metadatas[0]
      .map((e) => e.url)
      .filter((e) => e.trim() !== '' && !!e);
  
    console.log('\n🔍 Matched URLs:', urls.join('\n   '));
  
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
    const prompt = `
You are an AI support assistant for a website. Based on the retrieved content below, answer the user's question clearly and concisely.

Question: ${question}
URL: ${urls.join(', ')}

Page Content:
${bodies.join('\n\n')}
`;
  
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Format the response nicely
        console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m');
        console.log('\x1b[1m\x1b[33m🤖 AI Response:\x1b[0m');
        console.log('\x1b[36m════════════════════════════════════════════\x1b[0m\n');
        
        // Format paragraphs with proper line breaks
        const formattedText = text
            .split('\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .join('\n\n   ');
        
        console.log('   ' + formattedText);
        console.log('\n\x1b[36m════════════════════════════════════════════\x1b[0m\n');
    } catch (error) {
        console.error('\x1b[31mError generating response:\x1b[0m', error);
    }
}

await chat("What all is covered in cohort and what about coupon code if any?");
