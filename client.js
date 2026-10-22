window.__ModuleLoader__.load({
  id: 'dsh-approval-enter',
  factory() {
    // Structural hooks published by @deepseek-ai/dsh-client-ui-approval. Its CSS
    // class names are build-hashed, so only these data attributes are stable.
    const PANEL = '[data-approval-key]'
    const SCROLL = '[data-approval-scroll]'
    // The Host's own handler ignores keys while a text control owns the event;
    // keep that rule so Enter still types a newline or sends a draft.
    const EDITABLE = [
      'input',
      'textarea',
      'select',
      '[contenteditable="true"]',
      '[contenteditable=""]',
      '[role="textbox"]',
    ].join(', ')

    /** The newest pending approval card, or null. */
    function currentPanel() {
      const panels = document.querySelectorAll(PANEL)
      return panels.length === 0 ? null : panels[panels.length - 1]
    }

    /** The card's keyboard-focusable region (published with tabindex=0). */
    function focusTarget(panel) {
      return panel.querySelector(SCROLL) || panel
    }

    function isEditable(node) {
      return (
        node !== null &&
        node !== undefined &&
        node.nodeType === 1 &&
        typeof node.closest === 'function' &&
        node.closest(EDITABLE) !== null
      )
    }

    /**
     * Move focus onto the card so the Host's own Enter/Escape handler receives
     * the next keystroke. Skipped while a text control holds focus, so an
     * approval appearing in the background never interrupts typing.
     */
    function focusPanel(panel) {
      try {
        if (panel.contains(document.activeElement)) return
        const active = document.activeElement
        if (active !== null && active !== document.body && isEditable(active)) return
        const target = focusTarget(panel)
        if (typeof target.focus === 'function') target.focus({ preventScroll: true })
      } catch (error) {
        // Focus is a best-effort improvement; the key handler below still works.
      }
    }

    /**
     * Hand the key to the card's own handler: focus its published region and
     * replay the keystroke there, so the answer travels through the Host's
     * pending-request lock (and its IME and repeat guards) exactly once.
     */
    function forward(panel, key) {
      try {
        if (!panel.contains(document.activeElement)) focusPanel(panel)
        const target = panel.contains(document.activeElement)
          ? document.activeElement
          : focusTarget(panel)
        target.dispatchEvent(
          new KeyboardEvent('keydown', {
            key,
            code: key === 'Enter' ? 'Enter' : 'Escape',
            bubbles: true,
            cancelable: true,
          }),
        )
      } catch (error) {
        // A card that refuses the key stays answerable by pointer.
      }
    }

    /**
     * Capture-phase fallback for a card that lost focus (the user clicked the
     * transcript, Tab moved elsewhere, or nothing was focused at all). While the
     * card itself holds focus its own handler owns every key, so this listener
     * stays out of the way to avoid answering twice.
     */
    function onKeyDown(event) {
      if (event.defaultPrevented) return
      const key = event.key
      if (key !== 'Enter' && key !== 'Escape') return
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      if (event.isComposing || event.keyCode === 229) return

      const panel = currentPanel()
      if (panel === null) return
      if (panel.contains(document.activeElement)) return
      if (isEditable(event.target)) return

      event.preventDefault()
      event.stopPropagation()
      if (event.repeat) return
      forward(panel, key)
    }

    /** Watch for approval cards appearing and own the keys they cannot reach. */
    function install() {
      let focused = null
      let scheduled = false

      const scan = () => {
        scheduled = false
        const panel = currentPanel()
        if (panel === null) {
          focused = null
          return
        }
        if (panel === focused) return
        focused = panel
        focusPanel(panel)
      }

      // One scan per animation frame at most: the transcript mutates constantly
      // while streaming, and the card only needs to be noticed, not re-examined.
      const observer = new MutationObserver(() => {
        if (scheduled) return
        scheduled = true
        requestAnimationFrame(scan)
      })
      observer.observe(document.documentElement, { childList: true, subtree: true })
      document.addEventListener('keydown', onKeyDown, true)
      scan()

      return () => {
        observer.disconnect()
        document.removeEventListener('keydown', onKeyDown, true)
      }
    }

    return {
      apply(ctx) {
        ctx.effect(() => install(), 'approval-enter: Enter confirms the pending approval')
      },
    }
  },
})
