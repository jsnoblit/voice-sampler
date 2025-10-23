export enum VoiceName {
  Zephyr = 'zephyr',
  Kore = 'kore',
  Puck = 'puck',
  Charon = 'charon',
  Fenrir = 'fenrir',
  Umbriel = 'umbriel',
  Erinome = 'erinome',
  Leda = 'leda',
  Autonoe = 'autonoe',
  Gacrux = 'gacrux',
}

export interface VoiceOption {
  value: VoiceName;
  label: string;
}

export type EmphasisLevel = 'none' | 'moderate' | 'strong' | 'reduced';

export interface EmphasisOption {
  value: EmphasisLevel;
  label: string;
}

export type StyleModifier = 'none' | 'sarcasm' | 'robotic' | 'shouting' | 'whispering' | 'extremely_fast';

export interface StyleModifierOption {
  value: StyleModifier;
  label: string;
}
