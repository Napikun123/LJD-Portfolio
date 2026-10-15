// ==========================================================
// Portfolio scripts
// 1. Dark / light mode toggle (remembers your choice)
// 2. Mobile menu
// 3. Copy email button
// 4. Highlight the nav link of the section you're viewing
// 5. Grey box fallback for missing images
// 6. Auto-update footer year
// ==========================================================

// ---------- 1. Dark mode ----------
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeBtn.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
  );
}

// Match the theme that the <head> script already set
applyTheme(root.getAttribute("data-theme") || "light");

themeBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";

  const change = () => {
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      // Storage can be blocked (private mode); the toggle still works for this visit
    }
  };

  // Spin the moon / sun icon
  themeBtn.classList.remove("is-spinning");
  void themeBtn.offsetWidth;              // restart the animation
  themeBtn.classList.add("is-spinning");

  // Fallback (older browsers, or reduced motion): simple color fade
  if (!document.startViewTransition || reduceMotion) {
    root.classList.add("theme-transition");
    change();
    setTimeout(() => root.classList.remove("theme-transition"), 450);
    return;
  }

  // Modern browsers: the new theme grows out of the button like a circle, easing out
  const rect = themeBtn.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(change);
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      {
        duration: 800,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",   // ease out
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }).catch(() => {});
});

// ---------- 2. Mobile menu ----------
const menuBtn = document.getElementById("menu-toggle");
const nav = document.getElementById("site-nav");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuBtn.addEventListener("click", () => {
  setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
});

// Close the menu after tapping a link, or pressing Escape
nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

// ---------- 3. Copy email ----------
const copyBtn = document.getElementById("copy-email");
const copyStatus = document.getElementById("copy-status");
let copyTimer;

copyBtn.addEventListener("click", async () => {
  const email = copyBtn.dataset.email;

  try {
    await navigator.clipboard.writeText(email);
  } catch (err) {
    // Fallback for older browsers or non-HTTPS pages
    const temp = document.createElement("textarea");
    temp.value = email;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }

  // Show a check icon for 1.5 seconds, and tell screen readers
  copyBtn.classList.add("is-copied");
  copyStatus.textContent = "Email copied";
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyBtn.classList.remove("is-copied");
    copyStatus.textContent = "";
  }, 1500);
});

// ---------- 4. Active nav link while scrolling ----------
const navLinks = document.querySelectorAll(".nav__link");
const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === "#" + entry.target.id
          );
        });
        syncNavIndicator();
      });
    },
    // A section counts as "current" when it crosses the middle of the screen
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

// ---------- 5. Missing image fallback ----------
document.querySelectorAll("img").forEach((img) => {
  const markMissing = () => img.classList.add("img-missing", "is-loaded");
  const markLoaded = () => img.classList.add("is-loaded");   // fades the image in
  img.addEventListener("error", markMissing);
  img.addEventListener("load", markLoaded);
  // Handles images that already finished (or failed) before this script ran
  if (img.complete) { img.naturalWidth === 0 ? markMissing() : markLoaded(); }
});

// ---------- 6. Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();


// ==========================================================
// MOTION
// ==========================================================
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- 8. Scroll progress, sticky header shadow, back-to-top ----------
const progress = document.getElementById("progress");
const header = document.querySelector(".site-header");
const toTop = document.getElementById("to-top");
let ticking = false;

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = "scaleX(" + ratio + ")";
  header.classList.toggle("is-scrolled", window.scrollY > 8);
  toTop.classList.toggle("is-visible", window.scrollY > 600);

  // At the very bottom the last section can't reach the middle of the screen,
  // so mark "Contact" as the current one
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    const last = navLinks[navLinks.length - 1];
    navLinks.forEach((l) => l.classList.toggle("is-active", l === last));
    try { syncNavIndicator(); } catch (e) { /* indicator not created yet on first run */ }
  }
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

toTop.addEventListener("click", () => smoothScrollTo(0));

// ---------- 9. Typing effect for the role line ----------
const typedEl = document.getElementById("typed");
if (typedEl && !reduceMotion) {
  const fullText = typedEl.textContent;
  typedEl.textContent = "";
  let i = 0;
  setTimeout(function type() {
    typedEl.textContent = fullText.slice(0, ++i);
    if (i < fullText.length) setTimeout(type, 45);
  }, 700);   // starts just after the hero fades in
}

// ---------- 10. Mouse glow in the hero (mouse only, not touch) ----------
const hero = document.querySelector(".hero");
const glow = document.getElementById("hero-glow");
if (hero && glow && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    glow.style.setProperty("--mx", (e.clientX - r.left) + "px");
    glow.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
}

// ---------- 11. Reveal elements as you scroll to them ----------
// Elements in the same group appear one after another (stagger).
const groups = [
  ".section__head", ".label", ".card",
  ".tech-grid .tech-card", ".hobby-grid .hobby"
];
const revealItems = [];
groups.forEach((selector) => {
  document.querySelectorAll(selector).forEach((el) => {
    // Skip anything inside the hero (it has its own load animation)
    if (el.closest(".hero")) return;
    revealItems.push(el);
  });
});

if (!reduceMotion && "IntersectionObserver" in window) {
  revealItems.forEach((el) => {
    el.classList.add("reveal");
    const siblings = el.parentElement.querySelectorAll(":scope > .reveal");
    const index = [...siblings].indexOf(el);
    el.style.setProperty("--d", Math.min(index, 6) * 0.08 + "s");
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-visible");
      revealObserver.unobserve(el);
      // When the reveal has finished, drop the reveal classes so the normal
      // hover effects (lift, shadow) work without being overridden
      setTimeout(() => {
        el.classList.remove("reveal", "is-visible");
        el.style.removeProperty("--d");
      }, 1200);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  revealItems.forEach((el) => revealObserver.observe(el));
}


// ==========================================================
// SMOOTH SCROLL (ease out) for every #link on the page
// ==========================================================
let scrollFrame = null;

function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function smoothScrollTo(targetY, done) {
  cancelAnimationFrame(scrollFrame);
  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const endY = Math.max(0, Math.min(targetY, maxY));
  const distance = endY - startY;

  if (reduceMotion || Math.abs(distance) < 2) {
    window.scrollTo(0, endY);
    if (done) done();
    return;
  }

  // Longer trips take a bit longer, but never too long
  const duration = Math.min(1300, 600 + Math.abs(distance) * 0.25);
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeOutQuart(t));
    if (t < 1) {
      scrollFrame = requestAnimationFrame(step);
    } else if (done) {
      done();
    }
  }
  scrollFrame = requestAnimationFrame(step);
}

// If you grab the page while it is gliding, stop and let you take over
["wheel", "touchstart", "keydown"].forEach((evt) =>
  window.addEventListener(evt, () => cancelAnimationFrame(scrollFrame), { passive: true })
);

document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const hash = link.getAttribute("href");
  if (hash.length < 2) return;
  const target = document.querySelector(hash);
  if (!target) return;

  e.preventDefault();
  const headerH = header ? header.offsetHeight : 0;
  const y = hash === "#about" ? 0 : target.getBoundingClientRect().top + window.scrollY - headerH + 1;

  // Only replay the entrance if the section is actually far away
  if (Math.abs(y - window.scrollY) > 300) playArrival(target);

  smoothScrollTo(y, () => {
    history.replaceState(null, "", hash);
  });
});

// ==========================================================
// NAV: sliding underline that follows the active / hovered link
// ==========================================================
const indicator = document.createElement("span");
indicator.className = "nav__indicator";
indicator.setAttribute("aria-hidden", "true");
nav.appendChild(indicator);

// Used by the mobile menu so the links slide in one after another
navLinks.forEach((link, i) => link.style.setProperty("--i", i));

function moveIndicator(link) {
  if (!link || window.innerWidth <= 900) {
    indicator.style.opacity = "0";
    return;
  }
  indicator.style.opacity = "1";
  indicator.style.setProperty("--x", link.offsetLeft + "px");
  indicator.style.setProperty("--w", link.offsetWidth + "px");
}

function syncNavIndicator() {
  moveIndicator(nav.querySelector(".nav__link.is-active"));
}

navLinks.forEach((link) => {
  link.addEventListener("mouseenter", () => moveIndicator(link));
  link.addEventListener("focus", () => moveIndicator(link));
});
nav.addEventListener("mouseleave", syncNavIndicator);
nav.addEventListener("focusout", syncNavIndicator);

window.addEventListener("resize", syncNavIndicator);
window.addEventListener("load", () => {
  syncNavIndicator();
  // Turn the glide on after the first placement so it doesn't slide in from the left on load
  requestAnimationFrame(() => indicator.classList.add("is-ready"));
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncNavIndicator);
syncNavIndicator();


// ==========================================================
// ARRIVAL ANIMATION: the section you click to builds in (ease out)
// ==========================================================
function playArrival(section) {
  if (reduceMotion) return;

  // Hero ("About"): restart its rise-in sequence
  if (section.classList.contains("hero")) {
    section.querySelectorAll(".hero__title, .hero__role, .hero__bio, .hero__details, .hero__actions")
      .forEach((el) => {
        el.style.animation = "none";
        void el.offsetWidth;          // force a restart
        el.style.animation = "";
      });
    return;
  }

  // Other sections: heading, cards, logos appear one after another
  const items = section.querySelectorAll(".section__head, .label, .card, .tech-card, .hobby");
  let k = 0;
  items.forEach((el) => {
    if (el.classList.contains("reveal")) return;   // not revealed yet: scroll-reveal will handle it
    el.style.setProperty("--k", k++);
    el.classList.remove("arrive");
    void el.offsetWidth;
    el.classList.add("arrive");
  });

  clearTimeout(section._arriveTimer);
  section._arriveTimer = setTimeout(() => {
    items.forEach((el) => {
      el.classList.remove("arrive");
      el.style.removeProperty("--k");
    });
  }, 250 + k * 70 + 1200);
}