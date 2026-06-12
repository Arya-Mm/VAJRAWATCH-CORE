const BASE_URL = 'http://localhost:8000';

export async function playWarningAudio() {
  try {
    const audio = new Audio(`${BASE_URL}/warning.mp3`);
    await audio.play();
  } catch (err) {
    console.warn('[VAJRAWATCH] Audio API unavailable: ', err);
    
    // Web Speech API fallback in Nepali (ne-NP)
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speaking first
      window.speechSynthesis.cancel();
      
      const text = 'चेतावनी! थुलागी तालमा गम्भीर जोखिम पत्ता लागेको छ। रातो चेतावनी सक्रिय छ।';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ne-NP';
      utterance.rate = 0.9; // speak slightly slower for clarity
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('[VAJRAWATCH] Speech Synthesis not supported in this browser.');
    }
  }
}
