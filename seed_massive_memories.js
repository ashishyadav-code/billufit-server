const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb+srv://ashishyadav14065_db_user:vyONlYEINPa4T1Qt@cluster0.r51zmz3.mongodb.net/class10_roadmap?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

const massiveMemories = [
  // =========================================================================
  // 1. STUDIES, NURSING, EXAMS & ACADEMIC INCIDENTS
  // =========================================================================
  {
    category: 'clinical_duty',
    fact: "Soniya is a dedicated nursing student doing clinical postings, Operation Theater (OT) shifts, and labor room postings.",
    keywords: ["clinical", "duty", "ot", "operation theater", "posting", "hospital", "patient", "ward", "nursing"],
    importance: 5,
    date: "21/11/2025"
  },
  {
    category: 'clinical_duty',
    fact: "Soniya assists doctors in normal vaginal deliveries, infant handling, and minor surgical procedures during postings.",
    keywords: ["vaginal delivery", "delivery", "labor room", "procedure", "patient", "hospital", "baby", "infant"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'clinical_duty',
    fact: "In Community Health Nursing, Soniya visits rural villages door-to-door, collecting family health data, diagnosing ailments, and giving health education.",
    keywords: ["community health", "gaon", "village", "survey", "health education", "data collect", "assessment", "nursing subject"],
    importance: 5,
    date: "22/11/2025"
  },
  {
    category: 'clinical_duty',
    fact: "Soniya often complains about the endless documentation and paperwork required for community health postings ('kitna data collect karein roj roj').",
    keywords: ["paperwork", "data collect", "documentary", "diary", "assessment", "tired", "community"],
    importance: 4,
    date: "22/11/2025"
  },
  {
    category: 'studies',
    fact: "Soniya's academic calendar has semesters starting around July/September, with practicals, viva, and assignments throughout.",
    keywords: ["sem", "semester", "practical", "viva", "assignment", "exam", "dates", "new sem", "syllabus"],
    importance: 4,
    date: "21/11/2025"
  },
  {
    category: 'daily_routine',
    fact: "Soniya's grueling weekday routine: Early morning duty, returns dead tired around 5:00 PM, crashes for a nap till 7:00 PM, then cooks, studies, and sleeps.",
    keywords: ["routine", "5 bje", "7 bje", "exhausted", "shm", "nap", "cook", "padhai", "schedule"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'daily_routine',
    fact: "Sundays are Soniya's holy recovery days: She refuses to wake up early and sleeps in till 10:00 AM ('Kl Sunday h main to 10 bje uthungi').",
    keywords: ["sunday", "10 bje", "late uthna", "holiday", "sleep in", "recovery", "chhutti"],
    importance: 4,
    date: "12/04/2026"
  },

  // =========================================================================
  // 2. HEALTH, PAIN, DIGESTION & MEDICAL KNOWLEDGE
  // =========================================================================
  {
    category: 'health_fatigue',
    fact: "Standing continuously for hours in OT postings gives Soniya extreme physical fatigue and severe headaches.",
    keywords: ["ot", "sar dard", "headache", "pain", "thak", "khade rehna", "feet pain", "fatigue", "chakkar"],
    importance: 5,
    date: "21/11/2025"
  },
  {
    category: 'health_fatigue',
    fact: "Soniya is strictly lactose intolerant: Consuming milk or heavy dairy upsets her stomach and causes acute abdominal pain.",
    keywords: ["lactose", "intolerance", "doodh", "milk", "dairy", "stomach pain", "pet dard", "bloating", "digestion"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'health_fatigue',
    fact: "Soniya has a chronic weak appetite and poor digestive power ('Appetite to durr khana digest hi nhi hota sir jii').",
    keywords: ["appetite", "bhookh", "digest", "digestion", "pachna", "kamzor", "stomach", "heavy food"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'health_fatigue',
    fact: "Aryan's go-to fever and cold remedy for Soniya is Sumocold tablet ('Sumocold khila de na').",
    keywords: ["sumocold", "cold", "fever", "bukhar", "medicine", "dawa", "remedy", "tablet"],
    importance: 4,
    date: "21/11/2025"
  },
  {
    category: 'health_fatigue',
    fact: "Aryan and Soniya had an in-depth biological discussion on LFT (Liver Function Test) and how the liver regenerates up to 35-40% even if damaged.",
    keywords: ["lft", "liver", "regenerate", "biology", "tudka", "udiliv", "organ", "medical discussion"],
    importance: 4,
    date: "07/03/2026"
  },
  {
    category: 'personal_life',
    fact: "Soniya's pet dog Tiger suffered a liver infection; Soniya took him to the vet and nursed him with prescribed meds and dahi papdi.",
    keywords: ["tiger", "dog", "pet", "liver infection", "vet", "dahi papdi", "dawa", "recovery"],
    importance: 4,
    date: "12/04/2026"
  },

  // =========================================================================
  // 3. FOOD HABITS, DIET & PREFERENCES
  // =========================================================================
  {
    category: 'food_habits',
    fact: "Soniya eats very tiny portions (usually just 1-2 rotis) and frequently skips or delays eating when tired.",
    keywords: ["1 roti", "2 roti", "kam khati", "skip meal", "dinner", "lunch", "khana", "diet"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'food_habits',
    fact: "Soniya despises cooking dinner for herself after returning exhausted from hospital ('are baccha khana khud bnana pdhta hh').",
    keywords: ["khana bnana", "cooking", "tired", "alone", "hostel", "room", "reluctant cook"],
    importance: 4,
    date: "12/04/2026"
  },
  {
    category: 'food_preference',
    fact: "Soniya loves cold coffee and chocolate flavor whey protein shake; Aryan recommended TheProtein4Me isolate.",
    keywords: ["cold coffee", "chocolate", "protein", "theprotein4me", "isolate", "shake", "drink"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'food_preference',
    fact: "Soniya celebrated a momos party with her nursing posting group; she loves momos and dahi papdi.",
    keywords: ["momos", "momos party", "dahi papdi", "street food", "treat", "posting friends"],
    importance: 4,
    date: "22/11/2025"
  },
  {
    category: 'food_preference',
    fact: "Soniya strongly dislikes bitter gourd (karela) and avoids heavily spiced greasy curries.",
    keywords: ["karela", "bitter", "dislike", "oily", "spicy", "avoid food"],
    importance: 4,
    date: "12/04/2026"
  },
  {
    category: 'food_preference',
    fact: "Soniya introduced Aryan to starfruit for the first time, teasing him that it's cheap ('40 ka adha kilo aata h').",
    keywords: ["starfruit", "fruit", "40 ka adha kilo", "first time", "taste", "sasta"],
    importance: 4,
    date: "12/04/2026"
  },

  // =========================================================================
  // 4. ARYAN'S OWN LIFE, PASSIONS, KNOWLEDGE & BELIEFS
  // =========================================================================
  {
    category: 'aryan_profile',
    fact: "Aryan has extensive, scientifically sound knowledge about fitness, nutrition, supplements (whey, creatine, tudka, udiliv) and pharmacology.",
    keywords: ["aryan gym", "supplements", "whey", "creatine", "tudka", "udiliv", "pharmacology", "nutrition", "advice"],
    importance: 5,
    date: "06/03/2026"
  },
  {
    category: 'aryan_profile',
    fact: "Aryan is spiritual and devoted to Radha-Krishna; he signs off with 'Radhe Radhe... Radhavallabh Shriharivansh'.",
    keywords: ["radhe radhe", "shriharivansh", "radhavallabh", "devotion", "krishna", "spiritual", "bhakti"],
    importance: 5,
    date: "23/11/2025"
  },
  {
    category: 'aryan_profile',
    fact: "Aryan regularly listens to Osho for peace and clarity, and quotes Osho's teachings during arguments ('Osho sunta hu khush hi rhunga').",
    keywords: ["osho", "philosophy", "pravachan", "peace", "clarity", "quotes", "meditation"],
    importance: 5,
    date: "22/11/2025"
  },
  {
    category: 'aryan_profile',
    fact: "Aryan has an elder brother and a young niece ('bhanji') whom he loves spending time and playing with.",
    keywords: ["bhanji", "niece", "bhai", "family", "elder brother", "home"],
    importance: 4,
    date: "21/11/2025"
  },
  {
    category: 'aryan_profile',
    fact: "Aryan is skilled at video editing and aesthetic reel making with background shayari and songs.",
    keywords: ["video edit", "lyrics", "reel", "shayari", "music", "watermark", "video making"],
    importance: 4,
    date: "23/11/2025"
  },
  {
    category: 'aryan_profile',
    fact: "Aryan and Soniya discussed Vrindavan Parikrama: Aryan prefers going by vehicle rather than exhausting walking in scorching sun.",
    keywords: ["vrindavan", "parikrama", "gadi", "mandir", "darshan", "mathura", "trip"],
    importance: 4,
    date: "12/04/2026"
  },

  // =========================================================================
  // 5. MUTUAL PEOPLE, FRIENDS & RELATIONSHIPS
  // =========================================================================
  {
    category: 'people_friends_family',
    fact: "Krishna ji is a very close mutual friend of both Aryan and Soniya ('Baat hui parso krishna se... Aa rha kl milne').",
    keywords: ["krishna", "krishna ji", "dost", "friend", "mutual", "meeting", "parso"],
    importance: 5,
    date: "21/11/2025"
  },
  {
    category: 'people_friends_family',
    fact: "'Singer Anjali Mishra' is a recurring teasing point in Aryan and Soniya's banter ('SORRY SINGER ANJALI MISHRA').",
    keywords: ["anjali", "anjali mishra", "singer", "teasing", "music", "banter"],
    importance: 4,
    date: "21/11/2025"
  },
  {
    category: 'people_friends_family',
    fact: "Aryan always cares to ask Soniya about her parents ('Or mummy papa sb badhiya hai Ghar pr hui baat').",
    keywords: ["mummy", "papa", "parents", "ghar", "family check"],
    importance: 4,
    date: "21/11/2025"
  },
  {
    category: 'people_friends_family',
    fact: "Soniya once asked Aryan: 'Tumne apne dosto ko mere bare me kya intro de rkha hh?' Aryan simply replied: 'Dost hai'.",
    keywords: ["intro", "dosto ko intro", "dost hai", "best friend", "special"],
    importance: 5,
    date: "12/04/2026"
  },

  // =========================================================================
  // 6. FAMOUS INSIDE JOKES, ROASTS & QUIRKS
  // =========================================================================
  {
    category: 'inside_jokes_roasts',
    fact: "The Besan vs Regmaal Roast: Soniya mentioned using besan on her face; Aryan replied: 'Tu regmaal use krr face pe sbse best... 🤣' (sandpaper).",
    keywords: ["besan", "regmaal", "facepack", "sandpaper", "chehra", "roast", "legendary joke"],
    importance: 5,
    date: "22/11/2025"
  },
  {
    category: 'inside_jokes_roasts',
    fact: "The Height Roast: Aryan constantly teases Soniya's petite height; Soniya retorts: 'Jinki height bdi hoti h unka deemag ghutno me hota hh'.",
    keywords: ["height", "lambai", "chhoti", "deemag ghutno", "knees", "head height", "tease"],
    importance: 5,
    date: "21/11/2025"
  },
  {
    category: 'inside_jokes_roasts',
    fact: "Nicknames Soniya calls Aryan: 'Bee', 'Abee', 'Pgl', 'Pgle', 'Chutiya', 'Dramebaaz', 'Yadav ji', 'Doctor sahab'.",
    keywords: ["bee", "abee", "pgl", "pgle", "chutiya", "yadav ji", "doctor sahab", "nicknames"],
    importance: 4,
    date: "21/11/2025"
  },
  {
    category: 'inside_jokes_roasts',
    fact: "Nicknames Aryan calls Soniya: 'Pagal si', 'Heroine', 'Dramebaaz', 'Soja bete', 'Chutiyapa'.",
    keywords: ["pagal si", "heroine", "dramebaaz", "soja bete", "aryan nicknames"],
    importance: 4,
    date: "12/04/2026"
  },

  // =========================================================================
  // 7. RELATIONSHIP DYNAMICS, HABITS & EMOTIONAL PATTERNS
  // =========================================================================
  {
    category: 'relationship_dynamic',
    fact: "The Telegram Blocking Game: Soniya frequently unblocks Aryan in the morning and re-blocks him in the evening on Telegram.",
    keywords: ["telegram", "tele", "block", "unblock", "subah sham", "routine drama"],
    importance: 5,
    date: "21/11/2025"
  },
  {
    category: 'relationship_dynamic',
    fact: "The Deleted Messages Teasing: Soniya frequently un-sends messages before Aryan sees them; Aryan always complains: 'KYA delete kr deti ho baar baar'.",
    keywords: ["delete", "unsend", "message deleted", "baar baar", "what was it"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'relationship_dynamic',
    fact: "Aryan's comforting & protective signature phrases: 'Aise nhi bolte', 'Gandi baat hoti hai', 'Soja bete', 'Aaram kro', 'Khayal rakho', 'Tension not'.",
    keywords: ["aise nhi bolte", "gandi baat", "soja bete", "khayal rakho", "tension not", "aaram kro"],
    importance: 5,
    date: "22/11/2025"
  },
  {
    category: 'relationship_dynamic',
    fact: "Aryan knows when Soniya is angry or threatens 'byy/bye/block', she just wants attention and reassurance; he laughs playfully: 'Pgl h kyaa... Gussa h to bat krr na mere se 🤣'.",
    keywords: ["gussa", "bye", "byy", "naraz", "mat bol", "katti", "playful banter", "anger"],
    importance: 5,
    date: "12/04/2026"
  },

  // =========================================================================
  // 8. APRIL, JULY, AUGUST, SEPTEMBER 2026 HIGH-VOLUME EPISODES
  // =========================================================================
  {
    category: 'marathon_chat',
    fact: "12 April 2026 Marathon: Aryan and Soniya chatted over 2,400 messages about hotel food, starfruit, veterinary visit for Tiger, and late-night philosophy.",
    keywords: ["12 april", "hotel khana", "starfruit", "tiger vet", "marathon chat"],
    importance: 5,
    date: "12/04/2026"
  },
  {
    category: 'marathon_chat',
    fact: "July 2026 Marathon (22-28 July): Soniya had intense hospital postings and practical preps; they chatted every night over 1,000 messages exchanging daily gossip.",
    keywords: ["july chat", "postings", "practical preps", "night gossip", "22 july", "23 july"],
    importance: 5,
    date: "23/07/2026"
  },
  {
    category: 'marathon_chat',
    fact: "August 2026 Marathon (15 active days, 7k+ msgs): Deep bonding over late night calls, sharing reels, venting about duty exhaustion, and playful teasing.",
    keywords: ["august chat", "venting", "duty exhaustion", "reels", "late night calls", "bonding"],
    importance: 5,
    date: "23/08/2026"
  },
  {
    category: 'marathon_chat',
    fact: "September 2026 (14 active days): Soniya's final posting shifts; discussions on future plans, exams, food intake, and lifelong best friendship.",
    keywords: ["september chat", "future plans", "final shifts", "exams", "friendship"],
    importance: 5,
    date: "04/09/2026"
  }
];

async function seed() {
  console.log('⚡ Connecting to MongoDB Atlas...');
  await client.connect();
  const db = client.db('billufit_db');
  const memoriesCol = db.collection('memories');

  const usernames = ['soniya', 'soniya123', '@soniya123'];
  console.log(`Purging old memories for ${usernames.join(', ')}...`);
  await memoriesCol.deleteMany({ username: { $in: usernames } });

  const toInsert = [];
  for (const u of usernames) {
    for (const m of massiveMemories) {
      toInsert.push({
        ...m,
        username: u,
        createdAt: new Date()
      });
    }
  }

  const res = await memoriesCol.insertMany(toInsert);
  console.log(`✅ Success! Seeded ${massiveMemories.length} high-density memory cards (${toInsert.length} total across variations) into MongoDB Atlas!`);

  const total = await memoriesCol.countDocuments({});
  console.log(`📊 Total documents now in billufit_db.memories: ${total}`);
  await client.close();
}

seed().catch(console.error);
