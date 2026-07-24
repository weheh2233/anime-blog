export type NotificationRequestResult =
  | { readonly kind: "granted" }
  | { readonly kind: "denied" }
  | { readonly kind: "unavailable" }

export function canUseDesktopNotifications(): boolean {
  return typeof Notification !== "undefined"
}

export async function requestDesktopNotifications(): Promise<NotificationRequestResult> {
  if (!canUseDesktopNotifications()) {
    return { kind: "unavailable" }
  }

  if (Notification.permission === "granted") {
    return { kind: "granted" }
  }

  if (Notification.permission === "denied") {
    return { kind: "denied" }
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === "granted" ? { kind: "granted" } : { kind: "denied" }
  } catch (error) {
    if (error instanceof DOMException || error instanceof Error) {
      return { kind: "unavailable" }
    }

    throw error
  }
}

export function sendDesktopNotification(title: string, body: string): NotificationRequestResult {
  if (!canUseDesktopNotifications()) {
    return { kind: "unavailable" }
  }

  if (Notification.permission !== "granted") {
    return { kind: "denied" }
  }

  try {
    new Notification(title, { body })
    return { kind: "granted" }
  } catch (error) {
    if (error instanceof DOMException || error instanceof Error) {
      return { kind: "unavailable" }
    }

    throw error
  }
}

export function playCompletionChime(): boolean {
  if (typeof AudioContext === "undefined") {
    return false
  }

  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(660, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.08)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.2)
    oscillator.onended = () => {
      void context.close()
    }
    return true
  } catch (error) {
    if (error instanceof DOMException || error instanceof Error) {
      return false
    }

    throw error
  }
}
