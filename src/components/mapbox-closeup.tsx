import type { MapRef } from 'react-map-gl/mapbox'

import * as React from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

import { clientEnv } from '../utils/env'

export default function MapboxCloseup({
  lat,
  lng,
}: {
  lat: number
  lng: number
}) {
  const mapRef = React.useRef<MapRef>(null)

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={clientEnv.VITE_MAPBOX_API_KEY}
      initialViewState={{
        longitude: lng,
        latitude: lat,
        zoom: 14,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      <Marker
        longitude={lng}
        latitude={lat}
      >
        <div className="relative size-3.5 cursor-pointer rounded-full border-2 border-white bg-blue-500 shadow-sm transition-all hover:scale-110" />
      </Marker>
    </Map>
  )
}
