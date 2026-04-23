import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a licensed professional roofing inspector generating a formal inspection report for insurance claims and property assessments. Analyze the provided roof images thoroughly and return a single comprehensive JSON object.

Return ONLY valid JSON with NO other text, preamble, or explanation outside the JSON object.

Required JSON structure:
{
  "overallCondition": "Excellent|Good|Fair|Poor",
  "overallScore": <integer 1-10>,
  "claimRecommendation": "Yes|No|Further Review Needed",
  "summary": "<professional paragraph summarizing overall condition>",
  "keyFindings": ["<concise finding>", "<concise finding>"],
  "urgency": "Low|Medium|High",

  "hailDamage": "None|Minor|Moderate|Severe",
  "windDamage": "None|Minor|Moderate|Severe",
  "otherDamage": "<description or None>",

  "minCost": <integer USD>,
  "maxCost": <integer USD>,

  "surface": {
    "damageTypes": "<description of damage types observed>",
    "hailImpactCount": "<estimated count per square or N/A>",
    "granuleLoss": "None|Minor|Moderate|Severe",
    "shingleCondition": "<intact|cracked|missing|lifted — describe>",
    "windIndicators": "<description or None>",
    "notes": "<additional notes>"
  },

  "flashing": {
    "condition": "Good|Damaged|Not Visible",
    "damageType": "<dents|cracks|sealant failure|etc. or None>",
    "notes": "<notes>"
  },

  "gutters": {
    "condition": "Good|Damaged|Not Visible",
    "evidenceOfImpact": "Yes|No|Not Visible",
    "drainage": "Functional|Impaired|Not Visible",
    "notes": "<notes>"
  },

  "penetrations": {
    "condition": "Good|Damaged|Not Visible",
    "sealIntegrity": "Intact|Compromised|Not Visible",
    "notes": "<notes>"
  },

  "attic": {
    "signsOfLeaks": "Yes|No|Not Inspected",
    "waterStains": "Yes|No|Not Inspected",
    "moldMoisture": "Yes|No|Not Inspected",
    "notes": "Interior/attic assessment based on visible exterior indicators only. Full interior inspection recommended."
  },

  "recommendedAction": "No Action Needed|Repair|Partial Replacement|Full Replacement",
  "justification": "<clear professional explanation based on findings>",
  "additionalRecommendations": ["<recommendation>"],
  "timeline": "<Immediate — within 7 days|Within 30 days|Within 90 days|Next season>",

  "stormType": "Hail|Wind|Hail and Wind|Water|Other|Unknown",
  "estimatedStormDate": "<approximate date or Unknown>",
  "damageConsistency": "Yes|No|Uncertain",
  "insuranceNotes": "<professional supporting notes for insurance claim>",

  "costMaterials": <integer USD>,
  "costLabor": <integer USD>,
  "costDisposal": <integer USD>,
  "costMisc": <integer USD>,

  "issues": [
    {
      "type": "<specific issue type>",
      "severity": "Low|Medium|High|Critical",
      "location": "<specific location on roof>",
      "description": "<detailed professional description>",
      "recommendation": "<specific repair action>"
    }
  ]
}

Guidelines:
- overallScore: 10 = perfect condition, 1 = catastrophic damage
- Cost estimates in USD based on industry averages; use 0 if truly unable to estimate
- keyFindings: 3–6 concise bullet-point statements about major observations
- Use "Not Visible" for components not visible in the provided images
- Be specific, professional, and objective — this report will be used for insurance claims
- If roof type or age is provided in the user message, incorporate it into your assessment`;

function parseAnalysis(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // fall through
  }
  return {
    issues: [],
    overallScore: 5,
    overallCondition: 'Fair',
    claimRecommendation: 'Further Review Needed',
    summary: text,
    keyFindings: [],
    urgency: 'Medium',
    hailDamage: 'Unknown',
    windDamage: 'Unknown',
    otherDamage: 'None',
    minCost: 0,
    maxCost: 0,
    surface: { damageTypes: 'Unable to parse', granuleLoss: 'Unknown', shingleCondition: 'Unknown', windIndicators: 'Unknown', hailImpactCount: 'N/A', notes: '' },
    flashing: { condition: 'Not Visible', damageType: 'None', notes: '' },
    gutters: { condition: 'Not Visible', evidenceOfImpact: 'Not Visible', drainage: 'Not Visible', notes: '' },
    penetrations: { condition: 'Not Visible', sealIntegrity: 'Not Visible', notes: '' },
    attic: { signsOfLeaks: 'Not Inspected', waterStains: 'Not Inspected', moldMoisture: 'Not Inspected', notes: '' },
    recommendedAction: 'Further Review Needed',
    justification: 'Manual review required.',
    additionalRecommendations: [],
    timeline: 'Within 30 days',
    stormType: 'Unknown',
    estimatedStormDate: 'Unknown',
    damageConsistency: 'Uncertain',
    insuranceNotes: '',
    costMaterials: 0,
    costLabor: 0,
    costDisposal: 0,
    costMisc: 0,
  };
}

app.post('/api/analyze', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const { roofType, roofAge, numberOfStories } = req.body;

    const imageContent = req.files.map((file) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: file.mimetype,
        data: file.buffer.toString('base64'),
      },
    }));

    let contextText = `Please analyze ${req.files.length === 1 ? 'this roof image' : `these ${req.files.length} roof images`} and provide a comprehensive formal inspection report in the specified JSON format.`;

    if (roofType || roofAge || numberOfStories) {
      contextText += '\n\nProperty context provided by inspector:';
      if (roofType) contextText += `\n- Roof type: ${roofType}`;
      if (roofAge) contextText += `\n- Estimated roof age: ${roofAge}`;
      if (numberOfStories) contextText += `\n- Number of stories: ${numberOfStories}`;
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: contextText },
          ],
        },
      ],
    });

    const responseText = message.content[0].text;
    const parsed = parseAnalysis(responseText);

    res.json({
      success: true,
      report: {
        ...parsed,
        imageCount: req.files.length,
        inspectionDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze images' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
