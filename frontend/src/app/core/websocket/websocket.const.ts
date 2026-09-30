/** Initial delay before first reconnect attempt (ms). */
export const WS_RECONNECT_BASE_MS = 500;

/** Cap for exponential backoff (ms). */
export const WS_RECONNECT_MAX_MS = 15_000;
