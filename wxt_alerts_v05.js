(function() {
  const kind = (e) => /warning/i.test(e) ? 3 : /watch/i.test(e) ? 2 : 1;
  const GLYPH = { 3: "▲", 2: "△", 1: "◇" };
  function when(iso, place) {
    const t = window.WXTIME && window.WXTIME.alert ? window.WXTIME.alert(iso, place) : null;
    if (t) return t;
    const m = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)(?::\d\d(?:\.\d+)?)?(Z|[+-]\d\d:\d\d)?/.exec(iso || "");
    if (!m) return "unknown";
    const h = +m[2];
    return `${m[1]} ${h % 12 || 12}:${m[3]} ${h < 12 ? "AM" : "PM"}${m[4] ? " UTC" + (m[4] === "Z" ? "" : m[4]) : ""}`;
  }
  function index() {
    const A = window.WXA && window.WXA.places || [], by = {}, off = {};
    A.forEach((p) => {
      by[p.name] = Array.isArray(p.alerts) ? p.alerts : [];
      const first = by[p.name].map((a) => a.onset || a.effective).find(Boolean) || "";
      off[p.name] = p.offset || (/[+-]\d\d:\d\d$/.test(first) ? first.slice(-6) : "-06:00");
    });
    return { by, off };
  }
  window.WXTA = {
    decorate(footId, where) {
      const { by, off } = index();
      const foot = document.getElementById(footId);
      const base = foot ? foot.textContent : "";
      if (foot && !foot.dataset.wxta) {
        foot.dataset.wxta = "1";
        foot.addEventListener("click", (e) => {
          if (e.target.closest("a")) return;
          foot.textContent = base;
          foot.classList.remove("alert");
        });
      }
      document.querySelectorAll("[data-p][data-from]").forEach((c) => {
        const o = off[c.dataset.p] || "-06:00";
        const s = Date.parse(c.dataset.from + ":00" + o), e = Date.parse(c.dataset.to + ":00" + o);
        const hits = (by[c.dataset.p] || []).filter((a) => {
          const as = Date.parse(a.onset || a.effective), ae = Date.parse(a.ends || a.expires);
          return isFinite(as) && isFinite(ae) && as < e && ae > s;
        }).sort((a, b) => kind(b.event) - kind(a.event));
        if (!hits.length) return;
        const k = kind(hits[0].event);
        const t = document.createElement("span");
        t.className = "tri k" + k;
        t.textContent = GLYPH[k];
        if (c.classList.contains("one")) {
          const hi = c.querySelector(".hi");
          hi.after(t);
        } else c.appendChild(t);
        const text = hits.map((a) => `${a.event} until ${when(a.ends || a.expires, c.dataset.p)}`).join("; ");
        c.title = text;
        c.style.cursor = "pointer";
        c.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (!foot) return;
          foot.textContent = "";
          const b = document.createElement("b");
          b.textContent = c.dataset.p + ": ";
          foot.append(b, document.createTextNode(text + ". "));
          const pt = where ? where(c.dataset.p) : null;
          if (pt && isFinite(pt.lat) && isFinite(pt.lon)) {
            const a = document.createElement("a");
            a.href = `https://forecast.weather.gov/MapClick.php?lat=${(+pt.lat).toFixed(4)}&lon=${(+pt.lon).toFixed(4)}`;
            a.target = "_blank";
            a.rel = "noopener";
            a.textContent = "Full text: National Weather Service";
            foot.append(a);
          }
          foot.append(document.createTextNode("  (tap here to close)"));
          foot.classList.add("alert");
        });
      });
    }
  };
})();
