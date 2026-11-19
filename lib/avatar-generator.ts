export type AvatarStyleId =
  | 'sunset_pop'
  | 'midnight_cyber'
  | 'mint_studio'
  | 'peach_editorial';

export type AvatarHairStyle =
  | 'waves'
  | 'bob'
  | 'curly'
  | 'spiky'
  | 'bun'
  | 'fade';

export type AvatarEyeStyle = 'warm' | 'wink' | 'spark' | 'chill';

export type AvatarAccessory =
  | 'none'
  | 'glasses'
  | 'sunglasses'
  | 'headphones'
  | 'earrings';

export type AvatarOutfit = 'hoodie' | 'jacket' | 'sweater' | 'tee';

export type AvatarExpression = 'smile' | 'smirk' | 'grin';

export interface AvatarTraits {
  style: AvatarStyleId;
  hairStyle: AvatarHairStyle;
  hairColor: string;
  skinTone: string;
  eyeStyle: AvatarEyeStyle;
  accessory: AvatarAccessory;
  outfit: AvatarOutfit;
  expression: AvatarExpression;
}

export const AVATAR_STYLE_META: Record<
  AvatarStyleId,
  { label: string; bgStart: string; bgEnd: string; glow: string; accent: string }
> = {
  sunset_pop: {
    label: 'Sunset',
    bgStart: '#FF2E63',
    bgEnd: '#FF9233',
    glow: '#FFD1B3',
    accent: '#FF5A4E',
  },
  midnight_cyber: {
    label: 'Twilight',
    bgStart: '#1D1536',
    bgEnd: '#5B2C6F',
    glow: '#A78BFA',
    accent: '#F472B6',
  },
  mint_studio: {
    label: 'Mint',
    bgStart: '#0F766E',
    bgEnd: '#34D399',
    glow: '#A7F3D0',
    accent: '#14B8A6',
  },
  peach_editorial: {
    label: 'Peach',
    bgStart: '#FB7185',
    bgEnd: '#FBBF24',
    glow: '#FEF08A',
    accent: '#F43F5E',
  },
};

export const AVATAR_HAIR_STYLES: { id: AvatarHairStyle; label: string }[] = [
  { id: 'waves', label: 'Waves' },
  { id: 'curly', label: 'Curly' },
  { id: 'bob', label: 'Sleek Bob' },
  { id: 'bun', label: 'Top Bun' },
  { id: 'spiky', label: 'Textured' },
  { id: 'fade', label: 'Clean Fade' },
];

export const AVATAR_ACCESSORIES: { id: AvatarAccessory; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'sunglasses', label: 'Shades' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'earrings', label: 'Hoops' },
];

export const AVATAR_EXPRESSIONS: { id: AvatarExpression; label: string }[] = [
  { id: 'smile', label: 'Warm Smile' },
  { id: 'smirk', label: 'Playful Smirk' },
  { id: 'grin', label: 'Big Grin' },
];

const SKIN_TONES = [
  { base: '#F8D4C2', shadow: '#E2AC93' },
  { base: '#ECC1A1', shadow: '#CF9671' },
  { base: '#D49B78', shadow: '#B07452' },
  { base: '#A96E4B', shadow: '#844F31' },
  { base: '#7B4B33', shadow: '#593320' },
  { base: '#FADFD3', shadow: '#E0B5A5' },
];

const HAIR_COLORS = [
  '#1E1624',
  '#4A2B24',
  '#B84232',
  '#D99B38',
  '#E03E73',
  '#2E4C6D',
];

const EYE_STYLES: AvatarEyeStyle[] = ['warm', 'wink', 'spark', 'chill'];
const OUTFITS: AvatarOutfit[] = ['hoodie', 'jacket', 'sweater', 'tee'];

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickFrom<T>(items: readonly T[], hash: number, salt: number): T {
  const idx = Math.abs((hash ^ Math.imul(salt, 2654435761)) >>> 0) % items.length;
  return items[idx];
}

export function generateCharacterAvatarTraits(
  prompt: string,
  nonce: number = Date.now()
): AvatarTraits {
  const lower = prompt.toLowerCase();
  const seedHash = hashSeed(`${prompt.trim()}|${nonce}`);

  let style = pickFrom(
    Object.keys(AVATAR_STYLE_META) as AvatarStyleId[],
    seedHash,
    1
  );
  if (lower.includes('sunset') || lower.includes('warm') || lower.includes('fire')) {
    style = 'sunset_pop';
  } else if (
    lower.includes('night') ||
    lower.includes('midnight') ||
    lower.includes('dark') ||
    lower.includes('cyber') ||
    lower.includes('dj')
  ) {
    style = 'midnight_cyber';
  } else if (
    lower.includes('mint') ||
    lower.includes('green') ||
    lower.includes('chill') ||
    lower.includes('sage')
  ) {
    style = 'mint_studio';
  } else if (lower.includes('peach') || lower.includes('gold') || lower.includes('sunny')) {
    style = 'peach_editorial';
  }

  let hairStyle = pickFrom(
    AVATAR_HAIR_STYLES.map((h) => h.id),
    seedHash,
    2
  );
  if (lower.includes('curl')) hairStyle = 'curly';
  else if (lower.includes('bob')) hairStyle = 'bob';
  else if (lower.includes('bun')) hairStyle = 'bun';
  else if (lower.includes('spik') || lower.includes('punk')) hairStyle = 'spiky';
  else if (lower.includes('fade') || lower.includes('short')) hairStyle = 'fade';
  else if (lower.includes('wave')) hairStyle = 'waves';

  let accessory = pickFrom(
    AVATAR_ACCESSORIES.map((a) => a.id),
    seedHash,
    3
  );
  if (lower.includes('headphone') || lower.includes('music') || lower.includes('dj')) {
    accessory = 'headphones';
  } else if (lower.includes('sunglass') || lower.includes('shades') || lower.includes('cool')) {
    accessory = 'sunglasses';
  } else if (lower.includes('glass') || lower.includes('nerd') || lower.includes('book')) {
    accessory = 'glasses';
  } else if (lower.includes('hoop') || lower.includes('earring')) {
    accessory = 'earrings';
  }

  let expression = pickFrom(
    AVATAR_EXPRESSIONS.map((e) => e.id),
    seedHash,
    4
  );
  if (lower.includes('smirk')) expression = 'smirk';
  else if (lower.includes('grin') || lower.includes('happy')) expression = 'grin';
  else if (lower.includes('smile')) expression = 'smile';

  const hairColor = pickFrom(HAIR_COLORS, seedHash, 5);
  const skinTone = pickFrom(SKIN_TONES, seedHash, 6).base;
  const eyeStyle = lower.includes('wink')
    ? 'wink'
    : pickFrom(EYE_STYLES, seedHash, 7);
  const outfit = lower.includes('hoodie')
    ? 'hoodie'
    : lower.includes('jacket')
      ? 'jacket'
      : pickFrom(OUTFITS, seedHash, 8);

  return {
    style,
    hairStyle,
    hairColor,
    skinTone,
    eyeStyle,
    accessory,
    outfit,
    expression,
  };
}

function getSkinShadow(skinTone: string): string {
  const match = SKIN_TONES.find((t) => t.base === skinTone);
  return match?.shadow ?? '#C68E72';
}

function renderBackHair(hairStyle: AvatarHairStyle, hairColor: string): string {
  switch (hairStyle) {
    case 'waves':
      return `
        <path d="M58 118 C52 72, 82 36, 128 36 C174 36, 204 72, 198 118 C206 154, 196 190, 178 205 L78 205 C60 190, 50 154, 58 118 Z" fill="${hairColor}" />
      `;
    case 'curly':
      return `
        <g fill="${hairColor}">
          <circle cx="72" cy="96" r="28" />
          <circle cx="184" cy="96" r="28" />
          <circle cx="92" cy="64" r="30" />
          <circle cx="164" cy="64" r="30" />
          <circle cx="128" cy="54" r="32" />
          <circle cx="64" cy="134" r="24" />
          <circle cx="192" cy="134" r="24" />
          <circle cx="72" cy="166" r="20" />
          <circle cx="184" cy="166" r="20" />
        </g>
      `;
    case 'bob':
      return `
        <path d="M64 114 C62 66, 86 40, 128 40 C170 40, 194 66, 192 114 L196 172 C180 180, 166 176, 162 168 L94 168 C90 176, 76 180, 60 172 Z" fill="${hairColor}" />
      `;
    case 'bun':
      return `
        <circle cx="128" cy="40" r="26" fill="${hairColor}" />
        <ellipse cx="128" cy="44" rx="18" ry="8" fill="#FFFFFF" opacity="0.1" />
        <path d="M74 112 C74 68, 96 48, 128 48 C160 48, 182 68, 182 112 Z" fill="${hairColor}" />
      `;
    case 'spiky':
      return `
        <path d="M72 112 L64 76 L86 80 L88 46 L114 62 L128 32 L144 62 L170 46 L172 80 L194 76 L184 112 Z" fill="${hairColor}" />
      `;
    case 'fade':
      return `
        <path d="M76 108 C76 68, 98 48, 128 48 C158 48, 180 68, 180 108 L174 116 L82 116 Z" fill="${hairColor}" />
      `;
  }
}

function renderFrontHair(hairStyle: AvatarHairStyle, hairColor: string): string {
  switch (hairStyle) {
    case 'waves':
      return `
        <path d="M74 106 C80 74, 108 62, 134 66 C158 70, 178 82, 182 106 C168 88, 148 80, 124 84 C104 88, 86 96, 74 106 Z" fill="${hairColor}" />
        <path d="M98 62 C116 54, 142 54, 158 64" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.18" fill="none" />
      `;
    case 'curly':
      return `
        <g fill="${hairColor}">
          <circle cx="96" cy="76" r="17" />
          <circle cx="124" cy="72" r="19" />
          <circle cx="152" cy="76" r="17" />
        </g>
        <path d="M106 66 C120 60, 136 60, 150 68" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.16" fill="none" />
      `;
    case 'bob':
      return `
        <path d="M72 106 C76 70, 102 58, 128 58 C154 58, 180 70, 184 106 C166 90, 148 86, 128 86 C108 86, 90 90, 72 106 Z" fill="${hairColor}" />
      `;
    case 'bun':
      return `
        <path d="M76 104 C84 74, 106 64, 128 64 C150 64, 172 74, 180 104 C162 84, 144 78, 128 78 C112 78, 94 84, 76 104 Z" fill="${hairColor}" />
      `;
    case 'spiky':
      return `
        <path d="M78 102 L94 74 L112 90 L130 66 L146 88 L166 72 L178 102 C158 88, 142 84, 128 84 C112 84, 96 88, 78 102 Z" fill="${hairColor}" />
      `;
    case 'fade':
      return `
        <path d="M80 96 C88 74, 108 66, 128 66 C148 66, 168 74, 176 96 C158 84, 144 82, 128 82 C112 82, 98 84, 80 96 Z" fill="${hairColor}" />
      `;
  }
}

function renderOutfit(outfit: AvatarOutfit, accent: string): string {
  switch (outfit) {
    case 'hoodie':
      return `
        <path d="M46 256 C52 204, 84 186, 128 186 C172 186, 204 204, 210 256 Z" fill="#23192B" />
        <path d="M86 190 C98 206, 158 206, 170 190 C162 178, 94 178, 86 190 Z" fill="${accent}" opacity="0.92" />
        <line x1="114" y1="204" x2="112" y2="236" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.85" />
        <line x1="142" y1="204" x2="144" y2="236" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.85" />
      `;
    case 'jacket':
      return `
        <path d="M44 256 C50 202, 84 186, 128 186 C172 186, 206 202, 212 256 Z" fill="#18121E" />
        <path d="M102 188 L128 256 L154 188 Z" fill="#F9F5F7" />
        <path d="M86 190 L110 218 L96 228 L78 200 Z" fill="${accent}" />
        <path d="M170 190 L146 218 L160 228 L178 200 Z" fill="${accent}" />
      `;
    case 'sweater':
      return `
        <path d="M46 256 C52 204, 84 186, 128 186 C172 186, 204 204, 210 256 Z" fill="${accent}" />
        <path d="M96 188 C108 204, 148 204, 160 188" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.88" />
      `;
    case 'tee':
      return `
        <path d="M48 256 C54 204, 84 188, 128 188 C172 188, 202 204, 208 256 Z" fill="#FFFFFF" />
        <path d="M98 188 C108 206, 148 206, 158 188" stroke="${accent}" stroke-width="5" stroke-linecap="round" fill="none" />
      `;
  }
}

function renderEyes(eyeStyle: AvatarEyeStyle): string {
  switch (eyeStyle) {
    case 'warm':
      return `
        <path d="M94 114 Q104 108 114 113" stroke="#221721" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <path d="M142 113 Q152 108 162 114" stroke="#221721" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <circle cx="105" cy="126" r="5.5" fill="#1F1520" />
        <circle cx="151" cy="126" r="5.5" fill="#1F1520" />
        <circle cx="107" cy="124" r="1.8" fill="#FFFFFF" />
        <circle cx="153" cy="124" r="1.8" fill="#FFFFFF" />
      `;
    case 'wink':
      return `
        <path d="M94 114 Q104 108 114 113" stroke="#221721" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <path d="M142 115 Q152 110 162 115" stroke="#221721" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <circle cx="105" cy="126" r="5.5" fill="#1F1520" />
        <circle cx="107" cy="124" r="1.8" fill="#FFFFFF" />
        <path d="M143 127 Q151 120 159 127" stroke="#1F1520" stroke-width="3.5" stroke-linecap="round" fill="none" />
      `;
    case 'spark':
      return `
        <path d="M94 112 Q104 105 114 111" stroke="#221721" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <path d="M142 111 Q152 105 162 112" stroke="#221721" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <ellipse cx="105" cy="126" rx="5.5" ry="6.5" fill="#1F1520" />
        <ellipse cx="151" cy="126" rx="5.5" ry="6.5" fill="#1F1520" />
        <circle cx="107" cy="123" r="2.2" fill="#FFFFFF" />
        <circle cx="153" cy="123" r="2.2" fill="#FFFFFF" />
      `;
    case 'chill':
      return `
        <line x1="94" y1="113" x2="114" y2="114" stroke="#221721" stroke-width="3.2" stroke-linecap="round" />
        <line x1="142" y1="114" x2="162" y2="113" stroke="#221721" stroke-width="3.2" stroke-linecap="round" />
        <path d="M99 126 Q105 122 111 126" stroke="#1F1520" stroke-width="3.5" stroke-linecap="round" fill="none" />
        <path d="M145 126 Q151 122 157 126" stroke="#1F1520" stroke-width="3.5" stroke-linecap="round" fill="none" />
      `;
  }
}

function renderMouth(expression: AvatarExpression): string {
  switch (expression) {
    case 'smile':
      return `<path d="M114 151 Q128 162 142 151" stroke="#7A363D" stroke-width="3.6" stroke-linecap="round" fill="none" />`;
    case 'smirk':
      return `<path d="M116 153 Q132 158 144 148" stroke="#7A363D" stroke-width="3.6" stroke-linecap="round" fill="none" />`;
    case 'grin':
      return `
        <path d="M112 148 Q128 166 144 148 Z" fill="#FFFFFF" stroke="#7A363D" stroke-width="2.6" stroke-linejoin="round" />
      `;
  }
}

function renderAccessory(accessory: AvatarAccessory, accent: string): string {
  switch (accessory) {
    case 'none':
      return '';
    case 'glasses':
      return `
        <g stroke="#241826" stroke-width="3" fill="rgba(255,255,255,0.14)">
          <circle cx="105" cy="126" r="14" />
          <circle cx="151" cy="126" r="14" />
          <path d="M119 125 Q128 122 137 125" fill="none" />
          <line x1="82" y1="123" x2="91" y2="125" />
          <line x1="165" y1="125" x2="174" y2="123" />
        </g>
      `;
    case 'sunglasses':
      return `
        <g>
          <rect x="88" y="114" width="33" height="22" rx="8" fill="#18121B" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.35" />
          <rect x="135" y="114" width="33" height="22" rx="8" fill="#18121B" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.35" />
          <line x1="121" y1="123" x2="135" y2="123" stroke="#18121B" stroke-width="3.5" />
          <line x1="94" y1="120" x2="104" y2="130" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.45" stroke-linecap="round" />
          <line x1="141" y1="120" x2="151" y2="130" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.45" stroke-linecap="round" />
        </g>
      `;
    case 'headphones':
      return `
        <g>
          <path d="M71 124 C71 68, 185 68, 185 124" stroke="#221928" stroke-width="9" stroke-linecap="round" fill="none" />
          <rect x="64" y="114" width="16" height="34" rx="8" fill="${accent}" stroke="#191116" stroke-width="2.5" />
          <rect x="176" y="114" width="16" height="34" rx="8" fill="${accent}" stroke="#191116" stroke-width="2.5" />
        </g>
      `;
    case 'earrings':
      return `
        <g stroke="#FBBF24" stroke-width="3" fill="none">
          <circle cx="77" cy="144" r="6" />
          <circle cx="179" cy="144" r="6" />
        </g>
      `;
  }
}

export function generateCharacterAvatarSvg(traits: AvatarTraits): string {
  const palette = AVATAR_STYLE_META[traits.style];
  const shadowTone = getSkinShadow(traits.skinTone);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="Stylized character avatar">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgStart}" />
      <stop offset="100%" stop-color="${palette.bgEnd}" />
    </linearGradient>
    <radialGradient id="haloGrad" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="256" height="256" fill="url(#bgGrad)" />
  <circle cx="128" cy="108" r="110" fill="url(#haloGrad)" />
  ${renderBackHair(traits.hairStyle, traits.hairColor)}
  ${renderOutfit(traits.outfit, palette.accent)}
  <!-- Neck -->
  <rect x="110" y="160" width="36" height="36" rx="14" fill="${shadowTone}" />
  <path d="M110 172 Q128 184 146 172 L146 160 L110 160 Z" fill="${shadowTone}" />
  <!-- Ears -->
  <circle cx="80" cy="130" r="11" fill="${traits.skinTone}" />
  <circle cx="176" cy="130" r="11" fill="${traits.skinTone}" />
  <!-- Face -->
  <rect x="82" y="72" width="92" height="104" rx="44" fill="${traits.skinTone}" />
  <!-- Blush -->
  <ellipse cx="97" cy="140" rx="9" ry="5" fill="#FF6B8B" opacity="0.28" />
  <ellipse cx="159" cy="140" rx="9" ry="5" fill="#FF6B8B" opacity="0.28" />
  <!-- Nose -->
  <path d="M128 128 L125 139 Q128 142 132 139" stroke="${shadowTone}" stroke-width="2.6" stroke-linecap="round" fill="none" />
  ${renderEyes(traits.eyeStyle)}
  ${renderMouth(traits.expression)}
  ${renderFrontHair(traits.hairStyle, traits.hairColor)}
  ${renderAccessory(traits.accessory, palette.accent)}
</svg>`;
}

export function encodeSvgToDataUrl(svg: string): string {
  if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;
  }
  const utf8Bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export function generateCharacterAvatarDataUrl(traits: AvatarTraits): string {
  return encodeSvgToDataUrl(generateCharacterAvatarSvg(traits));
}
