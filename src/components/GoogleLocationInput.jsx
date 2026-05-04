import React, { useRef } from 'react'
import { Autocomplete, useLoadScript } from '@react-google-maps/api'

const libraries = ['places']

function getComponent(place, type, short = false) {
  const comp = place.address_components?.find(c => c.types.includes(type))
  return short ? comp?.short_name || '' : comp?.long_name || ''
}

export default function GoogleLocationInput({ value, onChange, onSelect, className, placeholder }) {
  const ref = useRef(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const handlePlace = () => {
    const place = ref.current?.getPlace()
    if (!place) return

    const street = getComponent(place, 'route')
    const streetNumber = getComponent(place, 'street_number')
    const city =
      getComponent(place, 'locality') ||
      getComponent(place, 'administrative_area_level_2')
    const state = getComponent(place, 'administrative_area_level_1')
    const country = getComponent(place, 'country')
    const neighborhood =
      getComponent(place, 'neighborhood') ||
      getComponent(place, 'sublocality') ||
      getComponent(place, 'sublocality_level_1')

    const text = place.formatted_address || place.name || ''

    onChange(text)

    onSelect?.({
      query: text,
      lat: place.geometry?.location?.lat?.() || null,
      lng: place.geometry?.location?.lng?.() || null,
      street,
      street_number: streetNumber,
      city,
      state,
      province: state,
      country,
      neighborhood,
      place_id: place.place_id || '',
    })
  }

  if (!isLoaded) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  return (
    <Autocomplete
      onLoad={(a) => (ref.current = a)}
      onPlaceChanged={handlePlace}
      options={{
        componentRestrictions: { country: 'ar' },
        fields: [
          'formatted_address',
          'name',
          'place_id',
          'geometry',
          'address_components',
        ],
      }}
    >
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </Autocomplete>
  )
}