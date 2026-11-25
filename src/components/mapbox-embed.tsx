import * as React from 'react'
import Map, { GeolocateControl, MapRef, Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Link } from '@tanstack/react-router';
import { metaLabel, metaRow, statusMark } from './ui';

type Restaurant = {
    id: number;
    slug: string;
    title: string;
    description?: string | null;
    rating?: number | null;
    review_count?: number | null;
    city?: string | null;
    tags: string[];
    isOpen: boolean;
    longitude: number | null;
    latitude: number | null;
}

export default function MapboxEmbed({ places, selectedId, onMarkerClick, isShowing }: {
    places: Restaurant[],
    selectedId: number | null,
    onMarkerClick?: (id: number) => void
    isShowing: boolean
}) {
    const mapRef = React.useRef<MapRef>(null);
    const [popupInfo, setPopupInfo] = React.useState<Restaurant | null>(null);

    let minLng = places.length > 0 ? places[0].longitude || 0 : 0;
    let maxLng = minLng;
    let minLat = places.length > 0 ? places[0].latitude || 0 : 0;
    let maxLat = minLat;

    const getBounds = React.useCallback(() => {
        if (places.length === 0) {
            return undefined;
        }
        places.forEach(parcel => {
            const lng = parcel.longitude || 0;
            const lat = parcel.latitude || 0;

            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
        });

        // Return bounds in the format: [minLng, minLat, maxLng, maxLat]
        return [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
    }, [places]);

    React.useEffect(() => {
        if (isShowing) {
            mapRef.current?.resize();
        }
    }, [isShowing])


    return (
        <Map
            ref={mapRef}
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_API_KEY}
            initialViewState={{
                bounds: getBounds(),
                fitBoundsOptions: {
                    padding: 60,
                    maxZoom: 14
                },
                // Fallback for when there are no places
                longitude: -70.259,
                latitude: 43.657,
                zoom: 14
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
        >
            {places.length ? places.map((parcel) => (
                <Marker
                    key={`marker-${parcel.id}`}
                    longitude={parcel.longitude || 0}
                    latitude={parcel.latitude || 0}
                    style={{ zIndex: selectedId === parcel.id ? 20 : 10 }}
                >
                    <div
                        className={`shadow-sm border-2 relative border-white rounded-full transition-all cursor-pointer ${selectedId === parcel.id ? 'bg-tomato scale-125 size-4.5' : 'bg-pine hover:scale-110 size-3.5'}`}
                        onClick={() => {
                            setPopupInfo(parcel);
                            onMarkerClick?.(parcel.id);
                        }}
                    />
                </Marker>
            )) : null}
            {popupInfo && (
                <Popup
                    longitude={Number(popupInfo.longitude)}
                    latitude={Number(popupInfo.latitude)}
                    onClose={() => setPopupInfo(null)}
                    closeButton={true}
                    closeOnClick={false}
                    style={{ zIndex: 25 }}
                >
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-display font-light text-lg leading-tight">
                            <Link
                                to="/places/$slug"
                                params={{ slug: popupInfo.slug }}
                                className="text-blueberry underline underline-offset-4 decoration-blueberry/40 hover:decoration-blueberry"
                            >
                                {popupInfo.title}
                            </Link>
                        </h3>
                        {popupInfo.rating && (
                            <span className="font-display font-light text-2xl text-ink flex-shrink-0">{popupInfo.rating}</span>
                        )}
                    </div>

                    {popupInfo.description && (
                        <p className="text-ink-soft text-sm mb-3 line-clamp-2">
                            {popupInfo.description}
                        </p>
                    )}

                    <div className={metaLabel({ className: 'flex items-center gap-2 text-ink-soft mb-3' })}>
                        {popupInfo.city && <span>{popupInfo.city}</span>}
                        {popupInfo.review_count && (
                            <>
                                <span>·</span>
                                <span>{popupInfo.review_count} reviews</span>
                            </>
                        )}
                    </div>

                    <div className={metaRow({ className: 'text-ink-soft' })}>
                        <span className={statusMark({ open: popupInfo.isOpen })}>
                            {popupInfo.isOpen ? 'Open' : 'Closed'}
                        </span>
                        {popupInfo.tags.slice(0, 2).map((tag) => (
                            <span key={tag}>· {tag}</span>
                        ))}
                    </div>

                </Popup>
            )}
            <GeolocateControl />
            <NavigationControl />
        </Map>
    )
}