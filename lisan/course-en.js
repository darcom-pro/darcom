/* =========================================================
   لسان — منهج الإنجليزية للناطقين بالعربية
   البنية: وحدات ← دروس ← (شرح قواعد + مفردات + جمل + فراغات)
   التمارين تُولَّد تلقائياً من هذه البيانات داخل app.js
   لإضافة لغة جديدة: أنشئ ملفاً مماثلاً وسجّله في LISAN_COURSES
   ========================================================= */
window.LISAN_COURSES = window.LISAN_COURSES || {};
window.LISAN_COURSES.en = {
  code: "en",
  name: "الإنجليزية",
  flag: "🇬🇧",
  voice: "en-US",

  /* ---------------- اختبار تحديد المستوى ---------------- */
  placement: {
    A1: [
      ["I ___ a student.", ["am", "is", "are"], "am"],
      ["She ___ two brothers.", ["has", "have", "is"], "has"],
      ["___ you like coffee?", ["Do", "Does", "Are"], "Do"],
      ["They ___ from Kuwait.", ["are", "is", "am"], "are"],
      ["He ___ in a bank.", ["works", "work", "working"], "works"],
      ["This is ___ apple.", ["an", "a", "two"], "an"]
    ],
    A2: [
      ["I ___ to Dubai last year.", ["went", "go", "have gone"], "went"],
      ["Look! It ___ .", ["is raining", "rains", "rain"], "is raining"],
      ["My car is ___ than yours.", ["bigger", "more big", "biggest"], "bigger"],
      ["There ___ two banks on this street.", ["are", "is", "have"], "are"],
      ["Did you ___ the news?", ["see", "saw", "seen"], "see"],
      ["We ___ going to travel next week.", ["are", "will", "do"], "are"]
    ],
    B1: [
      ["I have lived here ___ 2015.", ["since", "for", "from"], "since"],
      ["If it rains, we ___ at home.", ["will stay", "stayed", "would stayed"], "will stay"],
      ["She ___ already finished her work.", ["has", "have", "is"], "has"],
      ["You ___ smoke in the hospital. It's forbidden.", ["mustn't", "don't have to", "not must"], "mustn't"],
      ["Have you ___ been to Japan?", ["ever", "yet", "already"], "ever"],
      ["I saw him two days ___ .", ["ago", "before", "since"], "ago"]
    ],
    B2: [
      ["If I ___ more time, I would learn Japanese.", ["had", "have", "will have"], "had"],
      ["The bridge ___ by a Korean company in 2010.", ["was built", "built", "has built"], "was built"],
      ["She asked me where I ___ .", ["lived", "do I live", "did I live"], "lived"],
      ["I wish I ___ harder at school.", ["had studied", "studied", "have studied"], "had studied"],
      ["By the time we arrived, the meeting ___ .", ["had started", "has started", "starts"], "had started"],
      ["I'm not used to ___ up so early.", ["getting", "get", "got"], "getting"]
    ]
  },

  /* ---------------- المحادثات التفاعلية ---------------- */
  convos: [
    {
      id: "cafe", icon: "☕", lvl: "A1", ta: "في المقهى", place: "اطلب قهوتك بثقة", npcAv: "🧑‍🍳", npcName: "Barista",
      turns: [
        { npc: "Hi! What can I get for you?", ar: "أهلاً! ماذا أحضر لك؟", opts: [
          ["Can I have a coffee, please?", 1, "ممتاز! Can I have هي الطريقة المهذبة للطلب."],
          ["I am a coffee.", 0, "هذه تعني (أنا قهوة)! للطلب استخدم Can I have."],
          ["Give coffee.", 0, "المعنى مفهوم لكنها جافة وغير مهذبة. استخدم Can I have ... please."]] },
        { npc: "Sure. What size? Small, medium or large?", ar: "بالتأكيد. أي حجم؟ صغير، وسط أم كبير؟", opts: [
          ["Medium, please.", 1, ""],
          ["I am medium.", 0, "تعني (أنا متوسط)! يكفي أن تذكر الحجم: Medium, please."],
          ["Yes, size.", 0, "السؤال يطلب اختيار حجم، وليس نعم أو لا."]] },
        { npc: "Anything else?", ar: "هل تريد شيئاً آخر؟", opts: [
          ["No, thank you. How much is it?", 1, "How much للسؤال عن السعر."],
          ["No, how many is it?", 0, "How many للعدد، أما السعر فنقول How much."],
          ["Nothing else is.", 0, "ترتيب غير صحيح. قل: No, thank you."]] },
        { npc: "That's one dinar fifty.", ar: "المبلغ دينار ونصف.", opts: [
          ["Here you are.", 1, "Here you are تُقال عند تسليم شيء لشخص."],
          ["Here are you.", 0, "الترتيب الصحيح: Here you are."],
          ["You are here.", 0, "تعني (أنت هنا)، وليست عبارة تسليم المال."]] },
        { npc: "Thank you! Have a nice day.", ar: "شكراً! أتمنى لك يوماً سعيداً.", opts: [
          ["Thanks, you too!", 1, "You too = ولك أيضاً."],
          ["Me too!", 0, "Me too تعني (وأنا أيضاً). الصحيح: You too."],
          ["Same day.", 0, "عبارة غير مستخدمة. قل: You too!"]] }
      ]
    },
    {
      id: "meet", icon: "🤝", lvl: "A1", ta: "زميل جديد", place: "تعارف في العمل", npcAv: "👨‍💼", npcName: "David",
      turns: [
        { npc: "Hello! I'm David. I'm new here.", ar: "مرحباً! أنا ديفيد. أنا جديد هنا.", opts: [
          ["Hi David, I'm Ahmad. Nice to meet you.", 1, ""],
          ["Hi, my name Ahmad.", 0, "ينقص فعل be: My name is Ahmad."],
          ["Hello, I new too.", 0, "ينقص فعل be: I'm new too."]] },
        { npc: "Nice to meet you too. Where are you from?", ar: "تشرفت بمعرفتك أيضاً. من أين أنت؟", opts: [
          ["I'm from Kuwait.", 1, ""],
          ["I from Kuwait.", 0, "لا تحذف be كما نفعل في العربية: I'm from Kuwait."],
          ["I am Kuwait.", 0, "تعني (أنا الكويت)! قل: I'm from Kuwait أو I'm Kuwaiti."]] },
        { npc: "What do you do here?", ar: "ما عملك هنا؟", opts: [
          ["I'm a civil engineer.", 1, ""],
          ["I am civil engineer.", 0, "لا تنسَ a قبل المهنة: a civil engineer."],
          ["I do engineer.", 0, "للتعريف بالمهنة نستخدم I'm a ..."]] },
        { npc: "Great! How long have you worked here?", ar: "رائع! منذ متى تعمل هنا؟", opts: [
          ["For five years.", 1, "for مع المدة الزمنية."],
          ["Since five years.", 0, "since لنقطة البداية (since 2019)، أما المدة فـ for."],
          ["Five years ago.", 0, "ago تعني (قبل)، أي حدث انتهى، وليست مدة مستمرة."]] },
        { npc: "Let's have lunch together sometime.", ar: "لنتناول الغداء معاً في وقت ما.", opts: [
          ["Sure, that sounds great!", 1, "That sounds great عبارة طبيعية للموافقة."],
          ["Sure, it sounds greatly.", 0, "بعد sound نستخدم صفة: great وليس greatly."],
          ["Yes, together lunch.", 0, "ترتيب غير صحيح. قل: Sure, that sounds great!"]] }
      ]
    },
    {
      id: "airport", icon: "✈️", lvl: "A2", ta: "في المطار", place: "إجراءات السفر", npcAv: "👩‍✈️", npcName: "Agent",
      turns: [
        { npc: "Good morning. Can I see your passport, please?", ar: "صباح الخير. هل يمكنني رؤية جواز سفرك؟", opts: [
          ["Sure, here it is.", 1, ""],
          ["Here is it.", 0, "الترتيب الصحيح: Here it is."],
          ["Yes, you can see.", 0, "صحيحة لغوياً لكنها غير طبيعية. قل: Sure, here it is."]] },
        { npc: "Are you checking any bags today?", ar: "هل ستشحن حقائب اليوم؟", opts: [
          ["Yes, just one suitcase.", 1, ""],
          ["Yes, I am check one bag.", 0, "خلط بين الأزمنة. قل: Yes, just one suitcase."],
          ["Yes, one bags.", 0, "one تأتي مع المفرد: one bag."]] },
        { npc: "Would you like a window or an aisle seat?", ar: "هل تفضل مقعداً بجانب النافذة أم الممر؟", opts: [
          ["A window seat, please.", 1, ""],
          ["I like window.", 0, "ينقص a و please. قل: A window seat, please."],
          ["Window is good, no?", 0, "غير مناسبة للموقف الرسمي."]] },
        { npc: "Here's your boarding pass. Boarding starts at 9:40 at gate 12.", ar: "تفضل بطاقة الصعود. يبدأ الصعود 9:40 عند البوابة 12.", opts: [
          ["Thank you. Where is gate 12?", 1, ""],
          ["Thanks. Where gate 12?", 0, "ينقص is: Where is gate 12?"],
          ["Thank you. Gate 12 is where?", 0, "في السؤال نبدأ بأداة الاستفهام: Where is ...?"]] },
        { npc: "Go straight and turn left after the security check.", ar: "امشِ مباشرة ثم انعطف يساراً بعد التفتيش الأمني.", opts: [
          ["Got it, thanks a lot!", 1, "Got it = فهمت."],
          ["I got, thanks.", 0, "نقول Got it أو I got it."],
          ["OK, I turn left yesterday.", 0, "yesterday تعني أمس! لا تناسب الموقف."]] }
      ]
    },
    {
      id: "hotel", icon: "🏨", lvl: "A2", ta: "في الفندق", place: "تسجيل الوصول", npcAv: "🧑‍💼", npcName: "Receptionist",
      turns: [
        { npc: "Good evening. Welcome to the Gulf Hotel. Do you have a reservation?", ar: "مساء الخير. أهلاً بك في فندق الخليج. هل لديك حجز؟", opts: [
          ["Yes, I have a reservation under the name Hassan.", 1, "under the name = باسم."],
          ["Yes, I reserved yesterday a room.", 0, "الظرف لا يفصل الفعل عن مفعوله: I reserved a room yesterday."],
          ["Yes, my reservation is Hassan.", 0, "تعني (حجزي هو حسن)! قل: under the name Hassan."]] },
        { npc: "Thank you. You're staying for three nights, is that right?", ar: "شكراً. ستقيم ثلاث ليالٍ، صحيح؟", opts: [
          ["Yes, that's right.", 1, ""],
          ["Yes, it's true right.", 0, "قل ببساطة: Yes, that's right."],
          ["Yes, I stay three night.", 0, "three تحتاج جمعاً: three nights."]] },
        { npc: "Your room is 405 on the fourth floor. Breakfast is from 6 to 10.", ar: "غرفتك 405 في الطابق الرابع. الفطور من 6 إلى 10.", opts: [
          ["Great. Is there Wi-Fi in the room?", 1, "Is there للسؤال عن وجود شيء."],
          ["Great. There is Wi-Fi in room?", 0, "في السؤال نقلب: Is there ...?"],
          ["Great. Have Wi-Fi?", 0, "سؤال ناقص. قل: Is there Wi-Fi in the room?"]] },
        { npc: "Yes, the password is on your key card.", ar: "نعم، كلمة المرور على بطاقة المفتاح.", opts: [
          ["Perfect. Could you call me a taxi at eight tomorrow?", 1, "Could you للطلب بأدب."],
          ["Perfect. Could you calling a taxi?", 0, "بعد could يأتي فعل مجرد: Could you call ...?"],
          ["Perfect. You call me taxi tomorrow eight.", 0, "جملة ناقصة. قل: Could you call me a taxi at eight?"]] },
        { npc: "Of course. Enjoy your stay!", ar: "بالتأكيد. استمتع بإقامتك!", opts: [
          ["Thank you very much!", 1, ""],
          ["Thank you very many!", 0, "نقول very much."],
          ["Thanks you!", 0, "إما Thanks أو Thank you، وليس Thanks you."]] }
      ]
    },
    {
      id: "site", icon: "🏗️", lvl: "B1", ta: "اجتماع في الموقع", place: "إنجليزية هندسية", npcAv: "👷", npcName: "Site Manager",
      turns: [
        { npc: "Morning! Has the concrete for the third floor arrived yet?", ar: "صباح الخير! هل وصلت خرسانة الطابق الثالث بعد؟", opts: [
          ["Yes, it arrived an hour ago.", 1, "مع ago نستخدم الماضي البسيط."],
          ["Yes, it has arrived an hour ago.", 0, "مع ago لا نستخدم present perfect، بل الماضي البسيط: it arrived."],
          ["Yes, it arrive.", 0, "الفعل يحتاج تصريفاً: it arrived."]] },
        { npc: "Good. Did the lab test the slump?", ar: "جيد. هل اختبر المختبر الهبوط (Slump)؟", opts: [
          ["Yes, the results were within the specifications.", 1, "within the specifications = ضمن المواصفات."],
          ["Yes, results was good.", 0, "results جمع، فنستخدم were."],
          ["Yes, the lab testing.", 0, "جملة ناقصة الزمن. قل: Yes, they tested it."]] },
        { npc: "When will the pouring start?", ar: "متى يبدأ الصب؟", opts: [
          ["We'll start pouring at ten if the pump is ready.", 1, "بعد if نستخدم المضارع: if the pump is ready."],
          ["We start pour at ten if pump will ready.", 0, "بعد if لا نستخدم will، وينقص is: if the pump is ready."],
          ["Pouring is at ten will.", 0, "ترتيب غير صحيح."]] },
        { npc: "Make sure all workers wear their helmets.", ar: "تأكد أن جميع العمال يرتدون خوذاتهم.", opts: [
          ["Of course. Safety comes first.", 1, "Safety comes first = السلامة أولاً."],
          ["Of course, they must to wear.", 0, "لا يأتي to بعد must: they must wear."],
          ["Sure, they wear yesterday.", 0, "yesterday للماضي ولا تناسب هنا."]] },
        { npc: "Great. Send me the report by the end of the day.", ar: "ممتاز. أرسل لي التقرير قبل نهاية اليوم.", opts: [
          ["No problem, I'll send it before five.", 1, "will للوعد."],
          ["No problem, I'm going send it.", 0, "ينقص to: I'm going to send it."],
          ["No problem, I send it yesterday.", 0, "yesterday للماضي، والطلب للمستقبل."]] }
      ]
    }
  ],

  /* ---------------- الوحدات والدروس ---------------- */
  units: [
    /* ================= الوحدة 1 ================= */
    {
      t: "البداية: التحية وفعل be", lvl: "A1", color: "#0E9F7E",
      d: "عرّف بنفسك وكوّن أولى جملك بثقة.",
      lessons: [
        {
          t: "Greetings", ta: "التحية والتعارف", icon: "👋",
          g: [
            { t: "التحية حسب الوقت",
              b: "تتغير التحية في الإنجليزية حسب وقت اليوم، تماماً كما نقول (صباح الخير) و(مساء الخير).<br><i>Hello</i> مناسبة في كل المواقف، و<i>Hi</i> للأصدقاء والمواقف الودية.",
              ex: [["[Good morning|o]!", "صباح الخير! (حتى الظهر)"], ["[Good evening|o]!", "مساء الخير! (بعد العصر)"], ["[Hi|o], Sara!", "أهلاً يا سارة!"]],
              n: "⚠️ عبارة Good night ليست تحية لقاء، بل تُقال عند الوداع ليلاً أو قبل النوم." },
            { t: "قدّم نفسك",
              b: "للتعريف بنفسك استخدم <i>My name is</i> أو المختصر <i>I'm</i>.<br>بعد التعارف نقول <i>Nice to meet you</i>، والرد: <i>Nice to meet you too</i>.",
              ex: [["[My name|s] [is|v] [Ali|o].", "اسمي علي."], ["[I'm|s] [Huda|o].", "أنا هدى."], ["Nice to meet you [too|t].", "وأنا أيضاً تشرفت بمعرفتك."]],
              q: { s: "Nice to ___ you.", o: ["meet", "see", "know"], a: "meet", w: "العبارة الثابتة هي Nice to meet you." } }
          ],
          vocab: [["hello", "مرحباً"], ["goodbye", "مع السلامة"], ["good morning", "صباح الخير"], ["good evening", "مساء الخير"], ["thank you", "شكراً"], ["please", "من فضلك"], ["name", "اسم"], ["friend", "صديق"]],
          sentences: [["Hello, my name is Ali.", "مرحباً، اسمي علي."], ["Nice to meet you.", "تشرفت بمعرفتك."], ["Good morning, Sara.", "صباح الخير يا سارة."], ["Thank you very much.", "شكراً جزيلاً."], ["See you tomorrow.", "أراك غداً."]],
          blanks: [["Good {morning}, Mr. Ahmad.", ["morning", "night", "name"], "صباح الخير يا أستاذ أحمد.", "Good night ليست تحية لقاء."], ["My {name} is Huda.", ["name", "friend", "hello"], "اسمي هدى."], ["Nice to {meet} you.", ["meet", "see", "thank"], "تشرفت بمعرفتك."], ["Thank {you} very much!", ["you", "me", "please"], "شكراً جزيلاً!"]]
        },
        {
          t: "I am / You are", ta: "أنا وأنت: فعل be", icon: "🙋",
          g: [
            { t: "فعل الكينونة be",
              b: "في العربية نقول (أنا مهندس) بلا فعل. أما في الإنجليزية <b>فلا تكتمل الجملة دون فعل be</b>، ومعناه هنا (يكون).<table><tr><th>الفاعل</th><th>be</th></tr><tr><td><i>I</i> أنا</td><td><i>am</i></td></tr><tr><td><i>you</i> أنت / أنتم</td><td><i>are</i></td></tr><tr><td><i>we</i> نحن</td><td><i>are</i></td></tr><tr><td><i>they</i> هم</td><td><i>are</i></td></tr></table>",
              f: [["الفاعل", "s"], ["am / are", "v"], ["التكملة", "o"]],
              ex: [["[I|s] [am|v] [an engineer|o].", "أنا مهندس."], ["[You|s] [are|v] [my friend|o].", "أنت صديقي."], ["[They|s] [are|v] [ready|o].", "هم جاهزون."]],
              q: { s: "We ___ students.", o: ["are", "am", "is"], a: "are", w: "مع we نستخدم are." } },
            { t: "الاختصار في الكلام",
              b: "في الحديث اليومي ندمج الفاعل مع be بفاصلة علوية:<br><i>I am → I'm</i> · <i>you are → you're</i><br><i>we are → we're</i> · <i>they are → they're</i>",
              ex: [["[I'm|s] [tired|o] [today|t].", "أنا متعب اليوم."], ["[We're|s] [here|o].", "نحن هنا."]] },
            { t: "a أم an؟",
              b: "قبل المهنة أو الاسم المفرد نضع <i>a</i> (بمعنى: واحد). وإذا بدأت الكلمة <b>بصوت متحرك</b> (a, e, i, o, u) نستخدم <i>an</i> لتسهيل النطق.",
              ex: [["I am [a|x] [doctor|o].", "أنا طبيب."], ["I am [an|x] [engineer|o].", "أنا مهندس."]],
              q: { s: "I am ___ engineer.", o: ["an", "a"], a: "an", w: "engineer تبدأ بصوت متحرك (e)." } }
          ],
          vocab: [["engineer", "مهندس"], ["teacher", "معلم"], ["student", "طالب"], ["doctor", "طبيب"], ["happy", "سعيد"], ["tired", "متعب"], ["ready", "جاهز"], ["here", "هنا"]],
          sentences: [["I am an engineer.", "أنا مهندس."], ["You are a good student.", "أنت طالب جيد."], ["We are ready.", "نحن جاهزون."], ["They are doctors.", "هم أطباء."], ["I'm tired today.", "أنا متعب اليوم."]],
          blanks: [["I {am} a teacher.", ["am", "is", "are"], "أنا معلم.", "مع I نستخدم am دائماً."], ["You {are} my friend.", ["are", "am", "is"], "أنت صديقي.", "مع you نستخدم are."], ["We {are} here.", ["are", "is", "am"], "نحن هنا."], ["I am {an} engineer.", ["an", "a", "the"], "أنا مهندس.", "engineer تبدأ بصوت متحرك فنستخدم an."]]
        },
        {
          t: "He / She / It is", ta: "هو وهي: is", icon: "👨‍👩‍👧",
          g: [
            { t: "هو، هي، والأشياء",
              b: "للمفرد الغائب نستخدم <i>is</i> دائماً:<br>• <i>he</i> = هو (للمذكر)<br>• <i>she</i> = هي (للمؤنث)<br>• <i>it</i> = للأشياء والحيوانات<br>⚠️ في العربية نقول عن السيارة (هي)، لكن في الإنجليزية نقول <i>it</i> لأنها ليست إنساناً.",
              f: [["he / she / it", "s"], ["is", "v"], ["التكملة", "o"]],
              ex: [["[He|s] [is|v] [my brother|o].", "هو أخي."], ["[She|s] [is|v] [a doctor|o].", "هي طبيبة."], ["[The car|s] [is|v] [new|o]. [It|s] [is|v] [fast|o].", "السيارة جديدة. إنها سريعة."]],
              q: { s: "My house is big. ___ is new.", o: ["It", "He", "She"], a: "It", w: "البيت شيء، فنستخدم It." } },
            { t: "الجدول الكامل لفعل be",
              b: "<table><tr><th>الفاعل</th><th>be</th><th>المختصر</th></tr><tr><td><i>I</i></td><td><i>am</i></td><td><i>I'm</i></td></tr><tr><td><i>he / she / it</i></td><td><i>is</i></td><td><i>he's / she's / it's</i></td></tr><tr><td><i>you / we / they</i></td><td><i>are</i></td><td><i>you're / we're / they're</i></td></tr></table>",
              ex: [["[It's|s] [a big house|o].", "إنه بيت كبير."], ["[My mother|s] [is|v] [at home|o].", "أمي في البيت."]],
              q: { s: "My mother ___ a teacher.", o: ["is", "are", "am"], a: "is", w: "my mother = she، فنستخدم is." } }
          ],
          vocab: [["brother", "أخ"], ["sister", "أخت"], ["father", "أب"], ["mother", "أم"], ["car", "سيارة"], ["house", "بيت"], ["big", "كبير"], ["small", "صغير"]],
          sentences: [["He is my brother.", "هو أخي."], ["She is a doctor.", "هي طبيبة."], ["It is a big house.", "إنه بيت كبير."], ["My mother is at home.", "أمي في البيت."], ["The car is small.", "السيارة صغيرة."]],
          blanks: [["She {is} my sister.", ["is", "are", "am"], "هي أختي."], ["{He} is my father.", ["He", "She", "It"], "هو أبي.", "father مذكر، فنستخدم He."], ["The house is big. {It} is new.", ["It", "He", "She"], "البيت كبير. إنه جديد.", "البيت شيء، فنستخدم It."], ["My father {is} an engineer.", ["is", "are", "am"], "أبي مهندس."]]
        },
        {
          t: "Negatives & Questions", ta: "النفي والسؤال مع be", icon: "❓",
          g: [
            { t: "النفي: أضف not",
              b: "لنفي جملة be نضع <i>not</i> بعد am / is / are مباشرة.<br>الاختصارات: <i>is not → isn't</i> · <i>are not → aren't</i> · <i>I am not → I'm not</i>",
              f: [["الفاعل", "s"], ["am / is / are", "v"], ["not", "x"], ["التكملة", "o"]],
              ex: [["[I|s] [am|v] [not|x] [busy|o].", "لست مشغولاً."], ["[She|s] [isn't|x] [late|o].", "هي ليست متأخرة."], ["[We|s] [aren't|x] [ready|o].", "لسنا جاهزين."]],
              q: { s: "He ___ at home.", o: ["isn't", "aren't", "not"], a: "isn't", w: "he مع is، ونفيها isn't." } },
            { t: "السؤال: اقلب الترتيب",
              b: "لا توجد كلمة (هل) في الإنجليزية؛ بل <b>نقدّم فعل be على الفاعل</b>:<br><i>You are ready.</i> ← <i>Are you ready?</i><br>والإجابة القصيرة: <i>Yes, I am.</i> / <i>No, I'm not.</i>",
              f: [["Am / Is / Are", "v"], ["الفاعل", "s"], ["التكملة", "o"], ["؟", "x"]],
              ex: [["[Are|v] [you|s] [hungry|o]?", "هل أنت جائع؟"], ["[Is|v] [she|s] [married|o]?", "هل هي متزوجة؟"], ["[Where|q] [are|v] [you|s] from?", "من أين أنت؟"]],
              q: { s: "___ you from Kuwait?", o: ["Are", "Is", "Do"], a: "Are", w: "you مع are، ونقدّمها للسؤال." } }
          ],
          vocab: [["busy", "مشغول"], ["hungry", "جائع"], ["late", "متأخر"], ["married", "متزوج"], ["where", "أين"], ["from", "من (مكان)"], ["yes", "نعم"], ["no", "لا"]],
          sentences: [["I am not busy.", "لست مشغولاً."], ["Are you hungry?", "هل أنت جائع؟"], ["She isn't late.", "هي ليست متأخرة."], ["Where are you from?", "من أين أنت؟"], ["I am from Kuwait.", "أنا من الكويت."]],
          blanks: [["{Are} you ready?", ["Are", "Is", "Am"], "هل أنت جاهز؟"], ["He {isn't} at home.", ["isn't", "aren't", "am not"], "ليس في البيت."], ["{Is} she married?", ["Is", "Are", "Am"], "هل هي متزوجة؟"], ["We {aren't} late.", ["aren't", "isn't", "am not"], "لسنا متأخرين."]]
        }
      ]
    },

    /* ================= الوحدة 2 ================= */
    {
      t: "الأشياء والملكية", lvl: "A1", color: "#2F80ED",
      d: "الجمع، أسماء الإشارة، و(لديّ) و(لي).",
      lessons: [
        {
          t: "a / an & Plurals", ta: "المفرد والجمع", icon: "📦",
          g: [
            { t: "a / an مع المفرد",
              b: "الاسم المفرد المعدود يحتاج دائماً <i>a</i> أو <i>an</i> (أو <i>the</i> للمعرفة).<br>⚠️ العبرة <b>بالصوت لا بالحرف</b>: <i>an hour</i> لأن h صامتة، و<i>a university</i> لأنها تُنطق (يو).",
              ex: [["It is [an|x] [apple|o].", "إنها تفاحة."], ["It is [a|x] [box|o].", "إنه صندوق."], ["[an|x] [hour|o]", "ساعة واحدة"]],
              q: { s: "I need ___ hour.", o: ["an", "a"], a: "an", w: "h في hour صامتة، فالصوت الأول متحرك." } },
            { t: "قواعد الجمع",
              b: "• القاعدة العامة: أضف <i>s</i> ← <i>book → books</i><br>• بعد s, x, sh, ch أضف <i>es</i> ← <i>box → boxes</i><br>• y بعد ساكن تصبح <i>ies</i> ← <i>city → cities</i><br>• جموع شاذة تُحفظ: <i>man → men</i> · <i>child → children</i> · <i>person → people</i>",
              ex: [["Two [books|o], please.", "كتابان من فضلك."], ["[The children|s] [are|v] [happy|o].", "الأطفال سعداء."], ["[Three men|s] [are|v] here.", "ثلاثة رجال هنا."]],
              q: { s: "Two ___, please.", o: ["boxes", "boxs", "box"], a: "boxes", w: "box تنتهي بـ x، فنضيف es." } }
          ],
          vocab: [["book", "كتاب"], ["box", "صندوق"], ["child", "طفل"], ["children", "أطفال"], ["man", "رجل"], ["men", "رجال"], ["apple", "تفاحة"], ["city", "مدينة"]],
          sentences: [["The books are new.", "الكتب جديدة."], ["Two apples, please.", "تفاحتان من فضلك."], ["The children are happy.", "الأطفال سعداء."], ["It is an apple.", "إنها تفاحة."], ["The boxes are big.", "الصناديق كبيرة."]],
          blanks: [["It is {an} apple.", ["an", "a", "two"], "إنها تفاحة."], ["The {children} are here.", ["children", "child", "childs"], "الأطفال هنا.", "جمع child شاذ: children."], ["Two {boxes}, please.", ["boxes", "boxs", "box"], "صندوقان من فضلك."], ["Three {men} are here.", ["men", "mans", "man"], "ثلاثة رجال هنا.", "جمع man شاذ: men."]]
        },
        {
          t: "This / That / These / Those", ta: "أسماء الإشارة", icon: "👉",
          g: [
            { t: "سؤالان يحددان الكلمة",
              b: "اسأل نفسك: <b>قريب أم بعيد؟</b> و<b>مفرد أم جمع؟</b><table><tr><th></th><th>مفرد</th><th>جمع</th></tr><tr><td>قريب</td><td><i>this</i> هذا/هذه</td><td><i>these</i> هؤلاء</td></tr><tr><td>بعيد</td><td><i>that</i> ذلك/تلك</td><td><i>those</i> أولئك</td></tr></table>",
              ex: [["[This|s] [is|v] [my phone|o].", "هذا هاتفي."], ["[These keys|s] [are|v] [new|o].", "هذه المفاتيح جديدة."], ["[That bag|s] [is|v] [expensive|o].", "تلك الحقيبة غالية."], ["[Those chairs|s] [are|v] [cheap|o].", "تلك الكراسي رخيصة."]],
              q: { s: "___ shoes are new.", o: ["These", "This"], a: "These", w: "shoes جمع، فنستخدم These." } },
            { t: "السؤال",
              b: "نقلب الترتيب كالمعتاد مع be:<br><i>This is your bag.</i> ← <i>Is this your bag?</i>",
              ex: [["[Is|v] [this|s] [your bag|o]?", "هل هذه حقيبتك؟"], ["[Are|v] [those|s] [your keys|o]?", "هل تلك مفاتيحك؟"]] }
          ],
          vocab: [["phone", "هاتف"], ["bag", "حقيبة"], ["key", "مفتاح"], ["chair", "كرسي"], ["table", "طاولة"], ["shoes", "حذاء"], ["expensive", "غالٍ"], ["cheap", "رخيص"]],
          sentences: [["This is my phone.", "هذا هاتفي."], ["That bag is expensive.", "تلك الحقيبة غالية."], ["These keys are new.", "هذه المفاتيح جديدة."], ["Those chairs are cheap.", "تلك الكراسي رخيصة."], ["Is this your bag?", "هل هذه حقيبتك؟"]],
          blanks: [["{This} is my key.", ["This", "These", "Those"], "هذا مفتاحي.", "key مفرد وقريب: This."], ["{These} shoes are new.", ["These", "This", "That"], "هذا الحذاء جديد.", "shoes جمع وقريب: These."], ["Look at {that} car over there.", ["that", "these", "those"], "انظر إلى تلك السيارة هناك.", "car مفرد وبعيد: that."], ["{Are} these your keys?", ["Are", "Is", "Am"], "هل هذه مفاتيحك؟"]]
        },
        {
          t: "have / has", ta: "لديّ: have و has", icon: "🎒",
          g: [
            { t: "التعبير عن الملكية",
              b: "للتعبير عن (عندي / لديّ / أملك) نستخدم <i>have</i>.<br>لكن مع <i>he / she / it</i> يتحول إلى <i>has</i>.<table><tr><td><i>I / you / we / they</i></td><td><i>have</i></td></tr><tr><td><i>he / she / it</i></td><td><i>has</i></td></tr></table>",
              f: [["الفاعل", "s"], ["have / has", "v"], ["الشيء", "o"]],
              ex: [["[I|s] [have|v] [a question|o].", "لدي سؤال."], ["[She|s] [has|v] [two sons|o].", "لديها ابنان."], ["[My father|s] [has|v] [a big house|o].", "لدى أبي بيت كبير."]],
              q: { s: "He ___ a good job.", o: ["has", "have"], a: "has", w: "مع he نستخدم has." } },
            { t: "have في التعبيرات اليومية",
              b: "تأتي <i>have</i> أيضاً بمعنى (يتناول / يقضي):<br><i>have breakfast</i> يتناول الفطور · <i>have a meeting</i> لديه اجتماع · <i>have a good time</i> يقضي وقتاً ممتعاً.",
              ex: [["[We|s] [have|v] [a meeting|o] [today|t].", "لدينا اجتماع اليوم."]] }
          ],
          vocab: [["question", "سؤال"], ["idea", "فكرة"], ["meeting", "اجتماع"], ["time", "وقت"], ["money", "مال"], ["job", "وظيفة"], ["son", "ابن"], ["daughter", "ابنة"]],
          sentences: [["I have a question.", "لدي سؤال."], ["She has two sons.", "لديها ابنان."], ["We have a meeting today.", "لدينا اجتماع اليوم."], ["He has a good job.", "لديه وظيفة جيدة."], ["They have a daughter.", "لديهم ابنة."]],
          blanks: [["She {has} a new car.", ["has", "have", "is"], "لديها سيارة جديدة."], ["I {have} an idea.", ["have", "has", "am"], "لدي فكرة."], ["My father {has} a big house.", ["has", "have", "are"], "لدى أبي بيت كبير.", "my father = he، فنستخدم has."], ["We {have} time.", ["have", "has", "is"], "لدينا وقت."]]
        },
        {
          t: "my, your, his, her", ta: "الملكية: my و 's", icon: "🔑",
          g: [
            { t: "صفات الملكية",
              b: "في العربية نُلحق ضميراً بالكلمة (كتاب<b>ي</b>، كتاب<b>ك</b>). أما في الإنجليزية فنضع كلمة <b>قبل</b> الاسم:<table><tr><td><i>I → my</i></td><td>ـي</td></tr><tr><td><i>you → your</i></td><td>ـكَ / ـكِ</td></tr><tr><td><i>he → his</i></td><td>ـه</td></tr><tr><td><i>she → her</i></td><td>ـها</td></tr><tr><td><i>we → our</i></td><td>ـنا</td></tr><tr><td><i>they → their</i></td><td>ـهم</td></tr></table>",
              ex: [["This is [my|s] wife.", "هذه زوجتي."], ["[Her|s] husband [is|v] [an engineer|o].", "زوجها مهندس."], ["[Their|s] company [is|v] in Kuwait.", "شركتهم في الكويت."]],
              q: { s: "___ dog is small.", o: ["Their", "They", "There"], a: "Their", w: "Their للملكية. أما There فتعني (هناك)، وThey ضمير فاعل." } },
            { t: "ملكية الأسماء: 's",
              b: "لنقول (سيارة علي) نضع <i>'s</i> بعد المالك ثم الشيء: <i>Ali's car</i>.<br>لاحظ أن الترتيب <b>عكس العربية</b>: المالك أولاً.",
              ex: [["[Ali's|s] office [is|v] [big|o].", "مكتب علي كبير."], ["my [brother's|s] car", "سيارة أخي"]],
              q: { s: "This is ___ laptop.", o: ["Sara's", "Sara", "of Sara"], a: "Sara's", w: "المالك + 's: Sara's laptop." } }
          ],
          vocab: [["wife", "زوجة"], ["husband", "زوج"], ["office", "مكتب"], ["family", "عائلة"], ["dog", "كلب"], ["company", "شركة"], ["laptop", "حاسوب محمول"], ["home", "منزل"]],
          sentences: [["This is my wife.", "هذه زوجتي."], ["Her husband is an engineer.", "زوجها مهندس."], ["Ali's office is big.", "مكتب علي كبير."], ["Our family is happy.", "عائلتنا سعيدة."], ["Their company is in Kuwait.", "شركتهم في الكويت."]],
          blanks: [["{His} name is Omar.", ["His", "He", "Her"], "اسمه عمر.", "للملكية مع المذكر: his."], ["She is with {her} husband.", ["her", "his", "she"], "هي مع زوجها."], ["We love {our} home.", ["our", "we", "us"], "نحب منزلنا."], ["{Their} dog is small.", ["Their", "They", "There"], "كلبهم صغير.", "Their للملكية، There تعني هناك."]]
        }
      ]
    },

    /* ================= الوحدة 3 ================= */
    {
      t: "المضارع البسيط: حياتي اليومية", lvl: "A1", color: "#8E5CF7",
      d: "العادات والروتين، والنفي والسؤال.",
      lessons: [
        {
          t: "I work / He works", ta: "المضارع البسيط", icon: "🗓️",
          g: [
            { t: "متى نستخدمه؟",
              b: "للعادات والحقائق الثابتة والأشياء المتكررة: العمل، السكن، الروتين.<br>مع <i>I / you / we / they</i> يبقى الفعل كما هو.",
              ex: [["[I|s] [work|v] [in an office|o].", "أعمل في مكتب."], ["[We|s] [speak|v] [Arabic|o].", "نتحدث العربية."]] },
            { t: "قاعدة s مع هو وهي",
              b: "مع <i>he / she / it</i> نضيف <i>s</i> للفعل: <i>work → works</i><br>• بعد s, sh, ch, x, o نضيف <i>es</i>: <i>go → goes</i> · <i>watch → watches</i><br>• y بعد ساكن تصبح <i>ies</i>: <i>study → studies</i><br>• شاذ: <i>have → has</i>",
              f: [["he / she / it", "s"], ["الفعل + s", "v"], ["التكملة", "o"]],
              ex: [["[She|s] [lives|v] [in Kuwait City|o].", "تسكن في مدينة الكويت."], ["[He|s] [drinks|v] [coffee|o] [every morning|t].", "يشرب القهوة كل صباح."], ["[My son|s] [studies|v] [English|o].", "ابني يدرس الإنجليزية."]],
              q: { s: "My father ___ to work at 7.", o: ["goes", "go", "gos"], a: "goes", w: "go تنتهي بـ o، فنضيف es." } }
          ],
          vocab: [["work", "يعمل"], ["live", "يسكن"], ["drink", "يشرب"], ["coffee", "قهوة"], ["read", "يقرأ"], ["speak", "يتحدث"], ["study", "يدرس"], ["water", "ماء"]],
          sentences: [["I work in an office.", "أعمل في مكتب."], ["She lives in Kuwait City.", "تسكن في مدينة الكويت."], ["He drinks coffee every morning.", "يشرب القهوة كل صباح."], ["We speak Arabic.", "نتحدث العربية."], ["My son studies English.", "ابني يدرس الإنجليزية."]],
          blanks: [["She {works} in a bank.", ["works", "work", "working"], "تعمل في بنك.", "مع she نضيف s."], ["They {live} in Salmiya.", ["live", "lives", "living"], "يسكنون في السالمية.", "مع they لا نضيف s."], ["He {studies} every day.", ["studies", "studys", "study"], "يدرس كل يوم.", "y بعد ساكن تصبح ies."], ["My father {goes} to work at 7.", ["goes", "gos", "go"], "يذهب أبي إلى العمل في السابعة."]]
        },
        {
          t: "don't / doesn't", ta: "النفي في المضارع", icon: "🚫",
          g: [
            { t: "النفي بفعل مساعد",
              b: "لا نضع not مباشرة بعد الفعل العادي، بل نستعين بفعل مساعد:<br>• <i>I / you / we / they</i> ← <i>don't</i> (do not)<br>• <i>he / she / it</i> ← <i>doesn't</i> (does not)",
              f: [["الفاعل", "s"], ["don't / doesn't", "x"], ["الفعل المجرد", "v"]],
              ex: [["[I|s] [don't|x] [like|v] [coffee|o].", "لا أحب القهوة."], ["[She|s] [doesn't|x] [eat|v] [meat|o].", "لا تأكل اللحم."]] },
            { t: "⚠️ الخطأ الأشهر",
              b: "مع <i>doesn't</i> يعود الفعل لأصله <b>بلا s</b>، لأن doesn't حملت علامة الغائب عنه.<br>❌ <i>He doesn't works.</i><br>✅ <i>He doesn't work.</i>",
              ex: [["[He|s] [doesn't|x] [smoke|v].", "لا يدخن."]],
              q: { s: "She doesn't ___ on Friday.", o: ["work", "works"], a: "work", w: "بعد doesn't يأتي الفعل مجرداً." } }
          ],
          vocab: [["like", "يحب"], ["eat", "يأكل"], ["meat", "لحم"], ["smoke", "يدخن"], ["watch", "يشاهد"], ["TV", "تلفاز"], ["understand", "يفهم"], ["know", "يعرف"]],
          sentences: [["I don't like coffee.", "لا أحب القهوة."], ["She doesn't eat meat.", "لا تأكل اللحم."], ["We don't watch TV.", "لا نشاهد التلفاز."], ["He doesn't smoke.", "لا يدخن."], ["I don't understand.", "لا أفهم."]],
          blanks: [["He {doesn't} like tea.", ["doesn't", "don't", "isn't"], "لا يحب الشاي."], ["They {don't} know.", ["don't", "doesn't", "aren't"], "هم لا يعرفون."], ["She doesn't {work} on Friday.", ["work", "works", "working"], "لا تعمل يوم الجمعة.", "بعد doesn't يأتي الفعل مجرداً."], ["I {don't} eat fish.", ["don't", "doesn't", "am not"], "لا آكل السمك."]]
        },
        {
          t: "Do / Does questions", ta: "السؤال في المضارع", icon: "🤔",
          g: [
            { t: "السؤال بـ Do و Does",
              b: "نضع <i>Do</i> أو <i>Does</i> في بداية الجملة، ويبقى الفعل مجرداً.<br>الإجابة القصيرة: <i>Yes, I do.</i> / <i>No, she doesn't.</i>",
              f: [["Do / Does", "x"], ["الفاعل", "s"], ["الفعل المجرد", "v"], ["؟", "o"]],
              ex: [["[Do|x] [you|s] [want|v] [tea|o]?", "هل تريد شاياً؟"], ["[Does|x] [she|s] [speak|v] [English|o]?", "هل تتحدث الإنجليزية؟"]],
              q: { s: "___ he live here?", o: ["Does", "Do", "Is"], a: "Does", w: "مع he نستخدم Does." } },
            { t: "أدوات الاستفهام",
              b: "لأسئلة المعلومات ضع أداة الاستفهام أولاً:<br><i>What</i> ماذا · <i>Where</i> أين · <i>When</i> متى · <i>Who</i> من · <i>Why</i> لماذا · <i>How</i> كيف",
              f: [["أداة السؤال", "q"], ["do / does", "x"], ["الفاعل", "s"], ["الفعل", "v"]],
              ex: [["[Where|q] [do|x] [you|s] [work|v]?", "أين تعمل؟"], ["[When|q] [does|x] [the meeting|s] [start|v]?", "متى يبدأ الاجتماع؟"]] }
          ],
          vocab: [["want", "يريد"], ["need", "يحتاج"], ["start", "يبدأ"], ["finish", "ينهي"], ["when", "متى"], ["what", "ماذا"], ["help", "مساعدة"], ["weekend", "عطلة نهاية الأسبوع"]],
          sentences: [["Do you want tea?", "هل تريد شاياً؟"], ["Does she speak English?", "هل تتحدث الإنجليزية؟"], ["What do you need?", "ماذا تحتاج؟"], ["When does the meeting start?", "متى يبدأ الاجتماع؟"], ["Where do you work?", "أين تعمل؟"]],
          blanks: [["{Do} you like football?", ["Do", "Does", "Are"], "هل تحب كرة القدم؟"], ["{Does} he live here?", ["Does", "Do", "Is"], "هل يسكن هنا؟"], ["Does she {need} help?", ["need", "needs", "needing"], "هل تحتاج مساعدة؟", "بعد Does يأتي الفعل مجرداً."], ["What time {do} you finish?", ["do", "does", "are"], "متى تنتهي؟"]]
        },
        {
          t: "Routine & Frequency", ta: "الروتين وظروف التكرار", icon: "⏰",
          g: [
            { t: "كم مرة؟",
              b: "من الأكثر إلى الأقل:<br><i>always</i> دائماً ← <i>usually</i> عادةً ← <i>often</i> غالباً ← <i>sometimes</i> أحياناً ← <i>never</i> أبداً<br><b>موقعها:</b> قبل الفعل العادي، لكن <b>بعد</b> فعل be.",
              ex: [["[I|s] [always|t] [wake up|v] [early|o].", "أستيقظ دائماً مبكراً."], ["[He|s] [is|v] [often|t] [late|o].", "غالباً ما يتأخر."], ["[She|s] [never|t] [drinks|v] [coffee|o].", "لا تشرب القهوة أبداً."]],
              q: { s: "I ___ late. (لا أتأخر أبداً)", o: ["am never", "never am"], a: "am never", w: "الظرف يأتي بعد فعل be." } },
            { t: "حروف الوقت: at, on, in",
              b: "• <i>at</i> مع الساعة: <i>at 7 o'clock</i><br>• <i>on</i> مع الأيام: <i>on Friday</i><br>• <i>in</i> مع الشهور والسنوات وأجزاء اليوم: <i>in May</i> · <i>in the morning</i>",
              ex: [["We rest [on Friday|t].", "نرتاح يوم الجمعة."], ["They have breakfast [at seven|t].", "يتناولون الفطور في السابعة."], ["I study [in the evening|t].", "أدرس في المساء."]],
              q: { s: "I go to work ___ 7 o'clock.", o: ["at", "on", "in"], a: "at", w: "at مع الساعة." } }
          ],
          vocab: [["always", "دائماً"], ["usually", "عادةً"], ["often", "غالباً"], ["sometimes", "أحياناً"], ["never", "أبداً"], ["wake up", "يستيقظ"], ["breakfast", "فطور"], ["early", "مبكراً"]],
          sentences: [["I always wake up early.", "أستيقظ دائماً مبكراً."], ["She never drinks coffee.", "لا تشرب القهوة أبداً."], ["We sometimes go to the gym.", "نذهب أحياناً إلى النادي الرياضي."], ["He is often late.", "غالباً ما يتأخر."], ["They usually have breakfast at seven.", "عادةً يتناولون الفطور في السابعة."]],
          blanks: [["He {is} always busy.", ["is", "does", "has"], "هو مشغول دائماً."], ["I go to work {at} 7 o'clock.", ["at", "on", "in"], "أذهب للعمل في السابعة.", "at مع الساعة."], ["We rest {on} Friday.", ["on", "at", "in"], "نرتاح يوم الجمعة.", "on مع الأيام."], ["They usually {go} home at five.", ["go", "goes", "going"], "عادةً يعودون للبيت في الخامسة."]]
        }
      ]
    },

    /* ================= الوحدة 4 ================= */
    {
      t: "الآن وهنا: المكان والقدرة", lvl: "A2", color: "#E8710A",
      d: "ما يحدث الآن، ويوجد، وحروف المكان، و can.",
      lessons: [
        {
          t: "Present Continuous", ta: "المضارع المستمر", icon: "🎬",
          g: [
            { t: "ما يحدث الآن",
              b: "نستخدمه لفعل يحدث <b>في لحظة الكلام</b> أو في هذه الفترة.",
              f: [["الفاعل", "s"], ["am / is / are", "v"], ["الفعل + ing", "v"]],
              ex: [["[I|s] [am waiting|v] [for the bus|o].", "أنا أنتظر الحافلة."], ["[It|s] [is raining|v] [now|t].", "إنها تمطر الآن."], ["[They|s] [are building|v] [a new bridge|o].", "إنهم يبنون جسراً جديداً."]] },
            { t: "الفرق عن المضارع البسيط",
              b: "<b>البسيط</b> = عادة متكررة: <i>He drinks tea every day.</i><br><b>المستمر</b> = الآن فقط: <i>He is drinking coffee now.</i><br>إملاء ing: <i>make → making</i> (تُحذف e) · <i>sit → sitting</i> (يُضاعَف الحرف)",
              ex: [["[He|s] [usually|t] [drinks|v] tea, but [now|t] he [is drinking|v] coffee.", "عادةً يشرب الشاي، لكنه الآن يشرب القهوة."]],
              q: { s: "Look! The baby ___.", o: ["is sleeping", "sleeps"], a: "is sleeping", w: "Look! تدل على أن الحدث يجري الآن." } }
          ],
          vocab: [["now", "الآن"], ["wait", "ينتظر"], ["rain", "تمطر"], ["cook", "يطبخ"], ["sleep", "ينام"], ["build", "يبني"], ["call", "يتصل"], ["listen", "يستمع"]],
          sentences: [["I am waiting for the bus.", "أنا أنتظر الحافلة."], ["It is raining now.", "إنها تمطر الآن."], ["She is cooking dinner.", "هي تطبخ العشاء."], ["They are building a new bridge.", "إنهم يبنون جسراً جديداً."], ["What are you doing?", "ماذا تفعل؟"]],
          blanks: [["Look! The baby {is sleeping}.", ["is sleeping", "sleeps", "sleeping"], "انظر! الطفل نائم."], ["I {am calling} my mother now.", ["am calling", "call", "calls"], "أتصل بأمي الآن."], ["We {are} listening.", ["are", "is", "do"], "نحن نستمع."], ["He usually drinks tea, but now he {is drinking} coffee.", ["is drinking", "drinks", "drink"], "عادةً يشرب الشاي لكنه الآن يشرب القهوة."]]
        },
        {
          t: "There is / There are", ta: "يوجد وتوجد", icon: "🏙️",
          g: [
            { t: "يوجد / توجد",
              b: "<i>There is</i> + مفرد، و<i>There are</i> + جمع.<br>⚠️ لا نقول <i>It has a park</i> بمعنى (فيه حديقة)؛ هذه ترجمة حرفية خاطئة.",
              ex: [["[There is|v] [a park|o] near my house.", "توجد حديقة قرب بيتي."], ["[There are|v] [three bedrooms|o].", "توجد ثلاث غرف نوم."]],
              q: { s: "There ___ two schools.", o: ["are", "is"], a: "are", w: "two schools جمع: There are." } },
            { t: "النفي والسؤال",
              b: "النفي: <i>There isn't</i> / <i>There aren't any</i><br>السؤال: <i>Is there...?</i> / <i>Are there...?</i><br>للسؤال عن العدد: <i>How many ... are there?</i>",
              ex: [["[Is there|v] [a hospital|o] here?", "هل يوجد مستشفى هنا؟"], ["[There aren't|x] [any chairs|o].", "لا توجد كراسٍ."], ["[How many|q] windows [are there|v]?", "كم نافذة يوجد؟"]] }
          ],
          vocab: [["kitchen", "مطبخ"], ["bedroom", "غرفة نوم"], ["window", "نافذة"], ["park", "حديقة عامة"], ["hospital", "مستشفى"], ["school", "مدرسة"], ["restaurant", "مطعم"], ["near", "قريب من"]],
          sentences: [["There is a park near my house.", "توجد حديقة قرب بيتي."], ["There are three bedrooms.", "توجد ثلاث غرف نوم."], ["Is there a hospital here?", "هل يوجد مستشفى هنا؟"], ["There isn't a restaurant near the school.", "لا يوجد مطعم قرب المدرسة."], ["How many windows are there?", "كم نافذة يوجد؟"]],
          blanks: [["There {is} a kitchen.", ["is", "are", "have"], "يوجد مطبخ."], ["There {are} two schools.", ["are", "is", "has"], "توجد مدرستان."], ["{Is} there a bank near here?", ["Is", "Are", "Do"], "هل يوجد بنك قريب من هنا؟"], ["There {aren't} any chairs.", ["aren't", "isn't", "don't"], "لا توجد كراسٍ.", "chairs جمع، فالنفي aren't."]]
        },
        {
          t: "Prepositions of Place", ta: "حروف المكان", icon: "📍",
          g: [
            { t: "أين الشيء؟",
              b: "<i>in</i> في (داخل) · <i>on</i> على (فوق سطح) · <i>under</i> تحت<br><i>next to</i> بجانب · <i>between</i> بين · <i>behind</i> خلف · <i>in front of</i> أمام",
              ex: [["The keys are [on|p] the table.", "المفاتيح على الطاولة."], ["My phone is [in|p] my bag.", "هاتفي في حقيبتي."], ["The cat is [under|p] the chair.", "القطة تحت الكرسي."]] },
            { t: "تنبيهات مهمة",
              b: "• الصورة <b>على</b> الجدار = <i>on the wall</i> (ملاصقة للسطح)<br>• <i>between</i> تأتي مع <i>and</i><br>• <i>in front of</i> ثلاث كلمات، ولا تُحذف <i>of</i>",
              ex: [["The pharmacy is [between|p] the bank [and|p] the school.", "الصيدلية بين البنك والمدرسة."], ["The car is [in front of|p] the house.", "السيارة أمام البيت."]],
              q: { s: "The picture is ___ the wall.", o: ["on", "in"], a: "on", w: "الصورة ملاصقة لسطح الجدار: on." } }
          ],
          vocab: [["in", "في"], ["on", "على"], ["under", "تحت"], ["next to", "بجانب"], ["between", "بين"], ["behind", "خلف"], ["in front of", "أمام"], ["wall", "جدار"]],
          sentences: [["The keys are on the table.", "المفاتيح على الطاولة."], ["The cat is under the chair.", "القطة تحت الكرسي."], ["The bank is next to the hospital.", "البنك بجانب المستشفى."], ["The car is in front of the house.", "السيارة أمام البيت."], ["The pharmacy is between the bank and the school.", "الصيدلية بين البنك والمدرسة."]],
          blanks: [["The picture is {on} the wall.", ["on", "in", "under"], "الصورة على الجدار."], ["My phone is {in} my bag.", ["in", "on", "between"], "هاتفي في حقيبتي."], ["Sit {next} to me.", ["next", "near", "front"], "اجلس بجانبي."], ["The shop is between the bank {and} the café.", ["and", "or", "with"], "المحل بين البنك والمقهى.", "between ... and."]]
        },
        {
          t: "can / can't", ta: "القدرة والطلب: can", icon: "💪",
          g: [
            { t: "يستطيع: can",
              b: "<i>can</i> ثابتة مع كل الفاعلين (بلا s)، ويأتي بعدها الفعل مجرداً <b>بلا to</b>.",
              f: [["الفاعل", "s"], ["can / can't", "x"], ["الفعل المجرد", "v"]],
              ex: [["[I|s] [can|x] [swim|v].", "أستطيع السباحة."], ["[She|s] [can't|x] [drive|v].", "لا تستطيع القيادة."]],
              q: { s: "He can ___ three languages.", o: ["speak", "speaks", "to speak"], a: "speak", w: "بعد can فعل مجرد بلا s وبلا to." } },
            { t: "الطلب بأدب",
              b: "<i>Can you...?</i> لطلب شيء من شخص، و<i>Can I...?</i> لطلب الإذن.<br>وللمزيد من الأدب: <i>Could you...?</i>",
              ex: [["[Can|x] [you|s] [help|v] me?", "هل يمكنك مساعدتي؟"], ["[Can|x] [I|s] [open|v] the window?", "هل يمكنني فتح النافذة؟"], ["[Could|x] [you|s] [repeat|v] that, please?", "هل يمكنك تكرار ذلك من فضلك؟"]] }
          ],
          vocab: [["swim", "يسبح"], ["drive", "يقود"], ["help", "يساعد"], ["open", "يفتح"], ["door", "باب"], ["carry", "يحمل"], ["hear", "يسمع"], ["repeat", "يكرر"]],
          sentences: [["I can swim.", "أستطيع السباحة."], ["She can't drive.", "لا تستطيع القيادة."], ["Can you help me?", "هل يمكنك مساعدتي؟"], ["Can I open the window?", "هل يمكنني فتح النافذة؟"], ["Can you repeat that, please?", "هل يمكنك تكرار ذلك من فضلك؟"]],
          blanks: [["He can {speak} three languages.", ["speak", "speaks", "speaking"], "يستطيع التحدث بثلاث لغات."], ["{Can} you hear me?", ["Can", "Do", "Are"], "هل تسمعني؟"], ["I {can't} carry this box.", ["can't", "don't", "am not"], "لا أستطيع حمل هذا الصندوق."], ["Can she {drive}?", ["drive", "drives", "driving"], "هل تستطيع القيادة؟"]]
        }
      ]
    },

    /* ================= الوحدة 5 ================= */
    {
      t: "الماضي: ماذا حدث؟", lvl: "A2", color: "#E5484D",
      d: "كان، والأفعال المنتظمة والشاذة، والسؤال بـ did.",
      lessons: [
        {
          t: "was / were", ta: "ماضي be", icon: "🕰️",
          g: [
            { t: "was و were",
              b: "<i>am / is</i> ← <i>was</i>، و<i>are</i> ← <i>were</i>.<table><tr><td><i>I / he / she / it</i></td><td><i>was</i></td></tr><tr><td><i>you / we / they</i></td><td><i>were</i></td></tr></table>",
              ex: [["[I|s] [was|v] at home [yesterday|t].", "كنت في البيت أمس."], ["[They|s] [were|v] in London [last week|t].", "كانوا في لندن الأسبوع الماضي."]],
              q: { s: "We ___ at the office.", o: ["were", "was"], a: "were", w: "مع we نستخدم were." } },
            { t: "النفي والسؤال",
              b: "النفي: <i>wasn't</i> / <i>weren't</i> · السؤال بالقلب: <i>Were you sick?</i><br>⚠️ (وُلدت) في الإنجليزية: <i>I was born</i>.",
              ex: [["[Were|v] [you|s] sick?", "هل كنت مريضاً؟"], ["[He|s] [wasn't|x] at work.", "لم يكن في العمل."], ["[I|s] [was born|v] [in 1990|t].", "وُلدت عام 1990."]] }
          ],
          vocab: [["yesterday", "أمس"], ["last week", "الأسبوع الماضي"], ["ago", "منذ / قبل"], ["born", "مولود"], ["sick", "مريض"], ["weather", "الطقس"], ["hot", "حار"], ["cold", "بارد"]],
          sentences: [["I was at home yesterday.", "كنت في البيت أمس."], ["They were in London last week.", "كانوا في لندن الأسبوع الماضي."], ["The weather was very hot.", "كان الطقس حاراً جداً."], ["Were you sick?", "هل كنت مريضاً؟"], ["I was born in 1990.", "وُلدت عام 1990."]],
          blanks: [["She {was} tired yesterday.", ["was", "were", "is"], "كانت متعبة أمس."], ["We {were} at the office.", ["were", "was", "are"], "كنا في المكتب."], ["{Were} they happy?", ["Were", "Was", "Did"], "هل كانوا سعداء؟"], ["He {wasn't} at work.", ["wasn't", "weren't", "didn't"], "لم يكن في العمل."]]
        },
        {
          t: "Past Simple: -ed", ta: "الماضي المنتظم", icon: "✅",
          g: [
            { t: "أضف ed",
              b: "لفعل انتهى في الماضي نضيف <i>ed</i>، وهو الشكل نفسه مع جميع الفاعلين.<br>• ينتهي بـ e: نضيف d ← <i>live → lived</i><br>• ساكن + y ← <i>ied</i>: <i>study → studied</i><br>• فعل قصير (ساكن-متحرك-ساكن): يُضاعَف ← <i>stop → stopped</i>",
              ex: [["[I|s] [visited|v] my uncle [yesterday|t].", "زرت عمي أمس."], ["[He|s] [studied|v] engineering.", "درس الهندسة."]],
              q: { s: "She ___ hard.", o: ["studied", "studyed"], a: "studied", w: "y بعد ساكن تصبح ied." } },
            { t: "نطق ed",
              b: "ثلاثة أصوات:<br>• /t/ بعد p, k, s, sh, ch: <i>worked</i> (ووركت)<br>• /d/ بعد بقية الأصوات: <i>played</i> (بلِيد)<br>• /id/ بعد t أو d: <i>visited</i> (فِزِتِد)",
              ex: [["[We|s] [played|v] football [last night|t].", "لعبنا كرة القدم الليلة الماضية."], ["The train [arrived|v] late.", "وصل القطار متأخراً."], ["[They|s] [visited|v] us.", "زارونا."]] }
          ],
          vocab: [["visit", "يزور"], ["play", "يلعب"], ["travel", "يسافر"], ["arrive", "يصل"], ["stay", "يقيم"], ["ask", "يسأل"], ["answer", "يجيب"], ["uncle", "عم / خال"]],
          sentences: [["I visited my uncle yesterday.", "زرت عمي أمس."], ["We played football last night.", "لعبنا كرة القدم الليلة الماضية."], ["She travelled to Dubai.", "سافرت إلى دبي."], ["The train arrived late.", "وصل القطار متأخراً."], ["He studied engineering.", "درس الهندسة."]],
          blanks: [["They {stayed} at a hotel.", ["stayed", "stay", "staied"], "أقاموا في فندق.", "y بعد متحرك تبقى: stayed."], ["I {finished} my work.", ["finished", "finish", "finishs"], "أنهيت عملي."], ["She {studied} hard.", ["studied", "studyed", "studies"], "درست بجد."], ["He {stopped} the car.", ["stopped", "stoped", "stops"], "أوقف السيارة.", "stop قصير، فيُضاعَف p."]]
        },
        {
          t: "Irregular Verbs", ta: "الأفعال الشاذة", icon: "🧩",
          g: [
            { t: "أفعال تتغير كلياً",
              b: "أكثر الأفعال استخداماً لا تأخذ ed، بل تتغير صورتها ويجب حفظها:<table><tr><td><i>go → went</i></td><td><i>have → had</i></td></tr><tr><td><i>see → saw</i></td><td><i>eat → ate</i></td></tr><tr><td><i>buy → bought</i></td><td><i>take → took</i></td></tr><tr><td><i>make → made</i></td><td><i>come → came</i></td></tr></table>",
              ex: [["[We|s] [went|v] to the beach.", "ذهبنا إلى الشاطئ."], ["[They|s] [came|v] home late.", "عادوا إلى البيت متأخرين."]],
              q: { s: "We ___ fish yesterday.", o: ["ate", "eated"], a: "ate", w: "eat شاذ: ate." } },
            { t: "نصيحة للحفظ",
              b: "احفظها في مجموعات صوتية: <i>buy → bought</i> · <i>bring → brought</i> · <i>think → thought</i> كلها تنتهي بـ ought.<br>المراجعة اليومية في التطبيق ستثبّتها تلقائياً.",
              ex: [["[I|s] [bought|v] a new phone.", "اشتريت هاتفاً جديداً."], ["[She|s] [took|v] a taxi.", "أخذت سيارة أجرة."]] }
          ],
          vocab: [["went", "ذهب"], ["had", "كان لديه / تناول"], ["saw", "رأى"], ["ate", "أكل"], ["bought", "اشترى"], ["took", "أخذ"], ["made", "صنع"], ["came", "جاء"]],
          sentences: [["We went to the beach.", "ذهبنا إلى الشاطئ."], ["I bought a new phone.", "اشتريت هاتفاً جديداً."], ["She saw a good film.", "شاهدت فيلماً جيداً."], ["They came home late.", "عادوا إلى البيت متأخرين."], ["He made a big mistake.", "ارتكب خطأً كبيراً."]],
          blanks: [["I {went} to Jahra last week.", ["went", "goed", "go"], "ذهبت إلى الجهراء الأسبوع الماضي."], ["We {ate} fish yesterday.", ["ate", "eated", "eat"], "أكلنا السمك أمس."], ["She {took} a taxi.", ["took", "taked", "takes"], "أخذت سيارة أجرة."], ["They {had} a great time.", ["had", "haved", "has"], "قضوا وقتاً رائعاً."]]
        },
        {
          t: "did / didn't", ta: "النفي والسؤال في الماضي", icon: "🔎",
          g: [
            { t: "النفي بـ didn't",
              b: "مع كل الفاعلين: <i>didn't</i> + الفعل <b>المجرد</b>، لأن did تحمل علامة الماضي.<br>❌ <i>I didn't went</i> · ✅ <i>I didn't go</i>",
              f: [["الفاعل", "s"], ["didn't", "x"], ["الفعل المجرد", "v"]],
              ex: [["[I|s] [didn't|x] [sleep|v] well.", "لم أنم جيداً."], ["[She|s] [didn't|x] [call|v] me.", "لم تتصل بي."]],
              q: { s: "I didn't ___ to school.", o: ["go", "went"], a: "go", w: "بعد didn't فعل مجرد." } },
            { t: "السؤال بـ Did",
              b: "<i>Did</i> + الفاعل + الفعل المجرد. ومع أدوات الاستفهام: <i>Where did you go?</i>",
              ex: [["[Did|x] [you|s] [see|v] the match?", "هل شاهدت المباراة؟"], ["[What|q] [did|x] [he|s] [say|v]?", "ماذا قال؟"]],
              q: { s: "Did she ___ it?", o: ["buy", "bought"], a: "buy", w: "بعد Did فعل مجرد." } }
          ],
          vocab: [["say", "يقول"], ["said", "قال"], ["match", "مباراة"], ["well", "جيداً"], ["forget", "ينسى"], ["forgot", "نسي"], ["lose", "يفقد"], ["lost", "فقد"]],
          sentences: [["Did you see the match?", "هل شاهدت المباراة؟"], ["I didn't sleep well.", "لم أنم جيداً."], ["Where did you go?", "أين ذهبت؟"], ["She didn't call me.", "لم تتصل بي."], ["What did he say?", "ماذا قال؟"]],
          blanks: [["{Did} you call him?", ["Did", "Do", "Were"], "هل اتصلت به؟"], ["I didn't {go} to school.", ["go", "went", "goes"], "لم أذهب إلى المدرسة.", "بعد didn't فعل مجرد."], ["Did she {buy} it?", ["buy", "bought", "buys"], "هل اشترته؟"], ["We {didn't} see him.", ["didn't", "don't", "weren't"], "لم نره."]]
        }
      ]
    },

    /* ================= الوحدة 6 ================= */
    {
      t: "المستقبل والمقارنة", lvl: "A2", color: "#0A97A8",
      d: "الخطط والتوقعات، والأكبر والأفضل.",
      lessons: [
        {
          t: "going to", ta: "الخطط: going to", icon: "🧭",
          g: [
            { t: "خطة مسبقة",
              b: "لخطة قررتها مسبقاً: am / is / are + <i>going to</i> + فعل مجرد.<br>وتُستخدم أيضاً للتنبؤ بدليل واضح أمامك.",
              f: [["الفاعل", "s"], ["am / is / are", "v"], ["going to", "x"], ["الفعل المجرد", "v"]],
              ex: [["[I|s] [am going to|x] [visit|v] my parents.", "سأزور والديّ."], ["Look at the clouds! [It's going to|x] [rain|v].", "انظر إلى الغيوم! ستمطر."]],
              q: { s: "He is going to ___ his car.", o: ["sell", "sells", "sold"], a: "sell", w: "بعد going to فعل مجرد." } },
            { t: "السؤال",
              b: "نقلب be: <i>Are you going to come?</i> · <i>What are you going to do?</i>",
              ex: [["[What|q] [are|v] [you|s] [going to|x] [do|v] tomorrow?", "ماذا ستفعل غداً؟"]] }
          ],
          vocab: [["tomorrow", "غداً"], ["next week", "الأسبوع القادم"], ["plan", "خطة"], ["holiday", "إجازة"], ["sell", "يبيع"], ["move", "ينتقل"], ["parents", "الوالدان"], ["clouds", "غيوم"]],
          sentences: [["I am going to visit my parents.", "سأزور والديّ."], ["We are going to travel next week.", "سنسافر الأسبوع القادم."], ["She is going to buy a car.", "ستشتري سيارة."], ["It's going to rain.", "ستمطر."], ["What are you going to do tomorrow?", "ماذا ستفعل غداً؟"]],
          blanks: [["I {am} going to study.", ["am", "is", "are"], "سأدرس."], ["They are going {to} move.", ["to", "for", "at"], "سينتقلون."], ["He is going to {sell} his car.", ["sell", "sells", "sold"], "سيبيع سيارته."], ["{Are} you going to come?", ["Are", "Do", "Will"], "هل ستأتي؟"]]
        },
        {
          t: "will", ta: "المستقبل: will", icon: "🔮",
          g: [
            { t: "القرار والوعد والتوقع",
              b: "<i>will</i> + فعل مجرد، ثابتة مع جميع الفاعلين. نستخدمها عند:<br>• قرار في اللحظة: <i>I'll help you.</i><br>• وعد: <i>I will call you.</i><br>• توقع رأي: <i>I think it will be hot.</i><br>النفي: <i>won't</i> = will not",
              ex: [["[I|s] [will|x] [call|v] you [later|t].", "سأتصل بك لاحقاً."], ["[She|s] [won't|x] [be|v] late.", "لن تتأخر."]],
              q: { s: "He will ___ here soon.", o: ["be", "is"], a: "be", w: "بعد will فعل مجرد: be." } },
            { t: "will أم going to؟",
              b: "<b>خطة مسبقة</b> ← <i>going to</i>: <i>I'm going to travel next week.</i> (حجزت التذكرة)<br><b>قرار الآن</b> ← <i>will</i>: الهاتف يرن ← <i>I'll answer it!</i>",
              ex: [["The phone is ringing. [I'll|x] [answer|v] it!", "الهاتف يرن. سأرد عليه!"]] }
          ],
          vocab: [["promise", "يعد"], ["probably", "على الأرجح"], ["think", "يعتقد"], ["maybe", "ربما"], ["win", "يفوز"], ["future", "مستقبل"], ["soon", "قريباً"], ["later", "لاحقاً"]],
          sentences: [["I will call you later.", "سأتصل بك لاحقاً."], ["I think it will be hot tomorrow.", "أعتقد أن الجو سيكون حاراً غداً."], ["Don't worry, I'll help you.", "لا تقلق، سأساعدك."], ["She won't be late.", "لن تتأخر."], ["Will you come to the party?", "هل ستأتي إلى الحفلة؟"]],
          blanks: [["I {will} help you.", ["will", "am", "do"], "سأساعدك."], ["He will {be} here soon.", ["be", "is", "being"], "سيكون هنا قريباً."], ["They {won't} win.", ["won't", "don't", "aren't"], "لن يفوزوا."], ["{Will} it rain tomorrow?", ["Will", "Does", "Is"], "هل ستمطر غداً؟"]]
        },
        {
          t: "Comparatives", ta: "المقارنة: أكبر من", icon: "⚖️",
          g: [
            { t: "المقارنة بين شيئين",
              b: "• صفة قصيرة: <i>er</i> + <i>than</i> ← <i>fast → faster than</i><br>• تنتهي بـ y ← <i>ier</i>: <i>easy → easier</i><br>• صفة طويلة: <i>more</i> + الصفة ← <i>more expensive</i><br>• شاذ: <i>good → better</i> · <i>bad → worse</i>",
              ex: [["My car is [faster|o] [than|x] your car.", "سيارتي أسرع من سيارتك."], ["English is [easier|o] [than|x] Chinese.", "الإنجليزية أسهل من الصينية."], ["Gold is [more expensive|o] [than|x] silver.", "الذهب أغلى من الفضة."]],
              q: { s: "Her English is ___ than mine.", o: ["better", "gooder", "more good"], a: "better", w: "good شاذة: better." } },
            { t: "⚠️ than وليس that",
              b: "(من) في المقارنة = <i>than</i>. لا تخلط بينها وبين <i>that</i> (ذلك) أو <i>then</i> (ثم).",
              ex: [["Kuwait is hotter [than|x] London.", "الكويت أحرّ من لندن."]] }
          ],
          vocab: [["faster", "أسرع"], ["taller", "أطول"], ["cheaper", "أرخص"], ["easier", "أسهل"], ["better", "أفضل"], ["worse", "أسوأ"], ["more expensive", "أغلى"], ["than", "من (للمقارنة)"]],
          sentences: [["My car is faster than your car.", "سيارتي أسرع من سيارتك."], ["This phone is cheaper than that one.", "هذا الهاتف أرخص من ذلك."], ["Kuwait is hotter than London.", "الكويت أحرّ من لندن."], ["English is easier than Chinese.", "الإنجليزية أسهل من الصينية."], ["Today is better than yesterday.", "اليوم أفضل من أمس."]],
          blanks: [["He is {taller} than me.", ["taller", "more tall", "tallest"], "هو أطول مني."], ["This book is more {interesting} than that one.", ["interesting", "interestinger", "interested"], "هذا الكتاب أكثر تشويقاً من ذلك."], ["Her English is {better} than mine.", ["better", "gooder", "more good"], "إنجليزيتها أفضل من إنجليزيتي."], ["A car is faster {than} a bike.", ["than", "that", "then"], "السيارة أسرع من الدراجة."]]
        },
        {
          t: "Superlatives", ta: "التفضيل: الأكبر", icon: "🏆",
          g: [
            { t: "الأعلى بين المجموعة",
              b: "<i>the</i> + الصفة + <i>est</i>، أو <i>the most</i> + الصفة الطويلة.<br>الشاذ: <i>the best</i> · <i>the worst</i>",
              ex: [["This is [the biggest|o] mall in Kuwait.", "هذا أكبر مجمع في الكويت."], ["She is [the best|o] student in the class.", "هي أفضل طالبة في الصف."], ["It's [the most beautiful|o] city.", "إنها أجمل مدينة."]],
              q: { s: "This is the ___ restaurant.", o: ["best", "goodest"], a: "best", w: "good ← better ← the best." } },
            { t: "الجدول الكامل",
              b: "<table><tr><th>الصفة</th><th>المقارنة</th><th>التفضيل</th></tr><tr><td><i>small</i></td><td><i>smaller</i></td><td><i>the smallest</i></td></tr><tr><td><i>big</i></td><td><i>bigger</i></td><td><i>the biggest</i></td></tr><tr><td><i>easy</i></td><td><i>easier</i></td><td><i>the easiest</i></td></tr><tr><td><i>expensive</i></td><td><i>more expensive</i></td><td><i>the most expensive</i></td></tr><tr><td><i>good</i></td><td><i>better</i></td><td><i>the best</i></td></tr><tr><td><i>bad</i></td><td><i>worse</i></td><td><i>the worst</i></td></tr></table>",
              ex: [["It was [the worst|o] day of my life.", "كان أسوأ يوم في حياتي."]] }
          ],
          vocab: [["the biggest", "الأكبر"], ["the best", "الأفضل"], ["the worst", "الأسوأ"], ["the most", "الأكثر"], ["young", "صغير السن"], ["old", "كبير السن / قديم"], ["mall", "مجمع تجاري"], ["class", "صف"]],
          sentences: [["This is the biggest mall in Kuwait.", "هذا أكبر مجمع في الكويت."], ["She is the best student in the class.", "هي أفضل طالبة في الصف."], ["It was the worst day of my life.", "كان أسوأ يوم في حياتي."], ["What is the most expensive car?", "ما أغلى سيارة؟"], ["He is the youngest in the family.", "هو الأصغر في العائلة."]],
          blanks: [["He is {the} oldest brother.", ["the", "a", "than"], "هو الأخ الأكبر."], ["This is the {best} restaurant.", ["best", "goodest", "better"], "هذا أفضل مطعم."], ["It's the most {beautiful} city.", ["beautiful", "beautifulest", "more beautiful"], "إنها أجمل مدينة."], ["Everest is the {highest} mountain.", ["highest", "higher", "most high"], "إيفرست أعلى جبل."]]
        }
      ]
    },

    /* ================= الوحدة 7 ================= */
    {
      t: "المتوسط: الخبرة والشروط والإلزام", lvl: "B1", color: "#C28A00",
      d: "المضارع التام، for و since، الشرط، و must.",
      lessons: [
        {
          t: "Present Perfect", ta: "المضارع التام", icon: "🌍",
          g: [
            { t: "التجربة والنتيجة",
              b: "يربط الماضي بالحاضر. نستخدمه للتجارب في الحياة <b>دون وقت محدد</b>، ولأحداث انتهت للتو ونتيجتها ظاهرة الآن.",
              f: [["الفاعل", "s"], ["have / has", "x"], ["التصريف الثالث", "v"]],
              ex: [["[Have|x] [you|s] [ever|t] [been|v] to Japan?", "هل سبق أن زرت اليابان؟"], ["[I|s] [have|x] [never|t] [eaten|v] sushi.", "لم آكل السوشي قط."]],
              q: { s: "She has ___ the email.", o: ["written", "wrote"], a: "written", w: "بعد has يأتي التصريف الثالث: written." } },
            { t: "just · already · yet",
              b: "• <i>just</i> = للتو (قبل الفعل)<br>• <i>already</i> = بالفعل (قبل الفعل)<br>• <i>yet</i> = بعد (آخر الجملة، مع النفي والسؤال)",
              ex: [["[I|s] [have|x] [just|t] [arrived|v].", "وصلت للتو."], ["[She|s] [has|x] [already|t] [finished|v] the report.", "لقد أنهت التقرير بالفعل."], ["[We|s] [haven't|x] [decided|v] [yet|t].", "لم نقرر بعد."]],
              q: { s: "They haven't arrived ___.", o: ["yet", "already"], a: "yet", w: "yet مع النفي في آخر الجملة." } }
          ],
          vocab: [["ever", "من قبل (في السؤال)"], ["already", "بالفعل"], ["yet", "بعد"], ["just", "للتو"], ["report", "تقرير"], ["decide", "يقرر"], ["experience", "خبرة"], ["been", "ذهب / كان (تصريف ثالث)"]],
          sentences: [["Have you ever been to Japan?", "هل سبق أن زرت اليابان؟"], ["I have never eaten sushi.", "لم آكل السوشي قط."], ["She has already finished the report.", "لقد أنهت التقرير بالفعل."], ["We haven't decided yet.", "لم نقرر بعد."], ["I have just arrived.", "وصلت للتو."]],
          blanks: [["I {have} seen this film.", ["have", "has", "am"], "شاهدت هذا الفيلم."], ["She has {written} the email.", ["written", "wrote", "write"], "كتبت البريد الإلكتروني."], ["Have you {ever} been to Paris?", ["ever", "never", "yet"], "هل سبق أن زرت باريس؟"], ["They haven't arrived {yet}.", ["yet", "already", "just"], "لم يصلوا بعد."]]
        },
        {
          t: "for / since", ta: "for و since", icon: "⏳",
          g: [
            { t: "مدة أم نقطة بداية؟",
              b: "• <i>for</i> + <b>مدة</b>: <i>for ten years</i> (لمدة عشر سنوات)<br>• <i>since</i> + <b>نقطة بداية</b>: <i>since 2015</i> · <i>since Monday</i>",
              ex: [["[I|s] [have lived|v] here [for ten years|t].", "أسكن هنا منذ عشر سنوات."], ["[She|s] [has worked|v] here [since 2015|t].", "تعمل هنا منذ 2015."]],
              q: { s: "He has been sick ___ Monday.", o: ["since", "for"], a: "since", w: "Monday نقطة بداية: since." } },
            { t: "التام أم الماضي البسيط؟",
              b: "إذا ذكرت <b>وقتاً منتهياً</b> (yesterday, last year, in 2010, ago) ← <b>الماضي البسيط</b>.<br>إذا كان الحدث مستمراً حتى الآن أو بلا وقت محدد ← <b>المضارع التام</b>.",
              ex: [["[I|s] [saw|v] him [yesterday|t].", "رأيته أمس."], ["[We|s] [moved|v] to Kuwait [in 2010|t].", "انتقلنا إلى الكويت عام 2010."], ["[How long|q] [have|x] [you|s] [known|v] her?", "منذ متى تعرفها؟"]] }
          ],
          vocab: [["for", "لمدة"], ["since", "منذ"], ["how long", "منذ متى"], ["year", "سنة"], ["month", "شهر"], ["recently", "مؤخراً"], ["project", "مشروع"], ["known", "عرف (تصريف ثالث)"]],
          sentences: [["I have lived here for ten years.", "أسكن هنا منذ عشر سنوات."], ["She has worked here since 2015.", "تعمل هنا منذ 2015."], ["I saw him yesterday.", "رأيته أمس."], ["How long have you known her?", "منذ متى تعرفها؟"], ["We moved to Kuwait in 2010.", "انتقلنا إلى الكويت عام 2010."]],
          blanks: [["I have worked here {for} five years.", ["for", "since", "from"], "أعمل هنا منذ خمس سنوات.", "five years مدة: for."], ["He has been sick {since} Monday.", ["since", "for", "ago"], "هو مريض منذ الاثنين.", "Monday نقطة بداية: since."], ["I {saw} her last night.", ["saw", "have seen", "see"], "رأيتها الليلة الماضية.", "last night وقت منتهٍ: ماضٍ بسيط."], ["How long {have} you lived here?", ["have", "did", "are"], "منذ متى تسكن هنا؟"]]
        },
        {
          t: "First Conditional", ta: "الشرط الأول", icon: "🔀",
          g: [
            { t: "الاحتمال الحقيقي",
              b: "لموقف محتمل في المستقبل ونتيجته.<br>⚠️ لا نضع will بعد if رغم أن المعنى مستقبلي:<br>❌ <i>If it will rain</i> · ✅ <i>If it rains</i>",
              f: [["If + مضارع بسيط", "t"], ["،", "x"], ["will + فعل مجرد", "v"]],
              ex: [["[If it rains|t], we [will stay|v] at home.", "إذا أمطرت، سنبقى في البيت."], ["[If you study|t], you [will pass|v].", "إذا درست، ستنجح."]],
              q: { s: "If you ___, you will catch the bus.", o: ["hurry", "will hurry"], a: "hurry", w: "بعد if نستخدم المضارع البسيط." } },
            { t: "تبديل الترتيب",
              b: "يمكنك البدء بالنتيجة، وعندها لا نحتاج فاصلة:<br><i>I will call you if I have time.</i>",
              ex: [["I [will call|v] you [if I have time|t].", "سأتصل بك إذا كان لدي وقت."]] }
          ],
          vocab: [["if", "إذا"], ["pass", "ينجح"], ["fail", "يرسب"], ["exam", "امتحان"], ["unless", "ما لم"], ["without", "بدون"], ["traffic", "زحمة مرور"], ["hurry", "يستعجل"]],
          sentences: [["If it rains, we will stay at home.", "إذا أمطرت، سنبقى في البيت."], ["If you study, you will pass.", "إذا درست، ستنجح."], ["I will call you if I have time.", "سأتصل بك إذا كان لدي وقت."], ["If he is late, we will start without him.", "إذا تأخر، سنبدأ بدونه."], ["What will you do if you lose your job?", "ماذا ستفعل إذا فقدت وظيفتك؟"]],
          blanks: [["If you {hurry}, you will catch the bus.", ["hurry", "will hurry", "hurried"], "إذا أسرعت ستلحق بالحافلة.", "بعد if مضارع بسيط."], ["If it is sunny, we {will} go to the beach.", ["will", "are", "would"], "إذا كان الجو مشمساً سنذهب إلى الشاطئ."], ["I will be angry if you {don't} come.", ["don't", "won't", "didn't"], "سأغضب إذا لم تأتِ."], ["{If} there is traffic, I'll be late.", ["If", "Will", "Than"], "إذا كانت هناك زحمة فسأتأخر."]]
        },
        {
          t: "should / must / have to", ta: "النصيحة والإلزام", icon: "⛑️",
          g: [
            { t: "should: النصيحة",
              b: "<i>should</i> + فعل مجرد = ينبغي / يُستحسن. والنفي: <i>shouldn't</i>.",
              ex: [["You [should|x] [drink|v] more water.", "ينبغي أن تشرب ماءً أكثر."], ["You [should|x] [see|v] a doctor.", "ينبغي أن تراجع طبيباً."]] },
            { t: "must و have to: الإلزام",
              b: "• <i>must</i> = إلزام قوي أو قاعدة رسمية (لافتات، أنظمة السلامة)<br>• <i>have to / has to</i> = التزام بسبب ظرف خارجي<br>⚠️ الفرق الأهم في النفي:<br><i>mustn't</i> = <b>ممنوع</b> · <i>don't have to</i> = <b>غير مطلوب</b> (أنت مخيّر)",
              ex: [["Workers [must|x] [wear|v] a helmet on site.", "يجب على العمال ارتداء الخوذة في الموقع."], ["You [mustn't|x] [smoke|v] here.", "يُمنع التدخين هنا."], ["You [don't have to|x] [come|v].", "ليس عليك أن تأتي."]],
              q: { s: "You ___ park here. It's forbidden.", o: ["mustn't", "don't have to"], a: "mustn't", w: "forbidden = ممنوع، فنستخدم mustn't." } }
          ],
          vocab: [["should", "ينبغي"], ["must", "يجب"], ["have to", "مضطر إلى"], ["helmet", "خوذة"], ["site", "موقع عمل"], ["safety", "سلامة"], ["rule", "قاعدة / نظام"], ["wear", "يرتدي"]],
          sentences: [["You should drink more water.", "ينبغي أن تشرب ماءً أكثر."], ["Workers must wear a helmet on site.", "يجب على العمال ارتداء الخوذة في الموقع."], ["I have to finish this today.", "عليّ إنهاء هذا اليوم."], ["You don't have to come.", "ليس عليك أن تأتي."], ["You mustn't smoke here.", "يُمنع التدخين هنا."]],
          blanks: [["You {should} see a doctor.", ["should", "must to", "have"], "ينبغي أن تراجع طبيباً."], ["She {has to} work on Saturday.", ["has to", "have to", "must to"], "عليها أن تعمل يوم السبت.", "مع she نستخدم has to."], ["You {mustn't} park here.", ["mustn't", "don't have to", "not must"], "يُمنع الوقوف هنا."], ["We don't {have} to wear a suit.", ["have", "has", "must"], "لسنا مضطرين لارتداء بدلة."]]
        }
      ]
    }
  ]
};
