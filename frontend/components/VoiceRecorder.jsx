'use client';

import { useRef, useState } from 'react';
import { blobToBase64 } from '../lib/api';

export default function VoiceRecorder({ language, onAudioReady, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const base64 = await blobToBase64(blob);
          onAudioReady(base64);
        } catch (err) {
          onError('Failed to process audio');
        }
        // Clean up stream
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(100); // collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        onError('Microphone permission denied. Please allow access in your browser.');
      } else {
        onError('Could not access microphone: ' + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isRecording) {
    return (
      <div className="recorder-ui">
        <div className="waveform" aria-label="Recording waveform">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar" style={{ height: `${20 + Math.random() * 20}px` }} />
          ))}
        </div>
        <span className="recorder-text">Listening...</span>
        <button className="stop-recording-btn" onClick={stopRecording} id="stop-recording">
          ⏹ Stop
        </button>
      </div>
    );
  }

  return (
    <button
      className="action-btn mic"
      onClick={startRecording}
      title="Click to speak"
      id="start-recording"
      aria-label="Start voice recording"
    >
      🎤
    </button>
  );
}
