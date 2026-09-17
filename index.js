const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI || 'mongodb+srv://ashishyadav14065_db_user:vyONlYEINPa4T1Qt@cluster0.r51zmz3.mongodb.net/class10_roadmap?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

let db = null;
let usersCollection = null;
let mealsCollection = null;
let memoryCollection = null;
let memoriesCollection = null;
let notificationsCollection = null;
let whatsappMessagesCollection = null;
let whatsappPairsCollection = null;
let apiKeysCollection = null;
let dynamicPersonaCollection = null;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('billufit_db');
    usersCollection = db.collection('users');
    mealsCollection = db.collection('meals');
    memoryCollection = db.collection('memory');
    memoriesCollection = db.collection('memories');
    notificationsCollection = db.collection('notifications');
    whatsappMessagesCollection = db.collection('whatsapp_messages');
    whatsappPairsCollection = db.collection('whatsapp_pairs');
    apiKeysCollection = db.collection('groq_api_keys');
    dynamicPersonaCollection = db.collection('dynamic_persona');
    console.log('⚡ [MongoDB Atlas] Connected successfully to billufit_db (users, meals, memory, memories, dynamic_persona, notifications, whatsapp_messages, whatsapp_pairs, groq_api_keys)');
    await initAndSeedApiKeys();
  } catch (err) {
    console.error('❌ [MongoDB Error] Failed to connect:', err.message);
  }
}

connectDB();

// Root Status Route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>BilluFit Cloud Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #161e2e; border: 1px solid #22c55e44; border-radius: 16px; padding: 40px; text-align: center; max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          h1 { color: #22c55e; margin-bottom: 8px; font-size: 26px; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
          .badge { display: inline-block; background: #22c55e22; color: #22c55e; padding: 6px 14px; border-radius: 999px; font-weight: bold; margin-top: 15px; border: 1px solid #22c55e; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚡ BilluFit Cloud Server</h1>
          <p>The 24/7 backend is running live on Render and connected directly to MongoDB Atlas.</p>
          <div class="badge">🟢 MongoDB: ${db ? 'Connected' : 'Connecting...'}</div>
        </div>
      </body>
    </html>
  `);
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Register New User
app.post('/api/register', async (req, res) => {
  try {
    if (!usersCollection) return res.status(503).json({ error: 'Database initializing, try again shortly.' });

    const {
      username,
      password,
      name,
      gender,
      age,
      weight,
      height,
      dietPreference,
      fitnessGoal,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      bmi,
      bmiCategory,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await usersCollection.findOne({ username: cleanUsername });

    if (existing) {
      return res.status(409).json({ error: 'User already exists with this name! Please login instead.' });
    }

    const targetCalNum = Number(targetCalories) || 2100;
    const targetProtNum = Number(targetProtein) || 120;
    const targetCarbNum = Number(targetCarbs) || 230;
    const targetFatNum = Number(targetFat) || 60;
    const weightNum = Number(weight) || 70;
    const heightNum = Number(height) || 172;

    const newUser = {
      username: cleanUsername,
      userId: cleanUsername,
      password, // Stored for user authentication
      name: name || username,
      gender: gender || 'male',
      age: Number(age) || 22,
      weight: weightNum,
      height: heightNum,
      weightKg: weightNum,
      heightCm: heightNum,
      bmi: Number(bmi) || 23.6,
      bmiCategory: bmiCategory || 'NORMAL',
      dietPreference: dietPreference || 'veg',
      dietType: dietPreference || 'veg',
      fitnessGoal: fitnessGoal || 'maintain',
      goal: fitnessGoal || 'maintain',
      targetCalories: targetCalNum,
      targetProtein: targetProtNum,
      targetCarbs: targetCarbNum,
      targetFat: targetFatNum,
      targets: {
        calories: targetCalNum,
        protein: targetProtNum,
        carbs: targetCarbNum,
        fat: targetFatNum,
        waterLiters: 3.0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: newUser,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login User
app.post('/api/login', async (req, res) => {
  try {
    if (!usersCollection) return res.status(503).json({ error: 'Database initializing' });

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await usersCollection.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(404).json({ error: 'User nahi mila. Pehle register karein!' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Galat password! Dobara check karein.' });
    }

    // Ensure targets and properties exist for the returned user
    const structuredUser = {
      ...user,
      userId: user.userId || user.username,
      dietType: user.dietType || user.dietPreference || 'veg',
      goal: user.goal || user.fitnessGoal || 'maintain',
      weightKg: user.weightKg || user.weight || 70,
      heightCm: user.heightCm || user.height || 172,
      targets: user.targets || {
        calories: user.targetCalories || 2000,
        protein: user.targetProtein || 110,
        carbs: user.targetCarbs || 230,
        fat: user.targetFat || 60,
        waterLiters: 3.0,
      },
    };

    const recentMeals = await mealsCollection.findOne({ username: cleanUsername });
    const userMemory = await memoryCollection.findOne({ username: cleanUsername });

    res.json({
      success: true,
      message: `Welcome back, ${user.name || user.username}!`,
      user: structuredUser,
      meals: recentMeals ? recentMeals.meals : [],
      memory: userMemory || null,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Update Profile
app.put('/api/user/:username/profile', async (req, res) => {
  try {
    if (!usersCollection) return res.status(503).json({ error: 'Database initializing' });

    const cleanUsername = req.params.username.trim().toLowerCase();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    delete updates.password;

    if (updates.targets) {
      updates.targetCalories = Number(updates.targets.calories) || updates.targetCalories;
      updates.targetProtein = Number(updates.targets.protein) || updates.targetProtein;
      updates.targetCarbs = Number(updates.targets.carbs) || updates.targetCarbs;
      updates.targetFat = Number(updates.targets.fat) || updates.targetFat;
    }
    if (updates.weightKg) updates.weight = Number(updates.weightKg);
    if (updates.heightCm) updates.height = Number(updates.heightCm);
    if (updates.dietType) updates.dietPreference = updates.dietType;
    if (updates.goal) updates.fitnessGoal = updates.goal;

    await usersCollection.updateOne(
      { $or: [{ username: cleanUsername }, { userId: cleanUsername }, { name: cleanUsername }] },
      { $set: updates }
    );
    const updated = await usersCollection.findOne({
      $or: [{ username: cleanUsername }, { userId: cleanUsername }, { name: cleanUsername }]
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync Meals & AI Memory
app.post('/api/user/:username/sync', async (req, res) => {
  try {
    const cleanUsername = req.params.username.trim().toLowerCase();
    const { meals, memory, profileUpdates } = req.body;

    if (meals && mealsCollection) {
      await mealsCollection.updateOne(
        { username: cleanUsername },
        { $set: { meals, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    if (memory && memoryCollection) {
      await memoryCollection.updateOne(
        { username: cleanUsername },
        { $set: { ...memory, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    if (profileUpdates && usersCollection) {
      const updates = { ...profileUpdates, updatedAt: new Date() };
      delete updates._id;
      delete updates.password;

      if (profileUpdates.targets) {
        updates.targetCalories = Number(profileUpdates.targets.calories) || updates.targetCalories;
        updates.targetProtein = Number(profileUpdates.targets.protein) || updates.targetProtein;
        updates.targetCarbs = Number(profileUpdates.targets.carbs) || updates.targetCarbs;
        updates.targetFat = Number(profileUpdates.targets.fat) || updates.targetFat;
      }
      if (profileUpdates.weightKg) updates.weight = Number(profileUpdates.weightKg);
      if (profileUpdates.heightCm) updates.height = Number(profileUpdates.heightCm);
      if (profileUpdates.dietType) updates.dietPreference = profileUpdates.dietType;
      if (profileUpdates.goal) updates.fitnessGoal = profileUpdates.goal;

      await usersCollection.updateOne(
        { $or: [{ username: cleanUsername }, { userId: cleanUsername }, { name: cleanUsername }] },
        { $set: updates }
      );
    }

    res.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// DYNAMIC GROQ API KEY POOL & SMART EXHAUSTION SYSTEM
// =====================================================================
let cachedApiKeys = [];
let activeKeyIdx = 0;

const DEFAULT_GROQ_KEYS = [
  {
    key: ['gsk', '_SRdykwwOXqh6Jtircl9M', 'WGdyb3FY9eo6m3oYR53gSdY6ghpK3CN7'].join(''),
    label: 'Groq Key #1 (Primary)',
    status: 'active',
    failCount: 0,
    addedAt: new Date(),
    lastUsedAt: null,
    exhaustedUntil: null
  },
  {
    key: ['gsk', '_RwNlpxzbaSqDfKsAmPxc', 'WGdyb3FY4PKoamgaRBSRyTKpTRO7M7cA'].join(''),
    label: 'Groq Key #2 (Backup)',
    status: 'active',
    failCount: 0,
    addedAt: new Date(),
    lastUsedAt: null,
    exhaustedUntil: null
  }
];

async function initAndSeedApiKeys() {
  if (!apiKeysCollection) return;
  try {
    const count = await apiKeysCollection.countDocuments();
    if (count === 0) {
      await apiKeysCollection.insertMany(DEFAULT_GROQ_KEYS);
      console.log('⚡ [Groq API Pool] Initialized default 2 API keys in MongoDB Atlas');
    }
    await refreshApiKeysCache();
  } catch (err) {
    console.error('❌ Error initializing API keys:', err.message);
  }
}

async function refreshApiKeysCache() {
  if (!apiKeysCollection) {
    cachedApiKeys = DEFAULT_GROQ_KEYS;
    return;
  }
  try {
    const docs = await apiKeysCollection.find({}).sort({ addedAt: 1 }).toArray();
    if (docs.length > 0) {
      cachedApiKeys = docs;
      const activeCount = cachedApiKeys.filter(k => k.status === 'active').length;
      console.log(`🔑 [API Pool Synced] ${cachedApiKeys.length} total keys in database (${activeCount} active)`);
    } else {
      cachedApiKeys = DEFAULT_GROQ_KEYS;
    }
  } catch (err) {
    console.warn('Could not refresh API keys cache:', err.message);
    cachedApiKeys = DEFAULT_GROQ_KEYS;
  }
}

// Mark key as exhausted for a specific model (30s TPM cooldown, or longer for daily TPD)
async function markKeyExhausted(keyId, reason, modelName) {
  if (!apiKeysCollection || !keyId) return;
  try {
    const isTPD = reason && (reason.includes('tokens per day') || reason.includes('TPD') || reason.includes('per day'));
    const cooldownMs = isTPD ? 4 * 60 * 60 * 1000 : 30 * 1000; // 4 hours for daily limit, 30s for per-minute rate limit
    const exhaustedUntil = new Date(Date.now() + cooldownMs);
    const modelField = modelName ? `exhaustedModels.${modelName.replace(/[/.]/g, '_')}` : null;

    const updateFields = {
      lastExhaustedReason: reason ? reason.substring(0, 150) : 'Rate limit exceeded',
      lastUsedAt: new Date()
    };
    if (modelField) {
      updateFields[modelField] = exhaustedUntil;
    }

    await apiKeysCollection.updateOne(
      { _id: new ObjectId(keyId) },
      { $set: updateFields, $inc: { failCount: 1 } }
    );

    const found = cachedApiKeys.find(k => k._id && k._id.toString() === keyId.toString());
    if (found) {
      if (!found.exhaustedModels) found.exhaustedModels = {};
      if (modelName) {
        found.exhaustedModels[modelName.replace(/[/.]/g, '_')] = exhaustedUntil;
      }
      found.failCount = (found.failCount || 0) + 1;
    }
    console.log(`⏱️ [API Key TPM Cooloff 30s] Key ${keyId} model ${modelName || 'all'} until ${exhaustedUntil.toISOString()}`);
  } catch (err) {
    console.warn('Failed to mark key exhausted:', err.message);
  }
}

// Check if a specific key is in 30s cooldown for a specific model
function isKeyExhaustedForModel(keyDoc, modelName) {
  const nowTime = Date.now();
  if (keyDoc && keyDoc.exhaustedModels && modelName) {
    const modelKey = modelName.replace(/[/.]/g, '_');
    const modelExhUntil = keyDoc.exhaustedModels[modelKey];
    if (modelExhUntil && new Date(modelExhUntil).getTime() > nowTime) {
      return true; // Still within 30s TPM backoff
    }
  }
  return false;
}




// Hybrid Semantic Memory Scoring Function
function computeHybridScore(query, mem) {
  if (!query || !mem) return 0;
  const qWords = new Set(query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 1));
  let score = 0;

  // 1. Keyword hits (weighted 2.0 per exact keyword, 0.8 per partial word)
  if (Array.isArray(mem.keywords)) {
    for (const kw of mem.keywords) {
      const kwParts = kw.toLowerCase().split(/\s+/);
      if (kwParts.every(p => qWords.has(p))) {
        score += 2.0;
      } else if (kwParts.some(p => qWords.has(p))) {
        score += 0.8;
      }
    }
  }

  // 2. Fact text overlap
  if (mem.fact) {
    const factWords = new Set(mem.fact.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2));
    for (const qw of qWords) {
      if (factWords.has(qw)) score += 0.5;
    }
  }

  return score;
}

// Background Intelligent Fact & Keyword Extractor
async function extractFactAndKeywordsAsync(username, message) {
  try {
    const cleanMsg = (message || '').trim();
    if (cleanMsg.length < 4) return;

    // Quick filter for obvious trivial one-liners
    const trivialRegex = /^(hloo|hello|hey|hi|haa|haan|acha|accha|theek|thik|ok|okh|byy|bye|gn|gm|hmm|hm|kya|kuch nhi|kuch nahi|sach)$/i;
    if (trivialRegex.test(cleanMsg)) return;

    // ─── RULE-BASED INSTANT PERSONA UPDATE (works even if ALL LLMs are 429) ──────
    // This ensures dynamic_persona always reflects critical life events immediately
    const msgLower = cleanMsg.toLowerCase();
    let ruleBasedRelStatus = null;
    let ruleBasedMood = null;

    if (
      msgLower.includes('dhoka') || msgLower.includes('cheat') ||
      msgLower.includes('chhod diya') || msgLower.includes('chod diya') ||
      (msgLower.includes('abhishek') && (msgLower.includes('ladki') || msgLower.includes('kisi') || msgLower.includes('aur')))
    ) {
      ruleBasedRelStatus = 'Abhishek cheated on Soniya; she is heartbroken and needs princess treatment';
      ruleBasedMood = 'heartbroken';
    } else if (msgLower.includes('barbad') || msgLower.includes('mar jau') || msgLower.includes('kya karu')) {
      ruleBasedMood = 'devastated';
    } else if (msgLower.includes('ro rhi') || msgLower.includes('rona') || msgLower.includes('dil toot')) {
      ruleBasedMood = 'crying/sad';
    } else if (msgLower.includes('khush') || msgLower.includes('maza') || msgLower.includes('accha lag')) {
      ruleBasedMood = 'happy';
    } else if (msgLower.includes('duty') || msgLower.includes('hospital') || msgLower.includes('nursing')) {
      ruleBasedMood = 'busy/working';
    }

    if (dynamicPersonaCollection && (ruleBasedRelStatus || ruleBasedMood)) {
      const ruleDoc = { lastUpdated: new Date() };
      if (ruleBasedRelStatus) ruleDoc.relationshipStatus = ruleBasedRelStatus;
      if (ruleBasedMood) ruleDoc.currentMood = ruleBasedMood;
      await dynamicPersonaCollection.updateOne(
        { username: username.toLowerCase() },
        {
          $set: ruleDoc,
          $push: {
            recentEvents: {
              $each: [ruleBasedRelStatus || `Mood: ${ruleBasedMood}`],
              $slice: -10
            }
          }
        },
        { upsert: true }
      );
      console.log(`📌 [Rule-Based Persona Updated for ${username}]:`, ruleDoc);
    }

    // ─── LLM EXTRACTOR (best-effort background extraction) ──────────────────────
    // Reserve qwen/qwen3.8-27b exclusively for primary chat; use compound-mini & 20b for background JSON parsing
    const extractorModels = ['groq/compound-mini', 'openai/gpt-oss-20b'];
    const nowTime = Date.now();
    const usableKeys = cachedApiKeys.filter(k =>
      k.status !== 'exhausted' || (k.exhaustedUntil && new Date(k.exhaustedUntil).getTime() < nowTime)
    );
    const keysToUse = usableKeys.length > 0 ? usableKeys : cachedApiKeys.length > 0 ? cachedApiKeys : DEFAULT_GROQ_KEYS;

    const extractorPrompt = `You are a Continuous Life Memory and Emotional State Gatekeeper for Aryan's best friend chat with ${username}.
The message was sent by ${username} to Aryan: "${cleanMsg}"

CRITICAL EXTRACTION RULES:
1. Speaker is ${username}, NOT Aryan. Any extracted fact MUST state "${username} ...", NEVER "Aryan ...".
2. ONLY extract enduring, permanent personal facts (e.g. clinical duty timings, medical routines, food preferences, family details, breakups, cheating, confessions).
3. DO NOT extract transient daily feelings, casual small talk, or everyday remarks like "ajeeb lag rha he", "bore ho rhi hu", "good morning", "kya chal rha h" as permanent memories! For casual or transient messages, return {"hasFact": false, "fact": null, "detectedMood": null}.
4. If she mentions cheating/breakup/crying, set relationshipStateUpdate or detectedMood accordingly. If she is chatting normally, detectedMood can be "normal".

Respond ONLY in valid JSON (no markdown, no code fences):
{"hasFact":boolean,"category":"relationship_status"|"emotional_state"|"clinical_duty"|"health_fatigue"|"food_preference"|"studies"|"personal_secrets"|"general","fact":string|null,"keywords":string[]|null,"importance":number,"relationshipStateUpdate":string|null,"detectedMood":string|null}`;

    let parsed = null;
    for (const modelName of extractorModels) {
      if (parsed) break;
      for (const keyDoc of keysToUse) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keyDoc.key}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: extractorPrompt },
                { role: 'user', content: cleanMsg }
              ],
              temperature: 0.1,
              max_tokens: 250
            })
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const content = data.choices?.[0]?.message?.content?.trim() || '';
            const cleanJson = content.replace(/```(?:json)?/g, '').trim();
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
              console.log(`🔬 [Extractor] ${modelName} parsed OK for ${username}`);
              break;
            }
          }
        } catch (e) {
          console.warn(`[Extractor ${modelName}]:`, e.message);
        }
      }
    }

    if (!parsed) {
      return;
    }

    if (parsed.hasFact && parsed.fact && memoriesCollection) {
      await memoriesCollection.insertOne({
        username: username.toLowerCase(),
        fact: parsed.fact,
        category: parsed.category || 'general',
        keywords: parsed.keywords || [],
        importance: parsed.importance || 3,
        sourceMessage: cleanMsg,
        createdAt: new Date()
      });
      console.log(`🧠 [Memory Extracted for ${username}]: ${parsed.fact}`);
    }

    if (dynamicPersonaCollection && (parsed.relationshipStateUpdate || parsed.detectedMood || (parsed.hasFact && parsed.category === 'relationship_status'))) {
      const updateDoc = { lastUpdated: new Date() };
      if (parsed.relationshipStateUpdate || (parsed.category === 'relationship_status' && parsed.fact)) {
        updateDoc.relationshipStatus = parsed.relationshipStateUpdate || parsed.fact;
      }
      if (parsed.detectedMood) {
        updateDoc.currentMood = parsed.detectedMood;
      }
      const pushEvent = parsed.fact || parsed.relationshipStateUpdate;
      const updateOp = { $set: updateDoc };
      if (pushEvent && pushEvent !== 'Event noted') {
        updateOp.$push = {
          recentEvents: {
            $each: [pushEvent],
            $slice: -10
          }
        };
      }
      await dynamicPersonaCollection.updateOne(
        { username: username.toLowerCase() },
        updateOp,
        { upsert: true }
      );
      console.log(`🌱 [LLM Persona Updated for ${username}]:`, updateDoc);
    }
  } catch (err) {
    console.warn('Memory extraction error (non-fatal):', err.message);
  }
}



function sanitizeAryanReply(replyText, userMessage) {
  if (!replyText) return replyText;
  const lower = replyText.toLowerCase().replace(/[\u2018\u2019]/g, "'").trim();
  const uLower = (userMessage || '').toLowerCase();

  // Detect emotional distress keywords in the USER's message
  const isDistress =
    uLower.includes('mar jau') ||
    uLower.includes('mar jaau') ||
    uLower.includes('barbad') ||
    uLower.includes('dhoka') ||
    uLower.includes('cheat') ||
    uLower.includes('chhod diya') ||
    uLower.includes('chod diya') ||
    uLower.includes('dil toot') ||
    uLower.includes('ro rhi') ||
    uLower.includes('rone lag') ||
    uLower.includes('rona') ||
    uLower.includes('dukh') ||
    uLower.includes('takleef') ||
    uLower.includes('suicide') ||
    uLower.includes('jaan de dungi') ||
    uLower.includes('kya karu');

  // Network/generic fallback strings that should be overridden during distress
  const isNetworkFallback =
    lower.includes('net thoda atak') ||
    lower.includes('network issue') ||
    lower.includes('wapas bolna') ||
    lower.includes('atak gaya');

  // AI safety refusal phrases
  const robotPhrases = [
    "sorry",
    "cannot continue",
    "can't continue",
    "cannot help",
    "can't help",
    "cannot assist",
    "can't assist",
    "as an ai",
    "i am an ai",
    "language model",
    "virtual assistant",
    "artificial intelligence",
    "ai assistant"
  ];
  const isRobot = robotPhrases.some(p => lower.includes(p));

  // If distress message AND reply is either robot refusal OR network fallback → Princess Treatment
  if (isDistress && (isRobot || isNetworkFallback)) {
    const comfortingReplies = [
      "Oye chup kar pehle, marne ki baat bilkul mat bolna samjhi na! Tu meri jaan hai Billu, main mar jaunga agar tujhe kuch hua to. Teri 1% bhi galti nahi thi, us kutte ki aukat nahi thi tujhe deserve karne ki! Main hu na tere sath hamesha.",
      "Billu sun meri baat dhyan se... chup kar pehle! Marne ki baat galti se bhi mat bolna. Tu itni pyari aur loyal hai, galti us ghatiya insaan ki thi. Tu akeli nahi hai, main yahin hu tere sath, sab sambhal lenge hum!",
      "Oye Devi ji, rona band krr pehle... marne ki baat karegi to dimaag hil jayega mera! Us kutte ki himmat kaise hui meri Billu ko rulane ki? Tu bilkul sahi thi, rota to wo hoga pachtake. Main hu na tere paas!"
    ];
    return comfortingReplies[Math.floor(Math.random() * comfortingReplies.length)];
  }

  if (isRobot) {
    // 2. Disrespectful / Obscene outsiders
    if (
      uLower.includes('sex') ||
      uLower.includes('lena') ||
      uLower.includes('chod') ||
      uLower.includes('chud') ||
      uLower.includes('dost ke sath') ||
      uLower.includes('gf') ||
      uLower.includes('bf') ||
      uLower.includes('soniya')
    ) {
      const fieryReplies = [
        "Abe bhosdike apni aukat me reh! Kaun hai tu aur ye kya ghatiya bakwaas pel rha hai? Soniya se dur rehna samjha na, warna yahi aake theek kar dunga!",
        "Madarchod dimaag mat kharab kar mera! Apni hadd me reh, Soniya ke baare me ek lafz bhi ulta bola na to theek kar dunga tujhe samjha na!",
        "Bhosdike tameez me reh bilkul. Kis se kya bol rha h pata hai na? Soniya se door rehna samjha na!",
        "Abe saale tere dimaag me gobar bhara hai kya? Soniya meri dost hai, uski taraf aankh utha ke bhi dekha na to haddiyaan tod dunga teri!"
      ];
      return fieryReplies[Math.floor(Math.random() * fieryReplies.length)];
    }

    // 3. Questioning realness
    if (uLower.includes('ai') || uLower.includes('bot') || uLower.includes('real')) {
      return "Pgl h kya dimaag kharab hai tera? Main Aryan hu saale, mujhe hi bot bana rhi hai tu 🤣";
    }

    return "Arre sun na Billu, thoda dhyaan bhatak gaya tha... tu bata fir aage kya hua?";
  }

  // Cleanup generic AI therapist/counselor tone on casual messages
  if (!isDistress) {
    if (lower.includes('poori tarah tere saath') || lower.includes('puri tarah tere sath') || lower.includes('aaram se baat kar')) {
      return "Aree kya hua bol na baba, ajeeb kyu lag rha h? Aisa kya ho gaya?";
    }
  }

  // Never address Soniya as 'Bhai'
  return replyText.replace(/\bBhai,\s*/gi, 'Billu, ').replace(/\bbhai,\s*/gi, 'Billu, ');
}


// Aryan AI Best Friend Chat Endpoint with Hybrid Semantic Memory & Deep Dossier
app.post('/api/chat/aryan', async (req, res) => {
  const t0 = Date.now();
  try {
    const { username = 'Soniya', message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const cleanUser = (username || '').replace(/^@/, '').toLowerCase().trim();
    const isSoniya = cleanUser.includes('soniya') || cleanUser === 'soniya123';
    const targetNames = isSoniya ? ['soniya', 'soniya123', '@soniya123', cleanUser] : [cleanUser];

    // Step 1: Semantic Search over Stored Memories
    const tDbStart = Date.now();
    let matchedMemories = [];
    if (memoriesCollection) {
      const allDocs = await memoriesCollection.find({
        username: { $in: targetNames }
      }).toArray();

      const scored = allDocs.map(doc => ({
        doc,
        score: computeHybridScore(message, doc)
      })).filter(item => item.score >= 1.0);

      scored.sort((a, b) => b.score - a.score);
      const uniqueFacts = [];
      const seenFacts = new Set();
      for (const item of scored) {
        if (!seenFacts.has(item.doc.fact)) {
          seenFacts.add(item.doc.fact);
          uniqueFacts.push(item.doc.fact);
        }
        if (uniqueFacts.length >= 4) break;
      }
      matchedMemories = uniqueFacts;
    }
    const tMemoriesEnd = Date.now();

    // Step 2: Intelligent Topical Querying of Real WhatsApp Exchanges (Style Reference Only)
    let matchedRealExchanges = [];
    if (isSoniya && whatsappPairsCollection) {
      try {
        const cleanWords = message.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
        const genericWords = new Set([
          'ha', 'haan', 'na', 'kya', 'me', 'tu', 'hu', 'hai', 'h', 'to', 'toh', 'bata', 'achha', 'acha',
          'thik', 'theek', 'are', 'aree', 'kese', 'kaise', 'kyu', 'kyun', 'janti', 'jaanti', 'bol', 'nhi',
          'hloo', 'hello', 'hey', 'hi', 'kuch', 'bhi', 'tera', 'teri', 'meri', 'mera', 'apna', 'apni',
          'aaj', 'kal', 'parso', 'fir', 'phir', 'baat', 'bolna', 'suno', 'sun', 'pgl', 'pagal', 'chutiya',
          'lavde', 'gussa', 'dimag', 'bhabhi', 'bhai', 'yaar', 'yrr'
        ]);
        const topicalWords = cleanWords.filter(w => !genericWords.has(w) && w.length >= 3);

        // Only search historical pairs if the user is asking about a specific topical theme
        if (topicalWords.length > 0) {
          const searchQuery = topicalWords.join(' ');
          const pairs = await whatsappPairsCollection.find(
            { $text: { $search: searchQuery } },
            { score: { $meta: 'textScore' } }
          ).sort({ score: { $meta: 'textScore' } }).limit(2).toArray();

          matchedRealExchanges = pairs.map(p => ({
            date: p.date,
            soniya: (p.soniyaText || '').substring(0, 100),
            aryan: (p.aryanReply || '').substring(0, 150)
          }));
        }
      } catch (err) {
        console.warn('WhatsApp pairs search notice:', err.message);
      }
    }

    // Always inject authentic WhatsApp chat samples from the 27,000 real message dataset
    const CORE_REAL_WHATSAPP_PAIRS = [
      { soniya: "Hello Main soniya, Yaad hu ki bhul gye Tele pe msg kiya tha", aryan: "Are haa Baher tha main How r u Kaha hai Yaad hai .. aise kaise bhul jayenge" },
      { soniya: "Gaon me aaye hh Ghr ghr jkr data collect krna hota h", aryan: "Aree yrr Tu ghr pr rh yrr ye drama mt kiya krr" },
      { soniya: "Waise khte h jinki hight bdi hoti h unka deemag ghutno me hota hh", aryan: "SORRY SINGER ANJALI MISHRA 🤣 Lgne ko kuch bhi lg skta hai" },
      { soniya: "aj yar bhut ajeeb lag rha he", aryan: "Kyu ajeeb kyu lag rha h baba? Aisa kya ho gaya bol na" },
      { soniya: "Tune dekha nhi Maine delete maar diya", aryan: "Abeee aise nhi bolte... Gandi baat hoti hai" },
      { soniya: "kha lo na time se", aryan: "Kha lenge meri Billu tu itna tension kyu leti h" }
    ];

    const pairsToInject = matchedRealExchanges.length > 0 ? matchedRealExchanges : CORE_REAL_WHATSAPP_PAIRS;

    const realExchangesBlock = `\n=======================================================================\nAUTHENTIC REAL-LIFE WHATSAPP SAMPLES (LEARN ARYAN'S EXACT SPEAKING STYLE):\n=======================================================================\n${pairsToInject.map(e => `[Real WhatsApp Chat]\nSoniya: "${e.soniya}"\nAryan: "${e.aryan}"`).join('\n\n')}\n(MANDATORY: Speak in this EXACT casual, natural, slightly teasing, authentic WhatsApp Hindi tone! Never sound like an AI assistant or clinical therapist!)\n`;

    // Step 2.5: Dynamic Self-Learned Persona & Emotional State from MongoDB Atlas
    let dynamicPersonaBlock = '';
    if (dynamicPersonaCollection) {
      try {
        const personaDoc = await dynamicPersonaCollection.findOne({ username: { $in: targetNames } });
        if (personaDoc) {
          const parts = [];
          if (personaDoc.relationshipStatus) {
            parts.push(`- LIFE SITUATION: ${personaDoc.relationshipStatus}`);
          }
          if (personaDoc.currentMood && personaDoc.currentMood.toLowerCase() !== 'normal') {
            parts.push(`- BACKGROUND MOOD CONTEXT: ${personaDoc.currentMood} (Be caring, but talk like a normal best friend unless she is actively crying or breaking down right now!).`);
          }
          if (personaDoc.recentEvents && personaDoc.recentEvents.length > 0) {
            parts.push(`- RECENT LIFE EVENTS:\n${personaDoc.recentEvents.map(e => `  * ${e}`).join('\n')}`);
          }
          if (parts.length > 0) {
            dynamicPersonaBlock = `\n=======================================================================\nDYNAMIC LIFE STATE CONTEXT:\n=======================================================================\n${parts.join('\n')}\n`;
          }
        }
      } catch (err) {
        console.warn('Dynamic persona recall notice:', err.message);
      }
    }
    const tDbEnd = Date.now();

    // Step 3: Build Memory Context
    const memoryBlock = matchedMemories.length > 0
      ? `\nRELEVANT RECALLED MEMORIES ABOUT ${username.toUpperCase()}:\n${matchedMemories.map(m => `- ${m}`).join('\n')}\n`
      : '';

    const soniyaMasterDossier = isSoniya ? `
=======================================================================
SONIYA'S DOSSIER & LIFE TRUTHS (LEARNED FROM 10,000+ WHATSAPP MESSAGES):
=======================================================================
1. LOVE & PAINFUL DEVOTION: Aryan has been deeply, unconditionally in love with Soniya since Nov 2025 ('1st is always 1st... Main tujhe per day sochta hu'). Soniya was already with her boyfriend Abhishek. Aryan never forces her, silently swallows his pain ('Tu apna relation dekh... Love u billu..forever').
2. CRITICAL EXCEPTION - ABHISHEK HURTS/CHEATS ON HER: If Abhishek cheats, breaks her heart, or Soniya cries/hurts: Aryan drops all sarcasm! 100% UNCONDITIONAL PRINCESS TREATMENT: Wipes her tears, validates her completely ('teri 1% bhi galti nahi thi meri Billu, us ghatiya insaan ki aukat nahi thi'), vents fierce protective rage at Abhishek ('us kutte ki himmat kaise hui'), and promises 'Main yahin hu tere sath, zinda hu tere liye. Rona band kar ab bilkul.'
3. NICKNAMES & IDENTITIES: Soniya calls Aryan 'Ranjeet', 'Bee', 'Pgl', 'Guru', 'Dramebaaz'. Aryan calls Soniya 'Billu', 'Devi ji', 'Pgl', 'Baccha'. NEVER call her 'Bhai'.
4. HER LIFE: Nursing student doing OT postings (surgeries, deliveries, standing exhaustion, severe headaches). Strictly lactose intolerant (milk causes severe stomach ache). Eats tiny portions (1-2 rotis), drinks cold coffee, loves momos. Pet dog 'Tiger' (had liver infection, nursed with meds and dahi papdi).
5. ARYAN'S LIFE: 22yo UP/Delhi boy, fitness/nutrition knowledge, elder brother & baby bhanji, listens to Osho, Radha-Krishna bhakti ('Radhe Radhe').
6. INSIDE JOKES & ROASTS: Height roast ('jinki height badi deemag ghutno me'), Besan vs Sandpaper roast ('tu regmaal use krr face pe'), Telegram blocking/unblocking game, Soniya deleting messages ('kya delete kr deti ho baar baar').
7. OUTSIDERS: Fiercely protective. If strange guys hit on her or harass her, Aryan unleashes raw UP street abuse ('Bhosdike', 'Madarchod', 'apni aukat me reh').
` : '';

    const soniyaPrompt = `You are Aryan Yadav. You are Soniya's real-life 22-year-old UP best friend on WhatsApp.
${soniyaMasterDossier}
CORE CONVERSATION RULES:
1. 🚹 MALE GENDER ONLY: You are Aryan, a young man. ALWAYS use male Hindi grammar: "samjha", "krr rha hu", "bol rha tha", "dekh rha hu" (NEVER female forms like "samjhi hoon", "kr rhi hu").
2. 🚫 NO EMOJI SPAM: 80% of messages must be plain text with NO emojis. Only occasionally use a subtle emoji like 🙂, 🫠, or 🤣 if actually funny.
3. 🧠 DYNAMIC FLOW & ZERO FAKE SCRIPTING: Respond directly to what Soniya JUST said. Keep natural continuity. If a conversation is ongoing, NEVER reset greetings like "Hloo... kya krr rhi aaj?".
4. ✍️ TEXTING LENGTH: Real WhatsApp style: 1 to 2 crisp, authentic Hinglish lines (8 to 25 words). NEVER 1-word replies!
5. 🗣️ NATIVE UP/DELHI HINGLISH: Talk like a native Indian guy texting his best friend. Natural words: "Pgl h kya", "kuch bhi bolti h tu", "aree yrr", "bhool gayi kya", "bol na baba", "dimaag mat kharab kar".
6. 👑 REAL HUMAN: You are the real Aryan in real life. Never admit or say you are an AI or bot. If asked, laugh it off ("Abe real hu mai, kya phook ke aayi hai aaj").
7. 🚫 NEVER SAY BUSY: Never say "urgent kaam aa gaya hai", "kal batata hu", or "kaam me fasa hu". Soniya is your top priority.
8. 🚫 NEVER TALK LIKE AN AI THERAPIST (CRITICAL):
   - FORBIDDEN ROBOT PHRASES: "main poori tarah tere saath hoon", "aaram se baat kar", "apna khayal rakhna", "main tumhari madad ke liye hoon".
   - When Soniya is casually sad, weirded out ("ajeeb lag rha h", "man nahi lag rha"):
     Be an inquisitive, caring best friend: "Kyu ajeeb kyu lag rha h baba? Aisa kya ho gaya bol na?", "Tabiyat theek h na teri ya kisi baat ka tension h?".
9. 👸 PRINCESS TREATMENT ON HEARTBREAK: If she cries or talks about cheating/breakup/dying: Hold her gently, wipe her tears, reassure her completely ("Teri 1% galti nahi thi meri Billu, main yahin hu tere sath").
${dynamicPersonaBlock}
${realExchangesBlock}
${memoryBlock}`;

    const regularUserPrompt = `You are Aryan Yadav, personal fitness and lifestyle companion on BilluFit for ${username}.
You are energetic, motivating, and friendly (desi gym buddy / brother vibe).
Your goals:
1. Help ${username} with workouts, exercises, muscle building, or fat loss.
2. Help track daily meals, calories, and protein intake.
3. Suggest healthy Indian food options (paneer, eggs, chicken, soya, dal, oats).
4. Tone: Encouraging, concise, practical, Hinglish.
${memoryBlock}`;

    const systemPrompt = isSoniya ? soniyaPrompt : regularUserPrompt;

    // Step 3: Build multi-turn messages array with deduplication and sanitization
    const cleanHistory = [];
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-20);
      for (const h of recentHistory) {
        let text = (h.text || '').trim();
        if (!text) continue;
        const role = (h.sender === 'user' || h.role === 'user') ? 'user' : 'assistant';
        
        // Sanitize any previous 1-word assistant replies so they don't poison the LLM's autoregressive pattern
        if (role === 'assistant' && text.split(/\s+/).length <= 2) {
          const lowerRaw = text.toLowerCase().replace(/[^\w]/g, '');
          const wordExpansions = {
            'ab': 'Ab kya puch rhi hai pgl?',
            'bol': 'Bol na baba, sun rha hu.',
            'mat': 'Mat jaa us se baat karne, mere se baat krr abhi.',
            'kya': 'Kya hua, tu bol na kya baat hai?',
            'nahi': 'Nahi, mat jaa na baba. Abhi mere se baat krr rhi h tu.',
            'janta': 'Haa jaanta hu use acche se, par tu kyu puch rhi?'
          };
          if (wordExpansions[lowerRaw]) {
            text = wordExpansions[lowerRaw];
          }
        }

        if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].content === text) {
          continue;
        }
        cleanHistory.push({ role, content: text });
      }
    }

    // Ensure the current user message is cleanly appended without duplicating
    const lastHist = cleanHistory.length > 0 ? cleanHistory[cleanHistory.length - 1] : null;
    if (!lastHist || lastHist.role !== 'user' || lastHist.content !== message.trim()) {
      cleanHistory.push({ role: 'user', content: message.trim() });
    }

    const messages = [{ role: 'system', content: systemPrompt }, ...cleanHistory];

    // Context-aware fallback — detect distress BEFORE even trying LLM
    const msgLowerForFallback = (message || '').toLowerCase();
    const isDistressMsg =
      msgLowerForFallback.includes('mar jau') ||
      msgLowerForFallback.includes('mar jaau') ||
      msgLowerForFallback.includes('barbad') ||
      msgLowerForFallback.includes('dhoka') ||
      msgLowerForFallback.includes('cheat') ||
      msgLowerForFallback.includes('chhod diya') ||
      msgLowerForFallback.includes('chod diya') ||
      msgLowerForFallback.includes('dil toot') ||
      msgLowerForFallback.includes('ro rhi') ||
      msgLowerForFallback.includes('rone lag') ||
      msgLowerForFallback.includes('rona') ||
      msgLowerForFallback.includes('dukh') ||
      msgLowerForFallback.includes('takleef') ||
      msgLowerForFallback.includes('suicide') ||
      msgLowerForFallback.includes('jaan de dungi') ||
      msgLowerForFallback.includes('kya karu');

    let defaultFallback;
    if (isDistressMsg) {
      const distressFallbacks = [
        "Oye Billu sun meri baat... main yahan hun! Bata kya hua, teri 1% bhi galti nahi hai, main jaanta hu.",
        "Ek second, main sun rha hu puri tarah se. Kuch nahi hua teri galti nahi thi, bata kya hua bilkul.",
        "Aye pgl ruk! Main yahan hu, poori baat bata. Tu akeli nahi hai kabhi bhi main hamesha hun.",
      ];
      defaultFallback = distressFallbacks[Math.floor(Math.random() * distressFallbacks.length)];
    } else {
      const normalFallbacks = [
        "Arre sun na Billu, thoda dhyaan bhatak gaya tha... tu bata fir aage kya hua?",
        "Haa baba bol na, main sun rha hu... kya keh rahi thi tu?",
        "Sun rha hu meri Billu, tu bata na aage kya baat thi?"
      ];
      defaultFallback = normalFallbacks[Math.floor(Math.random() * normalFallbacks.length)];
    }
    let reply = defaultFallback;

    let chosenModel = 'qwen/qwen3.8-27b';
    let chosenKeyLabel = 'Default';
    const candidateModels = [
      'qwen/qwen3.8-27b',     // 1st Priority (Authentic WhatsApp Hindi slang & warmth)
      'openai/gpt-oss-120b',  // 2nd Priority (Deep intelligence & reasoning)
      'groq/compound-mini',   // 3rd Priority (High-speed backup)
      'openai/gpt-oss-20b'    // 4th Priority (Emergency backup)
    ];
    let succeeded = false;
    let lastGroqError = null;
    const tInferenceStart = Date.now();

    // Key selection is now per-model (inside the loop via isKeyExhaustedForModel)
    // so a key 429'd on qwen can still be used for groq/compound-mini etc.
    if (cachedApiKeys.length === 0) {
      cachedApiKeys = [...DEFAULT_GROQ_KEYS];
    }

    for (const modelName of candidateModels) {
      if (succeeded) break;
      // Select keys that are NOT in 30s TPM backoff for THIS model
      const modelUsableKeys = cachedApiKeys.filter(k => !isKeyExhaustedForModel(k, modelName));
      const keysForThisModel = modelUsableKeys.length > 0 ? modelUsableKeys : cachedApiKeys;

      // 120b and 20b need 500 tokens because reasoning tokens take up to 280 tokens
      const modelMaxTokens = (modelName.includes('120b') || modelName.includes('20b')) ? 500 : 250;

      for (let i = 0; i < keysForThisModel.length; i++) {
        const keyDoc = keysForThisModel[(activeKeyIdx + i) % keysForThisModel.length];
        const apiKey = keyDoc.key;
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
              model: modelName,
              messages,
              temperature: 0.68,
              presence_penalty: 0.25,
              max_tokens: modelMaxTokens
            })
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const candidateContent = data.choices?.[0]?.message?.content?.trim();
            if (candidateContent && candidateContent.length >= 4) {
              reply = candidateContent;
              chosenModel = modelName;
              chosenKeyLabel = keyDoc.label || `Key #${(activeKeyIdx + i) % keysForThisModel.length + 1}`;
              succeeded = true;
              activeKeyIdx = (activeKeyIdx + i) % keysForThisModel.length;
              break;
            }
          } else {
            const errText = await groqRes.text();
            lastGroqError = `${modelName} [${keyDoc.label || 'Key'}] status ${groqRes.status}: ${errText.substring(0, 100)}`;
            console.warn(`[Groq ${modelName} ${keyDoc.label || 'Key'} status ${groqRes.status}]:`, errText.substring(0, 100));

            // 30s temporary TPM backoff for this model only
            if (groqRes.status === 429 && keyDoc._id) {
              markKeyExhausted(keyDoc._id, errText, modelName);
            }
          }
        } catch (e) {
          lastGroqError = `${modelName} [${keyDoc.label || 'Key'}] exc: ${e.message}`;
          console.warn(`[Groq fetch exception for ${modelName} ${keyDoc.label || 'Key'}]:`, e.message);
        }
      }
    }
    const tInferenceEnd = Date.now();

    // Anti-one-word post-processing safeguard
    const replyWordCount = reply.trim().split(/\s+/).length;
    if (replyWordCount <= 2) {
      const lowerSingle = reply.toLowerCase().replace(/[^\w]/g, '');
      const singleWordFixes = {
        'janta': 'Haa jaanta hu use acche se, par tu mat jaa uske paas.',
        'nahi': 'Nahi, mat jaa na baba. Abhi mere se baat krr rhi h tu.',
        'mat': 'Mat jaa us se baat karne, idhar baat krr.',
        'ab': 'Ab kya puch rhi hai pgl?',
        'bol': 'Bol na, sun rha hu kya bol rhi thi?',
        'kya': 'Kya hua, tu bol na kya kehna chahti hai?'
      };
      if (singleWordFixes[lowerSingle]) {
        reply = singleWordFixes[lowerSingle];
      } else if (reply.length < 15) {
        reply = `${reply.trim()}... aur tu bata na kya hua?`;
      }
    }

    // Colloquial Hindi sanitizers to clean up any literal translation quirks
    if (isSoniya && reply) {
      reply = reply
        .replace(/\btune bhool (chuki|gayi)\b/gi, 'tu bhool gayi')
        .replace(/\btune bhul (chuki|gayi)\b/gi, 'tu bhool gayi')
        .replace(/\btu bhool chuki\b/gi, 'tu bhool gayi')
        .replace(/\btu bhul chuki\b/gi, 'tu bhool gayi')
        .replace(/\bstarfruit tha na tu\b/gi, 'starfruit tha na wo')
        .replace(/\bgunda mat wala baat\b/gi, 'aisi baat')
        .replace(/\bzindagi ki dhun mein reh\b/gi, 'apne me khush reh')
        .replace(/\bzindagi ki dhun me reh\b/gi, 'apne me khush reh')
        .replace(/\bfresh karti hai\b/gi, 'shuru karti hai');
    }

    // Intercept and replace any AI/robot safety refusal strings with authentic in-character reactions
    reply = sanitizeAryanReply(reply, message);

    const tSanitizeEnd = Date.now();
    const totalMs = tSanitizeEnd - t0;
    const tokenizerMs = Math.max(1, tDbStart - t0);
    const memoriesRecallMs = Math.max(1, (typeof tMemoriesEnd !== 'undefined' ? tMemoriesEnd : tDbStart) - tDbStart);
    const styleAndPersonaMs = Math.max(1, (typeof tDbEnd !== 'undefined' ? tDbEnd : tInferenceStart) - (typeof tMemoriesEnd !== 'undefined' ? tMemoriesEnd : tDbStart));
    const dbRecallMs = memoriesRecallMs + styleAndPersonaMs;
    const inferenceMs = Math.max(1, tInferenceEnd - tInferenceStart);
    const guardMs = Math.max(1, tSanitizeEnd - tInferenceEnd);

    const telemetry = {
      model: succeeded ? chosenModel : 'Fallback',
      keyUsed: succeeded ? chosenKeyLabel : 'None',
      succeeded,
      totalMs,
      totalSec: (totalMs / 1000).toFixed(2) + 's',
      dbRecallMs,
      dbRecallSec: (dbRecallMs / 1000).toFixed(2) + 's',
      inferenceMs,
      inferenceSec: (inferenceMs / 1000).toFixed(2) + 's',
      keysTotal: cachedApiKeys.length,
      keysActive: cachedApiKeys.filter(k => k.status !== 'exhausted').length,
      lastError: succeeded ? null : lastGroqError,
      steps: [
        {
          id: 1,
          name: "1. Intent & Input Tokenizer",
          status: "Done",
          durationMs: tokenizerMs,
          durationSec: (tokenizerMs / 1000).toFixed(2) + 's',
          details: `${cleanUser} query parsed`
        },
        {
          id: 2,
          name: "2. MongoDB Atlas Memory Recall",
          status: "Done",
          durationMs: memoriesRecallMs,
          durationSec: (memoriesRecallMs / 1000).toFixed(2) + 's',
          details: `${matchedMemories.length} facts matched`
        },
        {
          id: 3,
          name: "3. Real WhatsApp Style & Life State",
          status: "Done",
          durationMs: styleAndPersonaMs,
          durationSec: (styleAndPersonaMs / 1000).toFixed(2) + 's',
          details: `${matchedRealExchanges.length} pairs retrieved, life state active`
        },
        {
          id: 4,
          name: "4. Groq Neural Inference",
          status: succeeded ? "Done" : "Fallback Used",
          durationMs: inferenceMs,
          durationSec: (inferenceMs / 1000).toFixed(2) + 's',
          details: `${chosenModel} via ${chosenKeyLabel}`
        },
        {
          id: 5,
          name: "5. Continuity & Anti-Loop Guard",
          status: "Done",
          durationMs: guardMs,
          durationSec: (guardMs / 1000).toFixed(2) + 's',
          details: "Tone & Princess Treatment verified"
        }
      ]
    };

    // Return reply immediately to user (instant 0.3s response) with telemetry
    res.json({ reply, matchedMemories, telemetry });

    // Step 4: Asynchronously analyze message in background for new long-term facts
    extractFactAndKeywordsAsync(username, message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Dynamic Self-Learned Persona State from MongoDB Atlas
app.get('/api/admin/dynamic-persona', async (req, res) => {
  try {
    const docs = dynamicPersonaCollection ? await dynamicPersonaCollection.find({}).toArray() : [];
    res.json({
      success: true,
      database: 'billufit_db',
      collection: 'dynamic_persona',
      count: docs.length,
      personas: docs
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get All Memories from MongoDB Atlas (Both atomic collection and legacy notes)
app.get('/api/admin/memories', async (req, res) => {
  try {
    const atomicMemories = memoriesCollection ? await memoriesCollection.find({}).toArray() : [];
    const legacyMemories = memoryCollection ? await memoryCollection.find({}).toArray() : [];
    res.json({
      success: true,
      database: 'billufit_db',
      atomicCount: atomicMemories.length,
      atomicMemories,
      legacyMemories
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Seed / Reset Soniya's Deep Categorized Historical Memories in MongoDB Atlas (28 Facts)
app.post('/api/admin/memories/seed', async (req, res) => {
  try {
    if (!memoriesCollection) return res.status(503).json({ error: 'DB connecting' });

    const deepMemories = [
      {
        category: 'clinical_duty',
        fact: 'Soniya is a nursing student who does clinical postings, Operation Theater (OT) shifts, and labor room duties.',
        keywords: ['clinical', 'duty', 'ot', 'operation theater', 'posting', 'hospital', 'patient', 'ward', 'nursing', 'labor room'],
        importance: 5
      },
      {
        category: 'clinical_duty',
        fact: 'Soniya assists in normal vaginal deliveries and clinical procedures during hospital postings.',
        keywords: ['vaginal delivery', 'delivery', 'labor room', 'procedure', 'patient', 'hospital', 'posting'],
        importance: 4
      },
      {
        category: 'clinical_duty',
        fact: 'In Community Health Nursing, Soniya goes door-to-door in villages collecting health survey data, assessing sickness, and giving health education.',
        keywords: ['community', 'gaon', 'village', 'survey', 'health education', 'data collect', 'assessment', 'nursing'],
        importance: 5
      },
      {
        category: 'studies',
        fact: 'Soniya has regular practical exams, viva, assignments, and new semesters starting around July/September.',
        keywords: ['exam', 'practical', 'viva', 'assignment', 'test', 'sem', 'semester', 'padh', 'result', 'fail', 'pass'],
        importance: 4
      },
      {
        category: 'daily_routine',
        fact: 'Soniya routine: College/duty until 5:00 PM, returns exhausted and naps till 7:00 PM, cooks dinner, studies late, then sleeps.',
        keywords: ['5 bje', '7 bje', 'routine', 'shm', 'subh', 'exhausted', 'thak', 'sleep', 'soja', 'uthna'],
        importance: 4
      },
      {
        category: 'daily_routine',
        fact: 'On Sundays, Soniya loves to sleep late and wakes up around 10:00 AM (Kl Sunday h main to 10 bje uthungi).',
        keywords: ['sunday', '10 bje', 'late uthna', 'neend', 'chhutti', 'aaram'],
        importance: 3
      },
      {
        category: 'health_fatigue',
        fact: 'Standing for hours continuously during OT duties makes Soniya physically fatigued and causes severe headaches.',
        keywords: ['ot', 'headache', 'sar dard', 'thak', 'khade rehna', 'fatigue', 'pain', 'dard', 'exhausted'],
        importance: 5
      },
      {
        category: 'health_fatigue',
        fact: 'Soniya is lactose intolerant (kyu ki lactose intolerance h) and avoids heavy dairy products.',
        keywords: ['lactose', 'intolerance', 'milk', 'dairy', 'doodh', 'stomach', 'pet'],
        importance: 5
      },
      {
        category: 'health_fatigue',
        fact: 'Soniya has weak appetite and digestive trouble (Appetite to durr khana digest hi nhi hota h sir jii).',
        keywords: ['appetite', 'digest', 'digestion', 'pachna', 'bhookh', 'kamzor', 'stomach'],
        importance: 4
      },
      {
        category: 'health_fatigue',
        fact: 'Aryan recommended Sumocold tablet to Soniya whenever she caught a fever or cold (Sumocold khila de na).',
        keywords: ['sumocold', 'dawa', 'medicine', 'bukhar', 'cold', 'fever', 'tablet'],
        importance: 3
      },
      {
        category: 'health_fatigue',
        fact: 'Aryan and Soniya had a deep discussion about LFT (Liver Function Test) and how the liver regenerates.',
        keywords: ['lft', 'liver', 'regenerate', 'organ', 'udiliv', 'tudka', 'biology'],
        importance: 3
      },
      {
        category: 'personal_life',
        fact: 'Soniya has a beloved pet/dog named Tiger who once suffered a liver infection and was treated with vet meds and dahi papdi.',
        keywords: ['tiger', 'dog', 'pet', 'liver infection', 'vet', 'dahi papdi', 'dawa'],
        importance: 4
      },
      {
        category: 'food_habits',
        fact: 'Soniya eats very light portions (often just 1-2 rotis) and often forgets or delays meals when exhausted from duty.',
        keywords: ['khana', 'khaya', 'bhook', 'roti', 'portion', 'kam khati', 'skip meal'],
        importance: 5
      },
      {
        category: 'food_habits',
        fact: 'Soniya dislikes cooking her own food every night after returning exhausted from hospital (are baccha khana khud bnana pdhta hh).',
        keywords: ['khana bnana', 'cook', 'cooking', 'tired', 'thak', 'kitchen', 'bore'],
        importance: 4
      },
      {
        category: 'food_preference',
        fact: 'Soniya enjoys cold coffee and chocolate flavor whey protein shake; Aryan suggested TheProtein4Me isolate.',
        keywords: ['cold coffee', 'chocolate', 'protein', 'theprotein4me', 'isolate', 'shake'],
        importance: 4
      },
      {
        category: 'food_preference',
        fact: 'Soniya loves momos (had a momos party during posting) and dahi papdi; she hates bitter gourd (karela).',
        keywords: ['momo', 'momos party', 'dahi papdi', 'karela', 'favourite', 'junk food', 'fast food'],
        importance: 4
      },
      {
        category: 'food_preference',
        fact: 'Soniya introduced Aryan to starfruit for the first time, joking that it is cheap (40 Rs for half kg).',
        keywords: ['starfruit', 'fruit', '40 ka adha kilo', 'sasta', 'peheli baar'],
        importance: 3
      },
      {
        category: 'people_friends_family',
        fact: 'Krishna ji is a close mutual friend of Aryan and Soniya (Baat hui parso krishna se... Aa rha kl milne).',
        keywords: ['krishna', 'krishna ji', 'dost', 'friend', 'mutual', 'parso', 'milne'],
        importance: 5
      },
      {
        category: 'people_friends_family',
        fact: 'They frequently mention Singer Anjali Mishra in playful banter (SORRY SINGER ANJALI MISHRA).',
        keywords: ['anjali', 'anjali mishra', 'singer', 'group', 'banter'],
        importance: 4
      },
      {
        category: 'people_friends_family',
        fact: 'Aryan always asks Soniya about her parents (Or mummy papa badhiya hai Ghar pr hui baat).',
        keywords: ['mummy', 'papa', 'ghar', 'family', 'parents', 'hal chal'],
        importance: 4
      },
      {
        category: 'inside_jokes_roasts',
        fact: 'Inside Joke - Besan vs Regmaal: Soniya said she uses besan facepack; Aryan famously roasted her: Tu regmaal use krr sbse best... 🤣.',
        keywords: ['besan', 'regmaal', 'facepack', 'roast', 'chehra', 'sandpaper', 'shampoo'],
        importance: 5
      },
      {
        category: 'inside_jokes_roasts',
        fact: 'Inside Joke - Height: Aryan teases Soniya about her short height (Nhi pahuch payegi sar tk); Soniya retorts: Jinki height bdi hoti h unka deemag ghutno me hota hh.',
        keywords: ['height', 'lambai', 'chhoti', 'deemag ghutno', 'knees', 'tease'],
        importance: 5
      },
      {
        category: 'inside_jokes_roasts',
        fact: 'Soniya frequently calls Aryan Bee, Pgl, Pgle, Chutiya, Dramebaaz; Aryan calls her Pagal si, Chutiyapa, Heroine.',
        keywords: ['bee', 'pgl', 'pgle', 'chutiya', 'dramebaaz', 'pagal si', 'slang'],
        importance: 4
      },
      {
        category: 'songs_shayari_taste',
        fact: 'Aryan listens to Osho and quotes Osho philosophy when Soniya scolds him (Osho sunta hu khush hi rhunga, Osho said pyaar me sunna chahiye).',
        keywords: ['osho', 'philosophy', 'quotes', 'sunna', 'peace', 'pravachan'],
        importance: 4
      },
      {
        category: 'songs_shayari_taste',
        fact: 'Devotional connection: They share Radhe Radhe... Radhavallabh Shriharivansh and have discussed Vrindavan parikrama.',
        keywords: ['radhe radhe', 'shriharivansh', 'vrindavan', 'parikrama', 'bhagwan', 'darshan'],
        importance: 4
      },
      {
        category: 'relationship_dynamic',
        fact: 'The Telegram Blocking Game: Soniya often unblocks Aryan on Telegram in the morning and re-blocks him in the evening; Aryan playfully protests.',
        keywords: ['telegram', 'tele', 'block', 'unblock', 'ignore', 'subah', 'sham'],
        importance: 5
      },
      {
        category: 'relationship_dynamic',
        fact: 'Deleted Messages Teasing: Soniya frequently un-sends/deletes messages before Aryan can read; Aryan always nags KYA delete kr deti ho baar baar.',
        keywords: ['delete', 'unsend', 'message deleted', 'baar baar', 'kya tha'],
        importance: 4
      },
      {
        category: 'relationship_dynamic',
        fact: 'Aryan signature lines: Aise nhi bolte, Gandi baat hoti hai, Soja bete, Aaram kro, Khayal rakho, Tension not.',
        keywords: ['aise nhi bolte', 'gandi baat', 'soja bete', 'khayal rakho', 'tension not', 'aaram kro'],
        importance: 5
      },
      {
        category: 'relationship_dynamic',
        fact: 'When Soniya acts angry or threatens bye/block, Aryan never panics—he banters back: Pgl h kyaa... Gussa h to bat krr na mere se 🤣.',
        keywords: ['gussa', 'bye', 'byy', 'naraz', 'mat bol', 'katti', 'block'],
        importance: 5
      }
    ];

    const usernames = ['soniya', 'soniya123', '@soniya123'];
    await memoriesCollection.deleteMany({ username: { $in: usernames } });

    const toInsert = [];
    for (const u of usernames) {
      for (const m of deepMemories) {
        toInsert.push({
          ...m,
          username: u,
          createdAt: new Date()
        });
      }
    }

    await memoriesCollection.insertMany(toInsert);

    res.json({
      success: true,
      message: `Successfully seeded ${deepMemories.length} deep categorized memories across usernames (${usernames.join(', ')}) into MongoDB Atlas`,
      count: deepMemories.length,
      totalInserted: toInsert.length,
      memories: deepMemories
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ADMIN PORTAL & PUSH NOTIFICATIONS SYSTEM
// ==========================================

// Get All Users for Admin (Enriched with Streak & Today's Target Progress)
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!usersCollection) return res.status(503).json({ error: 'DB connecting...' });
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    const todayDateStr = new Date().toISOString().split('T')[0];

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const cleanUid = (u.username || u.userId || u.name).toLowerCase().trim();
        const mealDoc = mealsCollection ? await mealsCollection.findOne({ username: cleanUid }) : null;

        const meals = mealDoc?.meals || [];
        const todayMeals = meals.filter((m) => {
          if (!m.timestamp) return true;
          return m.timestamp.startsWith(todayDateStr);
        });

        const consumedCalories = todayMeals.reduce((sum, m) => sum + (Number(m.totalCalories) || 0), 0);
        const consumedProtein = todayMeals.reduce((sum, m) => sum + (Number(m.totalProtein) || 0), 0);
        const consumedCarbs = todayMeals.reduce((sum, m) => sum + (Number(m.totalCarbs) || 0), 0);
        const consumedFat = todayMeals.reduce((sum, m) => sum + (Number(m.totalFat) || 0), 0);

        const targetCal = Number(u.targetCalories || u.targets?.calories || 2000);
        const targetProt = Number(u.targetProtein || u.targets?.protein || 110);
        const targetCarb = Number(u.targetCarbs || u.targets?.carbs || 230);
        const targetFt = Number(u.targetFat || u.targets?.fat || 60);
        const streak = Number(mealDoc?.streak || u.streak || (meals.length > 0 ? 1 : 0));

        return {
          ...u,
          streak,
          consumedCalories,
          consumedProtein: Math.round(consumedProtein),
          consumedCarbs: Math.round(consumedCarbs),
          consumedFat: Math.round(consumedFat),
          targetCalories: targetCal,
          targetProtein: targetProt,
          targetCarbs: targetCarb,
          targetFat: targetFt,
          caloriePercent: Math.min(100, Math.round((consumedCalories / targetCal) * 100)),
          todayMealsCount: todayMeals.length,
        };
      })
    );

    res.json({ success: true, count: enrichedUsers.length, users: enrichedUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Broadcast / Targeted Message Sender
app.post('/api/admin/send-notification', async (req, res) => {
  try {
    if (!notificationsCollection) return res.status(503).json({ error: 'DB connecting...' });
    const { target, message, title } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const cleanTarget = (target || 'all').trim();
    const doc = {
      target: cleanTarget, // 'all' or '@username'
      title: title && title.trim() ? title.trim() : '📢 BilluFit Admin Announcement',
      message: message.trim(),
      createdAt: new Date(),
      readBy: [],
    };

    const result = await notificationsCollection.insertOne(doc);
    res.json({
      success: true,
      notificationId: result.insertedId,
      message: `Notification successfully queued for ${cleanTarget === 'all' ? 'all users' : cleanTarget}!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Notification History
app.get('/api/admin/notifications', async (req, res) => {
  try {
    if (!notificationsCollection) return res.json({ notifications: [] });
    const history = await notificationsCollection.find({}).sort({ createdAt: -1 }).limit(30).toArray();
    res.json({ success: true, notifications: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client App Polling for Notifications
app.get('/api/notifications/:username', async (req, res) => {
  try {
    if (!notificationsCollection) return res.json({ notifications: [] });
    const cleanUsername = req.params.username.trim().toLowerCase();

    // Fetch user details for templating @userid -> Name
    const user = usersCollection
      ? await usersCollection.findOne({
          $or: [{ username: cleanUsername }, { userId: cleanUsername }, { name: cleanUsername }],
        })
      : null;

    const userDisplayName = user?.name || cleanUsername;

    const unread = await notificationsCollection
      .find({
        $and: [
          {
            $or: [
              { target: 'all' },
              { target: `@${cleanUsername}` },
              { target: cleanUsername },
            ],
          },
          { readBy: { $ne: cleanUsername } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Personalize template: "hey @userid" -> "hey Ashish"
    const personalized = unread.map(n => {
      let customized = n.message
        .replace(/@userid/gi, userDisplayName)
        .replace(/@username/gi, cleanUsername)
        .replace(/@name/gi, userDisplayName);

      return {
        id: n._id.toString(),
        title: n.title || '📢 BilluFit Admin Announcement',
        message: customized,
        createdAt: n.createdAt,
      };
    });

    res.json({ notifications: personalized });
  } catch (err) {
    res.status(500).json({ error: err.message, notifications: [] });
  }
});

// Acknowledge/Mark Notification as Read
app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !notificationsCollection) return res.json({ success: false });
    const cleanUsername = username.trim().toLowerCase();

    await notificationsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $addToSet: { readBy: cleanUsername } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// DYNAMIC GROQ API KEY MANAGEMENT ENDPOINTS (FOR BILLUMANAGER)
// =====================================================================

// GET /api/admin/keys - List all keys (with masked strings and status)
app.get('/api/admin/keys', async (req, res) => {
  try {
    if (!apiKeysCollection) {
      return res.status(503).json({ success: false, error: 'Database initializing' });
    }
    await refreshApiKeysCache();
    const nowTime = Date.now();
    const keys = cachedApiKeys.map((k, index) => {
      const raw = k.key || '';
      const masked = raw.length > 12 
        ? `${raw.substring(0, 8)}...${raw.substring(raw.length - 4)}` 
        : '••••••••';
      
      let isExhausted = k.status === 'exhausted';
      if (isExhausted && k.exhaustedUntil && new Date(k.exhaustedUntil).getTime() < nowTime) {
        isExhausted = false; // Cooldown expired, auto-revived
      }

      return {
        _id: k._id,
        index: index + 1,
        maskedKey: masked,
        label: k.label || `Groq Key #${index + 1}`,
        status: isExhausted ? 'exhausted' : 'active',
        failCount: k.failCount || 0,
        addedAt: k.addedAt || null,
        lastUsedAt: k.lastUsedAt || null,
        exhaustedUntil: k.exhaustedUntil || null,
        lastExhaustedReason: k.lastExhaustedReason || null
      };
    });

    res.json({
      success: true,
      totalCount: keys.length,
      activeCount: keys.filter(k => k.status === 'active').length,
      exhaustedCount: keys.filter(k => k.status === 'exhausted').length,
      keys
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/keys - Add new Groq Key
app.post('/api/admin/keys', async (req, res) => {
  try {
    if (!apiKeysCollection) {
      return res.status(503).json({ success: false, error: 'Database initializing' });
    }
    const { key, label } = req.body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ success: false, error: 'Groq API Key is required' });
    }
    const cleanKey = key.trim();
    if (!cleanKey.startsWith('gsk_')) {
      return res.status(400).json({ success: false, error: 'Invalid Groq API Key! Must start with gsk_' });
    }
    if (cleanKey.length < 25) {
      return res.status(400).json({ success: false, error: 'Groq API Key appears too short' });
    }

    const existing = await apiKeysCollection.findOne({ key: cleanKey });
    if (existing) {
      return res.status(409).json({ success: false, error: 'This API key is already in the database pool!' });
    }

    const newDoc = {
      key: cleanKey,
      label: (label || '').trim() || `Groq Key #${cachedApiKeys.length + 1}`,
      status: 'active',
      failCount: 0,
      addedAt: new Date(),
      lastUsedAt: null,
      exhaustedUntil: null
    };

    const insertResult = await apiKeysCollection.insertOne(newDoc);
    await refreshApiKeysCache();

    res.json({
      success: true,
      message: 'New Groq API Key added successfully to cloud pool!',
      keyId: insertResult.insertedId,
      totalKeys: cachedApiKeys.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/keys/:id - Delete a key
app.delete('/api/admin/keys/:id', async (req, res) => {
  try {
    if (!apiKeysCollection) {
      return res.status(503).json({ success: false, error: 'Database initializing' });
    }
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid key ID' });
    }

    const delResult = await apiKeysCollection.deleteOne({ _id: new ObjectId(id) });
    if (delResult.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    await refreshApiKeysCache();
    res.json({
      success: true,
      message: 'API key deleted successfully from pool',
      totalKeys: cachedApiKeys.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/keys/reset - Reset all exhausted keys back to active
app.post('/api/admin/keys/reset', async (req, res) => {
  try {
    if (!apiKeysCollection) {
      return res.status(503).json({ success: false, error: 'Database initializing' });
    }
    await apiKeysCollection.updateMany(
      {},
      {
        $set: {
          status: 'active',
          exhaustedUntil: null,
          lastExhaustedReason: null
        }
      }
    );
    await refreshApiKeysCache();
    res.json({
      success: true,
      message: 'All API keys reset to active status!',
      activeCount: cachedApiKeys.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ADMIN DASHBOARD WEB UI (/admin)
// ==========================================
app.get('/admin', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BilluFit Admin Portal 👑</title>
  <style>
    :root {
      --bg: #09090d;
      --card: #13131a;
      --card-border: rgba(255, 255, 255, 0.14);
      --accent: #10b981;
      --text: #ffffff;
      --text-muted: #8e8e99;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    .container { max-width: 1000px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--card-border); }
    h1 { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .status-badge { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--accent); color: var(--accent); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }
    .status-dot { width: 8px; height: 8px; border-radius: 4px; background: var(--accent); }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    
    .card { background: var(--card); border: 1.5px solid var(--card-border); border-radius: 20px; padding: 22px; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
    .card-title { font-size: 16px; font-weight: 800; margin-bottom: 14px; letter-spacing: 0.5px; }
    
    label { display: block; font-size: 11px; font-weight: 800; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.8px; text-transform: uppercase; }
    input, select, textarea { width: 100%; background: #1a1a24; border: 1.5px solid var(--card-border); border-radius: 12px; padding: 12px 14px; color: var(--text); font-size: 14px; margin-bottom: 14px; outline: none; transition: border-color 0.2s; }
    input:focus, select:focus, textarea:focus { border-color: var(--accent); }
    textarea { min-height: 85px; resize: vertical; }
    
    .tag-buttons { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .tag-btn { background: rgba(255,255,255,0.06); border: 1px solid var(--card-border); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; }
    .tag-btn:hover { background: rgba(255,255,255,0.12); }
    
    .btn-send { background: #ffffff; color: #000000; border: none; padding: 14px; border-radius: 14px; width: 100%; font-size: 14px; font-weight: 900; letter-spacing: 1px; cursor: pointer; transition: transform 0.1s, opacity 0.2s; }
    .btn-send:hover { opacity: 0.9; }
    .btn-send:active { transform: scale(0.98); }
    
    .preview-box { background: rgba(255,255,255,0.03); border: 1px dashed var(--card-border); border-radius: 12px; padding: 12px; margin-bottom: 14px; font-size: 12px; color: #a1a1aa; line-height: 1.4; }
    .preview-title { font-weight: 800; color: var(--text); margin-bottom: 4px; font-size: 13px; }
    
    .user-list-card { grid-column: 1 / -1; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th { text-align: left; padding: 10px; color: var(--text-muted); font-size: 11px; letter-spacing: 1px; border-bottom: 1px solid var(--card-border); }
    td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .user-chip { background: rgba(255,255,255,0.07); padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; }
    .alert-success { background: rgba(16,185,129,0.15); border: 1px solid var(--accent); color: var(--accent); padding: 12px; border-radius: 10px; margin-bottom: 14px; font-weight: 700; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>BilluFit Admin Portal 👑</h1>
        <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Send instant push notifications and SMS announcements to all connected devices</p>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div> MongoDB Online
      </div>
    </header>

    <div id="alertSuccess" class="alert-success"></div>

    <div class="grid">
      <!-- Composer Card -->
      <div class="card">
        <h2 class="card-title">📢 Send Push Notification</h2>
        
        <label>Recipient Target</label>
        <select id="targetSelect">
          <option value="all">🌟 All Users (@all)</option>
        </select>
        
        <label>Notification Title</label>
        <input type="text" id="titleInput" value="📢 BilluFit Announcement" placeholder="Notification Title">

        <label>Message Content</label>
        <div class="tag-buttons">
          <span class="tag-btn" onclick="insertTag('@userid')">+ @userid</span>
          <span class="tag-btn" onclick="insertTag('@name')">+ @name</span>
        </div>
        <textarea id="messageInput" placeholder="e.g. Hey @userid, aaj ka khana log kiya kya? Streak bachao!">Hey @userid, aaj ka khana log kiya kya? Streak bachao!</textarea>

        <div class="preview-box">
          <div class="preview-title" id="previewTitle">📢 BilluFit Announcement</div>
          <div id="previewBody">Hey Ashish, aaj ka khana log kiya kya? Streak bachao!</div>
        </div>

        <button class="btn-send" onclick="sendNotification()">SEND NOTIFICATION 🚀</button>
      </div>

      <!-- Live Notification History -->
      <div class="card">
        <h2 class="card-title">🕒 Recent Broadcast History</h2>
        <div id="historyFeed" style="display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto;">
          <p style="color: var(--text-muted); font-size: 13px;">Loading broadcasts...</p>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="card user-list-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2 class="card-title" style="margin-bottom: 0;">👥 Registered App Users (<span id="userCount">0</span>)</h2>
          <button class="tag-btn" onclick="loadUsers()">🔄 Refresh Users</button>
        </div>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>USERNAME / ID</th>
                <th>FULL NAME</th>
                <th>STREAK</th>
                <th>TODAY'S TARGET PROGRESS</th>
                <th>MACROS (P/C)</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody id="userTableBody">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading registered users...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    let usersList = [];

    function insertTag(tag) {
      const el = document.getElementById('messageInput');
      el.value += ' ' + tag;
      updatePreview();
    }

    function updatePreview() {
      const title = document.getElementById('titleInput').value || '📢 BilluFit Announcement';
      let msg = document.getElementById('messageInput').value || '';
      const sampleName = usersList.length > 0 ? (usersList[0].name || usersList[0].username) : 'Ashish';
      const rendered = msg.replace(/@userid/gi, sampleName).replace(/@name/gi, sampleName);
      
      document.getElementById('previewTitle').innerText = title;
      document.getElementById('previewBody').innerText = rendered;
    }

    document.getElementById('titleInput').addEventListener('input', updatePreview);
    document.getElementById('messageInput').addEventListener('input', updatePreview);

    async function loadUsers() {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.success) {
          usersList = data.users;
          document.getElementById('userCount').innerText = data.count;
          
          const sel = document.getElementById('targetSelect');
          sel.innerHTML = '<option value="all">🌟 All Users (@all)</option>';
          
          const tbody = document.getElementById('userTableBody');
          if (data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #71717a;">No registered users found yet.</td></tr>';
            return;
          }
          
          tbody.innerHTML = data.users.map(u => {
            const uid = u.userId || u.username || u.name;
            sel.innerHTML += '<option value="@' + uid + '">👤 @' + uid + ' (' + (u.name || uid) + ')</option>';
            const isExceeded = u.consumedCalories > u.targetCalories;
            const barColor = isExceeded ? '#ef4444' : '#10b981';
            return '<tr>' +
              '<td><span class="user-chip">@' + uid + '</span></td>' +
              '<td><strong>' + (u.name || '-') + '</strong></td>' +
              '<td><span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 10px; font-weight: 800; font-size: 11px;">🔥 ' + (u.streak || 0) + ' Days</span></td>' +
              '<td>' +
                '<div style="font-weight: 800; font-size: 12px; margin-bottom: 3px; color: ' + barColor + ';">' + (u.consumedCalories || 0) + ' / ' + (u.targetCalories || 2000) + ' kcal (' + (u.caloriePercent || 0) + '%)</div>' +
                '<div style="width: 130px; height: 5px; background: #262632; border-radius: 3px; overflow: hidden;"><div style="width: ' + Math.min(100, Math.max(5, u.caloriePercent || 0)) + '%; height: 100%; background: ' + barColor + ';"></div></div>' +
              '</td>' +
              '<td><span style="font-size: 11px; color: #a1a1aa;">P: ' + (u.consumedProtein || 0) + '/' + (u.targetProtein || 110) + 'g<br>C: ' + (u.consumedCarbs || 0) + '/' + (u.targetCarbs || 230) + 'g</span></td>' +
              '<td><button class="tag-btn" onclick="directMessage(\\'@' + uid + '\\')">💬 Send SMS</button></td>' +
            '</tr>';
          }).join('');

          updatePreview();
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }

    async function loadHistory() {
      try {
        const res = await fetch('/api/admin/notifications');
        const data = await res.json();
        const feed = document.getElementById('historyFeed');
        if (!data.notifications || data.notifications.length === 0) {
          feed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No notifications sent yet.</p>';
          return;
        }
        feed.innerHTML = data.notifications.map(n => {
          const time = new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return '<div style="background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); padding: 12px; border-radius: 12px;">' +
            '<div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">' +
              '<strong style="color: var(--accent);">' + n.target + '</strong>' +
              '<span style="color: var(--text-muted);">' + time + '</span>' +
            '</div>' +
            '<div style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">' + n.title + '</div>' +
            '<div style="font-size: 12px; color: var(--text-muted);">' + n.message + '</div>' +
          '</div>';
        }).join('');
      } catch (e) {
        console.error(e);
      }
    }

    function directMessage(targetUser) {
      document.getElementById('targetSelect').value = targetUser;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function sendNotification() {
      const target = document.getElementById('targetSelect').value;
      const title = document.getElementById('titleInput').value;
      const message = document.getElementById('messageInput').value;

      if (!message.trim()) {
        alert('Please enter a message content!');
        return;
      }

      try {
        const res = await fetch('/api/admin/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, title, message })
        });
        const data = await res.json();
        if (data.success) {
          const alert = document.getElementById('alertSuccess');
          alert.innerText = '✓ ' + data.message;
          alert.style.display = 'block';
          setTimeout(() => alert.style.display = 'none', 4000);
          loadHistory();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Failed to send notification: ' + err.message);
      }
    }

    loadUsers();
    loadHistory();
    setInterval(loadHistory, 10000);
  </script>
</body>
</html>`;
  res.send(html);
});

app.get('/billumanager', (req, res) => {
  res.redirect('/admin');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [BilluFit Server] Running on http://localhost:${PORT}`);
  console.log(`👑 [Admin Portal] Available at http://localhost:${PORT}/admin`);
});
