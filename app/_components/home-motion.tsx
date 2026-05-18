'use client'

import { useEffect } from 'react'

export default function HomeMotion({
  navScrolledClass,
  revealInClass,
}: {
  navScrolledClass: string
  revealInClass: string
}) {
  useEffect(() => {
    const nav = document.getElementById('tsv-nav')
    const progress = document.getElementById('tsv-progress')

    function onScroll() {
      const y = window.scrollY || window.pageYOffset
      if (nav) nav.classList.toggle(navScrolledClass, y > 20)
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%'
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(revealInClass)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))

    const fillTimer = setTimeout(() => {
      const fill = document.getElementById('tsv-vcfill')
      const knob = document.getElementById('tsv-vcknob')
      if (fill) fill.style.width = '62%'
      if (knob) knob.style.left = '62%'
    }, 600)

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      clearTimeout(fillTimer)
    }
  }, [navScrolledClass, revealInClass])

  return null
}