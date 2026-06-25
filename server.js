import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { rateLimit } from 'express-rate-limit'; // 1. Import the rate limiter

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. Configure the Rate Limiter (3 requests per 1 minute)
const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute window
	max: 3, // Limit each IP to 3 requests per window
	standardHeaders: 'draft-7', // return rate limit info in the headers
	legacyHeaders: false, // Disable the X-RateLimit-* headers
	message: { success: false, error: "Too many arguments! The Judge needs a break. Please wait a minute before submitting again." }
});

const DB_FILE = path.join(__dirname, 'verdicts.json');
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

function saveVerdict(id, htmlContent) {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    data[id] = { htmlContent, timestamp: new Date().toISOString() };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getVerdict(id) {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return data[id] || null;
}

// 3. Apply the rate limiter strictly to your OpenAI endpoint
app.post('/api/settle', apiLimiter, async (req, res) => {
    try {
        const { nameA, argA, nameB, argB } = req.body;

        if (!argA || !argB) {
            return res.status(400).json({ success: false, error: "Missing arguments" });
        }

        const systemPrompt = `You are the Chief Justice of the Supreme Court of Petty Disputes...`; // Rest of your prompt logic remains the same
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

app.get('/v/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Court is in session on port: http://localhost:${PORT}`);
});
