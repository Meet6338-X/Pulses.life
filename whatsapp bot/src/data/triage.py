"""
Multilingual keyword maps and triage data for Pulses.life.
"""

LANG_DETECT = {
    "en": ["hello", "hi", "help", "start", "menu", "bye"],
    "hi": ["नमस्ते", "हिंदी", "दर्द", "बुखार", "खांसी", "सांस", "सिर", "पेट", "उल्टी",
           "छाती", "मला", "मुझे", "कैसे", "क्या", "मदद", "अस्पताल"],
    "mr": ["मला", "दुखते", "ताप", "खोकला", "श्वास", "डोके", "पोट", "छाती", "रुग्णालय"],
    "ta": ["வலி", "காய்ச்சல்", "இருமல்", "மூச்சு", "தலை", "வயிறு", "மார்பு", "மருத்துவமனை"],
    "bn": ["ব্যথা", "জ্বর", "কাশি", "শ্বাস", "মাথা", "পেট", "বুক", "হাসপাতাল"],
    "te": ["నొప్పి", "జ్వరం", "దగ్గు", "శ్వాస", "తల", "కడుపు", "ఛాతీ", "ఆసుపత్రి"],
}

EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "stroke", "unconscious", "not breathing",
    "difficulty breathing", "can't breathe", "severe bleeding", "seizure",
    "छाती दर्द", "दिल का दौरा", "बेहोश", "सांस नहीं", "सांस लेने में तकलीफ",
    "छाती दुखते", "हृदयविकार", "बेशुद्ध", "श्वास घेता येत नाही",
    "மார்பு வலி", "மாரடைப்பு", "மயக்கம்", "மூச்சு வரவில்லை",
    "বুকে ব্যথা", "হার্ট অ্যাটাক", "অজ্ঞান", "শ্বাস নিতে পারছি না",
    "ఛాతీ నొప్పి", "గుండె పోటు", "స్పృహ తప్పింది", "శ్వాస తీసుకోలేకపోతున్నాను",
]

SYMPTOM_TRIAGE = {
    "fever": {
        "keywords": ["fever", "बुखार", "ताप", "காய்ச்சல்", "জ্বর", "జ్వరం"],
        "department": "General Medicine / OPD",
        "advice_en": (
            "🌡️ *Fever Guidance*\n\n"
            "• If fever is below 102°F (38.9°C): Rest, drink fluids, take paracetamol.\n"
            "• If fever is above 102°F or lasting >3 days: Visit your nearest PHC or OPD.\n"
            "• If fever with rash, stiff neck, or convulsions: Go to Emergency immediately.\n\n"
            "🏥 *Where to go:* General Medicine OPD at your nearest Government Hospital or PHC.\n\n"
            "⚠️ _This is general health information. Please consult a doctor for personal advice._"
        ),
        "advice_hi": (
            "🌡️ *बुखार की जानकारी*\n\n"
            "• अगर बुखार 102°F से कम है: आराम करें, पानी पिएं, पैरासिटामोल लें।\n"
            "• अगर बुखार 102°F से ज्यादा या 3 दिन से अधिक: नजदीकी PHC या OPD जाएं।\n"
            "• बुखार के साथ रैश, गर्दन अकड़न, या दौरे हों: तुरंत Emergency जाएं।\n\n"
            "🏥 *कहाँ जाएं:* सरकारी अस्पताल या PHC में General Medicine OPD।\n\n"
            "⚠️ _यह सामान्य स्वास्थ्य जानकारी है। व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।_"
        ),
        "hospital_type": "PHC / Govt Hospital OPD",
    },
    "cough": {
        "keywords": ["cough", "खांसी", "खोकला", "இருமல்", "কাশি", "దగ్గు"],
        "department": "Respiratory / General Medicine",
        "advice_en": (
            "😷 *Cough Guidance*\n\n"
            "• Dry cough with no fever: Could be allergy or pollution. Drink warm water.\n"
            "• Cough with phlegm + fever: May be chest infection. Visit PHC within 24 hrs.\n"
            "• Coughing blood or severe breathlessness: Go to Emergency NOW.\n\n"
            "🏥 *Where to go:* Respiratory OPD or General Medicine at nearest Govt Hospital.\n\n"
            "⚠️ _This is general health information. Please consult a doctor for personal advice._"
        ),
        "advice_hi": (
            "😷 *खांसी की जानकारी*\n\n"
            "• सूखी खांसी, बुखार नहीं: एलर्जी हो सकती है। गर्म पानी पिएं।\n"
            "• बलगम वाली खांसी + बुखार: छाती का संक्रमण हो सकता है। 24 घंटे में PHC जाएं।\n"
            "• खून की खांसी या सांस फूलना: तुरंत Emergency जाएं।\n\n"
            "🏥 *कहाँ जाएं:* नजदीकी सरकारी अस्पताल में Respiratory OPD।\n\n"
            "⚠️ _यह सामान्य स्वास्थ्य जानकारी है। व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।_"
        ),
        "hospital_type": "PHC / Respiratory OPD",
    },
    "headache": {
        "keywords": ["headache", "head pain", "सिर दर्द", "डोकेदुखी", "தலைவலி", "মাথাব্যথা", "తలనొప్పి"],
        "department": "Neurology / General Medicine",
        "advice_en": (
            "🤕 *Headache Guidance*\n\n"
            "• Mild headache: Rest, hydrate, avoid screens. Take paracetamol if needed.\n"
            "• Severe sudden headache ('worst of your life'): Emergency — may be brain bleed.\n"
            "• Headache + vision changes, vomiting, stiff neck: Emergency immediately.\n\n"
            "🏥 *Where to go:* General Medicine OPD for mild; Emergency for severe sudden onset.\n\n"
            "⚠️ _This is general health information. Please consult a doctor for personal advice._"
        ),
        "advice_hi": (
            "🤕 *सिरदर्द की जानकारी*\n\n"
            "• हल्का सिरदर्द: आराम करें, पानी पिएं, जरूरत हो तो पैरासिटामोल लें।\n"
            "• अचानक बहुत तेज सिरदर्द: Emergency — मस्तिष्क में रक्तस्राव हो सकता है।\n"
            "• सिरदर्द + धुंधला दिखना, उल्टी, गर्दन अकड़ना: तुरंत Emergency जाएं।\n\n"
            "🏥 *कहाँ जाएं:* हल्के दर्द के लिए General OPD; गंभीर के लिए Emergency।\n\n"
            "⚠️ _यह सामान्य स्वास्थ्य जानकारी है। व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।_"
        ),
        "hospital_type": "Govt Hospital OPD / Emergency",
    },
    "stomach": {
        "keywords": ["stomach", "abdomen", "abdominal", "vomit", "diarrhea",
                     "पेट दर्द", "उल्टी", "पोट दुखणे", "வயிற்று வலி", "পেটে ব্যথা", "కడుపు నొప్పి"],
        "department": "Gastroenterology / General Medicine",
        "advice_en": (
            "🤢 *Stomach / Abdomen Guidance*\n\n"
            "• Mild stomach ache or nausea: ORS, light food, rest. Monitor for 6–12 hrs.\n"
            "• Vomiting + diarrhea >2 times: Risk of dehydration. Visit PHC / OPD today.\n"
            "• Severe pain, rigid abdomen, blood in stool: Emergency — could be appendicitis.\n\n"
            "🏥 *Where to go:* PHC or General Medicine OPD; Emergency for severe/rigid abdomen.\n\n"
            "⚠️ _This is general health information. Please consult a doctor for personal advice._"
        ),
        "advice_hi": (
            "🤢 *पेट दर्द / उल्टी की जानकारी*\n\n"
            "• हल्का पेट दर्द या जी मिचलाना: ORS पिएं, हल्का खाना खाएं, 6-12 घंटे देखें।\n"
            "• उल्टी + दस्त 2 से ज्यादा बार: Dehydration का खतरा। आज PHC जाएं।\n"
            "• तेज दर्द, कड़ा पेट, मल में खून: Emergency — Appendicitis हो सकता है।\n\n"
            "🏥 *कहाँ जाएं:* PHC या General OPD; गंभीर के लिए Emergency।\n\n"
            "⚠️ _यह सामान्य स्वास्थ्य जानकारी है। व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।_"
        ),
        "hospital_type": "PHC / Gastro OPD / Emergency",
    },
}
