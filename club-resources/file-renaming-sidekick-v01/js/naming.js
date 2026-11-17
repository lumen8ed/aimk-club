/* naming.js: the naming engine used by the live name lab, the test drive and the package builder. */
(function (g) {
  'use strict';
  var D = g.RenData;

  function slug(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function pad(n) { n = parseInt(n, 10) || 0; return (n < 10 ? '0' : '') + n; }

  var FILLER = { the: 1, a: 1, an: 1, of: 1, and: 1, 'for': 1, to: 1, 'with': 1, 'in': 1, on: 1, my: 1, your: 1 };
  function shortenOne(t) {
    var w = slug(t).split('-').filter(Boolean);
    if (w.length <= 4) return w.join('-');
    var k = w.filter(function (x) { return !FILLER[x]; });
    return k.slice(0, 5).join('-');
  }
  function titleOut(S, t) {
    var segs = String(t || '').split('--');
    return segs.map(function (x) { return S.length === 'long' ? shortenOne(x) : slug(x); }).filter(Boolean).join('--');
  }

  /* A client may teach the agent their own word for a type. "prompts" belongs to ai-prompts only. */
  function validateWord(key, raw) {
    var w = slug(raw);
    if (!w) return { ok: true, word: '' };
    if (/(^|-)prompts?(-|$)/.test(w) && key !== 'ai-prompts') {
      return { ok: false, word: '', msg: 'The word "prompts" is reserved for the AI prompts type. Try "questions" or another word.' };
    }
    if (w.length > 30) return { ok: false, word: '', msg: 'Keep it under 30 characters.' };
    return { ok: true, word: w };
  }
  function typeWord(S, key) {
    var t = S.types && S.types[key];
    var v = t && validateWord(key, t.word);
    return (v && v.ok && v.word) ? v.word : key;
  }
  function sourceList(S) {
    var out = [];
    (S.recSources || []).forEach(function (k) {
      if (k === 'other') { var o = slug(S.recOther); if (o) out.push(o); }
      else out.push(k);
    });
    return out;
  }
  function datePlace(S, key) {
    var o = S.dateOverride && S.dateOverride[key];
    if (o && o !== 'default') return o;
    var T = D.TYPE[key];
    if (T && T.dateFirst) return 'front';
    return S.order === 'none' ? 'none' : (S.order === 'end' ? 'end' : 'front');
  }

  /* item: {key, source, topic, title, author, date, version, final, copy, city, needDate} */
  function buildParts(S, it) {
    var T = D.TYPE[it.key] || { key: it.key };
    var parts = [];
    var place = datePlace(S, it.key);
    var showDate = function (pos) {
      if (place !== pos) return;
      if (it.date) parts.push({ k: 'date', t: it.date });
      else if (it.needDate) parts.push({ k: 'date', t: 'yyyy-mm-dd', q: true });
    };
    showDate('front');
    parts.push({ k: 'type', t: typeWord(S, it.key) });
    if (it.key === 'recording') {
      if (it.source) parts.push({ k: 'source', t: it.source });
      else if (it.needSource) parts.push({ k: 'source', t: 'source', q: true });
    }
    var topicOn = S.pieces.topic || T.dateFirst;
    if (topicOn) {
      if (!it.topic) parts.push({ k: 'topic', t: 'topic', q: true });
      else parts.push({ k: 'topic', t: slug(it.topic) + (S.city === 'yes' && T.dateFirst && it.city ? '-' + slug(it.city) : '') });
    }
    var title = titleOut(S, it.title);
    parts.push(title ? { k: 'title', t: title } : { k: 'title', t: 'title', q: true });
    if (S.pieces.detail && it.author) parts.push({ k: 'author', t: slug(it.author) });
    showDate('end');
    if (it.version) {
      parts.push({ k: 'version', t: 'v' + pad(it.version) });
      if (S.final === 'yes' && it.final) parts.push({ k: 'final', t: 'final' });
    }
    if (it.copy) parts.push({ k: 'copy', t: 'copy-' + pad(it.copy) });
    return parts;
  }
  function partsToName(parts, ext) {
    return parts.map(function (p) { return p.t; }).join('--') + (ext ? '.' + ext : '');
  }

  /* The "anri-average" file used in the order question. */
  function anriParts(S, order) {
    var o = order || S.order, p = [];
    if (o === 'front') p.push({ k: 'date', t: '2026-02-14' });
    p.push({ k: 'type', t: 'transcript' });
    if (S.pieces.topic) p.push({ k: 'topic', t: 'ai-master-key-accelerator' });
    p.push({ k: 'title', t: 'lesson-2' });
    if (S.pieces.detail) p.push({ k: 'detail', t: 'extraction' });
    if (o === 'end') p.push({ k: 'date', t: '2026-02-14' });
    return p;
  }

  function sampleItem(S, key, withVersion) {
    var T = D.TYPE[key];
    var it = { key: key, topic: T.topic, title: T.title, author: T.author, date: '2026-02-14', ext: T.ext, city: 'atlanta' };
    if (key === 'recording') it.source = sourceList(S)[0] || 'zoom';
    if (withVersion) { it.version = 3; it.final = true; }
    return it;
  }

  /* The field order as a pattern string, for the registry and the agent instructions. */
  function patternString(S) {
    var place = S.order === 'none' ? 'none' : (S.order === 'end' ? 'end' : 'front');
    var out = '';
    function add(piece, optional) {
      if (!out) { out = piece; return; }
      out += optional ? '[--' + piece + ']' : '--' + piece;
    }
    if (place === 'front') add('<yyyy-mm-dd>');
    add('<type>');
    if (S.pieces.topic) add('<topic>');
    add('<title of the actual document>');
    if (S.pieces.detail) add('<author or label when the document names one>', true);
    if (place === 'end') add('<yyyy-mm-dd>');
    out += S.final === 'yes' ? '[--<vNN>[--final]]' : '[--<vNN>]';
    out += '[--copy-NN].<extension>';
    return out;
  }

  /* ---- Test drive: a name-only preview. The real agent reads inside each file. ---- */
  function iso(y, m, d) {
    y = +y; m = +m; d = +d;
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
    return y + '-' + pad(m) + '-' + pad(d);
  }
  var JUNK = /\b(new|latest|old|untitled|wip|draft|final|copy)\b/g;

  function parseOld(raw, S, ov) {
    ov = ov || {};
    var s = String(raw || '').trim();
    if (!s) return null;
    var m = s.match(/^(.*?)(?:\.([A-Za-z0-9]{1,5}))?$/);
    var stem = m[1], ext = (m[2] || '').toLowerCase();
    var work = stem.toLowerCase().replace(/_/g, ' ');
    var flags = [], need = [], mm;

    var date = null;
    if ((mm = work.match(/(\d{4})[-.\/ ](\d{1,2})[-.\/ ](\d{1,2})/))) {
      date = iso(mm[1], mm[2], mm[3]); if (date) work = work.replace(mm[0], ' ');
    }
    if (!date && (mm = work.match(/(?:^|[^0-9])((?:19|20)\d{2})(\d{2})(\d{2})(?:[^0-9]|$)/))) {
      date = iso(mm[1], mm[2], mm[3]); if (date) work = work.replace(mm[1] + mm[2] + mm[3], ' ');
    }
    if (!date && (mm = work.match(/(\d{1,2})[-.\/](\d{1,2})[-.\/]((?:19|20)\d{2})/))) {
      var a = +mm[1], b = +mm[2], mo = a, dy = b;
      if (a > 12) { mo = b; dy = a; } else { flags.push('read as month-day-year'); }
      date = iso(mm[3], mo, dy); if (date) work = work.replace(mm[0], ' ');
    }

    var copy = null;
    if ((mm = work.match(/\((\d{1,2})\)\s*$/))) { copy = (+mm[1]) + 1; work = work.replace(mm[0], ' '); }
    else if ((mm = work.match(/(?:^|[\s-])copy(?: of)?(?:[\s-]*(\d{1,2}))?(?=$|[\s-])/))) { copy = mm[1] ? +mm[1] : 2; work = work.replace(mm[0], ' '); }

    var ver = null, fin = false;
    if (/\bfinal\b/.test(work)) {
      fin = true;
      var fm = work.match(/\bfinal\b[\s-]*v?(\d{1,2})\b/);
      if (fm) { ver = +fm[1]; work = work.replace(fm[0], ' '); } else { work = work.replace(/\bfinal\b/, ' '); }
    }
    if ((mm = work.match(/\bv(?:ersion)?[\s.-]*(\d{1,2})\b/))) { ver = +mm[1]; work = work.replace(mm[0], ' '); }
    if (fin && ver == null) { need.push('version'); fin = false; }
    work = work.replace(JUNK, ' ');

    var tok = ' ' + work.replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
    var key = ov.key || null;
    if (!key) {
      outer: for (var i = 0; i < D.DETECT_ORDER.length; i++) {
        var k = D.DETECT_ORDER[i], kws = D.TYPE[k].kw;
        for (var j = 0; j < kws.length; j++) {
          if (tok.indexOf(' ' + kws[j].replace(/-/g, ' ') + ' ') > -1) { key = k; break outer; }
        }
      }
      if (!key && /(^| )(img|dsc|pxl|pict)\d/.test(tok)) key = 'photo';
      if (!key) {
        if (/^(mp3|m4a|wav|aac|aiff)$/.test(ext)) key = 'audio';
        else if (/^(mp4|mov|webm|m4v)$/.test(ext)) { key = 'recording'; flags.push('video file: recording or video clip?'); }
        else if (/^(webloc|url)$/.test(ext)) key = 'link';
        else if (/^(png|jpe?g|heic|gif|webp)$/.test(ext)) { key = /screen/.test(work) ? 'screenshot' : 'photo'; flags.push('image: please confirm the kind'); }
      }
    }
    if (!key) need.push('type');

    var source = null, needSource = false;
    if (key === 'recording') {
      var srcs = sourceList(S);
      if (/zoom/.test(stem.toLowerCase())) source = 'zoom';
      else if (/screen/.test(stem.toLowerCase())) source = 'screen-capture';
      else if (srcs.length === 1) source = srcs[0];
      else { needSource = true; need.push('source'); }
    }

    var topic = ov.topic != null && ov.topic !== '' ? slug(ov.topic) : null;
    if (!topic) {
      var cands = (S.topics || []).concat(D.ALL_TOPICS);
      for (var c = 0; c < cands.length; c++) {
        if (tok.indexOf(' ' + cands[c].replace(/-/g, ' ') + ' ') > -1) { topic = cands[c]; break; }
      }
    }
    var T = key ? D.TYPE[key] : null;
    if (T && T.dateFirst && !topic) topic = null;
    if (!topic && (S.pieces.topic || (T && T.dateFirst))) need.push('topic');

    var titleWords = tok.trim().split(' ').filter(function (w) { return w && !/^\d{1,2}$/.test(w) || /^\d{2,}$/.test(w); });
    var title = titleWords.slice(0, 12).join('-');
    var place = key ? datePlace(S, key) : (S.order === 'none' ? 'none' : S.order);
    if (!date && place !== 'none' && key) need.push('date');

    var item = { key: key || 'guide', source: source, needSource: needSource, topic: topic, title: title, date: date, needDate: !date && place !== 'none', version: ver, final: fin, copy: copy };
    var parts = buildParts(S, item);
    if (!key) {
      parts = parts.map(function (p) { return p.k === 'type' ? { k: 'type', t: 'type', q: true } : p; });
    }
    return { raw: s, ext: ext, key: key, flags: flags, need: need, item: item, parts: parts, name: partsToName(parts, ext) };
  }

  function searchHits(name, input) {
    var toks = name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    var lower = name.toLowerCase();
    var words = String(input || '').toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; });
    return words.map(function (w) { return { w: w, hit: toks.indexOf(w) > -1 || (w.length > 3 && lower.indexOf(w) > -1) }; });
  }

  /* ---- Rename-log gate for overnight mode ---- */
  function parseLog(text) {
    var renamed = 0, first = null, last = null;
    String(text || '').split(/\r?\n/).forEach(function (line) {
      if (line.charAt(0) !== '|' && line.replace(/^\s+/, '').charAt(0) !== '|') return;
      var cells = line.split('|').map(function (c) { return c.trim(); });
      var dm = null, status = false;
      cells.forEach(function (c) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(c) && !dm) dm = c;
        if (/^renamed$/i.test(c)) status = true;
      });
      if (dm && status) {
        renamed++;
        var t = Date.UTC(+dm.slice(0, 4), +dm.slice(5, 7) - 1, +dm.slice(8, 10));
        if (first === null || t < first) first = t;
        if (last === null || t > last) last = t;
      }
    });
    var days = (first !== null) ? Math.floor((last - first) / 86400000) : 0;
    return { renamed: renamed, days: days, unlocked: renamed >= 100 && days >= 7 };
  }

  g.Naming = {
    slug: slug, pad: pad, validateWord: validateWord, typeWord: typeWord, sourceList: sourceList, datePlace: datePlace,
    buildParts: buildParts, partsToName: partsToName, anriParts: anriParts, sampleItem: sampleItem,
    patternString: patternString, parseOld: parseOld, searchHits: searchHits, parseLog: parseLog, titleOut: titleOut
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
