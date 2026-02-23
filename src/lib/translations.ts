// Multi-language translations for SafeStory
export const translations: Record<string, Record<string, string>> = {
  English: {
    continue: "Continue",
    continueYourJourney: "Continue your journey",
    readAgain: "Read again",
    unsafeChoice: "Child selected an unsafe choice",
    markedAsResolved: "Marked as talked to",
    backToHome: "Back to Home",
  },
  Spanish: {
    continue: "Continuar",
    continueYourJourney: "Continúa tu viaje",
    readAgain: "Leer de nuevo",
    unsafeChoice: "El niño seleccionó una opción insegura",
    markedAsResolved: "Marcado como hablado",
    backToHome: "Volver a Casa",
  },
  French: {
    continue: "Continuer",
    continueYourJourney: "Continuez votre voyage",
    readAgain: "Relire",
    unsafeChoice: "L'enfant a sélectionné un choix non sécuritaire",
    markedAsResolved: "Marqué comme discuté",
    backToHome: "Retour à l'accueil",
  },
  German: {
    continue: "Fortfahren",
    continueYourJourney: "Setzen Sie Ihre Reise fort",
    readAgain: "Nochmal lesen",
    unsafeChoice: "Kind hat eine unsichere Option gewählt",
    markedAsResolved: "Als besprochen markiert",
    backToHome: "Zurück zur Startseite",
  },
  Mandarin: {
    continue: "继续",
    continueYourJourney: "继续你的旅程",
    readAgain: "再读一遍",
    unsafeChoice: "孩子选择了不安全的选项",
    markedAsResolved: "标记为已讨论",
    backToHome: "返回首页",
  },
  Portuguese: {
    continue: "Continuar",
    continueYourJourney: "Continue sua jornada",
    readAgain: "Ler novamente",
    unsafeChoice: "Criança selecionou uma opção insegura",
    markedAsResolved: "Marcado como conversado",
    backToHome: "Voltar para casa",
  },
  Arabic: {
    continue: "متابعة",
    continueYourJourney: "تابع رحلتك",
    readAgain: "إعادة قراءة",
    unsafeChoice: "اختار الطفل خيارًا غير آمن",
    markedAsResolved: "تم تحديده كمناقشة",
    backToHome: "العودة إلى الصفحة الرئيسية",
  },
  Hindi: {
    continue: "जारी रखें",
    continueYourJourney: "अपनी यात्रा जारी रखें",
    readAgain: "फिर से पढ़ें",
    unsafeChoice: "बच्चे ने एक असुरक्षित विकल्प चुना",
    markedAsResolved: "बात की गई के रूप में चिह्नित",
    backToHome: "होम पर वापस जाएं",
  },
  Tamil: {
    continue: "தொடரவும்",
    continueYourJourney: "உங்கள் பயணத்தைத் தொடரவும்",
    readAgain: "மீண்டும் படிக்கவும்",
    unsafeChoice: "குழந்தை ஒரு பாதுகாப்பற்ற தேர்வை தேர்ந்தெடுத்தது",
    markedAsResolved: "பேசப்பட்டது என குறிப்பிடப்பட்டது",
    backToHome: "முகப்புக்கு திரும்பவும்",
  },
  Bengali: {
    continue: "চালিয়ে যান",
    continueYourJourney: "আপনার যাত্রা চালিয়ে যান",
    readAgain: "আবার পড়ুন",
    unsafeChoice: "বাচ্চা একটি অনিরাপদ পছন্দ নির্বাচন করেছে",
    markedAsResolved: "কথোপকথন হিসাবে চিহ্নিত করা হয়েছে",
    backToHome: "বাড়িতে ফিরে যান",
  },
  Marathi: {
    continue: "सुरू ठेवा",
    continueYourJourney: "तुमचे प्रवास सुरू ठेवा",
    readAgain: "पुन्हा वाचा",
    unsafeChoice: "मुलाने असुरक्षित पर्याय निवडला",
    markedAsResolved: "बोलून सुरु केले असे चिह्नित केले",
    backToHome: "घरी परत जा",
  },
  Telugu: {
    continue: "కొనసాగించండి",
    continueYourJourney: "మీ ప్రయాణాన్ని కొనసాగించండి",
    readAgain: "మళ్లీ చదవండి",
    unsafeChoice: "పిల్ల unsafe ఎంపికను ఎంచుకుంది",
    markedAsResolved: "మాట్లాడినట్లు గుర్తించబడింది",
    backToHome: "హోమ్‌కు తిరిగి వెళ్లండి",
  },
  Kannada: {
    continue: "ಮುಂದುವರಿಸಿ",
    continueYourJourney: "ನಿಮ್ಮ ಯಾತ್ರೆಯನ್ನು ಮುಂದುವರಿಸಿ",
    readAgain: "ಮತ್ತೆ ಓದಿ",
    unsafeChoice: "ಬಾಲಕನು ಅಸುರಕ್ಷಿತ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿಕೊಂಡಿದೆ",
    markedAsResolved: "ಮಾತನಾಡಿದಂತೆ ಗುರುತಿಸಲಾಗಿದೆ",
    backToHome: "ಮನೆಗೆ ಹಿಂತಿರುಗಿ",
  },
};

export const getTranslation = (language: string | undefined, key: string): string => {
  // Normalize language name
  const normalizedLang = language ? language.charAt(0).toUpperCase() + language.slice(1).toLowerCase() : "English";

  // Return translation or fallback to English
  return translations[normalizedLang]?.[key] || translations.English[key] || key;
};
