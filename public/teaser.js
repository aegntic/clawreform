const canvas = document.getElementById("star-canvas");
const ctx = canvas.getContext("2d");
const form = document.getElementById("waitlist-form");
const feedback = document.getElementById("waitlist-feedback");
const waitlistCountEl = document.getElementById("waitlist-count");
const runtimeHealthEl = document.getElementById("runtime-health");

const stars = [];
let width = 0;
let height = 0;
let dpr = 1;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function resizeCanvas() {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const target = Math.min(150, Math.max(70, Math.floor((width * height) / 18000)));
  stars.length = 0;
  for (let i = 0; i < target; i += 1) {
    stars.push({
      x: rand(0, width),
      y: rand(0, height),
      r: rand(0.5, 2.2),
      vx: rand(-0.12, 0.12),
      vy: rand(-0.09, 0.09),
      phase: rand(0, Math.PI * 2)
    });
  }
}

function tick() {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < stars.length; i += 1) {
    const star = stars[i];
    star.x += star.vx;
    star.y += star.vy;
    star.phase += 0.015;

    if (star.x < -4) star.x = width + 4;
    if (star.x > width + 4) star.x = -4;
    if (star.y < -4) star.y = height + 4;
    if (star.y > height + 4) star.y = -4;

    const alpha = 0.28 + (Math.sin(star.phase) + 1) * 0.22;
    ctx.beginPath();
    ctx.fillStyle = `rgba(182, 220, 255, ${alpha.toFixed(3)})`;
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();

    for (let j = i + 1; j < stars.length; j += 1) {
      const other = stars[j];
      const dx = star.x - other.x;
      const dy = star.y - other.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 110) continue;
      const linkAlpha = (1 - dist / 110) * 0.2;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(103, 203, 255, ${linkAlpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(other.x, other.y);
      ctx.stroke();
    }
  }

  requestAnimationFrame(tick);
}

async function getStats() {
  try {
    const [waitlistRes, healthRes] = await Promise.all([
      fetch("/api/waitlist/stats", { method: "GET" }),
      fetch("/api/health", { method: "GET" })
    ]);

    const waitlist = await waitlistRes.json();
    const health = await healthRes.json();

    waitlistCountEl.textContent = String(waitlist.count ?? 0);
    runtimeHealthEl.textContent = health.status === "ok" ? "online" : "degraded";
  } catch {
    waitlistCountEl.textContent = "-";
    runtimeHealthEl.textContent = "offline";
  }
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type || ""}`.trim();
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
      setFeedback("You are already on the waitlist. We refreshed your profile.", "success");
    } else {
      setFeedback("You are in. We will send early access details soon.", "success");
    }

    form.reset();
    waitlistCountEl.textContent = String(result.count ?? waitlistCountEl.textContent);
  } catch (error) {
    setFeedback(error.message || "Something went wrong. Please try again.", "error");
  } finally {
    submit.disabled = false;
  }
}

window.addEventListener("resize", resizeCanvas);
form.addEventListener("submit", onSubmit);

resizeCanvas();
tick();
getStats();
setInterval(getStats, 12000);
