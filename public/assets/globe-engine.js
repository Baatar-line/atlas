/* Framework-agnostic Three.js globe engine — plain-JS port of the handoff.
   Expects THREE, d3 (d3-geo), and topojson on window (loaded via CDN in <helmet>).
   Accent recolored from neon #b9ff3b to the app's green #8FD14F.
   Exposes window.GlobeEngine and window.GLOBE_COUNTRIES / window.resolveCountry. */
(function () {
  var ACCENT = "#E8B84B";
  var ACCENT_RGB = "232,184,75";
  var YELLOW = "#050505";
  var YELLOW_RGB = "5,5,5";

  var HOME_VIEW = { latitude: 46.8, longitude: 103.8 }; // Mongolia

  var countries = [
    { id: "mn", name: "Mongolia", latitude: 46.8, longitude: 103.8, region: "Central Asia",
      description: "Endless steppe, the Gobi Desert and a living nomadic culture — the heart of the Atlas archive.",
      categories: ["nature", "culture", "history"], media: ["read", "listen"], pinColor: ACCENT },
    { id: "us", name: "United States of America", latitude: 39, longitude: -98, region: "North America",
      description: "A sprawling federation of stories — jazz archives, oral histories of migration, and civil-rights recordings held in city libraries.",
      categories: ["culture", "audio", "history"], media: ["read", "listen"], pinColor: ACCENT },
    { id: "br", name: "Brazil", latitude: -10, longitude: -52, region: "South America",
      description: "Sound-rich cultural memory: samba lineages, Amazonian field recordings, and interviews with keepers of Afro-Brazilian tradition.",
      categories: ["audio", "culture", "interview"], media: ["listen", "watch"], pinColor: ACCENT },
    { id: "fr", name: "France", latitude: 47, longitude: 2, region: "Western Europe",
      description: "Cinema, resistance letters, and museum voice-archives — an editorial vault of the written and the spoken.",
      categories: ["video", "history", "memory"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "eg", name: "Egypt", latitude: 27, longitude: 30, region: "North Africa",
      description: "Millennia layered in stone and script — from papyrus fragments to recorded interviews with Nile-delta artisans.",
      categories: ["history", "culture", "memory"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "jp", name: "Japan", latitude: 37, longitude: 138, region: "East Asia",
      description: "Craft, sound design and preserved oral folklore — a quiet archive of process, patience and place.",
      categories: ["culture", "audio", "video"], media: ["watch", "listen"], pinColor: ACCENT },
    { id: "in", name: "India", latitude: 22, longitude: 79, region: "South Asia",
      description: "A polyphonic archive: regional languages, ragas, and human-rights testimony gathered across states.",
      categories: ["audio", "human rights", "interview"], media: ["listen", "read"], pinColor: ACCENT },
    { id: "za", name: "South Africa", latitude: -29, longitude: 24, region: "Southern Africa",
      description: "Testimony and reconciliation — recorded interviews, protest photography and the memory of a changed nation.",
      categories: ["human rights", "interview", "history"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "au", name: "Australia", latitude: -25, longitude: 134, region: "Oceania",
      description: "Deep-time custodial knowledge and travel narratives spanning coast, desert and the songlines between.",
      categories: ["travel", "culture", "audio"], media: ["listen", "watch"], pinColor: ACCENT },
    { id: "is", name: "Iceland", latitude: 65, longitude: -18, region: "Northern Europe",
      description: "Sagas, field recordings of ice and geothermal landscape, and a small nation's outsized literary memory.",
      categories: ["travel", "audio", "memory"], media: ["read", "listen"], pinColor: ACCENT },
    { id: "ma", name: "Morocco", latitude: 32, longitude: -6, region: "North Africa",
      description: "Medina soundscapes, oral poetry and the layered memory of trade routes between sea and Sahara.",
      categories: ["culture", "travel", "audio"], media: ["listen", "read"], pinColor: ACCENT },
    { id: "mx", name: "Mexico", latitude: 23, longitude: -102, region: "North America",
      description: "Muralist history, radio testimonies and the vivid memory-keeping of festival and family.",
      categories: ["culture", "video", "memory"], media: ["watch", "read"], pinColor: ACCENT },
    { id: "de", name: "Germany", latitude: 51, longitude: 10, region: "Central Europe",
      description: "A rigorous public archive: reunification interviews, film, and the documented memory of a divided century.",
      categories: ["history", "interview", "video"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "ke", name: "Kenya", latitude: 0, longitude: 38, region: "East Africa",
      description: "Community radio, wildlife field audio and oral histories collected along the Rift.",
      categories: ["audio", "travel", "interview"], media: ["listen", "watch"], pinColor: ACCENT },
    { id: "pe", name: "Peru", latitude: -10, longitude: -76, region: "South America",
      description: "Andean sound, textile memory and highland travel accounts recorded village by village.",
      categories: ["travel", "culture", "audio"], media: ["listen", "read"], pinColor: ACCENT }
  ];

  var countryByName = {};
  countries.forEach(function (c) { countryByName[c.name] = c; });

  function resolveCountry(name) {
    if (countryByName[name]) return countryByName[name];
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"), name: name, latitude: 0, longitude: 0,
      region: "Archive",
      description: "Stories, audio and memory gathered from across " + name + " — an open archive of voices, images and place.",
      categories: ["culture", "memory", "audio"], media: ["read", "listen"], pinColor: ACCENT
    };
  }

  var ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  /* ── Mongol Empire era overlays ────────────────────────────────────────────
     One entry per date on the /globe timeline.

     What is actually drawn for these years now comes from empires.json (see
     scripts/build-empires.mjs, which assembles each year out of the historical
     borders of the states the empire held then). The rings kept here are the
     fallback for the seconds before that file lands, and for a visitor whose
     fetch of it fails — a stylized convex outline of the same territory, a few
     dozen vertices each, which is what these years looked like before the real
     geometry existed. `focus`/`zoom` are used the same way, as the camera
     framing until the file's own framing replaces it.

     `dashed` parts are campaign reach rather than held territory (1241's push
     into Poland/Hungary was raided and withdrawn from, not administered), and
     `label` is only set where one era shows several distinct states at once —
     1260's four khanates — since every other year's caption is in the UI. */
  var ERA_GOLD = "#E8B84B", ERA_BLUE = "#6FA8DC", ERA_GREEN = "#8FD14F", ERA_CLAY = "#D9705A";

  var MONGOL_ERAS = [
    { year: 1206, focus: [47, 104], zoom: 2.9, parts: [
      { color: ERA_GOLD, ring: [[88,50],[92,52],[98,53],[104,53.5],[110,52.5],[116,50],[119,49],[120,47],[117,44],[112,42.5],[105,41.5],[98,42.5],[92,44.5],[88,46],[86,48]] }
    ] },
    { year: 1227, focus: [43, 88], zoom: 3.1, parts: [
      { color: ERA_GOLD, ring: [[46,48],[48,52],[54,56],[62,58],[70,59],[80,59],[90,58],[100,56],[108,54],[116,52],[122,49],[126,46],[124,43],[120,41],[118,38.5],[114,36.5],[110,35],[105,34.5],[100,36],[95,38],[90,38.5],[85,40],[80,39],[74,37],[68,35],[62,34],[57,35.5],[54,37.5],[52,40],[49,44]] }
    ] },
    { year: 1241, focus: [45, 72], zoom: 3.35, parts: [
      { color: ERA_GOLD, ring: [[29,51],[33,55],[39,57],[46,58],[54,58],[62,57],[70,58],[78,58],[86,57],[94,56],[102,55],[110,53],[118,51],[124,49],[127,46],[125,43],[121,41],[118,38.5],[114,36.5],[110,35],[105,34.5],[100,36],[95,38],[88,38],[82,38],[76,36.5],[70,35],[64,34],[58,35],[54,37],[50,40],[47,43],[44,45.5],[38,46],[33,47],[30,48]] },
      { color: ERA_GOLD, alpha: 0.16, dashed: true, ring: [[16,51.5],[21,53],[26,53.5],[27,50],[25,47],[21,46],[17,48]] }
    ] },
    { year: 1260, focus: [43, 70], zoom: 3.45, parts: [
      { color: ERA_GOLD, label: "YUAN", at: [43, 108], ring: [[85,49],[92,52],[100,54],[110,53],[118,52],[126,50],[132,48],[134,45],[130,42],[126,40],[122,38.5],[118,37],[112,35.5],[106,34],[100,33],[94,32],[88,32.5],[82,33.5],[79,35],[80,38],[82,42],[83,46]] },
      { color: ERA_BLUE, label: "ALTAN ORD", at: [52, 45], ring: [[26,48],[28,52],[33,56],[38,58],[45,58],[52,57],[58,55],[64,53],[70,51],[73,48],[70,46],[64,45],[58,45],[52,45.5],[48,46.5],[45,44.5],[40,44],[36,45],[32,45.5],[28,46]] },
      { color: ERA_GREEN, label: "TSAGADAI", at: [43, 68], ring: [[52,44],[58,47],[64,49],[70,50],[76,49],[82,47],[85,44],[84,40],[80,37],[74,36],[68,35.5],[62,37],[57,39],[53,41]] },
      { color: ERA_CLAY, label: "IL KHAN", at: [32, 52], ring: [[36,40],[42,42],[46,44],[50,44],[55,43],[60,41],[65,38],[68,35],[69,32],[66,29],[61,26],[56,26.5],[50,29],[46,30],[43,33],[40,36],[36,37],[32,38],[28,39],[27,41],[31,41.5]] }
    ] },
    { year: 1279, focus: [40, 78], zoom: 3.5, parts: [
      { color: ERA_GOLD, ring: [[22,49],[28,53],[34,57],[40,59],[48,58],[56,57],[64,56],[72,56],[80,56],[88,55],[96,54],[105,53],[114,52],[122,50],[130,49],[134,47],[132,44],[128,42],[124,40],[122,37],[121,33],[120,30],[119,26],[116,23],[112,21.5],[108,21],[104,22.5],[100,24],[98,26],[95,28],[91,28],[86,28.5],[81,30],[78,32],[74,33],[70,32],[68,29],[64,26],[58,26.5],[52,29],[47,30],[44,33],[40,36],[35,37],[30,38],[27,40],[28,43],[26,45],[22,47]] }
    ] },
    // 1368 — the Yuan lose China and fall back on the steppe, keeping Manchuria
    // and with it the last coastline a Mongol state ever held. The fallback
    // ring is the whole territory; only empires.json splits the sea band out.
    { year: 1368, focus: [47, 115], zoom: 3.0, parts: [
      { color: ERA_GOLD, ring: [[88,50],[95,53],[103,54],[112,53],[120,52],[128,51],[136,50],[141,49],[139,46],[133,44],[128,42],[124,41],[119,40.5],[112,41],[104,41],[96,42],[90,44],[86,47]] }
    ] }
  ];

  // Straight lat/lng edges are what the equirectangular texture wants, but
  // d3.geoPath resamples long segments along great circles, which bows a
  // 20°-wide edge visibly poleward. Splitting each edge into ~2° steps first
  // leaves nothing for that resampling to bend.
  function densifyRing(ring, step) {
    step = step || 2;
    var out = [];
    for (var i = 0; i < ring.length; i++) {
      var a = ring[i], b = ring[(i + 1) % ring.length];
      var n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / step));
      for (var s = 0; s < n; s++) out.push([a[0] + (b[0] - a[0]) * (s / n), a[1] + (b[1] - a[1]) * (s / n)]);
    }
    out.push(out[0].slice());
    return out;
  }

  // d3 treats polygons as spherical, so a ring wound the wrong way fills the
  // whole planet *except* the empire. Cheaper to detect than to hand-verify
  // the winding of every ring above: anything covering more than a hemisphere
  // was meant to be its own complement.
  function eraPolygon(ring) {
    var geo = { type: "Polygon", coordinates: [densifyRing(ring)] };
    if (d3.geoArea(geo) > 2 * Math.PI) geo.coordinates = [geo.coordinates[0].slice().reverse()];
    return geo;
  }

  /* The ten largest empires in history — real historical borders, unlike the
     hand-drawn Mongol timeline above. Built by scripts/build-empires.mjs from
     github.com/aourednik/historical-basemaps into a ~60 KB file, fetched the
     first time one of the buttons is pressed rather than on page load: most
     visits to the globe never open the timeline at all. */
  var EMPIRES_URL = "/assets/empires.json?v=5";   // bump with the file — see app/layout.tsx on why
  var empireData = null;
  var eraData = null;
  var empirePending = null;

  function loadEmpires() {
    if (empireData) return Promise.resolve(empireData);
    if (!empirePending) {
      empirePending = fetch(EMPIRES_URL).then(function (r) {
        if (!r.ok) throw new Error("empires.json: HTTP " + r.status);
        return r.json();
      }).then(function (j) { empireData = j.empires || {}; eraData = j.eras || {}; return empireData; })
        .catch(function (err) { empirePending = null; throw err; });
    }
    return empirePending;
  }

  /* ── Lands still unknown to the Old World ─────────────────────────────────
     When one empire is on the globe, everything that had not yet been reached
     from Afro-Eurasia at that empire's peak is washed out: pick the Mongol
     Empire and the Americas, Australia and Antarctica go dark, because nobody
     in Karakorum in 1279 knew they were there.

     Dates are first contact *from the Old World*, which is the perspective the
     empires on this globe are drawn from — these places were of course long
     inhabited, and several were settled thousands of years earlier. The named
     ones are listed rather than derived, since a rule over coordinates puts
     Indonesia (known and traded with for centuries) in the same bucket as its
     neighbour New Guinea (sighted 1526). */
  var CONTACT_YEAR = {
    "Antarctica": 1820,
    "Australia": 1606,
    "New Zealand": 1642,
    "Papua New Guinea": 1526,
    "Solomon Is.": 1568,
    "Vanuatu": 1606,
    "New Caledonia": 1774,
    "Fiji": 1643,
    // Reached from Europe long before Columbus, so they are never washed out
    // with the rest of the western hemisphere.
    "Greenland": 986,
    "Iceland": 874
  };

  // The Americas, by longitude — every remaining feature west of 25°W.
  function contactYearOf(f) {
    var name = f.properties.name;
    if (CONTACT_YEAR[name] !== undefined) return CONTACT_YEAR[name];
    var c;
    try { c = d3.geoCentroid(f); } catch (e) { return -Infinity; }
    if (c[0] < -25) return 1492;
    return -Infinity;
  }

  function eraFor(year) {
    for (var i = 0; i < MONGOL_ERAS.length; i++) if (MONGOL_ERAS[i].year === year) return MONGOL_ERAS[i];
    return null;
  }

  function GlobeEngine(mount, cb) {
    this.mount = mount;
    this.cb = cb || {};
    this.isMobile = window.innerWidth < 820;
    this.raycaster = new THREE.Raycaster();
    this.features = [];
    // Ultra-wide desktop displays have much more canvas around the archive
    // panels. Pull the camera back there so the globe keeps the same visual
    // proportion it has on a notebook instead of swallowing the side cards.
    this.targetZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    this.lastInteract = 0;
    this.lastHoverT = 0;
    this.raf = 0;
    this.alive = false;
    this._disposed = false;
    this.selName = null;
    this.selLL = null;
    this.hovName = null;
    this.filter = null;
    this.pins = [];
    this.archiveSites = {};
    this.archiveDots = [];
    this.activeSite = null;
    this.flagImg = null;
    this.flagReady = false;
    this.empireYear = null;
    this.empireSel = [];
    this.undiscoveredYear = null;
    this._cleanupPointer = function () {};
  }

  // Admin-uploaded real flag photo/graphic for Mongolia — once loaded, buildTexture
  // draws it in place of the procedural Soyombo. Safe to call before or after init().
  GlobeEngine.prototype.setMongoliaFlag = function (url) {
    var self = this;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      self.flagImg = img;
      self.flagReady = true;
      self._texDirty = true;
    };
    img.onerror = function () { self.flagReady = false; };
    img.src = url;
  };

  GlobeEngine.prototype.init = function () {
    var self = this;
    return fetch(ATLAS_URL).then(function (r) { return r.json(); }).then(function (topo) {
      // dispose() (component unmounted — e.g. navigating away from /globe
      // and back before this fetch finished) sets `alive` false, but nothing
      // stopped this resolved callback from stomping it back to true and
      // building a *second* full Three.js scene + pin set into the same
      // mount element — the two independent instances then rendered every
      // country's badge twice, each pair a frame apart. `_disposed` isn't
      // touched anywhere else, so it survives to actually gate this.
      if (self._disposed) return;
      var fc = topojson.feature(topo, topo.objects.countries);
      self.features = fc.features.filter(function (f) { return f.properties && f.properties.name; });
      self.alive = true;
      self.initThree();
      if (self.cb.onReady) self.cb.onReady();
    });
  };

  Object.defineProperty(GlobeEngine.prototype, "countryNames", {
    get: function () { return this.features.map(function (f) { return f.properties.name; }).sort(); }
  });

  GlobeEngine.prototype.llToVec = function (lat, lng, r) {
    if (r === undefined) r = 1;
    var la = (lat * Math.PI) / 180;
    var th = (lng * Math.PI) / 180 + Math.PI;
    return new THREE.Vector3(
      -Math.cos(th) * Math.cos(la) * r,
      Math.sin(la) * r,
      Math.sin(th) * Math.cos(la) * r
    );
  };
  GlobeEngine.prototype.vecToLL = function (v) {
    var n = v.clone().normalize();
    var lat = (Math.asin(Math.max(-1, Math.min(1, n.y))) * 180) / Math.PI;
    var th = Math.atan2(n.z, -n.x);
    var lng = ((th - Math.PI) * 180) / Math.PI;
    while (lng < -180) lng += 360;
    while (lng > 180) lng -= 360;
    return [lat, lng];
  };

  GlobeEngine.prototype.featureLineGeom = function (f, r) {
    var self = this;
    var pts = [];
    var addRing = function (ring) {
      for (var i = 0; i < ring.length - 1; i++) {
        var a = ring[i], b = ring[i + 1];
        if (Math.abs(b[0] - a[0]) > 180) continue;
        var steps = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
        for (var s = 0; s < steps; s++) {
          var t0 = s / steps, t1 = (s + 1) / steps;
          var p0 = self.llToVec(a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t0, r);
          var p1 = self.llToVec(a[1] + (b[1] - a[1]) * t1, a[0] + (b[0] - a[0]) * t1, r);
          pts.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
        }
      }
    };
    var g = f.geometry;
    if (g.type === "Polygon") g.coordinates.forEach(addRing);
    else if (g.type === "MultiPolygon") g.coordinates.forEach(function (poly) { poly.forEach(addRing); });
    var geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  };

  GlobeEngine.prototype.refreshOutline = function () {
    var self = this;
    if (!this.outlineGroup) return;
    while (this.outlineGroup.children.length) {
      var c = this.outlineGroup.children.pop();
      c.geometry.dispose();
      c.material.dispose();
      this.outlineGroup.remove(c);
    }
    if (this.hovName || this.selName) { /* highlight handled by texture stroke — no floating 3D outline */ }
  };

  GlobeEngine.prototype.buildTexture = function () {
    var W = 2048, H = 1024;
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = W; this.canvas.height = H;
    }
    var ctx = this.canvas.getContext("2d");
    var proj = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    var path = d3.geoPath(proj, ctx);
    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    path(d3.geoGraticule().step([15, 15])());
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "rgba(255,255,255,.045)";
    ctx.stroke();
    for (var i = 0; i < this.features.length; i++) {
      var f = this.features[i];
      ctx.beginPath();
      path(f);
      var nm = f.properties.name;
      var isSel = this.selName && nm === this.selName;
      var isHov = this.hovName && nm === this.hovName;
      if (isSel && nm === "Mongolia" && this.flagReady && this.flagImg) {
        // real admin-uploaded flag photo, drawn to cover the country's shape
        var fb = path.bounds(f);
        var ffx = fb[0][0], ffy = fb[0][1], ffw = fb[1][0] - fb[0][0], ffh = fb[1][1] - fb[0][1];
        ctx.save();
        ctx.clip();
        var imgAr = this.flagImg.width / this.flagImg.height;
        var boxAr = ffw / ffh;
        var dw = ffw, dh = ffh, dx = ffx, dy = ffy;
        if (imgAr > boxAr) { dw = ffh * imgAr; dx = ffx - (dw - ffw) / 2; }
        else { dh = ffw / imgAr; dy = ffy - (dh - ffh) / 2; }
        ctx.drawImage(this.flagImg, dx, dy, dw, dh);
        ctx.restore();
      } else if (isSel && nm === "Mongolia") {
        // fill Mongolia's shape with the national flag
        var b = path.bounds(f);
        var fx = b[0][0], fy = b[0][1], fw = b[1][0] - b[0][0], fh = b[1][1] - b[0][1];
        var band = fw / 3;
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "#C4272E"; ctx.fillRect(fx, fy, band + 1, fh);
        ctx.fillStyle = "#015197"; ctx.fillRect(fx + band, fy, band + 1, fh);
        ctx.fillStyle = "#C4272E"; ctx.fillRect(fx + 2 * band, fy, band + 1, fh);
        // Soyombo on the hoist band
        var GOLD = "#F9CF02", RED = "#C4272E";
        var cx0 = fx + band * 0.5;
        var u = Math.min(band * 0.13, fh * 0.045);
        var y = fy + fh * 0.5 - u * 8.5;
        ctx.fillStyle = GOLD;
        // flame — three tongues
        for (var t = -1; t <= 1; t++) {
          var fxo = cx0 + t * u * 1.15;
          ctx.beginPath(); ctx.moveTo(fxo, y - u * 0.5 - (t === 0 ? u * 0.3 : 0));
          ctx.lineTo(fxo - u * 0.5, y + u * 1.9); ctx.lineTo(fxo + u * 0.5, y + u * 1.9);
          ctx.closePath(); ctx.fill();
        }
        y += u * 2.4;
        // sun
        ctx.beginPath(); ctx.arc(cx0, y + u * 0.7, u * 0.7, 0, Math.PI * 2); ctx.fill();
        y += u * 1.9;
        // moon — crescent opening upward (bite a same-size disc out, offset up
        // enough to leave a real sliver instead of shaving a thin edge off)
        ctx.beginPath(); ctx.arc(cx0, y + u * 0.75, u * 0.72, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx0, y + u * 0.32, u * 0.72, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = GOLD;
        y += u * 2.0;
        // triangle pointing down
        ctx.beginPath(); ctx.moveTo(cx0, y + u * 1.2); ctx.lineTo(cx0 - u * 2.2, y); ctx.lineTo(cx0 + u * 2.2, y); ctx.closePath(); ctx.fill();
        y += u * 1.5;
        // top bar
        ctx.fillRect(cx0 - u * 2.4, y, u * 4.8, u * 0.7); y += u * 1.2;
        // taiji — a real yin-yang S-swirl (two half-discs forming the divide,
        // each with an opposite-colour dot), not just a plain disc with dots
        var tCy = y + u * 1.1, tR = u * 1.1;
        ctx.beginPath(); ctx.arc(cx0, tCy, tR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(cx0, tCy - tR / 2, tR / 2, Math.PI * 1.5, Math.PI * 0.5, true);
        ctx.arc(cx0, tCy + tR / 2, tR / 2, Math.PI * 0.5, Math.PI * 1.5, true);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(cx0, tCy + tR / 2, tR * 0.22, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill();
        ctx.beginPath(); ctx.arc(cx0, tCy - tR / 2, tR * 0.22, 0, Math.PI * 2); ctx.fillStyle = RED; ctx.fill();
        ctx.fillStyle = GOLD;
        y += u * 2.6;
        // bottom bar
        ctx.fillRect(cx0 - u * 2.4, y, u * 4.8, u * 0.7); y += u * 1.2;
        // triangle pointing up
        ctx.beginPath(); ctx.moveTo(cx0, y); ctx.lineTo(cx0 - u * 2.2, y + u * 1.2); ctx.lineTo(cx0 + u * 2.2, y + u * 1.2); ctx.closePath(); ctx.fill();
        // vertical pillars framing the column
        var pilTop = fy + fh * 0.5 - u * 2.7, pilH = u * 8.0;
        ctx.fillRect(cx0 - u * 3.2, pilTop, u * 0.6, pilH);
        ctx.fillRect(cx0 + u * 2.6, pilTop, u * 0.6, pilH);
        ctx.restore();
      } else {
        ctx.fillStyle = isSel ? ACCENT : isHov ? "#474747" : "#303030";
        ctx.fill();
      }
      ctx.lineWidth = isSel || isHov ? 1.0 : 0.7;
      ctx.strokeStyle = isSel || isHov ? "rgba(8,8,8,.9)" : "rgba(8,8,8,.72)";
      ctx.stroke();
    }
    this.drawUndiscovered(ctx, path);
    this.drawEmpire(ctx, path);
    if (this.texture) this.texture.needsUpdate = true;
    this.refreshOutline();
  };

  // Between the country fills and the empire overlay: the wash has to cover
  // the countries it fades, and the empire has to stay bright on top of it.
  GlobeEngine.prototype.drawUndiscovered = function (ctx, path) {
    var year = this.undiscoveredYear;
    if (year === null || year === undefined || !isFinite(year)) return;
    if (!this._contactYears) {
      this._contactYears = this.features.map(contactYearOf);
    }
    ctx.save();
    for (var i = 0; i < this.features.length; i++) {
      if (year >= this._contactYears[i]) continue;
      ctx.beginPath();
      path(this.features[i]);
      // A wash rather than a flat colour: the land keeps its shape and its
      // borders, it just drops back to nearly the tone of the ocean around it.
      ctx.fillStyle = "rgba(3,3,3,.72)";
      ctx.fill();
    }
    ctx.restore();
  };

  // Painted last, on top of the country fills — the era layer is meant to read
  // as an overlay across borders that mostly didn't exist yet, so it can't be
  // interleaved with them.
  GlobeEngine.prototype.drawEmpire = function (ctx, path) {
    this.drawTopEmpire(ctx, path);
    var era = eraFor(this.empireYear);
    if (!era) return;
    ctx.save();
    // Real borders when empires.json has landed (it carries one entry per
    // timeline year, each assembled from the states the empire actually held
    // that year); the hand-drawn rings below are what's on screen for the
    // moment before it arrives, and if the fetch fails.
    var loaded = eraData && eraData[this.empireYear];
    var parts = loaded ? loaded.parts : era.parts;
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      ctx.beginPath();
      path(loaded ? part.geometry : eraPolygon(part.ring));
      ctx.globalAlpha = part.dashed ? 0.16 : 0.42;
      ctx.fillStyle = part.color;
      ctx.fill();
      ctx.globalAlpha = part.dashed ? 0.75 : 1;
      ctx.lineWidth = part.dashed ? 2 : 2.6;
      ctx.setLineDash(part.dashed ? [12, 9] : []);
      ctx.strokeStyle = part.color;
      ctx.stroke();
      ctx.setLineDash([]);
      if (part.label && part.at) {
        var p = path.projection()([part.at[1], part.at[0]]);
        ctx.globalAlpha = 0.92;
        ctx.font = "700 17px ui-monospace,SFMono-Regular,Menlo,monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(3,3,3,.85)";
        ctx.strokeText(part.label, p[0], p[1]);
        ctx.fillStyle = part.color;
        ctx.fillText(part.label, p[0], p[1]);
      }
    }
    ctx.restore();
  };

  GlobeEngine.prototype.drawTopEmpire = function (ctx, path) {
    if (!this.empireSel.length || !empireData) return;
    // Largest first, so a small empire selected alongside one that contains it
    // — Yuan inside the Mongol Empire, the Golden Horde inside it too — is
    // drawn on top instead of vanishing under it.
    var drawn = this.empireSel.filter(function (s) { return empireData[s.id]; }).slice().sort(function (a, b) {
      return (empireData[b.id].citedAreaM || 0) - (empireData[a.id].citedAreaM || 0);
    });
    if (!drawn.length) return;
    // Comparing five at once means five translucent fills stacked on the same
    // continents, so the fill lightens as the selection grows and the outline
    // carries more of the reading.
    var alpha = drawn.length > 1 ? Math.max(0.2, 0.46 - 0.05 * drawn.length) : 0.46;
    ctx.save();
    for (var i = 0; i < drawn.length; i++) {
      var emp = empireData[drawn[i].id];
      ctx.beginPath();
      path(emp.geometry);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = drawn[i].color || ACCENT;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = drawn[i].color || ACCENT;
      ctx.stroke();
    }
    ctx.restore();
  };

  // Up to five empires at once, as [{ id, color }] — an empty list clears the
  // overlay. The fetch is async, so the caller gets a promise back and the
  // texture is rebuilt when the data lands; the buttons in the UI are already
  // lit by then.
  GlobeEngine.prototype.setEmpires = function (sel) {
    var self = this;
    this.empireSel = (sel || []).slice();
    this.undiscoveredYear = null;
    this._texDirty = true;
    if (!this.empireSel.length) return Promise.resolve();
    // Same reasoning as setEmpireYear: an open country card belongs to a
    // border that has nothing to do with the empires now on screen.
    this.empireYear = null;
    var had = this.selName;
    this.selName = null;
    this.selLL = null;
    this.hovName = null;
    this.buildArchiveDots(null);
    if (had && this.cb.onSelect) this.cb.onSelect(null);
    var want = this.empireSel;
    return loadEmpires().then(function () {
      if (self.empireSel !== want) return;   // selection changed while loading
      // Only with a single empire on the globe: with several selected they
      // span different centuries, and one wash can't be true for all of them.
      var one = want.length === 1 && empireData[want[0].id];
      self.undiscoveredYear = one ? one.peakYear : null;
      self._texDirty = true;
      if (self.uprightQuat) self.targetTilt = self.uprightQuat.clone();
      self.frameEmpires();
      self.lastInteract = performance.now() + 100000;
    });
  };

  // Aims the camera at everything currently selected. Same fit as the one
  // scripts/build-empires.mjs bakes in per empire — recomputed here because a
  // selection of five has a centre and a span that no single entry knows.
  GlobeEngine.prototype.frameEmpires = function () {
    if (!empireData) return;
    var coords = [];
    for (var i = 0; i < this.empireSel.length; i++) {
      var emp = empireData[this.empireSel[i].id];
      if (emp) coords = coords.concat(emp.geometry.coordinates);
    }
    if (!coords.length) return;
    var all = { type: "MultiPolygon", coordinates: coords };
    var c = d3.geoCentroid(all);
    var r = 0;
    for (var p = 0; p < coords.length; p++) {
      for (var g = 0; g < coords[p].length; g++) {
        var ring = coords[p][g];
        for (var k = 0; k < ring.length; k++) r = Math.max(r, d3.geoDistance(c, ring[k]));
      }
    }
    r = Math.min(r, 1.45);
    var z = Math.max(2.6, Math.min(5.2, Math.max(2.7 + 0.9 * r, 1 / Math.cos(Math.min(r * 1.05, 1.4)))));
    this.targetQ = this.quatFor(c[1], c[0]);
    this.targetZ = this.isMobile ? z + 0.35 : z;
  };

  // null clears the overlay. Each era also carries its own camera framing —
  // 1206's Mongolia-sized territory and 1279's Pacific-to-Danube span can't be
  // read at the same zoom.
  GlobeEngine.prototype.setEmpireYear = function (year) {
    this.empireYear = eraFor(year) ? year : null;
    if (this.empireYear) { this.empireSel = []; this.undiscoveredYear = null; }   // the two overlays are one control, two tabs
    this._texDirty = true;
    var era = eraFor(this.empireYear);
    if (!era) return;
    // A country card open over the era view would be showing an archive for a
    // border that doesn't apply to the year on screen, so the selection goes
    // with it — cb.onSelect keeps React's copy of that state in step.
    var had = this.selName;
    this.selName = null;
    this.selLL = null;
    this.hovName = null;
    this.buildArchiveDots(null);
    if (had && this.cb.onSelect) this.cb.onSelect(null);
    this.targetTilt = this.uprightQuat ? this.uprightQuat.clone() : this.targetTilt;
    this.frameEra(era);
    // Far enough ahead that the idle auto-spin can't drift the empire off the
    // near side while it's being looked at.
    this.lastInteract = performance.now() + 100000;
    var self = this, want = this.empireYear;
    loadEmpires().then(function () {
      if (self.empireYear !== want) return;   // switched years while loading
      self._texDirty = true;
      // The real geometry sits differently from the ring it replaces, so the
      // camera is re-aimed at what is now actually on the globe.
      self.frameEra(eraFor(want));
      self.lastInteract = performance.now() + 100000;
    }).catch(function () { /* the hand-drawn ring is already on screen */ });
  };

  GlobeEngine.prototype.frameEra = function (era) {
    var d = (eraData && eraData[this.empireYear]) || era;
    if (!d || !d.focus) return;
    this.targetQ = this.quatFor(d.focus[0], d.focus[1]);
    this.targetZ = this.isMobile ? d.zoom + 0.35 : d.zoom;
  };

  GlobeEngine.prototype.initThree = function () {
    var el = this.mount;
    var w = el.clientWidth, h = el.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 0, this.targetZ);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h);
    el.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cursor = "grab";
    this.renderer.domElement.style.touchAction = "none";

    // Level axis, equator centered — was Earth's real 23.5° obliquity, but
    // that tilt read as an error on this stylized globe rather than a
    // deliberate astronomical touch.
    this.tiltQuat = new THREE.Quaternion();
    this.tiltGroup = new THREE.Group();
    this.tiltGroup.quaternion.copy(this.tiltQuat);
    this.scene.add(this.tiltGroup);
    this.group = new THREE.Group();
    this.tiltGroup.add(this.group);
    this.uprightQuat = new THREE.Quaternion();       // identity — level axis
    this.targetTilt = this.tiltQuat.clone();         // animated tilt target

    this.buildTexture();
    var tex = new THREE.CanvasTexture(this.canvas);
    tex.anisotropy = (this.renderer.capabilities.getMaxAnisotropy && this.renderer.capabilities.getMaxAnisotropy()) || 4;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    this.texture = tex;
    this.globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), new THREE.MeshBasicMaterial({ map: tex }));
    this.group.add(this.globe);

    this.outlineGroup = new THREE.Group();
    this.group.add(this.outlineGroup);
    this.refreshOutline();

    var atmMat = new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(0.24, 0.24, 0.24) } },
      vertexShader: "varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec3 vN; uniform vec3 c; void main(){ float i=pow(clamp(0.62 - dot(vN, vec3(0.0,0.0,1.0)),0.0,1.0),2.4); gl_FragColor=vec4(c, i*0.3);}",
      side: THREE.BackSide, transparent: true, depthWrite: false
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.11, 64, 64), atmMat));

    this.pinLayer = document.createElement("div");
    Object.assign(this.pinLayer.style, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "4" });
    el.appendChild(this.pinLayer);
    this.nameLabel = document.createElement("div");
    Object.assign(this.nameLabel.style, { position: "absolute", transform: "translate(-50%,-165%)", pointerEvents: "none", opacity: "0", whiteSpace: "nowrap", font: "italic 600 17px 'Playfair Display',serif", color: "#26261f", textShadow: "0 1px 6px rgba(255,255,255,.9)", willChange: "transform,opacity", transition: "opacity .3s" });
    this.pinLayer.appendChild(this.nameLabel);
    var self = this;
    var seeded = function (seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
    countries.forEach(function (c) {
      var h = 0; for (var i = 0; i < c.name.length; i++) h = (h * 31 + c.name.charCodeAt(i)) >>> 0;
      var count = 6;
      c.count = count;
      var center = self.llToVec(c.latitude, c.longitude, 1.015);

      // count badge — shown by default (like the Maps page markers)
      var badge = document.createElement("div");
      // Country archive counts are intentionally hidden; visitors select the
      // country shape itself and see its individual site pins after opening it.
      Object.assign(badge.style, { position: "absolute", display: "none", transform: "translate(-50%,-50%)", pointerEvents: "none", cursor: "pointer", willChange: "transform,opacity" });
      badge.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#1a1a18;background:#fff;border:1px solid rgba(0,0,0,.08);box-shadow:0 1px 5px rgba(0,0,0,.16)">' + count + '</div>';
      badge.addEventListener("click", function (ev) { ev.stopPropagation(); self.selectByName(c.name); });
      badge.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
      self.pinLayer.appendChild(badge);

      // scattered archive pins — revealed only when this country is selected
      var dots = [];
      self.pins.push({ name: c.name, vec: center, badge: badge, dots: dots });
    });

    var home = this.quatFor(HOME_VIEW.latitude, HOME_VIEW.longitude);
    this.group.quaternion.copy(home);
    this.targetQ = home.clone();
    this.targetZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    this.lastInteract = performance.now() + 2500;

    this.bindPointer();
    this.animate();
  };

  GlobeEngine.prototype.bindPointer = function () {
    var self = this;
    var dom = this.renderer.domElement;
    var dragging = false, moved = 0, px = 0, py = 0;
    var down = function (e) { dragging = true; moved = 0; px = e.clientX; py = e.clientY; self.lastInteract = performance.now(); dom.style.cursor = "grabbing"; };
    var move = function (e) {
      if (dragging) {
        var dx = e.clientX - px, dy = e.clientY - py;
        px = e.clientX; py = e.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.005);
        var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.005);
        self.group.quaternion.premultiply(qy).premultiply(qx);
        self.targetQ.copy(self.group.quaternion);
        self.lastInteract = performance.now();
      } else {
        self.hoverPick(e.clientX, e.clientY);
      }
    };
    var up = function (e) {
      if (dragging && moved < 6) self.clickPick(e.clientX, e.clientY);
      dragging = false; dom.style.cursor = "grab"; self.lastInteract = performance.now();
    };
    dom.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    var wheel = function (e) {
      e.preventDefault();
      self.targetZ = Math.max(2.0, Math.min(4.6, self.targetZ + e.deltaY * 0.0016));
      self.lastInteract = performance.now();
    };
    dom.addEventListener("wheel", wheel, { passive: false });
    this._cleanupPointer = function () {
      dom.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dom.removeEventListener("wheel", wheel);
    };
  };

  GlobeEngine.prototype.screenToSphere = function (cx, cy) {
    var r = this.renderer.domElement.getBoundingClientRect();
    var ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    var hit = this.raycaster.intersectObject(this.globe, false);
    if (!hit.length) return null;
    // The globe sits under tiltGroup -> group -> mesh (see updatePins, which
    // applies both quaternions the same way going the other direction:
    // .applyQuaternion(q).applyQuaternion(tq)). This only undid `group`'s
    // rotation and ignored the 23.5° axial tilt entirely, so every pick was
    // off by the current tilt angle — clicking Mongolia could resolve to a
    // neighboring country instead, which then gets stuck selected since the
    // miscalculation is consistent.
    var p = hit[0].point.clone();
    p.applyQuaternion(this.tiltGroup.quaternion.clone().invert());
    p.applyQuaternion(this.group.quaternion.clone().invert());
    return p;
  };

  GlobeEngine.prototype.countryAt = function (cx, cy) {
    var local = this.screenToSphere(cx, cy);
    if (!local) return null;
    var ll = this.vecToLL(local);
    for (var i = 0; i < this.features.length; i++) {
      try { if (d3.geoContains(this.features[i], [ll[1], ll[0]])) return this.features[i].properties.name; } catch (e) {}
    }
    return null;
  };

  GlobeEngine.prototype.hoverPick = function (cx, cy) {
    if (!this.features.length) return;
    var now = performance.now();
    if (now - this.lastHoverT < 80) return;
    this.lastHoverT = now;
    var name = this.countryAt(cx, cy);
    if (name !== this.hovName) {
      this.hovName = name;
      this._texDirty = true; // coalesced rebuild in animate() — avoids a full 2048×1024 redraw per mousemove
      this.renderer.domElement.style.cursor = name ? "pointer" : "grab";
    }
    if (this.cb.onHover) this.cb.onHover(name, cx, cy);
  };

  // True when a click landed on a site pin or within a ring of empty space
  // around one. The pins are 28px buttons with an 11px visual dot, so a press
  // aimed at one but a few pixels wide still reads as "this pin", not as the
  // country underneath it.
  GlobeEngine.prototype.nearArchiveDot = function (cx, cy) {
    if (!this.renderer || !this.archiveDots.length) return false;
    var rect = this.renderer.domElement.getBoundingClientRect();
    var pad = this.isMobile ? 40 : 30;   // fingers need more room than a cursor
    for (var i = 0; i < this.archiveDots.length; i++) {
      var d = this.archiveDots[i];
      if (d.el.style.opacity === "0") continue;   // on the far side of the globe
      var x = rect.left + parseFloat(d.el.style.left || "0");
      var y = rect.top + parseFloat(d.el.style.top || "0");
      if (Math.hypot(cx - x, cy - y) < pad) return true;
    }
    return false;
  };

  GlobeEngine.prototype.clickPick = function (cx, cy) {
    var name = this.countryAt(cx, cy);
    if (!name) return;
    if (name === this.selName) {
      // A second press on the open country closes it — except near its own
      // pins, where the press was meant for the pin and closing the country
      // would take the whole archive panel away with it.
      if (this.nearArchiveDot(cx, cy)) return;
      this.clearSelection();
      return;
    }
    this.selectByName(name);
  };

  GlobeEngine.prototype.quatFor = function (lat, lng) {
    var d = this.llToVec(lat, lng, 1).normalize();
    var ry = Math.atan2(-d.x, d.z);
    var dpz = -d.x * Math.sin(ry) + d.z * Math.cos(ry);
    var rx = Math.atan2(d.y, dpz);
    var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rx);
    return qx.multiply(qy);
  };

  GlobeEngine.prototype.flyTo = function (lat, lng) {
    this.targetQ = this.quatFor(lat, lng);
    // Keep the selected country readable without letting the globe cover the
    // larger archive cards on ultra-wide desktop screens.
    this.targetZ = this.isMobile ? 2.7 : (window.innerWidth >= 1500 ? 3.35 : 2.5);
  };

  GlobeEngine.prototype.selectByName = function (name) {
    var ll = null;
    var cur = countries.find(function (c) { return c.name === name; });
    if (cur) ll = [cur.latitude, cur.longitude];
    if (!ll) {
      var f = this.features.find(function (x) { return x.properties.name === name; });
      if (f) { var c2 = d3.geoCentroid(f); ll = [c2[1], c2[0]]; }
    }
    if (!ll) return;
    this.selName = name;
    this.selLL = ll;
    this.hovName = null;
    this.targetTilt = this.uprightQuat.clone();   // straighten axis on select
    this._texDirty = true;
    this.flyTo(ll[0], ll[1]);
    this.lastInteract = performance.now() + 100000;
    this.buildArchiveDots(name);
    if (this.cb.onSelect) this.cb.onSelect(name);
  };

  GlobeEngine.prototype.setArchiveSites = function (rows) {
    var grouped = {};
    (rows || []).forEach(function (s) { (grouped[s.country] || (grouped[s.country] = [])).push(s); });
    this.archiveSites = grouped;
    if (this.selName && this.pinLayer) this.buildArchiveDots(this.selName);
  };

  GlobeEngine.prototype.buildArchiveDots = function (name) {
    this.archiveDots.forEach(function (d) { d.el.remove(); });
    this.archiveDots = [];
    this.activeSite = null;
    if (!this.pinLayer) return;
    var self = this;
    var sites = (this.archiveSites[name] || []).filter(function (s) { return Number.isFinite(s.latitude) && Number.isFinite(s.longitude); }).sort(function (a, b) { return a.position - b.position; });
    sites.forEach(function (site) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.title = String(site.position).padStart(2, "0") + " · " + site.name;
      Object.assign(dot.style, { position: "absolute", width: "28px", height: "28px", padding: "0", border: "0", background: "transparent", transform: "translate(-50%,-50%)", pointerEvents: "auto", cursor: "pointer", opacity: "0", willChange: "transform,opacity", zIndex: "5" });
      dot.innerHTML = '<span class="ring" style="position:absolute;left:50%;top:50%;width:11px;height:11px;transform:translate(-50%,-50%);border-radius:50%;border:1.25px solid rgba(' + YELLOW_RGB + ',.8)"></span><span class="core" style="position:absolute;left:50%;top:50%;width:6px;height:6px;transform:translate(-50%,-50%);border-radius:50%;background:' + YELLOW + ';box-shadow:0 0 7px 2px rgba(' + YELLOW_RGB + ',.9)"></span>';
      dot.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
      dot.addEventListener("click", function (ev) { ev.stopPropagation(); self.setActiveSite(site.position); if (self.cb.onSiteSelect) self.cb.onSiteSelect(site.position); });
      self.pinLayer.appendChild(dot);
      self.archiveDots.push({ site: site, vec: self.llToVec(site.latitude, site.longitude, 1.018), el: dot, ring: dot.querySelector('.ring'), core: dot.querySelector('.core') });
    });
  };

  GlobeEngine.prototype.setActiveSite = function (position) {
    this.activeSite = position || null;
    this.archiveDots.forEach(function (d) {
      var on = d.site.position === position;
      d.core.style.background = YELLOW;
      d.core.style.boxShadow = on ? '0 0 0 4px rgba(5,5,5,.28),0 0 15px 5px rgba(5,5,5,.75)' : '0 0 8px 2px rgba(5,5,5,.55)';
    });
  };

  GlobeEngine.prototype.clearSelection = function () {
    this.selName = null;
    this.selLL = null;
    this.targetTilt = this.tiltQuat.clone();      // restore 23.5° tilt
    this._texDirty = true;
    this.targetZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    this.lastInteract = performance.now();
    this.buildArchiveDots(null);
    if (this.cb.onSelect) this.cb.onSelect(null);
  };

  GlobeEngine.prototype.setFilter = function (filter) { this.filter = filter; };

  GlobeEngine.prototype.matchFilter = function (name) {
    var c = countries.find(function (x) { return x.name === name; });
    if (!c) return false;
    return !!this.filter && c.media.indexOf(this.filter) !== -1;
  };

  GlobeEngine.prototype.updatePins = function () {
    var cam = this.camera;
    var dom = this.renderer.domElement;
    var w = dom.clientWidth, h = dom.clientHeight;
    var q = this.group.quaternion;
    var tq = this.tiltGroup.quaternion;
    var t = (performance.now() % 1600) / 1600;
    // `vec.z > 0` (plain front/back hemisphere split) only holds for a camera
    // infinitely far away. This camera sits close (2–4.6 units off a radius-1
    // globe), so the true visible horizon is nearer the camera than the
    // equator-plane — pins between the two "passed" this check while
    // actually already behind the sphere's silhouette from the camera's own
    // point of view, so they floated in place outside the visible globe
    // instead of rotating out of view with it. cos(horizon angle) = R/D.
    var horizonCos = 1 / cam.position.z;
    var isFront = function (v) { return (v.z / v.length()) > horizonCos; };
    // Driven directly by the actual selection (selName/selLL, set in
    // selectByName for *any* of the ~180 real countries) instead of only the
    // 15 curated `countries` pins below — that loop previously left the label
    // showing whichever curated country was selected last (e.g. "Egypt")
    // frozen in place whenever a non-curated country got picked afterwards,
    // since nothing in the loop ever matched to update or clear it.
    if (this.selName && this.selLL && this.nameLabel) {
      var lwv = this.llToVec(this.selLL[0], this.selLL[1], 1.015).applyQuaternion(q).applyQuaternion(tq);
      var lproj = lwv.clone().project(cam);
      var lfront = isFront(lwv);
      this.nameLabel.textContent = this.selName;
      this.nameLabel.style.left = (lproj.x * 0.5 + 0.5) * w + "px";
      this.nameLabel.style.top = (-lproj.y * 0.5 + 0.5) * h + "px";
      this.nameLabel.style.opacity = (lfront && this.selName !== "Mongolia") ? "1" : "0";
    } else if (this.nameLabel) {
      this.nameLabel.style.opacity = "0";
    }
    for (var i = 0; i < this.pins.length; i++) {
      var p = this.pins[i];
      var selected = p.name === this.selName;
      var dim = this.filter && !this.matchFilter(p.name);
      // count badge
      var bwv = p.vec.clone().applyQuaternion(q).applyQuaternion(tq);
      var bproj = bwv.clone().project(cam);
      var bfront = isFront(bwv);
      p.badge.style.left = (bproj.x * 0.5 + 0.5) * w + "px";
      p.badge.style.top = (-bproj.y * 0.5 + 0.5) * h + "px";
      var showBadge = bfront && !selected;
      p.badge.style.opacity = showBadge ? (dim ? "0.15" : "1") : "0";
      p.badge.style.pointerEvents = "none";
      // scattered archive pins (only for selected country)
      for (var k = 0; k < p.dots.length; k++) {
        var d = p.dots[k];
        var wv = d.vec.clone().applyQuaternion(q).applyQuaternion(tq);
        var proj = wv.clone().project(cam);
        var front = isFront(wv);
        d.el.style.left = (proj.x * 0.5 + 0.5) * w + "px";
        d.el.style.top = (-proj.y * 0.5 + 0.5) * h + "px";
        d.el.style.opacity = (selected && front && p.name !== "Mongolia") ? "0.95" : "0";
        // Legacy/static country dots never pulse. Only the explicitly selected
        // archive site below is allowed to animate.
        d.ring.style.transform = "translate(-50%,-50%) scale(1)";
        d.ring.style.opacity = "0.55";
      }
    }
    for (var a = 0; a < this.archiveDots.length; a++) {
      var ad = this.archiveDots[a];
      var awv = ad.vec.clone().applyQuaternion(q).applyQuaternion(tq);
      var aproj = awv.clone().project(cam);
      var afront = isFront(awv);
      ad.el.style.left = (aproj.x * 0.5 + 0.5) * w + "px";
      ad.el.style.top = (-aproj.y * 0.5 + 0.5) * h + "px";
      ad.el.style.opacity = afront ? "0.98" : "0";
      ad.el.style.pointerEvents = afront ? "auto" : "none";
      var active = ad.site.position === this.activeSite;
      ad.ring.style.transform = active
        ? "translate(-50%,-50%) scale(" + (1 + t * 1.8) + ")"
        : "translate(-50%,-50%) scale(1)";
      ad.ring.style.opacity = active ? String((1 - t) * 0.65) : "0.55";
    }
  };

  GlobeEngine.prototype.animate = function () {
    var self = this;
    if (!this.alive) return;
    this.raf = requestAnimationFrame(function () { self.animate(); });
    var now = performance.now();
    var idle = now - this.lastInteract > 3500;
    var auto = idle && !this.selName;
    if (auto) {
      var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.0006);
      this.group.quaternion.premultiply(qy);
      this.targetQ.copy(this.group.quaternion);
    } else {
      this.group.quaternion.slerp(this.targetQ, 0.085);
    }
    if (this.targetTilt) this.tiltGroup.quaternion.slerp(this.targetTilt, 0.08);
    this.camera.position.z += (this.targetZ - this.camera.position.z) * 0.08;
    if (this._texDirty) { this._texDirty = false; this.buildTexture(); } // one coalesced texture rebuild per frame at most
    this.updatePins();
    this.renderer.render(this.scene, this.camera);
  };

  GlobeEngine.prototype.resize = function () {
    if (!this.renderer) return;
    this.isMobile = window.innerWidth < 820;
    var responsiveZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    // Preserve a user's manual zoom, but update the default camera distance
    // when crossing between notebook and ultra-wide desktop layouts.
    if (Math.abs(this.targetZ - 3.2) < 0.02 || Math.abs(this.targetZ - 3.65) < 0.02 || Math.abs(this.targetZ - 4.1) < 0.02) {
      this.targetZ = responsiveZ;
    }
    var w = this.mount.clientWidth, h = this.mount.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  GlobeEngine.prototype.dispose = function () {
    this._disposed = true;
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this._cleanupPointer();
    if (this.pinLayer) this.pinLayer.remove();
    if (this.renderer && this.renderer.domElement) this.renderer.domElement.remove();
    if (this.renderer) this.renderer.dispose();
  };

  window.GlobeEngine = GlobeEngine;
  window.GLOBE_COUNTRIES = countries;
  window.resolveCountry = resolveCountry;
  window.GLOBE_ACCENT = ACCENT;
  window.MONGOL_ERAS = MONGOL_ERAS;
})();
