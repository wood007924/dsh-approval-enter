/**
 * Host half of the approval-enter bundle.
 *
 * The capability lives entirely in the Client module (client.js): it moves
 * keyboard focus to the pending approval card, and forwards Enter/Escape through
 * that card's own handler when focus sits elsewhere. The Host half exists so the
 * bundle has a loadable entry row; it registers nothing.
 */
export function apply() {}
