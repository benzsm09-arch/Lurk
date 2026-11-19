import { GAME_MODE_META, UserProfile, WhisperMessage } from './whisperlink';

export type StoryTheme = 'sunset' | 'midnight' | 'coral';

export const STORY_THEMES: Record<
  StoryTheme,
  { label: string; bgStart: string; bgMid: string; bgEnd: string; cardBg: string; cardInk: string; replyInk: string }
> = {
  sunset: {
    label: 'Sunset',
    bgStart: '#FF2E63',
    bgMid: '#FF5A4E',
    bgEnd: '#FF9233',
    cardBg: '#FFFFFF',
    cardInk: '#191116',
    replyInk: '#FFFFFF',
  },
  midnight: {
    label: 'Midnight',
    bgStart: '#140D18',
    bgMid: '#241427',
    bgEnd: '#3B1926',
    cardBg: '#1F1724',
    cardInk: '#F9F5F7',
    replyInk: '#F9F5F7',
  },
  coral: {
    label: 'Coral',
    bgStart: '#FB7185',
    bgMid: '#F97316',
    bgEnd: '#F59E0B',
    cardBg: '#FFFBF9',
    cardInk: '#1F1316',
    replyInk: '#FFFFFF',
  },
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderStoryCardPng(
  message: WhisperMessage,
  profile: UserProfile,
  replyText: string,
  themeKey: StoryTheme
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const theme = STORY_THEMES[themeKey];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, theme.bgStart);
  grad.addColorStop(0.55, theme.bgMid);
  grad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle decorative glow circle
  const radial = ctx.createRadialGradient(840, 320, 40, 840, 320, 560);
  radial.addColorStop(0, 'rgba(255,255,255,0.18)');
  radial.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 1080, 1920);

  // Top handle header
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '600 34px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`WhisperLink · ${profile.handle}`, 540, 220);

  // Question card
  const cardX = 110;
  const cardY = 390;
  const cardW = 860;

  ctx.font = '700 44px system-ui, -apple-system, sans-serif';
  const questionLines = wrapCanvasText(ctx, message.text, cardW - 140);
  const questionBlockH = questionLines.length * 60;
  const cardH = Math.max(400, 220 + questionBlockH);

  // Card shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 24;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.restore();

  // Header strip inside card
  const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + 116);
  headerGrad.addColorStop(0, '#FF2E63');
  headerGrad.addColorStop(1, '#FF9233');
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, 116, 48);
  ctx.clip();
  ctx.fillStyle = headerGrad;
  ctx.fillRect(cardX, cardY, cardW, 116);
  ctx.restore();
  // Square off bottom edge of card header
  ctx.fillStyle = headerGrad;
  ctx.fillRect(cardX, cardY + 72, cardW, 44);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 30px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const modeLabel =
    message.gameMode === 'none'
      ? 'Anonymous Whisper'
      : `Anonymous · ${GAME_MODE_META[message.gameMode].shortLabel}`;
  ctx.fillText(modeLabel, 540, cardY + 70);

  // Message text inside card
  ctx.fillStyle = theme.cardInk;
  ctx.font = '700 44px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  let lineY = cardY + 210;
  for (const line of questionLines) {
    ctx.fillText(line, 540, lineY);
    lineY += 60;
  }

  // Reply text below card
  const trimmedReply = replyText.trim() || 'Tap the link to drop yours.';
  ctx.fillStyle = theme.replyInk;
  ctx.font = '700 54px system-ui, -apple-system, sans-serif';
  const replyLines = wrapCanvasText(ctx, trimmedReply, 840);
  let replyY = cardY + cardH + 150;
  for (const line of replyLines) {
    ctx.fillText(line, 540, replyY);
    replyY += 72;
  }

  // Footer CTA
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 30px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Send a whisper at whisperlink.app/${profile.handle.replace('@', '')}`, 540, 1770);

  return canvas.toDataURL('image/png');
}
