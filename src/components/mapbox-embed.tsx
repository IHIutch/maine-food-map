import type { MapRef } from 'react-map-gl/mapbox'

import 'mapbox-gl/dist/mapbox-gl.css'
import * as React from 'react'
import Map, { GeolocateControl, Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'

import type { Photo } from './place-photos'

import { cuisineIconFor } from '../utils/cuisine-icons'
import { clientEnv } from '../utils/env'
import { useMediaQuery } from '../utils/use-media-query'
import PlaceSummary from './place-summary'

/** Same drawer the search uses; loaded on the first marker tap, not with the map. */
const BottomSheet = React.lazy(() => import('./bottom-sheet'))

interface Restaurant {
  id: number
  slug: string
  title: string
  description?: string | null
  rating?: number | null
  review_count?: number | null
  city?: string | null
  tags: string[]
  cuisineSlugs?: string[]
  price_level?: string | null
  photos?: Photo[]
  isOpen: boolean
  longitude: number | null
  latitude: number | null
}

export default function MapboxEmbed({ places, selectedId, onMarkerClick, isShowing }: {
  places: Restaurant[]
  selectedId: number | null
  onMarkerClick?: (id: number) => void
  isShowing: boolean
}) {
  const mapRef = React.useRef<MapRef>(null)
  const [popupInfo, setPopupInfo] = React.useState<Restaurant | null>(null)
  // On phones a marker opens the same drawer the search uses, not a map popup.
  const isMobile = !useMediaQuery('(min-width: 640px)')
  const [sheetPlace, setSheetPlace] = React.useState<Restaurant | null>(null)
  const [isSheetOpen, setSheetOpen] = React.useState(false)

  function onSelectPlace(place: Restaurant) {
    onMarkerClick?.(place.id)
    if (isMobile) {
      setSheetPlace(place)
      setSheetOpen(true)
    }
    else {
      setPopupInfo(place)
    }
  }

  const getBounds = React.useCallback(() => {
    if (places.length === 0) {
      return undefined
    }

    let minLng = places[0].longitude || 0
    let maxLng = minLng
    let minLat = places[0].latitude || 0
    let maxLat = minLat

    places.forEach((parcel) => {
      const lng = parcel.longitude || 0
      const lat = parcel.latitude || 0

      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })

    // Return bounds in the format: [minLng, minLat, maxLng, maxLat]
    return [minLng, minLat, maxLng, maxLat] as [number, number, number, number]
  }, [places])

  React.useEffect(() => {
    if (isShowing) {
      mapRef.current?.resize()
    }
  }, [isShowing])

  return (
    <>
      <Map
        ref={mapRef}
        mapboxAccessToken={clientEnv.VITE_MAPBOX_API_KEY}
        initialViewState={{
          bounds: getBounds(),
          fitBoundsOptions: {
            padding: 60,
            maxZoom: 14,
          },
          // Fallback for when there are no places
          longitude: -70.259,
          latitude: 43.657,
          zoom: 14,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      >
        {places.length
          ? places.map(parcel => (
              <Marker
                key={`marker-${parcel.id}`}
                longitude={parcel.longitude || 0}
                latitude={parcel.latitude || 0}
                style={{ zIndex: selectedId === parcel.id ? 20 : 10 }}
              >
                <div
                  className={`grid cursor-pointer place-items-center rounded-full border-2 border-white shadow-md transition-transform ${
                    selectedId === parcel.id
                      ? 'size-8 scale-110 bg-stone-900'
                      : 'size-7 bg-blueberry-500 hover:scale-110'
                  }`}
                  onClick={() => onSelectPlace(parcel)}
                >
                  <span className={`size-4 text-white ${cuisineIconFor(parcel.cuisineSlugs)}`} aria-hidden />
                </div>
              </Marker>
            ))
          : null}
        {popupInfo && !isMobile && (
          <Popup
            longitude={Number(popupInfo.longitude)}
            latitude={Number(popupInfo.latitude)}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            // The pin is centred on its coordinate, so the popover clears its 16px
            // radius. A numeric offset is applied diagonally at corner anchors
            // (24 / √2 ≈ 17), which is why it isn't simply the radius.
            offset={24}
            // maxWidth="264px"
            // style={{ zIndex: 25 }}
            // className="rounded"
          >
            <PlaceSummary place={popupInfo} density="compact" />

          </Popup>
        )}
        <GeolocateControl />
        <NavigationControl />
      </Map>

      {sheetPlace && (
        <React.Suspense fallback={null}>
          <BottomSheet
            isOpen={isSheetOpen}
            onOpenChange={setSheetOpen}
            label={sheetPlace.title}
            size="auto"
          >
            <PlaceSummary place={sheetPlace} onClose={() => setSheetOpen(false)} />
          </BottomSheet>
        </React.Suspense>
      )}
    </>
  )
}
