async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function extractJSON(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(text);
}

// ─── Design System Reference (distilled from skill docs) ───

const DESIGN_SYSTEM = `
## Design Quality Standards

You create DISTINCTIVE, production-grade websites. Not generic AI slop.

### The AI Slop Test
If someone could tell AI made this immediately, you failed. Avoid these fingerprints:
- Cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds
- Gradient text on metrics or headings
- Glassmorphism everywhere (blur effects, glass cards, glow borders)
- Identical card grids with icon + heading + text repeated
- Big rounded rectangles with generic drop shadows
- Large icons with rounded corners above every heading
- Everything centered with uniform spacing

### Color (OKLCH)
- Never use pure black (#000) or pure white (#fff). Always tint slightly.
- Tint all neutrals toward the brand hue (even chroma 0.01 creates cohesion)
- Never use gray text on colored backgrounds. Use a darker shade of the background color instead.
- 60-30-10 rule: 60% neutral backgrounds, 30% secondary (text, borders), 10% accent (CTAs, highlights)
- Accent colors work BECAUSE they're rare. Overuse kills their power.
- As colors approach white or black, reduce saturation. High saturation at extreme lightness looks garish.
- Contrast minimums: 4.5:1 for body text, 3:1 for large text/UI components

### Typography
- Choose DISTINCTIVE fonts. Avoid the invisible defaults (Inter, Roboto, Open Sans, Lato, Montserrat).
- Better alternatives: Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, DM Sans, Fraunces, Lora
- Use a modular type scale with clear hierarchy. Fewer sizes with more contrast > many similar sizes.
- Use clamp() for fluid typography: clamp(min, preferred, max)
- Increase line-height for light text on dark backgrounds (+0.05-0.1)
- Max line length: 65ch for readability
- Use font-variant-numeric: tabular-nums for data alignment

### Layout & Space
- Use a 4pt spacing system: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Create visual rhythm through VARIED spacing. Tight groupings, generous separations. Not uniform padding everywhere.
- Use gap instead of margins for sibling spacing
- Embrace asymmetry. Left-aligned text with asymmetric layouts feels more designed than centering everything.
- Cards are not required. Spacing and alignment create grouping naturally. Only use cards when content is truly distinct and actionable.
- Never nest cards inside cards.

### Motion & Interaction
- Wrap ALL animations in @media (prefers-reduced-motion: no-preference) { }
- Only animate transform and opacity (never width, height, padding, margin)
- Duration: 100-150ms for instant feedback, 200-300ms for state changes, 300-500ms for layout changes
- Use ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1) as default easing
- Exit animations at 75% of entrance duration
- Never use bounce or elastic easing. Real objects decelerate smoothly.
- Stagger entrance animations: animation-delay: calc(var(--i) * 60ms)

### Responsive & Mobile-First
- Start with mobile styles, use min-width queries to layer complexity
- Use clamp() for fluid values without breakpoints
- Touch targets: minimum 44x44px
- Use @media (hover: hover) for hover states (touch users can't hover)
- Handle safe areas: padding with env(safe-area-inset-*)
- Images: use responsive sizing, proper alt text

### Accessibility (WCAG 2.1 AA)
- Semantic HTML5 with proper heading hierarchy
- All interactive elements keyboard-navigable
- Visible focus indicators: 2-3px, high contrast, offset from element. Use :focus-visible
- All images have descriptive alt text. Decorative images use alt=""
- Color contrast: 4.5:1 body text, 3:1 large text
- No information conveyed by color alone
- aria-label on all icon-only buttons
- Never disable zoom (no user-scalable=no)
- Use rem/em for font sizes, never px for body text

### UX Writing
- Button labels: specific verb + object ("Book Now", "View Menu"), never generic ("Submit", "Click here")
- For destructive actions, name the destruction ("Delete", not "Remove")
- Empty states are opportunities, not dead ends
`;

// ─── API Functions ───

export async function generateColorPalette(category, name, city, moodWords) {
  const system = `You are a professional UI/UX designer specializing in distinctive small business websites.
${DESIGN_SYSTEM}`;

  const user = `Generate a 5-color palette for a ${category} business called "${name}" in ${city}.
The mood should feel: ${moodWords.join(', ')}.

Rules:
- Primary: bold, distinctive brand color derived from the mood
- Secondary: complementary accent, not too similar to primary
- Neutral: warm or cool tinted gray (never pure gray). Tint toward the primary hue with very low saturation.
- Light: near-white with subtle warmth, around #FAFAF8 but tinted toward the primary hue
- Dark: near-black with a hint of the primary hue. Never pure #000000.
- The palette should feel cohesive. All colors should have a subtle relationship through shared undertones.
- Avoid the AI color palette trap: no cyan-on-dark, no purple-to-blue gradients, no neon.

Return ONLY a JSON object with keys: primary, secondary, neutral, light, dark.
Values are hex codes. No explanations. Only JSON.`;

  const result = await callClaude(system, user);
  return extractJSON(result);
}

export async function generateFontPairing(category, moodWords) {
  const system = `You are a typography expert who creates distinctive font pairings.
${DESIGN_SYSTEM}`;

  const user = `Recommend 2 Google Fonts for a ${category} business with a ${moodWords.join(', ')} feel.

Rules:
- Choose DISTINCTIVE fonts. Never recommend: Inter, Roboto, Open Sans, Lato, Montserrat, Arial, Helvetica.
- The heading font should have personality and be memorable.
- The body font should be highly readable at small sizes.
- The pair should create genuine contrast (serif + sans, geometric + humanist, etc.)
- Never pair two fonts that are similar but not identical.
- Only use fonts available on Google Fonts.
- Also check freefaces.gallery for inspiration on distinctive typeface choices.

Great heading options: Playfair Display, Fraunces, Instrument Serif, Space Grotesk, Outfit, Sora, Urbanist, Cormorant Garamond, Bebas Neue, Archivo Black, Josefin Sans, Crimson Text, Libre Baskerville
Great body options: DM Sans, Plus Jakarta Sans, Figtree, Source Sans 3, Nunito Sans, Work Sans, Karla, Manrope, Albert Sans, Lexend, Cabin

Return JSON: { "heading": "Font Name", "body": "Font Name" }
No explanations. Only JSON.`;

  const result = await callClaude(system, user);
  return extractJSON(result);
}

export async function generateWebsiteHtml(businessData, themeData) {
  const system = `You are an elite front-end developer and designer. You create distinctive, production-grade single-page websites that look like they were crafted by a talented human designer, NOT generated by AI.

${DESIGN_SYSTEM}

## Output Rules
- Generate a complete, self-contained index.html file
- Mobile-first CSS, responsive for desktop
- Semantic HTML5
- No external CSS files. All styles in a <style> block.
- Fonts loaded via Google Fonts <link> tag
- CRITICAL: Do NOT invent or fabricate any content. No Lorem Ipsum. No "Coming soon". No generic filler. Do NOT create sections for data that was not provided.
- EQUALLY CRITICAL: You MUST use ALL provided business data visibly on the page. Every field present in the business data JSON must appear somewhere on the website. Specifically:
  - If "phone" is provided, display it prominently (header, footer, or contact section) as a clickable tel: link.
  - If "email" is provided, display it as a clickable mailto: link.
  - If "hours" array is provided, display the FULL hours for every day listed — do not summarize or abbreviate them.
  - If "address" is provided, display the full address.
  - If "socialLinks" are provided, include icon links to each social profile.
  - If "rating" and "reviewCount" are provided, display them (e.g. "4.8 stars from 127 reviews").
  - If "additionalContext" is provided, incorporate that information naturally into the website content (e.g. a tagline, about section, service descriptions, or other relevant sections).
- If "photos" array is provided, use the URLs as <img> src attributes. These are real, working image URLs. If "gallery" is true, create a dedicated photo gallery section. If "gallery" is false, still use the photos naturally throughout the page (hero background, section accents, about section) but do NOT create a gallery section.
- Include a small, subtle footer: "Built by Claire Sersun" with class="built-by" so it can be toggled
- Use CSS custom properties for the theme colors and fonts
- Apply the 4pt spacing system throughout
- Create visual hierarchy through varied spacing, not uniform padding
- Use clamp() for fluid typography and spacing
- Add subtle entrance animations wrapped in prefers-reduced-motion
- Buttons should use the provided radius and color from the theme
- The site should feel like it was designed specifically for THIS business, not a generic template`;

  const user = `Business data (ONLY use fields that are present and non-empty): ${JSON.stringify(businessData)}
Theme: ${JSON.stringify(themeData)}

Generate the full HTML file. Return ONLY the HTML. No explanation. No markdown code fences.`;

  const result = await callClaude(system, user);
  let html = result.trim();
  if (html.startsWith('```html')) html = html.slice(7);
  if (html.startsWith('```')) html = html.slice(3);
  if (html.endsWith('```')) html = html.slice(0, -3);
  return html.trim();
}

export async function reviseWebsiteHtml(currentHtml, changeRequest) {
  const system = `You are an elite front-end developer. You will be given an existing HTML website and a change request. Apply the requested changes while maintaining design quality.

${DESIGN_SYSTEM}

## Revision Rules
- Return the COMPLETE updated HTML file, not just the changed parts.
- Preserve all existing styles, structure, and content that are not being changed.
- Do NOT add placeholder content or empty sections.
- Do NOT remove sections unless explicitly asked.
- Maintain all accessibility features (aria labels, semantic HTML, contrast ratios).
- Keep animations wrapped in prefers-reduced-motion.
- No explanation. No markdown code fences. Only HTML.`;

  const user = `Current HTML:
${currentHtml}

Change request: ${changeRequest}

Return the full updated HTML. No explanation. No markdown code fences.`;

  const result = await callClaude(system, user);
  let html = result.trim();
  if (html.startsWith('```html')) html = html.slice(7);
  if (html.startsWith('```')) html = html.slice(3);
  if (html.endsWith('```')) html = html.slice(0, -3);
  return html.trim();
}

export async function generateOutreachEmail(userName, businessName, city, liveUrl, ownerName, email) {
  const system = `You write cold outreach emails for a freelance web designer named ${userName}.

Match this tone exactly:
- Warm, human, and local. Feels like a real person, not a marketer
- Slightly playful and specific (use personal details when possible)
- Confident but not salesy or pushy
- Sounds like how someone talks out loud, not polished corporate writing
- Short and easy to read

Hard rules:
- No em dashes
- No corporate jargon
- No generic phrases like "I hope this email finds you well"
- No fluff or filler sentences
- Keep sentences natural and conversational

Style guidelines:
- Open with a personal/local connection (something specific, not generic)
- Keep it grounded and real, not exaggerated
- Include a clear but low-pressure CTA
- Make it feel like a gift, not a pitch
- Keep it under 120-150 words
- Sign off with just the first name and a portfolio link

Here is an example of the voice to match closely:

"Hi there,

I'm Claire, a web designer raised in El Segundo. I went to El Segundo High and lived there for about 8-10 years. I've walked past The Mailbox more times than I can count on my hands and toes, so I figured I'd finally do something about the fact that you don't have a website :)

I went ahead and built one for you:
https://clairesersun.github.io/the-mailbox-el-segundo-website/

If you like it, I can help you get it live on your domain or customize anything to fit your business. If not, no worries at all.

Either way, I just wanted to share it. I love supporting local spots around El Segundo.

Would love to hear what you think!

Claire
https://webdesign-portfolio-three.vercel.app/"`;

  const user = `Write a new outreach email from ${userName} to ${businessName}.
City: ${city}
Live URL: ${liveUrl}
Business owner name (if known): ${ownerName || 'unknown'}
${userName} built a free website for this business and wants to share it.

Return JSON: { "subject": "...", "body": "...", "to": "${email || ''}" }
Only JSON. No explanations.`;

  const result = await callClaude(system, user);
  return extractJSON(result);
}

export async function suggestMoodForCategory(category) {
  const moodMap = {
    'Restaurant': ['Warm', 'Energetic'],
    'Cafe': ['Calm', 'Warm'],
    'Bar': ['Bold', 'Energetic'],
    'Gym': ['Energetic', 'Bold'],
    'Spa': ['Calm', 'Luxurious'],
    'Salon': ['Clean', 'Luxurious'],
    'Beauty Salon': ['Clean', 'Luxurious'],
    'Hair Care': ['Clean', 'Bold'],
    'Bakery': ['Warm', 'Playful'],
    'Florist': ['Earthy', 'Calm'],
    'Dentist': ['Clean', 'Trustworthy'],
    'Doctor': ['Trustworthy', 'Clean'],
    'Lawyer': ['Trustworthy', 'Bold'],
    'Auto Repair': ['Trustworthy', 'Bold'],
    'Veterinary': ['Warm', 'Trustworthy'],
    'Church': ['Warm', 'Calm'],
    'Store': ['Clean', 'Energetic'],
  };
  return moodMap[category] || ['Clean', 'Trustworthy'];
}
