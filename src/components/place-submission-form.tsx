import type { FileUploadFileRejectDetails } from '@ark-ui/react/file-upload'

import { FileUpload } from '@ark-ui/react/file-upload'
import { useForm } from '@tanstack/react-form'
import * as React from 'react'

import type {
  MaineLocation,
  NormalizedPlaceSubmission,
  PlaceSubmissionHour,
  PlaceSubmissionImage,
} from '../utils/place-submission'

import {
  ACCEPTED_PHOTO_TYPES,
  ALT_TEXT_GUIDANCE,
  createDefaultSubmissionValues,
  CUISINES,
  DAYS,
  MAX_PHOTO_COUNT,
  MAX_PHOTO_SIZE,
  mockMaineAddressSource,
  normalizePlaceSubmission,
  PLACE_TYPES,
  placeSubmissionSchema,
} from '../utils/place-submission'
import {
  button,
  fieldError,
  fieldHint,
  fieldLabel,
  formSection,
  input,
} from './ui'

const photoCreditOptions = [
  { value: 'name', label: 'Your name' },
  { value: 'social', label: 'Social handle' },
  { value: 'organization', label: 'Business or organization' },
  { value: 'anonymous', label: 'Anonymous' },
] as const

const uploadErrorMessages = {
  FILE_INVALID_TYPE: 'Photos must be JPEG, PNG, or WebP images.',
  FILE_TOO_LARGE: 'Each photo must be 10 MB or smaller.',
  TOO_MANY_FILES: 'Choose no more than six photos.',
  FILE_EXISTS: 'That photo has already been added.',
} as const

function flattenErrors(errors: readonly unknown[]): string[] {
  const messages = errors.flatMap((error): string[] => {
    if (!error)
      return []
    if (typeof error === 'string')
      return [error]
    if (Array.isArray(error))
      return flattenErrors(error)
    if (typeof error === 'object' && 'message' in error && typeof error.message === 'string')
      return [error.message]
    return []
  })

  return [...new Set(messages)]
}

function FieldErrors({
  errors,
  id,
  show,
}: {
  errors: readonly unknown[]
  id: string
  show: boolean
}) {
  const messages = show ? flattenErrors(errors) : []
  if (messages.length === 0)
    return null

  return (
    <div id={id} className={fieldError()} role="alert">
      {messages.join(' ')}
    </div>
  )
}

function newImageId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getUploadErrors(details: FileUploadFileRejectDetails) {
  return details.files.flatMap(({ file, errors }) =>
    errors.map((error) => {
      const message = uploadErrorMessages[error as keyof typeof uploadErrorMessages]
        ?? 'This file could not be added.'
      return `${file.name}: ${message}`
    }),
  )
}

function AddressAutocomplete({
  errors,
  location,
  onBlur,
  onChange,
  showErrors,
}: {
  errors: readonly unknown[]
  location: MaineLocation | null
  onBlur: () => void
  onChange: (location: MaineLocation | null) => void
  showErrors: boolean
}) {
  const [query, setQuery] = React.useState(location?.label ?? '')
  const [suggestions, setSuggestions] = React.useState<readonly MaineLocation[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const listboxId = React.useId()

  React.useEffect(() => {
    if (location && query === location.label)
      return

    let active = true
    void mockMaineAddressSource.search(query).then((results) => {
      if (!active)
        return
      setSuggestions(results)
      setIsOpen(results.length > 0)
      setActiveIndex(-1)
    })

    return () => {
      active = false
    }
  }, [location, query])

  function selectSuggestion(suggestion: MaineLocation) {
    setQuery(suggestion.label)
    onChange({ ...suggestion })
    setSuggestions([])
    setIsOpen(false)
    setActiveIndex(-1)
  }

  return (
    <div className="relative">
      <label className={fieldLabel()} htmlFor="location-query">
        Maine address
        {' '}
        <span aria-hidden="true" className="text-red-800">*</span>
      </label>
      <input
        id="location-query"
        className={input({ className: 'aria-invalid:border-red-700' })}
        value={query}
        placeholder="Start typing a street, town, or ZIP"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-describedby="location-hint location-errors"
        aria-expanded={isOpen}
        aria-required="true"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-invalid={showErrors && flattenErrors(errors).length > 0}
        autoComplete="street-address"
        onBlur={() => {
          onBlur()
          setIsOpen(false)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          onChange(null)
        }}
        onFocus={() => setIsOpen(suggestions.length > 0)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && suggestions.length > 0) {
            event.preventDefault()
            setIsOpen(true)
            setActiveIndex(index => Math.min(index + 1, suggestions.length - 1))
          }
          else if (event.key === 'ArrowUp' && suggestions.length > 0) {
            event.preventDefault()
            setActiveIndex(index => Math.max(index - 1, 0))
          }
          else if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
            event.preventDefault()
            selectSuggestion(suggestions[activeIndex])
          }
          else if (event.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      />
      <p id="location-hint" className={fieldHint()}>
        This demo searches a small local list of Maine addresses. Choose a suggestion to save its structured location.
      </p>
      <FieldErrors id="location-errors" errors={errors} show={showErrors} />

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-950/10"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              id={`${listboxId}-${index}`}
              key={suggestion.label}
              className="cursor-pointer rounded-lg p-3 text-sm text-stone-800 hover:bg-stone-100 data-[active=true]:bg-blueberry-50 data-[active=true]:text-blueberry-900"
              data-active={index === activeIndex}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => {
                event.preventDefault()
                selectSuggestion(suggestion)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ToggleChoices({
  choices,
  describedBy,
  invalid = false,
  legendId,
  onBlur,
  onChange,
  required = false,
  values,
}: {
  choices: readonly { value: string, label: string }[]
  describedBy?: string
  invalid?: boolean
  legendId: string
  onBlur: () => void
  onChange: (values: string[]) => void
  required?: boolean
  values: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-labelledby={legendId}>
      {choices.map(choice => (
        <label key={choice.value} className="cursor-pointer">
          <input
            className="peer sr-only"
            type="checkbox"
            value={choice.value}
            checked={values.includes(choice.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            onBlur={onBlur}
            onChange={(event) => {
              onChange(event.target.checked
                ? [...values, choice.value]
                : values.filter(value => value !== choice.value))
            }}
          />
          <span className="inline-flex min-h-11 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 transition peer-checked:border-blueberry-500 peer-checked:bg-blueberry-50 peer-checked:text-blueberry-800 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blueberry-600">
            {choice.label}
          </span>
        </label>
      ))}
    </div>
  )
}

function hourError(hour: PlaceSubmissionHour) {
  if (hour.closed)
    return null
  if (!hour.open || !hour.close)
    return 'Add both an opening and closing time.'
  if (hour.open >= hour.close)
    return 'Closing time must be later than opening time.'
  return null
}

function Confirmation({
  onStartOver,
  payload,
}: {
  onStartOver: () => void
  payload: NormalizedPlaceSubmission
}) {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-stone-50 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-blueberry-100 bg-white p-6 shadow-xl shadow-blueberry-900/5 sm:p-10">
        <div className="mb-7 flex size-14 items-center justify-center rounded-full bg-blueberry-50 text-blueberry-700">
          <span aria-hidden="true" className="icon-[material-symbols--check-rounded] size-8" />
        </div>
        <p className="font-mono text-xs font-semibold tracking-[0.14em] text-blueberry-700 uppercase">Mock submission complete</p>
        <h1 className="mt-3 font-pretrona text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
          Thanks for sharing
          {' '}
          <span className="text-blueberry-600">{payload.title}</span>
          .
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
          This client-only preview did not send data or upload files. The normalized payload below is what a future submission service could receive.
        </p>

        <dl className="mt-8 grid gap-4 rounded-2xl bg-stone-50 p-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Location</dt>
            <dd className="mt-1 font-medium text-stone-900">
              {payload.location.city}
              , Maine
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Place types</dt>
            <dd className="mt-1 font-medium text-stone-900">{payload.placeTypes.join(', ')}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Photos</dt>
            <dd className="mt-1 font-medium text-stone-900">{payload.images.length}</dd>
          </div>
        </dl>

        <details className="mt-8 rounded-2xl border border-stone-200 bg-stone-950 text-stone-100">
          <summary className="cursor-pointer px-5 py-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry-400">
            View normalized payload
          </summary>
          <pre className="max-h-128 overflow-auto border-t border-stone-700 p-5 text-xs leading-6">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>

        <button className={button({ scheme: 'blueberry', size: 'lg', className: 'mt-8' })} type="button" onClick={onStartOver}>
          Start another submission
        </button>
      </div>
    </main>
  )
}

export function PlaceSubmissionForm() {
  const [defaultValues] = React.useState(createDefaultSubmissionValues)
  const [confirmation, setConfirmation] = React.useState<NormalizedPlaceSubmission | null>(null)
  const [showErrorSummary, setShowErrorSummary] = React.useState(false)
  const [tagDraft, setTagDraft] = React.useState('')
  const [uploadErrors, setUploadErrors] = React.useState<string[]>([])

  const form = useForm({
    defaultValues,
    validators: {
      onBlur: placeSubmissionSchema,
      onSubmit: placeSubmissionSchema,
    },
    onSubmitInvalid: () => {
      setShowErrorSummary(true)
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        firstInvalid?.focus()
      })
    },
    onSubmit: ({ value }) => {
      setShowErrorSummary(false)
      setConfirmation(normalizePlaceSubmission(value))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  })

  if (confirmation) {
    return (
      <Confirmation
        payload={confirmation}
        onStartOver={() => {
          form.reset()
          setConfirmation(null)
          setTagDraft('')
          setUploadErrors([])
          setShowErrorSummary(false)
          window.scrollTo({ top: 0 })
        }}
      />
    )
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-stone-50">
      <div className="border-b border-stone-200 bg-white px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <h1 className="mt-3 max-w-3xl font-pretrona text-5xl leading-[0.98] font-semibold tracking-tight text-stone-950 sm:text-6xl">
            Put a great Maine food spot on the map.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
            Share the practical details and the reason you would send a friend. This is a client-only preview; nothing is saved or uploaded.
          </p>
        </div>
      </div>

      <form
        className="mx-auto grid max-w-4xl gap-6 px-4 py-8 sm:px-6 sm:py-12"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        {showErrorSummary && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950" role="alert" aria-live="assertive">
            <p className="font-semibold">A few details still need attention.</p>
            <p className="mt-1 text-sm">The first incomplete field is focused. Review the messages below and try again.</p>
          </div>
        )}

        <fieldset className={formSection()}>
          <legend className="px-1 font-pretrona text-2xl font-semibold tracking-tight text-stone-950">Place Details</legend>
          <p className="mt-1 mb-6 text-sm text-stone-500">Start with the name and the reason this place belongs on the map.</p>

          <div className="grid gap-6">
            <form.Field name="title">
              {field => (
                <div>
                  <label className={fieldLabel()} htmlFor={field.name}>
                    Place name
                    {' '}
                    <span aria-hidden="true" className="text-red-800">*</span>
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    className={input({ className: 'aria-invalid:border-red-700' })}
                    value={field.state.value}
                    aria-describedby={`${field.name}-hint ${field.name}-errors`}
                    aria-invalid={(field.state.meta.isTouched || showErrorSummary) && !field.state.meta.isValid}
                    aria-required="true"
                    autoComplete="organization"
                    onBlur={field.handleBlur}
                    onChange={event => field.handleChange(event.target.value)}
                  />
                  <p id={`${field.name}-hint`} className={fieldHint()}>Use the name someone would see on the sign.</p>
                  <FieldErrors id={`${field.name}-errors`} errors={field.state.meta.errors} show={field.state.meta.isTouched || showErrorSummary} />
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {field => (
                <div>
                  <label className={fieldLabel()} htmlFor={field.name}>
                    Why is it worth a stop?
                    {' '}
                    <span aria-hidden="true" className="text-red-800">*</span>
                  </label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    className={input({ className: 'min-h-36 resize-y aria-invalid:border-red-700' })}
                    value={field.state.value}
                    aria-describedby={`${field.name}-hint ${field.name}-errors`}
                    aria-invalid={(field.state.meta.isTouched || showErrorSummary) && !field.state.meta.isValid}
                    aria-required="true"
                    onBlur={field.handleBlur}
                    onChange={event => field.handleChange(event.target.value)}
                  />
                  <p id={`${field.name}-hint`} className={fieldHint()}>A dish, ritual, view, or story is more useful than a generic review.</p>
                  <FieldErrors id={`${field.name}-errors`} errors={field.state.meta.errors} show={field.state.meta.isTouched || showErrorSummary} />
                </div>
              )}
            </form.Field>
          </div>
        </fieldset>

        <fieldset className={formSection()}>
          <legend className="px-1 font-pretrona text-2xl font-semibold tracking-tight text-stone-950">Location</legend>
          <p className="mt-1 mb-6 text-sm text-stone-500">Select a structured address so the future map pin has coordinates.</p>
          <form.Field name="location">
            {field => (
              <AddressAutocomplete
                location={field.state.value}
                errors={field.state.meta.errors}
                showErrors={field.state.meta.isTouched || showErrorSummary}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
        </fieldset>

        <fieldset className={formSection()}>
          <legend className="px-1 font-pretrona text-2xl font-semibold tracking-tight text-stone-950">Classification</legend>
          <p className="mt-1 mb-6 text-sm text-stone-500">Help people understand what kind of place it is and what it serves.</p>

          <div className="grid gap-8">
            <form.Field name="placeTypes">
              {field => (
                <div>
                  <p id="place-types-label" className={fieldLabel()}>
                    Place type
                    {' '}
                    <span aria-hidden="true" className="text-red-800">*</span>
                  </p>
                  <ToggleChoices
                    choices={PLACE_TYPES}
                    describedBy="place-types-errors"
                    invalid={(field.state.meta.isTouched || showErrorSummary) && !field.state.meta.isValid}
                    legendId="place-types-label"
                    required
                    values={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                  />
                  <FieldErrors id="place-types-errors" errors={field.state.meta.errors} show={field.state.meta.isTouched || showErrorSummary} />
                </div>
              )}
            </form.Field>

            <form.Field name="cuisines">
              {field => (
                <div>
                  <p id="cuisines-label" className={fieldLabel()}>
                    Cuisine
                    <span className="font-normal text-stone-500">(optional)</span>
                  </p>
                  <ToggleChoices
                    choices={CUISINES}
                    legendId="cuisines-label"
                    values={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="tags">
              {(field) => {
                function addTag() {
                  const tag = tagDraft.trim()
                  if (!tag)
                    return
                  if (!field.state.value.some(value => value.toLocaleLowerCase() === tag.toLocaleLowerCase()))
                    field.handleChange([...field.state.value, tag])
                  setTagDraft('')
                }

                return (
                  <div>
                    <label className={fieldLabel()} htmlFor="tag-draft">
                      Features and vibe
                      <span className="font-normal text-stone-500">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="tag-draft"
                        className={input()}
                        value={tagDraft}
                        placeholder="Waterfront, late-night, kid-friendly…"
                        onBlur={field.handleBlur}
                        onChange={event => setTagDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ',') {
                            event.preventDefault()
                            addTag()
                          }
                        }}
                      />
                      <button className={button({ scheme: 'outline' })} type="button" onClick={addTag}>Add</button>
                    </div>
                    <p className={fieldHint()}>Press Enter or comma to add a freeform tag.</p>
                    {field.state.value.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Added features and vibe tags">
                        {field.state.value.map(tag => (
                          <li key={tag} className="inline-flex items-center gap-1 rounded-full bg-stone-100 py-1 pr-1 pl-3 text-sm text-stone-700">
                            <span>{tag}</span>
                            <button
                              className="flex size-8 items-center justify-center rounded-full hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-blueberry-600"
                              type="button"
                              aria-label={`Remove ${tag}`}
                              onClick={() => field.handleChange(field.state.value.filter(value => value !== tag))}
                            >
                              <span aria-hidden="true" className="icon-[material-symbols--close-rounded] size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              }}
            </form.Field>
          </div>
        </fieldset>

        <fieldset className={formSection()}>
          <legend className="px-1 font-pretrona text-2xl font-semibold tracking-tight text-stone-950">Hours</legend>
          <p className="mt-1 mb-6 text-sm text-stone-500">Every day starts closed. Open a day to add one same-day interval.</p>

          <form.Field name="hours">
            {field => (
              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200">
                {field.state.value.map((hour, index) => {
                  const error = hourError(hour)
                  const showError = Boolean(error && (field.state.meta.isTouched || showErrorSummary))

                  function updateHour(nextHour: PlaceSubmissionHour) {
                    field.handleChange(field.state.value.map((value, valueIndex) => valueIndex === index ? nextHour : value))
                  }

                  return (
                    <div key={hour.day} className="grid gap-3 p-4 sm:grid-cols-[8rem_8rem_1fr] sm:items-start">
                      <div className="pt-2 text-sm font-semibold text-stone-900">{DAYS[index].label}</div>
                      <label>
                        <span className="sr-only">
                          {DAYS[index].label}
                          {' '}
                          status
                        </span>
                        <select
                          className={input({ className: 'min-h-11' })}
                          value={hour.closed ? 'closed' : 'open'}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            const isOpen = event.target.value === 'open'
                            updateHour({
                              ...hour,
                              closed: !isOpen,
                              open: isOpen ? (hour.open === '00:00' ? '09:00' : hour.open) : '00:00',
                              close: isOpen ? (hour.close === '00:00' ? '17:00' : hour.close) : '00:00',
                            })
                          }}
                        >
                          <option value="closed">Closed</option>
                          <option value="open">Open</option>
                        </select>
                      </label>
                      {hour.closed
                        ? <p className="pt-2 text-sm text-stone-500">No hours</p>
                        : (
                            <div>
                              <div className="grid grid-cols-2 gap-2">
                                <label>
                                  <span className="sr-only">
                                    {DAYS[index].label}
                                    {' '}
                                    opening time
                                  </span>
                                  <input
                                    className={input({ className: 'min-h-11 aria-invalid:border-red-700' })}
                                    type="time"
                                    required
                                    value={hour.open}
                                    aria-invalid={showError}
                                    aria-describedby={showError ? `hours-${hour.day}-error` : undefined}
                                    onBlur={field.handleBlur}
                                    onChange={event => updateHour({ ...hour, open: event.target.value })}
                                  />
                                </label>
                                <label>
                                  <span className="sr-only">
                                    {DAYS[index].label}
                                    {' '}
                                    closing time
                                  </span>
                                  <input
                                    className={input({ className: 'min-h-11 aria-invalid:border-red-700' })}
                                    type="time"
                                    required
                                    value={hour.close}
                                    aria-invalid={showError}
                                    aria-describedby={showError ? `hours-${hour.day}-error` : undefined}
                                    onBlur={field.handleBlur}
                                    onChange={event => updateHour({ ...hour, close: event.target.value })}
                                  />
                                </label>
                              </div>
                              {showError && <p id={`hours-${hour.day}-error`} className={fieldError()} role="alert">{error}</p>}
                            </div>
                          )}
                    </div>
                  )
                })}
              </div>
            )}
          </form.Field>
        </fieldset>

        <fieldset className={formSection()}>
          <legend className="px-1 font-pretrona text-2xl font-semibold tracking-tight text-stone-950">Photos</legend>
          <p className="mt-1 mb-6 text-sm text-stone-500">Optional. Add up to six images; the first image becomes the cover.</p>

          <form.Field name="images">
            {field => (
              <div>
                <FileUpload.Root
                  acceptedFiles={field.state.value.map(image => image.file)}
                  accept={[...ACCEPTED_PHOTO_TYPES]}
                  maxFiles={MAX_PHOTO_COUNT}
                  maxFileSize={MAX_PHOTO_SIZE}
                  onFileChange={(details) => {
                    const hasNewFiles = details.acceptedFiles.some(file =>
                      !field.state.value.some(image => image.file === file),
                    )
                    const nextImages = details.acceptedFiles.map((file): PlaceSubmissionImage =>
                      field.state.value.find(image => image.file === file) ?? {
                        id: newImageId(),
                        file,
                        altText: '',
                      },
                    )
                    field.handleChange(nextImages)
                    if (hasNewFiles || nextImages.length === 0) {
                      form.setFieldValue('grantsUsageRights', false)
                    }
                    setUploadErrors(details.rejectedFiles.length > 0
                      ? getUploadErrors({ files: details.rejectedFiles })
                      : [])
                  }}
                  onFileReject={details => setUploadErrors(getUploadErrors(details))}
                >
                  <FileUpload.HiddenInput />
                  <FileUpload.Dropzone className="group flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center transition data-dragging:border-blueberry-500 data-dragging:bg-blueberry-50">
                    <span aria-hidden="true" className="icon-[material-symbols--add-photo-alternate-outline-rounded] size-8 text-blueberry-600" />
                    <p className="mt-3 font-semibold text-stone-900">Drop photos here</p>
                    <p className="mt-1 text-sm text-stone-500">JPEG, PNG, or WebP · 10 MB each · six maximum</p>
                    <FileUpload.Trigger className={button({ scheme: 'outline', className: 'mt-4 bg-white' })}>
                      Browse photos
                    </FileUpload.Trigger>
                  </FileUpload.Dropzone>

                  {uploadErrors.length > 0 && (
                    <ul className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900" role="alert">
                      {uploadErrors.map(error => <li key={error}>{error}</li>)}
                    </ul>
                  )}
                  <FieldErrors id="images-errors" errors={field.state.meta.errors} show={field.state.meta.isTouched || showErrorSummary} />

                  {field.state.value.length > 0 && (
                    <FileUpload.ItemGroup className="mt-5 grid gap-4">
                      {field.state.value.map((image, index) => (
                        <FileUpload.Item key={image.id} file={image.file} className="grid gap-4 rounded-2xl border border-stone-200 p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-start">
                          <FileUpload.ItemPreview className="relative aspect-4/3 overflow-hidden rounded-xl bg-stone-100">
                            <FileUpload.ItemPreviewImage className="size-full object-cover" alt="" />
                            {index === 0 && <span className="absolute top-2 left-2 rounded-full bg-blueberry-700 px-2 py-1 text-xs font-semibold text-white">Cover</span>}
                          </FileUpload.ItemPreview>
                          <div className="min-w-0">
                            <FileUpload.ItemName className="block truncate text-sm font-semibold text-stone-900" />
                            <FileUpload.ItemSizeText className="mt-0.5 block text-xs text-stone-500" />
                            <label className={`${fieldLabel()} mt-4`} htmlFor={`alt-${image.id}`}>
                              Alt text
                              <span className="font-normal text-stone-500">(optional)</span>
                            </label>
                            <textarea
                              id={`alt-${image.id}`}
                              className={input({ className: 'min-h-24 resize-y' })}
                              value={image.altText}
                              placeholder={ALT_TEXT_GUIDANCE}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                const altText = event.target.value
                                field.handleChange(field.state.value.map(item => item.id === image.id ? { ...item, altText } : item))
                              }}
                            />
                            <p className={fieldHint()}>{ALT_TEXT_GUIDANCE}</p>
                          </div>
                          <FileUpload.ItemDeleteTrigger
                            className="flex size-11 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry-600"
                            type="button"
                            aria-label={`Remove ${image.file.name}`}
                          >
                            <span aria-hidden="true" className="icon-[material-symbols--delete-outline-rounded] size-5" />
                          </FileUpload.ItemDeleteTrigger>
                        </FileUpload.Item>
                      ))}
                    </FileUpload.ItemGroup>
                  )}
                </FileUpload.Root>

                <p className="mt-4 rounded-xl bg-blueberry-50 px-4 py-3 text-sm text-blueberry-900">
                  Preview only: image files stay in this browser and are never uploaded.
                </p>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={state => state.values.images.length}>
            {imageCount => imageCount > 0
              ? (
                  <div className="mt-8 grid gap-6 border-t border-stone-200 pt-7">
                    <form.Field name="photoCredit.type">
                      {field => (
                        <div>
                          <p id="photo-credit-type-label" className={fieldLabel()}>
                            Photo attribution
                            <span aria-hidden="true" className="text-red-800">*</span>
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="photo-credit-type-label">
                            {photoCreditOptions.map(option => (
                              <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 has-checked:border-blueberry-500 has-checked:bg-blueberry-50">
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={option.value}
                                  checked={field.state.value === option.value}
                                  onBlur={field.handleBlur}
                                  onChange={() => {
                                    field.handleChange(option.value)
                                    if (option.value === 'anonymous')
                                      form.setFieldValue('photoCredit.value', '')
                                  }}
                                />
                                <span className="text-sm font-medium text-stone-800">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </form.Field>

                    <form.Subscribe selector={state => state.values.photoCredit.type}>
                      {creditType => creditType !== 'anonymous'
                        ? (
                            <form.Field name="photoCredit.value">
                              {field => (
                                <div>
                                  <label className={fieldLabel()} htmlFor={field.name}>
                                    Credit as
                                    <span aria-hidden="true" className="text-red-800">*</span>
                                  </label>
                                  <input
                                    id={field.name}
                                    name={field.name}
                                    className={input({ className: 'aria-invalid:border-red-700' })}
                                    value={field.state.value}
                                    placeholder={creditType === 'social' ? '@handle' : creditType === 'organization' ? 'Business or organization' : 'Name'}
                                    aria-describedby={`${field.name}-errors`}
                                    aria-invalid={(field.state.meta.isTouched || showErrorSummary) && !field.state.meta.isValid}
                                    aria-required="true"
                                    onBlur={field.handleBlur}
                                    onChange={event => field.handleChange(event.target.value)}
                                  />
                                  <FieldErrors id={`${field.name}-errors`} errors={field.state.meta.errors} show={field.state.meta.isTouched || showErrorSummary} />
                                </div>
                              )}
                            </form.Field>
                          )
                        : null}
                    </form.Subscribe>

                    <form.Field name="grantsUsageRights">
                      {field => (
                        <div>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4 has-checked:border-blueberry-500 has-checked:bg-blueberry-50">
                            <input
                              className="mt-1 size-5 shrink-0 accent-blueberry-600"
                              type="checkbox"
                              name={field.name}
                              checked={field.state.value}
                              aria-describedby="grantsUsageRights-errors"
                              aria-invalid={(field.state.meta.isTouched || showErrorSummary) && !field.state.meta.isValid}
                              aria-required="true"
                              onBlur={field.handleBlur}
                              onChange={event => field.handleChange(event.target.checked)}
                            />
                            <span className="text-sm leading-6 text-stone-800">
                              I confirm that I own these photos or have permission to share them and grant Maine Food Map permission to use them.
                            </span>
                          </label>
                          <FieldErrors id="grantsUsageRights-errors" errors={field.state.meta.errors} show={field.state.meta.isTouched || showErrorSummary} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                )
              : null}
          </form.Subscribe>
        </fieldset>

        <fieldset className={formSection()}>
          <legend className="px-1 font-pretrona text-2xl font-semibold tracking-tight text-stone-950">Submitter</legend>
          <p className="mt-1 mb-6 text-sm text-stone-500">Optional and private. It would only be used to clarify a submission.</p>
          <form.Field name="submitterEmail">
            {field => (
              <div>
                <label className={fieldLabel()} htmlFor={field.name}>
                  Email address
                  <span className="font-normal text-stone-500">(optional)</span>
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  className={input({ className: 'aria-invalid:border-red-700' })}
                  type="email"
                  value={field.state.value}
                  autoComplete="email"
                  aria-describedby={`${field.name}-hint ${field.name}-errors`}
                  aria-invalid={(field.state.meta.isTouched || showErrorSummary) && !field.state.meta.isValid}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
                <p id={`${field.name}-hint`} className={fieldHint()}>This address is not included in the public place details.</p>
                <FieldErrors id={`${field.name}-errors`} errors={field.state.meta.errors} show={field.state.meta.isTouched || showErrorSummary} />
              </div>
            )}
          </form.Field>
        </fieldset>

        <div className="flex flex-col items-start gap-3 rounded-2xl bg-stone-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="font-semibold">Ready to preview the submission?</p>
            <p className="mt-1 text-sm text-stone-300">Validation stays local. Nothing will be sent or saved.</p>
          </div>
          <form.Subscribe selector={state => state.isSubmitting}>
            {isSubmitting => (
              <button className={button({ scheme: 'blueberry', size: 'lg', className: 'w-full sm:w-auto' })} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Checking…' : 'Preview submission'}
              </button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </main>
  )
}
