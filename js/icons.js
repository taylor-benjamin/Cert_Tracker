// Lightweight inline-SVG icon set — replaces emoji glyphs used as icons.
// All icons share a 24x24 viewBox, stroke=currentColor, so they inherit
// surrounding text color and size cleanly in both themes.

const PATHS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.5-9 5.5 5.5 0 0 1 10.6-1.7A4 4 0 0 1 17.5 18.5Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  'file-text': '<path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 16.5h6"/>',
  brain: '<path d="M9 4.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0-1.7 4.3A2.7 2.7 0 0 0 6 16.5 2.5 2.5 0 0 0 8.5 19c.3 0 .6 0 .9-.1"/><path d="M15 4.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1 1.7 4.3A2.7 2.7 0 0 1 18 16.5a2.5 2.5 0 0 1-2.5 2.5c-.3 0-.6 0-.9-.1"/><path d="M9 4.5c1.7-.3 3.3-.3 5 0M9.4 18.9c1.1.3 2.1.3 3.2 0M6.7 8.3c.6.5 1.4.8 2.3.9M17.3 8.3c-.6.5-1.4.8-2.3.9M6 16.5c.7.2 1.4.2 2.1.1M18 16.5c-.7.2-1.4.2-2.1.1M9 4.5v14M15 4.5v14"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.3 2.9-5 5.5-5s4.9 1.7 5.5 5"/><path d="M15.5 5.5a3.2 3.2 0 0 1 0 6.3M20.5 19c-.4-2.3-1.6-3.8-3.3-4.6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.4-2-3.4-2.2.7a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.5 2.9a7.7 7.7 0 0 0-2.6 1.5l-2.2-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.7c.8.7 1.6 1.2 2.6 1.5L10 22h4l.5-2.9a7.7 7.7 0 0 0 2.6-1.5l2.2.7 2-3.4-1.9-1.4Z"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  save: '<path d="M5 3h11l3 3v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.3M12 19.2v2.3M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
  'log-in': '<path d="M11 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M15 16l4-4-4-4M19 12H9"/>',
  'edit-2': '<path d="M4 20.5l.9-3.8L16.6 5a1.7 1.7 0 0 1 2.4 0l1 1a1.7 1.7 0 0 1 0 2.4L8.3 19.6l-4.3.9Z"/><path d="M14.5 6.9l2.6 2.6"/>',
  'trash-2': '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7"/><path d="M10 11v6M14 11v6"/>',
  paperclip: '<path d="M17 7.5 8.6 15.9a3 3 0 1 1-4.2-4.2l8.6-8.6a5 5 0 0 1 7 7l-8.7 8.7a1.5 1.5 0 0 1-2.1-2.1l8-8"/>',
  link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M12 6.5l1.4-1.4a4 4 0 0 1 5.7 5.7L17.7 12.2M12 17.5l-1.4 1.4a4 4 0 0 1-5.7-5.7l1.4-1.4"/>',
  'external-link': '<path d="M9 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/><path d="M14 4h6v6M20 4l-9 9"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.5 2.5L16 9.5"/>',
  'alert-triangle': '<path d="M12 4 22 20H2Z"/><path d="M12 10.5v4M12 17.2v.1"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.7 7 21l5-2.5 5 2.5-1.5-7.3"/>',
  rocket: '<path d="M12 3c2.8 1.6 4.5 4.5 4.5 8.5 0 2-1 4-2 5.2l-2.5 2.3-2.5-2.3c-1-1.2-2-3.2-2-5.2C7.5 7.5 9.2 4.6 12 3Z"/><circle cx="12" cy="10.5" r="1.6"/><path d="M9 16.5 6.5 19M15 16.5l2.5 2.5M9.5 19.5l1-2.3M14.5 19.5l-1-2.3"/>',
  'trending-up': '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  sprout: '<path d="M12 21v-8"/><path d="M12 13c0-3.5-2.5-6-7-6 0 4 2.5 6 7 6Z"/><path d="M12 11c0-4 2.8-6.5 7-6.5 0 4.5-2.8 6.5-7 6.5Z"/>',
  zap: '<path d="M12.5 2.5 4 14h6l-1.5 7.5L20 10h-6l-1.5-7.5Z"/>',
  'book-open': '<path d="M12 6.5c-1.8-1.3-4.4-2-7.5-2v13c3.1 0 5.7.7 7.5 2 1.8-1.3 4.4-2 7.5-2v-13c-3.1 0-5.7.7-7.5 2Z"/><path d="M12 6.5v13"/>',
  shield: '<path d="M12 3l7 3v5.5c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5V6Z"/><path d="M9 12l2 2 4-4.5"/>',
  crown: '<path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13L4 8Z"/><path d="M6.5 19.5h11"/>',
  'bar-chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.5 2"/>',
  'graduation-cap': '<path d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z"/><path d="M6.5 11.7v4.3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.3"/><path d="M21 9.5v6"/>',
  sparkles: '<path d="M11 3l1.2 3.6L16 8l-3.8 1.4L11 13l-1.2-3.6L6 8l3.8-1.4Z"/><path d="M18.5 13.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>',
  'message-circle': '<path d="M12 20c4.7 0 8.5-3.4 8.5-7.5S16.7 5 12 5s-8.5 3.4-8.5 7.5c0 1.6.6 3.1 1.6 4.3L4 21l3.7-1.3c1.3.8 2.7 1.3 4.3 1.3Z"/>',
  camera: '<path d="M4 8.5a1 1 0 0 1 1-1h2l1.4-2h7.2l1.4 2h2a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><circle cx="12" cy="13" r="3.3"/>',
  lock: '<rect x="5" y="11" width="14" height="9.5" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  upload: '<path d="M12 16V5M8 9l4-4 4 4"/><path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4"/><path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5"/>',
  printer: '<path d="M7 8.5V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4.5"/><rect x="4" y="8.5" width="16" height="7.5" rx="1.5"/><path d="M7 14h10v6.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5Z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.7 13.7 8.5 15.5l1.8-5.2Z"/>',
  lightbulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5.5 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-4 3.5-6 7-6s6.2 2 7 6"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
  droplet: '<path d="M12 3.5c3 3.6 6 7.2 6 10.7a6 6 0 0 1-12 0c0-3.5 3-7.1 6-10.7Z"/>',
  flag: '<path d="M6 21V4"/><path d="M6 4.5c1.8-1.3 3.6-1.3 5.5 0s3.7 1.3 5.5 0v9c-1.8 1.3-3.6 1.3-5.5 0s-3.7-1.3-5.5 0Z"/>',
  gauge: '<circle cx="12" cy="13" r="8"/><path d="M12 13 15.5 9M8.5 6.5l.6.6M12 4.5v.9M17.5 8l-.6.6"/>',
};

/**
 * Returns an inline <svg> string for the given icon name.
 * @param {string} name - key into the icon set
 * @param {object} [opts]
 * @param {number} [opts.size=18]
 * @param {string} [opts.className='']
 */
export function icon(name, opts = {}) {
  const { size = 18, className = '' } = opts;
  const body = PATHS[name];
  if (!body) return '';
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

const AVATAR_PALETTE = ['#16a34a', '#0d9488', '#65a30d', '#0891b2', '#15803d', '#059669'];

/**
 * Returns a small circular initials avatar (replaces emoji person avatars).
 * @param {string} name
 * @param {object} [opts]
 * @param {number} [opts.size=34]
 */
export function initialsAvatar(name, opts = {}) {
  const { size = 34 } = opts;
  const clean = (name || '?').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  const bg = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  const fontSize = Math.round(size * 0.4);
  return `<span class="initials-avatar" style="width:${size}px;height:${size}px;font-size:${fontSize}px;background:${bg}">${initials}</span>`;
}
