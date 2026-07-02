import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import OpenAI from 'openai';
import sanitizeHtml from 'sanitize-html';

const NAME_LIMIT = 40;
const ARGUMENT_LIMIT = 360;
const MIN_NAME_LENGTH = 2;
const MIN_ARGUMENT_LENGTH = 9;
const SAFETY_ERROR = 'The court only hears harmless petty disputes. Please keep serious, unsafe, private, sexual, legal, medical, political, religious, or bullying issues out of the case.';
const COOLDOWN_SECONDS = 10;
const HOURLY_LIMIT = 40;
const DAILY_LIMIT = 60;
const SITE_DAILY_LIMIT = 5000;
const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const BLOCKED_CASE_PATTERNS = [
  /\b(suicide|self[-\s]?harm|kill myself|hurt myself)\b/i,
  /\b(assault|domestic violence|rape|sexual assault|abuse|stalking|blackmail)\b/i,
  /\b(divorce|custody|lawsuit|sued|suing|sue me|sue them|sue him|sue her|lawyer|police report|restraining order|eviction|lease dispute)\b/i,
  /\b(diagnosis|medical|medication|pregnant|pregnancy|therapy|therapist|counsell?ing)\b/i,
  /\b(election|politics|political|religion|church|mosque|synagogue)\b/i,
  /\b(sex|nude|nudes|porn|onlyfans)\b/i,
  /\b(racist|racial slur|homophobic|transphobic|slur|hate speech)\b/i,
];

function getRedis() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.STORAGE_KV_REST_API_URL ||
    process.env.STORAGE_REDIS_REST_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.STORAGE_KV_REST_API_TOKEN ||
    process.env.STORAGE_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

function cleanText(value, limit) {
  return String(value || '').trim().slice(0, limit);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  return (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32);
}

function meaningfulLength(text) {
  return text.replace(/[^a-z0-9]/gi, '').length;
}

function isTooSimpleArgument(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  const uniqueCharacters = new Set(normalized).size;
  return meaningfulLength(text) < MIN_ARGUMENT_LENGTH || uniqueCharacters < 4;
}

function hasBlockedCaseContent(...values) {
  const combined = values.join(' ');
  return BLOCKED_CASE_PATTERNS.some((pattern) => pattern.test(combined));
}

function sanitizeVerdictHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: ['div', 'h3', 'p', 'strong', 'b', 'em', 'br'],
    allowedAttributes: {
      div: ['class'],
    },
    allowedClasses: {
      div: ['mb-4', 'p-3'],
    },
    disallowedTagsMode: 'discard',
    allowedSchemes: [],
  });
}

async function incrementWindow(key, ttlSeconds) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}

async function checkQuota(ip) {
  if (!redis) {
    return {
      allowed: false,
      status: 500,
      error: 'Rate limit storage is not configured. Please check the Upstash Redis environment variables in Vercel.',
    };
  }

  const visitorId = hashIp(ip);
  const cooldownKey = `rate:${visitorId}:cooldown`;
  const hourKey = `rate:${visitorId}:hour`;
  const dayKey = `rate:${visitorId}:day`;
  const siteDayKey = `rate:site:${todayKey()}`;

  const cooldownActive = await redis.get(cooldownKey);
  if (cooldownActive) {
    return {
      allowed: false,
      status: 429,
      error: 'The court needs a few more seconds before hearing another case.',
    };
  }

  const hourCount = await incrementWindow(hourKey, HOUR_SECONDS);

  if (hourCount > HOURLY_LIMIT) {
    return {
      allowed: false,
      status: 429,
      error: 'Sorry, you have reached your judgement quota for this hour. The judge needs a short nap. Please come back later.',
    };
  }

  const dayCount = await incrementWindow(dayKey, DAY_SECONDS);

  if (dayCount > DAILY_LIMIT) {
    return {
      allowed: false,
      status: 429,
      error: 'Sorry, you have reached your daily judgement quota. The judge needs some rest. Please come back later.',
    };
  }

  const siteDayCount = await incrementWindow(siteDayKey, DAY_SECONDS);

  if (siteDayCount > SITE_DAILY_LIMIT) {
    return {
      allowed: false,
      status: 429,
      error: 'The court has heard too many cases today. Please come back later.',
    };
  }

  await redis.set(cooldownKey, '1', { ex: COOLDOWN_SECONDS });
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Court chambers operational.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const nameA = cleanText(req.body?.nameA, NAME_LIMIT);
    const argA = cleanText(req.body?.argA, ARGUMENT_LIMIT);
    const nameB = cleanText(req.body?.nameB, NAME_LIMIT);
    const argB = cleanText(req.body?.argB, ARGUMENT_LIMIT);

    if (!nameA || !argA || !nameB || !argB) {
      return res.status(400).json({ success: false, error: 'Missing required names or arguments.' });
    }

    if (nameA.length < MIN_NAME_LENGTH || nameB.length < MIN_NAME_LENGTH) {
      return res.status(400).json({ success: false, error: 'Please enter names with at least two characters.' });
    }

    if (isTooSimpleArgument(argA) || isTooSimpleArgument(argB)) {
      return res.status(400).json({ success: false, error: 'Please give the judge a little more detail. One-word cases are beneath the dignity of the court.' });
    }

    if (argA.toLowerCase() === argB.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Please give the judge two different sides of the argument.' });
    }

    if (hasBlockedCaseContent(argA, argB)) {
      return res.status(400).json({ success: false, error: SAFETY_ERROR });
    }

    const quota = await checkQuota(getClientIp(req));
    if (!quota.allowed) {
      return res.status(quota.status).json({ success: false, error: quota.error });
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
- Keep the full judgement between 160 and 205 words.
- Use three short sections that are easy to read on a phone.
- Do not ramble. Every sentence should either explain the dispute, make a joke, or deliver the verdict.

Return clean HTML only. Do not use markdown or code fences.
Use exactly these three sections:
1. <div class="mb-4"><h3>I. The Indictment</h3><p>Two punchy sentences summarising the dispute using the people's names.</p></div>
2. <div class="mb-4"><h3>II. The Judicial Opinion</h3><p>Three or four funny sentences explaining the ridiculous court logic using the people's names.</p></div>
3. <div class="p-3"><h3>III. The Absolute Decree</h3><p>Two or three sentences declaring the winner by name, explaining why, and giving the loser by name a harmless silly punishment.</p></div>`;

    const userPrompt = `Party A: "${nameA}" argues: "${argA}"\nParty B: "${nameB}" argues: "${argB}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 460,
    });

    const rawHtmlResponse = completion.choices[0]?.message?.content || '';
    const safeHtmlResponse = sanitizeVerdictHtml(rawHtmlResponse);
    const caseId = Math.random().toString(36).substring(2, 10).toUpperCase();

    return res.status(200).json({
      success: true,
      caseId,
      htmlContent: safeHtmlResponse,
    });
  } catch (error) {
    console.error('OpenAI Endpoint Failure:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal processing breakdown' });
  }
}
