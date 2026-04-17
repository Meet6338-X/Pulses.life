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
    return '';
  }
}

/**
 * Translate text using Sarvam mayura:v1
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
    return text;
  }
}

/**
 * Text-to-Speech using Sarvam Bulbul v2
 * Splits long responses into chunks and concatenates all audio parts
 * so the FULL response is spoken, not just the first sentence.
 *
 * @param {string} text
 * @param {string} language - e.g. 'hi', 'mr', 'ta', 'en'
 * @returns {Promise<string|null>} - Base64 encoded WAV audio of the complete response
 */
export async function textToSpeech(text, language = 'hi') {
  if (!text || text.trim() === '') return null;

  // Valid speakers for bulbul:v2
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
    // Split into chunks — Sarvam TTS limit is ~500 chars per API call
    const chunks = splitTextIntoChunks(text, 450);
    console.log(`🔊 TTS: ${chunks.length} chunk(s) for ${text.length} chars`);

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
      if (audios && audios.length > 0 && audios[0]) {
        audioParts.push(audios[0]);
      }
    }

    if (audioParts.length === 0) return null;

    // Single chunk — return directly
    if (audioParts.length === 1) return audioParts[0];

    // Multiple chunks — concatenate all WAV buffers into one complete audio file
    console.log(`🔊 TTS: Concatenating ${audioParts.length} audio parts`);
    return concatenateWavBase64(audioParts);

  } catch (err) {
    console.error('Sarvam TTS error:', err?.response?.data || err.message);
    return null;
  }
}

// ─── WAV Concatenation ────────────────────────────────────────────────────────

/**
 * Concatenate multiple base64-encoded WAV files into a single WAV.
 * WAV format: 44-byte header + PCM data.
 * We read the header from the first chunk and sum the data from all chunks.
 */
function concatenateWavBase64(base64Parts) {
  try {
    const buffers = base64Parts.map(b64 => Buffer.from(b64, 'base64'));

    // Parse the first WAV header to get audio format info
    const firstBuf = buffers[0];
    const sampleRate    = firstBuf.readUInt32LE(24);
    const numChannels   = firstBuf.readUInt16LE(22);
    const bitsPerSample = firstBuf.readUInt16LE(34);
    const byteRate      = firstBuf.readUInt32LE(28);
    const blockAlign    = firstBuf.readUInt16LE(32);

    // Collect all PCM data (skip the 44-byte WAV header from each chunk)
    const pcmParts = buffers.map(buf => buf.slice(44));
    const totalPcmLen = pcmParts.reduce((sum, p) => sum + p.length, 0);
    const totalFileLen = 44 + totalPcmLen;

    // Build new WAV header
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(totalFileLen - 8, 4);   // file size - 8
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);                 // PCM chunk size
    header.writeUInt16LE(1, 20);                  // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(totalPcmLen, 40);

    const combined = Buffer.concat([header, ...pcmParts]);
    return combined.toString('base64');
  } catch (err) {
    console.error('WAV concatenation error:', err.message);
    // Fallback: return the first chunk if concatenation fails
    return base64Parts[0];
  }
}

// ─── Text Chunking ────────────────────────────────────────────────────────────

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
