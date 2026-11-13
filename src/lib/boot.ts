/** Longest the loading screen stays up, in case the 3D room never reports a first frame. */
const MAX_WAIT_MS = 15000

let done = false

/** Fades out the loading screen from index.html and removes it once the fade ends. Safe to call more than once. */
export function hideBoot() {
  if (done) return
  done = true
  const boot = document.getElementById('boot')
  if (!boot) return
  boot.classList.add('boot-done')
  boot.addEventListener('transitionend', () => boot.remove(), { once: true })
  // reduced-motion setups may skip the transition
  window.setTimeout(() => boot.remove(), 800)
}

window.setTimeout(hideBoot, MAX_WAIT_MS)
