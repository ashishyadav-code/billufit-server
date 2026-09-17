const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI || 'mongodb+srv://ashishyadav14065_db_user:vyONlYEINPa4T1Qt@cluster0.r51zmz3.mongodb.net/class10_roadmap?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db('billufit_db');
  const memoriesCol = db.collection('memories');

  const soniyaMemories = [
    {
      category: 'clinical_duty',
      fact: 'Soniya is a nursing student who does clinical postings, Operation Theater (OT) shifts, and labor room duties.',
      keywords: ['clinical', 'duty', 'ot', 'operation theater', 'posting', 'hospital', 'patient', 'ward', 'nursing', 'labor room'],
      importance: 5
    },
    {
      category: 'clinical_duty',
      fact: 'Soniya assists in normal vaginal deliveries and procedures during her hospital postings.',
      keywords: ['vaginal delivery', 'delivery', 'labor room', 'procedure', 'patient', 'hospital', 'posting'],
      importance: 4
    },
    {
      category: 'clinical_duty',
      fact: 'In Community Health Nursing, Soniya goes door-to-door in villages collecting health data, assessing sickness, and giving health education.',
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
  console.log('Purging old memories and inserting deep categorized memories...');
  await memoriesCol.deleteMany({ username: { $in: usernames } });

  const toInsert = [];
  for (const u of usernames) {
    for (const m of soniyaMemories) {
      toInsert.push({
        ...m,
        username: u,
        createdAt: new Date()
      });
    }
  }

  const res = await memoriesCol.insertMany(toInsert);
  console.log(`✅ Success! Inserted ${toInsert.length} atomic memory records into MongoDB Atlas!`);
  
  const total = await memoriesCol.countDocuments({});
  console.log(`📊 Total documents now in billufit_db.memories: ${total}`);
  await client.close();
}

run().catch(console.error);
