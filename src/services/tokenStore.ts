/**
 * Where the session lives — the one thing "Remember me" actually decides.
 *
 *   ticked   → localStorage:   the session survives closing the browser.
 *   unticked → sessionStorage: the session dies with the tab, which is what
 *              someone on a shared lab machine is asking for.
 *
 * The choice has to outlive the session it governs — a token refresh must
 * write the rotated token back to the same place the login put it — so the
 * flag itself lives in localStorage under its own key, never in the storage
 * being switched.
 *
 * Absent flag means persistent: an existing signed-in user must not be
 * logged out just because this shipped.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const PERSIST_KEY = 'auth.persist';

const SESSION_MODE = 'session';
const LOCAL_MODE = 'local';

/** The storage the current session is using. */
function activeStore(): Storage {
    return localStorage.getItem(PERSIST_KEY) === SESSION_MODE ? sessionStorage : localStorage;
}

/** True when the session is meant to survive a browser restart. */
export function isPersistent(): boolean {
    return localStorage.getItem(PERSIST_KEY) !== SESSION_MODE;
}

/**
 * Record the Remember-me choice. Must run *before* the session is written.
 *
 * Also clears the store we are not about to use: without this, logging in
 * once with the box ticked and again with it unticked would leave the first,
 * persistent token sitting in localStorage — still valid, and still there
 * after the browser closes.
 */
export function setPersistence(remember: boolean): void {
    localStorage.setItem(PERSIST_KEY, remember ? LOCAL_MODE : SESSION_MODE);

    const unused = remember ? sessionStorage : localStorage;
    unused.removeItem(TOKEN_KEY);
    unused.removeItem(USER_KEY);
}

export function getToken(): string | null {
    return activeStore().getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    activeStore().setItem(TOKEN_KEY, token);
}

export function getStoredUser(): string | null {
    return activeStore().getItem(USER_KEY);
}

export function setStoredUser(json: string): void {
    activeStore().setItem(USER_KEY, json);
}

/** Wipe both stores — a logout must not leave a token in the other one. */
export function clearStoredSession(): void {
    for (const store of [localStorage, sessionStorage]) {
        store.removeItem(TOKEN_KEY);
        store.removeItem(USER_KEY);
    }
}
