import * as React from 'react'
import Map, { MapRef, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapboxCloseup({
    lat,
    lng
}: {
    lat: number,
    lng: number
}) {
    const mapRef = React.useRef<MapRef>(null);

    return (
        <Map
            ref={mapRef}
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_API_KEY}
            initialViewState={{
                longitude: lng,
                latitude: lat,
                zoom: 14
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
        >
            <Marker
                longitude={lng}
                latitude={lat}
            >
                <div className="shadow-sm border-2 relative border-white rounded-full transition-all cursor-pointer bg-blue-500 hover:scale-110 size-3.5" />
            </Marker>
        </Map>
    )
}
