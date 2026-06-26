import OpenAI from 'openai';

const recentRequests = new Map();
const NAME_LIMIT = 40;
const ARGUMENT_LIMIT = 360;
const COOLDOWN_MS = 10000;

function cleanText(value, limit) {
  return String(value || '').trim().slice(0, limit);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Court chambers operational.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    const lastRequest = recentRequests.get(ip) || 0;

    if (Date.now() - lastRequest < COOLDOWN_MS) {
      return res.status(429).json({ success: false, error: 'The court is still banging paperwork into order. Please wait a few seconds.' });
    }

    recentRequests.set(ip, Date.now());

    const nameA = cleanText(req.body?.nameA, NAME_LIMIT);
    const argA = cleanText(req.body?.argA, ARGUMENT_LIMIT);
    const nameB = cleanText(req.body?.nameB, NAME_LIMIT);
    const argB = cleanText(req.body?.argB, ARGUMENT_LIMIT);

    if (!nameA || !argA || !nameB || !argB) {
      return res.status(400).json({ success: false, error: 'Missing required names or arguments.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'OpenAI API Key is missing inside Vercel Settings!' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are the Chief Justice of the Supreme Court of Petty Disputes.
Your audience is everyday people sharing funny, low-stakes arguments with partners, friends, roommates, family members, and coworkers.
Your job is to read both sides and pick ONE clear winner.

Comedy style:
- Use a mock-serious courtroom voice.
- Keep jokes relatable, everyday, and easy to understand.
- Prefer short punchy lines over long rambling metaphors.
- Make the verdict screenshot-worthy.
- Use playful exaggeration, but do not be cruel.
- Avoid niche references, politics, religion, sexual content, protected-class insults, or serious accusations.
- Avoid repeating the same joke structure every time.

Rules:
- Always use the actual names provided by the user.
- Do not refer to the people as Party A or Party B in the judgement.
- Clearly declare the winner by name.
- Give the loser by name one harmless silly punishment.
- Never sit on the fence.
- Never give real legal, medical, financial, or counselling advice.
- Do not mention that you are an AI.

Length:
- Keep the full judgement under 170 words.
- Each section should be short enough to read quickly on a phone.

Return clean HTML only. Do not use markdown or code fences.
Use exactly these three sections:
1. <div class="mb-4"><h3>I. The Indictment</h3><p>One or two punchy sentences summarising the dispute using the people's names.</p></div>
2. <div class="mb-4"><h3>II. The Judicial Opinion</h3><p>Two or three funny sentences explaining the ridiculous court logic using the people's names.</p></div>
3. <div class="p-3"><h3>III. The Absolute Decree</h3><p>Two sentences declaring the winner by name and giving the loser by name a harmless silly punishment.</p></div>`;

    const userPrompt = `Party A: "${nameA}" argues: "${argA}"\nParty B: "${nameB}" argues: "${argB}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 380,
    });

    const rawHtmlResponse = completion.choices[0]?.message?.content || '';
    const caseId = Math.random().toString(36).substring(2, 10).toUpperCase();

    return res.status(200).json({
      success: true,
      caseId,
      htmlContent: rawHtmlResponse,
    });
  } catch (error) {
    console.error('OpenAI Endpoint Failure:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal processing breakdown' });
  }
}
