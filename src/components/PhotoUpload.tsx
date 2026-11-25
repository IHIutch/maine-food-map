import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import {
  ATTESTATION_TEXT,
  PER_PHOTO_CHECKBOX_LABEL,
  acceptAgreement,
  getAgreementStatus,
} from '../server/attestation'
import { downscaleImage } from '../utils/image'
import { button, input, metaLabel, sectionTitle } from './ui'

type PhotoUploadProps = {
  restaurantPublicId: string
  restaurantTitle: string
  isAuthenticated: boolean
}

export function PhotoUpload({
  restaurantPublicId,
  restaurantTitle,
  isAuthenticated,
}: PhotoUploadProps) {
  const fetchAgreement = useServerFn(getAgreementStatus)
  const agree = useServerFn(acceptAgreement)

  const [open, setOpen] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [alt, setAlt] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [perPhoto, setPerPhoto] = useState(false)
  const [agreed, setAgreed] = useState<boolean | null>(null)
  const [agreeing, setAgreeing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (open && isAuthenticated && agreed === null) {
      fetchAgreement({ data: {} }).then(
        (status) => setAgreed(status.agreed),
        () => setAgreed(false),
      )
    }
  }, [open, isAuthenticated, agreed, fetchAgreement])

  async function checkAnonAgreement() {
    if (!email.includes('@')) return
    try {
      const status = await fetchAgreement({ data: { email } })
      setAgreed(status.agreed)
    } catch {
      setAgreed(false)
    }
  }

  async function onFileChange(file: File | undefined) {
    setError(null)
    setBlob(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (!file) return
    try {
      const scaled = await downscaleImage(file)
      setBlob(scaled)
      setPreviewUrl(URL.createObjectURL(scaled))
    } catch {
      setError('That image could not be processed — try a different one.')
    }
  }

  if (done) {
    return (
      <p className="text-ink-soft">Submitted — photos appear after review.</p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={button({ intent: 'secondary' })}
      >
        Add a photo
      </button>
    )
  }

  const needsAgreement = agreed === false

  return (
    <form
      className="max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!blob) {
          setError('Pick a photo first.')
          return
        }
        if (!perPhoto) {
          setError('Please confirm you own the rights to this photo.')
          return
        }
        if (!isAuthenticated && !email.includes('@')) {
          setError('Please enter your email so we can verify your upload.')
          return
        }
        setSubmitting(true)
        setError(null)
        try {
          const form = new FormData()
          form.set('file', new File([blob], 'photo.webp', { type: blob.type }))
          form.set('restaurantPublicId', restaurantPublicId)
          if (alt.trim()) form.set('alt', alt.trim())
          form.set('perPhotoAttested', 'true')
          if (!isAuthenticated) form.set('email', email.trim())
          form.set('website', website)
          const res = await fetch('/api/photos/upload', {
            method: 'POST',
            body: form,
          })
          const json = (await res.json()) as { ok?: boolean; error?: string }
          if (res.ok && json.ok) {
            setDone(true)
            return
          }
          if (json.error === 'AGREEMENT_REQUIRED') {
            setAgreed(false)
            setError('Please review and accept the contributor agreement.')
          } else if (json.error === 'RATE_LIMITED') {
            setError('Too many uploads from this connection — try again later.')
          } else {
            setError('Something went wrong uploading your photo.')
          }
          setSubmitting(false)
        } catch {
          setError('Something went wrong uploading your photo.')
          setSubmitting(false)
        }
      }}
    >
      <h3 className={sectionTitle({ className: 'mb-4' })}>
        Add a photo of {restaurantTitle}
      </h3>

      <label className={metaLabel({ className: 'block mb-2 text-ink-soft' })}>
        Photo (JPEG, PNG, or WebP)
      </label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onFileChange(e.target.files?.[0])}
        className={input({ className: 'mb-4 file:border-0 file:bg-transparent' })}
      />
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview of your upload"
          className="mb-4 max-h-40 rounded-lg border border-ink/20"
        />
      )}

      <label className={metaLabel({ className: 'block mb-2 text-ink-soft' })}>
        Describe the photo (optional, helps screen readers)
      </label>
      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        maxLength={500}
        className={input({ className: 'mb-4' })}
      />

      {!isAuthenticated && (
        <>
          <label className={metaLabel({ className: 'block mb-2 text-ink-soft' })}>
            Your email (we verify uploads before publishing)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={checkAnonAgreement}
            required
            className={input({ className: 'mb-4' })}
          />
        </>
      )}
      {/* Honeypot — hidden from real users, bots fill it */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <label className="mb-4 flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={perPhoto}
          onChange={(e) => setPerPhoto(e.target.checked)}
          className="mt-1"
        />
        {PER_PHOTO_CHECKBOX_LABEL}
      </label>

      {needsAgreement && (
        <div className="mb-4 rounded-xl border border-ink/20 bg-cream p-4">
          <p className={metaLabel({ className: 'mb-2 text-ink-soft' })}>
            Contributor agreement
          </p>
          <p className="mb-4 text-sm text-ink">{ATTESTATION_TEXT}</p>
          <button
            type="button"
            disabled={agreeing}
            onClick={async () => {
              setAgreeing(true)
              setError(null)
              try {
                await agree({
                  data: isAuthenticated ? {} : { email: email.trim() },
                })
                setAgreed(true)
              } catch {
                setError(
                  isAuthenticated
                    ? 'Could not record your agreement — try again.'
                    : 'Enter a valid email above, then agree.',
                )
              }
              setAgreeing(false)
            }}
            className={button({ intent: 'primary', className: 'disabled:opacity-50' })}
          >
            {agreeing ? 'Saving…' : 'Agree'}
          </button>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-tomato">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !blob || needsAgreement}
          className={button({ intent: 'accent', className: 'disabled:opacity-50' })}
        >
          {submitting ? 'Uploading…' : 'Submit photo'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={button({ intent: 'secondary' })}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
