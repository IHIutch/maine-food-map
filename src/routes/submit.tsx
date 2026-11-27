import { createFileRoute } from '@tanstack/react-router'

import { PlaceSubmissionForm } from '../components/place-submission-form'
import { seo } from '../utils/seo'

export const Route = createFileRoute('/submit')({
  head: () => ({
    meta: seo({
      title: 'Submit a Spot | Maine Food Map',
      description: 'Share a Maine restaurant, cafe, market, food truck, or other food destination with Maine Food Map.',
    }),
  }),
  component: PlaceSubmissionForm,
})
