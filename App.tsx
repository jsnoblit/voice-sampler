import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { EmphasisLevel, StyleModifier, VoiceName } from './types';
import { VOICES, EMPHASIS_LEVELS, STYLE_MODIFIERS, DEFAULT_TEXT, DEFAULT_VOICE, DEFAULT_PITCH, DEFAULT_SPEAKING_RATE } from './constants';
import Slider from './components/Slider';
import VoiceSelector from './components/VoiceSelector';
import PlayIcon from './components/icons/PlayIcon';
import LoadingSpinner from './components/icons/LoadingSpinner';
import ToggleSwitch from './components/ToggleSwitch';

// Audio decoding helpers, as per Gemini API guidance
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const App: React.FC = () => {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(DEFAULT_VOICE);
  const [pitch, setPitch] = useState<number>(DEFAULT_PITCH);
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEAKING_RATE);
  const [emphasis, setEmphasis] = useState<EmphasisLevel>('none');
  const [style, setStyle] = useState<StyleModifier>('none');
  const [addPauses, setAddPauses] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const newText = `${currentText.substring(0, start)} ${tag} ${currentText.substring(end)}`;
    
    setText(newText);
    
    // Focus and set cursor position after the inserted tag
    setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + tag.length + 2;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handlePlaySample = useCallback(async () => {
    if (!text.trim()) {
      setError("Please enter some text to sample.");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // Stop any currently playing audio
    if (currentAudioSource.current) {
        currentAudioSource.current.stop();
        currentAudioSource.current = null;
    }

    if (!audioContextRef.current) {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        } catch (e) {
            setError("AudioContext is not supported by your browser.");
            setIsLoading(false);
            return;
        }
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    // 1. Apply style modifier tag first
    let textToProcess = text;
    if (style !== 'none') {
        const styleTag = `[${style.replace('_', ' ')}]`;
        textToProcess = `${styleTag}${textToProcess}`;
    }

    // 2. Escape for SSML and apply other modifications
    let ssmlProcessedText = textToProcess.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (addPauses) {
        ssmlProcessedText = ssmlProcessedText.replace(/([.?!])\s*/g, '$1 <break time="400ms"/> ');
    }
    if (emphasis !== 'none') {
        ssmlProcessedText = `<emphasis level="${emphasis}">${ssmlProcessedText}</emphasis>`;
    }
    
    // 3. Construct final SSML
    const ssmlText = `<speak><prosody rate="${speed}" pitch="${pitch}st">${ssmlProcessedText}</prosody></speak>`;


    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: ssmlText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice,
              },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && audioContextRef.current) {
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        currentAudioSource.current = source;
      } else {
        throw new Error("No audio data received from the API.");
      }
    } catch (e) {
      console.error(e);
      let errorMessage = "An unknown error occurred.";
      if (e instanceof Error) {
        try {
          // Attempt to parse a structured error from the message
          const jsonMatch = e.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorJson = JSON.parse(jsonMatch[0]);
            errorMessage = errorJson.error.message || e.message;
          } else {
             errorMessage = e.message;
          }
        } catch {
          errorMessage = e.message;
        }
      }
      setError(`Failed to generate audio. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [text, selectedVoice, pitch, speed, emphasis, addPauses, style, isLoading]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-500/10 border border-zinc-700">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Gemini Voice Sampler
            </h1>
            <p className="mt-2 text-zinc-400">
              Experiment with Gemini's text-to-speech capabilities.
            </p>
          </div>

          <div className="space-y-4">
            <div>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to sample..."
                  rows={4}
                  className="w-full p-3 text-base text-zinc-200 bg-zinc-900/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  aria-label="Text to synthesize"
                />
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-zinc-400">Quick Inserts (Non-Speech Sounds)</label>
                <div className="flex flex-wrap gap-2">
                    {['[sigh]', '[laughing]', '[uhm]'].map(tag => (
                        <button 
                            key={tag} 
                            onClick={() => handleInsertTag(tag)}
                            className="px-3 py-1 text-xs font-mono bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md transition-colors"
                            aria-label={`Insert ${tag} tag`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
              <VoiceSelector
                label="Select Voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                options={VOICES}
              />
              <div className="space-y-6">
                <Slider
                    label="Pitch (Semitones)"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    min={-20.0}
                    max={20.0}
                    step={0.1}
                />
                <Slider
                    label="Speed"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    min={0.25}
                    max={4.0}
                    step={0.05}
                />
              </div>
            </div>

            <div>
                <h3 className="text-base font-medium text-zinc-300 mb-3">Voice Effects</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-700">
                    <div className="w-full">
                        <label htmlFor="emphasis-select" className="block mb-2 text-sm font-medium text-zinc-300">
                            Emphasis
                        </label>
                        <div className="relative">
                            <select
                                id="emphasis-select"
                                value={emphasis}
                                onChange={(e) => setEmphasis(e.target.value as EmphasisLevel)}
                                className="block w-full px-3 py-2 text-sm text-white bg-zinc-700 border border-zinc-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                {EMPHASIS_LEVELS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <label htmlFor="style-select" className="block mb-2 text-sm font-medium text-zinc-300">
                            Style
                        </label>
                        <div className="relative">
                            <select
                                id="style-select"
                                value={style}
                                onChange={(e) => setStyle(e.target.value as StyleModifier)}
                                className="block w-full px-3 py-2 text-sm text-white bg-zinc-700 border border-zinc-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                {STYLE_MODIFIERS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 text-sm font-medium text-zinc-300">
                            Add Pauses
                        </label>
                        <div className="h-9 flex items-center">
                            <ToggleSwitch
                                isEnabled={addPauses}
                                onToggle={() => setAddPauses(!addPauses)}
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          {error && (
            <div role="alert" className="p-3 text-sm text-center bg-red-900/50 text-red-300 border border-red-800 rounded-lg">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handlePlaySample}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50"
              aria-live="polite"
            >
              {isLoading ? <LoadingSpinner /> : <PlayIcon />}
              <span>{isLoading ? 'Generating Audio...' : 'Sample Voice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
