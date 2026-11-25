import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

export const ATTESTATION_VERSION = '2026-07-v1'

// DRAFT copy — owner must review before deploy.
export const ATTESTATION_TEXT =
  'I confirm I took this photo or otherwise own the rights to it, and I grant Maine Food Map a non-exclusive, perpetual, worldwide license to display, store, and redistribute it — including via third-party networks and decentralized platforms — with attribution. I understand approved photos may remain publicly available even if later removed from this site.'

export const PER_PHOTO_CHECKBOX_LABEL =
  'I took this photo or own the rights to it.'

/* This module's plain exports above are imported by client components, so
 * server-only modules (prisma, session) are imported lazily inside handlers
 * to keep them out of the browser bundle. */

const emailSchema = z.string().trim().toLowerCase().pipe(z.email()).optional()

export type AgreementStatus = {
  agreed: boolean
  currentVersion: string
}

export const getAgreementStatus = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ email: emailSchema }).parse)
  .handler(async ({ data }): Promise<AgreementStatus> => {
    const { prisma } = await import('../utils/prisma')
    const { getCurrentUser } = await import('./session')

    const user = await getCurrentUser()
    let contributor = null
    if (user) {
      contributor = await prisma.contributors.findUnique({
        where: { did: user.did },
      })
    } else if (data.email) {
      contributor = await prisma.contributors.findUnique({
        where: { email: data.email },
      })
    }
    return {
      agreed: contributor?.attestation_version === ATTESTATION_VERSION,
      currentVersion: ATTESTATION_VERSION,
    }
  })

export const acceptAgreement = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: emailSchema }).parse)
  .handler(async ({ data }) => {
    const { prisma } = await import('../utils/prisma')
    const { getCurrentUser } = await import('./session')

    const user = await getCurrentUser()
    if (user) {
      await prisma.contributors.upsert({
        where: { did: user.did },
        create: {
          did: user.did,
          handle: user.handle,
          attestation_version: ATTESTATION_VERSION,
        },
        update: {
          handle: user.handle,
          attestation_version: ATTESTATION_VERSION,
          agreed_at: new Date(),
        },
      })
    } else if (data.email) {
      await prisma.contributors.upsert({
        where: { email: data.email },
        create: {
          email: data.email,
          attestation_version: ATTESTATION_VERSION,
        },
        update: {
          attestation_version: ATTESTATION_VERSION,
          agreed_at: new Date(),
        },
      })
    } else {
      throw new Error('IDENTITY_REQUIRED')
    }
    return { ok: true, currentVersion: ATTESTATION_VERSION }
  })
