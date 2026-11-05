type Listener = () => void;

let busy = false;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getNavigationBusy() {
  return busy;
}

export function subscribeNavigationBusy(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startNavigationBusy(minVisibleMs = 700) {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  busy = true;
  emit();
  hideTimer = setTimeout(() => {
    busy = false;
    hideTimer = null;
    emit();
  }, minVisibleMs);
}

export function stopNavigationBusySoon(minVisibleMs = 400) {
  if (!busy) return;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    busy = false;
    hideTimer = null;
    emit();
  }, minVisibleMs);
}
