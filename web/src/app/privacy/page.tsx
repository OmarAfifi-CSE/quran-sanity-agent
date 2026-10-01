import Link from 'next/link';
export const metadata={title:'Privacy · Quran Sanity Agent'};
export default function Privacy(){return <main className="policy-page">
 <Link href="/">← Research workspace · العودة للبحث</Link>
 <h1>Privacy · الخصوصية</h1><p>Updated 26 September 2026</p>
 <h2>Your questions</h2><p>Questions are sent to the application server. When AI retrieval or reading notes are enabled, the question and selected source material are processed by Google Gemini and Sanity Context. Avoid including private or identifying information.</p>
 <h2>Conversation history</h2><p>The workspace keeps its displayed conversation in the current browser session memory. It does not create a user account or save conversation history to Sanity. Refreshing or starting a new research session clears the displayed conversation. This does not control retention by hosting or AI service providers.</p>
 <h2>Service operation</h2><p>The application uses temporary request counters. If the hosting proxy is explicitly trusted, a hashed client address identifies those counters. Hosting providers may maintain access and security logs according to their own policies. No advertising or analytics tracker has been added to this application.</p>
 <h2>External services</h2><p>Source links open their original providers. Those providers apply their own privacy policies. This page describes the application implementation; it does not promise that third-party infrastructure retains no data.</p>
 <section dir="rtl" lang="ar"><h2>ملخص بالعربية</h2><p>يُرسل السؤال إلى خادم التطبيق، وقد يُعالج مع النصوص المختارة بواسطة Gemini وSanity Context. لا ترسل معلومات شخصية. المحادثة المعروضة محفوظة في ذاكرة جلسة المتصفح، ولا تُحفظ كسجل مستخدم داخل Sanity. قد تحتفظ الاستضافة ومقدمو الذكاء الاصطناعي بسجلات وفق سياساتهم. يستخدم التطبيق عدادات طلبات مؤقتة، ولا يضيف متتبعات إعلانية أو تحليلات.</p></section>
 <h2>Contact</h2><p>For privacy requests or content corrections, contact <a href="mailto:sanity@omar-afifi.com">sanity@omar-afifi.com</a>. The project owner manages this contact channel.</p>
 <Link href="/terms">Reading terms and source credits</Link>
 </main>}
