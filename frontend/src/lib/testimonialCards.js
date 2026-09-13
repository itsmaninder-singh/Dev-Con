// Builds each testimonial as a fully self-contained PNG data URL (quote,
// name, role and an initials avatar all drawn on canvas). CircularGallery
// just treats each one as an "image" — since it's a data URL there's no
// network request, no CORS, and no chance of a card failing to load and
// showing black.

const REVIEWS = [
  {
    name: 'Rhea Kapoor',
    role: 'Full-Stack Dev',
    quote: 'Found my hackathon team in under a day. DevConnect actually matches on skills, not just who\u2019s online.',
    initials: 'RK',
    color: '#ff98a2',
  },
  {
    name: 'Arjun Mehta',
    role: 'ML Engineer',
    quote: 'Went from solo side-projects to shipping with a four-person team in a week.',
    initials: 'AM',
    color: '#6b6bd6',
  },
  {
    name: 'Sanya Verma',
    role: 'Product Designer',
    quote: 'The availability toggle is underrated \u2014 no more DMing five people to ask if they\u2019re free.',
    initials: 'SV',
    color: '#4fd1c5',
  },
  {
    name: 'Devansh Rao',
    role: 'Backend Engineer',
    quote: 'We formed our entire hackathon squad here, built the project, and shipped it \u2014 all in one place.',
    initials: 'DR',
    color: '#f6ad55',
  },
  {
    name: 'Priya Nair',
    role: 'Frontend Dev',
    quote: 'As someone new to open source, this made finding collaborators way less intimidating.',
    initials: 'PN',
    color: '#9f7aea',
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
  const W = 760;
  const H = 760;
  const R = 44;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  roundedRectPath(ctx, 0, 0, W, H, R);
  ctx.clip();

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a1a1e');
  grad.addColorStop(1, '#0a0a0c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  roundedRectPath(ctx, 2, 2, W - 4, H - 4, R);
  ctx.stroke();

  // decorative quote glyph
  ctx.fillStyle = 'rgba(255,152,162,0.18)';
  ctx.font = '700 130px Georgia, serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('\u201C', 34, 0);

  // quote text
  ctx.fillStyle = '#ececeb';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, review.quote, W - 100);
  const lineHeight = 40;
  const startY = 190;
  lines.slice(0, 6).forEach((line, i) => {
    ctx.fillText(line, 50, startY + i * lineHeight);
  });

  // avatar (initials, no external image — guaranteed to render)
  const avatarY = H - 150;
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, 46, 0, Math.PI * 2);
  ctx.fillStyle = review.color;
  ctx.fill();
  ctx.fillStyle = '#0a0a0c';
  ctx.font = '700 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(review.initials, W / 2, avatarY + 3);

  // name
  ctx.fillStyle = '#ff98a2';
  ctx.font = '700 28px system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(review.name, W / 2, avatarY + 70);

  // role
  ctx.fillStyle = '#8a8d91';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText(review.role.toUpperCase(), W / 2, avatarY + 104);

  return canvas.toDataURL('image/png');
}

export function buildTestimonialItems() {
  return REVIEWS.map(review => ({ image: drawCard(review), text: '' }));
}