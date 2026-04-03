import axios from 'axios';
import FormData from 'form-data';

const SARVAM_BASE_URL = 'https://api.sarvam.ai';

const sarvamHeaders = () => ({
  'api-subscription-key': process.env.SARVAM_API_KEY || '',
});

// Language code mapping: our internal codes → Sarvam codes
const langMap = {
  'hi': 'hi-IN',
  'hi-IN': 'hi-IN',
  'mr': 'mr-IN',
  'mr-IN': 'mr-IN',
  'ta': 'ta-IN',
  'ta-IN': 'ta-IN',
  'en': 'en-IN',
  'en-IN': 'en-IN',
  'te': 'te-IN',
  'kn': 'kn-IN',
  'bn': 'bn-IN',
  'gu': 'gu-IN',
  'ml': 'ml-IN',
};

function getSarvamLang(code) {
  return langMap[code] || 'en-IN';
}

/**
 * Speech-to-Text using Sarvam Saaras v3
 * @param {string} audioBase64 - Base64 encoded audio (WAV/MP3/WebM)
 * @param {string} language - Language code e.g. 'hi', 'mr', 'ta'
 * @returns {Promise<string>} - Transcript text
 */
export async function speechToText(audioBase64, language = 'hi') {
  try {
    const sarvamLang = getSarvamLang(language);
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });
    formData.append('model', 'saaras:v3');
    formData.append('language_code', sarvamLang);

    const response = await axios.post(
      `${SARVAM_BASE_URL}/speech-to-text`,
      formData,
      {
        headers: {
          ...sarvamHeaders(),
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    return response.data?.transcript || '';
  } catch (err) {
    console.error('Sarvam STT error:', err?.response?.data || err.message);
    // Fallback: return empty string, caller will handle
    return '';
  }
}

/**
 * Translate text using Sarvam mayura:v1
 * @param {string} text
 * @param {string} sourceLang - e.g. 'hi', 'mr', 'ta', 'en'
 * @param {string} targetLang - e.g. 'en', 'hi'
 * @returns {Promise<string>} - Translated text
 */
export async function translate(text, sourceLang = 'hi', targetLang = 'en') {
  if (!text || text.trim() === '') return text;
  if (sourceLang === targetLang || sourceLang === 'en' && targetLang === 'en') return text;

  try {
    const response = await axios.post(
      `${SARVAM_BASE_URL}/translate`,
      {
        input: text,
        source_language_code: getSarvamLang(sourceLang),
        target_language_code: getSarvamLang(targetLang),
        model: 'mayura:v1',
        mode: 'formal',
      },
      {
        headers: {
          ...sarvamHeaders(),
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    return response.data?.translated_text || text;
  } catch (err) {
    console.error('Sarvam Translate error:', err?.response?.data || err.message);
    return text; // Fallback: return original
  }
}

/**
 * Text-to-Speech using Sarvam Bulbul v3
 * @param {string} text
 * @param {string} language - e.g. 'hi', 'mr', 'ta', 'en'
 * @returns {Promise<string>} - Base64 encoded audio (WAV)
 */
export async function textToSpeech(text, language = 'hi') {
  if (!text || text.trim() === '') return null;

  // Valid speakers for bulbul:v2: anushka, abhilash, manisha, vidya, arya, karun, hitesh
  const speakerMap = {
    'hi-IN': 'anushka',
    'mr-IN': 'manisha',
    'ta-IN': 'vidya',
    'en-IN': 'anushka',
    'te-IN': 'anushka',
    'kn-IN': 'manisha',
    'bn-IN': 'manisha',
    'gu-IN': 'vidya',
    'ml-IN': 'anushka',
  };

  const sarvamLang = getSarvamLang(language);

  try {
    // Split long text into chunks (Sarvam TTS limit: ~500 chars per call)
    const chunks = splitTextIntoChunks(text, 450);
    const audioParts = [];

    for (const chunk of chunks) {
      const response = await axios.post(
        `${SARVAM_BASE_URL}/text-to-speech`,
        {
          inputs: [chunk],
          target_language_code: sarvamLang,
          speaker: speakerMap[sarvamLang] || 'anushka',
          model: 'bulbul:v2',
          pace: 1.0,
          enable_preprocessing: true,
        },
        {
          headers: {
            ...sarvamHeaders(),
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const audios = response.data?.audios;
      if (audios && audios.length > 0) {
        audioParts.push(audios[0]);
      }
    }

    // Return first audio chunk (simplification for demo; in prod, concatenate WAV buffers)
    return audioParts[0] || null;
  } catch (err) {
    console.error('Sarvam TTS error:', err?.response?.data || err.message);
    return null;
  }
}

function splitTextIntoChunks(text, maxLen) {
  const sentences = text.split(/(?<=[.!?।])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) chunks.push(current);
      current = sentence.length <= maxLen ? sentence : sentence.substring(0, maxLen);
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
}
