/* data.js: the approved prefix inventory, topic starter list and shared constants.
   Prefix list comes from Anri's Renaming Library Registry v07 (last updated 2026-11-13). */
(function (g) {
  'use strict';

  var DEFAULT_LOG = '02-context-intelligence/08-decision-and-discussion-log';
  var DELETE_NAMES = ['delete', 'delete-1', 'delete-01', 'delete1'];

  var FAMILIES = [
    { key: 'tool', label: 'Things you use', blurb: 'Forms, planners, templates, exercises and question lists.' },
    { key: 'reference', label: 'Things you read or learn from', blurb: 'Guides, books, transcripts, notes and decks.' },
    { key: 'admin', label: 'Money paperwork', blurb: 'Receipts and invoices.' },
    { key: 'media', label: 'Sound, video and links', blurb: 'Audio, recordings and saved links.' },
    { key: 'visual', label: 'Pictures and web pages', blurb: 'Screenshots, photos, video clips and saved pages. These start with the date.' }
  ];

  /* sample = illustrative values used by the live name lab. kw = words the test drive listens for. */
  var TYPES = [
    { key: 'exercise', fam: 'tool', label: 'Exercise', means: 'A guided activity you do, one step at a time.', topic: 'goals', title: 'stair-stepping-your-goals', ext: 'pdf', kw: ['exercise', 'activity'] },
    { key: 'journal-questions', fam: 'tool', label: 'Journal questions', means: 'A list of reflective questions for journaling.', topic: 'gratitude', title: '300-gratitude-journal-questions', ext: 'txt', kw: ['journal questions', 'journaling questions', 'journal prompts'] },
    { key: 'coaching-questions', fam: 'tool', label: 'Coaching questions', means: 'Question lists a coach asks in a session.', topic: 'coaching', title: 'discovery-call-questions', ext: 'pdf', kw: ['coaching questions', 'powerful questions'] },
    { key: 'ai-prompts', fam: 'tool', label: 'AI prompts', means: 'Instructions written for an AI model.', topic: 'content-creation', title: 'weekly-post-writer', ext: 'md', kw: ['ai prompts', 'prompt pack', 'prompts', 'prompt'] },
    { key: 'form', fam: 'tool', label: 'Form', means: 'Intake, pre-session, post-session and other fill-in forms.', topic: 'coaching', title: 'client-intake-form', ext: 'pdf', kw: ['form', 'intake', 'questionnaire'] },
    { key: 'planner', fam: 'tool', label: 'Planner', means: 'Planners, trackers and calendars.', topic: 'productivity', title: 'weekly-planner', ext: 'pdf', kw: ['planner', 'tracker', 'calendar'] },
    { key: 'journal', fam: 'tool', label: 'Journal', means: 'A journal to write in.', topic: 'mindset', title: 'morning-pages-journal', ext: 'pdf', kw: ['journal'] },
    { key: 'template', fam: 'tool', label: 'Template', means: 'A reusable blank layout or proposal shell.', topic: 'offers', title: 'proposal-template', ext: 'docx', kw: ['template', 'shell'] },

    { key: 'guide', fam: 'reference', label: 'Guide', means: 'A how-to or explanatory guide, manual or practical checklist.', topic: 'social-media-marketing', title: '5-habits-of-successful-social-media-managers', author: 'northwind-studio', ext: 'pdf', kw: ['guide', 'how to', 'how-to', 'manual', 'checklist', 'handbook'] },
    { key: 'framework', fam: 'reference', label: 'Framework', means: 'A named model or structure for thinking.', topic: 'purpose', title: '10-milestones', ext: 'png', kw: ['framework', 'model'] },
    { key: 'methodology', fam: 'reference', label: 'Methodology', means: 'A named, step-by-step method.', topic: 'business-strategy', title: 'value-ladder-method', ext: 'pdf', kw: ['methodology', 'method'] },
    { key: 'workbook', fam: 'reference', label: 'Workbook', means: 'A multi-part document you fill in. Workbook means fill in.', topic: 'leadership', title: 'leadership-reset-workbook', author: 'jordan-reyes', ext: 'pdf', kw: ['workbook', 'worksheet'] },
    { key: 'book', fam: 'reference', label: 'Book', means: 'A full book.', topic: 'business', title: 'the-founder-handbook', ext: 'pdf', kw: ['book'] },
    { key: 'ebook', fam: 'reference', label: 'Ebook', means: 'A digital book you read. Ebook means read only.', topic: 'mindset', title: 'a-gentle-guide-to-focus', ext: 'pdf', kw: ['ebook', 'e-book'] },
    { key: 'session-summary', fam: 'reference', label: 'Session summary', means: 'A summary of a session, mastermind or coaching call.', topic: 'coaching-practice', title: 'monthly-mastermind-session-summary', ext: 'pdf', kw: ['session summary', 'summary', 'recap'] },
    { key: 'transcript', fam: 'reference', label: 'Transcript', means: 'Word-for-word text of a call, training or recording.', topic: 'content-creation', title: 'writing-social-content-with-ai', ext: 'md', kw: ['transcript', 'captions', 'caption'] },
    { key: 'notes', fam: 'reference', label: 'Notes', means: 'Your own raw session or learning notes.', topic: 'ai', title: 'ai-workshop-notes', ext: 'md', kw: ['notes'] },
    { key: 'contract', fam: 'reference', label: 'Contract', means: 'A signed or signable agreement, contract or waiver.', topic: 'coaching-business', title: 'client-coaching-agreement', ext: 'pdf', kw: ['contract', 'agreement', 'waiver', 'nda'] },
    { key: 'slides', fam: 'reference', label: 'Slides', means: 'A slide deck built to be shown while someone presents.', topic: 'public-speaking', title: 'keynote-opening-slides', ext: 'pdf', kw: ['slides', 'deck', 'presentation', 'keynote', 'pptx'] },
    { key: 'swipe-file', fam: 'reference', label: 'Swipe file', means: 'Other people\'s proven copy, kept as a model.', topic: 'email-marketing', title: 'welcome-email-examples', ext: 'pdf', kw: ['swipe file', 'swipe'] },
    { key: 'whitepaper', fam: 'reference', label: 'Whitepaper', means: 'A research or how-to document a company publishes.', topic: 'ai', title: 'ai-in-small-business', author: 'northwind-studio', ext: 'pdf', kw: ['whitepaper', 'white paper', 'report'] },
    { key: 'book-companion', fam: 'reference', label: 'Book companion', means: 'A companion PDF that goes with a book or audiobook.', topic: 'habits', title: 'habit-building-book-companion', ext: 'pdf', kw: ['companion'] },

    { key: 'receipt', fam: 'admin', label: 'Receipt', means: 'A receipt for something you paid.', topic: 'finance', title: 'software-subscription-receipt', ext: 'pdf', kw: ['receipt'] },
    { key: 'invoice', fam: 'admin', label: 'Invoice', means: 'An invoice you sent or received.', topic: 'finance', title: 'monthly-coaching-invoice', ext: 'pdf', kw: ['invoice', 'inv'] },

    { key: 'audio', fam: 'media', label: 'Audio', means: 'A sound-only file such as an mp3.', topic: 'mindset', title: 'morning-meditation', ext: 'mp3', kw: [] },
    { key: 'recording', fam: 'media', label: 'Recording', means: 'Video with picture and sound, such as a call recording.', topic: 'coaching', title: 'group-call-week-3', ext: 'mp4', kw: ['recording', 'zoom'] },
    { key: 'link', fam: 'media', label: 'Link', means: 'A saved web link file such as a .webloc.', topic: 'business', title: 'pricing-page-reference', ext: 'webloc', kw: [] },

    { key: 'screenshot', fam: 'visual', label: 'Screenshot', means: 'A screen capture. Name starts with the event date.', topic: 'founder-summit', title: 'speaker-on-stage', ext: 'png', dateFirst: true, kw: ['screenshot', 'screen shot', 'screen capture'] },
    { key: 'photo', fam: 'visual', label: 'Photo', means: 'A photo. Name starts with the date it was taken.', topic: 'founder-summit', title: 'booth-setup', ext: 'jpg', dateFirst: true, kw: ['photo', 'img', 'dsc', 'pxl'] },
    { key: 'video', fam: 'visual', label: 'Video clip', means: 'A short video clip or b-roll. Name starts with the date.', topic: 'b-roll', title: 'welcome-table', ext: 'mp4', dateFirst: true, kw: ['video', 'clip'] },
    { key: 'web-page', fam: 'visual', label: 'Web page example', means: 'A saved screenshot or PDF of a page you want to remember.', topic: 'example', title: 'sample-company--landing-page', ext: 'pdf', dateFirst: true, kw: ['web page', 'webpage', 'landing page', 'funnel'] }
  ];

  var TYPE = {};
  TYPES.forEach(function (t) { TYPE[t.key] = t; });

  /* Detection order for the test drive: most specific first. */
  var DETECT_ORDER = ['swipe-file', 'whitepaper', 'book-companion', 'workbook', 'ebook', 'journal-questions', 'coaching-questions', 'ai-prompts', 'session-summary', 'transcript', 'methodology', 'framework', 'guide', 'exercise', 'form', 'planner', 'template', 'contract', 'slides', 'invoice', 'receipt', 'notes', 'journal', 'book', 'web-page', 'screenshot', 'video', 'photo', 'recording'];

  var STARTER_TOPICS = ['ai', 'business', 'business-strategy', 'coaching', 'content-creation', 'marketing', 'social-media', 'sales', 'offers', 'leadership', 'mindset', 'productivity', 'finance', 'events', 'website', 'brand', 'email-marketing', 'lead-generation', 'ideal-client', 'launches', 'habits', 'goals', 'values', 'relationships', 'money-mindset', 'storytelling', 'public-speaking', 'time-management', 'self-care', 'communication'];

  var ALL_TOPICS = 'adhd, affiliate-marketing, ai, anxiety, anxiety-relief, awareness, behavior-change, beliefs, boundaries, brand, brand-voice, bucket-list, business, business-launch, business-strategy, career, coaching, coaching-business, coaching-practice, communication, confidence, content-creation, decision-making, dreams-and-aspirations, email-marketing, emotional-intelligence, emotions, energy, events, fear, feng-shui, finance, fitness-and-health, forgiveness, goals, gratitude, growth-mindset, habits, household, ideal-client, launches, lead-generation, leadership, life, life-areas, life-balance, limiting-beliefs, listening, manifestation, marketing, mental-health, mental-self-care, mindset, money-mindset, nlp, offers, open-mindedness, positive-mindset, productivity, public-speaking, purpose, relationships, responsibility, sales, sales-conversations, school, self-awareness, self-care, self-coaching, self-compassion, self-confidence, self-identity, social-media, social-media-bio, social-media-marketing, storytelling, strengths, stress-relief, study, time-management, travel, trust, values, values-and-beliefs, vision, website'.split(', ');

  var SEVEN = [
    { n: '01', say: 'who you are', folder: 'identity' },
    { n: '02', say: 'who you serve', folder: 'audience' },
    { n: '03', say: 'what you do', folder: 'business' },
    { n: '04', say: 'how you do it', folder: 'approach' },
    { n: '05', say: 'where you exist', folder: 'ecosystem' },
    { n: '06', say: 'who you work with', folder: 'ai' },
    { n: '07', say: 'your non-negotiables', folder: 'guardrails' }
  ];

  /* One source of truth for the answer labels, used by the screens and by the package text. */
  var LABEL = {
    ai: { claude: 'Claude', chatgpt: 'ChatGPT' },
    where: { drive: 'Google Drive', computer: 'a folder on my computer', obsidian: 'an Obsidian vault synced with Google Drive' },
    del: { no: 'Renaming only', yes: 'Trash helper on, always ask first' },
    access: { me: 'just me', assistant: 'me and my assistant', team: 'my team' },
    firstFind: { person: 'a person\'s name', topic: 'the topic', date: 'the date', type: 'the kind of file', event: 'the event or program', click: 'clicking through folders', unsure: 'cannot remember' },
    goTo: { click: 'mostly clicks through folders', search: 'mostly types in a search box', both: 'does both' },
    dateFreq: { often: 'often', sometimes: 'sometimes', rarely: 'rarely', never: 'never' },
    length: { right: 'about right', 'long': 'too long', 'short': 'too short' },
    order: { front: 'date first', end: 'date at the end', none: 'no date' }
  };

  var SAMPLE_NAMES = [
    'Leadership Workbook FINAL 3.pdf',
    'zoom call 11-04-2026 coaching transcript (1).txt',
    'IMG_4032.HEIC',
    'Invoice 2031 Nov.pdf',
    'Welcome Email Swipe File new.pdf',
    'ai notes.md'
  ];

  g.RenData = {
    DEFAULT_LOG: DEFAULT_LOG, DELETE_NAMES: DELETE_NAMES, FAMILIES: FAMILIES, TYPES: TYPES, TYPE: TYPE,
    DETECT_ORDER: DETECT_ORDER, STARTER_TOPICS: STARTER_TOPICS, ALL_TOPICS: ALL_TOPICS, SEVEN: SEVEN,
    LABEL: LABEL, SAMPLE_NAMES: SAMPLE_NAMES
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
