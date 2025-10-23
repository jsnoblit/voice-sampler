import { VoiceName, StyleModifier } from './types';
import type { VoiceOption, EmphasisOption, StyleModifierOption } from './types';

export const VOICES: VoiceOption[] = [
  { value: VoiceName.Zephyr, label: 'Zephyr (Male)' },
  { value: VoiceName.Kore, label: 'Kore (Female)' },
  { value: VoiceName.Puck, label: 'Puck (Male)' },
  { value: VoiceName.Charon, label: 'Charon (Male)' },
  { value: VoiceName.Fenrir, label: 'Fenrir (Male)' },
  { value: VoiceName.Umbriel, label: 'Umbriel (Male)' },
  { value: VoiceName.Erinome, label: 'Erinome (Female)' },
  { value: VoiceName.Leda, label: 'Leda (Female)' },
  { value: VoiceName.Autonoe, label: 'Autonoe (Female)' },
  { value: VoiceName.Gacrux, label: 'Gacrux (Male)' },
];

export const EMPHASIS_LEVELS: EmphasisOption[] = [
    { value: 'none', label: 'None' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'strong', label: 'Strong' },
    { value: 'reduced', label: 'Reduced' },
];

export const STYLE_MODIFIERS: StyleModifierOption[] = [
    { value: 'none', label: 'None' },
    { value: 'sarcasm', label: 'Sarcasm' },
    { value: 'robotic', label: 'Robotic' },
    { value: 'shouting', label: 'Shouting' },
    { value: 'whispering', label: 'Whispering' },
    { value: 'extremely_fast', label: 'Extremely Fast' },
];


export const DEFAULT_TEXT = "Hello! This is a sample of my voice. You can adjust my pitch and speaking rate to see how I sound.";
export const DEFAULT_VOICE = VoiceName.Kore;
export const DEFAULT_PITCH = 0;
export const DEFAULT_SPEAKING_RATE = 1.0;
