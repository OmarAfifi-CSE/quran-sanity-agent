import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qkca243t';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN;

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-01-01',
  useCdn: false,
});

async function enrich() {
  console.log('Enriching Sanity Knowledge Lake with comprehensive Classical Exegetes and Epistemological Claims...\n');

  // 1. Classical Exegetical Sources
  const newSources = [
    {
      _id: 'source-al-razi',
      _type: 'tafsirSource',
      bookTitleEnglish: 'Mafatih al-Ghayb (Al-Tafsir al-Kabir)',
      author: 'Fakhr al-Din al-Razi (فخر الدين الرازي)',
      bookTitleArabic: 'مفاتيح الغيب (التفسير الكبير)',
      methodology: 'rational',
      deathYearAH: 606,
    },
    {
      _id: 'source-al-zamakhshari',
      _type: 'tafsirSource',
      bookTitleEnglish: 'Al-Kashshaf',
      author: 'Al-Zamakhshari (الزمخشري)',
      bookTitleArabic: 'الكشاف عن حقائق غوامض التنزيل',
      methodology: 'linguistic',
      deathYearAH: 538,
    },
    {
      _id: 'source-al-muyassar',
      _type: 'tafsirSource',
      bookTitleEnglish: 'Al-Tafsir al-Muyassar',
      author: 'Scholarly Committee (نخبة من العلماء - مجمع الملك فهد)',
      bookTitleArabic: 'التفسير الميسر',
      methodology: 'athari',
      deathYearAH: 1419,
    },
  ];

  for (const src of newSources) {
    await client.createOrReplace(src as any);
    console.log(`[OK] Created/Updated Source: ${src.author}`);
  }

  // 2. High-Impact Epistemological Claims
  const claims = [
    // Al-Fatiha Basmalah - Al-Razi's Rational & Shafi'i Argument (Contradictory to Ibn Kathir)
    {
      _id: 'claim-fatiha-basmalah-razi-integral',
      _type: 'interpretiveClaim',
      ayah: { _type: 'reference', _ref: 'ayah-1-1' },
      source: { _type: 'reference', _ref: 'source-al-razi' },
      targetSegmentArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      targetSegmentEnglish: 'Basmalah as Integral Verse 1 of Al-Fatiha',
      opinionEnglish: 'Al-Razi forcefully establishes that the Basmalah is an indivisible, numbered first verse of Surah Al-Fatiha based on unanimous written recording in the Uthmani codex and the Hadith of Abu Hurayrah asserting Al-Fatiha comprises seven verses with the Basmalah as the first.',
      opinionArabic: 'ذهب الرازي مستدلاً بمذهب الشافعي إلى أن البسملة آية كاملة من أول الفاتحة ومعدودة منها، واحتج بحديث أبي هريرة: (إذا قرأتم الحمد لله فاقرءوا بسم الله الرحمن الرحيم إنها أم القرآن وهي السبع المثاني وبسم الله الرحمن الرحيم إحداها)، وبإثبات الصحابة لها خطاً في المصحف الإمام.',
      divergenceType: 'contradictory',
      evidenceEnglish: 'Textual preservation in the Uthmani Mus-haf; Marfu hadith of Abu Hurayrah in Sunan ad-Daraqutni; theological imperative of divine attribution before praise.',
    },
    // Al-Fatiha Basmalah - Al-Zamakhshari's Grammatical/Linguistic Synthesis (Complementary)
    {
      _id: 'claim-fatiha-basmalah-zamakhshari-syntax',
      _type: 'interpretiveClaim',
      ayah: { _type: 'reference', _ref: 'ayah-1-1' },
      source: { _type: 'reference', _ref: 'source-al-zamakhshari' },
      targetSegmentArabic: 'بِسْمِ اللَّهِ',
      targetSegmentEnglish: 'Syntactic Ellipsis and Prepositional Attachment in Basmalah',
      opinionEnglish: 'Al-Zamakhshari proves through rigorous Arabic syntax that the prepositional phrase "Bi-ismi" contains an implied deleted verb tailored to the speaker’s action (e.g. "I recite / I initiate"), prioritizing Allah’s name for divine exclusivity and blessing (Hashr & Tabarruk).',
      opinionArabic: 'بين الزمخشري أن متعلق الباء في (بسم الله) محذوف تقديره بحسب ما جعلت التسمية مبدأ له، أي: بسم الله أقرأ أو أتلو، وقُدّم اسم الله تعالى اهتماماً به وتبركاً وتخصيصاً.',
      divergenceType: 'complementary',
      evidenceEnglish: 'Nahwi rhetorical convention of taqdim and ta\'khir; morphological parsing of the preposition Ba of istia\'nah.',
    },
    // Ayat al-Kursi (2:255) - The Meaning of Kursi (Complementary: Throne / Footstool vs Knowledge)
    {
      _id: 'claim-kursi-knowledge-zamakhshari',
      _type: 'interpretiveClaim',
      ayah: { _type: 'reference', _ref: 'ayah-2-255' },
      source: { _type: 'reference', _ref: 'source-al-zamakhshari' },
      targetSegmentArabic: 'وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ',
      targetSegmentEnglish: 'Kursi as Divine Dominion & Knowledge (Rhetorical Metaphor)',
      opinionEnglish: 'Al-Zamakhshari and classical linguistic authorities argue that "Kursi" in this verse serves as a supreme linguistic metaphor for Allah’s infinite dominion, grandeur, and all-encompassing knowledge, transcending physical containment.',
      opinionArabic: 'يرى الزمخشري أن الكرسي تمثيل لعظمة سلطانه وملكه وإحاطة علمه تعالى بالسموات والأرض، وليس جسماً محدداً، كما يقال: استقر كرسي الملك.',
      divergenceType: 'complementary',
      evidenceEnglish: 'Ibn Abbas narration reported by Ibn Jarir: "His Kursi is His knowledge"; Arabic literary usage of throne to symbolize authority and sovereign governance.',
    },
    // Ayat al-Kursi (2:255) - Kursi as an Independent Cosmic Creation (Athari Complementary)
    {
      _id: 'claim-kursi-cosmic-ibnkathir',
      _type: 'interpretiveClaim',
      ayah: { _type: 'reference', _ref: 'ayah-2-255' },
      source: { _type: 'reference', _ref: 'source-al-tabari' },
      targetSegmentArabic: 'وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ',
      targetSegmentEnglish: 'Kursi as an Independent Colossal Creation Below the Throne',
      opinionEnglish: 'Ibn Kathir and Al-Tabari document the traditional Hadith narrative establishing that the Kursi is an authentic colossal creation placed before the Divine Throne (Arsh), compared to which the heavens and earth are like a ring cast into an expansive desert.',
      opinionArabic: 'قرر ابن كثير والطبري أن الكرسي مخلوق عظيم بين يدي العرش كالمرقاة إليه، وأن السموات السبع والأرضين السبع في الكرسي كحلقة ملقاة في فلاة من الأرض، كما صح في حديث أبي ذر.',
      divergenceType: 'complementary',
      evidenceEnglish: 'Hadith of Abu Dharr al-Ghifari; transmission chain through Ibn Abbas in Kitab al-Arsh by Ibn Abi Shaybah.',
    },
    // Al-Asr (103:1) - The Meaning of Al-Asr (Era of Revelation vs Time vs Late Afternoon Prayer)
    {
      _id: 'claim-asr-prayer-qurtubi',
      _type: 'interpretiveClaim',
      ayah: { _type: 'reference', _ref: 'ayah-103-1' },
      source: { _type: 'reference', _ref: 'source-al-qurtubi' },
      targetSegmentArabic: 'وَالْعَصْرِ',
      targetSegmentEnglish: 'Al-Asr as the Middle Prayer (Salat al-Asr)',
      opinionEnglish: 'Al-Qurtubi documents that multiple early authorities (including Muqatil and Qatadah) interpreted "Al-Asr" specifically as the Asr prayer (the Middle Prayer / As-Salat al-Wusta), sworn upon by Allah due to its singular excellence among liturgical obligations.',
      opinionArabic: 'نقل القرطبي عن مقاتل وقتادة أن المراد بالعصر صلاة العصر، أقسم الله تعالى بها لشرفها وفضلها ولكونها الصلاة الوسطى المخصوصة بمزيد التأكيد في التنزيل.',
      divergenceType: 'complementary',
      evidenceEnglish: 'Prophetic tradition: "Whoever misses the Asr prayer, it is as though he lost his family and wealth"; Quran 2:238 injunction.',
    },
    // Al-Kawthar (108:1) - River in Paradise vs Abundant Beneficence (Complementary)
    {
      _id: 'claim-kawthar-river-tabari',
      _type: 'interpretiveClaim',
      ayah: { _type: 'reference', _ref: 'ayah-108-1' },
      source: { _type: 'reference', _ref: 'source-al-tabari' },
      targetSegmentArabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
      targetSegmentEnglish: 'Al-Kawthar as the Celestial River in Jannah',
      opinionEnglish: 'Al-Tabari presents authentic marfu narrations establishing that Al-Kawthar is a specific river bestowed upon the Prophet ﷺ in Paradise, whose banks are pearls and soil is musk.',
      opinionArabic: 'روى الطبري بالأسانيد الثابتة عن أنس وعائشة أن الكوثر نهر في الجنة أعطاه الله لنبيه صلى الله عليه وسلم، حافتاه قباب الدر المجوف وطينه المسك الأذفر.',
      divergenceType: 'consensus',
      evidenceEnglish: 'Sahih al-Bukhari narrations from Anas ibn Malik; Sahih Muslim tradition defining the Basin (Al-Hawd).',
    },
    // Al-Ikhlas (112:2) - As-Samad: Unanimous Theological Consensus
    {
      _id: 'claim-ikhlas-samad-consensus',
      _type: 'interpretiveClaim',
      ayah: { _type: 'reference', _ref: 'ayah-112-2' },
      source: { _type: 'reference', _ref: 'source-al-tabari' },
      targetSegmentArabic: 'اللَّهُ الصَّمَدُ',
      targetSegmentEnglish: 'As-Samad: Ultimate Self-Sufficiency & Universal Refuge',
      opinionEnglish: 'Unanimous classical exegesis establishes As-Samad as the Lord whose mastery is absolute, who has no needs while all creation perpetually depends upon Him for existence and preservation.',
      opinionArabic: 'أجمع أهل التأويل على أن الصمد هو السيد الذي انتهى سؤدده، الذي يصمد إليه الخلائق في حوائجهم ومسائلهم، وهو الغني المطلق عن الشركاء والأنداد.',
      divergenceType: 'consensus',
      evidenceEnglish: 'Universal consensus reported by Ibn Abbas, Mujahid, and Al-Hasan al-Basri in Jami al-Bayan.',
    },
  ];

  for (const claim of claims) {
    await client.createOrReplace(claim as any);
    console.log(`[OK] Created/Updated Epistemological Claim: ${claim._id}`);
  }

  console.log(`\n🎉 Successfully enriched Sanity Knowledge Lake with all classical sources and claims!`);
}

enrich().catch(console.error);
