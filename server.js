import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
// FIXED: Tell express to serve static files from the root directory instead of /public
app.use(express.static(__dirname));

// Rate Limiter configuration
const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, 
	max: 3, 
	standardHeaders: 'draft-7', 
	legacyHeaders: false, 
	message: { success: false, error: "Too many arguments! The Judge needs a break. Please wait a minute before submitting again." }
});

// In-Memory Testing Database Storage
const memoryDb = {};

function saveVerdict(id, htmlContent) {
    memoryDb[id] = { htmlContent, timestamp: new Date().toISOString() };
}

function getVerdict(id) {
    return memoryDb[id] || null;
}

// System Prompt
const systemPrompt = `You are the Chief Justice of the Supreme Court of Petty Disputes. 
Your job is to read an argument between two individuals, strictly pick ONE clear winner using hilarious, absurd, yet highly formal legal reasoning.
Never sit on the fence. Be completely biased toward one arbitrary side.
Format your entire output using clean HTML tags (do not use code blocks like \`\`\`html). Use structural div styling tags.
Your output must structure itself exactly across these three parts:
1. <div class="mb-4"><h3 class="text-amber-500 font-bold font-serif-court text-sm uppercase tracking-wider mb-1">I. The Indictment</h3><p class="text-sm">Recap the case with intense gravity (e.g., "[NameA] contends X, whereas [NameB] asserts Y...").</p></div>
2. <div class="mb-4"><h3 class="text-amber-500 font-bold font-serif-court text-sm uppercase tracking-wider mb-1">II. The Judicial Opinion</h3><p class="text-sm">Break down the logic using ridiculous metaphors, historical analogies, or mock legal precedents.</p></div>
3. <div class="p-3 bg-amber-600/5 border border-amber-600/20 rounded"><h3 class="text-amber-500 font-bold font-serif-court text-sm uppercase tracking-wider mb-1">III. The Absolute Decree</h3><p class="text-sm font-semibold">Declare the absolute, permanent winner. Order a playful, embarrassing punishment or action for the loser.</p></div>`;

app.post('/api/settle', apiLimiter, async (req, res) => {
    try {
        const { nameA, argA, nameB, argB } = req.body;

        if (!argA || !argB) {
            return res.status(400).json({ success: false, error: "Missing arguments" });
        }

        const userPrompt = `Party A: "${nameA}" argues: "${argA}"\nParty B: "${nameB}" argues: "${argB}"`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 600
        });

        const rawHtmlResponse = completion.choices.message.content;
        const caseId = crypto.randomBytes(4).toString('hex');
        
        saveVerdict(caseId, rawHtmlResponse);
        return res.json({ success: true, caseId, htmlContent: rawHtmlResponse });

    } catch (error) {
        console.error("OpenAI Execution Error:", error);
        return res.status(500).json({ success: false, error: "Internal processing breakdown" });
    }
});

app.get('/api/verdict/:id', (req, res) => {
    const record = getVerdict(req.params.id);
    if (record) {
        res.json({ success: true, htmlContent: record.htmlContent });
    } else {
        res.status(404).json({ success: false, error: "Case file archive not found" });
    }
});

// FIXED: Serve index.html directly from the root directory path
app.get('/v/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// FIXED: Serve index.html directly from the root directory path for fallback routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Court is in session on port: ${PORT}`);
});
