import { Type, type GoogleGenAI } from "@google/genai";

/**
 * Sends the uploaded Urdu FIR (base64 PDF/image) to Gemini and returns the extracted fields.
 * Shared by the Node server (web + Windows desktop) and by the in-app client (Android).
 */
export async function analyzeFirWithGemini(
  ai: GoogleGenAI,
  fileData: string,
  mimeType: string
): Promise<any> {
    // Prepare content parts for Gemini
    const filePart = {
      inlineData: {
        mimeType: mimeType,
        data: fileData,
      },
    };

    const textPart = {
      text: `Analyze this Urdu FIR (First Information Report) for a liquor recovery case under Section 3/4 of The Prohibition (Enforcement of Hadd) Order, 1979.
      
      Perform the following tasks carefully:
      1. Perform highly accurate Urdu OCR on the entire FIR.
      2. Carefully read the narrative and automatically classify the case into one of two categories:
         - "Informer" (Type A): If a secret informant (مخبر خاص) informed the police about the liquor before the raid, leading them to set up a raid/nakabandi and arrest the accused with the liquor.
         - "Direct Recovery" (Type B): If the police encountered the accused and recovered the liquor during routine patrol/nakabandi, without any prior specific tip-off from an informant.
         Do not make this decision on simple keywords. Read and understand the complete text.
      3. Extract all required fields precisely. Do not guess or invent facts. If a field is not found or cannot be determined with confidence, return it as empty string "" or "Not Found" so the user can input it manually.
      
      4. MANDATORY URDU LANGUAGE & COURT PROOFREADING STANDARDS:
         - Produce grammatically correct, formal Pakistani court Urdu on the first attempt with natural sentence flow.
         - NEVER generate malformed mixed Urdu-English words (e.g. NEVER output "وونکeس", "شeر", "سیددیقوe").
         - Use standard preferred court spellings:
           * "فیض آباد" (NEVER "فایزاباد")
           * "ساجوال" (NEVER "ساجاوال")
           * "جعفر" (NEVER "جافار")
           * "چنگڑ" (NEVER "چانگار")
           * "عاطف" (NEVER "اتیف")
           * "سہیل" (NEVER "سوہایل")
           * "عبدالحمید" (NEVER "عبدال حمید", joined without space)
           * "اونس" for ounces (e.g., "20 اونس", NEVER "وونکeس")
           * "برآمد شدہ شراب" / "برآمد شدہ دیسی شراب" (NEVER "برآمدہ شراب")
           * "مہر 'WA' سے سربمہر کیا" (NEVER "مہر بحروفِ اسمی وا")
         - Ensure correct grammatical agreement for gender and number:
           * e.g. "دو سفید رنگ کے پلاسٹک کین تھے" (NOT "2 کین پلاسٹک رنگ سفید تھی")
           * "دونوں پارسلوں کو مہر 'WA' سے سربمہر کیا"
         - Never duplicate words or phrases (e.g. NEVER write "سکنہ سکنہ", write "سکنہ").
         - Preserve English legal identifiers, ranks, exhibits, and belt numbers cleanly in exact format:
           * ASI, SI, HC, PFSA, FIR, Ex.PA, Ex.PB, Ex.PC, Ex.PD, belt numbers like 1276/C, 1525/C, and seal initials like WA.
      
      Extract the following information:
      - State Vs (The accused name, e.g. State Vs Kamran)
      - FIR Number (e.g., 412/26 or 12/2026)
      - Police Station (e.g. Faisal Town, Lahore)
      - Date of Occurrence (format: DD-MM-YYYY)
      - Time of Occurrence (format: HH:MM or similar)
      - Complainant Name & Rank (usually the police officer who drafted the complaint, e.g. Sajid Mahmood, ASI)
      - Investigating Officer (I.O.) Name & Rank (e.g. Sajid Mahmood, Sub-Inspector)
      - Witness No. 1 Name, Rank (usually Constable or HC) and Belt Number (e.g. "1244/C")
      - Witness No. 2 Name, Rank and Belt Number
      - Moharrar Name (the police clerk/record-keeper, if mentioned, otherwise leave empty)
      - Moharrar Rank (e.g. HC, Head Constable)
      - Accused Name
      - Father Name of Accused
      - Caste of Accused
      - Address of Accused
      - Recovery Place (where the liquor was recovered)
      - Liquor Quantity (e.g., "20 Liters" or "50 Bottles")
      - Bottle Count (Only extract this if actual "bottles" (بوتلیں) are explicitly mentioned in the FIR. Otherwise return empty string "")
      - Can/Cane Description (e.g., "Plastic Cane Blue color" or "کپڑے کا تھیلا")
      - Sample Quantity (e.g., "500 ml" or "1 bottle")
      - Seal Name (the initials or name on the wax seal used to secure the sample, e.g. "SM" or "ASI")
      - Exhibit Numbers (default Ex.PA for recovery memo, Ex.PB for site plan, Ex.PC for search/arrest, Ex.PD for chemical analyzer report)
      - OCR Text: The complete Urdu OCR text of the FIR for verification.`,
    };

    // Reading a document does not need deep reasoning: "low" thinking is much faster.
    const callModel = (lowThinking: boolean) => ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [filePart, textPart],
      config: {
        ...(lowThinking ? { thinkingConfig: { thinkingLevel: "low" as any } } : {}),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caseTitle: { type: Type.STRING, description: "State Vs [Accused Name]" },
            firNumber: { type: Type.STRING, description: "FIR number, format: e.g. 124/2026" },
            policeStation: { type: Type.STRING, description: "Name of the Police Station (Thana)" },
            dateOfOccurrence: { type: Type.STRING, description: "Date of the occurrence" },
            timeOfOccurrence: { type: Type.STRING, description: "Time of the occurrence" },
            complainantName: { type: Type.STRING, description: "Complainant Name & Rank" },
            ioName: { type: Type.STRING, description: "Investigating Officer Name" },
            ioRank: { type: Type.STRING, description: "Investigating Officer Rank (e.g. ASI, SI, HC)" },
            ioBeltNumber: { type: Type.STRING, description: "I.O. Belt Number if available" },
            witness1Name: { type: Type.STRING, description: "Witness No. 1 Name" },
            witness1BeltNumber: { type: Type.STRING, description: "Witness No. 1 Belt Number" },
            witness1Rank: { type: Type.STRING, description: "Witness No. 1 Rank (e.g. Constable, FC)" },
            witness2Name: { type: Type.STRING, description: "Witness No. 2 Name" },
            witness2BeltNumber: { type: Type.STRING, description: "Witness No. 2 Belt Number" },
            witness2Rank: { type: Type.STRING, description: "Witness No. 2 Rank" },
            moharrarName: { type: Type.STRING, description: "Moharrar (police station clerk) Name" },
            moharrarRank: { type: Type.STRING, description: "Moharrar Rank (e.g. Head Constable / HC)" },
            accusedName: { type: Type.STRING, description: "Name of the accused person" },
            fatherName: { type: Type.STRING, description: "Father's name of the accused" },
            caste: { type: Type.STRING, description: "Caste (قوم) of the accused" },
            address: { type: Type.STRING, description: "Address (سکنہ) of the accused" },
            recoveryPlace: { type: Type.STRING, description: "Recovery place description" },
            liquorQuantity: { type: Type.STRING, description: "Total liquor recovered (e.g., 10 liters)" },
            bottleCount: { type: Type.STRING, description: "Exact bottle count if bottles are mentioned, otherwise empty" },
            canDescription: { type: Type.STRING, description: "Description of container (e.g., Plastic Can Blue color)" },
            sampleQuantity: { type: Type.STRING, description: "Sample quantity separated for chemical examiner (e.g., 500ml)" },
            sealName: { type: Type.STRING, description: "Name or letters on the seal (مہر)" },
            exhibitNumbers: { type: Type.STRING, description: "Exhibit list" },
            caseType: { type: Type.STRING, description: "Must be exactly 'Informer' or 'Direct Recovery'" },
            ocrText: { type: Type.STRING, description: "The raw OCR text in Urdu" },
          },
          required: [
            "caseTitle",
            "firNumber",
            "policeStation",
            "dateOfOccurrence",
            "timeOfOccurrence",
            "ioName",
            "ioRank",
            "accusedName",
            "fatherName",
            "recoveryPlace",
            "liquorQuantity",
            "sampleQuantity",
            "sealName",
            "caseType",
            "ocrText"
          ],
        },
      },
    });

    let response;
    try {
      response = await callModel(true);
    } catch (err: any) {
      // If the model rejects the thinking setting, retry once with default settings.
      if (/thinking/i.test(String(err?.message || err))) response = await callModel(false);
      else throw err;
    }

    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText.trim());
  return parsedData;
}
