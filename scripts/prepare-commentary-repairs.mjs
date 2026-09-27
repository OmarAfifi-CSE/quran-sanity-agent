import fs from "node:fs/promises";
const common = {
  reviewStatus: "source_checked",
  reviewedBy:
    "Codex — automated comparison with linked primary text; not a specialist scholarly review",
  reviewedAt: new Date().toISOString(),
  reviewNotes:
    "Limited paraphrase checked against the linked Arabic passage. Does not establish consensus, authenticate hadith chains, or replace specialist review.",
};
const updates = [
  {
    id: "claim-asr-dahr-al-tabari",
    set: {
      ...common,
      sourceUrl: "https://quran.ksu.edu.sa/tafseer/tabary/sura103-aya1.html",
      sourceLocator:
        "Jami al-Bayan, commentary on 103:1, concluding paragraph beginning والصواب من القول",
      primaryExcerpt: "ولم يخصص مما شمله هذا الاسم معنى دون معنى",
      targetSegmentEnglish: "Meaning of Al-Asr in 103:1",
      comparisonKey: "asr-meaning",
      opinionEnglish:
        "Al-Tabari reads al-asr broadly as time, including evening, night and day. He does not restrict the oath to one meaning covered by the word.",
      opinionArabic:
        "يرجّح الطبري شمول العصر للدهر والعشي والليل والنهار، فلا يخصّ القسم بمعنى واحد مما يشمله الاسم.",
      evidenceEnglish:
        "The concluding paragraph explicitly declines to restrict the word to one of its included senses.",
      divergenceType: "complementary",
    },
  },
  {
    id: "claim-asr-prayer-ibn-kathir",
    set: {
      ...common,
      sourceUrl: "https://quran.ksu.edu.sa/tafseer/katheer/sura103-aya1.html",
      sourceLocator:
        "Tafsir al-Quran al-Azim, commentary on 103:1, final two paragraphs",
      primaryExcerpt:
        "العصر : الزمان الذي يقع فيه حركات بني آدم ، من خير وشر .",
      targetSegmentEnglish: "Meaning of Al-Asr in 103:1",
      comparisonKey: "asr-meaning",
      opinionEnglish:
        "Ibn Kathir explains al-asr as the time in which human actions occur. He also reports the meaning of late afternoon from Zayd ibn Aslam, while calling the first interpretation the well-known one.",
      opinionArabic:
        "يفسّر ابن كثير العصر بالزمان الذي تقع فيه أعمال بني آدم، وينقل عن زيد بن أسلم معنى العشي، ثم يذكر أن الأول هو المشهور.",
      evidenceEnglish:
        "The source says time, then reports al-ashi; it does not make the former dataset claim that Ibn Kathir prefers the Asr prayer here.",
      divergenceType: "complementary",
    },
  },
  {
    id: "claim-asr-prayer-qurtubi",
    set: {
      ...common,
      sourceUrl: "https://quran.ksu.edu.sa/tafseer/qortobi/sura103-aya1.html",
      sourceLocator:
        "Al-Jami li-Ahkam al-Quran, 103:1, first issue, paragraph beginning وعن قتادة أيضا",
      primaryExcerpt:
        "وقيل : هو قسم بصلاة العصر ، وهي الوسطى ; لأنها أفضل الصلوات ; قاله مقاتل .",
      targetSegmentEnglish: "Meaning of Al-Asr in 103:1",
      comparisonKey: "asr-meaning",
      opinionEnglish:
        "Al-Qurtubi records several meanings, including time, late afternoon and the Asr prayer. In this passage he attributes the prayer interpretation to Muqatil; the adjacent reports from Qatadah concern times of day.",
      opinionArabic:
        "يسرد القرطبي معاني منها الدهر والعشي وصلاة العصر. وينسب تفسيره بالصلاة هنا إلى مقاتل، بينما تتعلق الأقوال المجاورة عن قتادة بأوقات من النهار.",
      evidenceEnglish:
        "The prayer attribution explicitly names Muqatil. Reporting multiple views does not by itself prove consensus or contradiction.",
      divergenceType: "complementary",
    },
  },
  {
    id: "claim-fatiha-basmalah-ibn-kathir",
    set: {
      ...common,
      sourceUrl: "https://quran.ksu.edu.sa/tafseer/katheer/sura1-aya1.html",
      sourceLocator:
        "Tafsir al-Quran al-Azim, introduction to Al-Fatiha, paragraph beginning وحكى أبو الليث",
      primaryExcerpt: "وإنما اختلفوا في البسملة : هل هي آية مستقلة من أولها",
      targetSegmentEnglish: "Counting the Basmalah in Al-Fatiha",
      comparisonKey: "basmalah-numbering",
      opinionEnglish:
        "Ibn Kathir records three positions on counting the Basmalah in Al-Fatiha: a separate opening verse, part of a verse, or not counted at its opening. He associates the first with most Kufan reciters and the last with Medinan reciters and jurists.",
      opinionArabic:
        "يعرض ابن كثير ثلاثة أقوال في عدّ البسملة من الفاتحة: آية مستقلة في أولها، أو بعض آية، أو عدم عدّها من أولها. وينسب الأول إلى جمهور قرّاء الكوفة والأخير إلى أهل المدينة من القرّاء والفقهاء.",
      evidenceEnglish:
        "This passage reports the disagreement. It is not sufficient to treat every reported position as Ibn Kathir’s personal ruling.",
      divergenceType: "contradictory",
    },
  },
  {
    id: "claim-fatiha-basmalah-al-qurtubi",
    set: {
      ...common,
      sourceUrl: "https://quran.ksu.edu.sa/tafseer/qortobi/sura1-aya1.html",
      sourceLocator:
        "Al-Jami li-Ahkam al-Quran, Basmalah discussion, fourth and fifth issues",
      primaryExcerpt: "الخامسة : الصحيح من هذه الأقوال قول مالك",
      targetSegmentEnglish: "Counting the Basmalah in Al-Fatiha",
      comparisonKey: "basmalah-numbering",
      opinionEnglish:
        "Al-Qurtubi reports the disagreement and prefers Malik’s position that the opening Basmalah is not counted as a verse of Al-Fatiha. He distinguishes this from its occurrence within Surah An-Naml and also records al-Shafii’s position.",
      opinionArabic:
        "يعرض القرطبي الخلاف ويرجّح قول مالك في عدم عدّ بسملة الافتتاح آية من الفاتحة، مع تمييز ذلك عن ورودها في سورة النمل، ويذكر كذلك قول الشافعي.",
      evidenceEnglish:
        "Read the fourth and fifth issues together: the text distinguishes the recorded opinions and al-Qurtubi’s own stated preference.",
      divergenceType: "contradictory",
    },
  },
];
for (const update of updates) {
  const response = await fetch(update.set.sourceUrl, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Source unavailable");
  const html = await response.text();
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
  if (!plain.includes(update.set.primaryExcerpt))
    throw new Error("Excerpt not found: " + update.id);
}
await fs.writeFile(
  "docs/audit/commentary-repair-plan.json",
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      reviewLevel: "automated source comparison, not specialist review",
      updates,
    },
    null,
    2,
  ),
);
console.log({ prepared: updates.length, exactExcerptsFound: true });
