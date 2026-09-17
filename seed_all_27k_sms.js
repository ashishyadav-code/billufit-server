const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI || 'mongodb+srv://ashishyadav14065_db_user:vyONlYEINPa4T1Qt@cluster0.r51zmz3.mongodb.net/class10_roadmap?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  console.log('⚡ Connecting to MongoDB Atlas...');
  await client.connect();
  const db = client.db('billufit_db');

  const rawMessagesCol = db.collection('whatsapp_messages');
  const pairsCol = db.collection('whatsapp_pairs');

  console.log('Reading clean_27k_messages.json...');
  const jsonPath = path.join(__dirname, 'clean_27k_messages.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const messages = JSON.parse(rawData);

  console.log(`Loaded ${messages.length} clean messages from WhatsApp.`);

  // 1. Prepare raw message documents for insertion
  const rawDocs = messages.map((m, idx) => ({
    username: 'soniya',
    sender: m.sender,
    text: m.text,
    date: m.date,
    time: m.time,
    msgIndex: idx + 1,
    createdAt: new Date()
  }));

  console.log('Purging old whatsapp_messages collection...');
  await rawMessagesCol.deleteMany({});

  console.log(`Inserting ${rawDocs.length} raw WhatsApp SMS messages in batches...`);
  const BATCH_SIZE = 5000;
  for (let i = 0; i < rawDocs.length; i += BATCH_SIZE) {
    const chunk = rawDocs.slice(i, i + BATCH_SIZE);
    await rawMessagesCol.insertMany(chunk);
    console.log(`  ✓ Inserted messages ${i + 1} to ${Math.min(i + BATCH_SIZE, rawDocs.length)}`);
  }

  // Create search index on text and date
  console.log('Creating text index on whatsapp_messages...');
  await rawMessagesCol.createIndex({ text: 'text' });
  await rawMessagesCol.createIndex({ sender: 1, date: 1 });

  // 2. Build grouped turn-by-turn dialogue exchanges
  console.log('\nGrouping consecutive messages into dialogue turns...');
  const grouped = [];
  let curr = null;
  for (const m of messages) {
    if (!curr) {
      curr = { sender: m.sender, text: m.text, date: m.date, time: m.time };
    } else if (curr.sender === m.sender && curr.date === m.date) {
      curr.text += ' ' + m.text;
    } else {
      grouped.push(curr);
      curr = { sender: m.sender, text: m.text, date: m.date, time: m.time };
    }
  }
  if (curr) grouped.push(curr);

  const pairs = [];
  for (let i = 0; i < grouped.length - 1; i++) {
    const b1 = grouped[i];
    const b2 = grouped[i + 1];
    if (b1.sender === 'Soniya' && b2.sender === 'Aryan') {
      pairs.push({
        username: 'soniya',
        date: b1.date,
        time: b1.time,
        soniyaText: b1.text,
        aryanReply: b2.text,
        createdAt: new Date()
      });
    }
  }

  console.log(`Purging old whatsapp_pairs collection...`);
  await pairsCol.deleteMany({});

  console.log(`Inserting ${pairs.length} direct Soniya -> Aryan dialogue turns in batches...`);
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const chunk = pairs.slice(i, i + BATCH_SIZE);
    await pairsCol.insertMany(chunk);
    console.log(`  ✓ Inserted dialogue pairs ${i + 1} to ${Math.min(i + BATCH_SIZE, pairs.length)}`);
  }

  console.log('Creating text index on whatsapp_pairs...');
  await pairsCol.createIndex({ soniyaText: 'text', aryanReply: 'text' });

  const totalRaw = await rawMessagesCol.countDocuments({});
  const totalPairs = await pairsCol.countDocuments({});

  console.log('\n🎉 ALL DONE!');
  console.log(`📊 billufit_db.whatsapp_messages: ${totalRaw} exact SMS messages live!`);
  console.log(`📊 billufit_db.whatsapp_pairs:    ${totalPairs} real dialogue exchanges live!`);

  await client.close();
}

run().catch(console.error);
