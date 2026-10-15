// Apply the saved or system theme before first paint to avoid a flash.
// Loaded as a blocking script from <head> (not inline, so the CSP can forbid inline scripts).
;(function () {
  try {
    var t = localStorage.getItem('statsphere-theme')
    if (t !== 'light' && t !== 'dark') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', t)
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light')
  }
})()
