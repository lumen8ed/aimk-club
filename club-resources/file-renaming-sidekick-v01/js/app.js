/* app.js: the screens, the live name lab, the test drive and the download. */
(function () {
  'use strict';
  var D = window.RenData, N = window.Naming, P = window.Pkg, L = D.LABEL;
  var STORE = 'ren-sidekick-v1';
  var S = null, PKG = [], DL = null, DLChecked = false, resetArmed = false, gateCache = null;

  /* ---------- state ---------- */
  function fresh() {
    var types = {};
    D.TYPES.forEach(function (t) { types[t.key] = { on: false, word: '' }; });
    return {
      screen: 0, ai: 'claude', where: 'drive', folder: '', logDefault: true, logLoc: '', person: '', business: '',
      del: 'no', delNames: D.DELETE_NAMES.slice(), access: 'me',
      firstFind: '', goTo: '', related: '', dateFreq: '',
      pieces: { date: true, topic: true, detail: true }, length: 'right', order: 'front', orderTouched: false,
      types: types, recSources: ['zoom'], recOther: '', topics: [], customTopic: '', missing: '',
      dateOverride: {}, city: 'no', final: 'yes', labType: '',
      testNames: ['', '', ''], testOv: [{}, {}, {}], testSearch: ['', '', ''], testOk: ['', '', ''],
      practice: '', logPaste: '', logResult: null
    };
  }
  function merge(o) {
    var f = fresh();
    if (o && typeof o === 'object') {
      Object.keys(f).forEach(function (k) { if (o[k] !== undefined && o[k] !== null) f[k] = o[k]; });
      f.pieces = Object.assign({ date: true, topic: true, detail: true }, f.pieces);
    }
    D.TYPES.forEach(function (t) { if (!f.types[t.key]) f.types[t.key] = { on: false, word: '' }; });
    return f;
  }
  function load() {
    try { var raw = localStorage.getItem(STORE); return raw ? merge(JSON.parse(raw)) : null; } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ } }

  function getPath(path) { var o = S; path.split('.').forEach(function (k) { o = o == null ? o : o[k]; }); return o; }
  function setPath(path, val) {
    var p = path.split('.'), o = S;
    for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
    o[p[p.length - 1]] = val;
  }

  /* ---------- small helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function selectedKeys() { return D.TYPES.filter(function (t) { return S.types[t.key].on; }).map(function (t) { return t.key; }); }

  function partsHtml(parts, ext) {
    var h = parts.map(function (p) { return '<span class="seg seg-' + p.k + (p.q ? ' seg-q' : '') + '">' + esc(p.t) + '</span>'; }).join('<span class="sep">--</span>');
    return h + (ext ? '<span class="ext">.' + esc(ext) + '</span>' : '');
  }
  var LEG = { date: ['#f0d691', 'date'], type: ['#8fe0b4', 'type'], source: ['#9fd8d0', 'source'], topic: ['#bfdc92', 'topic'], title: ['#f3ecdc', 'title'], author: ['#f0bd9f', 'author'], detail: ['#f0bd9f', 'label'], version: ['#cdbdf3', 'version'], final: ['#d6b46a', 'final'], copy: ['#bccabf', 'copy'] };
  function legendHtml(parts) {
    var seen = {}, out = [];
    parts.forEach(function (p) { if (!seen[p.k] && LEG[p.k]) { seen[p.k] = 1; out.push('<span><i style="background:' + LEG[p.k][0] + '"></i>' + LEG[p.k][1] + '</span>'); } });
    return '<div class="legend">' + out.join('') + '</div>';
  }

  /* ---------- form builders ---------- */
  function q(n, title, hint, body) {
    return '<section class="q"><div class="q-head"><span class="qn">' + pad2(n) + '</span><h3 class="qt" id="q' + n + '">' + title + '</h3></div>' +
      (hint ? '<p class="hint">' + hint + '</p>' : '') + '<div class="q-body">' + body + '</div></section>';
  }
  function grp(items, two) { return '<div class="opts' + (two ? ' two' : '') + '" role="radiogroup">' + items.join('') + '</div>'; }
  function radio(path, val, label, hint, bool) {
    var id = path.replace(/\./g, '-') + '-' + val;
    var checked = String(getPath(path)) === String(val);
    return '<label class="opt" for="' + id + '"><input type="radio" id="' + id + '" name="' + path + '" value="' + esc(val) + '" data-bind="' + path + '"' + (bool ? ' data-bool="1"' : '') + (checked ? ' checked' : '') + '><span><b>' + label + '</b>' + (hint ? '<small>' + hint + '</small>' : '') + '</span></label>';
  }
  function checkArr(path, val, label, hint) {
    var id = path + '-' + val, on = (getPath(path) || []).indexOf(val) > -1;
    return '<label class="opt" for="' + id + '"><input type="checkbox" id="' + id + '" data-bind-arr="' + path + '" value="' + esc(val) + '"' + (on ? ' checked' : '') + '><span><b>' + label + '</b>' + (hint ? '<small>' + hint + '</small>' : '') + '</span></label>';
  }
  function checkBool(path, label, hint, locked) {
    var id = (path || ('locked-' + N.slug(label))).replace(/\./g, '-'), on = locked ? true : !!getPath(path);
    return '<label class="opt" for="' + id + '"><input type="checkbox" id="' + id + '"' + (locked ? ' disabled' : ' data-bind-bool="' + path + '"') + (on ? ' checked' : '') + '><span><b>' + label + '</b>' + (hint ? '<small>' + hint + '</small>' : '') + '</span></label>';
  }
  function textIn(id, path, ph, mono, extra) {
    return '<input type="text" id="' + id + '" data-bind-text="' + path + '" class="' + (mono ? 'mono-in' : '') + '" value="' + esc(getPath(path)) + '" placeholder="' + esc(ph || '') + '" autocomplete="off" spellcheck="false"' + (extra || '') + '>';
  }

  /* ---------- the name lab ---------- */
  function labInner() {
    var sc = S.screen, head, cap, nm, leg, sel = '';
    if (sc === 4) {
      var ap = N.anriParts(S);
      head = 'Live name lab'; cap = 'The anri-average file. Change the pieces and the order, and watch the name change.';
      nm = partsHtml(ap, 'txt'); leg = legendHtml(ap);
    } else {
      var keys = selectedKeys();
      if (!keys.length) {
        head = 'Live name lab'; cap = 'Pick a kind of file and a sample name shows up here.';
        nm = partsHtml([{ k: 'type', t: 'type', q: 1 }, { k: 'topic', t: 'topic', q: 1 }, { k: 'title', t: 'title', q: 1 }]); leg = '';
      } else {
        var key = keys.indexOf(S.labType) > -1 ? S.labType : keys[0];
        var it = N.sampleItem(S, key, sc >= 6), parts = N.buildParts(S, it);
        head = 'Live name lab'; cap = 'Illustrative sample. Preview with:';
        sel = '<select id="labType" aria-label="Preview with this kind of file" data-bind="labType">' + keys.map(function (k) { return '<option value="' + k + '"' + (k === key ? ' selected' : '') + '>' + esc(D.TYPE[k].label) + '</option>'; }).join('') + '</select>';
        nm = partsHtml(parts, it.ext); leg = legendHtml(parts);
      }
    }
    return '<h3>' + head + '</h3><p class="cap">' + cap + '</p>' + sel + '<div class="nm" id="labName">' + nm + '</div>' + leg +
      '<p class="rule">Always on: lowercase, two hyphens between fields, one hyphen between words, no spaces.</p>';
  }

  /* ---------- screens ---------- */
  function welcome() {
    var after = [{ k: 'type', t: 'workbook' }, { k: 'topic', t: 'leadership' }, { k: 'title', t: 'leadership-reset' }, { k: 'version', t: 'v03' }, { k: 'final', t: 'final' }];
    return '<section class="screen hero"><h1 id="h">Meet your new file-renaming sidekick</h1>' +
      '<p class="tag">Your files. Your words. Your way.</p>' +
      '<p class="lede">Let\'s turn that "where on earth did I save it?" feeling into "named it, found it!" I\'m going to ask you a few questions so we can save your AI Master Key files in your own unique way. Are you ready to get started?</p>' +
      '<div class="ba"><div class="row"><span class="tagline">Before</span><span class="before">Sarah Workshop FINAL 3.pdf</span></div>' +
      '<div class="row"><span class="tagline">After</span><div class="nm">' + partsHtml(after, 'pdf') + '</div></div></div>' +
      '<div class="promise"><span>I only rename</span><span>You preview every change</span><span>Nothing is trashed without your yes</span></div>' +
      '<div class="nav" style="justify-content:flex-start"><button type="button" class="btn" data-act="start" id="startBtn">Yes, I am!</button></div></section>';
  }

  function s1() {
    return q(1, 'Which AI will run your agent?', null, grp([
      radio('ai', 'claude', 'Claude', 'A Claude project.'),
      radio('ai', 'chatgpt', 'ChatGPT', 'A ChatGPT project. The setup guide is included, and this route is still being tested.')], true)) +
      q(2, 'Where do your files live?', null, grp([
        radio('where', 'drive', 'Google Drive'),
        radio('where', 'computer', 'A folder on my computer', 'Works best when the folder is also mirrored from Google Drive.'),
        radio('where', 'obsidian', 'An Obsidian vault synced with Google Drive')])) +
      q(3, 'What is the exact name of your main AI Master Key folder?', 'Copy it exactly as it appears, hyphens and all.', textIn('folder', 'folder', 'ai-master-key--yourname', true)) +
      q(4, 'Where should I save your rename logs?', null, grp([
        radio('logDefault', 'true', 'Use the suggested location', '<span class="mono">' + D.DEFAULT_LOG + '</span>', true),
        radio('logDefault', 'false', 'Choose my own', null, true)]) +
        (S.logDefault ? '' : '<div style="margin-top:10px">' + textIn('logLoc', 'logLoc', 'folder/subfolder', true) + '</div>')) +
      q(5, 'What should I call you, and what is your business name?', null,
        '<div class="fields"><div><label class="f" for="person">Your name</label>' + textIn('person', 'person', 'First name is perfect') + '</div><div><label class="f" for="business">Business name</label>' + textIn('business', 'business', '') + '</div></div>');
  }
  function c1() {
    if (!S.folder.trim()) return 'Type the exact name of your main folder (question 3).';
    if (!S.logDefault && !S.logLoc.trim()) return 'Type where the rename logs should go (question 4).';
    if (!S.person.trim()) return 'Tell me what to call you (question 5).';
    return '';
  }

  function s2() {
    return '<p class="sub" style="margin-top:18px">My job is to give your files better names. That\'s it. I won\'t move them, rewrite what\'s inside them, or delete anything without your permission.</p>' +
      q(6, 'Want an optional trash helper?', 'Sometimes we save a file just to get it out of the way, knowing full well it belongs in the bin. Should I recognize files you deliberately named for the trash and offer to trash them?', grp([
        radio('del', 'no', 'Nope. Renaming only, please. (Recommended)'),
        radio('del', 'yes', 'Yes, but always ask me before trashing anything.')])) +
      (S.del === 'yes' ? q(7, 'Which file names should I treat as "bin me"?', 'Handy when you mark more than one file in a folder, since two files cannot share a name.',
        grp(D.DELETE_NAMES.map(function (n) { return checkArr('delNames', n, '<span class="mono">' + n + '</span>'); }), true) +
        '<div class="note">A file only counts when its <b>whole name</b> is one of these. The word delete inside a longer title never counts. I always ask first, and I use the trash, never permanent deletion.</div>') : '') +
      '<div class="note">Either way, you\'ll see a preview and approve changes before I rename your files.</div>';
  }
  function c2() { return (S.del === 'yes' && !S.delNames.length) ? 'Pick at least one name, or choose renaming only (question 6).' : ''; }

  function s3() {
    return q(8, 'Who else will need to find things in these files?', null, grp([
      radio('access', 'me', 'Just me'),
      radio('access', 'assistant', 'Me and my assistant'),
      radio('access', 'team', 'My team', 'Team mode: clear, everyday words. No secret codes.')])) +
      '<section class="q"><h3 class="qt" style="max-width:none">Remember, these are the 7 categories in your key.</h3><div class="seven">' +
      D.SEVEN.map(function (s) { return '<div><span class="n">' + s.n + '</span><b>' + s.say + '</b><small>' + s.folder + '</small></div>'; }).join('') + '</div></section>';
  }

  function s4() {
    var apName = 'transcript--ai-master-key-accelerator--lesson-2--extraction.txt';
    var orders = ['front', 'end', 'none'].map(function (o) {
      var id = 'order-' + o, checked = S.order === o;
      return '<label class="opt name-card" for="' + id + '"><div class="row"><input type="radio" id="' + id + '" name="order" value="' + o + '" data-bind="order"' + (checked ? ' checked' : '') + '><b>' + ({ front: 'Date first', end: 'Date at the end', none: 'No date' })[o] + '</b></div><div class="nm name">' + partsHtml(N.anriParts(S, o), 'txt') + '</div></label>';
    }).join('');
    return q(9, 'Think of the last file you went looking for. HOW did you try to find it? What word did you use to describe that file?', null, grp([
      radio('firstFind', 'person', 'A person\'s name'), radio('firstFind', 'topic', 'The topic'), radio('firstFind', 'date', 'The date'),
      radio('firstFind', 'type', 'The kind of file'), radio('firstFind', 'event', 'The event or program'),
      radio('firstFind', 'click', 'I clicked through folders'), radio('firstFind', 'unsure', 'I can\'t remember')], true)) +
      q(10, 'What is your go-to? Do you click through folders or type in a search box?', null, grp([
        radio('goTo', 'click', 'Mostly click'), radio('goTo', 'search', 'Mostly search'), radio('goTo', 'both', 'Both')])) +
      q(11, 'Here is an anri-average file. Which pieces would you keep? Does it feel too long?', null,
        '<div class="static-name">2026-02-14--' + apName + '</div><div class="opts two">' +
        checkBool('pieces.date', 'Date', '2026-02-14') + checkBool('', 'Type', 'transcript. Always stays, so files sort and AI can read them.', true) +
        checkBool('pieces.topic', 'Program or topic', 'ai-master-key-accelerator') + checkBool('', 'Lesson or title', 'lesson-2. Always stays, the real title.', true) +
        checkBool('pieces.detail', 'Extra label', 'extraction. Also covers an author when a document names one.') + '</div>' +
        '<p class="sub-q">Does it feel too long?</p>' + grp([radio('length', 'right', 'About right'), radio('length', 'long', 'Too long', 'I\'ll shorten long titles to their key words and show you the full title.'), radio('length', 'short', 'Too short')])) +
      q(12, 'Which order feels more like you?', null, '<div class="opts">' + orders + '</div>') +
      q(13, 'When you look up a term, whether it is a client, a resource or a date, should everything connected to it show up, even from different folders?', null, grp([
        radio('related', 'yes', 'Yes, show me everything'), radio('related', 'folder', 'Only what is in the folder I am in'), radio('related', 'unsure', 'Not sure yet')])) +
      q(14, 'How often do you search by date?', null, grp([
        radio('dateFreq', 'often', 'Often'), radio('dateFreq', 'sometimes', 'Sometimes'), radio('dateFreq', 'rarely', 'Rarely'), radio('dateFreq', 'never', 'Never')], true));
  }
  function c4() {
    var need = [['firstFind', 9], ['goTo', 10], ['related', 13], ['dateFreq', 14]];
    for (var i = 0; i < need.length; i++) if (!S[need[i][0]]) return 'Pick an answer for question ' + need[i][1] + '. There is no wrong one.';
    return '';
  }

  function wordMsg(k) {
    var v = N.validateWord(k, S.types[k].word);
    if (!v.ok) return v.msg;
    if (v.word) {
      var dup = selectedKeys().some(function (o) { return o !== k && N.typeWord(S, o) === v.word; });
      if (dup) return 'Another file type already uses this word. Pick a different one.';
    }
    return '';
  }
  function s5() {
    var keys = selectedKeys();
    var fams = D.FAMILIES.map(function (f) {
      return '<div class="fam"><h3>' + f.label + '</h3><p>' + f.blurb + '</p><div class="chips">' +
        D.TYPES.filter(function (t) { return t.fam === f.key; }).map(function (t) {
          return '<label class="chip" title="' + esc(t.means) + '"><input type="checkbox" id="tt-' + t.key + '" data-type-toggle="' + t.key + '"' + (S.types[t.key].on ? ' checked' : '') + '><span>' + esc(t.label) + '</span></label>';
        }).join('') + '</div></div>';
    }).join('');
    var rows = keys.length ? keys.map(function (k) {
      var t = D.TYPE[k];
      return '<div class="trow"><div><b>' + esc(t.label) + '</b><small>' + esc(t.means) + '</small><code id="ex-' + k + '">' + esc(N.partsToName(N.buildParts(S, N.sampleItem(S, k, false)), t.ext)) + '</code></div>' +
        '<div><label class="f" for="tw-' + k + '">Keep my suggestion, or teach me your word</label><input type="text" id="tw-' + k + '" class="mono-in" data-type-word="' + k + '" value="' + esc(S.types[k].word) + '" placeholder="' + k + '" autocomplete="off" spellcheck="false"><div class="msg" id="wm-' + k + '">' + esc(wordMsg(k)) + '</div></div></div>';
    }).join('') : '<p class="hint" style="margin-left:0">Pick at least one kind of file above and its row shows up here.</p>';
    var rec = '';
    if (S.types.recording.on) {
      rec = q(17, 'How do you record things?', 'So a Zoom recording and a screen recording never look alike.', '<div class="opts two">' +
        [['zoom', 'Zoom'], ['screen-capture', 'Screen capture'], ['phone', 'Phone'], ['other', 'Something else']].map(function (r) { return checkArr('recSources', r[0], r[1]); }).join('') + '</div>' +
        (S.recSources.indexOf('other') > -1 ? '<div style="margin-top:10px">' + textIn('recOther', 'recOther', 'one word, like loom', true) + '</div>' : ''));
    }
    var starter = D.STARTER_TOPICS.concat(S.topics.filter(function (t) { return D.STARTER_TOPICS.indexOf(t) < 0; }));
    var chips = starter.map(function (t) {
      return '<label class="chip"><input type="checkbox" id="tp-' + t + '" data-topic-toggle="' + t + '"' + (S.topics.indexOf(t) > -1 ? ' checked' : '') + '><span>' + esc(t) + '</span></label>';
    }).join('');
    return q(15, 'Which of these kinds of files do you have?', 'Pick every kind you have. Ebook means something you read. Workbook means something you fill in.', fams) +
      q(16, 'For each one, keep my word or teach me yours.', 'Your word becomes the type word in your names. Leave it empty to keep mine.', rows) +
      rec +
      q(18, 'What are your top 10 search words?', 'Pick from the starter list or add your own. These become your topic words.',
        '<div class="chips" id="topicChips">' + chips + '</div><div class="addrow"><input type="text" id="customTopic" data-bind-text="customTopic" placeholder="Add your own word" autocomplete="off" spellcheck="false" aria-label="Add your own search word"><button type="button" class="btn ghost small" data-act="add-topic">Add</button></div><div class="count" id="topicCount" aria-live="polite"></div>') +
      q(19, 'Missing a file type?', 'Describe it and your agent will suggest a name. Nothing becomes official until you say yes.',
        '<textarea id="missing" data-bind-text="missing" placeholder="For example: the little PDFs I send after a discovery call">' + esc(S.missing) + '</textarea>');
  }
  function c5() {
    var keys = selectedKeys();
    if (!keys.length) return 'Pick at least one kind of file (question 15).';
    for (var i = 0; i < keys.length; i++) { var m = wordMsg(keys[i]); if (m) return D.TYPE[keys[i]].label + ': ' + m; }
    if (S.types.recording.on) {
      if (!S.recSources.length) return 'Pick at least one way you record (question 17).';
      if (S.recSources.indexOf('other') > -1 && !N.slug(S.recOther)) return 'Type your other recording source (question 17).';
    }
    return '';
  }

  function s6() {
    var keys = selectedKeys();
    var rows = keys.length ? keys.map(function (k) {
      var t = D.TYPE[k], ov = S.dateOverride[k] || 'default';
      var defLabel = t.dateFirst ? 'Date first (this kind always starts with the date)' : 'Use my default (' + L.order[S.order] + ')';
      var opts = [['default', defLabel], ['front', 'Date first'], ['end', 'Date at the end'], ['none', 'No date']].map(function (o) { return '<option value="' + o[0] + '"' + (ov === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
      return '<div class="trow"><div><b>' + esc(t.label) + '</b></div><select id="dov-' + k + '" data-dov="' + k + '" aria-label="Date placement for ' + esc(t.label) + '">' + opts + '</select></div>';
    }).join('') : '<p class="hint" style="margin-left:0">Pick your kinds of files on the last screen and they show up here.</p>';
    return '<p class="sub" style="margin-top:18px">A little naming magic, zero guesswork. Some rules stay consistent for everyone: lowercase, two hyphens between fields, a type word, a title, and version numbers for files that have versions.</p>' +
      q(20, 'Date in the name?', 'Your default is set from the last screen. Change it for any kind of file here.', rows) +
      q(21, 'Add the city for in-person events?', null, grp([radio('city', 'yes', 'Yes, add the city'), radio('city', 'no', 'No')], true)) +
      q(22, 'Mark your approved version with final?', 'Only the latest approved version carries it. When a newer one is approved, the older file keeps its vNN and loses final.',
        grp([radio('final', 'yes', 'Yes, mark it', 'workbook--leadership--v03--final.pdf'), radio('final', 'no', 'No, versions only', 'workbook--leadership--v03.pdf')]));
  }

  /* ---------- test drive ---------- */
  var NEED = { version: 'version number?', type: 'kind of file?', source: 'Zoom, screen capture or phone?', topic: 'topic?', date: 'date?' };
  function tdOne(i) { return N.parseOld(S.testNames[i], S, S.testOv[i]); }
  function hitsHtml(i, r) {
    var hs = N.searchHits(r.name, S.testSearch[i]);
    if (!hs.length) return '';
    var miss = hs.filter(function (h) { return !h.hit; });
    var h = '<div class="hits">' + hs.map(function (x) { return '<span class="hit ' + (x.hit ? 'y' : 'n') + '">' + esc(x.w) + (x.hit ? ' found' : ' not in the name') + '</span>'; }).join('') + '</div>';
    if (miss.length) h += '<div class="msg">Those words are not all in the new name. <button type="button" class="btn ghost small" data-td-usetopic="' + i + '|' + esc(miss[0].w) + '">Use "' + esc(miss[0].w) + '" as the topic</button></div>';
    else h += '<div class="okmsg" style="margin-top:8px;font-size:14px">Every word you would search for is in the name.</div>';
    return h;
  }
  function pillsHtml(r) {
    var p = r.need.map(function (n) { return '<span class="pill">' + (NEED[n] || n) + '</span>'; }).concat(r.flags.map(function (f) { return '<span class="pill">' + esc(f) + '</span>'; }));
    return p.length ? p.join('') : '<span class="pill ok">Complete</span>';
  }
  function tdCard(i) {
    var r = tdOne(i); if (!r) return '';
    var tw = S.testOk[i] === 'tweak';
    var typeSel = '<select id="tdt-' + i + '" data-td-type="' + i + '" aria-label="Kind of file for example ' + (i + 1) + '"><option value="">Let the agent decide</option>' + D.TYPES.map(function (t) { return '<option value="' + t.key + '"' + ((S.testOv[i].key === t.key) ? ' selected' : '') + '>' + esc(t.label) + '</option>'; }).join('') + '</select>';
    return '<div class="td"><div class="before">' + esc(r.raw) + '</div><div class="nm" id="tdnm-' + i + '">' + partsHtml(r.parts, r.ext) + '</div><div class="pills" id="tdp-' + i + '">' + pillsHtml(r) + '</div>' +
      '<label class="f" for="ts-' + i + '" style="margin-top:14px">Type the words you would naturally search for to find this file</label><input type="text" id="ts-' + i + '" data-td-search="' + i + '" value="' + esc(S.testSearch[i]) + '" placeholder="for example: leadership workbook" autocomplete="off"><div id="hits-' + i + '">' + hitsHtml(i, r) + '</div>' +
      '<div class="seg-btns"><button type="button" class="btn small' + (S.testOk[i] === 'ok' ? '' : ' ghost') + '" data-td-ok="' + i + '|ok">Looks right</button><button type="button" class="btn small' + (tw ? '' : ' ghost') + '" data-td-ok="' + i + '|tweak">Needs a tweak</button></div>' +
      (tw ? '<div class="grid2"><div><label class="f" for="tdt-' + i + '">Kind of file</label>' + typeSel + '</div><div><label class="f" for="tdo-' + i + '">Topic</label><input type="text" id="tdo-' + i + '" class="mono-in" data-td-topic="' + i + '" value="' + esc(S.testOv[i].topic || '') + '" placeholder="one topic word" autocomplete="off"></div></div>' : '') + '</div>';
  }
  function tdAll() {
    var h = [0, 1, 2].map(tdCard).join('');
    return h || '<p class="hint" style="margin-left:0">Paste a name above and its makeover shows up here.</p>';
  }
  function s7() {
    return q(23, 'Paste three real file names.', 'For each one you will see BEFORE and AFTER. Then type the words you would naturally search for. Nothing gets renamed during the test drive.',
      [0, 1, 2].map(function (i) { return '<div style="margin-bottom:10px"><label class="f" for="tn-' + i + '">File name ' + (i + 1) + '</label><input type="text" id="tn-' + i + '" class="mono-in" data-td-name="' + i + '" value="' + esc(S.testNames[i]) + '" placeholder="Paste a file name, extension included" autocomplete="off" spellcheck="false"></div>'; }).join('') +
      '<button type="button" class="btn ghost small" data-act="td-examples">Try three messy examples</button><div id="tdResults">' + tdAll() + '</div>' +
      '<div class="note"><b>This is a name-only preview.</b> Your agent opens each file and reads it before it names it, so real titles, dates and authors come from the inside. Anything marked with a dashed outline is something it would ask you.</div>');
  }

  /* ---------- download screen ---------- */
  function gateHtml() {
    var r = gateCache;
    var inner = '';
    if (r) {
      var pr = Math.min(100, r.renamed), pd = Math.min(7, r.days);
      inner = '<div class="meter"><div class="lbl"><span>Renames logged</span><span>' + r.renamed + ' of 100</span></div><div class="trk"><i style="width:' + pr + '%"></i></div></div>' +
        '<div class="meter"><div class="lbl"><span>Days between first and last</span><span>' + r.days + ' of 7</span></div><div class="trk"><i style="width:' + Math.round(pd / 7 * 100) + '%"></i></div></div>';
      if (r.unlocked) {
        inner += '<p class="okmsg" style="margin-top:12px">Unlocked. Your sidekick earned its stripes.</p><p class="hint" style="margin-left:0">Paste this to your agent to start the setup conversation. The agent confirms the folder and the schedule with you first.</p><div class="cta"><button type="button" class="btn small" data-act="copy-overnight">Copy the message</button></div>';
      } else {
        inner += '<p class="msg">Still locked. ' + (r.renamed < 100 ? (100 - r.renamed) + ' more renames' : '') + (r.renamed < 100 && r.days < 7 ? ' and ' : '') + (r.days < 7 ? (7 - r.days) + ' more days' : '') + ' to go.</p>';
      }
    }
    return inner;
  }
  function s8() {
    var c = P.ctx(S), keys = selectedKeys();
    PKG = P.build(S);
    var files = PKG.map(function (f, i) {
      return '<details><summary><span style="color:var(--ink)">' + esc(f.path) + '</span><span>' + f.content.length.toLocaleString('en-US') + ' characters</span></summary><div class="body"><button type="button" class="btn ghost small" data-copy="' + i + '">Copy this file</button><pre id="pre-' + i + '">' + esc(f.content) + '</pre></div></details>';
    }).join('');
    return '<p class="sub" style="margin-top:18px">Your personal naming system is ready to become an agent. Start small, preview every suggested rename, and approve before anything changes.</p>' +
      '<div class="sum">' +
      '<div><small>Runs in</small><b>' + esc(c.ai) + '</b></div><div><small>Files live in</small><b>' + esc(c.where) + '</b></div><div><small>Main folder</small><b>' + esc(c.folder) + '</b></div>' +
      '<div><small>Trash helper</small><b>' + (S.del === 'yes' && S.delNames.length ? 'On, always asks' : 'Off') + '</b></div><div><small>File types</small><b>' + keys.length + ' chosen</b></div><div><small>Topic words</small><b>' + S.topics.length + ' chosen</b></div></div>' +
      '<div class="note" style="margin-top:12px"><b>Your name pattern</b><br><span class="mono" style="font-size:14px;color:var(--gold-hi);overflow-wrap:anywhere">' + esc(c.pattern) + '</span></div>' +
      q(24, 'Pick a small practice folder of 10 to 20 files.', 'Your agent starts there. Type the folder name, or leave it and I\'ll call it practice-folder.', textIn('practice', 'practice', 'practice-folder', true)) +
      '<section class="q"><h3 class="qt" style="max-width:none">Your 16-file agent package</h3><div class="cta" style="margin-top:12px"><button type="button" class="btn" id="dlBtn" data-act="download">Get my agent (.zip)</button><button type="button" class="btn ghost" data-act="copy-instr">Copy the agent instructions</button></div><div class="msg" id="dlMsg" role="status"></div>' +
      '<div class="files" id="files">' + files + '</div></section>' +
      '<div class="locked"><h3>Overnight mode</h3><p class="sub" style="margin-top:6px;font-size:16px">First, let\'s make sure your sidekick has earned its stripes. Your agent starts in supervised mode, and you approve renames before they happen. Paste your rename log to check your progress. Unlocking takes 100 completed renames and at least 7 days between the first and last logged rename.</p>' +
      '<label class="f" for="logPaste" style="margin-top:14px">Paste your rename log</label><textarea id="logPaste" class="mono-in" data-bind-text="logPaste" placeholder="| date | old name | new name | status | note |">' + esc(S.logPaste) + '</textarea>' +
      '<div class="cta"><button type="button" class="btn ghost small" data-act="check-log">Check my log</button></div><div id="gate">' + gateHtml() + '</div></div>';
  }

  var SCREENS = [
    { id: 'welcome' },
    { tag: 'Acquainted', title: 'First, let\'s get acquainted.', sub: 'A few quick details so I can build the right agent for you.', body: s1, check: c1, next: 'Next: the safety stuff' },
    { tag: 'Safety', title: 'No funny business.', sub: 'Let\'s get one thing straight: your files are safe with me.', win: 'Lovely. Now I know where we\'re working.', body: s2, check: c2, next: 'Got it. Next: who is in your files' },
    { tag: 'Who', title: 'Who\'s in your files?', sub: 'A quick word about who uses them.', win: 'Safety rules are set. Preview first, approve second.', body: s3, next: 'Next: how you search' },
    { tag: 'Search style', title: 'How does your brain hunt for files?', sub: 'There is no wrong answer. We\'re building a system around you, not the other way around.', win: 'Got it. Now let\'s see how your brain hunts.', body: s4, check: c4, lab: true, next: 'Next: your file types' },
    { tag: 'Your words', title: 'Speak my language.', sub: 'Let\'s retire the file-name guessing game.', win: 'Your search style is taking shape.', body: s5, check: c5, lab: true, next: 'Next: build your naming style' },
    { tag: 'Naming style', title: 'Build your naming style.', sub: 'A recipe for finding anything.', win: 'Your words are in. Time to build your recipe.', body: s6, lab: true, next: 'Next: test drive' },
    { tag: 'Test drive', title: 'Test drive.', sub: 'Three messy names enter. Three searchable names leave.', win: 'Your naming recipe is ready for a test drive.', body: s7, next: 'Next: get your agent' },
    { tag: 'Download', title: 'Download and try it out.', sub: 'Meet your new sidekick.', win: 'Your agent is ready to download.', body: s8 }
  ];

  /* ---------- render ---------- */
  function renderChrome() {
    var k = S.screen, bar = '';
    for (var i = 1; i <= 8; i++) bar += '<i' + (i <= k ? ' class="on"' : '') + '></i>';
    $('bar').innerHTML = bar;
    $('stepTag').innerHTML = k === 0 ? 'Welcome' : '<b>' + pad2(k) + ' / 08</b> &middot; ' + SCREENS[k].tag + ' &middot; ' + Math.round(k / 8 * 100) + '%';
    $('safety').hidden = k === 0;
  }
  function render(top) {
    var ae = document.activeElement, fid = ae && ae.id ? ae.id : null;
    var sc = SCREENS[S.screen], app = $('app'), html;
    if (S.screen === 0) { html = welcome(); app.className = 'stage'; }
    else {
      var nav = '<div class="nav"><div class="err" id="stepErr" role="alert"></div><button type="button" class="btn ghost" data-act="back">Back</button>' +
        (S.screen < 8 ? '<button type="button" class="btn" data-act="next" id="nextBtn">' + sc.next + '</button>' : '') + '</div>';
      html = '<section class="screen"><div>' + (sc.win ? '<p class="win">✓ ' + sc.win + '</p>' : '') + '<h2 id="h" tabindex="-1">' + sc.title + '</h2><p class="sub">' + sc.sub + '</p></div>' + sc.body() + nav + '</section>';
      if (sc.lab) html += '<aside class="lab" id="lab" aria-label="Live name lab">' + labInner() + '</aside>';
      app.className = 'stage' + (sc.lab ? ' has-lab' : '');
    }
    app.innerHTML = html;
    renderChrome();
    refreshLive();
    if (top) { window.scrollTo(0, 0); var h = $('h'); if (h) h.focus({ preventScroll: true }); }
    else if (fid && $(fid) && $(fid).focus) { try { $(fid).focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    if (S.screen === 8) updateDlBtn();
  }
  function refreshLive() {
    var lab = $('lab'); if (lab && !(document.activeElement && document.activeElement.id === 'labType')) lab.innerHTML = labInner();
    else if (lab) { var ln = $('labName'); if (ln) { /* select keeps focus; rebuild after change event instead */ } }
    selectedKeys().forEach(function (k) {
      var ex = $('ex-' + k); if (ex) ex.textContent = N.partsToName(N.buildParts(S, N.sampleItem(S, k, false)), D.TYPE[k].ext);
      var wm = $('wm-' + k); if (wm) wm.textContent = wordMsg(k);
    });
    var tc = $('topicCount'); if (tc) tc.textContent = S.topics.length + ' of 10 chosen';
  }
  function refreshFiles() {
    PKG = P.build(S);
    PKG.forEach(function (f, i) { var pre = $('pre-' + i); if (pre) pre.textContent = f.content; });
  }
  function showErr(m) { var e = $('stepErr'); if (e) e.textContent = m || ''; }

  function go(d) {
    if (d > 0) { var chk = SCREENS[S.screen].check; var err = chk ? chk() : ''; if (err) { showErr(err); return; } }
    S.screen = Math.max(0, Math.min(8, S.screen + d)); save(); render(true);
  }

  /* ---------- events ---------- */
  function afterChange(path) {
    if (path === 'order') { S.orderTouched = true; S.pieces.date = S.order !== 'none'; }
    else if (path === 'pieces.date') {
      S.orderTouched = true;
      if (!S.pieces.date) S.order = 'none'; else if (S.order === 'none') S.order = 'front';
    }
  }
  function updateTdCard(i) {
    var r = tdOne(i); if (!r) return;
    var nm = $('tdnm-' + i); if (nm) nm.innerHTML = partsHtml(r.parts, r.ext);
    var p = $('tdp-' + i); if (p) p.innerHTML = pillsHtml(r);
    var h = $('hits-' + i); if (h) h.innerHTML = hitsHtml(i, r);
  }
  function addTopic() {
    var w = N.slug(S.customTopic);
    var m = $('topicCount');
    if (!w) return;
    if (S.topics.indexOf(w) > -1) { S.customTopic = ''; render(); return; }
    if (S.topics.length >= 10) { if (m) m.textContent = 'That is 10. Remove one to add another.'; return; }
    S.topics.push(w); S.customTopic = ''; save(); render();
    var ci = $('customTopic'); if (ci) ci.focus();
  }

  document.addEventListener('change', function (e) {
    var t = e.target, v;
    if (t.matches('[data-bind]')) {
      var path = t.getAttribute('data-bind');
      v = t.value; if (t.hasAttribute('data-bool')) v = (v === 'true');
      setPath(path, v); afterChange(path);
    } else if (t.matches('[data-bind-bool]')) {
      var bp = t.getAttribute('data-bind-bool'); setPath(bp, t.checked); afterChange(bp);
    } else if (t.matches('[data-bind-arr]')) {
      var ap = t.getAttribute('data-bind-arr'), arr = getPath(ap).slice(), ix = arr.indexOf(t.value);
      if (t.checked && ix < 0) arr.push(t.value); else if (!t.checked && ix > -1) arr.splice(ix, 1);
      setPath(ap, arr);
    } else if (t.matches('[data-type-toggle]')) {
      var k = t.getAttribute('data-type-toggle'); S.types[k].on = t.checked;
    } else if (t.matches('[data-topic-toggle]')) {
      var w = t.getAttribute('data-topic-toggle'), ti = S.topics.indexOf(w);
      if (t.checked) { if (S.topics.length >= 10) { t.checked = false; var m = $('topicCount'); if (m) m.textContent = 'That is 10. Remove one to add another.'; return; } if (ti < 0) S.topics.push(w); }
      else if (ti > -1) S.topics.splice(ti, 1);
    } else if (t.matches('[data-dov]')) {
      S.dateOverride[t.getAttribute('data-dov')] = t.value;
    } else if (t.matches('[data-td-type]')) {
      var i = +t.getAttribute('data-td-type');
      if (t.value) S.testOv[i].key = t.value; else delete S.testOv[i].key;
      save(); $('tdResults').innerHTML = tdAll(); return;
    } else { return; }
    save(); render();
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches('[data-bind-text]')) { setPath(t.getAttribute('data-bind-text'), t.value); }
    else if (t.matches('[data-type-word]')) { S.types[t.getAttribute('data-type-word')].word = t.value; }
    else if (t.matches('[data-td-name]')) {
      var i = +t.getAttribute('data-td-name'); S.testNames[i] = t.value; S.testOv[i] = {}; S.testOk[i] = '';
      save(); $('tdResults').innerHTML = tdAll(); return;
    } else if (t.matches('[data-td-search]')) { var j = +t.getAttribute('data-td-search'); S.testSearch[j] = t.value; save(); updateTdCard(j); return; }
    else if (t.matches('[data-td-topic]')) { var n = +t.getAttribute('data-td-topic'); S.testOv[n].topic = t.value; save(); updateTdCard(n); return; }
    else return;
    save(); refreshLive();
    if (S.screen === 8 && t.id === 'practice') refreshFiles();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'customTopic') { e.preventDefault(); addTopic(); }
  });

  function copyText(text, done) {
    var ok = false;
    try { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); return; } catch (err) { ok = false; }
    done(ok);
  }
  function setMsg(m) { var d = $('dlMsg'); if (d) d.textContent = m; }

  function updateDlBtn() {
    var b = $('dlBtn'); if (!b) return;
    if (DLChecked && !DL) { b.disabled = true; setMsg('Downloading is not available in this view. Open any file below and use Copy this file, or open this page from claude.ai.'); }
    else b.disabled = false;
  }
  function download() {
    if (!DL) { setMsg('Downloading is not available in this view. Use Copy this file below.'); return; }
    if (typeof JSZip === 'undefined') { setMsg('The zip tool did not load. Use Copy this file below.'); return; }
    var name = P.zipName(S), zip = new JSZip(), root = zip.folder(name);
    P.build(S).forEach(function (f) { root.file(f.path, f.content); });
    setMsg('Packing your agent...');
    zip.generateAsync({ type: 'blob' }).then(function (blob) {
      return DL.save({ filename: name + '.zip', data: blob });
    }).then(function () { setMsg('Saved. Unzip it and open QUICKSTART.md.'); })
      .catch(function (err) {
        var code = err && err.code;
        setMsg(code === 'declined' ? 'No problem. Nothing was saved. Press the button when you are ready.' : 'The download did not go through' + (err && err.message ? ' (' + err.message + ')' : '') + '. Use Copy this file below.');
      });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, [data-act]'); if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'start') { S.screen = 1; save(); render(true); }
    else if (act === 'next') go(1);
    else if (act === 'back') go(-1);
    else if (act === 'reset') {
      if (!resetArmed) { resetArmed = true; t.textContent = 'Click again to clear every answer'; setTimeout(function () { resetArmed = false; var rb = $('resetBtn'); if (rb) rb.textContent = 'Start over'; }, 4000); }
      else { resetArmed = false; S = fresh(); try { localStorage.removeItem(STORE); } catch (x) { /* ignore */ } gateCache = null; render(true); t.textContent = 'Start over'; }
    }
    else if (act === 'td-examples') { S.testNames = D.SAMPLE_NAMES.slice(0, 3); S.testOv = [{}, {}, {}]; S.testOk = ['', '', '']; save(); render(); }
    else if (act === 'add-topic') addTopic();
    else if (act === 'check-log') { gateCache = N.parseLog(S.logPaste); var g = $('gate'); if (g) g.innerHTML = gateHtml(); }
    else if (act === 'download') download();
    else if (act === 'copy-instr') {
      var ins = PKG.filter(function (f) { return f.path === 'core/agent-instructions.md'; })[0];
      copyText(ins.content, function (ok) { setMsg(ok ? 'Copied. Paste it into your project instructions.' : 'Copy was blocked here. Open the file below, select the text and copy it.'); });
    }
    else if (act === 'copy-overnight') {
      var r = gateCache || { renamed: 0, days: 0 };
      copyText('Set up overnight renaming. My rename log shows ' + r.renamed + ' renames across ' + r.days + ' days. Confirm the folder and the schedule with me before you start, and tell me honestly whether this connection supports scheduled tasks.', function (ok) { t.textContent = ok ? 'Copied' : 'Copy was blocked here'; });
    }
    else if (t.hasAttribute('data-copy')) {
      var f = PKG[+t.getAttribute('data-copy')];
      copyText(f.content, function (ok) { t.textContent = ok ? 'Copied' : 'Copy was blocked here. Select the text below.'; });
    }
    else if (t.hasAttribute('data-td-ok')) {
      var p = t.getAttribute('data-td-ok').split('|'); S.testOk[+p[0]] = p[1]; save(); $('tdResults').innerHTML = tdAll();
    }
    else if (t.hasAttribute('data-td-usetopic')) {
      var q2 = t.getAttribute('data-td-usetopic').split('|'), ix = +q2[0]; S.testOv[ix].topic = q2[1]; S.testOk[ix] = 'tweak'; save(); $('tdResults').innerHTML = tdAll();
    }
  });

  /* ---------- boot ---------- */
  function browserSave(o) {
    return new Promise(function (resolve, reject) {
      try {
        var url = URL.createObjectURL(o.data), a = document.createElement('a');
        a.href = url; a.download = o.filename; a.style.display = 'none';
        document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
        resolve();
      } catch (err) { reject(err); }
    });
  }
  function initDownloads() {
    var fallback = function () { DL = { save: browserSave }; DLChecked = true; updateDlBtn(); };
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        window.claude.use('downloads').then(function (d) { if (d) { DL = d; DLChecked = true; updateDlBtn(); } else fallback(); }, fallback);
      } else { fallback(); }
    } catch (e) { fallback(); }
  }
  function start(data) {
    S = (data && data.types) ? merge(data) : (load() || fresh());
    render(false); initDownloads();
  }
  var hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === 'function') hot.snapshot(function () { return S; });
  if (hot && typeof hot.ready === 'function') hot.ready(start); else start((hot && hot.data) || {});

  window.__ren = { state: function () { return S; }, pkg: function () { return PKG; }, go: go, render: render };
})();
