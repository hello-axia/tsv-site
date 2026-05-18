'use client'

import { useState, useEffect } from 'react'
import styles from '../page.module.css'

export default function PilotModal() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [districtName, setDistrictName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    function onOpen() { setOpen(true) }
    window.addEventListener('open-pilot-modal', onOpen)
    return () => window.removeEventListener('open-pilot-modal', onOpen)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function close() {
    setOpen(false)
    setTimeout(() => {
      setDone(false)
      setError('')
      setDistrictName('')
      setContactName('')
      setEmail('')
      setRole('')
      setMessage('')
    }, 250)
  }

  async function handleSubmit() {
    if (!districtName.trim() || !contactName.trim() || !email.trim()) {
      setError('Please fill in district, name, and email.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/pilot-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district_name: districtName.trim(),
          contact_name: contactName.trim(),
          email: email.trim(),
          role: role.trim(),
          message: message.trim(),
        }),
      })

      setSubmitting(false)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setDone(true)
    } catch {
      setSubmitting(false)
      setError('Something went wrong. Please try again.')
    }
  }

  if (!open) return null

  return (
    <div className={styles.modalBackdrop} onClick={close}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.modalClose} onClick={close} aria-label="Close">
          &times;
        </button>

        {done ? (
          <div className={styles.modalDone}>
            <div className={styles.modalDoneMark}>&#10003;</div>
            <h2 className={styles.modalTitle}>Request received.</h2>
            <p className={styles.modalSub}>
              Thank you. We&apos;ll be in touch at the email you provided to walk you
              through a pilot.
            </p>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={close}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <span className={styles.modalEyebrow}>Pilot Partnerships</span>
            <h2 className={styles.modalTitle}>Request a pilot.</h2>
            <p className={styles.modalSub}>
              Tell us a little about your district and we&apos;ll reach out.
            </p>

            <div className={styles.modalFields}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>District / School *</label>
                <input
                  className={styles.modalInput}
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  placeholder="Chaffey Joint Unified School District"
                />
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Your name *</label>
                  <input
                    className={styles.modalInput}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="First Last"
                  />
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Role</label>
                  <input
                    className={styles.modalInput}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Curriculum Director"
                  />
                </div>
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Email *</label>
                <input
                  className={styles.modalInput}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@district.org"
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Anything else?</label>
                <textarea
                  className={styles.modalTextarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional — questions, timeline, class count..."
                  rows={3}
                />
              </div>
            </div>

            {error && <p className={styles.modalError}>{error}</p>}

            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.modalSubmit}`}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Submit Request'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}