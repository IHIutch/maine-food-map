# AT Protocol fit for Maine Food Map

_Protocol research reviewed 2026-08-14. Repository references updated 2026-11-27 for the Drizzle foundation; protocol claims were not reverified in that update._

## Recommendation

AT Protocol fits Maine Food Map if the goal is a public dataset with portable, user-owned contributions. Keep the existing database and map stack.

Use Postgres and AT Protocol together:

- Keep Postgres as the curated catalog, moderation workflow, private submission store, geospatial/search index, and fast read model.
- Add AT identity and public user-owned records for contributions such as place suggestions, reviews, public likes, and lists.
- Index those records into Postgres with Tap/relay synchronization, then decide what is accepted into the curated catalog.
- Keep private or contractual fields, especially submitter email and rights attestations, out of AT repositories.

If the intended product remains only "a small editorial directory maintained by one operator," AT Protocol adds more infrastructure than value. In that case, ordinary accounts plus Postgres are simpler. Consider the protocol when portable identity, user ownership, verifiable authorship, public reuse, or interoperability with other Atmosphere apps are product goals.

## What the project is today

The repo implements a centrally curated restaurant directory:

- [`src/db/schema.ts`](../src/db/schema.ts) defines restaurants, categories, coordinates, hours, photos, ratings, and raw Google/Yelp integration fields in a central relational database.
- [`src/routes/index.tsx`](../src/routes/index.tsx) loads a filtered Maine dataset from Postgres and renders list/map views; [`src/components/mapbox-embed.tsx`](../src/components/mapbox-embed.tsx) handles presentation in Mapbox.
- The client-only submission prototype is preserved separately in [draft PR #18](https://github.com/IHIutch/maine-food-map/pull/18). It models a structured address, coordinates, categories, cuisines, hours, photos, usage-rights confirmation, and optional email, but does not persist submissions.
- Authentication and public contributions remain future work. [`wrangler.json`](../wrangler.json) and `package.json` configure a Cloudflare Worker with an external Postgres connection. The release foundation uses Drizzle with the `pg` driver.

That product has two different kinds of data which should not be conflated:

1. **Canonical editorial data:** what Maine Food Map currently believes is the authoritative title, location, hours, categories, and display status for a place.
2. **User-authored assertions:** "I suggest this place," "I reviewed it," "I liked it," or "I added it to a public list."

AT Protocol fits user-authored assertions. A single shared, mutable restaurant catalog is less naturally modeled because AT repositories are owned per account, not as a collaborative database.

## What AT Protocol provides

AT Protocol supplies portable identity (DID plus handle), public per-user repositories, schemas called Lexicons, signed data, media blobs, OAuth, repository synchronization, and composable moderation. Its stack separates PDSes, which host user accounts and repositories, from relays, which aggregate repository changes, and AppViews, which build application-specific search, discovery, metrics, and response shapes ([Understanding atproto](https://atproto.com/guides/understanding-atproto), [The AT Stack](https://atproto.com/guides/the-at-stack)).

Each account repository contains that account's public records. Repository contents are "entirely public and verifiable"; the account's PDS is their authoritative host, and repository exports are available without authentication ([Repository specification](https://atproto.com/specs/repository), [Sync specification](https://atproto.com/specs/sync)). This gives Maine Food Map portable authorship and public data distribution, not a private application database.

Custom record types are a normal use case. Lexicons define record and API schemas using reverse-DNS names, and the official Statusphere tutorial demonstrates a custom Lexicon, OAuth write permission, a local database, and Tap synchronization ([Lexicons](https://atproto.com/guides/lexicon), [Create a Social App](https://atproto.com/guides/statusphere-tutorial)). Maine Food Map could publish schemas under a domain it controls and expose them through the documented DNS-to-DID publication mechanism ([Publishing Lexicons](https://atproto.com/guides/publishing-lexicons)). Lexicon evolution needs care: published constraints cannot simply be changed incompatibly; breaking changes require a new NSID ([Lexicons: versioning](https://atproto.com/guides/lexicon#versioning)).

## Where it fits and where it does not

| Need                                                              | AT Protocol fit                   | Implication for this project                                                                                                                                                                                                  |
| ----------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portable sign-in and stable author identity                       | Strong                            | A person's existing account on any PDS, including a Bluesky PDS, can log in; Maine Food Map does not have to host accounts itself ([Account management](https://atproto.com/guides/account-management)).                      |
| Public suggestions, reviews, lists, likes                         | Strong                            | Store each contribution in its author's repo using custom Lexicons. Authorship is signed and the record can move with the account.                                                                                            |
| One canonical restaurant record edited by many users              | Weak by itself                    | Keep editorial truth in the app's read model, or publish accepted canonical records from one or more curator accounts. Treat user records as assertions/suggestions, not direct mutations of shared truth.                    |
| Private submissions or private favorites                          | Poor                              | Repositories are public. Store these centrally or use another private-data system; do not put email, internal notes, abuse signals, or non-public rights evidence in AT records.                                              |
| Town, map-bounds, radius, "near me," category, or ranking queries | Not provided by repositories      | Build these in the AppView/Postgres projection. AT supplies records and sync, not a spatial database or application search API.                                                                                               |
| Public photos                                                     | Supported, with caveats           | Blobs are uploaded to the user's PDS and become public once referenced. PDSes may impose their own size/quota policies; strip metadata such as EXIF GPS before upload ([Blob specification](https://atproto.com/specs/blob)). |
| Moderation and curation                                           | Useful primitives, still app work | Labels, network takedowns, mutes, and blocks are stackable, but Maine Food Map must define its own acceptance, ranking, duplicate, fraud, and display policies ([Labels](https://atproto.com/guides/labels)).                 |

## Data model implications

A plausible first schema family would separate:

- `...placeSubmission`: a public, user-authored suggestion with name, description, normalized public address, coordinates, categories/tags, hours, photo blobs, credit, and creation time.
- `...review`: an opinion referencing a canonical place AT URI or stable Maine Food Map place identifier.
- `...like` or `...listEntry`: a public association from the user's account to a place.
- `...place`: an accepted editorial record published by a Maine Food Map curator account, if portability of the canonical catalog is worth having.

Coordinates need an encoding decision. AT Protocol deliberately disallows floating-point values, while the current schema uses floats. Store latitude/longitude as fixed-point integers (for example, microdegrees) or validated decimal strings, then convert to database numerics during indexing ([AT data model](https://atproto.com/specs/data-model#why-no-floats)). The AppView should validate Maine bounds independently; a signed record proves who published bytes, not that a place exists or that its location/hours are accurate.

Do not publish the current `submitterEmail` or internal `grantsUsageRights` evidence. A public record may include a simple public license/credit declaration if that is intentional, but the private contact trail and moderation evidence should remain in the application database. Likewise, do not copy the raw `google_data` or `yelp_data` integration payloads into public records without a separate provider-terms review.

## Discovery, indexing, and map queries

Reading a known record from its repository is straightforward; discovering every relevant record across many accounts is an indexing problem. Relays aggregate participating PDS firehoses, but a "full-network" relay is described as one that _attempts_ to aggregate all PDSes, and an intermediary could omit an entire repository without that omission being detectable ([Sync specification](https://atproto.com/specs/sync#repository-event-stream)). Discovery is therefore broad and useful, not an absolute global-completeness guarantee.

Tap is the official practical layer for a new application: it verifies and backfills repositories, filters by DID or collection, follows relay events, and delivers WebSocket or webhook events backed by SQLite/Postgres ([The AT Stack: Tap](https://atproto.com/guides/the-at-stack#tap)). The sync specification also defines `listReposByCollection` for finding accounts that already contain a given Lexicon collection ([Sync specification](https://atproto.com/specs/sync)).

For Maine Food Map, the reliable path is:

```text
user + OAuth -> user's PDS -> relay/firehose -> Tap -> Postgres AppView -> website + Mapbox
                       \-> immediate write response --/          |
                                                               moderation/editorial promotion
```

The app should record the author DID and returned AT URI immediately after a successful write, then let Tap reconcile the durable projection. Postgres should index normalized coordinates, place references, moderation status, categories, and text. Bounding boxes, radius searches, deduplication, ratings, "open now," and rankings remain application queries. Mapbox remains the renderer/geolocation UI; AT Protocol does not replace it.

## Authentication and account requirements

Every author of repository data needs an AT account hosted on a PDS. They can reuse an account from any provider, so Maine Food Map can launch without operating a PDS ([Account management](https://atproto.com/guides/account-management)). If frictionless signup for people with no AT account becomes important, the official self-hosting guidance recommends offering an app-associated PDS, but that adds account lifecycle, identity, backup, abuse, and production operations ([Self-hosting](https://atproto.com/guides/self-hosting)).

End-user apps should use distributed AT OAuth, which sends each user to their own PDS. The official TypeScript tooling supports browser-only and server-side web architectures ([About OAuth](https://atproto.com/guides/about-oauth)). For this server-rendered application, the server-side client is the more natural fit, with durable encrypted session/token storage in Postgres. Identity-only login needs only the `atproto` scope; writing custom records needs granular collection scopes, and image uploads need an explicit blob scope ([Permission sets](https://atproto.com/guides/permission-sets)). Request write/blob permissions progressively when a user actually submits rather than at first login.

## Moderation, privacy, and deletion

The public nature of repositories is the largest product constraint. Restaurant addresses and public reviews may be suitable; emails, private saves, internal reports, and unreleased submissions are not. Referenced photo blobs become publicly accessible, and original blobs may expose embedded metadata, so image processing and clear consent are required ([Blob specification](https://atproto.com/specs/blob)).

The AppView must consume record deletion and account-status events and promptly stop serving removed content. The official lifecycle guidance requires downstream services to hide deleted/deactivated account content, while acknowledging that copies can remain in services which fail to follow the protocol ([Accounts and deletions](https://atproto.com/guides/account-lifecycle)). Consequently, deletion is an application obligation but cannot provide a secrecy or guaranteed-erasure promise after public distribution.

Labels can express warnings or hides and can be supplied by a labeler, but editorial inclusion is simpler as a first-party AppView state: `pending`, `accepted`, `rejected`, `hidden`, or `superseded`. A separate Ozone/labeler deployment only becomes worthwhile if Maine Food Map wants interoperable reports/labels outside its own UI.

## Hosting and operational impact

The existing Cloudflare-hosted web application can remain the frontend and AppView API. Postgres is already the right place for the query projection. The new services would be:

1. OAuth callback/client metadata and durable sessions in the web backend.
2. Published Lexicons plus DNS ownership.
3. A continuously running Tap process, normally deployed separately as a container/VPS service, sending webhooks or writing to Postgres.
4. An application CDN/proxy for resized, metadata-stripped public images rather than sending browser traffic to users' PDS blob endpoints; serving transformed blobs through an AppView CDN is the documented common pattern ([Blob specification](https://atproto.com/specs/blob)).
5. Optionally, an app PDS for new-account signup and an Ozone labeler later.

The official docs describe a custom AppView as additional application infrastructure and potentially resource-intensive, while Tap itself is a standalone Go binary with SQLite/Postgres support ([Self-hosting](https://atproto.com/guides/self-hosting), [The AT Stack](https://atproto.com/guides/the-at-stack#app-views)). Maine Food Map should subscribe only to its collections and known participants at first, not mirror unrelated network data or run its own relay.

## Practical adoption path

1. **Prove identity value:** add AT OAuth with identity-only scope. Keep the existing catalog and submission pipeline central.
2. **Prototype one public record:** define and publish a small `placeSubmission` or `review` Lexicon. Exclude email/private moderation fields and use fixed-point coordinates.
3. **Build the projection:** run Tap with collection/DID filters, make ingestion idempotent, persist AT URI/CID/revision, and handle update/delete/account-status events.
4. **Add curation:** promote accepted suggestions into the existing restaurant model; optionally publish the accepted record from a curator account.
5. **Expand only with product demand:** public lists/likes, own-PDS onboarding, or a labeler can follow independently.

This path tests demand for portable contributions before adding PDS hosting or full-network operations. Maine Food Map would continue to curate the catalog and provide map and search queries.
