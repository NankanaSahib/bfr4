import React, { useState } from "react";
import { Printer, Share2, ArrowLeft, Check, Sparkles, AlertCircle, FileText, Download, RefreshCw, Copy, Edit3, RotateCcw } from "lucide-react";
import { FIRData, ManualFields, PW1_INFORMER_TEMPLATE, PW1_DIRECT_RECOVERY_TEMPLATE, PW2_MOHARRAR_TEMPLATE, PW3_INFORMER_TEMPLATE, PW3_DIRECT_RECOVERY_TEMPLATE, Statement342Question, generateStatement342Questions } from "../types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro"; // supports modern oklch() colours used by Tailwind v4
import { proofreadUrduText } from "../utils/urduProofreader";
import { isNativeApp, asciiFileName, savePdfOnAndroid } from "../utils/native";

interface GeneratedEvidenceScreenProps {
  data: FIRData;
  fields: ManualFields;
  onBack: () => void;
}

const nameTranslationMap: Record<string, string> = {
  // Sadr / Nankana Sahib mappings
  "sadda": "صدر",
  "sadar": "صدر",
  "saddar": "صدر",
  "nankana": "ننکانہ",
  "sahib": "صاحب",
  "city": "سٹی",
  "cantt": "کینٹ",
  "yasin": "یاسین",
  "sufyan": "سفیان",
  "abid": "عابد",
  "ahsan": "احسن",
  "kot": "کوٹ",
  "lahna": "لہنا",
  "das": "داس",
  
  // Specific preferred court spellings & places
  "faizabad": "فیض آباد",
  "faiz abad": "فیض آباد",
  "sajawal": "ساجوال",
  "sajaawal": "ساجوال",
  "jafar": "جعفر",
  "jaffar": "جعفر",
  "jafer": "جعفر",
  "changar": "چنگڑ",
  "chungar": "چنگڑ",
  "atif": "عاطف",
  "ateef": "عاطف",
  "bhatta": "بھٹہ",
  "chak": "چک",
  "bhatta chak": "بھٹہ چک",
  "bhatta-chak": "بھٹہ چک",
  "ounces": "اونس",
  "ounce": "اونس",
  "siddique": "صدیق",
  "siddiqui": "صدیقی",
  "siddiq": "صدیق",
  "sher": "شیر",
  "sohail": "سہیل",
  "sohayl": "سہیل",
  "suhail": "سہیل",
  "wa": "WA",

  // Names
  "muhammad": "محمد",
  "shahid": "شاہد",
  "mansoor": "منصور",
  "amjad": "امجد",
  "ali": "علی",
  "zaka": "ذکاء",
  "ullah": "اللہ",
  "zaka ullah": "ذکاء اللہ",
  "sajid": "ساجد",
  "masih": "مسیح",
  "binyameen": "بنیامین",
  "tanveer": "تنویر",
  "ahmad": "احمد",
  "kashif": "کاشف",
  "zaheer": "ظہیر",
  "bashir": "بشیر",
  "basheer": "بشیر",
  "arain": "ارائیں",
  "liaqat": "لیاقت",
  "liaquat": "لیاقت",
  "abdul": "عبدال",
  "rauf": "رؤف",
  "bilal": "بلال",
  "farooq": "فاروق",
  "mahmood": "محمود",
  "mehmood": "محمود",
  "aslam": "اسلم",
  "akbar": "اکبر",
  "iqbal": "اقبال",
  "nadeem": "ندیم",
  "suhayl": "سہیل",
  "hameed": "حمید",
  "hamid": "حمید",
  "rehman": "رحمن",
  "shafiq": "شفیق",
  "shafeeq": "شفیق",
  "tariq": "طارق",
  "imran": "عمران",
  "khan": "خان",
  "butt": "بٹ",
  "javed": "جاوید",
  "rashid": "راشد",
  "irfan": "عرفان",
  "shehzad": "شہزاد",
  "waheed": "وحید",
  "yaseen": "یاسین",
  "yousaf": "یوسف",
  "yousuf": "یوسف",
  "asif": "آصف",
  "anwar": "انور",
  "nawaz": "نواز",
  "sharif": "شریف",
  "babar": "بابر",
  "azam": "اعظم",
  "rizwan": "رضوان",
  "shameem": "شمیم",
  "abbas": "عباس",
  "hassan": "حسن",
  "hussain": "حسین",
  "ashfaq": "اشفاق",
  "arshad": "ارشد",
  "akram": "اکرم",
  "asghar": "اصغر",
  "arif": "عارف",
  "khalid": "خالد",
  "jamil": "جمیل",
  "jameel": "جمیل",
  "rafeeq": "رفیق",
  "rafiq": "رفیق",
  "lateef": "لطیف",
  "latif": "لطیف",
  "nazeer": "نذیر",
  "nazir": "نذیر",
  "nasir": "ناصر",
  "naseer": "نصیر",
  "muneer": "منیر",
  "munir": "منیر",
  "shabbir": "شبیر",
  "qadir": "قادر",
  "ghafar": "غفار",
  "ghaffar": "غفار",
  "sattar": "ستار",
  "razzaq": "رزاق",
  "wahid": "واحد",
  "saeed": "سعید",
  "sajjad": "سجاد",
  "sajad": "سجاد",
  "shaukat": "شوکت",
  "safdar": "صفدر",
  "sarwar": "سرور",
  "afzal": "افضل",
  "azhar": "اظہر",
  "mazhar": "مظہر",
  "manzoor": "منظور",
  "maqsood": "مقصود",
  "masood": "مسعود",
  "zahid": "زاہد",
  "tahir": "طاہر",
  "tayyab": "طیب",
  
  // Police terms & ranks & stations
  "police station": "تھانہ",
  "police": "پولیس",
  "station": "سٹیشن",
  "nishtar": "نشتر",
  "colony": "کالونی",
  "lahore": "لاہور",
  "civil": "سیول",
  "lines": "لائنز",
  "gujranwala": "گوجرانوالہ",
  "faisal": "فیصل",
  "town": "ٹاؤن",
  "sialkot": "سیالکوٹ",
  "bypass": "بائی پاس",
  "road": "روڈ",
  "bridge": "پل",
  "gate": "گیٹ",
  "main": "مین",
  "near": "نزد",
  "mohallah": "محلہ",
  "gharbi": "غربی",
  "shardi": "شرقی",
  "bazar": "بازار",
  "chowk": "چوک",
  "multan": "ملتان",
  "rawalpindi": "راولپنڈی",
  "faisalabad": "فیصل آباد",
  "sargodha": "سرگودھا",
  "sahiwal": "ساہیوال",
  "okara": "اوکاڑہ",
  "kasur": "قصور",
  "sheikhupura": "شیخوپورہ",
  "jhang": "جھنگ",
  "sialkot bypass road": "سیالکوٹ بائی پاس روڈ",
  "near nishtar main gate bridge": "نزد نشتر مین گیٹ پل",
  "near bypass bridge main g.t. road": "نزد بائی پاس پل مین جی ٹی روڈ",

  // Castes
  "christian": "مسیحی",
  "masih/christian": "مسیحی",
  "gujjar": "گوجر",
  "jatt": "جٹ",
  "rajput": "راجپوت",
  "sheikh": "شیخ",
  "syed": "سید",
  "malik": "ملک",
  
  // Quantities & descriptions
  "plastic": "پلاسٹک",
  "can": "کین",
  "cane": "کین",
  "white": "سفید",
  "blue": "نیلے",
  "black": "کالے",
  "color": "رنگ",
  "liters": "لیٹر",
  "liter": "لیٹر",
  "bottles": "بوتلیں",
  "bottle": "بوتل",
  "ml": "ملی لیٹر",
  "grams": "گرام",
  "shopping bag": "شاپنگ بیگ",
  "shopping": "شاپنگ",
  "bag": "بیگ",
  "half": "آدھا",
  "search operation": "تلاشِ بدکرداران",
  "present posting": "حال تعینات",
  "head toliki": "ہیڈ ٹولیکی",
  "magistrate": "مجسٹریٹ",
  "judicial": "جوڈیشل",
  "remand": "ریمانڈ",
  "challan": "چالان",
  "informer": "مخبر خاص",
  "recovery": "برآمدگی",
  "sample": "نمونہ",
  "seal": "مہر",
  "parcel": "پارسل",
  "complainant": "مستغیث",
  "accused": "ملزم",
  "witness": "گواہ",
};

const transliterateWord = (word: string): string => {
  const clean = word.toLowerCase().trim();
  if (!clean) return "";
  if (/[\u0600-\u06FF]/.test(clean)) return clean;

  let urdu = clean;
  const replacements: [RegExp, string][] = [
    [/sh/g, "ش"],
    [/ch/g, "چ"],
    [/kh/g, "خ"],
    [/gh/g, "غ"],
    [/th/g, "ت"],
    [/ph/g, "ف"],
    [/aa/g, "ا"],
    [/ee/g, "ی"],
    [/oo/g, "و"],
    [/a/g, "ا"],
    [/b/g, "ب"],
    [/p/g, "پ"],
    [/t/g, "ت"],
    [/j/g, "ج"],
    [/d/g, "د"],
    [/r/g, "ر"],
    [/z/g, "ز"],
    [/s/g, "س"],
    [/f/g, "ف"],
    [/k/g, "ک"],
    [/g/g, "گ"],
    [/l/g, "ل"],
    [/m/g, "م"],
    [/n/g, "ن"],
    [/w/g, "و"],
    [/h/g, "ہ"],
    [/y/g, "ی"],
    [/v/g, "و"],
    [/i/g, "ی"],
    [/u/g, "و"],
    [/o/g, "و"],
    [/c/g, "ک"],
    [/x/g, "کس"],
    [/q/g, "ق"],
    [/e/g, "ی"],
  ];

  replacements.forEach(([regex, urduChar]) => {
    urdu = urdu.replace(regex, urduChar);
  });

  // Critical safeguard: Never allow residual English Latin characters inside Urdu words
  urdu = urdu.replace(/[a-zA-Z]/g, "");

  return urdu;
};

const convertToUrdu = (text: string): string => {
  if (!text) return "";
  
  const urduCharRegex = /[\u0600-\u06FF]/;
  if (urduCharRegex.test(text) && !/[a-zA-Z]/.test(text)) {
    return proofreadUrduText(text);
  }

  let cleanText = text.trim();

  // 1. Multi-word phrases, ranks, quantities and court descriptions
  cleanText = cleanText.replace(/\bhead\s+constable\b/gi, "ہیڈ کانسٹیبل");
  cleanText = cleanText.replace(/\bhead-constable\b/gi, "ہیڈ کانسٹیبل");
  cleanText = cleanText.replace(/\bhc\b/gi, "ہیڈ کانسٹیبل");
  cleanText = cleanText.replace(/\bconstable\b/gi, "کانسٹیبل");
  cleanText = cleanText.replace(/\bco\b/gi, "کانسٹیبل");
  cleanText = cleanText.replace(/\bfoot\s+constable\b/gi, "کانسٹیبل");
  cleanText = cleanText.replace(/\bfc\b/gi, "کانسٹیبل");
  cleanText = cleanText.replace(/\binspector\b/gi, "انسپکٹر");
  cleanText = cleanText.replace(/\bsub\s+inspector\b/gi, "SI");
  cleanText = cleanText.replace(/\bsub-inspector\b/gi, "SI");
  cleanText = cleanText.replace(/\bassistant\s+sub\s+inspector\b/gi, "ASI");
  cleanText = cleanText.replace(/\bassistant\s+sub-inspector\b/gi, "ASI");
  cleanText = cleanText.replace(/\basi\b/gi, "ASI");
  cleanText = cleanText.replace(/\bsi\b/gi, "SI");

  // Multi-word descriptions with correct Urdu grammar
  cleanText = cleanText.replace(/\b2\s+plastic\s+cans?\s+white\s+color\b/gi, "دو سفید رنگ کے پلاسٹک کین");
  cleanText = cleanText.replace(/\b2\s+white\s+plastic\s+cans?\b/gi, "دو سفید رنگ کے پلاسٹک کین");
  cleanText = cleanText.replace(/\bplastic\s+can\s+white\s+color\b/gi, "سفید رنگ کا پلاسٹک کین");
  cleanText = cleanText.replace(/\bplastic\s+can\s+blue\s+color\b/gi, "نیلے رنگ کا پلاسٹک کین");
  cleanText = cleanText.replace(/\bplastic\s+can\s+black\s+color\b/gi, "کالے رنگ کا پلاسٹک کین");
  cleanText = cleanText.replace(/\bplastic\s+can\b/gi, "پلاسٹک کین");
  cleanText = cleanText.replace(/\bplastic\s+cane\b/gi, "پلاسٹک کین");
  cleanText = cleanText.replace(/\b20\s+ounces?\b/gi, "20 اونس");
  cleanText = cleanText.replace(/\bounces?\b/gi, "اونس");
  cleanText = cleanText.replace(/\bhalf\s+liter\s+bottle\b/gi, "آدھا لیٹر والی بوتل");
  cleanText = cleanText.replace(/\bhalf\s+liter\b/gi, "آدھا لیٹر");
  cleanText = cleanText.replace(/\bsearch\s+operation\b/gi, "تلاشِ بدکرداران");
  cleanText = cleanText.replace(/\bpresent\s+posting\b/gi, "حال تعینات");
  cleanText = cleanText.replace(/\bpolice\s+station\b/gi, "تھانہ");
  cleanText = cleanText.replace(/\bhead\s+toliki\b/gi, "ہیڈ ٹولیکی");
  cleanText = cleanText.replace(/\bshopping\s+bag\b/gi, "شاپنگ بیگ");
  cleanText = cleanText.replace(/\bliquor\b/gi, "شراب دیسی");

  // Specific locations and names
  cleanText = cleanText.replace(/\bfaizabad\b/gi, "فیض آباد");
  cleanText = cleanText.replace(/\bfaiz\s+abad\b/gi, "فیض آباد");
  cleanText = cleanText.replace(/\bsajawal\b/gi, "ساجوال");
  cleanText = cleanText.replace(/\bjafar\b/gi, "جعفر");
  cleanText = cleanText.replace(/\bjaffar\b/gi, "جعفر");
  cleanText = cleanText.replace(/\bchangar\b/gi, "چنگڑ");
  cleanText = cleanText.replace(/\batif\b/gi, "عاطف");
  cleanText = cleanText.replace(/\bsohail\b/gi, "سہیل");
  cleanText = cleanText.replace(/\bsohayl\b/gi, "سہیل");
  cleanText = cleanText.replace(/\bbhatta\s+chak\b/gi, "بھٹہ چک");
  cleanText = cleanText.replace(/\bsaddar\s+nankana\s+sahib\b/gi, "صدر ننکانہ صاحب");
  cleanText = cleanText.replace(/\bsadda\s+nankana\s+sahib\b/gi, "صدر ننکانہ صاحب");
  cleanText = cleanText.replace(/\bsadar\s+nankana\s+sahib\b/gi, "صدر ننکانہ صاحب");
  cleanText = cleanText.replace(/\bcity\s+nankana\s+sahib\b/gi, "سٹی ننکانہ صاحب");
  cleanText = cleanText.replace(/\bnankana\s+sahib\b/gi, "ننکانہ صاحب");
  cleanText = cleanText.replace(/\bsadda\s+nankana\b/gi, "صدر ننکانہ");
  cleanText = cleanText.replace(/\bsaddar\s+nankana\b/gi, "صدر ننکانہ");
  cleanText = cleanText.replace(/\bsadar\s+nankana\b/gi, "صدر ننکانہ");
  cleanText = cleanText.replace(/\bcity\s+nankana\b/gi, "سٹی ننکانہ");
  cleanText = cleanText.replace(/\bkot\s+lahna\s+das\b/gi, "کوٹ لہنا داس");

  // 2. Protect legal abbreviations and belt numbers so they don't get broken or transliterated
  const protectionMap: { token: string; original: string }[] = [];
  let protectedText = cleanText;

  // Protect belt numbers like 1354/C, 1025/C, 1354-C, 2351/HC, 1276/C, 1525/C
  protectedText = protectedText.replace(/\b\d+\s*[-/]\s*[a-zA-Z]+\b/gi, (match) => {
    const token = `__PROT_BELT_${protectionMap.length}__`;
    protectionMap.push({ token, original: match.toUpperCase().replace(/\s/g, "") });
    return token;
  });

  // Protect standard official abbreviations and seal identifiers
  const patternsToProtect = [
    { regex: /\bpfsa\b/gi, exact: "PFSA" },
    { regex: /\bfir\b/gi, exact: "FIR" },
    { regex: /\bi\.o\b/gi, exact: "I.O" },
    { regex: /\basi\b/gi, exact: "ASI" },
    { regex: /\bsi\b/gi, exact: "SI" },
    { regex: /\bhc\b/gi, exact: "HC" },
    { regex: /\bcia\b/gi, exact: "CIA" },
    { regex: /\bwa\b/gi, exact: "WA" },
    { regex: /\bex\.p[a-d]\b/gi, exact: (m: string) => "Ex." + m.slice(-3).toUpperCase() },
    { regex: /\bexh-p[a-d]\b/gi, exact: (m: string) => "Exh-" + m.slice(-2).toUpperCase() },
    { regex: /\bexh\.\s*p[a-d]\b/gi, exact: (m: string) => "Exh. " + m.slice(-1).toUpperCase() },
    { regex: /\bexh\s*p[a-d]\b/gi, exact: (m: string) => "Exh " + m.slice(-2).toUpperCase() },
    { regex: /\b173\s*ض\s*[-ف]\b/gi, exact: "173 ض-ف" },
    { regex: /\b173\s*ض\s*ف\b/gi, exact: "173 ض-ف" }
  ];

  patternsToProtect.forEach((item) => {
    protectedText = protectedText.replace(item.regex, (match) => {
      const token = `__PROT_ABBR_${protectionMap.length}__`;
      const originalValue = typeof item.exact === "function" ? item.exact(match) : item.exact;
      protectionMap.push({ token, original: originalValue });
      return token;
    });
  });

  // 3. Split by spaces and punctuation, translate individual English words, and keep tokens & punctuation
  const words = protectedText.split(/(\s+|,|\/|-|\(|\)|[.:])/);
  const translated = words.map(word => {
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord) return word;

    if (/^[\s+,\/\-\(\)[.:]]+$/.test(cleanWord)) return word;

    if (cleanWord.startsWith("__prot_")) {
      const found = protectionMap.find(p => p.token.toLowerCase() === cleanWord);
      return found ? found.original : word;
    }

    if (/^\d+$/.test(cleanWord)) return word;

    if (nameTranslationMap[cleanWord]) {
      return nameTranslationMap[cleanWord];
    }

    if (/^[a-z]+$/i.test(cleanWord)) {
      return transliterateWord(cleanWord);
    }

    return word;
  });

  let result = translated.join("");

  // Post-processing cleanup: Replace any left-over tokens just in case
  protectionMap.forEach((p) => {
    result = result.replace(new RegExp(p.token, "g"), p.original);
  });

  return proofreadUrduText(result);
};

const correctUrduNames = (urduText: string): string => {
  if (!urduText) return "";
  let corrected = proofreadUrduText(urduText);
  return corrected;
};

const refineWithOcr = (urduText: string, ocrText?: string): string => {
  let refined = correctUrduNames(urduText);
  if (!ocrText) return proofreadUrduText(refined);
  
  // Extract all Urdu words or sequences from raw OCR text
  const ocrWords = ocrText.split(/[\s،۔()\-.:/\[\]{}]+/).filter(Boolean);
  
  // 1. If refined contains any unjoined or split variation but OCR has the clean joined one, correct it
  const abdulNames = [
    "عبدالحمید", "عبدالرحمن", "عبدالرشید", "عبدالوحید", "عبدالرؤف", 
    "عبدالجبار", "عبدالمجید", "عبدالغفار", "عبدالستار", "عبدالقادر", 
    "عبدالیسین", "عبدالیاسین", "عبدالواحد", "عبدالباسط"
  ];
  
  abdulNames.forEach(name => {
    if (ocrWords.includes(name)) {
      const part = name.replace("عبدال", "");
      const splitRegex = new RegExp(`عبد\\s*ال\\s*${part}|عبدال\\s+${part}`, "g");
      refined = refined.replace(splitRegex, name);
    }
  });

  // 2. If OCR explicitly contains correct spelling "سہیل" and our text contains a variant, ensure we use "سہیل"
  if (ocrWords.includes("سہیل")) {
    refined = refined.replace(/سوہایل/g, "سہیل");
    refined = refined.replace(/سوہیل/g, "سہیل");
  }
  
  return proofreadUrduText(refined);
};

const renderMixedText = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Regex to split by alphanumeric blocks (including spaces, hyphens, slashes, dots, parens in between)
  const regex = /([a-zA-Z0-9]+(?:[\s-./()]+[a-zA-Z0-9]+)*)/g;
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) => {
        const hasAlphanumeric = /[a-zA-Z0-9]/.test(part);
        const hasUrdu = /[\u0600-\u06FF]/.test(part);
        
        if (hasAlphanumeric && !hasUrdu) {
          return (
            <span 
              key={index} 
              dir="ltr" 
              className="inline-block font-sans font-bold text-black mx-1 tracking-normal bg-white"
              style={{ 
                direction: "ltr",
                unicodeBidi: "bidi-override",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontSize: "14px",
                letterSpacing: "0.2px",
                lineHeight: "1.4",
                wordSpacing: "normal",
                display: "inline-block"
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default function GeneratedEvidenceScreen({ data, fields, onBack }: GeneratedEvidenceScreenProps) {
  const [activeTab, setActiveTab] = useState<"all" | "pw1" | "pw2" | "pw3" | "s342">("all");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"cream" | "bw">("cream");
  const [statement342Questions, setStatement342Questions] = useState<Statement342Question[]>(() =>
    generateStatement342Questions(data, fields)
  );
  const [isEditing342, setIsEditing342] = useState(false);
  const [copied342, setCopied342] = useState(false);

  const toUrdu = (text: string): string => {
    if (!text) return "";
    const converted = convertToUrdu(text);
    return proofreadUrduText(refineWithOcr(converted, data.ocrText));
  };

  const formatDateEnglish = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split(/[-./]/);
      if (parts.length === 3) {
        let day = parts[0];
        let month = parts[1];
        let year = parts[2];
        if (day.length === 4) {
          year = parts[0];
          day = parts[2];
        }
        return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleUpdateQuestion = (id: number, field: "question" | "answer", val: string) => {
    setStatement342Questions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: val } : q))
    );
  };

  const handleReset342 = () => {
    setStatement342Questions(generateStatement342Questions(data, fields));
    setIsEditing342(false);
  };

  const handleCopy342 = () => {
    const text = `IN THE COURT OF SPECIAL JUDICIAL MAGISTRATE / TRIAL COURT, PUNJAB

Case Title: State Vs. ${data.accusedName || "Accused"}
FIR No: ${data.firNumber || "—"} | Police Station: ${data.policeStation || "—"}
Offence: Under Section 3/4 The Prohibition (Enforcement of Hadd) Order, 1979
Date of Examination: ${formatDateEnglish(fields.evidenceDate)}

STATEMENT OF ACCUSED UNDER SECTION 342 Cr.P.C.
Statement of accused ${data.accusedName || "—"} son of ${data.fatherName || "—"}, Caste ${data.caste || "—"}, Resident of ${data.address || "—"}, recorded on solemn affirmation / examination:

${statement342Questions.map((q) => `Q. No. ${q.id}: ${q.question}\nAns: ${q.answer}`).join("\n\n")}

RO & AC
(Read Over & Accepted Correct)

___________________________                     ___________________________
Signature / Thumb Impression                    Special Judicial Magistrate /
of Accused: ${data.accusedName || "Accused"}                      Presiding Officer`;

    navigator.clipboard.writeText(text);
    setCopied342(true);
    setTimeout(() => setCopied342(false), 2500);
  };

  const handleDownloadPDF = async (targetMode: "all" | "current" = "all") => {
    setIsGeneratingPDF(true);
    setPdfError(null);
    setPdfStatus("Preparing documents for PDF export...");

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "legal", // 215.9 x 355.6 mm
        compress: true,
      });

      const pageIds = targetMode === "all" ? ["pw1", "pw2", "pw3", "s342"] : [activeTab === "all" ? "pw1" : activeTab];
      
      let isFirst = true;
      let pageNum = 1;

      for (const pageId of pageIds) {
        setPdfStatus(`Rendering Page ${pageNum} of ${pageIds.length} (${pageId.toUpperCase()})...`);
        const element = document.getElementById(`${pageId}-page`);
        if (!element) {
          console.warn(`Element ${pageId}-page not found`);
          continue;
        }

        // Ensure element is visible during capture
        const wasHidden = element.classList.contains("hidden");
        if (wasHidden) {
          element.classList.remove("hidden");
          element.style.position = "fixed";
          element.style.left = "-9999px";
          element.style.top = "0";
          element.style.display = "block";
        }

        const originalWidth = element.style.width;
        const originalBoxShadow = element.style.boxShadow;
        const originalBorder = element.style.border;
        const originalBg = element.style.backgroundColor;

        element.style.width = "794px"; // Standard desktop print canvas width (~210mm at 96dpi)
        element.style.boxShadow = "none";
        element.style.border = "none";
        element.style.backgroundColor = "#ffffff";

        // Force all Urdu elements inside this page to render in pure black for legal text high contrast
        const urduElements = element.querySelectorAll<HTMLElement>(".urdu-text");
        const savedUrduStyles = Array.from(urduElements).map((el) => ({
          color: el.style.color,
          fontFamily: el.style.fontFamily,
          lineHeight: el.style.lineHeight,
        }));

        urduElements.forEach((el) => {
          el.style.color = "#000000";
          el.style.fontFamily = "'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif";
        });

        const canvas = await html2canvas(element, {
          scale: 2, // 192 DPI - crisp, fast, and avoids out-of-memory crashes
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 1024,
          ignoreElements: (el) => el.classList.contains("no-print"),
        });

        // Restore original styles
        element.style.width = originalWidth;
        element.style.boxShadow = originalBoxShadow;
        element.style.border = originalBorder;
        element.style.backgroundColor = originalBg;

        if (wasHidden) {
          element.classList.add("hidden");
          element.style.position = "";
          element.style.left = "";
          element.style.top = "";
          element.style.display = "";
        }

        urduElements.forEach((el, idx) => {
          el.style.color = savedUrduStyles[idx].color;
          el.style.fontFamily = savedUrduStyles[idx].fontFamily;
          el.style.lineHeight = savedUrduStyles[idx].lineHeight;
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (!isFirst) {
          pdf.addPage("legal", "portrait");
        }
        isFirst = false;

        // Fit to Legal page (215.9 x 355.6 mm) with proper aspect ratio
        const pdfWidth = 215.9;
        const pdfHeight = 355.6;
        const canvasAspectRatio = canvas.height / canvas.width;
        const renderHeight = pdfWidth * canvasAspectRatio;

        if (renderHeight > pdfHeight) {
          const scale = pdfHeight / renderHeight;
          const scaledWidth = pdfWidth * scale;
          const xOffset = (pdfWidth - scaledWidth) / 2;
          pdf.addImage(imgData, "JPEG", xOffset, 0, scaledWidth, pdfHeight, undefined, "FAST");
        } else {
          pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, renderHeight, undefined, "FAST");
        }

        pageNum++;
      }

      setPdfStatus("Finalizing PDF file...");
      const sanitizedName = (data.accusedName || "Accused").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_");
      const fileName = `State_Vs_${sanitizedName}_Evidence.pdf`;

      if (isNativeApp()) {
        // Android app: blob downloads are not supported inside the WebView, so save the
        // PDF to app storage and open the share sheet (Save to Files / Drive / Print / WhatsApp).
        const base64Pdf = pdf.output("datauristring").split(",")[1];
        const nativeName = `State_Vs_${asciiFileName(data.accusedName || "", "Accused")}_Evidence.pdf`;
        setPdfStatus("Opening share sheet...");
        await savePdfOnAndroid(base64Pdf, nativeName);
      } else {
        // Generate blob and blob URL
        const pdfBlob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);
        setDownloadBlobUrl(blobUrl);

        // Trigger download
        try {
          pdf.save(fileName);
        } catch (saveErr) {
          console.warn("Direct pdf.save failed, using fallback anchor click:", saveErr);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => document.body.removeChild(link), 1000);
        }
      }

      setPdfStatus("PDF successfully created!");
      setTimeout(() => {
        setPdfStatus(null);
      }, 5000);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      setPdfStatus(null);
      setPdfError(`Failed to generate PDF: ${error?.message || "Please try again or use the 'Print / Save as PDF' option."}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatDateUrdu = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      // Split by dash, dot, or slash
      const parts = dateStr.split(/[-./]/);
      if (parts.length === 3) {
        let day = parts[0];
        let month = parts[1];
        let year = parts[2];
        
        // Handle YYYY-MM-DD
        if (day.length === 4) {
          year = parts[0];
          day = parts[2];
        }
        
        const paddedDay = day.padStart(2, '0');
        const paddedMonth = month.padStart(2, '0');
        const paddedYear = year;
        
        return `مورخہ ${paddedDay}.${paddedMonth}.${paddedYear}`;
      }
      return `مورخہ ${dateStr}`;
    } catch {
      return `مورخہ ${dateStr}`;
    }
  };

  const fillTemplate = (template: string) => {
    let content = template;
    
    // Replace with dates avoiding duplicates of مورخہ
    const dateOfOccurrenceFormatted = formatDateUrdu(data.dateOfOccurrence);
    const evidenceDateFormatted = formatDateUrdu(fields.evidenceDate);

    content = content.replace(/مورخہ\s+{dateOfOccurrence}/g, dateOfOccurrenceFormatted);
    content = content.replace(/{dateOfOccurrence}/g, dateOfOccurrenceFormatted);

    content = content.replace(/مورخہ\s+{evidenceDate}/g, evidenceDateFormatted);
    content = content.replace(/{evidenceDate}/g, evidenceDateFormatted);

    content = content.replace(/{witness1Name}/g, toUrdu(data.witness1Name) || "____________");
    content = content.replace(/{witness1Rank}/g, toUrdu(data.witness1Rank) || "کانسٹیبل");
    content = content.replace(/{witness1BeltNumber}/g, toUrdu(data.witness1BeltNumber) || "_____/C");
    content = content.replace(/{witness2Name}/g, toUrdu(data.witness2Name) || "____________");
    content = content.replace(/{witness2Rank}/g, toUrdu(data.witness2Rank) || "کانسٹیبل");
    content = content.replace(/{witness2BeltNumber}/g, toUrdu(data.witness2BeltNumber) || "_____/C");
    content = content.replace(/{accusedName}/g, toUrdu(data.accusedName) || "____________");
    content = content.replace(/{fatherName}/g, toUrdu(data.fatherName) || "____________");
    content = content.replace(/{caste}/g, data.caste ? toUrdu(data.caste) : "—");
    content = content.replace(/{address}/g, toUrdu(data.address) || "____________");
    content = content.replace(/{recoveryPlace}/g, toUrdu(data.recoveryPlace) || "____________");
    content = content.replace(/{liquorQuantity}/g, toUrdu(data.liquorQuantity) || "____________");
    content = content.replace(/{sampleQuantity}/g, toUrdu(data.sampleQuantity) || "____________");
    content = content.replace(/{sealName}/g, toUrdu(data.sealName) || "____________");
    content = content.replace(/{ioName}/g, toUrdu(data.ioName) || "____________");
    content = content.replace(/{ioRank}/g, toUrdu(data.ioRank) || "____________");
    content = content.replace(/{canDescription}/g, toUrdu(data.canDescription) || "پلاسٹک کین");
    
    if (data.bottleCount && data.bottleCount.trim()) {
      content = content.replace(/{bottleCount}/g, `(بتعداد ${toUrdu(data.bottleCount)})`);
    } else {
      content = content.replace(/{bottleCount}/g, "");
    }
    
    return proofreadUrduText(content);
  };

  const pw1Content = proofreadUrduText(data.caseType === "Informer" 
    ? fillTemplate(PW1_INFORMER_TEMPLATE) 
    : fillTemplate(PW1_DIRECT_RECOVERY_TEMPLATE));

  const pw2Content = proofreadUrduText(fillTemplate(PW2_MOHARRAR_TEMPLATE));

  const pw3Content = proofreadUrduText(data.caseType === "Informer" 
    ? fillTemplate(PW3_INFORMER_TEMPLATE) 
    : fillTemplate(PW3_DIRECT_RECOVERY_TEMPLATE));

  const handlePrint = (targetMode: "all" | "current" = "all") => {
    const pageIds = targetMode === "all" ? ["pw1", "pw2", "pw3", "s342"] : [activeTab === "all" ? "pw1" : activeTab];
    
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.focus();
        window.print();
        return;
      }

      let pagesHtml = "";
      for (const pageId of pageIds) {
        const el = document.getElementById(`${pageId}-page`);
        if (el) {
          const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelectorAll(".no-print").forEach((n) => n.remove());
          clone.classList.remove("hidden");
          pagesHtml += `<div class="legal-print-page">${clone.innerHTML}</div>`;
        }
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="ur" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>State Vs ${data.accusedName || "Accused"} - Court Evidence</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&family=Inter:wght@400;600;700&display=swap">
          <style>
            @page {
              size: 215.9mm 355.6mm;
              margin: 10mm 15mm 12mm 15mm;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: 'Inter', system-ui, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .legal-print-page {
              width: 100%;
              min-height: 330mm;
              padding: 12mm 12mm 15mm 12mm;
              page-break-after: always;
              break-after: page;
              page-break-inside: avoid;
              break-inside: avoid;
              background: #ffffff;
              color: #000000;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }
            .legal-print-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .urdu-text {
              font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif;
              line-height: 2.3;
              direction: rtl;
              text-align: right;
              color: #000000;
              font-size: 13.5pt;
            }
            .court-title {
              font-size: 16pt;
              font-weight: bold;
              text-align: center;
              color: #000000;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }, 400);
    } catch (e) {
      console.warn("Iframe print helper failed, falling back to direct window.print():", e);
      window.focus();
      window.print();
    }
  };

  const renderPhotoBox = (photoBase64: string, name: string) => {
    if (photoBase64 === "placeholder_court_seal") {
      return (
        <div className="h-28 w-24 border border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center p-2 text-center shrink-0">
          <svg className="h-10 w-10 text-slate-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
          </svg>
          <span className="text-4xs font-bold font-sans text-slate-500 uppercase tracking-tight">COURT SEAL</span>
        </div>
      );
    }

    if (photoBase64) {
      return (
        <div className="h-28 w-24 border border-slate-300 rounded bg-white overflow-hidden shrink-0 shadow-sm">
          <img src={photoBase64} alt={name} className="h-full w-full object-cover" />
        </div>
      );
    }

    return (
      <div className="h-28 w-24 border-2 border-dashed border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center p-1.5 text-center shrink-0">
        <span className="text-4xs font-bold text-slate-400 uppercase tracking-tight font-sans leading-tight">
          پاسپورٹ سائز تصویر چسپاں کریں
        </span>
        <span className="text-[7px] text-slate-400 font-sans mt-1">PASTE PHOTO</span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Component-level text styling - No external font @import here to ensure html2canvas compatibility */}
      <style>{`
        .urdu-text {
          font-family: 'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
          line-height: 2.2;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          text-rendering: optimizeLegibility !important;
          font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1 !important;
          direction: rtl;
        }
      `}</style>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 no-print flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 w-full justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
              <Check className="h-5 w-5 text-indigo-600 animate-pulse" /> Evidence Statements Generated!
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1 max-w-lg">
              Each witness statement is styled as an independent legal document formatted strictly for **Legal-sized portrait printing (8.5&quot; x 14&quot; / 215.9mm x 355.6mm)** under trial court regulations.
            </p>
          </div>
          
          {/* Aesthetic Toggle Switch for Paper Theme Selection */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80 shrink-0 self-start xl:self-center">
            <button
              onClick={() => setThemeMode("cream")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                themeMode === "cream"
                  ? "bg-amber-50 text-amber-900 shadow-sm border border-amber-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-[#faf7f2] border border-amber-300" />
              Cream Legal Paper
            </button>
            <button
              onClick={() => setThemeMode("bw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                themeMode === "bw"
                  ? "bg-white text-black shadow-sm border border-slate-300"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white border-2 border-black" />
              High-Contrast B&W
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            ← Modify Inputs
          </button>
          
          {/* Download Legal PDF (All 4 Pages) */}
          <button
            onClick={() => handleDownloadPDF("all")}
            disabled={isGeneratingPDF}
            style={{ backgroundColor: '#059669', color: '#ffffff' }}
            className="hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download complete case file with all 4 Legal pages (PW1, PW2, PW3, Section 342)"
          >
            {isGeneratingPDF ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download Legal PDF (All 4 Pages)
              </>
            )}
          </button>

          {/* Download Current Page Only (shown when an individual tab is selected) */}
          {activeTab !== "all" && (
            <button
              onClick={() => handleDownloadPDF("current")}
              disabled={isGeneratingPDF}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={`Download only ${activeTab.toUpperCase()} PDF`}
            >
              <Download className="h-3.5 w-3.5" /> This Page Only
            </button>
          )}

          {!isNativeApp() && (
          <>
          {/* Print / Save as PDF (All 4 Pages) */}
          <button
            onClick={() => handlePrint("all")}
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
            className="hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open print dialog pre-configured for Legal portrait (All 4 Pages)"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>

          {/* Print Current Page Only */}
          {activeTab !== "all" && (
            <button
              onClick={() => handlePrint("current")}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title={`Print only ${activeTab.toUpperCase()}`}
            >
              <Printer className="h-3.5 w-3.5" /> Print This Tab
            </button>
          )}
          </>
          )}
        </div>
      </div>

      {/* PDF Status Notification Banner */}
      {pdfStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs no-print shadow-xs animate-pulse">
          <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin shrink-0" />
          <span className="font-semibold">{pdfStatus}</span>
        </div>
      )}

      {/* Direct Download Link Fallback Card (Crucial for iframe environments) */}
      {downloadBlobUrl && (
        <div className="bg-emerald-50 border-2 border-emerald-500/80 text-emerald-950 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs no-print shadow-md">
          <div className="flex items-center gap-2.5">
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-extrabold text-emerald-900">Your Legal-Size Court Evidence PDF is Ready!</p>
              <p className="text-emerald-700 text-[11px] mt-0.5">If the download did not start automatically in your browser window, click the button to save it.</p>
            </div>
          </div>
          <a
            href={downloadBlobUrl}
            download={`State_Vs_${(data.accusedName || "Accused").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_")}_Evidence.pdf`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" /> Save PDF File Now
          </a>
        </div>
      )}

      {/* PDF Generation Error Banner */}
      {pdfError && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3.5 rounded-xl flex items-start gap-2.5 text-xs no-print shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{pdfError}</p>
            {!isNativeApp() && (
            <p className="text-red-700 text-[11px] mt-1">
              Tip: You can also use the <strong>&quot;Print / Save as PDF&quot;</strong> button to print or save the document directly as a Legal-sized PDF through your browser print window.
            </p>
            )}
          </div>
        </div>
      )}

      {/* User PDF Instruction Alert */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 no-print">
        <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-800 font-medium leading-relaxed">
          <p className="font-extrabold mb-1 uppercase tracking-wider text-[10px] text-indigo-600">Court Export &amp; Printing Guide:</p>
          <div className="space-y-1 text-slate-700">
            <p><span className="font-bold text-emerald-700">Download Legal PDF:</span> Generates an authentic 8.5&quot; x 14&quot; Legal court bundle containing all 4 prosecution witness statements and Section 342 examination.</p>
            {isNativeApp() ? (
              <p><span className="font-bold text-indigo-700">Print on Android:</span> After the PDF is created, the share sheet opens. Choose <span className="font-bold">Save to Files / Drive</span>, or open the PDF in a viewer and use its Print option (paper size: Legal).</p>
            ) : (
            <p><span className="font-bold text-indigo-700">Print / Save as PDF:</span> Opens the browser print dialog. In the print dialog, select <span className="font-bold">&quot;Save as PDF&quot;</span>, choose Paper Size: <span className="font-bold">&quot;Legal&quot;</span>, and Margins: <span className="font-bold">&quot;Default&quot;</span>.</p>
            )}
          </div>
        </div>
      </div>

      {/* Preview Tabs */}
      <div className="flex border-b border-slate-200 no-print gap-1 overflow-x-auto pb-px">
        {[
          { key: "all", label: "📄 View All Documents (4 Pages)" },
          { key: "pw1", label: "PW-1 (I.O. Evidence)" },
          { key: "pw2", label: "PW-2 (Moharrar Evidence)" },
          { key: "pw3", label: "PW-3 (Recovery Witness)" },
          { key: "s342", label: "⚖️ Statement u/s 342 Cr.P.C. (English)" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg shadow-xs"
                : "border-transparent text-slate-400 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Statements Pages Container */}
      <div className="space-y-8 print:space-y-0 print:m-0">
        {/* PAGE 1: PW1 (Investigating Officer) */}
        <div 
          id="pw1-page" 
          className={`legal-print-page border max-w-4xl mx-auto flex flex-col justify-between print:rounded-none print:shadow-none print:p-0 relative transition-all duration-300 ${
            activeTab === "all" || activeTab === "pw1" ? "block" : "hidden print:block"
          } ${
            themeMode === "cream" 
              ? "bg-[#faf7f2] border-[#e8e2d5] shadow-xl text-slate-900 p-8 md:p-12" 
              : "bg-white border-2 border-black shadow-none text-black p-8 md:p-12"
          }`}
        >
            {themeMode === "cream" && (
              <div className="absolute top-0 right-[25mm] bottom-0 w-[1px] bg-red-200/50 pointer-events-none no-print" />
            )}
            {/* Top Row with Title */}
            <div className="relative pb-4 mb-6 text-center min-h-[112px] flex flex-col justify-center">
              {/* Court Header Details - Perfectly Centered */}
              <div className="mx-auto max-w-lg">
                <h1 className={`text-xl md:text-2xl font-bold court-title font-sans ${themeMode === "cream" ? "text-slate-900" : "text-black border-b-2 border-black pb-2"}`}>
                  State Vs. {toUrdu(data.accusedName) || "____________"}
                </h1>
                <p className={`text-sm font-semibold mt-1.5 font-sans ${themeMode === "cream" ? "text-slate-700" : "text-black"}`}>
                  FIR No: <span className="font-mono">{data.firNumber || "____________"}</span> &bull; Police Station: {toUrdu(data.policeStation) || "____________"}
                </p>
              </div>
            </div>

            {/* Witness Detail Line - Clean formatting matching handwritten style */}
            <div className={`urdu-text text-right text-base font-bold mb-1 ${themeMode === "cream" ? "text-slate-950" : "text-black"}`}>
              PW-1. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {formatDateUrdu(fields.evidenceDate) || "____________"}
            </div>
            <div className={`urdu-text text-right text-base mb-4 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>
              {renderMixedText(`بیان ازاں: ${toUrdu(data.ioName)} ${toUrdu(data.ioRank)} حال تعینات: ${fields.pw1PresentPosting ? toUrdu(fields.pw1PresentPosting) : "_____________"}`)}
            </div>

            {/* Urdu Statement Narrative content */}
            <div className={`urdu-text text-right text-base md:text-lg leading-loose tracking-wide font-normal flex-1 px-2 whitespace-pre-wrap mb-6 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>
              {renderMixedText(pw1Content)}
            </div>

            {/* Cross-Examination Section - Authentic court cross examination for PW1 */}
            <div className="mt-6 pt-4 urdu-text text-right">
              <p className={`font-bold mb-2 ${themeMode === "cream" ? "text-slate-950" : "text-black"}`}>جرح منجانب وکیل ملزم:</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ میں نے ملزم کو موقع سے گرفتار نہ کیا ہے اور نہ ہی ملزم کے قبضہ سے کوئی شراب برآمد ہوئی ہے؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ موقع پر پبلک سے کسی آزاد گواہ کو شامل نہیں کیا گیا اور تمام کارروائی تھانہ میں بیٹھ کر من گھڑت تیار کی گئی ہے؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ فرد مقبوضگی اور نقشہ موقع جائے وقوعہ پر تیار نہ کیے گئے بلکہ بعد میں خانہ پری کی گئی؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ محض اپنے افسرانِ بالا کو جھوٹی کارکردگی دکھانے کی غرض سے ملزم پر جھوٹا مقدمہ بنایا گیا ہے؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ میں نے جھوٹا بیان دیا ہے؟</p>
              <p className={`pr-4 mb-6 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>ج: یہ غلط ہے۔</p>
              
              <div className={`grid grid-cols-2 mt-8 border-t pt-6 ${themeMode === "cream" ? "border-slate-200" : "border-black"}`} style={{ direction: "ltr" }}>
                {/* Left Side: سن کر درست تسلیم کیا */}
                <div className="text-left urdu-text" style={{ direction: "rtl" }}>
                  <p className={`font-bold underline text-sm md:text-base cursor-pointer ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>سن کر درست تسلیم کیا</p>
                  <p className="text-[10px] text-slate-400 font-sans mt-1">Signature / Thumb Impression</p>
                </div>
                
                {/* Right Side: Witness Details */}
                <div className="text-right urdu-text" style={{ direction: "rtl" }}>
                  <p className={`text-xs font-bold ${themeMode === "cream" ? "text-slate-800" : "text-black"}`}>تفتیشی افسر / مدعی مقدمہ (PW-1)</p>
                  <p className={`text-xs font-normal mt-0.5 font-sans ${themeMode === "cream" ? "text-slate-500" : "text-black"}`}>{toUrdu(data.ioName)} {toUrdu(data.ioRank)}</p>
                </div>
              </div>
            </div>
          </div>

        {/* PAGE 2: PW2 (Moharrar) */}
        <div 
          id="pw2-page" 
          className={`legal-print-page border max-w-4xl mx-auto flex flex-col justify-between print:rounded-none print:shadow-none print:p-0 relative transition-all duration-300 ${
            activeTab === "all" || activeTab === "pw2" ? "block" : "hidden print:block"
          } ${
            themeMode === "cream" 
              ? "bg-[#faf7f2] border-[#e8e2d5] shadow-xl text-slate-900 p-8 md:p-12" 
              : "bg-white border-2 border-black shadow-none text-black p-8 md:p-12"
          }`}
        >
            {themeMode === "cream" && (
              <div className="absolute top-0 right-[25mm] bottom-0 w-[1px] bg-red-200/50 pointer-events-none no-print" />
            )}
            {/* Top Row with Title */}
            <div className="relative pb-4 mb-6 text-center min-h-[112px] flex flex-col justify-center">
              {/* Court Header Details - Perfectly Centered */}
              <div className="mx-auto max-w-lg">
                <h1 className={`text-xl md:text-2xl font-bold court-title font-sans ${themeMode === "cream" ? "text-slate-900" : "text-black border-b-2 border-black pb-2"}`}>
                  State Vs. {toUrdu(data.accusedName) || "____________"}
                </h1>
                <p className={`text-sm font-semibold mt-1.5 font-sans ${themeMode === "cream" ? "text-slate-700" : "text-black"}`}>
                  FIR No: <span className="font-mono">{data.firNumber || "____________"}</span> &bull; Police Station: {toUrdu(data.policeStation) || "____________"}
                </p>
              </div>
            </div>

            {/* Witness Detail Line - Clean formatting matching handwritten style */}
            <div className={`urdu-text text-right text-base font-bold mb-1 ${themeMode === "cream" ? "text-slate-950" : "text-black"}`}>
              PW-2. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {formatDateUrdu(fields.evidenceDate) || "____________"}
            </div>
            <div className={`urdu-text text-right text-base mb-4 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>
              {renderMixedText(`بیان ازاں: ${toUrdu(data.moharrarName || "محرر مال")} (${toUrdu(data.moharrarRank || "Head Constable")}) حال تعینات: ${fields.pw2PresentPosting ? toUrdu(fields.pw2PresentPosting) : "_____________"}`)}
            </div>

            {/* Urdu Statement Narrative content */}
            <div className={`urdu-text text-right text-base md:text-lg leading-loose tracking-wide font-normal flex-1 px-2 whitespace-pre-wrap mb-6 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>
              {renderMixedText(pw2Content)}
            </div>

            {/* Cross-Examination Section - Authentic court cross examination for PW2 (Moharrar) */}
            <div className="mt-6 pt-4 urdu-text text-right">
              <p className={`font-bold mb-2 ${themeMode === "cream" ? "text-slate-950" : "text-black"}`}>جرح منجانب وکیل ملزم:</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ تفتیشی افسر نے پارسل جات مالِ مقدمہ بحفاظت میرے پاس تھانہ کے مالخانہ میں جمع نہ کروائے تھے؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ رجسٹر نمبر 19 میں بعد میں من پسند اندراج کیا گیا ہے؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ پارسل لیبارٹری بھجوانے میں غیر ضروری تاخیر کی گئی اور دورانِ تحویل پارسل میں رد و بدل کی گئی؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ میں نے سرکاری ملازم ہونے کے ناطے تفتیشی کے حق میں جھوٹی گواہی دی ہے؟</p>
              <p className={`pr-4 mb-6 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>ج: یہ غلط ہے۔</p>
              
              <div className={`grid grid-cols-2 mt-8 border-t pt-6 ${themeMode === "cream" ? "border-slate-200" : "border-black"}`} style={{ direction: "ltr" }}>
                {/* Left Side: سن کر درست تسلیم کیا */}
                <div className="text-left urdu-text" style={{ direction: "rtl" }}>
                  <p className={`font-bold underline text-sm md:text-base cursor-pointer ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>سن کر درست تسلیم کیا</p>
                  <p className="text-[10px] text-slate-400 font-sans mt-1">Signature / Thumb Impression</p>
                </div>
                
                {/* Right Side: Witness Details */}
                <div className="text-right urdu-text" style={{ direction: "rtl" }}>
                  <p className={`text-xs font-bold ${themeMode === "cream" ? "text-slate-800" : "text-black"}`}>محرر مال مقدمہ تھانہ (PW-2)</p>
                  <p className={`text-xs font-normal mt-0.5 font-sans ${themeMode === "cream" ? "text-slate-500" : "text-black"}`}>{toUrdu(data.moharrarName || "محرر مال")}</p>
                </div>
              </div>
            </div>
          </div>

        {/* PAGE 3: Witness */}
        <div 
          id="pw3-page" 
          className={`legal-print-page border max-w-4xl mx-auto flex flex-col justify-between print:rounded-none print:shadow-none print:p-0 relative transition-all duration-300 ${
            activeTab === "all" || activeTab === "pw3" ? "block" : "hidden print:block"
          } ${
            themeMode === "cream" 
              ? "bg-[#faf7f2] border-[#e8e2d5] shadow-xl text-slate-900 p-8 md:p-12" 
              : "bg-white border-2 border-black shadow-none text-black p-8 md:p-12"
          }`}
        >
            {themeMode === "cream" && (
              <div className="absolute top-0 right-[25mm] bottom-0 w-[1px] bg-red-200/50 pointer-events-none no-print" />
            )}
            {/* Top Row with Title */}
            <div className="relative pb-4 mb-6 text-center min-h-[112px] flex flex-col justify-center">
              {/* Court Header Details - Perfectly Centered */}
              <div className="mx-auto max-w-lg">
                <h1 className={`text-xl md:text-2xl font-bold court-title font-sans ${themeMode === "cream" ? "text-slate-900" : "text-black border-b-2 border-black pb-2"}`}>
                  State Vs. {toUrdu(data.accusedName) || "____________"}
                </h1>
                <p className={`text-sm font-semibold mt-1.5 font-sans ${themeMode === "cream" ? "text-slate-700" : "text-black"}`}>
                  FIR No: <span className="font-mono">{data.firNumber || "____________"}</span> &bull; Police Station: {toUrdu(data.policeStation) || "____________"}
                </p>
              </div>
            </div>

            {/* Witness Detail Line - Clean formatting matching handwritten style */}
            <div className={`urdu-text text-right text-base font-bold mb-1 ${themeMode === "cream" ? "text-slate-950" : "text-black"}`}>
              PW-3. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {formatDateUrdu(fields.evidenceDate) || "____________"}
            </div>
            <div className={`urdu-text text-right text-base mb-4 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>
              {renderMixedText(`بیان ازاں: ${toUrdu(data.witness1Name)} (${toUrdu(data.witness1Rank)}) [No. ${toUrdu(data.witness1BeltNumber)}] حال تعینات: ${fields.pw3PresentPosting ? toUrdu(fields.pw3PresentPosting) : "_____________"}`)}
            </div>

            {/* Urdu Statement Narrative content */}
            <div className={`urdu-text text-right text-base md:text-lg leading-loose tracking-wide font-normal flex-1 px-2 whitespace-pre-wrap mb-6 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>
              {renderMixedText(pw3Content)}
            </div>

            {/* Cross-Examination Section - Authentic court cross examination for PW3 (Recovery Witness) */}
            <div className="mt-6 pt-4 urdu-text text-right">
              <p className={`font-bold mb-2 ${themeMode === "cream" ? "text-slate-950" : "text-black"}`}>جرح منجانب وکیل ملزم:</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ مورخہ وقوعہ کو میں تفتیشی افسر کے ہمراہ موجود نہ تھا اور نہ ہی کوئی ریڈ کی گئی؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ ملزم سے کوئی شراب برآمد نہ ہوئی اور فرد مقبوضگی پر مجھ سے بعد میں تھانہ میں دستخط کروائے گئے؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ موقع پر پبلک سے کسی آزاد گواہ کو شامل نہیں کیا گیا؟</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4"}>ج: یہ غلط ہے۔</p>
              <p className={themeMode === "cream" ? "text-slate-900 pr-4" : "text-black pr-4 font-medium"}>س: یہ غلط ہے کہ میں نے ماتحت ملازم ہونے کی وجہ سے تفتیشی افسر کے کہنے پر جھوٹی گواہی دی ہے؟</p>
              <p className={`pr-4 mb-6 ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>ج: یہ غلط ہے۔</p>
              
              <div className={`grid grid-cols-2 mt-8 border-t pt-6 ${themeMode === "cream" ? "border-slate-200" : "border-black"}`} style={{ direction: "ltr" }}>
                {/* Left Side: سن کر درست تسلیم کیا */}
                <div className="text-left urdu-text" style={{ direction: "rtl" }}>
                  <p className={`font-bold underline text-sm md:text-base cursor-pointer ${themeMode === "cream" ? "text-slate-900" : "text-black"}`}>سن کر درست تسلیم کیا</p>
                  <p className="text-[10px] text-slate-400 font-sans mt-1">Signature / Thumb Impression</p>
                </div>
                
                {/* Right Side: Witness Details */}
                <div className="text-right urdu-text" style={{ direction: "rtl" }}>
                  <p className={`text-xs font-bold ${themeMode === "cream" ? "text-slate-800" : "text-black"}`}>گواہ برآمدگی / موقع (PW-3)</p>
                  <p className={`text-xs font-normal mt-0.5 font-sans ${themeMode === "cream" ? "text-slate-500" : "text-black"}`}>{toUrdu(data.witness1Name)} {toUrdu(data.witness1Rank)}</p>
                </div>
              </div>
            </div>
          </div>

        {/* PAGE 4: Statement u/s 342 Cr.P.C. (English) */}
        <div
          id="s342-page"
          className={`legal-print-page border max-w-4xl mx-auto flex flex-col justify-between print:rounded-none print:shadow-none print:p-0 relative transition-all duration-300 font-serif ${
            activeTab === "all" || activeTab === "s342" ? "block" : "hidden print:block"
          } ${
            themeMode === "cream"
              ? "bg-[#faf7f2] border-[#e8e2d5] shadow-xl text-slate-900 p-8 md:p-12"
              : "bg-white border-2 border-black shadow-none text-black p-8 md:p-12"
          }`}
        >
            {themeMode === "cream" && (
              <div className="absolute top-0 right-[25mm] bottom-0 w-[1px] bg-red-200/50 pointer-events-none no-print" />
            )}

            {/* Quick Actions Bar for Section 342 (No-Print) */}
            <div className="no-print mb-4 pb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-sans font-bold text-slate-600 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-600" />
                Section 342 Cr.P.C. Examination of Accused (English)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing342(!isEditing342)}
                  className={`px-3 py-1.5 rounded-lg font-sans font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                    isEditing342
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {isEditing342 ? "Done Editing" : "Edit Q&A"}
                </button>
                {isEditing342 && (
                  <button
                    type="button"
                    onClick={handleReset342}
                    className="px-3 py-1.5 rounded-lg font-sans font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy342}
                  className={`px-3 py-1.5 rounded-lg font-sans font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    copied342
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {copied342 ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Text
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div>
              <div className="text-center pb-4 mb-4 border-b border-slate-300">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-600 font-sans">
                  IN THE COURT OF SPECIAL JUDICIAL MAGISTRATE / TRIAL COURT
                </p>
                <h1 className="text-xl md:text-2xl font-black mt-1 font-serif tracking-tight">
                  State Vs. {data.accusedName || "Accused"}
                </h1>
                <div className="text-xs font-sans mt-2 space-y-0.5 text-slate-700">
                  <p>
                    <span className="font-semibold">FIR No:</span> {data.firNumber || "____________"} &bull;{" "}
                    <span className="font-semibold">Police Station:</span> {data.policeStation || "____________"}
                  </p>
                  <p>
                    <span className="font-semibold">Offence:</span> Under Section 3/4 The Prohibition (Enforcement of Hadd) Order, 1979
                  </p>
                  <p>
                    <span className="font-semibold">Date of Examination:</span> {formatDateEnglish(fields.evidenceDate) || "____________"}
                  </p>
                </div>
              </div>

              {/* Title & Accused Particulars */}
              <div className="mb-6">
                <div className="text-center mb-3">
                  <h2 className="text-sm md:text-base font-extrabold underline tracking-wide uppercase font-serif">
                    STATEMENT OF ACCUSED UNDER SECTION 342 Cr.P.C.
                  </h2>
                </div>
                <div className="text-xs leading-relaxed font-serif bg-slate-500/5 p-3 rounded border border-slate-200">
                  <p>
                    Statement of accused <span className="font-bold">{data.accusedName || "____________"}</span> son of{" "}
                    <span className="font-bold">{data.fatherName || "____________"}</span>, Caste:{" "}
                    <span className="font-bold">{data.caste || "—"}</span>, Resident of:{" "}
                    <span className="font-bold">{data.address || "____________"}</span>, recorded on examination under Section 342 of Code of Criminal Procedure, 1898:
                  </p>
                </div>
              </div>

              {/* Questions & Answers */}
              <div className="space-y-4 text-xs md:text-sm font-serif leading-relaxed">
                {statement342Questions.map((q) => (
                  <div key={q.id} className="border-b border-slate-200/60 pb-3">
                    <div className="flex items-start gap-2">
                      <span className="font-bold shrink-0">Q. No. {q.id}:</span>
                      {isEditing342 ? (
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(q.id, "question", e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded font-sans bg-white"
                        />
                      ) : (
                        <p className="font-medium text-slate-800">{q.question}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-2 mt-1.5 pl-4">
                      <span className="font-bold shrink-0 text-slate-900">Ans:</span>
                      {isEditing342 ? (
                        <textarea
                          rows={2}
                          value={q.answer}
                          onChange={(e) => handleUpdateQuestion(q.id, "answer", e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded font-sans bg-white"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 italic">{q.answer}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification and Signatures Footer */}
            <div className="mt-8 pt-4 border-t-2 border-slate-300 text-xs font-serif">
              <div className="text-center font-bold tracking-widest text-sm mb-6">
                R.O. & A.C.
                <p className="text-[10px] font-sans font-normal text-slate-500 uppercase tracking-tight">
                  (Read Over and Accepted Correct)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 items-end pt-4">
                {/* Left Side: Accused Signature / Thumb */}
                <div className="text-left">
                  <div className="h-14 border-b border-dashed border-slate-400 max-w-[200px]" />
                  <p className="font-bold mt-1 text-slate-800">Signature / Thumb Impression</p>
                  <p className="text-[11px] text-slate-600 font-sans">
                    Accused: {data.accusedName || "____________"} s/o {data.fatherName || "____________"}
                  </p>
                </div>

                {/* Right Side: Presiding Officer Signature */}
                <div className="text-right">
                  <div className="h-14 border-b border-dashed border-slate-400 ml-auto max-w-[200px]" />
                  <p className="font-bold mt-1 text-slate-800">Special Judicial Magistrate</p>
                  <p className="text-[11px] text-slate-600 font-sans">Trial Court, Punjab</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Dated: {formatDateEnglish(fields.evidenceDate) || "____________"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
