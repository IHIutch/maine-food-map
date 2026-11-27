import { z } from 'zod'

export const MAX_PHOTO_COUNT = 6
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024

export const ACCEPTED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const ALT_TEXT_GUIDANCE = 'Describe this image like you were talking about it on the phone.'

export const DAYS = [
  { day: 0, label: 'Sunday' },
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
] as const

export const PLACE_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'bar-pub', label: 'Bar or pub' },
  { value: 'food-truck', label: 'Food truck' },
  { value: 'market', label: 'Market' },
  { value: 'farm-stand', label: 'Farm stand' },
] as const

export const CUISINES = [
  { value: 'american', label: 'American' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'french', label: 'French' },
  { value: 'indian', label: 'Indian' },
  { value: 'italian', label: 'Italian' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'thai', label: 'Thai' },
  { value: 'vietnamese', label: 'Vietnamese' },
] as const

export interface MaineLocation {
  label: string
  streetAddress: string
  city: string
  state: 'ME'
  postalCode: string
  latitude: number
  longitude: number
}

export interface PlaceSubmissionHour {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6
  closed: boolean
  open: string
  close: string
}

export interface PlaceSubmissionImage {
  id: string
  file: File
  altText: string
}

export interface PhotoCredit {
  type: 'name' | 'social' | 'organization' | 'anonymous'
  value: string
}

export interface PlaceSubmissionFormValues {
  title: string
  description: string
  location: MaineLocation | null
  placeTypes: string[]
  cuisines: string[]
  tags: string[]
  hours: PlaceSubmissionHour[]
  images: PlaceSubmissionImage[]
  photoCredit: PhotoCredit
  grantsUsageRights: boolean
  submitterEmail: string
}

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.')

const locationSchema = z.object({
  label: z.string().trim().min(1),
  streetAddress: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.literal('ME'),
  postalCode: z.string().regex(/^\d{5}(?:-\d{4})?$/, 'Enter a valid Maine ZIP code.'),
  latitude: z.number().min(42.9).max(47.5),
  longitude: z.number().min(-71.2).max(-66.8),
})

const hourSchema = z.object({
  day: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  closed: z.boolean(),
  open: z.string(),
  close: z.string(),
}).superRefine((hour, context) => {
  if (hour.closed)
    return

  const openResult = timeSchema.safeParse(hour.open)
  const closeResult = timeSchema.safeParse(hour.close)

  if (!openResult.success) {
    context.addIssue({
      code: 'custom',
      message: 'Enter an opening time.',
      path: ['open'],
    })
  }

  if (!closeResult.success) {
    context.addIssue({
      code: 'custom',
      message: 'Enter a closing time.',
      path: ['close'],
    })
  }

  if (openResult.success && closeResult.success && hour.open >= hour.close) {
    context.addIssue({
      code: 'custom',
      message: 'Closing time must be later than opening time.',
      path: ['close'],
    })
  }
})

const browserFileSchema = z.custom<File>(
  value => typeof File !== 'undefined' && value instanceof File,
  'Choose a valid image file.',
)

const imageSchema = z.object({
  id: z.string().min(1),
  file: browserFileSchema,
  altText: z.string(),
}).superRefine((image, context) => {
  if (!ACCEPTED_PHOTO_TYPES.includes(image.file.type as typeof ACCEPTED_PHOTO_TYPES[number])) {
    context.addIssue({
      code: 'custom',
      message: 'Photos must be JPEG, PNG, or WebP images.',
      path: ['file'],
    })
  }

  if (image.file.size > MAX_PHOTO_SIZE) {
    context.addIssue({
      code: 'custom',
      message: 'Each photo must be 10 MB or smaller.',
      path: ['file'],
    })
  }
})

export const placeSubmissionSchema = z.object({
  title: z.string().trim().min(1, 'Enter the place name.'),
  description: z.string().trim().min(1, 'Tell us what makes this place worth a stop.'),
  location: locationSchema.nullable(),
  placeTypes: z.array(z.string()).min(1, 'Choose at least one place type.'),
  cuisines: z.array(z.string()),
  tags: z.array(z.string()),
  hours: z.array(hourSchema).length(7, 'Include hours for all seven days.'),
  images: z.array(imageSchema).max(MAX_PHOTO_COUNT, 'Choose no more than six photos.'),
  photoCredit: z.object({
    type: z.enum(['name', 'social', 'organization', 'anonymous']),
    value: z.string(),
  }),
  grantsUsageRights: z.boolean(),
  submitterEmail: z.string().refine(
    value => value.trim() === '' || z.email().safeParse(value.trim()).success,
    'Enter a valid email address.',
  ),
}).superRefine((values, context) => {
  if (!values.location) {
    context.addIssue({
      code: 'custom',
      message: 'Choose an address from the suggestions.',
      path: ['location'],
    })
  }

  const days = values.hours.map(hour => hour.day)
  if (new Set(days).size !== DAYS.length || DAYS.some(({ day }, index) => days[index] !== day)) {
    context.addIssue({
      code: 'custom',
      message: 'Hours must include Sunday through Saturday in order.',
      path: ['hours'],
    })
  }

  if (values.images.length === 0)
    return

  if (values.photoCredit.type !== 'anonymous' && !values.photoCredit.value.trim()) {
    context.addIssue({
      code: 'custom',
      message: 'Enter the photo credit, or choose anonymous.',
      path: ['photoCredit', 'value'],
    })
  }

  if (!values.grantsUsageRights) {
    context.addIssue({
      code: 'custom',
      message: 'Confirm that you can share these photos and grant permission to use them.',
      path: ['grantsUsageRights'],
    })
  }
})

export interface AddressSuggestionSource {
  search: (query: string) => Promise<readonly MaineLocation[]>
}

export const MOCK_MAINE_ADDRESSES = [
  {
    label: '86 Middle Street, Portland, ME 04101',
    streetAddress: '86 Middle Street',
    city: 'Portland',
    state: 'ME',
    postalCode: '04101',
    latitude: 43.6577,
    longitude: -70.2523,
  },
  {
    label: '2 Main Street, Rockland, ME 04841',
    streetAddress: '2 Main Street',
    city: 'Rockland',
    state: 'ME',
    postalCode: '04841',
    latitude: 44.1037,
    longitude: -69.1089,
  },
  {
    label: '15 Elm Street, Camden, ME 04843',
    streetAddress: '15 Elm Street',
    city: 'Camden',
    state: 'ME',
    postalCode: '04843',
    latitude: 44.2098,
    longitude: -69.0648,
  },
  {
    label: '22 Broad Street, Bangor, ME 04401',
    streetAddress: '22 Broad Street',
    city: 'Bangor',
    state: 'ME',
    postalCode: '04401',
    latitude: 44.8006,
    longitude: -68.7712,
  },
  {
    label: '10 Water Street, Eastport, ME 04631',
    streetAddress: '10 Water Street',
    city: 'Eastport',
    state: 'ME',
    postalCode: '04631',
    latitude: 44.9062,
    longitude: -66.9899,
  },
] as const satisfies readonly MaineLocation[]

export const mockMaineAddressSource: AddressSuggestionSource = {
  async search(query) {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (normalizedQuery.length < 2)
      return []

    return MOCK_MAINE_ADDRESSES.filter(address =>
      address.label.toLocaleLowerCase().includes(normalizedQuery),
    )
  },
}

export function createDefaultHours(): PlaceSubmissionHour[] {
  return DAYS.map(({ day }) => ({
    day,
    closed: true,
    open: '00:00',
    close: '00:00',
  }))
}

export function createDefaultSubmissionValues(): PlaceSubmissionFormValues {
  return {
    title: '',
    description: '',
    location: null,
    placeTypes: [],
    cuisines: [],
    tags: [],
    hours: createDefaultHours(),
    images: [],
    photoCredit: {
      type: 'name',
      value: '',
    },
    grantsUsageRights: false,
    submitterEmail: '',
  }
}

export type NormalizedPlaceSubmission = Omit<PlaceSubmissionFormValues, 'images' | 'location'> & {
  location: MaineLocation
  images: Array<{
    id: string
    name: string
    type: string
    size: number
    lastModified: number
    altText: string
  }>
}

function normalizeStringList(values: string[]): string[] {
  const normalized = values
    .map(value => value.trim())
    .filter(Boolean)

  return normalized.filter((value, index) =>
    normalized.findIndex(candidate => candidate.toLocaleLowerCase() === value.toLocaleLowerCase()) === index,
  )
}

export function normalizePlaceSubmission(values: PlaceSubmissionFormValues): NormalizedPlaceSubmission {
  if (!values.location)
    throw new Error('A selected location is required before normalization.')

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: { ...values.location },
    placeTypes: normalizeStringList(values.placeTypes),
    cuisines: normalizeStringList(values.cuisines),
    tags: normalizeStringList(values.tags),
    hours: values.hours
      .map(hour => ({
        day: hour.day,
        closed: hour.closed,
        open: hour.closed ? '00:00' : hour.open,
        close: hour.closed ? '00:00' : hour.close,
      }))
      .sort((left, right) => left.day - right.day),
    images: values.images.map(image => ({
      id: image.id,
      name: image.file.name,
      type: image.file.type,
      size: image.file.size,
      lastModified: image.file.lastModified,
      altText: image.altText.trim(),
    })),
    photoCredit: {
      type: values.photoCredit.type,
      value: values.photoCredit.type === 'anonymous'
        ? ''
        : values.photoCredit.value.trim(),
    },
    grantsUsageRights: values.images.length > 0 && values.grantsUsageRights,
    submitterEmail: values.submitterEmail.trim(),
  }
}
