(function() {
  const MAX = 50;
  const own = (o, k) => o !== null && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : void 0;
  const text = (v, min, max) => {
    if (typeof v !== "string") return null;
    const t = v.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, " ").trim();
    return t.length >= min && t.length <= max ? t : null;
  };
  const num = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null;
  const oneOf = (v, list) => list.includes(v) ? v : void 0;
  function place(p) {
    const name = text(own(p, "name"), 1, 60), lat = num(own(p, "lat"), -90, 90), lon = num(own(p, "lon"), -180, 180);
    if (name === null || lat === null || lon === null) return null;
    const note = own(p, "note") === void 0 ? "" : text(own(p, "note"), 0, 40);
    const on = own(p, "on");
    if (note === null || typeof on !== "boolean") return null;
    return { name, lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4, note, on };
  }
  function places(list) {
    if (!Array.isArray(list) || !list.length) return null;
    const out = [];
    for (const p of list.slice(0, MAX)) {
      const q = place(p);
      if (!q) return null;
      out.push(q);
    }
    return { list: out, cut: list.length > MAX };
  }
  function set(d) {
    const name = text(own(d, "name"), 1, 60), desc = own(d, "desc") === void 0 ? "" : text(own(d, "desc"), 0, 120);
    const pl = places(own(d, "places"));
    if (name === null || desc === null || !pl) return null;
    return { data: { name, desc, places: pl.list }, cut: pl.cut };
  }
  const RULES = {
    auto: (v) => oneOf(v, ["run", "off"]),
    layout: (v) => oneOf(v, ["0.05", "0.07", "0.08", "0.09", "EB", "E"]),
    ahead: (v) => oneOf(v, ["", ...Array.from({ length: 16 }, (_, i) => String(i + 1))]),
    lines: (v) => oneOf(v, ["built", "none", "black", "g22", "g33", "g55", "g88", "white"]),
    which: (v) => oneOf(v, ["both", "rows", "cols"]),
    rainshow: (v) => oneOf(v, ["chance", "amount", "both"]),
    rainMin: (v) => oneOf(v, [10, 20, 30, 40, 50]),
    amtMin: (v) => oneOf(v, [0, 0.01, 0.05, 0.1, 0.25]),
    units: (v) => oneOf(v, ["F", "C"]),
    amt: (v) => oneOf(v, ["in", "mm"]),
    cwin: (v) => Array.isArray(v) && v.length <= 6 && v.every((k) => ["7", "30", "90", "182", "365", "ytd"].includes(k)) ? Array.from(new Set(v)) : void 0,
    changes: (v) => typeof v === "boolean" ? v : void 0,
    wu: (v) => typeof v === "boolean" ? v : void 0,
    ft: (v) => oneOf(v, ["1", "2", "3", "4", "5"]),
    tz: (v) => oneOf(v, ["device", "place"]),
    // Times in (0.67), v02
    e: (v) => {
      if (v === null || typeof v !== "object" || Array.isArray(v)) return void 0;
      const o = {};
      ["bar", "maxline", "precip", "gust", "usual", "comfort", "fuzz", "prev", "hours", "best", "nums", "amt", "gnum"].forEach((k) => {
        const b = own(v, k);
        if (typeof b === "boolean") o[k] = b;
      });
      ["comfLo", "comfHi"].forEach((k) => {
        const n = own(v, k);
        if (Number.isInteger(n) && n >= -40 && n <= 130) o[k] = n;
      });
      return o;
    }
  };
  function profile(d) {
    const name = text(own(d, "name"), 1, 60), s = own(d, "set");
    if (name === null || s === null || typeof s !== "object" || Array.isArray(s)) return null;
    const pl = places(own(s, "places"));
    if (!pl) return null;
    const out = { places: pl.list };
    Object.keys(RULES).forEach((k) => {
      const v = RULES[k](own(s, k));
      if (v !== void 0) out[k] = v;
    });
    return { data: { name, set: out }, cut: pl.cut };
  }
  function payload(v) {
    if (own(v, "v") !== 1) return null;
    const kind = own(v, "kind"), d = own(v, "data");
    const r = kind === "set" ? set(d) : kind === "profile" ? profile(d) : null;
    return r ? { kind, data: r.data, cut: r.cut } : null;
  }
  globalThis.WXCHECK = { payload, MAX };
})();
