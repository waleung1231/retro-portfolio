/* Recruiter view: renders the whole portfolio from window.CONTENT (js/desk/content.js) as one plain page. */
(function () {
  'use strict';

  var C = window.CONTENT;
  if (!C) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Only allow http(s) and relative links into href attributes.
  function safeUrl(u) {
    var s = String(u || '').trim();
    if (/^(https?:)?\/\//i.test(s) || !/^[a-z][a-z0-9+.-]*:/i.test(s)) return esc(s);
    return '#';
  }

  function ext(url, text, cls) {
    return '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + safeUrl(url) +
      '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
  }

  function $(id) { return document.getElementById(id); }

  // ---- Header ----
  $('name').textContent = C.name || '';
  $('contact-links').innerHTML = (C.contact || []).map(function (c) {
    return '<li>' + ext(c.url, esc(c.label)) + '</li>';
  }).join('');

  // ---- About ----
  var about = C.about || {};
  $('about-body').innerHTML = (about.paragraphs || []).map(function (p) {
    return '<p>' + esc(p) + '</p>';
  }).join('');
  $('edu-list').innerHTML = (about.education || []).map(function (e) {
    return '<li><strong>' + esc(e.school) + '</strong><span>' + esc(e.what) +
      '</span><span class="muted">' + esc(e.when) + '</span></li>';
  }).join('');
  $('skills').innerHTML = (about.skills || []).map(function (s) {
    return '<li class="chip">' + esc(s) + '</li>';
  }).join('');

  // ---- Experience ----
  $('jobs').innerHTML = (C.experience || []).map(function (x) {
    var pts = (x.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
    return '<li class="job">' +
      '<div class="job-head">' +
        '<h3>' + esc(x.role) + ' <span class="at">· ' + esc(x.org) + '</span></h3>' +
        '<p class="when">' + esc(x.when) + '</p>' +
      '</div>' +
      (x.where ? '<p class="where">' + esc(x.where) + '</p>' : '') +
      (x.text ? '<p class="job-text">' + esc(x.text) + '</p>' : '') +
      (pts ? '<ul class="points">' + pts + '</ul>' : '') +
      (x.url ? '<p class="job-link">' + ext(x.url, 'related link ↗', 'more') + '</p>' : '') +
      '</li>';
  }).join('');

  // ---- Projects ----
  var projects = C.projects || [];
  var topics = (C.topics || []).filter(function (t) {
    return t.id === 'all' ? projects.length > 0 : projects.some(function (p) {
      return (p.topics || []).indexOf(t.id) !== -1;
    });
  });
  if (!topics.some(function (t) { return t.id === 'all'; })) {
    topics.unshift({ id: 'all', title: 'all projects', color: '#6f9be8' });
  } else {
    // make sure 'all' is first
    topics.sort(function (a, b) { return (a.id === 'all' ? -1 : 0) - (b.id === 'all' ? -1 : 0); });
  }
  var topicById = {};
  topics.forEach(function (t) { topicById[t.id] = t; });

  function inTopic(p, id) {
    return id === 'all' || (p.topics || []).indexOf(id) !== -1;
  }
  function count(id) {
    return projects.filter(function (p) { return inTopic(p, id); }).length;
  }

  $('filters').innerHTML = topics.map(function (t) {
    return '<button type="button" class="chip filter" data-topic="' + esc(t.id) +
      '" aria-pressed="false" style="--dot:' + esc(t.color || '#6f9be8') + '">' +
      '<span class="dot" aria-hidden="true"></span>' + esc(t.title) +
      ' <span class="count">' + count(t.id) + '</span></button>';
  }).join('');

  $('cards').innerHTML = projects.map(function (p) {
    var tnames = (p.topics || []).filter(function (id) { return topicById[id]; })
      .map(function (id) { return esc(topicById[id].title); }).join(' · ');
    var tags = (p.tags || []).map(function (t) { return '<li class="tag">' + esc(t) + '</li>'; }).join('');
    return '<li class="card" data-id="' + esc(p.id) + '" style="--accent:' + esc(p.color || '#5f86de') + '">' +
      '<h3>' + esc(p.title) + '</h3>' +
      (tnames ? '<p class="card-topics">' + tnames + '</p>' : '') +
      '<p class="blurb">' + esc(p.blurb) + '</p>' +
      (tags ? '<ul class="tags" aria-label="Tools">' + tags + '</ul>' : '') +
      (p.url ? '<p class="card-link">' + ext(p.url, 'view project ↗', 'more') + '</p>' : '') +
      '</li>';
  }).join('');

  var cardEls = Array.prototype.slice.call(document.querySelectorAll('#cards .card'));
  var chipEls = Array.prototype.slice.call(document.querySelectorAll('#filters .filter'));

  function select(id, updateHash) {
    if (!topicById[id]) id = 'all';
    chipEls.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-topic') === id ? 'true' : 'false');
    });
    cardEls.forEach(function (el, i) {
      el.hidden = !inTopic(projects[i], id);
    });
    $('filter-status').textContent = 'Showing ' + count(id) + ' project' + (count(id) === 1 ? '' : 's') +
      (id === 'all' ? '' : ' in ' + topicById[id].title);
    if (updateHash) {
      var url = location.pathname + location.search + (id === 'all' ? '' : '#' + id);
      try { history.replaceState(null, '', url); } catch (e) { location.hash = id === 'all' ? '' : id; }
    }
  }

  $('filters').addEventListener('click', function (e) {
    var b = e.target.closest('.filter');
    if (b) select(b.getAttribute('data-topic'), true);
  });

  function fromHash() {
    var h = decodeURIComponent((location.hash || '').slice(1));
    select(topicById[h] ? h : 'all', false);
    return !!topicById[h] && h !== 'all';
  }
  window.addEventListener('hashchange', fromHash);
  if (fromHash()) {
    // Deep link to a topic: bring the projects section into view.
    $('projects').scrollIntoView();
  }
})();
