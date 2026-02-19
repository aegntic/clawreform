const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d", { alpha: true });

const form = document.getElementById("waitlist-form");
const feedback = document.getElementById("waitlist-feedback");
const waitlistCountEl = document.getElementById("waitlist-count");
const runtimeHealthEl = document.getElementById("runtime-health");
const comparisonUpdatedEl = document.getElementById("comparison-updated");

const statCells = [...document.querySelectorAll("td[data-repo][data-field]")];
const revealNodes = [...document.querySelectorAll(".reveal")];
const tiltCards = [...document.querySelectorAll(".card-tilt")];

const REPOS = {
  openclaw: { owner: "openclaw", repo: "openclaw" },
  zeroclaw: { owner: "openagen", repo: "zeroclaw" },
  clawreform: { owner: "aegntic", repo: "clawreform" }
};

const FALLBACK_REPO_DATA = {
  openclaw: {
    stargazers_count: 210185,
    forks_count: 38842,
    open_issues_count: 7978,
    subscribers_count: 1147,
    language: "TypeScript",
    pushed_at: "2026-02-19T11:20:52Z"
  },
  zeroclaw: {
    stargazers_count: 608,
    forks_count: 88,
    open_issues_count: 0,
    subscribers_count: 8,
    language: "Rust",
    pushed_at: "2026-02-19T11:04:36Z"
  },
  clawreform: {
    stargazers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    subscribers_count: 0,
    language: "JavaScript",
    pushed_at: "2026-02-19T08:44:34Z"
  }
};

const scene = {
  width: 0,
  height: 0,
  dpr: 1,
  depth: 1800,
  fov: 520,
  particles: [],
  pointerX: 0,
  pointerY: 0,
  targetX: 0,
  targetY: 0,
  lastTs: 0
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type || ""}`.trim();
}

function setCellValue(cell, value) {
  const type = cell.dataset.type || "text";

  if (type === "number") {
    cell.textContent = formatCompact(value);
    return;
  }

  if (type === "date") {
    cell.textContent = formatDate(value);
    return;
  }

  const next = value === null || value === undefined || value === "" ? "-" : String(value);
  cell.textContent = next;
}

async function fetchRepoStats(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    method: "GET",
    headers: { Accept: "application/vnd.github+json" }
  });

  if (!response.ok) {
    throw new Error(`GitHub fetch failed (${response.status})`);
  }

  return response.json();
}

function applyComparisonStats(repoData) {
  for (const cell of statCells) {
    const repoName = cell.dataset.repo;
    const field = cell.dataset.field;
    const fallback = cell.dataset.fallback;

    const source = repoData[repoName] || {};
    const value = source[field] ?? fallback ?? "-";
    setCellValue(cell, value);
  }
}

async function refreshComparisonStats() {
  const seeded = {
    openclaw: { ...FALLBACK_REPO_DATA.openclaw },
    zeroclaw: { ...FALLBACK_REPO_DATA.zeroclaw },
    clawreform: { ...FALLBACK_REPO_DATA.clawreform }
  };

  const entries = Object.entries(REPOS);
  const jobs = entries.map(async ([name, cfg]) => {
    try {
      const data = await fetchRepoStats(cfg.owner, cfg.repo);
      seeded[name] = {
        ...seeded[name],
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        open_issues_count: data.open_issues_count,
        subscribers_count: data.subscribers_count,
        language: data.language,
        pushed_at: data.pushed_at
      };
      return { name, ok: true };
    } catch {
      return { name, ok: false };
    }
  });

  await Promise.all(jobs);
  applyComparisonStats(seeded);

  const stamp = new Date();
  comparisonUpdatedEl.textContent = `GitHub API ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(stamp)}`;
}

async function refreshLaunchStats() {
  try {
    const [waitlistRes, healthRes] = await Promise.all([
      fetch("/api/waitlist/stats", { method: "GET" }),
      fetch("/api/health", { method: "GET" })
    ]);

    if (!waitlistRes.ok || !healthRes.ok) {
      throw new Error("stats fetch failed");
    }

    const waitlist = await waitlistRes.json();
    const health = await healthRes.json();

    waitlistCountEl.textContent = formatCompact(waitlist.count ?? 0);
    runtimeHealthEl.textContent = health.status === "ok" ? "online" : "degraded";
  } catch {
    waitlistCountEl.textContent = "-";
    runtimeHealthEl.textContent = "offline";
  }
}

async function onSubmit(event) {
  event.preventDefault();

  const submit = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  const payload = {
    email: data.get("email"),
    name: data.get("name"),
    company: data.get("company"),
    useCase: data.get("useCase"),
    source: "clawreform.com"
  };

  submit.disabled = true;
  setFeedback("Submitting...", "");

  try {
    const response = await fetch("/api/waitlist/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Registration failed");
    }

    if (result.alreadyRegistered) {
      setFeedback("You are already on the waitlist. Profile refreshed.", "success");
    } else {
      setFeedback("You are in. Launch details will follow.", "success");
    }

    form.reset();
    waitlistCountEl.textContent = formatCompact(result.count ?? 0);
  } catch (error) {
    setFeedback(error.message || "Something went wrong. Please try again.", "error");
  } finally {
    submit.disabled = false;
  }
}

function initializeReveal() {
  if (typeof IntersectionObserver !== "function") {
    for (const node of revealNodes) {
      node.classList.add("is-visible");
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15 }
  );

  for (const node of revealNodes) {
    observer.observe(node);
  }
}

function initializeTilt() {
  for (const card of tiltCards) {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width;
      const relY = (event.clientY - rect.top) / rect.height;
      const rotateY = (relX - 0.5) * 8;
      const rotateX = (0.5 - relY) * 8;
      card.style.transform = `perspective(840px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "perspective(840px) rotateX(0deg) rotateY(0deg)";
    });
  }
}

function resizeScene() {
  scene.dpr = Math.max(1, window.devicePixelRatio || 1);
  scene.width = window.innerWidth;
  scene.height = window.innerHeight;

  canvas.width = Math.floor(scene.width * scene.dpr);
  canvas.height = Math.floor(scene.height * scene.dpr);
  canvas.style.width = `${scene.width}px`;
  canvas.style.height = `${scene.height}px`;

  ctx.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);

  const targetParticles = clamp(Math.floor((scene.width * scene.height) / 9000), 120, 280);
  scene.particles = Array.from({ length: targetParticles }, () => createParticle());
}

function createParticle() {
  return {
    theta: rand(0, Math.PI * 2),
    radius: rand(40, 360),
    z: rand(20, scene.depth),
    speed: rand(4.5, 10.5),
    size: rand(1.1, 3.4),
    drift: rand(-0.02, 0.02),
    phase: rand(0, Math.PI * 2)
  };
}

function project3d(x, y, z) {
  const centerX = scene.width * 0.5 + scene.pointerX * 42;
  const centerY = scene.height * 0.5 + scene.pointerY * 26;
  const depth = z + 120;
  const scale = scene.fov / (scene.fov + depth);

  return {
    x: centerX + x * scale,
    y: centerY + y * scale,
    scale
  };
}

function drawTunnel(ts) {
  const rings = 16;
  const spokes = 12;
  const cycle = (ts * 0.18) % scene.depth;

  ctx.save();
  ctx.lineWidth = 1;

  for (let i = 0; i < rings; i += 1) {
    const z = (i * (scene.depth / rings) + cycle) % scene.depth;
    const wobble = Math.sin(ts * 0.0006 + i * 0.7) * 18;
    const p = project3d(0, 0, z);
    const radius = (340 + wobble) * p.scale;
    const alpha = clamp((1 - z / scene.depth) * 0.35, 0.05, 0.42);

    ctx.beginPath();
    ctx.strokeStyle = `rgba(108, 236, 255, ${alpha.toFixed(3)})`;
    ctx.ellipse(p.x, p.y, radius, radius * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let spoke = 0; spoke < spokes; spoke += 1) {
    const angle = (spoke / spokes) * Math.PI * 2 + ts * 0.00011;
    const near = project3d(Math.cos(angle) * 320, Math.sin(angle) * 200, 0);
    const far = project3d(Math.cos(angle) * 320, Math.sin(angle) * 200, scene.depth);

    ctx.beginPath();
    ctx.strokeStyle = "rgba(84, 205, 227, 0.16)";
    ctx.moveTo(near.x, near.y);
    ctx.lineTo(far.x, far.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawParticles(ts, dt) {
  const step = clamp(dt / 16.6, 0.7, 1.8);

  for (const particle of scene.particles) {
    particle.z -= particle.speed * step;
    particle.theta += particle.drift;
    particle.phase += 0.02;

    if (particle.z < 8) {
      particle.z = scene.depth + rand(0, 120);
      particle.radius = rand(40, 360);
      particle.theta = rand(0, Math.PI * 2);
    }

    const orbit = particle.theta + ts * 0.00005;
    const x = Math.cos(orbit) * particle.radius;
    const y = Math.sin(orbit * 1.22) * particle.radius * 0.56 + Math.sin(particle.phase) * 9;

    const p = project3d(x, y, particle.z);
    const r = particle.size * p.scale * 1.8;
    const alpha = clamp((1 - particle.z / scene.depth) * 0.9, 0.08, 0.92);

    ctx.beginPath();
    ctx.fillStyle = `rgba(176, 246, 255, ${alpha.toFixed(3)})`;
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = `rgba(74, 226, 250, ${(alpha * 0.45).toFixed(3)})`;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y + r * 8);
    ctx.stroke();
  }
}

function renderScene(ts) {
  if (!scene.lastTs) {
    scene.lastTs = ts;
  }

  const dt = ts - scene.lastTs;
  scene.lastTs = ts;

  scene.pointerX += (scene.targetX - scene.pointerX) * 0.08;
  scene.pointerY += (scene.targetY - scene.pointerY) * 0.08;

  ctx.clearRect(0, 0, scene.width, scene.height);

  const sky = ctx.createRadialGradient(
    scene.width * (0.5 + scene.pointerX * 0.09),
    scene.height * (0.35 + scene.pointerY * 0.05),
    20,
    scene.width * 0.5,
    scene.height * 0.55,
    scene.width * 0.85
  );
  sky.addColorStop(0, "rgba(54, 172, 196, 0.34)");
  sky.addColorStop(0.45, "rgba(8, 45, 59, 0.2)");
  sky.addColorStop(1, "rgba(2, 10, 15, 0.84)");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, scene.width, scene.height);

  drawTunnel(ts);
  drawParticles(ts, dt);

  requestAnimationFrame(renderScene);
}

function bindPointer() {
  window.addEventListener("pointermove", (event) => {
    const nx = event.clientX / Math.max(1, scene.width);
    const ny = event.clientY / Math.max(1, scene.height);
    scene.targetX = clamp((nx - 0.5) * 2, -1, 1);
    scene.targetY = clamp((ny - 0.5) * 2, -1, 1);
  });

  window.addEventListener("pointerleave", () => {
    scene.targetX = 0;
    scene.targetY = 0;
  });
}

function boot() {
  document.body.classList.add("js-ready");
  initializeReveal();
  initializeTilt();

  bindPointer();
  resizeScene();
  requestAnimationFrame(renderScene);

  window.addEventListener("resize", resizeScene);
  form.addEventListener("submit", onSubmit);

  refreshLaunchStats();
  refreshComparisonStats();

  setInterval(refreshLaunchStats, 12000);
  setInterval(refreshComparisonStats, 180000);
}

boot();
