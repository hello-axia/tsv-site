'use client'

import { useEffect } from 'react'

export default function LessonInteractions() {
  useEffect(() => {
    // Chart tooltip
    const tooltip = document.getElementById('chart-tooltip')
    const cleanups: Array<() => void> = []

    if (tooltip) {
      document.querySelectorAll<HTMLElement>('.chart-bar').forEach((bar) => {
        const show = () => {
          const rect = bar.getBoundingClientRect()
          const wrapper = bar.closest('.lesson-chart-wrapper') as HTMLElement | null
          if (!wrapper) return
          const wrapperRect = wrapper.getBoundingClientRect()
          const year = bar.dataset.year
          const turnout = bar.dataset.turnout
          const type = bar.dataset.type
          tooltip.innerHTML =
            '<strong>' + year + '</strong>' +
            '<span class="tt-turnout">' + turnout + '</span>' +
            '<span class="tt-type">' + type + '</span>'
          tooltip.style.left = (rect.left - wrapperRect.left + rect.width / 2) + 'px'
          tooltip.style.top = (rect.top - wrapperRect.top - 8) + 'px'
          tooltip.classList.add('visible')
        }
        const hide = () => tooltip.classList.remove('visible')
        const touch = (e: Event) => { e.preventDefault(); show() }

        bar.addEventListener('mouseenter', show)
        bar.addEventListener('mouseleave', hide)
        bar.addEventListener('touchstart', touch)

        cleanups.push(() => {
          bar.removeEventListener('mouseenter', show)
          bar.removeEventListener('mouseleave', hide)
          bar.removeEventListener('touchstart', touch)
        })
      })

      const docTouch = (e: TouchEvent) => {
        if (!(e.target as HTMLElement).closest('.chart-bar')) {
          tooltip.classList.remove('visible')
        }
      }
      document.addEventListener('touchstart', docTouch)
      cleanups.push(() => document.removeEventListener('touchstart', docTouch))
    }

    // Cascade
    const cascadeBtns = document.querySelectorAll<HTMLButtonElement>('.lesson-cascade-next')
    cascadeBtns.forEach((btn) => {
      const handler = () => {
        const cascade = btn.closest('.lesson-cascade') as HTMLElement | null
        if (!cascade) return
        let stage = parseInt(cascade.dataset.stage || '0', 10)
        stage++
        cascade.dataset.stage = String(stage)
        const next = cascade.querySelector('.lesson-cascade-stage[data-stage="' + stage + '"]')
        if (next) next.classList.add('revealed')
        if (stage >= 4) {
          btn.style.display = 'none'
        } else {
          btn.textContent = 'And then? →'
        }
      }
      btn.addEventListener('click', handler)
      cleanups.push(() => btn.removeEventListener('click', handler))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return null
}