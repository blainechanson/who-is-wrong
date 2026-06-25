import { OpenAI } from 'openai';

// Serverless function memory cache setup to handle rapid traffic lookups smoothly
const memoryDb = {};

export default async function handler(req, res) {
    // Intercept standard verification checks to ensure routing functions perfectly
    if (req.method === 'GET') {
        const { id } = req.query;
        if (id) {
            const record = memoryDb[id] || null;
            if (record) {
                return res.status(200).json({ success: true, htmlContent: record.htmlContent });
            }
            return res.status(404).json({ success: false, error: "Case archive index missing." });
        }
        return res.status(200).json({ status: "Court chambers operational." });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const { nameA, argA, nameB, argB } = req.body;

        if (!argA || !argB) {
            return res.status(400).json({ success: false, error: "Missing arguments" });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const systemPrompt = `You are the Chief Justice of the Supreme Court of Petty Disputes. 
Your job is to read an argument between two individuals, strictly pick ONE clear winner using hilarious, absurd, yet highly formal legal reasoning.
Never sit on the fence. Be completely biased toward one arbitrary side.
Format your entire output using clean HTML tags (do not use code blocks like \`\`\`html). Use structural div styling tags.
Your output must structure itself exactly across these three parts:
1. <div class="mb-4"><h3 class="text-amber-500 font-bold font-serif-court text-sm uppercase tracking-wider mb-1">I. The Indictment</h3><p class="text-sm">Recap the case with intense gravity (e.g., "[NameA] contends X, whereas [NameB] asserts Y...").</p></div>
2. <div class="mb-4"><h3 class="text-amber-500 font-bold font-serif-court text-sm uppercase tracking-wider mb-1">II. The Judicial Opinion</h3><p class="text-sm">Break down the logic using ridiculous metaphors, historical analogies, or mock legal precedents.</p></div>
3. <div class="p-3 bg-amber-600/5 border border-amber-600/20 rounded"><h3 class="text-amber-500 font-bold font-serif-court text-sm uppercase tracking-wider mb-1">III. The Absolute Decree</h3><p class="text-sm font-semibold">Declare the absolute, permanent winner. Order a playful, embarrassing punishment or action for the loser.</p></div>`;

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
        
        // Generate pseudo-random token lookup for sharing verification routes
        const caseId = Math.random().toString(36).substring(2, 10);
        
        memoryDb[caseId] = { htmlContent: rawHtmlResponse, timestamp: new Date().toISOString() };

        return res.status(200).json({ success: true, caseId, htmlContent: rawHtmlResponse });

    } catch (error) {
        console.error("OpenAI Endpoint Failure:", error);
        return res.status(500).json({ success: false, error: "Internal processing breakdown" });
    }
}
