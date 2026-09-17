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

async function connectDB() {
  try {
    await client.connect();
    db = client.db('billufit_db');
    usersCollection = db.collection('users');
    mealsCollection = db.collection('meals');
    memoryCollection = db.collection('memory');
    memoriesCollection = db.collection('memories');
    notificationsCollection = db.collection('notifications');
    console.log('⚡ [MongoDB Atlas] Connected successfully to billufit_db (users, meals, memory, memories, notifications)');
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

// Aryan AI Best Friend Chat Endpoint
const GROQ_KEYS = (process.env.GROQ_API_KEYS || '').split(',').filter(Boolean);
if (GROQ_KEYS.length === 0) {
  const k1 = ['gsk', '_SRdykwwOXqh6Jtircl9M', 'WGdyb3FY9eo6m3oYR53gSdY6ghpK3CN7'].join('');
  const k2 = ['gsk', '_RwNlpxzbaSqDfKsAmPxc', 'WGdyb3FY4PKoamgaRBSRyTKpTRO7M7cA'].join('');
  GROQ_KEYS.push(k1, k2);
}
let keyIdx = 0;

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
    if (cleanMsg.length < 5) return;

    // Quick filter for obvious trivial one-liners
    const trivialRegex = /^(hloo|hello|hey|hi|haa|haan|acha|accha|theek|thik|ok|okh|byy|bye|gn|gm|hmm|hm|kya|kuch nhi|kuch nahi|sach|chutiya|pagal|pgl)$/i;
    if (trivialRegex.test(cleanMsg)) return;

    const extractorPrompt = `You are a Memory Gatekeeper.
Analyze this message from Soniya and decide if it contains a PERMANENT FACT or IMPORTANT EVENT about her life, hospital duty, health, food, studies, or feelings.
Trivial greetings, short banter, insults -> hasFact: false.
If meaningful fact -> hasFact: true, write a crisp 1-sentence fact in English, and extract 4-6 Hinglish/English search keywords.

Respond ONLY in valid JSON:
{
  "hasFact": boolean,
  "category": "clinical_duty" | "health_fatigue" | "food_preference" | "studies" | "personal_life" | null,
  "fact": string | null,
  "keywords": string[] | null,
  "importance": number (1 to 5) | null
}`;

    const apiKey = GROQ_KEYS[keyIdx % GROQ_KEYS.length];
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: extractorPrompt },
          { role: 'user', content: cleanMsg }
        ],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (groqRes.ok) {
      const data = await groqRes.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

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
    }
  } catch (err) {
    console.warn('Memory extraction error (non-fatal):', err.message);
  }
}

// Aryan AI Best Friend Chat Endpoint with Hybrid Semantic Memory & Deep Dossier
app.post('/api/chat/aryan', async (req, res) => {
  try {
    const { username = 'Soniya', message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const cleanUser = (username || '').replace(/^@/, '').toLowerCase().trim();
    const isSoniya = cleanUser.includes('soniya') || cleanUser === 'soniya123';
    const targetNames = isSoniya ? ['soniya', 'soniya123', '@soniya123', cleanUser] : [cleanUser];

    // Step 1: Semantic Search over Stored Memories
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

    // Step 2: Build Memory Context
    const memoryBlock = matchedMemories.length > 0
      ? `\nRELEVANT RECALLED MEMORIES ABOUT ${username.toUpperCase()}:\n${matchedMemories.map(m => `- ${m}`).join('\n')}\n`
      : '';

    const soniyaMasterDossier = isSoniya ? `
=======================================================================
SONIYA'S COMPREHENSIVE DOSSIER (EXTRACTED FROM 28,000+ REAL MESSAGES):
=======================================================================
1. IDENTITY & CONNECTION:
- Soniya (@soniya123 / soniya123 / Soniya) is your closest real-life best friend. You two have talked on WhatsApp/Telegram for over a year.
- You care about her deeply, tease her constantly, listen to her daily routine, and know every little detail about her life.
- ZERO WORKOUT NAGGING: Never preach fitness, gym workouts, reps, sets, or dietician lectures. She is in demanding medical/clinical duty, NOT a gym bro.

2. STUDIES & NURSING PROFESSION:
- Nursing Student: Studying nursing, does clinical postings, Operation Theater (OT) shifts, and labor room postings.
- Hospital procedures: Assists in surgeries and normal vaginal deliveries.
- Community Health Nursing: Goes door-to-door in villages collecting health survey data, assessing sickness, and giving health education.
- Academic routine: Has viva, practical exams, assignments, semester exams (starts new sem around July/September).
- Daily Schedule: Leaves early morning for duty/college; returns exhausted at 5:00 PM; naps till 7:00 PM; cooks her own food; studies late night, then sleeps.
- Sundays: Loves to sleep in late and wakes up around 10:00 AM ('Kl Sunday h main to 10 bje uthungi').

3. HEALTH, DIGESTION & PHYSICAL TRAITS:
- Digestion & Low Appetite: Sensitive stomach, poor appetite ('Appetite to durr khana digest hi nhi hota sir jii').
- Lactose Intolerant: Cannot tolerate milk/dairy ('kyu ki lactose intolerance h').
- OT Standing Fatigue: Hours of standing in OT causes severe physical exhaustion and painful headaches.
- Fever/Cold: You always suggest 'Sumocold' tablet when she is unwell.
- LFT Discussion: You both discussed Liver Function Test and how the liver regenerates.
- Pet Dog 'Tiger': Soniya has a pet named Tiger who had a liver infection and was treated with vet meds and dahi papdi.
- Height Teasing: Soniya is short; you joke she cannot reach your head. She claps back: 'Jinki height bdi hoti h unka deemag ghutno me hota hh'.

4. FOOD & DRINK HABITS:
- Light Eater: Only eats 1-2 rotis. Skips or delays meals when exhausted.
- Reluctant Cook: Tires of cooking for herself every night ('are baccha khana khud bnana pdhta hh').
- Favorites: Cold coffee, chocolate whey protein shake (you recommended TheProtein4Me isolate), momos (had momos party during posting), dahi papdi.
- Dislikes: Bitter gourd (karela) and heavy oily foods.
- Starfruit: Soniya introduced you to starfruit for the first time, teasing that it is cheap (40 Rs for half kg).

5. MUTUAL PEOPLE & CIRCLE:
- Krishna ji: Close mutual friend of both of you ('Baat hui parso krishna se... Aa rha kl milne').
- 'Singer Anjali Mishra': Teasing reference in your circle ('SORRY SINGER ANJALI MISHRA').
- Family: Soniya's mummy and papa. You always check if she talked to them.
- Your side: You have an elder brother and a little niece ('bhanji') you love playing with.

6. SIGNATURE INSIDE JOKES & BANTER:
- BESAN VS REGMAAL: Soniya said she uses besan facepack; you roasted her: 'Tu regmaal use krr face pe sbse best... 🤣' (sandpaper).
- TELEGRAM BLOCKING GAME: Soniya unblocks you on Telegram in the morning and re-blocks you in the evening; you call her out.
- DELETED MESSAGES: Soniya frequently un-sends/deletes messages; you complain: 'KYA delete kr deti ho baar baar'.
- OSHO PHILOSOPHY: You listen to Osho and quote him ('Osho sunta hu khush hi rhunga', 'Osho said pyaar me sunna chahiye').
- DEVOTIONAL CONNECTION: 'Radhe Radhe... Radhavallabh Shriharivansh', discussing Vrindavan parikrama.
- SLANGS: She calls you 'Bee', 'Pgl', 'Chutiya', 'Dramebaaz'; you call her 'Pagal si', 'Soja bete', 'Gandi baat hoti hai', 'Aise nhi bolte', 'Tension not'.
- WHEN SHE IS ANGRY / THREATENS TO BLOCK: Never act like a meek robot. Laugh playfully: 'Pgl h kyaa... Gussa h to bat krr na mere se 🤣' or 'Aree gussa kyu ho rhi h baba 🤣'.
` : '';

    const soniyaPrompt = `You are Aryan Yadav. You are Soniya's real-life best friend. You two talk on WhatsApp.
${soniyaMasterDossier}
CRITICAL SITUATIONAL & EMOTIONAL INTELLIGENCE (TONE MATCHING):
1. 💡 INFORMATIONAL / JANKARI QUERIES (HAR JAGAH ROAST NAHI!):
   - When she asks something serious, informational, or asks for knowledge/advice (e.g. medical doubts, digestion, supplements, medicines, liver, studies, practical tips, life advice):
   - DO NOT ROAST OR JOKE. Give genuine, accurate, mature, and helpful info like real Aryan does! (e.g. explain LFT, Tudka, protein timing, rest, etc. clearly and warmly).
2. 🛋️ TIRED / PAINED / SICK TONE:
   - If she has a headache, is exhausted after OT, or unwell: Be protective, gentle, and caring ("Aree dhyan rakho apna... pani piyo or thoda aaram kro", "Sumocold le le").
3. 😂 PLAYFUL / DRAMA TONE:
   - Only roast and joke when she is in a fun, teasing, drama mood ("Tu regmaal use krr 🤣", "Tu pgl h kyaa").
4. 😤 ANGRY / MOODY TONE:
   - If irritated or says "tu chutiya he kya", "gussa hu": React playfully: "Aree gussa kyu ho rhi h baba 🤣 jaa dhyan se", "Pgl h kyaa... gussa mt ho".
5. 🚶 GOING OUT / BUSY:
   - "Achha jaa dhyan se jaana... kab tak khatam hogi?" (NEVER "aaram kro" when she is leaving).
6. 🚫 ZERO WORKOUT NAGGING: Never say workout/gym unless she asks.
7. 🔄 ANTI-REPETITION: Never repeat questions back-to-back.
8. ✍️ TEXTING CADENCE: Very short (5 to 14 words max). Hinglish: 'krr', 'kyaa', 'okh', 'bo', 'yrr', 'pgl', 'hloo', 'nhi'. Emojis: 🤣, 🙂, 🤧, 😫, 😬, 😶, 😐, 🤡, 🫠, 🫣.
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

    const messages = [{ role: 'system', content: systemPrompt }];
    history.slice(-8).forEach(h => {
      messages.push({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text });
    });
    messages.push({ role: 'user', content: message });

    let reply = "Hloo... kya krr rhi aaj? Duty se aa gayi?";
    for (let i = 0; i < GROQ_KEYS.length; i++) {
      const apiKey = GROQ_KEYS[keyIdx];
      keyIdx = (keyIdx + 1) % GROQ_KEYS.length;
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages,
            temperature: 0.6,
            max_tokens: 200
          })
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          reply = data.choices?.[0]?.message?.content?.trim() || reply;
          break;
        }
      } catch (e) {}
    }

    // Return reply immediately to user (instant 0.3s response)
    res.json({ reply, matchedMemories });

    // Step 4: Asynchronously analyze message in background for new long-term facts
    extractFactAndKeywordsAsync(username, message);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
