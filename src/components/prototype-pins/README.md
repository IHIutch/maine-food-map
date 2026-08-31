# Prototype: map pins

**Question:** what should a marker carry — nothing, price, cuisine, or open status?

Four variants behind `?variant=` on `/`, over the live map:

| | Pin | Carries |
|---|---|---|
| A | Dot | nothing; the shipped shape on the blueberry palette |
| B | Price pill | `$`/`$$`/`$$$` in a small white pill |
| C | Cuisine teardrop | an icon per coarse cuisine bucket, in a 38×48 pin |
| D | Open-now status | filled green when open, hollow when closed |

## Verdict

**Circles for now (A).** The teardrop read best and the owner liked it, but it
carries a tail of work that isn't worth paying yet — see below. Parked, not
rejected.

## What the prototype settled

- **B is blocked on data.** Most places have no `price_level`, so a price-pill
  map is mostly `·` placeholders. It's a data problem, not a design one.
- **D is time-dependent.** Filled/hollow is sharp at 7pm and a field of identical
  hollow rings at 1am. It wants to be a toggle, not the default.
- **C needs three things a circle doesn't:**
  1. `anchor="bottom"` on the Marker — a teardrop points at its coordinate, a dot
     is centred on it. Without this every pin sits half a pin-height north.
  2. A popover offset. The popup anchors to the coordinate, which is the pin's
     point, so it covered the whole 48px pin. A plain numeric `offset` was
     ignored by react-map-gl here; it needs the per-anchor object form, since
     Mapbox flips the anchor near a map edge.
  3. Clustering. 38×48 pins are fine at 22 markers and a solid mass at 526.
- **Draw a pin as one path.** The first teardrop was a bordered circle plus a
  rotated square, each with its own 2px white border — that seam at the neck was
  the clipping. A single SVG path with one stroke fixed it.
