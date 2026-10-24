import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, HelpCircle } from "lucide-react";
import { FIRData } from "../types";
import { proofreadFIRData } from "../utils/urduProofreader";
import { analyzeFir } from "../utils/backend";
import { shrinkImageIfLarge } from "../utils/imageCompress";

interface UploadSectionProps {
  onAnalysisComplete: (data: FIRData) => void;
  onError: (msg: string) => void;
}

export default function UploadSection({ onAnalysisComplete, onError }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isLoading]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // High-quality Pakistani Court FIR Presets in Urdu for testing
  const presets = [
    {
      id: "informer",
      name: "Sample 1: Informer Case (Type A)",
      description: "Mukhbar Informed Police before the Raid",
      fileType: "image/png",
      data: "preset_informer"
    },
    {
      id: "direct",
      name: "Sample 2: Direct Recovery (Type B)",
      description: "Routine Patrol Police Encounter & Recovery",
      fileType: "image/png",
      data: "preset_direct"
    }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file) {
      onError("No file selected.");
      return;
    }

    const fileNameClean = (file.name || "").trim();
    // Extract extension more robustly, removing any trailing dots, spaces, or query characters
    const extParts = fileNameClean.split(/[?#]/)[0].split(".");
    const rawExt = extParts.length > 1 ? extParts.pop() : "";
    const ext = (rawExt || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    const validExtensions = ["pdf", "png", "jpg", "jpeg"];
    const fileTypeLower = (file.type || "").toLowerCase().trim();

    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/x-png"
    ];

    // Check if MIME type looks like a valid document/image type
    let isValidType = false;
    if (fileTypeLower) {
      isValidType = 
        validTypes.includes(fileTypeLower) || 
        fileTypeLower.includes("pdf") || 
        fileTypeLower.includes("png") || 
        fileTypeLower.includes("jpeg") || 
        fileTypeLower.includes("jpg") ||
        fileTypeLower.startsWith("image/");
    }

    // Check if extension looks like a valid document/image extension
    const isValidExt = validExtensions.includes(ext) ||
                       fileNameClean.toLowerCase().endsWith(".pdf") ||
                       fileNameClean.toLowerCase().endsWith(".png") ||
                       fileNameClean.toLowerCase().endsWith(".jpg") ||
                       fileNameClean.toLowerCase().endsWith(".jpeg");

    // We only fail if BOTH are completely unrecognized and the file lacks any indicators of being a PDF or image
    if (!isValidType && !isValidExt) {
      onError("Invalid file format. Please upload a PDF, JPG, JPEG, or PNG file.");
      return;
    }

    // Normalize MIME type for the API/Gemini
    let mimeType = file.type ? fileTypeLower : "";
    if (!mimeType) {
      if (ext === "pdf" || fileNameClean.toLowerCase().endsWith(".pdf")) {
        mimeType = "application/pdf";
      } else if (ext === "png" || fileNameClean.toLowerCase().endsWith(".png")) {
        mimeType = "image/png";
      } else if (ext === "jpg" || ext === "jpeg" || fileNameClean.toLowerCase().endsWith(".jpg") || fileNameClean.toLowerCase().endsWith(".jpeg")) {
        mimeType = "image/jpeg";
      } else {
        // Safe fallback guess based on size (PDFs are typically larger, images smaller)
        mimeType = file.size > 2 * 1024 * 1024 ? "application/pdf" : "image/jpeg";
      }
    } else {
      // Normalize specific types to standard types
      if (mimeType === "image/jpg" || mimeType === "image/pjpeg" || mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        mimeType = "image/jpeg";
      } else if (mimeType === "image/x-png" || mimeType.includes("png")) {
        mimeType = "image/png";
      } else if (mimeType.includes("pdf")) {
        mimeType = "application/pdf";
      } else if (mimeType.startsWith("image/")) {
        // keep as is
      } else {
        // If it is a generic type like octet-stream, but we have a valid extension, override it
        if (ext === "pdf" || fileNameClean.toLowerCase().endsWith(".pdf")) {
          mimeType = "application/pdf";
        } else if (ext === "png" || fileNameClean.toLowerCase().endsWith(".png")) {
          mimeType = "image/png";
        } else if (ext === "jpg" || ext === "jpeg" || fileNameClean.toLowerCase().endsWith(".jpg") || fileNameClean.toLowerCase().endsWith(".jpeg")) {
          mimeType = "image/jpeg";
        } else {
          mimeType = "image/jpeg"; // ultimate fallback
        }
      }
    }

    setIsLoading(true);
    setLoadingStep("Reading uploaded document...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result as string;
        // Strip out the data url scheme prefix (e.g. "data:image/png;base64,")
        let base64Content = base64Data.split(",")[1];
        let sendMimeType = mimeType;

        const shrunk = await shrinkImageIfLarge(file, mimeType);
        if (shrunk) {
          base64Content = shrunk.base64;
          sendMimeType = shrunk.mimeType;
        }

        setLoadingStep("Reading the FIR with AI (usually under a minute)...");
        const parsedData = await analyzeFir(base64Content, sendMimeType);
        setLoadingStep("Executing intelligence extraction & classification...");
        onAnalysisComplete(proofreadFIRData(parsedData));
      } catch (err: any) {
        console.error(err);
        onError(err.message || "An error occurred while communicating with the AI server. Please make sure your Gemini API key is configured.");
      } finally {
        setIsLoading(false);
        setLoadingStep("");
      }
    };

    reader.onerror = () => {
      onError("Error reading file.");
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePresetSelect = async (presetId: string) => {
    setIsLoading(true);
    setLoadingStep("Loading preset legal narrative...");

    try {
      // Simulate highly advanced Urdu OCR/Gemini extraction on high-quality real case text
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLoadingStep("Analyzing narrative grammar and syntax...");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setLoadingStep("Extracting entities (Witnesses, Ranks, Liquor)...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      let mockResult: FIRData;

      if (presetId === "informer") {
        mockResult = {
          caseTitle: "State Vs. Sajid Masih",
          firNumber: "142/2026",
          policeStation: "Nishtar Colony, Lahore",
          dateOfOccurrence: "15-05-2026",
          timeOfOccurrence: "21:30",
          complainantName: "Muhammad Farooq (ASI)",
          ioName: "Amjad Ali",
          ioRank: "Sub-Inspector",
          ioBeltNumber: "4110/L",
          witness1Name: "Tanveer Ahmad",
          witness1BeltNumber: "8841/C",
          witness1Rank: "Constable",
          witness2Name: "Kashif Masih",
          witness2BeltNumber: "9122/C",
          witness2Rank: "Constable",
          moharrarName: "Zaka Ullah",
          moharrarRank: "Head Constable",
          accusedName: "Sajid Masih",
          fatherName: "Binyameen",
          caste: "Masih",
          address: "Gharbi Mohallah, Nishtar Colony, Lahore",
          recoveryPlace: "Near Nishtar Main Gate Bridge, Lahore",
          liquorQuantity: "50 Liters",
          bottleCount: "", // No bottles, stored in Can
          canDescription: "Plastic Can Blue Color (50L capacity)",
          sampleQuantity: "1000 ml",
          sealName: "AA",
          exhibitNumbers: "Ex.PA, Ex.PB, Ex.PC, Ex.PD",
          caseType: "Informer",
          ocrText: "مقدمہ نمبر 142/26 بجرم 3/4 امتناع شراب۔ تھانہ نشتر کالونی لاہور۔ منجانب ASI محمد فاروق رپورٹ بضمن گشت و ناکہ بندی۔ دوران گشت مخبر خاص نے اطلاع دی کہ ساجد مسیح ولد بنیامین سکنہ غربی محلہ نشتر کالونی لاہور بھاری مقدار میں شراب لا رہا ہے۔ اگر ناکہ بندی کی جائے تو گرفتار ہو سکتا ہے۔ جس پر تفتیشی امجد علی SI نے ناکہ بندی کی اور ملزم کو کین پلاسٹک نیلے رنگ سمیت گرفتار کیا جس سے 50 لیٹر شراب برآمد ہوئی۔ نمونہ 1000 ملی لیٹر الگ کر کے مہر AA سے سر بمہر کیا گیا۔"
        };
      } else {
        mockResult = {
          caseTitle: "State Vs. Zaheer Ahmad",
          firNumber: "89/2026",
          policeStation: "Civil Lines, Gujranwala",
          dateOfOccurrence: "02-06-2026",
          timeOfOccurrence: "11:15",
          complainantName: "Sajid Mahmood (ASI)",
          ioName: "Muhammad Aslam",
          ioRank: "Sub-Inspector",
          ioBeltNumber: "1025/G",
          witness1Name: "Abdul Rauf",
          witness1BeltNumber: "5140/C",
          witness1Rank: "Constable",
          witness2Name: "Muhammad Bilal",
          witness2BeltNumber: "3291/C",
          witness2Rank: "Constable",
          moharrarName: "Liaqat Ali",
          moharrarRank: "Head Constable",
          accusedName: "Zaheer Ahmad",
          fatherName: "Bashir Ahmad",
          caste: "Arain",
          address: "Sialkot Bypass Road, Gujranwala",
          recoveryPlace: "Near Bypass Bridge Main G.T. Road, Gujranwala",
          liquorQuantity: "24 Bottles",
          bottleCount: "24 Bottles", // Bottles explicitly in FIR
          canDescription: "Shopping Bag Black Color containing Liquor Bottles",
          sampleQuantity: "2 Bottles",
          sealName: "MA",
          exhibitNumbers: "Ex.PA, Ex.PB, Ex.PC, Ex.PD",
          caseType: "Direct Recovery",
          ocrText: "تفصیلات مقدمہ نمبر 89/26 بجرم 3/4 امتناع شراب۔ رپورٹ محمد اسلم SI ہمراہ گواہان کانسٹیبل عبدالرؤف اور محمد بلال۔ دوران گشت بضمن جرائم ایک شخص کو پیدل آتے دیکھا جس کے ہاتھ میں کالا شاپنگ بیگ تھا جو پولیس کو دیکھ کر گھبرا گیا اور مڑ کر بھاگنے لگا۔ جس کو کانسٹیبل نے قابو کیا۔ تلاشی لینے پر بیگ سے 24 بوتل شراب دیسی برآمد ہوئی۔ جس میں سے 2 بوتلیں بطور نمونہ الگ کی گئیں اور پارسل سر بمہر مہر MA تیار کیا گیا۔"
        };
      }

      onAnalysisComplete(proofreadFIRData(mockResult));
    } catch (err) {
      onError("Failed to load preset sample data.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">Generate Court Ready PW Evidence</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Upload an Urdu FIR from a liquor case. BFR will automatically read the FIR, extract all trial parameters, classify the case type, and format court evidence perfectly.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-indigo-200 bg-indigo-50/20 rounded-xl min-h-[300px]">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
            <Sparkles className="h-6 w-6 text-indigo-600 absolute top-5 left-5 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Processing FIR Document</h3>
          <p className="text-xs text-indigo-700 font-mono animate-pulse bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            {loadingStep}{elapsed > 0 ? ` (${elapsed}s)` : ""}
          </p>
          <div className="mt-6 text-center max-w-xs text-slate-400 text-xs">
            Using Gemini AI to analyze legal Urdu language and structures without making guesses.
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 min-h-[260px] ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/30 scale-[1.02]"
                : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
            }`}
            id="drag-and-drop-container"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,image/png,image/jpeg,image/jpg"
              className="hidden"
            />
            <div className="bg-slate-100 text-slate-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Upload Urdu FIR Document</h3>
            <p className="text-xs text-slate-500 mb-4 text-center">
              Drag & drop your file here, or <span className="text-indigo-600 font-semibold underline">browse files</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold">PDF</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold">JPG</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold">JPEG</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold">PNG</span>
            </div>
          </div>

          {/* Preset Samples */}
          <div>
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Or Try With Court Presets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/20 text-left transition-all duration-150 shadow-2xs cursor-pointer group"
                >
                  <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Informational Guidelines Banner */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-700 mb-1">How AI OCR Extraction Works:</p>
              By utilizing multi-modal AI intelligence, our system reads complete Urdu scripts, parses legal vocabulary, detects names, witnesses, dates, weights, and formats court-ready templates. It strictly matches statutory formats without modifying or paraphrasing.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
