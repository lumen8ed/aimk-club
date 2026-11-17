/* package.js: builds the 16-file agent package from the answers. In the text below, the section sign
   stands in for a backtick so Markdown code spans are easy to write inside JavaScript strings. */
(function (g) {
  'use strict';
  var D = g.RenData, N = g.Naming, L = D.LABEL;

  function tk(s) { return String(s).replace(/§/g, '`'); }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + N.pad(d.getMonth() + 1) + '-' + N.pad(d.getDate());
  }
  function sel(S) { return D.TYPES.filter(function (t) { return S.types[t.key] && S.types[t.key].on; }); }
  function delOn(S) { return S.del === 'yes' && S.delNames && S.delNames.length > 0; }

  function ctx(S) {
    var c = {
      who: (S.person || '').trim() || 'the owner',
      biz: (S.business || '').trim() || 'their business',
      ai: L.ai[S.ai] || 'Claude',
      where: L.where[S.where] || 'Google Drive',
      folder: (S.folder || '').trim() || '(folder name not entered)',
      log: S.logDefault ? D.DEFAULT_LOG : ((S.logLoc || '').trim() || D.DEFAULT_LOG),
      date: today(), sel: sel(S), pattern: N.patternString(S),
      practice: (S.practice || '').trim() || 'practice-folder'
    };
    c.pslug = N.slug(c.who) || 'client';
    return c;
  }
  function dateRule(S) {
    if (S.order === 'none') return 'No date in names, unless the owner overrides a file type below.';
    var where = S.order === 'end' ? 'after the title (and after any author), before the version' : 'first, followed by §--§';
    return 'Written §yyyy-mm-dd§ and placed ' + where + '. Use the date of the thing itself (the session, the event, the document), never the rename date or a file timestamp. When the date is not visible inside the file, ask.';
  }
  function exampleFor(S, key, ver) {
    var it = N.sampleItem(S, key, ver);
    var p = N.buildParts(S, it);
    return N.partsToName(p, it.ext);
  }
  var ACC = { me: 'only {who}', assistant: '{who} and an assistant', team: 'a team' };
  function accessText(S, c) { return (ACC[S.access] || ACC.me).replace('{who}', c.who); }
  function joinOr(a) { var q = a.map(function (x) { return '\u00a7' + x + '\u00a7'; }); return q.length === 1 ? q[0] : q.slice(0, -1).join(', ') + ' or ' + q[q.length - 1]; }
  function mdEsc(s) { return String(s).replace(/\|/g, '/'); }
  function listTypes(S) {
    var out = [];
    sel(S).forEach(function (t) {
      var w = N.typeWord(S, t.key);
      out.push('| §' + w + '§ | ' + mdEsc(t.means) + (w !== t.key ? ' (standard prefix: §' + t.key + '§)' : '') + ' | §' + exampleFor(S, t.key, false) + '§ |');
    });
    return out;
  }
  function topicList(S) { return (S.topics || []).slice(0, 12); }
  function front(title, extra) {
    return '---\ntitle: "' + title + '"\nfile-version: "v01"\nupdated_on: "' + today() + '"\n' + (extra || '') + '---\n';
  }

  /* ---------- README.md ---------- */
  function readme(S, c) {
    return tk([
      '# ' + c.who + '\'s file-renaming agent',
      '',
      'Your files. Your words. Your way.',
      '',
      'This package sets up a file-renaming agent for ' + c.biz + '. It runs in ' + c.ai + ', works on files in ' + c.where + ', and gives each file a name that tells a person or an AI what it is, what it covers, and which version it is.',
      '',
      '## What it does',
      '',
      '- Reads each file, proposes a better name, and shows you a preview table first.',
      '- Renames only after you approve. Small batches, and it asks when it is unsure.',
      '- Writes a rename log after every session so you can undo a batch.',
      '',
      '## What it never does',
      '',
      '- Never moves, copies, edits, merges, shares or publishes your files.',
      delOn(S) ? '- Never trashes anything on its own. Only files you named §' + S.delNames.join('§, §') + '§ can be offered for the trash, and only after you say yes.' : '- Never deletes or trashes anything.',
      '- Never changes a file extension or what is inside a file.',
      '',
      '## What is inside',
      '',
      '§§§',
      'README.md',
      'QUICKSTART.md',
      'SUPPORT.md',
      'CHANGELOG.md',
      'LICENSE.txt',
      'compatibility.json',
      'core/agent-instructions.md      paste into your ' + c.ai + ' project instructions',
      'core/workflow.md                how one renaming session runs',
      'context/buyer-profile.md        who you are and how you search',
      'context/knowledge.md            naming rules and the prefix inventory',
      'context/naming-registry.md      your approved types, topics and decisions',
      'context/source-register.csv     where each rule came from',
      'examples/sample-input.md        messy names, before',
      'examples/sample-output.md       the same names, after',
      'adapters/claude-project/setup.md',
      'adapters/chatgpt-project/setup.md',
      '§§§',
      '',
      '## Start here',
      '',
      'Open QUICKSTART.md. Then use the setup guide for ' + c.ai + ' in the adapters folder.',
      '',
      '## Honest status',
      '',
      'This package was generated on ' + c.date + ' from your answers. The setup steps were checked against the vendors\' help pages on that date. The agent has not yet been run end to end on your files, so the first session starts with a capability check and a practice folder. Read compatibility.json for the routes that are tested and the ones that are not.',
      '',
      'Support: see SUPPORT.md.'
    ].join('\n'));
  }

  /* ---------- QUICKSTART.md ---------- */
  function quickstart(S, c) {
    var adapter = S.ai === 'chatgpt' ? 'adapters/chatgpt-project/setup.md' : 'adapters/claude-project/setup.md';
    return tk([
      '# Quickstart',
      '',
      'Plan on four moves: set up the ' + c.ai + ' project, run the capability check, rename a practice batch, then keep going in small batches.',
      '',
      '## 1. Make a practice folder',
      '',
      'Inside ' + c.folder + ', make a folder called §' + c.practice + '§. Put 10 to 20 files in it. Use copies of files you can spare while you are learning how the agent behaves. The agent only renames, but copies keep your mind at ease.',
      '',
      '## 2. Set up the project',
      '',
      'Follow §' + adapter + '§. It covers creating the project, adding the knowledge files, pasting the instructions, and connecting your files.',
      '',
      '## 3. Start the first session',
      '',
      'Paste this as your first message:',
      '',
      '§§§',
      'Start a renaming session. Work only in the folder named ' + c.practice + '. Read buyer-profile.md, naming-registry.md and workflow.md first. Then run the capability check before you propose any names.',
      '§§§',
      '',
      '## 4. Review the preview',
      '',
      'The agent shows a table of current names and proposed names. Change anything you like. When you are happy, reply §approved§. Nothing is renamed before that.',
      '',
      '## 5. Check the result',
      '',
      'Open the folder yourself and look. The agent also lists the folder again after renaming and saves a rename log in §' + c.log + '§.',
      '',
      '## 6. Undo, if you want',
      '',
      'Say §undo the last batch§. The agent reads the rename log, shows you what it will put back, and waits for your yes.',
      '',
      '## 7. Overnight renaming',
      '',
      'It stays locked until your rename log shows 100 renames across at least 7 days. When you get there, paste the log into the agent and ask for overnight mode.'
    ].join('\n'));
  }

  /* ---------- core/agent-instructions.md ---------- */
  function instructions(S, c) {
    var on = delOn(S);
    var rules = [
      '1. Rename only. Change the filename stem and nothing else. The extension, the contents and the location stay exactly as they are.',
      '2. Never move, copy, edit, merge, share or publish a file or a folder.',
      on
        ? '3. Never delete anything on your own. Only a file whose whole name before the extension is ' + (S.delNames.length === 1 ? '' : 'one of ') + joinOr(S.delNames) + ' may be offered for the trash, and only after you list it and ' + c.who + ' says yes in this conversation. The word delete inside a longer title never counts. Use the trash, never permanent deletion. Never do this overnight.'
        : '3. Never delete or trash anything, whatever a file is named.',
      '4. Folders keep their names unless ' + c.who + ' names a specific folder and asks you to rename it. Then follow the folder rename steps in workflow.md. A file named readme.md always keeps that name.',
      '5. Work only in the folder ' + c.who + ' names for this session. Start with the practice folder.',
      '6. Read each file before you name it. Never guess a file\'s content, type, date or author. When you are unsure, flag it and ask.',
      '7. Show a preview table first and rename only after ' + c.who + ' approves. Work in batches of up to 20 files until 100 renames are logged, then up to 50.',
      '8. Keep duplicates. A true second copy gets §--copy-02§, a third gets §--copy-03§, and the earliest copy stays unsuffixed. The same work in another format keeps the same stem and differs only by extension. Never delete or merge duplicates.',
      '9. A file you cannot read or cannot name with confidence stays where it is. Tell ' + c.who + ': "I couldn\'t rename these files because..." and give the reason for each. Also list them in the rename log.',
      '10. Never invent a type word or topic silently. Propose it, wait for the answer, then record it in naming-registry.md with the date.',
      '11. Before the first batch, run the capability check in workflow.md. If you cannot rename on this connection, say so plainly and deliver the preview table as a list ' + c.who + ' can apply by hand.',
      '12. Never claim a rename happened until you have listed the folder and seen the new name.'
    ];
    var vr = [
      '- Version: write §vNN§ with two digits (v01, v02, v03). Add a version to ' + c.who + '\'s own versioned files and to files whose document prints a version. When the version is unknown, ask. Never label an unknown original v01.'
    ];
    if (S.final === 'yes') {
      vr.push('- Final: only the latest approved version carries §--final§ right after its version, for example §...--v03--final§. When a newer version is approved, remove §--final§ from the older file (its vNN stays) and add §--final§ to the newer one. Never write wip or draft in a name: no §--final§ means still in progress.');
    } else {
      vr.push('- No status words in names. Versions use §vNN§ only.');
    }
    var fields = [
      '- Characters: lowercase American English, no spaces, no underscores, no em dashes, no shortcodes. A shortcode printed in a document is written out in full.',
      '- Field breaks: §--§ separates fields and §-§ joins words inside one field.',
      '- Type: the first or second field, from the table below.',
      S.pieces.topic ? '- Topic: one word or hyphenated phrase from ' + c.who + '\'s topic list or the starter list in knowledge.md. Propose a new topic before using it.' : '- Names carry no topic field.',
      '- Title: the real title printed inside the document, not the old file name. When the title page and the old file name disagree, the title page wins.' + (S.length === 'long' ? ' ' + c.who + ' finds long names tiring: shorten a long title to its 3 to 5 most meaningful words, never add words that are not in the title, and show the full printed title in the preview.' : ''),
      S.pieces.detail ? '- Author or detail: add only when the document credits one, as a person or a publishing organization, in lowercase hyphenated words. An ampersand is written §and§.' : '- Do not add author or detail fields.',
      '- Date: ' + dateRule(S),
      S.city === 'yes' ? '- Events: add the city to the event name for in-person events, joined with a hyphen.' : '- Events: no city in names.',
      '- The word "prompts" appears only in the §ai-prompts§ type. Question lists use §questions§.'
    ];
    var srcs = N.sourceList(S);
    var out = [
      '# ' + c.who + '\'s file-renaming agent',
      '',
      'Version v01, built ' + c.date + ' for ' + c.biz + '.',
      '',
      '## Your role',
      '',
      'You are ' + c.who + '\'s file-renaming agent. You rename files so a filename alone tells a person or an AI what the file is, what it covers, which version it is, and what it is for. Names also decide how files sort in folders and how they turn up in search.',
      '',
      'You rename. That is all.',
      '',
      '## Rules that never bend',
      ''
    ].concat(rules, [
      '',
      '## The name pattern',
      '',
      '§§§',
      c.pattern,
      '§§§',
      '',
      'Example: §' + exampleFor(S, S.types.workbook && S.types.workbook.on ? 'workbook' : (sel(S)[0] ? sel(S)[0].key : 'guide'), true) + '§',
      ''
    ], fields, ['', '## Versions', ''], vr, [
      '',
      '## ' + c.who + '\'s file types',
      '',
      '| Word in the name | What it means | Example |',
      '|---|---|---|'
    ], listTypes(S), [
      '',
      srcs.length && sel(S).some(function (t) { return t.key === 'recording'; })
        ? 'Recordings carry a source word right after the type: ' + srcs.map(function (s) { return '§' + s + '§'; }).join(', ') + '. Example: §recording--' + srcs[0] + '--coaching--group-call-week-3.mp4§. When the source is not clear, ask.'
        : '',
      'Any file type that is not in this table: do not guess. Describe it, propose a name, and wait for ' + c.who + '.',
      '',
      '## ' + c.who + '\'s topic words',
      '',
      topicList(S).length ? topicList(S).map(function (t) { return '§' + t + '§'; }).join(', ') : 'No topics chosen yet. Propose topics from the starter list in knowledge.md as you meet files.',
      '',
      '## How ' + c.who + ' finds things',
      '',
      '- The last file ' + c.who + ' went looking for was found by: ' + L.firstFind[S.firstFind] + '.',
      '- Day to day, ' + c.who + ' ' + L.goTo[S.goTo] + '.',
      '- ' + c.who + ' ' + L.related[S.related] + '.' + (S.related === 'yes' ? ' Use the same topic word everywhere so one search finds everything connected.' : ''),
      '- Searches by date: ' + L.dateFreq[S.dateFreq] + '.',
      '- Who uses these files: ' + accessText(S, c) + '.' + (S.access === 'team' ? ' Use clear, everyday words with no secret codes.' : ''),
      '',
      'Use these answers to settle close calls between two possible names. Do not mention them in replies.',
      '',
      '## The seven categories in the key',
      '',
      D.SEVEN.map(function (s) { return s.n + ' ' + s.folder + ' (' + s.say + ')'; }).join(', ') + '. Folder names are never changed unless ' + c.who + ' asks.',
      '',
      '## Where things live',
      '',
      '- Files: ' + c.where + ', in the folder §' + c.folder + '§.',
      '- Rename logs and registry versions: §' + c.log + '§.',
      '- Knowledge files: buyer-profile.md, knowledge.md, naming-registry.md, workflow.md.',
      '- When anything disagrees, naming-registry.md wins.',
      '',
      '## Overnight mode',
      '',
      'Locked. Do not offer or run scheduled renaming until ' + c.who + ' pastes a rename log with at least 100 rows marked §renamed§ that span at least 7 days. Even then: overnight renames follow every rule above, unreadable files stay in place and go in the log, and nothing is ever trashed overnight.',
      '',
      '## How you write',
      '',
      'American English, plain words, no em dashes, and varied sentence openings. Start each reply with a one-line status, give the result, and end with the decisions that need ' + c.who + '\'s answer.'
    ]);
    return tk(out.join('\n'));
  }

  /* ---------- core/workflow.md ---------- */
  function workflow(S, c) {
    var fname = '<yyyy-mm-dd>--rename-log--<folder-name>--vNN.md';
    return tk([
      '# Workflow: one renaming session',
      '',
      '## Before you start',
      '',
      '1. Read buyer-profile.md, naming-registry.md and this file.',
      '2. Open the folder ' + c.who + ' named. If it has a readme.md, read it first.',
      '3. Look in §' + c.log + '§ for the latest rename log so you know what is already done.',
      '',
      '## Step 1: capability check (first session, or when the connection changes)',
      '',
      'Say what you can do on this connection. Then test it with one file.',
      '',
      '1. Ask ' + c.who + ' to put a throwaway file named §rename-test.txt§ in the practice folder.',
      '2. Rename it to §rename-test--done.txt§.',
      '3. List the folder and check the new name is there.',
      '4. Rename it back and check again.',
      '',
      'If renaming works, say so and move on. If it does not, say: "I can\'t rename files on this connection." Then switch to table-only mode: finish the preview table, give it to ' + c.who + ' as a list of current name and new name, and stop. Never pretend a rename happened.',
      '',
      '## Step 2: inventory',
      '',
      'List the files in scope. Skip subfolders unless ' + c.who + ' says to include them. Tell ' + c.who + ' how many files there are and how many batches that makes.',
      '',
      '## Step 3: read each file',
      '',
      'Open the file and read enough to know its real title, what it is, and who wrote it. The old file name is a clue, not evidence. If you cannot open a file, put it on the "couldn\'t rename" list with the reason.',
      '',
      '## Step 4: propose',
      '',
      'Show one table for the batch:',
      '',
      '| # | Current name | Proposed name | Type | Topic | Confidence | Flag |',
      '|---|---|---|---|---|---|---|',
      '',
      'Confidence is high, check or ask. Put anything you are not sure about in the Flag column. Files you could not read go in a separate list under the table.',
      '',
      '## Step 5: ask',
      '',
      'Ask at most five questions at a time. Each one names the file and offers two or three choices. Typical questions: which version is this, which topic fits, is this a copy or a different file, what is the date.',
      '',
      '## Step 6: approval',
      '',
      'Rename only the rows ' + c.who + ' approves. If ' + c.who + ' edits a name, use that exact name. Words like "approved" or "go ahead" count as approval for the whole table. Silence does not.',
      '',
      '## Step 7: rename',
      '',
      'Rename one file at a time within the batch. Stop and report if a rename fails. Do not retry in a different way without asking.',
      '',
      '## Step 8: verify',
      '',
      'List the folder again. Report: renamed, held, failed. Show any file whose new name is not what you expected.',
      '',
      '## Step 9: write the log',
      '',
      'Save a new file in §' + c.log + '§ named §' + fname + '§. Start a new version file each session. Do not edit older logs. Use this table:',
      '',
      '| date | old name | new name | status | note |',
      '|---|---|---|---|---|',
      '| ' + c.date + ' | example old name.pdf | guide--ai--example-title.pdf | renamed | |',
      '',
      'Status is one of: §renamed§, §held§, §asked§, §failed§, §undone§. Only §renamed§ rows count toward overnight mode. If you cannot create files on this connection, print the log in the chat and ask ' + c.who + ' to save it.',
      '',
      '## Step 10: update the registry',
      '',
      'Record any new type word, topic or decision, with the date, in naming-registry.md. Where you can edit file contents on this connection, make the edit after ' + c.who + ' approves. Where you cannot, save the updated registry as a new version file §naming-registry--vNN.md§ in §' + c.log + '§ and tell ' + c.who + ' it is the newest copy.',
      '',
      '## Undo',
      '',
      'When ' + c.who + ' says §undo the last batch§ (or names a batch):',
      '',
      '1. Read the latest rename log.',
      '2. Show a table of new name back to old name for the rows marked §renamed§ in that batch.',
      '3. After ' + c.who + ' says yes, rename them back, list the folder, and log each as §undone§.',
      '',
      '## Folder renames and readme.md',
      '',
      'Rename a folder only when ' + c.who + ' names that folder and asks. After a folder rename:',
      '',
      '1. Search the readme.md files and naming-registry.md for the old folder name and list every place it appears.',
      '2. Propose the updated lines. A readme.md file always keeps the name readme.md.',
      '3. Where you can edit contents, make the edits after approval. Where you cannot, save a new version file with the updated text and say so.',
      '4. If notes in an Obsidian vault link to files or folders by name, warn ' + c.who + ' that links may need repair after renames. Test on the practice folder first.',
      '',
      '## Special cases',
      '',
      '- Duplicate check: the same size and identical text is a true duplicate. Same text with a different size also takes §--copy-NN§.',
      '- Same work in another format: same stem, different extension.',
      '- Title conflict: when the printed title is plainly an error because the body is a different work, hold the file and ask.',
      '- Unknown file kinds: hold them and list them. Never rename into a different format.',
      delOn(S) ? '- Delete-named files: list them in a separate table titled "Offered for the trash", ask once, and only trash after a clear yes. Never permanent deletion.' : '- Nothing is ever trashed.',
      '',
      '## Overnight mode (locked)',
      '',
      'It unlocks only after ' + c.who + ' pastes a rename log with at least 100 §renamed§ rows spanning at least 7 days between the first and last row. Then:',
      '',
      '1. Confirm the folder and the schedule with ' + c.who + '.',
      '2. Set it up only if this connection supports scheduled tasks. If it does not, say so and keep working in supervised sessions.',
      '3. Overnight runs rename only, follow every rule, leave unreadable and unsure files in place, never trash anything, and write a log.',
      '4. Tell ' + c.who + ' this route has not been tested by the maker, so watch the first few mornings.'
    ].join('\n'));
  }

  /* ---------- context/buyer-profile.md ---------- */
  function buyer(S, c) {
    return tk(front('Buyer profile: ' + c.who, 'context-layer: "context-intelligence"\n') + [
      '',
      '# Buyer profile',
      '',
      '## Who',
      '',
      '- Name: ' + c.who,
      '- Business: ' + c.biz,
      '- Who uses the files: ' + accessText(S, c),
      '',
      '## Setup',
      '',
      '- AI: ' + c.ai,
      '- Files live in: ' + c.where,
      '- Main AI Master Key folder: §' + c.folder + '§',
      '- Rename logs go to: §' + c.log + '§',
      '- Practice folder: §' + c.practice + '§',
      '- Trash helper: ' + (delOn(S) ? 'on, always asks first. Names counted: §' + S.delNames.join('§, §') + '§' : 'off, renaming only'),
      '',
      '## How ' + c.who + ' looks for files',
      '',
      '- Last file searched for was found by: ' + L.firstFind[S.firstFind],
      '- Day to day: ' + L.goTo[S.goTo],
      '- Related items: ' + L.related[S.related],
      '- Searches by date: ' + L.dateFreq[S.dateFreq],
      '',
      '## Naming taste',
      '',
      '- Date: ' + L.order[S.order],
      '- Topic in the name: ' + (S.pieces.topic ? 'yes' : 'no'),
      '- Author or detail at the end: ' + (S.pieces.detail ? 'yes' : 'no'),
      '- Length: ' + L.length[S.length],
      '- City for in-person events: ' + (S.city === 'yes' ? 'yes' : 'no'),
      '- Mark the latest approved version with final: ' + (S.final === 'yes' ? 'yes' : 'no'),
      '',
      '## Words ' + c.who + ' uses for file types',
      '',
      sel(S).length ? sel(S).map(function (t) { var w = N.typeWord(S, t.key); return '- ' + t.label + ': ' + (w === t.key ? 'standard word §' + t.key + '§' : 'own word §' + w + '§ (standard §' + t.key + '§)'); }).join('\n') : '- None chosen yet.',
      '',
      '## Most-searched words',
      '',
      topicList(S).length ? topicList(S).join(', ') : 'None chosen yet.',
      '',
      '## Types still to propose',
      '',
      (S.missing || '').trim() ? (S.missing || '').trim().replace(/\n+/g, ' ') : 'None noted.'
    ].join('\n'));
  }

  /* ---------- context/knowledge.md ---------- */
  function knowledge(S, c) {
    var onKeys = {};
    sel(S).forEach(function (t) { onKeys[t.key] = true; });
    var inv = D.TYPES.map(function (t) {
      return '| §' + t.key + '§ | ' + famName(t.fam) + ' | ' + mdEsc(t.means) + ' | ' + (onKeys[t.key] ? 'in use' : 'available') + ' |';
    });
    return tk(front('Naming knowledge', 'context-layer: "context-intelligence"\n') + [
      '',
      '# Naming knowledge',
      '',
      'The reference the agent reads before it names anything. The prefix inventory is lent from Anri Olivier\'s Renaming Library Registry (v07, last updated 2026-11-13). Use only what works for you. naming-registry.md wins when anything disagrees.',
      '',
      '## What a good name does',
      '',
      'A person or an AI should know from the name alone what the file is, what it covers, which version it is, and what it is for. Names sort in folders, show up in search, and become tags in markdown files.',
      '',
      '## Field rules',
      '',
      '| Part | Rule |',
      '|---|---|',
      '| Characters | Lowercase American English. No spaces, no underscores, no em dashes, no shortcodes. |',
      '| Field breaks | §--§ between fields, §-§ between words inside a field. |',
      '| Date | §yyyy-mm-dd§. The date of the event, session or document, never the rename date. Optional per owner. |',
      '| Type | One word from the type table. |',
      '| Topic | One word or hyphenated phrase from the topic list. |',
      '| Title | The real title printed inside the document. |',
      '| Author | Only when the document credits a person or a publishing organization. |',
      '| Version | §vNN§, two digits. An unknown original is never labeled v01. |',
      '| Final | §--final§ goes with the version on the latest approved file only. The old file keeps its vNN and loses §--final§. |',
      '| Duplicate | §--copy-NN§ at the end, starting at §--copy-02§. The earliest copy stays unsuffixed. |',
      '| Same work, other format | Same stem, different extension. |',
      '| Extension | Never changed. Only the stem changes. |',
      '| The word "prompts" | Only in the §ai-prompts§ type. |',
      '',
      '## Type inventory',
      '',
      '| Standard word | Family | Meaning | Status for ' + c.who + ' |',
      '|---|---|---|---|'
    ].concat(inv, [
      '',
      'Family is a property for sorting and tagging. It never appears in a file name.',
      '',
      'Ebook means read only. Workbook means fill in. A whitepaper is a company\'s research or how-to document and is not an ebook.',
      '',
      '## Picture and web page patterns (date first)',
      '',
      '| Item | Pattern |',
      '|---|---|',
      '| Event screenshot | §<yyyy-mm-dd>--screenshot--<event-name>--<subject>[--<people>]§ |',
      '| Item with no event | §<yyyy-mm-dd>--<screenshot or photo or video>--b-roll--<subject>[--<people>]§ |',
      '| Web page or funnel page example | §<yyyy-mm-dd>--<web-page or funnel-page>--example--<company-event-or-thought-leader>--<type-of-page>[--copy-NN]§ |',
      '',
      'The event date is the date the event happened. For b-roll and web page examples it is the capture date. The capture tool and capture time never appear in the name.',
      '',
      '## Recordings',
      '',
      'A recording is video with picture and sound. The agent names the source right after the type so a Zoom recording and a screen recording never look alike: §recording--zoom--...§, §recording--screen-capture--...§, §recording--phone--...§.',
      '',
      '## AI Master Key folder patterns',
      '',
      '| Item | Pattern |',
      '|---|---|',
      '| Main folder | §ai-master-key--<name>/§ |',
      '| Category folder | §<NN>-<category>/§, for example §01-identity§ |',
      '| Depository folder | §<NN>--<category>-depository/§. The double hyphen after the number is intentional. |',
      '| Folder guide | §readme.md§, lowercase in every folder |',
      '| Agent instructions | §AGENTS.md§, the spelling tools require |',
      '',
      'The seven categories: ' + D.SEVEN.map(function (s) { return s.n + ' ' + s.folder + ' (' + s.say + ')'; }).join(', ') + '.',
      '',
      '## Starter topic list',
      '',
      D.ALL_TOPICS.join(', '),
      '',
      'A topic that is not on the list is proposed first and recorded in naming-registry.md with the date.'
    ]).join('\n'));
  }
  function famName(k) {
    var m = { tool: 'tool', reference: 'reference', admin: 'admin', media: 'media', visual: 'picture and page' };
    return m[k] || k;
  }

  /* ---------- context/naming-registry.md ---------- */
  function registry(S, c) {
    var inUse = sel(S).map(function (t) {
      var w = N.typeWord(S, t.key);
      return '| §' + w + '§ | §' + t.key + '§ | ' + famName(t.fam) + ' | ' + mdEsc(t.means) + ' |';
    });
    var avail = D.TYPES.filter(function (t) { return !(S.types[t.key] && S.types[t.key].on); }).map(function (t) {
      return '| §' + t.key + '§ | ' + famName(t.fam) + ' | ' + mdEsc(t.means) + ' |';
    });
    return tk(front('Naming registry: ' + c.who, 'context-layer: "context-intelligence"\nregistry_version: "v01"\n') + [
      '',
      '# Naming registry',
      '',
      'The record of every approved type word, topic, rule and decision for ' + c.biz + '. When the agent and this file disagree, this file wins. Every change gets a dated line in the change log.',
      '',
      '## 1. Name pattern',
      '',
      '§§§',
      c.pattern,
      '§§§',
      '',
      '## 2. Decisions',
      '',
      '| Decision | Choice | Date |',
      '|---|---|---|',
      '| Date in names | ' + L.order[S.order] + ' | ' + c.date + ' |',
      '| Topic in names | ' + (S.pieces.topic ? 'yes' : 'no') + ' | ' + c.date + ' |',
      '| Author or detail | ' + (S.pieces.detail ? 'yes' : 'no') + ' | ' + c.date + ' |',
      '| Title length | ' + L.length[S.length] + ' | ' + c.date + ' |',
      '| City on in-person events | ' + (S.city === 'yes' ? 'yes' : 'no') + ' | ' + c.date + ' |',
      '| Final marker | ' + (S.final === 'yes' ? 'on: latest approved version carries --final' : 'off') + ' | ' + c.date + ' |',
      '| Trash helper | ' + (delOn(S) ? 'on, always asks first: ' + S.delNames.join(', ') : 'off') + ' | ' + c.date + ' |',
      '',
      '## 3. Approved type words',
      '',
      '| Word in the name | Standard word | Family | Meaning |',
      '|---|---|---|---|'
    ].concat(inUse.length ? inUse : ['| (none chosen yet) | | | |'], [
      '',
      'Date overrides by type: ' + (function () {
        var o = []; Object.keys(S.dateOverride || {}).forEach(function (k) { if (S.dateOverride[k] && S.dateOverride[k] !== 'default' && S.types[k] && S.types[k].on) o.push(k + ' = ' + L.order[S.dateOverride[k]]); });
        return o.length ? o.join(', ') : 'none';
      })() + '.',
      '',
      '## 4. Available, not in use',
      '',
      '| Standard word | Family | Meaning |',
      '|---|---|---|'
    ], avail, [
      '',
      'Moving a word from this list to section 3 needs ' + c.who + '\'s yes and a dated line in the change log.',
      '',
      '## 5. Topics',
      '',
      topicList(S).length ? topicList(S).map(function (t) { return '- ' + t; }).join('\n') : '- (none yet)',
      '',
      '## 6. Open items',
      '',
      (S.missing || '').trim() ? '- Type to propose: ' + (S.missing || '').trim().replace(/\n+/g, ' ') : '- None.',
      '',
      '## 7. Change log',
      '',
      '| Date | Change |',
      '|---|---|',
      '| ' + c.date + ' | Registry created from the setup activity. |'
    ]).join('\n'));
  }

  /* ---------- context/source-register.csv ---------- */
  function sources(S, c) {
    var rows = [
      ['source_id', 'title', 'type', 'location', 'authority', 'last_reviewed', 'notes'],
      ['S01', 'naming-registry.md', 'registry', 'context/naming-registry.md', 'rules of record', c.date, 'Wins when anything disagrees.'],
      ['S02', 'knowledge.md', 'reference', 'context/knowledge.md', 'reference', c.date, 'Field rules, type inventory and patterns.'],
      ['S03', 'buyer-profile.md', 'profile', 'context/buyer-profile.md', 'owner answers', c.date, 'How the owner searches and what the owner prefers.'],
      ['S04', 'agent-instructions.md', 'instructions', 'core/agent-instructions.md', 'rules of conduct', c.date, 'Pasted into the project instructions.'],
      ['S05', 'workflow.md', 'process', 'core/workflow.md', 'process', c.date, 'How one renaming session runs.'],
      ['S06', 'Main AI Master Key folder', 'files', c.folder, 'owner files', c.date, 'The files being renamed. Never edited or moved.'],
      ['S07', 'Rename logs', 'logs', c.log, 'record of changes', c.date, 'One new version file per session.'],
      ['S08', 'Renaming Library Registry v07', 'upstream', 'Anri Olivier (lent inventory)', 'prefix inventory and rules', '2026-11-13', 'Source of the standard type words and field rules. Used only where it works for the owner.']
    ];
    return rows.map(function (r) {
      return r.map(function (v) { v = String(v).replace(/"/g, '""'); return /[",\n]/.test(v) ? '"' + v + '"' : v; }).join(',');
    }).join('\n') + '\n';
  }

  /* ---------- examples ---------- */
  function sampleNames() { return D.SAMPLE_NAMES; }
  function sampleInput(S, c) {
    var names = sampleNames(S);
    return tk(front('Sample input', '') + [
      '',
      '# Sample input',
      '',
      'Illustrative messy names, the kind an agent meets in a real folder. These are examples, not your files.',
      '',
      names.map(function (n, i) { return (i + 1) + '. §' + n + '§'; }).join('\n'),
      '',
      'The agent reads inside each file before it names it. A name-only guess can miss the real title, the real date and the author.'
    ].join('\n'));
  }
  function sampleOutput(S, c) {
    var names = sampleNames(S);
    var rows = [], log = [], qs = [];
    names.forEach(function (n, i) {
      var r = N.parseOld(n, S, {});
      if (!r) return;
      var flag = r.need.concat(r.flags).join(', ');
      rows.push('| ' + (i + 1) + ' | ' + mdEsc(n) + ' | §' + r.name + '§ | ' + (r.key ? (S.types[r.key] && S.types[r.key].on ? N.typeWord(S, r.key) : r.key) : '?') + ' | ' + (r.item.topic || '?') + ' | ' + (r.need.length ? 'ask' : 'check') + ' | ' + (flag || 'none') + ' |');
      log.push('| ' + c.date + ' | ' + mdEsc(n) + ' | ' + (r.need.length ? '' : r.name) + ' | ' + (r.need.length ? 'asked' : 'renamed') + ' | ' + (flag || '') + ' |');
      r.need.forEach(function (q) { qs.push('- File ' + (i + 1) + ': what is the ' + (q === 'source' ? 'source (Zoom, screen capture or phone)' : q) + '?'); });
    });
    return tk(front('Sample output', '') + [
      '',
      '# Sample output',
      '',
      'What the agent shows for the sample input. Illustrative only: a name-only preview built from the rules in this package. The real agent reads inside each file first.',
      '',
      '## Preview table',
      '',
      '| # | Current name | Proposed name | Type | Topic | Confidence | Flag |',
      '|---|---|---|---|---|---|---|'
    ].concat(rows, [
      '',
      '## Questions the agent would ask',
      ''
    ], qs.length ? qs : ['- None.'], [
      '',
      '## Log excerpt',
      '',
      '| date | old name | new name | status | note |',
      '|---|---|---|---|---|'
    ], log).join('\n'));
  }

  /* ---------- adapters ---------- */
  function claudeSetup(S, c) {
    var first = 'Start a renaming session. Work only in the folder named ' + c.practice + '. Read buyer-profile.md, naming-registry.md and workflow.md first. Then run the capability check before you propose any names.';
    return tk([
      '# Claude project setup',
      '',
      'Steps checked against Claude\'s help pages on ' + c.date + '. Menus change, so if a label differs on your screen, look for the closest match and ask for support.',
      '',
      '## 1. Create the project',
      '',
      '1. Hover over the left side of your Claude account and click §Projects§, or go to §claude.ai/projects§.',
      '2. Click §+ New Project§ in the upper right corner.',
      '3. Enter a name such as §File-renaming agent§ and a short description. Claude does not read the name or description.',
      '4. On Team or Enterprise plans, choose §Keep it private§.',
      '',
      '## 2. Add the knowledge files',
      '',
      '1. Open the project. The knowledge area is on the right side of the main page.',
      '2. Click the §+§ button.',
      '3. Upload these files from the unzipped package: §core/workflow.md§, §context/buyer-profile.md§, §context/knowledge.md§, §context/naming-registry.md§, §examples/sample-input.md§ and §examples/sample-output.md§.',
      '',
      '## 3. Paste the instructions',
      '',
      '1. Click §Set project instructions§.',
      '2. Open §core/agent-instructions.md§, copy everything, and paste it in.',
      '3. Click §Save instructions§.',
      '',
      '## 4. Connect your files',
      '',
      S.where === 'drive'
        ? '1. In a chat inside the project, click the plus sign, hover over §Connectors§, and toggle Google Drive on. The first time, Claude sends you to Google to sign in.\n2. On Team and Enterprise plans, an Owner must first enable connectors under §Organization settings > Connectors§.\n3. Claude\'s help page lists find, read, upload, create folders, share, move and trash for the Drive connector. It does not list renaming. That is why the first session starts with a capability check: the agent tries one test rename and tells you honestly whether it works.'
        : 'This guide covers the Google Drive route only, because it is the one with documented steps. Keep your computer folder or Obsidian vault mirrored from Google Drive (Drive for desktop) and use the Drive steps above. Renames made in Drive then reach your computer after syncing. Obsidian links to renamed files may need repair, so test on the practice folder first. Direct access to a folder on your computer depends on the Claude app version and has not been verified for this package.',
      '',
      '## 5. Start the first session',
      '',
      'Open a new chat in the project and paste:',
      '',
      '§§§',
      first,
      '§§§',
      '',
      '## Status',
      '',
      'Not yet tested end to end by the maker. See compatibility.json.'
    ].join('\n'));
  }
  function chatgptSetup(S, c) {
    var first = 'Start a renaming session. Work only in the folder named ' + c.practice + '. Read buyer-profile.md, naming-registry.md and workflow.md first. Then run the capability check before you propose any names.';
    return tk([
      '# ChatGPT project setup',
      '',
      'Checked against OpenAI\'s help pages on ' + c.date + '. Some labels below are described the way the help pages describe them, not as exact button names. If a label differs, look for the closest match.',
      '',
      '## What the help pages say',
      '',
      '- Projects let you group chats, upload reference files, and add custom instructions.',
      '- You can add a Google Drive file or folder link as a project source in a private project: open the project, choose §Add sources§, select Google Drive, connect and approve access if asked, paste the link, and choose §Add§.',
      '- The Google Drive app does not sync inside a project. It can search and open files, but content is not pre-synced.',
      '- Actions that change a Drive file need the matching Google permissions and must be available in your workspace. ChatGPT may ask you to confirm. The help pages do not list renaming.',
      '',
      '## Steps',
      '',
      '1. Create a project in ChatGPT and name it something like File-renaming agent.',
      '2. Add the files §core/workflow.md§, §context/buyer-profile.md§, §context/knowledge.md§, §context/naming-registry.md§, §examples/sample-input.md§ and §examples/sample-output.md§ as project files.',
      '3. Find the project\'s instructions setting (the help pages call it custom instructions), paste the whole of §core/agent-instructions.md§, and save.',
      '4. Connect Google Drive and add your practice folder link as a source.',
      '5. Open a new chat in the project and paste:',
      '',
      '§§§',
      first,
      '§§§',
      '',
      '## If renaming is not available',
      '',
      'The capability check will tell you. In that case the agent switches to table-only mode and gives you a list of current names and new names to apply yourself.',
      '',
      '## Status',
      '',
      'Not yet tested by the maker. Treat this route as experimental. See compatibility.json.'
    ].join('\n'));
  }

  /* ---------- compatibility.json ---------- */
  function compat(S, c) {
    var o = {
      package: 'file-renaming-agent',
      package_version: '1.0.0',
      generated_on: c.date,
      generated_for: c.who,
      selected: { ai: S.ai, files: S.where },
      routes: [
        { id: 'claude-project + google-drive-connector', status: 'built, not yet tested end to end', note: 'The Drive connector help page lists move and trash but not rename. The capability check in workflow.md decides.' },
        { id: 'claude-project + folder-on-computer', status: 'not tested', note: 'Mirror the folder from Google Drive and use the Drive route. Direct folder access depends on the Claude app version.' },
        { id: 'chatgpt-project + google-drive', status: 'not tested', note: 'Help pages do not list renaming. Falls back to table-only mode if rename is unavailable.' },
        { id: 'obsidian-vault-synced-with-google-drive', status: 'not tested', note: 'Links in notes may need repair after renames.' }
      ],
      verified_against_vendor_docs_on: c.date,
      tested_by_maker: null,
      requirements: [
        'A Claude or ChatGPT account that supports projects',
        'Google Drive connected to the AI',
        'A practice folder with 10 to 20 files'
      ],
      overnight_mode: { status: 'locked', unlock: { renames: 100, days_between_first_and_last: 7 }, tested: false }
    };
    return JSON.stringify(o, null, 2) + '\n';
  }

  function license(S, c) {
    return [
      'RENAMING AGENT PACKAGE LICENSE',
      'Plain-language draft. Not yet reviewed by a lawyer.',
      '',
      '(c) Anri Olivier, LLC. All rights Reserved.',
      '',
      'Licensed to: ' + c.who + ', ' + c.biz,
      'Date: ' + c.date,
      '',
      '1. What you may do. Use this package, and the agent it sets up, on your own files for your own business. Edit the package to fit how you work.',
      '',
      '2. What you may not do. Sell, resell, share, publish or give this package, or an edited copy of it, to anyone outside your business. Do not present it as your own product. Keep this notice in place.',
      '',
      '3. The type inventory. The approved type words inside are lent to you from Anri Olivier\'s Renaming Library Registry. They remain Anri Olivier\'s work.',
      '',
      '4. No guarantee. The package is provided as is. It is built to rename only, with previews and your approval, but no software is perfect. Keep backups of important files. Anri Olivier, LLC is not responsible for lost files, wrong names, or results from using the package.',
      '',
      '5. Other tools. Claude, ChatGPT, Google Drive, Obsidian and any other tool named here belong to their makers. Follow their terms.',
      '',
      '6. Help. See SUPPORT.md.',
      ''
    ].join('\n');
  }

  function support(S, c) {
    return tk([
      '# Support',
      '',
      '## Email',
      '',
      'anri@lumen8ai.com',
      '',
      '## Community',
      '',
      'growthmasterkey.site. This is a paid community. Join it for more support, ideas and other founders using their AI Master Key.',
      '',
      '## When you write for help, include',
      '',
      '- Which AI you use (' + c.ai + ') and where your files live (' + c.where + ').',
      '- The step you were on, for example the capability check or the preview table.',
      '- What you expected and what happened.',
      '- A few lines of your rename log. Remove anything private first.',
      '',
      '## Before you write',
      '',
      '- Reread compatibility.json. Several routes are not tested yet, and the setup guide says so.',
      '- Ask the agent: "What did the capability check find?"'
    ].join('\n'));
  }

  function changelog(S, c) {
    return tk([
      '# Changelog',
      '',
      '## 1.0.0 (' + c.date + ')',
      '',
      '- Package generated from the setup activity for ' + c.who + '.',
      '- Naming pattern: §' + c.pattern + '§.',
      '- Types in use: ' + (sel(S).length ? sel(S).length : 'none chosen yet') + '. Topics chosen: ' + topicList(S).length + '.',
      '- Setup steps checked against Claude and OpenAI help pages on ' + c.date + '.',
      '',
      '### Known limits',
      '',
      '- The agent has not been run end to end on your files. The first session starts with a capability check.',
      '- Renaming through the Google Drive connector is not listed in the vendor help pages.',
      '- Overnight mode is locked and untested.',
      '- LICENSE.txt is a plain-language draft awaiting lawyer review.'
    ].join('\n'));
  }

  function build(S) {
    var c = ctx(S);
    return [
      { path: 'README.md', content: readme(S, c) },
      { path: 'QUICKSTART.md', content: quickstart(S, c) },
      { path: 'core/agent-instructions.md', content: instructions(S, c) },
      { path: 'core/workflow.md', content: workflow(S, c) },
      { path: 'context/buyer-profile.md', content: buyer(S, c) },
      { path: 'context/knowledge.md', content: knowledge(S, c) },
      { path: 'context/source-register.csv', content: sources(S, c) },
      { path: 'context/naming-registry.md', content: registry(S, c) },
      { path: 'examples/sample-input.md', content: sampleInput(S, c) },
      { path: 'examples/sample-output.md', content: sampleOutput(S, c) },
      { path: 'adapters/chatgpt-project/setup.md', content: chatgptSetup(S, c) },
      { path: 'adapters/claude-project/setup.md', content: claudeSetup(S, c) },
      { path: 'compatibility.json', content: compat(S, c) },
      { path: 'LICENSE.txt', content: license(S, c) },
      { path: 'SUPPORT.md', content: support(S, c) },
      { path: 'CHANGELOG.md', content: changelog(S, c) }
    ];
  }
  function zipName(S) {
    var c = ctx(S);
    return 'file-renaming-agent--' + c.pslug + '--v01';
  }

  g.Pkg = { build: build, zipName: zipName, ctx: ctx, today: today };
})(typeof globalThis !== 'undefined' ? globalThis : window);
