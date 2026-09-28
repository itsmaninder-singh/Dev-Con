// Builds each testimonial as a fully self-contained PNG data URL (quote,
// name, role and an initials avatar all drawn on canvas). CircularGallery
// just treats each one as an "image" — since it's a data URL there's no
// network request, no CORS, and no chance of a card failing to load and
// showing black.

const REVIEWS = [
  {
    name: 'Rajneesh Kumar',
    username: 'rajneeshqwer',
    role: 'Full-Stack Dev',
    quote: 'Found my hackathon squad in under a day. DevConnect actually matches on skills and stack, not just who is online.',
    initials: 'RK',
    color: '#ff98a2',
    college: 'LPU',
  },
  {
    name: 'Maninder Singh',
    username: 'maniii',
    role: 'Core Builder & Founder',
    quote: 'Went from solo side-projects to assembling real squads and shipping production-ready apps together in days.',
    initials: 'MS',
    color: '#818cf8',
    college: 'LPU',
  },
  {
    name: 'Divyanshu Dev',
    username: 'divyanshudev121',
    role: 'Full-Stack Engineer',
    quote: 'The availability toggle and skill matching make finding ambitious collaborators effortless and zero hassle.',
    initials: 'DD',
    color: '#34d399',
    college: 'Lovely Professional Univ',
  },
  {
    name: 'gzod',
    username: 'gzod_dev',
    role: 'Frontend & UI Designer',
    quote: 'Formed our entire hackathon squad right here, brainstormed with the AI tools, and shipped it on time.',
    initials: 'GZ',
    color: '#fbbf24',
    college: 'DevConnect Core',
  },
  {
    name: 'Aman Sharma',
    username: 'asdfgh',
    role: 'Backend Developer',
    quote: 'The best platform to discover fellow college builders and assemble engineering squads that actually build.',
    initials: 'AS',
    color: '#c084fc',
    college: 'LPU',
  },
  {
    name: 'Mani Bhai',
    username: 'manibhai121121',
    role: 'Software Engineer',
    quote: 'Connecting with talented builders across colleges has never been this smooth, fast, and seamless.',
    initials: 'MB',
    color: '#38bdf8',
    college: 'Sweden Univ',
  },
];

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(review) {
  const W = 820;
  const H = 820;
  const R = 44;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  roundedRectPath(ctx, 0, 0, W, H, R);
  ctx.clip();

  // Premium background: deep charcoal/onyx gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1c1c24');
  grad.addColorStop(0.45, '#121217');
  grad.addColorStop(1, '#08080a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient radial glow at top-left
  const radialGlow = ctx.createRadialGradient(80, 80, 0, 80, 80, 440);
  radialGlow.addColorStop(0, 'rgba(255, 152, 162, 0.14)');
  radialGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, W, H);

  // Clean glass border
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(255, 152, 162, 0.25)';
  roundedRectPath(ctx, 2, 2, W - 4, H - 4, R);
  ctx.stroke();

  // 1. TOP HEADER: Avatar + Name + @username + Role
  const headerY = 70;
  const avatarRadius = 46;
  const avatarX = 70 + avatarRadius; // 116
  const avatarCenterY = headerY + avatarRadius; // 116

  // Avatar circle
  ctx.beginPath();
  ctx.arc(avatarX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.fillStyle = review.color || '#ff98a2';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.stroke();

  // Avatar initials
  ctx.fillStyle = '#08080a';
  ctx.font = '700 36px "Inter", -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(review.initials, avatarX, avatarCenterY + 2);

  // User Name (next to avatar)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px "Inter", -apple-system, system-ui, sans-serif';
  ctx.fillText(review.name, avatarX + avatarRadius + 24, avatarCenterY - 6);

  // Handle
  ctx.fillStyle = '#ff98a2';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText(`@${review.username}`, avatarX + avatarRadius + 24, avatarCenterY + 24);

  // Role tag on the right side of the header
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText(review.role.toUpperCase(), W - 70, avatarCenterY + 12);

  // 2. DIVIDER LINE
  ctx.beginPath();
  ctx.moveTo(70, 195);
  ctx.lineTo(W - 70, 195);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  // 3. GLOWING QUOTE GLYPH
  ctx.fillStyle = 'rgba(255, 152, 162, 0.32)';
  ctx.font = '700 120px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('\u201C', 64, 205);

  // 4. MAIN QUOTE TEXT: Modern, clean, high-contrast, perfectly readable
  ctx.fillStyle = '#f3f4f6';
  ctx.font = '500 38px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, review.quote, W - 140);
  const lineHeight = 56;
  const quoteStartY = 350;
  lines.forEach((line, i) => {
    ctx.fillText(line, 70, quoteStartY + i * lineHeight);
  });

  // 5. FOOTER PILLS: Verified Community Member & College tag
  const footerY = H - 90;

  // Verified Builder pill
  ctx.fillStyle = 'rgba(255, 152, 162, 0.12)';
  roundedRectPath(ctx, 70, footerY - 32, 230, 46, 23);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 152, 162, 0.3)';
  ctx.lineWidth = 1.5;
  roundedRectPath(ctx, 70, footerY - 32, 230, 46, 23);
  ctx.stroke();

  ctx.fillStyle = '#ff98a2';
  ctx.font = '600 17px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2726 VERIFIED BUILDER', 70 + 115, footerY - 8);

  // College tag on right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6b7280';
  ctx.font = '600 19px "JetBrains Mono", monospace';
  ctx.fillText(review.college ? review.college.toUpperCase() : 'DEVCONNECT SQUAD', W - 70, footerY - 8);

  return canvas.toDataURL('image/png');
}

export function buildTestimonialItems() {
  return REVIEWS.map(review => ({ image: drawCard(review), text: '' }));
}