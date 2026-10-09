// =============================================================================
// HARDWARE EXPLORER DATASET (ស្គាល់គ្រឿងកុំព្យូទ័រ និងឧបករណ៍សម្រាប់កុមារ និងសិស្ស)
// Designed for kids and students with simple analogies, fun facts & care tips.
// =============================================================================

export const hardwareCategories = [
  { id: "all", label: "ទាំងអស់ (All Devices)", icon: "💻" },
  { id: "input", label: "ឧបករណ៍បញ្ចូល (Input)", icon: "⌨️" },
  { id: "output", label: "ឧបករណ៍បញ្ចេញ (Output)", icon: "🖥️" },
  { id: "internal", label: "ខួរក្បាល & គ្រឿងក្នុង (Core/Internal)", icon: "🧠" },
  { id: "storage", label: "ឧបករណ៍ផ្ទុក & តភ្ជាប់ (Storage & Net)", icon: "💾" },
];

export const hardwareDevices = [
  // -------------------------------------------------------------
  // 1. INPUT DEVICES (ឧបករណ៍បញ្ជា និងបញ្ចូលព័ត៌មានទៅក្នុងកុំព្យូទ័រ)
  // -------------------------------------------------------------
  {
    id: "keyboard",
    nameKhmer: "ក្ដារចុច (Keyboard)",
    nameEnglish: "Computer Keyboard",
    category: "input",
    categoryLabel: "Input Device",
    icon: "⌨️",
    badge: "INPUT 01",
    accentColor: "#52c41a",
    deepColor: "#237804",
    roleSummary: "ប្រើសម្រាប់វាយអក្សរ លេខ និងបញ្ជាផ្លូវកាត់ (Shortcuts)",
    analogy: "ប្រៀបដូចជាប៊ិច ឬខ្មៅដៃឌីជីថល សម្រាប់សរសេរប្រាប់កុំព្យូទ័រ",
    whatItDoes:
      "ក្ដារចុចមានគ្រាប់ចុចជាច្រើនដូចជា អក្សរខ្មែរ/អង់គ្លេស លេខ សញ្ញា និងគ្រាប់ចុចពិសេសដូចជា Space, Enter, Shift, Backspace។ ពេលយើងចុចគ្រាប់ចុចណាមួយ កុំព្យូទ័រនឹងទទួលសញ្ញាហើយបង្ហាញលើអេក្រង់ភ្លាមៗ។",
    funFact:
      "ក្ដារចុចស្តង់ដារភាគច្រើនប្រើទម្រង់ 'QWERTY' ដែលត្រូវបានបង្កើតឡើងតាំងពីសម័យម៉ាស៊ីនអង្គុលីលេខជាង ១៥០ ឆ្នាំមុន!",
    careTips:
      "កុំញ៉ាំចំណី ឬផឹកទឹកក្បែរក្ដារចុច ព្រោះកម្ទេចនំ ឬទឹកអាចជ្រាបចូលធ្វើឱ្យខូចគ្រាប់ចុច។",
  },
  {
    id: "mouse",
    nameKhmer: "កណ្ដុរ (Mouse)",
    nameEnglish: "Computer Mouse / Trackpad",
    category: "input",
    categoryLabel: "Input Device",
    icon: "🖱️",
    badge: "INPUT 02",
    accentColor: "#1677ff",
    deepColor: "#0958d9",
    roleSummary: "ប្រើសម្រាប់ចង្អុល ចុច (Click) និងអូស (Drag & Drop) វត្ថុលើអេក្រង់",
    analogy: "ប្រៀបដូចជាម្រាមដៃចង្អុលរបស់យើង នៅក្នុងពិភពកុំព្យូទ័រ",
    whatItDoes:
      "Mouse មានប៊ូតុងឆ្វេង (Left-click សម្រាប់ជ្រើសរើស), ប៊ូតុងស្តាំ (Right-click សម្រាប់បើក Menu), និងកង់កណ្តាល (Scroll Wheel សម្រាប់រំកិលទំព័រឡើងចុះ)។ ចលនានៃ Mouse នឹងរំកិលសញ្ញាព្រួញ (Cursor) លើអេក្រង់។",
    funFact:
      "Mouse កុំព្យូទ័រដំបូងបង្អស់ត្រូវបានបង្កើតឡើងពី 'ឈើ' ក្នុងឆ្នាំ ១៩៦៤ ដោយលោក Douglas Engelbart!",
    careTips:
      "ប្រើប្រាស់ Mouse លើទ្រនាប់ Mouse Pad ស្អាត ដើម្បីឱ្យការរំកិលរលូនល្អ និងមិនឆ្កូតបាត Mouse។",
  },
  {
    id: "microphone",
    nameKhmer: "មីក្រូហ្វូន (Microphone)",
    nameEnglish: "Audio Microphone",
    category: "input",
    categoryLabel: "Input Device",
    icon: "🎙️",
    badge: "INPUT 03",
    accentColor: "#fa8c16",
    deepColor: "#d46b08",
    roleSummary: "ប្រើសម្រាប់ស្រូបសំឡេងនិយាយ ច្រៀង ឬបញ្ជាដោយសំឡេង (Voice)",
    analogy: "ប្រៀបដូចជាត្រចៀករបស់កុំព្យូទ័រ ដែលចាំស្តាប់សំឡេងយើង",
    whatItDoes:
      "មីក្រូហ្វូនបំលែងរលកសំឡេងនិយាយរបស់យើង ឱ្យទៅជាសញ្ញាឌីជីថល ដើម្បីឱ្យកុំព្យូទ័រអាចថតទុក និយាយក្នុង Zoom/Telegram ឬបញ្ជា Siri / Google Voice Search បាន។",
    funFact:
      "ឧបករណ៍ឆ្លាតវៃសព្វថ្ងៃអាចស្តាប់សំឡេងហើយបម្លែងទៅជាអក្សរ (Voice Typing) បានយ៉ាងរហ័សស្ទើរតែគ្រប់ភាសា!",
    careTips:
      "កុំផ្លុំខ្យល់ខ្លាំងៗ ឬគោះលើមីក្រូហ្វូន ព្រោះអាចធ្វើឱ្យខូចបន្ទះស្រូបសំឡេង (Diaphragm) ខាងក្នុង។",
  },
  {
    id: "webcam",
    nameKhmer: "កាមេរ៉ា (Webcam)",
    nameEnglish: "Web Camera",
    category: "input",
    categoryLabel: "Input Device",
    icon: "📷",
    badge: "INPUT 04",
    accentColor: "#722ed1",
    deepColor: "#531dab",
    roleSummary: "ប្រើសម្រាប់ចាប់យករូបភាព និងវីដេអូសម្រាប់រៀន Online ឬជជែកគ្នា",
    analogy: "ប្រៀបដូចជាភ្នែករបស់កុំព្យូទ័រ ដែលចាំមើលរូបភាពយើង",
    whatItDoes:
      "Webcam ថតយករូបភាពមុខរបស់យើងផ្ទាល់ ហើយបញ្ជូនទៅកាន់អ្នកម្ខាងទៀតតាមរយៈកម្មវិធីរៀន Online (ដូចជា Google Meet, Zoom) ឬសម្រាប់ស្កេនផ្ទៃមុខដោះសោរកុំព្យូទ័រ (Face ID)។",
    funFact:
      "Webcam ដំបូងគេត្រូវបានបង្កើតឡើងនៅសាកលវិទ្យាល័យ Cambridge ក្នុងឆ្នាំ ១៩៩១ គ្រាន់តែដើម្បីមើលថា 'តើកំសៀវកាហ្វេពេញ ឬអស់' ប៉ុណ្ណោះ!",
    careTips:
      "ពេលមិនប្រើប្រាស់ អាចបិទគម្របកាមេរ៉ា (Privacy Cover) ដើម្បីសុវត្ថិភាព និងការពារឯកជនភាពផ្ទាល់ខ្លួន។",
  },
  {
    id: "gamepad",
    nameKhmer: "ដៃបញ្ជាហ្គេម (Gamepad / Controller)",
    nameEnglish: "Gaming Controller",
    category: "input",
    categoryLabel: "Input Device",
    icon: "🎮",
    badge: "INPUT 05",
    accentColor: "#eb2f96",
    deepColor: "#c41d7f",
    roleSummary: "ឧបករណ៍បញ្ជាចលនាតួអង្គក្នុងការលេងហ្គេមកម្សាន្ត",
    analogy: "ប្រៀបដូចជាចង្កូតឡាន ឬដៃបញ្ជាយន្តហោះសម្រាប់ការកម្សាន្ត",
    whatItDoes:
      "Gamepad មានប៊ូតុង D-pad, Joystick និងប៊ូតុង Action ជាច្រើនដែលអនុញ្ញាតឱ្យយើងបញ្ជាតួអង្គក្នុងហ្គេមឱ្យរត់ លោត និងបត់បែនបានយ៉ាងរហ័ស និងងាយស្រួល។",
    funFact:
      "Gamepad ទំនើបៗមានប្រព័ន្ធញ័រ (Haptic Feedback) ដែលធ្វើឱ្យយើងមានអារម្មណ៍ដូចកំពុងនៅក្នុងសាច់រឿងហ្គេមពិតៗ!",
    careTips:
      "កុំចុច ឬទាញ Joystick ខ្លាំងៗហួសកម្លាំង ព្រោះអាចបណ្តាលឱ្យរអិលខូចទិសដៅ (Stick Drift)។",
  },

  // -------------------------------------------------------------
  // 2. OUTPUT DEVICES (ឧបករណ៍បញ្ចេញលទ្ធផល រូបភាព សំឡេង ឱ្យយើងឃើញ & ឮ)
  // -------------------------------------------------------------
  {
    id: "monitor",
    nameKhmer: "អេក្រង់ (Monitor / Screen)",
    nameEnglish: "Computer Display Monitor",
    category: "output",
    categoryLabel: "Output Device",
    icon: "🖥️",
    badge: "OUTPUT 01",
    accentColor: "#13c2c2",
    deepColor: "#08979c",
    roleSummary: "បង្ហាញរូបភាព អក្សរ វីដេអូ និងកម្មវិធីគ្រប់យ៉ាងឱ្យយើងមើលឃើញ",
    analogy: "ប្រៀបដូចជាក្តារខៀន ឬទូរទស្សន៍ ដែលបង្ហាញគ្រប់សកម្មភាពក្នុងកុំព្យូទ័រ",
    whatItDoes:
      "អេក្រង់ផ្សំឡើងពីចំណុចពន្លឺតូចៗរាប់លាន (ហៅថា Pixels)។ នៅពេលកុំព្យូទ័រដំណើរការ វាបញ្ជូនសញ្ញារូបភាពមកកាន់អេក្រង់ដើម្បីបង្កើតជារូបភាព អត្ថបទ ហ្គេម និងវីដេអូយ៉ាងច្បាស់ត្រជាក់ភ្នែក។",
    funFact:
      "អេក្រង់កុំព្យូទ័របង្ហាញរូបភាពឡើងវិញ (Refresh) ពី ៦០ ទៅ ១៤៤ ដងក្នុងមួយវិនាទី (60Hz - 144Hz)!",
    careTips:
      "កុំយកដៃ ឬវត្ថុរឹងទៅចុចលើផ្ទៃអេក្រង់ ហើយត្រូវជូតសម្អាតដោយក្រណាត់ទន់កុំប្រើទឹកធម្មតា។ អង្គុយឱ្យឆ្ងាយពីអេក្រង់ប្រហែលមួយប្រវែងដៃដើម្បីការពារភ្នែក។",
  },
  {
    id: "speaker",
    nameKhmer: "ឧបករណ៍បំពងសំឡេង (Speakers)",
    nameEnglish: "Audio Speakers",
    category: "output",
    categoryLabel: "Output Device",
    icon: "🔊",
    badge: "OUTPUT 02",
    accentColor: "#faad14",
    deepColor: "#d48806",
    roleSummary: "បញ្ចេញសំឡេងតន្ត្រី សំឡេងមេរៀន និងសំឡេងហ្គេមឱ្យឮច្បាស់",
    analogy: "ប្រៀបដូចជាមាត់របស់កុំព្យូទ័រ ដែលនិយាយ ឬច្រៀងឱ្យយើងស្តាប់",
    whatItDoes:
      "Speaker ទទួលសញ្ញាឌីជីថលពីកុំព្យូទ័រ ហើយបំលែងជារំញ័រខ្យល់បង្កើតជាសំឡេងតន្ត្រី ការសន្ទនា ឬសំឡេង Notification ផ្សេងៗ។",
    funFact:
      "កុំព្យូទ័រ Laptop ភាគច្រើនមាន Speaker តូចៗបង្កប់ស្រាប់នៅខាងក្នុងតួម៉ាស៊ីន!",
    careTips:
      "កុំបើកកម្រិតសំឡេង (Volume) ដល់ ១០០% យូរពេក ព្រោះអាចធ្វើឱ្យបែកសំឡេង ឬប៉ះពាល់ដល់ការស្តាប់។",
  },
  {
    id: "headphones",
    nameKhmer: "កាស (Headphones / Earphones)",
    nameEnglish: "Personal Headphones",
    category: "output",
    categoryLabel: "Output Device",
    icon: "🎧",
    badge: "OUTPUT 03",
    accentColor: "#2f54eb",
    deepColor: "#1d39c4",
    roleSummary: "សម្រាប់ស្តាប់សំឡេងផ្ទាល់ខ្លួនដោយមិនរំខានដល់អ្នកដទៃជុំវិញ",
    analogy: "ប្រៀបដូចជាឧបករណ៍បំពងសំឡេងផ្ទាល់ខ្លួនសម្រាប់តែត្រចៀកយើងម្នាក់",
    whatItDoes:
      "កាសជួយឱ្យយើងស្តាប់មេរៀន ចម្រៀង ឬលេងហ្គេមបានយ៉ាងច្បាស់ និងផ្តោតអារម្មណ៍បានល្អ ដោយមិនឮទៅអ្នកជិតខាង។ កាសខ្លះមានបំពាក់មីក្រូហ្វូនជាប់ជាមួយ (Headset) សម្រាប់និយាយបានថែមទៀត។",
    funFact:
      "កាសទំនើបៗមានបច្ចេកវិទ្យា 'Noise Cancelling' ដែលអាចកាត់ផ្តាច់សំឡេងរំខានពីខាងក្រៅបានយ៉ាងអស្ចារ្យ!",
    careTips:
      "កុំស្តាប់សំឡេងឮខ្លាំងពេកយូរម៉ោង ហើយត្រូវសម្រាកត្រចៀកជារៀងរាល់ ៦០ នាទីម្តង។",
  },
  {
    id: "printer",
    nameKhmer: "ម៉ាស៊ីនព្រីន (Printer)",
    nameEnglish: "Document & Photo Printer",
    category: "output",
    categoryLabel: "Output Device",
    icon: "🖨️",
    badge: "OUTPUT 04",
    accentColor: "#52c41a",
    deepColor: "#135200",
    roleSummary: "ព្រីនអត្ថបទ និងរូបភាពពីកុំព្យូទ័រចេញមកលើក្រដាសពិតៗ",
    analogy: "ប្រៀបដូចជាអ្នកគូរគំនូរ ឬអ្នកចម្លងសៀវភៅស្វ័យប្រវត្តិចេញមកលើក្រដាស",
    whatItDoes:
      "ម៉ាស៊ីនព្រីនប្រើប្រាស់ទឹកថ្នាំ (Ink) ឬម្សៅកម្តៅ (Laser Toner) ដើម្បីបាញ់ ឬផ្តិតរូបភាពនិងអត្ថបទពីកុំព្យូទ័រចេញមកលើក្រដាស A4 យ៉ាងស្រស់ស្អាត។",
    funFact:
      "សព្វថ្ងៃនេះមានទាំង '3D Printer' ដែលអាចព្រីនចេញជារូបរាងវត្ថុពិតៗដូចជា ប្រដាប់ក្មេងលេង ផ្ទះ និងគ្រឿងបន្លាស់បានថែមទៀត!",
    careTips:
      "កុំទាញក្រដាសជាប់ខ្លាំងៗ ត្រូវបិទម៉ាស៊ីនរួចទាញក្រដាសថ្នមៗដើម្បីកុំឱ្យខូចកង់វិលខាងក្នុង។",
  },

  // -------------------------------------------------------------
  // 3. CORE & INTERNAL BRAIN (ខួរក្បាល និងគ្រឿងខាងក្នុងកុំព្យូទ័រ)
  // -------------------------------------------------------------
  {
    id: "cpu",
    nameKhmer: "ខួរក្បាលកណ្តាល (CPU)",
    nameEnglish: "Central Processing Unit (CPU)",
    category: "internal",
    categoryLabel: "Core / Brain",
    icon: "🧠",
    badge: "CORE 01",
    accentColor: "#722ed1",
    deepColor: "#391085",
    roleSummary: "ខួរក្បាលចម្បងដែលគិត គណនា និងបញ្ជាគ្រប់ផ្នែកក្នុងកុំព្យូទ័រ",
    analogy: "ប្រៀបដូចជាខួរក្បាលរបស់មនុស្ស ដែលគិត និងបញ្ជាគ្រប់សកម្មភាពនៃរាងកាយ",
    whatItDoes:
      "CPU គឺជាបន្ទះឈីបតូចមួយតែមានថាមពលមហាសាល។ រាល់ពេលយើងចុច Mouse វាយអក្សរ បើកកម្មវិធី ឬលេងហ្គេម CPU ធ្វើការគណនារាប់ពាន់លានដងក្នុងមួយវិនាទីដើម្បីឱ្យកុំព្យូទ័រដំណើរការទៅមុខបាន។",
    funFact:
      "នៅលើបន្ទះ CPU តូចប៉ុនមេដៃ មានត្រង់ស៊ីស្ទ័រតូចៗរាប់ពាន់លានគ្រាប់ ដែលតូចជាងសរសៃសក់មនុស្សរាប់ពាន់ដង!",
    careTips:
      "CPU ត្រូវការកង្ហារ (Cooler) ជួយបក់ឱ្យត្រជាក់ជានិច្ច កុំបិទរន្ធខ្យល់របស់កុំព្យូទ័រឱ្យសោះ។",
  },
  {
    id: "ram",
    nameKhmer: "អង្គចងចាំបណ្តោះអាសន្ន (RAM)",
    nameEnglish: "Random Access Memory (RAM)",
    category: "internal",
    categoryLabel: "Core / Memory",
    icon: "⚡",
    badge: "CORE 02",
    accentColor: "#1677ff",
    deepColor: "#002c8c",
    roleSummary: "ផ្ទុកទិន្នន័យកម្មវិធីដែលកំពុងបើកប្រើប្រាស់ ដើម្បីឱ្យដំណើរការលឿន",
    analogy: "ប្រៀបដូចជាតុធ្វើការ — បើតុកាន់តែធំ យើងអាចដាក់សៀវភៅបើកមើលបានច្រើនក្នុងពេលតែមួយ",
    whatItDoes:
      "RAM ផ្ទុកទិន្នន័យនៃកម្មវិធីដែលអ្នកកំពុងបើក (ដូចជា Google Chrome, ហ្គេម, Word)។ បើកុំព្យូទ័រមាន RAM កាន់តែច្រើន អ្នកអាចបើកកម្មវិធីច្រើនក្នុងពេលតែមួយដោយមិនគាំង ឬយឺតឡើយ។",
    funFact:
      "នៅពេលយើងបិទកុំព្យូទ័រ (Shutdown) ទិន្នន័យទាំងអស់នៅក្នុង RAM នឹងត្រូវលុបស្អាតអស់ដោយស្វ័យប្រវត្តិ!",
    careTips:
      "បើកុំព្យូទ័រដើរយឺតពេលបើកកម្មវិធីច្រើន សាកល្បងបិទផ្ទាំង Tab ដែលមិនប្រើប្រាស់ដើម្បីសន្សំទំហំ RAM។",
  },
  {
    id: "storage-ssd",
    nameKhmer: "ដ្រាយផ្ទុកឯកសារ (SSD / Hard Drive)",
    nameEnglish: "Solid State Drive (SSD / HDD)",
    category: "storage",
    categoryLabel: "Storage",
    icon: "💾",
    badge: "STORAGE 01",
    accentColor: "#fa8c16",
    deepColor: "#873800",
    roleSummary: "កន្លែងរក្សាទុកឯកសារ រូបថត ហ្គេម និងប្រព័ន្ធ Windows ជារៀងរហូត",
    analogy: "ប្រៀបដូចជាទូដាក់សៀវភៅ ឬកាតាបធំមួយ ដែលទុករបស់របរមិនបាត់បង់ទោះបិទភ្លើងក៏ដោយ",
    whatItDoes:
      "SSD និង Hard Drive រក្សាទុកគ្រប់ទិន្នន័យរបស់អ្នក ដូចជាវីដេអូ រូបថត មេរៀន និងកម្មវិធីទាំងអស់។ ទោះបីយើងបិទកុំព្យូទ័រ ឬដាច់ភ្លើងក៏ទិន្នន័យនៅតែមានសុវត្ថិភាពដដែល។ SSD ទំនើបដំណើរការលឿនជាង Hard Drive ចាស់ៗរហូតដល់ ១០ ដង!",
    funFact:
      "Hard Drive ដំបូងបង្អស់របស់ក្រុមហ៊ុន IBM ក្នុងឆ្នាំ ១៩៥៦ មានទំហំធំប៉ុនទូទឹកកក ប៉ុន្តែផ្ទុកទិន្នន័យបានត្រឹមតែ 5 Megabytes ប៉ុណ្ណោះ (ស្មើនឹងរូបថត ១ សន្លឹកសព្វថ្ងៃ)!",
    careTips:
      "កុំអង្រួន ឬទម្លាក់កុំព្យូទ័រពេលកំពុងដំណើរការ ព្រោះអាចធ្វើឱ្យខូចដ្រាយផ្ទុកទិន្នន័យខាងក្នុង។",
  },
  {
    id: "gpu",
    nameKhmer: "កាតក្រាហ្វិក (GPU / Graphics Card)",
    nameEnglish: "Graphics Processing Unit (GPU)",
    category: "internal",
    categoryLabel: "Core / Visual",
    icon: "🎨",
    badge: "CORE 03",
    accentColor: "#eb2f96",
    deepColor: "#780650",
    roleSummary: "បង្កើត និងគូសរូបភាព 3D វីដេអូ និងចលនាហ្គេមឱ្យមានភាពស្រស់ស្អាត",
    analogy: "ប្រៀបដូចជាវិចិត្រករគំនូរឌីជីថល ដែលគូររូបភាព និងចលនាយ៉ាងរហ័សលើអេក្រង់",
    whatItDoes:
      "GPU ទទួលខុសត្រូវលើការបង្ហាញរូបភាព 3D, Effect ពន្លឺ, ស្រមោល និងការកាត់តវីដេអូ។ បើគ្មាន GPU ល្អទេ ហ្គេម 3D ឬគំនូរជីវចលនឹងដើរយឺត ឬកន្ត្រាក់។",
    funFact:
      "បច្ចុប្បន្ន GPU ត្រូវបានគេយកទៅប្រើក្នុងការបង្វឹកបញ្ញាសិប្បនិម្មិត (AI) ដូចជា ChatGPT និងរថយន្តបើកបរស្វ័យប្រវត្តិទៀតផង!",
    careTips:
      "ជៀសវាងលេងហ្គេមធំៗលើផ្ទៃពូក ឬភួយ ព្រោះកម្តៅ GPU មិនអាចបញ្ចេញក្រៅបានល្អ។",
  },
  {
    id: "motherboard",
    nameKhmer: "បន្ទះមេ (Motherboard)",
    nameEnglish: "Main Motherboard",
    category: "internal",
    categoryLabel: "Core / System",
    icon: "🔌",
    badge: "CORE 04",
    accentColor: "#13c2c2",
    deepColor: "#00474f",
    roleSummary: "បន្ទះសៀគ្វីធំដែលតភ្ជាប់គ្រប់គ្រឿងទាំងអស់ឱ្យស្គាល់គ្នា និងដំណើរការរួមគ្នា",
    analogy: "ប្រៀបដូចជាទីក្រុង ឬឆ្អឹងខ្នង ដែលមានផ្លូវតភ្ជាប់គ្រប់ផ្ទះ និងសរីរាង្គទាំងអស់",
    whatItDoes:
      "Motherboard គឺជាបន្ទះសៀគ្វីធំជាងគេក្នុងកុំព្យូទ័រ។ CPU, RAM, SSD, GPU, Mouse, Keyboard ទាំងអស់សុទ្ធតែដោតភ្ជាប់ទៅលើ Motherboard ដើម្បីអាចបញ្ជូនទិន្នន័យទៅវិញទៅមកបាន។",
    funFact:
      "Motherboard ត្រូវបានគេហៅថា 'មេ' (Mother) ព្រោះវាជាម្តាយដែលមើលថែ និងផ្តល់ផ្លូវទាក់ទងដល់កូនៗគ្រឿងបន្លាស់ទាំងអស់!",
    careTips:
      "កុំប៉ះពាល់ផ្ទៃសៀគ្វីពេលដៃមានសំណើម ឬធូលីច្រើន។",
  },

  // -------------------------------------------------------------
  // 4. STORAGE & CONNECTIVITY (ឧបករណ៍ផ្ទុកចល័ត & ការតភ្ជាប់បណ្តាញ)
  // -------------------------------------------------------------
  {
    id: "usb-flash",
    nameKhmer: "យូអេសប៊ី (USB Flash Drive)",
    nameEnglish: "USB Flash Memory Drive",
    category: "storage",
    categoryLabel: "Storage & Connect",
    icon: "🔌",
    badge: "STORAGE 02",
    accentColor: "#52c41a",
    deepColor: "#237804",
    roleSummary: "ដ្រាយផ្ទុកឯកសារតូចមួយ ងាយស្រួលដាក់តាមហោប៉ៅចល័ត",
    analogy: "ប្រៀបដូចជាកាបូបយួរដៃតូចមួយ សម្រាប់ចម្លងឯកសារយកទៅរៀននៅសាលា",
    whatItDoes:
      "USB Flash Drive ប្រើសម្រាប់ចម្លងមេរៀន រូបថត ឬចម្រៀងពីកុំព្យូទ័រមួយ យកទៅបើកនៅលើកុំព្យូទ័រមួយទៀតបានយ៉ាងងាយស្រួលដោយគ្រាន់តែដោតចូលរន្ធ USB។",
    funFact:
      "USB Flash Drive តូចមួយសព្វថ្ងៃ អាចផ្ទុកសៀវភៅមេរៀនបានរាប់រយពាន់ក្បាល!",
    careTips:
      "មុនពេលដក USB ចេញពីកុំព្យូទ័រ គួរចុច 'Eject' ជាមុនសិន ដើម្បីការពារកុំឱ្យខូចឯកសារខាងក្នុង។",
  },
  {
    id: "wifi-router",
    nameKhmer: "រ៉ោតទ័រវ៉ាយហ្វាយ (Wi-Fi Router)",
    nameEnglish: "Wireless Network Router",
    category: "storage",
    categoryLabel: "Storage & Connect",
    icon: "📡",
    badge: "NETWORK 01",
    accentColor: "#1677ff",
    deepColor: "#003a8c",
    roleSummary: "បញ្ជូនរលកសញ្ញាអ៊ីនធឺណិតឥតខ្សែទៅកាន់កុំព្យូទ័រ ទូរស័ព្ទ និងថេប្លេត",
    analogy: "ប្រៀបដូចជាស្ពានតភ្ជាប់ផ្ទះរបស់យើង ទៅកាន់បណ្តាញពិភពលោកទាំងមូល",
    whatItDoes:
      "Wi-Fi Router ទទួលសញ្ញាអ៊ីនធឺណិតពីខ្សែអុបទិក រួចបាញ់រលកសញ្ញាឥតខ្សែ (Wi-Fi) ជុំវិញផ្ទះ ដើម្បីឱ្យកុំព្យូទ័រ និងទូរស័ព្ទអាចចូលលេងអ៊ីនធឺណិត រៀន YouTube និងស្វែងរកមេរៀនបាន។",
    funFact:
      "ពាក្យថា 'Wi-Fi' ប្រើរលកវិទ្យុ (Radio Waves) ដូចគ្នានឹងរលកវិទ្យុដែលបញ្ជូនទៅកាន់ឡានដែរ!",
    careTips:
      "ដាក់ Router នៅទីតាំងខ្ពស់កណ្តាលផ្ទះ ជៀសវាងជញ្ជាំងក្រាស់ ដើម្បីឱ្យសញ្ញា Wi-Fi ខ្លាំងល្អ។",
  },
];

export function getDevicesByCategory(category = "all") {
  if (category === "all") return hardwareDevices;
  return hardwareDevices.filter((d) => d.category === category);
}

export function getDeviceById(id) {
  return hardwareDevices.find((d) => d.id === id);
}
