function pickKoreanVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "ko-KR") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("ko")) ??
    null
  );
}

/**
 * Speak Korean with retries — iOS often needs getVoices() to load first,
 * and may ignore speak() without a user gesture (caller should keep that).
 */
export function speakKorean(text: string): { ok: boolean; message?: string } {
  if (typeof window === "undefined") {
    return { ok: false, message: "Không hỗ trợ trên môi trường này" };
  }
  if (!window.speechSynthesis) {
    return { ok: false, message: "Trình duyệt không hỗ trợ phát âm" };
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = 0.95;

  const voice = pickKoreanVoice();
  if (voice) utter.voice = voice;

  // Some mobile browsers return empty voices until "voiceschanged".
  if (!voice && window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        const v = pickKoreanVoice();
        if (v) utter.voice = v;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      },
      { once: true },
    );
  }

  try {
    window.speechSynthesis.speak(utter);
    // iOS quirk: resume if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Không phát được. Thử lại hoặc bật âm lượng." };
  }
}
