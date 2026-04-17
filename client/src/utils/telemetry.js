const STORAGE_KEY = 'uxTelemetryEvents';
const MAX_EVENTS = 300;

export const trackEvent = (eventName, metadata = {}) => {
  const event = {
    eventName,
    metadata,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const next = [...existing, event].slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Storage should never block UX events.
    console.warn('Telemetry storage failed:', error);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[UX telemetry]', event);
  }
};

export const getTelemetryEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

