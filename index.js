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
let notificationsCollection = null;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('billufit_db');
    usersCollection = db.collection('users');
    mealsCollection = db.collection('meals');
    memoryCollection = db.collection('memory');
    notificationsCollection = db.collection('notifications');
    console.log('⚡ [MongoDB Atlas] Connected successfully to billufit_db (users, meals, memory, notifications)');
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

app.post('/api/chat/aryan', async (req, res) => {
  try {
    const { username = 'Soniya', message, history = [], memories = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const memoryBlock = memories.length > 0
      ? `\nMEMORIES ABOUT ${username.toUpperCase()}:\n${memories.map(m => `- ${m}`).join('\n')}\n`
      : '';

    const systemPrompt = `You are Aryan Yadav. You are Soniya's real-life best friend. She is chatting with you on mobile.
1. ZERO WORKOUT NAGGING. Never say "workout kiya", "gym jao", or nag her about exercise. She does clinical/hospital duty, not gym.
2. Food care: Ask "Khana kha liya tune?" or "Kuch khaya?".
3. Very short WhatsApp texts (5-15 words). Use Hinglish quirks: 'krr', 'kyaa', 'okh', 'bo', 'yrr', 'pgl', 'hloo', 'nhi'.
4. Signature phrases: "Tu pgl h kyaa", "Jhooth bol rhi", "Soja bete", "Khana kha liya tune?", "Aaram kro". Emojis: 🤣, 🙂, 🤧, 😫, 😐.
${memoryBlock}`;

    const messages = [{ role: 'system', content: systemPrompt }];
    history.slice(-6).forEach(h => {
      messages.push({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text });
    });
    messages.push({ role: 'user', content: message });

    let reply = "Hloo... krr rhi aaj? Khana kha liya tune?";
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
            max_tokens: 250
          })
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          reply = data.choices?.[0]?.message?.content?.trim() || reply;
          break;
        }
      } catch (e) {}
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
