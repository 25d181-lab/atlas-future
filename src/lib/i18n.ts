import { create } from "zustand";

export type Lang = "en" | "kn" | "hi" | "ta" | "te";

export const LANGUAGES: { code: Lang; label: string; native: string; speech: string; stt: string }[] = [
  { code: "en", label: "English", native: "English", speech: "en-IN", stt: "en" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN", stt: "kn" },
  { code: "hi", label: "Hindi", native: "हिंदी", speech: "hi-IN", stt: "hi" },
  { code: "ta", label: "Tamil", native: "தமிழ்", speech: "ta-IN", stt: "ta" },
  { code: "te", label: "Telugu", native: "తెలుగు", speech: "te-IN", stt: "te" },
];

type Dict = Record<string, string>;

const en: Dict = {
  tagline: "Decision Intelligence Infrastructure for Agriculture",
  farmerView: "Farmer View",
  adminView: "FPO / Admin",
  quote: "“The farmer doesn't operate AI. AI works for the farmer.”",
  demoNote:
    "Demo mode: all market, warehouse, weather and logistics data is simulated with realistic Karnataka figures.",
  assistant: "ATLAS Assistant",
  online: "online · WhatsApp (simulated)",
  newChat: "New chat",
  working: "ATLAS agents are working…",
  yesProceed: "Yes, proceed",
  notNow: "Not now",
  typeYes: 'Type "Yes" to confirm',
  typeOrMic: "Type or tap the mic…",
  recording: "Recording… tap to stop",
  transcribing: "Transcribing your voice note…",
  micDenied: "Microphone access is needed to record.",
  tooShort: "That recording was empty — please try again.",
  voiceNote: "Voice note",
  send: "Send",
  language: "Language",
  greeting:
    "Namaskara Ramesh 🙏 I am ATLAS. Send me a voice note or a message when your harvest is ready — I'll handle the rest.",
  readyNext: "Ready for your next harvest. Just tell me what you picked and where.",
  gotIt: "Got it — {tonnes} t of {crop} in {village}. Putting my team to work now…",
  shallProceed: 'Shall I proceed? Reply "Yes" and I will lock everything.',
  approved: "Yes, go ahead ✅",
  s1: "I harvested 2 tons of tomatoes in Vemagal",
  s2: "1.2 tonnes tomato ready in Sugatur",
  s3: "3 tons of ragi at Malur",
};

const kn: Dict = {
  tagline: "ಕೃಷಿಗಾಗಿ ನಿರ್ಧಾರ ಬುದ್ಧಿಮತ್ತೆ ಮೂಲಸೌಕರ್ಯ",
  farmerView: "ರೈತ ನೋಟ",
  adminView: "ಎಫ್‌ಪಿಒ / ಆಡಳಿತ",
  quote: "“ರೈತ AI ಅನ್ನು ನಡೆಸುವುದಿಲ್ಲ. AI ರೈತನಿಗಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.”",
  demoNote:
    "ಡೆಮೊ ಮೋಡ್: ಎಲ್ಲಾ ಮಾರುಕಟ್ಟೆ, ಗೋದಾಮು, ಹವಾಮಾನ ಮತ್ತು ಸಾಗಣೆ ಮಾಹಿತಿ ಕರ್ನಾಟಕದ ವಾಸ್ತವಿಕ ಅಂಕಿಅಂಶಗಳೊಂದಿಗೆ ಅನುಕರಿಸಲಾಗಿದೆ.",
  assistant: "ATLAS ಸಹಾಯಕ",
  online: "ಆನ್‌ಲೈನ್ · ವಾಟ್ಸ್‌ಆ್ಯಪ್ (ಅನುಕರಣೆ)",
  newChat: "ಹೊಸ ಚಾಟ್",
  working: "ATLAS ಏಜೆಂಟ್‌ಗಳು ಕೆಲಸ ಮಾಡುತ್ತಿವೆ…",
  yesProceed: "ಹೌದು, ಮುಂದುವರಿಸಿ",
  notNow: "ಈಗ ಬೇಡ",
  typeYes: '"ಹೌದು" ಎಂದು ಟೈಪ್ ಮಾಡಿ',
  typeOrMic: "ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ…",
  recording: "ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ… ನಿಲ್ಲಿಸಲು ಒತ್ತಿ",
  transcribing: "ನಿಮ್ಮ ಧ್ವನಿ ಸಂದೇಶ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ…",
  micDenied: "ರೆಕಾರ್ಡ್ ಮಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಬೇಕು.",
  tooShort: "ರೆಕಾರ್ಡಿಂಗ್ ಖಾಲಿಯಾಗಿತ್ತು — ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  voiceNote: "ಧ್ವನಿ ಸಂದೇಶ",
  send: "ಕಳುಹಿಸಿ",
  language: "ಭಾಷೆ",
  greeting:
    "ನಮಸ್ಕಾರ ರಮೇಶ್ 🙏 ನಾನು ATLAS. ನಿಮ್ಮ ಬೆಳೆ ಸಿದ್ಧವಾದಾಗ ಧ್ವನಿ ಸಂದೇಶ ಅಥವಾ ಸಂದೇಶ ಕಳುಹಿಸಿ — ಉಳಿದದ್ದನ್ನು ನಾನು ನೋಡಿಕೊಳ್ಳುತ್ತೇನೆ.",
  readyNext: "ಮುಂದಿನ ಸುಗ್ಗಿಗೆ ಸಿದ್ಧ. ಏನು ಕೊಯ್ದಿರಿ ಮತ್ತು ಎಲ್ಲಿ ಎಂದು ಹೇಳಿ.",
  gotIt: "ಸರಿ — {village} ನಲ್ಲಿ {tonnes} ಟನ್ {crop}. ನನ್ನ ತಂಡವನ್ನು ಕೆಲಸಕ್ಕೆ ಹಚ್ಚುತ್ತಿದ್ದೇನೆ…",
  shallProceed: 'ಮುಂದುವರಿಯಲೇ? "ಹೌದು" ಎಂದು ಉತ್ತರಿಸಿ, ನಾನು ಎಲ್ಲವನ್ನೂ ಖಚಿತಪಡಿಸುತ್ತೇನೆ.',
  approved: "ಹೌದು, ಮುಂದುವರಿಸಿ ✅",
  s1: "ವೇಮಗಲ್‌ನಲ್ಲಿ 2 ಟನ್ ಟೊಮ್ಯಾಟೊ ಕೊಯ್ದಿದ್ದೇನೆ",
  s2: "ಸುಗಟೂರಿನಲ್ಲಿ 1.2 ಟನ್ ಟೊಮ್ಯಾಟೊ ಸಿದ್ಧ",
  s3: "ಮಾಲೂರಿನಲ್ಲಿ 3 ಟನ್ ರಾಗಿ",
};

const hi: Dict = {
  tagline: "कृषि के लिए निर्णय बुद्धिमत्ता अवसंरचना",
  farmerView: "किसान व्यू",
  adminView: "एफपीओ / एडमिन",
  quote: "“किसान AI नहीं चलाता। AI किसान के लिए काम करता है।”",
  demoNote:
    "डेमो मोड: सभी बाज़ार, गोदाम, मौसम और परिवहन डेटा वास्तविक कर्नाटक आंकड़ों के साथ सिम्युलेटेड है।",
  assistant: "ATLAS सहायक",
  online: "ऑनलाइन · व्हाट्सएप (सिम्युलेटेड)",
  newChat: "नई चैट",
  working: "ATLAS एजेंट काम कर रहे हैं…",
  yesProceed: "हाँ, आगे बढ़ें",
  notNow: "अभी नहीं",
  typeYes: '"हाँ" टाइप करें',
  typeOrMic: "टाइप करें या माइक दबाएँ…",
  recording: "रिकॉर्डिंग… रोकने के लिए दबाएँ",
  transcribing: "आपका वॉइस नोट लिखा जा रहा है…",
  micDenied: "रिकॉर्ड करने के लिए माइक्रोफ़ोन की अनुमति चाहिए।",
  tooShort: "रिकॉर्डिंग खाली थी — कृपया फिर कोशिश करें।",
  voiceNote: "वॉइस नोट",
  send: "भेजें",
  language: "भाषा",
  greeting:
    "नमस्कार रमेश 🙏 मैं ATLAS हूँ। फसल तैयार होते ही मुझे वॉइस नोट या संदेश भेजें — बाकी मैं संभाल लूँगा।",
  readyNext: "अगली फसल के लिए तैयार। बताइए क्या और कहाँ काटा।",
  gotIt: "समझ गया — {village} में {tonnes} टन {crop}. अपनी टीम को काम पर लगा रहा हूँ…",
  shallProceed: 'क्या मैं आगे बढ़ूँ? "हाँ" कहें और मैं सब तय कर दूँगा।',
  approved: "हाँ, आगे बढ़ें ✅",
  s1: "मैंने वेमगल में 2 टन टमाटर काटे",
  s2: "सुगटूर में 1.2 टन टमाटर तैयार",
  s3: "मालूर में 3 टन रागी",
};

const ta: Dict = {
  tagline: "விவசாயத்திற்கான முடிவு நுண்ணறிவு அமைப்பு",
  farmerView: "விவசாயி பார்வை",
  adminView: "எஃப்பிஓ / நிர்வாகம்",
  quote: "“விவசாயி AI-ஐ இயக்கவில்லை. AI விவசாயிக்காக வேலை செய்கிறது.”",
  demoNote:
    "டெமோ முறை: அனைத்து சந்தை, கிடங்கு, வானிலை மற்றும் போக்குவரத்து தரவும் கர்நாடகா புள்ளிவிவரங்களுடன் உருவகப்படுத்தப்பட்டது.",
  assistant: "ATLAS உதவியாளர்",
  online: "ஆன்லைன் · வாட்ஸ்அப் (உருவகம்)",
  newChat: "புதிய அரட்டை",
  working: "ATLAS முகவர்கள் வேலை செய்கிறார்கள்…",
  yesProceed: "ஆம், தொடரவும்",
  notNow: "இப்போது வேண்டாம்",
  typeYes: '"ஆம்" எனத் தட்டச்சு செய்யவும்',
  typeOrMic: "தட்டச்சு செய்யவும் அல்லது மைக்கை அழுத்தவும்…",
  recording: "பதிவு… நிறுத்த அழுத்தவும்",
  transcribing: "உங்கள் குரல் குறிப்பு எழுத்தாக்கப்படுகிறது…",
  micDenied: "பதிவு செய்ய மைக்ரோஃபோன் அனுமதி தேவை.",
  tooShort: "பதிவு காலியாக இருந்தது — மீண்டும் முயற்சிக்கவும்.",
  voiceNote: "குரல் குறிப்பு",
  send: "அனுப்பு",
  language: "மொழி",
  greeting:
    "வணக்கம் ரமேஷ் 🙏 நான் ATLAS. அறுவடை தயாரானதும் எனக்கு குரல் குறிப்பு அல்லது செய்தி அனுப்புங்கள் — மீதியை நான் பார்த்துக்கொள்கிறேன்.",
  readyNext: "அடுத்த அறுவடைக்கு தயார். என்ன, எங்கே அறுவடை செய்தீர்கள் என்று சொல்லுங்கள்.",
  gotIt: "சரி — {village}-ல் {tonnes} டன் {crop}. என் குழுவை வேலைக்கு அமர்த்துகிறேன்…",
  shallProceed: 'தொடரலாமா? "ஆம்" என்று பதிலளியுங்கள், அனைத்தையும் உறுதி செய்கிறேன்.',
  approved: "ஆம், தொடரவும் ✅",
  s1: "வேமகல்லில் 2 டன் தக்காளி அறுவடை செய்தேன்",
  s2: "சுகடூரில் 1.2 டன் தக்காளி தயார்",
  s3: "மாலூரில் 3 டன் ராகி",
};

const te: Dict = {
  tagline: "వ్యవసాయం కోసం నిర్ణయ మేధస్సు మౌలిక సదుపాయం",
  farmerView: "రైతు వీక్షణ",
  adminView: "ఎఫ్‌పిఓ / అడ్మిన్",
  quote: "“రైతు AIని నడపడు. AI రైతు కోసం పనిచేస్తుంది.”",
  demoNote:
    "డెమో మోడ్: అన్ని మార్కెట్, గోదాము, వాతావరణ మరియు రవాణా డేటా కర్ణాటక వాస్తవ గణాంకాలతో అనుకరించబడింది.",
  assistant: "ATLAS సహాయకుడు",
  online: "ఆన్‌లైన్ · వాట్సాప్ (అనుకరణ)",
  newChat: "కొత్త చాట్",
  working: "ATLAS ఏజెంట్లు పనిచేస్తున్నారు…",
  yesProceed: "అవును, కొనసాగించు",
  notNow: "ఇప్పుడు వద్దు",
  typeYes: '"అవును" అని టైప్ చేయండి',
  typeOrMic: "టైప్ చేయండి లేదా మైక్ నొక్కండి…",
  recording: "రికార్డింగ్… ఆపడానికి నొక్కండి",
  transcribing: "మీ వాయిస్ నోట్ రాయబడుతోంది…",
  micDenied: "రికార్డ్ చేయడానికి మైక్రోఫోన్ అనుమతి కావాలి.",
  tooShort: "రికార్డింగ్ ఖాళీగా ఉంది — మళ్లీ ప్రయత్నించండి.",
  voiceNote: "వాయిస్ నోట్",
  send: "పంపు",
  language: "భాష",
  greeting:
    "నమస్కారం రమేష్ 🙏 నేను ATLAS. పంట సిద్ధమైనప్పుడు నాకు వాయిస్ నోట్ లేదా సందేశం పంపండి — మిగిలింది నేను చూసుకుంటాను.",
  readyNext: "తదుపరి పంటకు సిద్ధం. ఏమి, ఎక్కడ కోశారో చెప్పండి.",
  gotIt: "సరే — {village}లో {tonnes} టన్నుల {crop}. నా బృందాన్ని పనిలో పెడుతున్నాను…",
  shallProceed: 'కొనసాగించనా? "అవును" అని బదులివ్వండి, అన్నీ ఖరారు చేస్తాను.',
  approved: "అవును, కొనసాగించు ✅",
  s1: "వేమగల్‌లో 2 టన్నుల టమాటా కోశాను",
  s2: "సుగటూరులో 1.2 టన్నుల టమాటా సిద్ధం",
  s3: "మాలూరులో 3 టన్నుల రాగి",
};

const DICTS: Record<Lang, Dict> = { en, kn, hi, ta, te };

type I18nState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

export const useI18n = create<I18nState>((set) => ({
  lang: "en",
  setLang: (lang) => set({ lang }),
}));

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let value = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
  }
  return value;
}

export function useT() {
  const lang = useI18n((s) => s.lang);
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export function t(key: string, vars?: Record<string, string | number>) {
  return translate(useI18n.getState().lang, key, vars);
}

export function currentSpeechLang() {
  const lang = useI18n.getState().lang;
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]!;
}
