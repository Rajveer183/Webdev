/** Element id of the JSON block that scripts/prerender.mjs writes after the prerendered markup. */
export const SSR_DATA_ID = 'ssr-data'

/**
 * The API responses a prerendered page was built from, or null for the unrendered app shell.
 * Stored as `<script type="application/json">` (never executed), so the CSP needs no inline-script allowance.
 */
export function readSsrData(doc: Document = document): Record<string, unknown> | null {
  const text = doc.getElementById(SSR_DATA_ID)?.textContent
  if (!text) return null
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}
