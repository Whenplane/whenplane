/**
 * Set a cookie
 * @param cookieName The name of the cookie
 * @param cookieValue The value of the cookie
 * @param daysTilExpiry The number of days until the cookie expires (defaults to 10 years)
 */
export function setCookie(cookieName: string, cookieValue: string, daysTilExpiry = 3650) {
  const d = new Date();
  d.setTime(d.getTime() + (daysTilExpiry * 24 * 60 * 60 * 1000));
  const expires = "expires="+d.toUTCString();
  document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/";
}

/**
 * Gets a cookie
 * @param cookieName the name of the cookie
 * @returns {string|undefined} The cookie value
 */
export function getCookie(cookieName: string) {
  const name = cookieName + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return undefined;
}