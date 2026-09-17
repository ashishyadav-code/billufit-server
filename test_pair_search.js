const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI || 'mongodb+srv://ashishyadav14065_db_user:vyONlYEINPa4T1Qt@cluster0.r51zmz3.mongodb.net/class10_roadmap?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function test() {
  await client.connect();
  const db = client.db('billufit_db');
  const pairsCol = db.collection('whatsapp_pairs');

  const queries = ['besan', 'OT duty', 'krishna', 'starfruit'];

  for (const q of queries) {
    console.log('\n======================================');
    console.log('Query:', q);
    const matches = await pairsCol.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(2).toArray();
    for (const m of matches) {
      console.log('  Date:', m.date);
      console.log('  Soniya:', m.soniyaText);
      console.log('  Aryan :', m.aryanReply);
      console.log('  ---');
    }
  }
  await client.close();
}
test();
