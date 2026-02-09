import React, { useState } from 'react'

export default function LocationPicker({ onLocationSelect, initialValues = {} }) {
  const [address, setAddress] = useState(initialValues.street || '')
  const [streetNumber, setStreetNumber] = useState(initialValues.street_number || '')
  const [city, setCity] = useState(initialValues.city || '')
  const [state, setState] = useState(initialValues.state || '')
  const [country, setCountry] = useState(initialValues.country || '')
  const [neighborhood, setNeighborhood] = useState(initialValues.neighborhood || '')
  
  const [suggestions, setSuggestions] = useState([])
  const [mapUrl, setMapUrl] = useState('')
  const [debounceTimer, setDebounceTimer] = useState(null)
  const [isGeolocating, setIsGeolocating] = useState(false)

  const handleAddressChange = (e) => {
    const value = e.target.value
    setAddress(value)

    // Clear previous timer
    if (debounceTimer) clearTimeout(debounceTimer)

    if (!value || value.length < 3) {
      setSuggestions([])
      return
    }

    // Debounce Nominatim search
    const timer = setTimeout(() => {
      searchNominatim(value)
    }, 500)
    setDebounceTimer(timer)
  }

  const searchNominatim = async (query) => {
    try {
      // Build search query with city if available for better precision
      let searchQuery = query
      if (city && city.trim()) {
        searchQuery = `${query}, ${city}, Argentina`
      }
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `countrycodes=ar&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=10`,
        {
          headers: {
            'User-Agent': 'InmobiliariaApp/1.0'
          }
        }
      )
      const results = await response.json()
      setSuggestions(results || [])
    } catch (err) {
      console.error('Nominatim search error:', err)
      setSuggestions([])
    }
  }

  const handleSuggestionSelect = async (result) => {
    // Use address from search result (already includes details)
    try {
      const addr = result.address || {}

      const streetName = addr.road || addr.pedestrian || addr.street || ''
      const streetNum = addr.house_number || ''
      const cityVal = addr.city || addr.town || addr.village || addr.municipality || ''
      const stateVal = addr.state || addr.province || ''
      const countryVal = addr.country || 'Argentina'
      const neighborhoodVal = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || ''

      setAddress(streetName)
      setStreetNumber(streetNum)
      setCity(cityVal)
      setState(stateVal)
      setCountry(countryVal)
      setNeighborhood(neighborhoodVal)
      setSuggestions([])

      // Create map link
      const mapLink = `https://www.openstreetmap.org/?lat=${result.lat}&lon=${result.lon}&zoom=17`
      setMapUrl(mapLink)

      // Notify parent
      if (onLocationSelect) {
        onLocationSelect({
          street: streetName,
          street_number: streetNum,
          city: cityVal,
          state: stateVal,
          country: countryVal,
          neighborhood: neighborhoodVal
        })
      }
    } catch (err) {
      console.error('Nominatim reverse error:', err)
    }
  }

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }

    setIsGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&` +
            `lat=${latitude}&` +
            `lon=${longitude}&` +
            `addressdetails=1`,
            {
              headers: {
                'User-Agent': 'InmobiliariaApp/1.0'
              }
            }
          )
          const data = await response.json()
          const addr = data.address || {}

          const streetName = addr.road || addr.pedestrian || addr.street || ''
          const streetNum = addr.house_number || ''
          const cityVal = addr.city || addr.town || addr.village || addr.municipality || ''
          const stateVal = addr.state || addr.province || ''
          const countryVal = addr.country || 'Argentina'
          const neighborhoodVal = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || ''

          setAddress(streetName)
          setStreetNumber(streetNum)
          setCity(cityVal)
          setState(stateVal)
          setCountry(countryVal)
          setNeighborhood(neighborhoodVal)

          const mapLink = `https://www.openstreetmap.org/?lat=${latitude}&lon=${longitude}&zoom=17`
          setMapUrl(mapLink)

          if (onLocationSelect) {
            onLocationSelect({
              street: streetName,
              street_number: streetNum,
              city: cityVal,
              state: stateVal,
              country: countryVal,
              neighborhood: neighborhoodVal
            })
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err)
          alert('Error al obtener la dirección de tu ubicación')
        } finally {
          setIsGeolocating(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.')
        setIsGeolocating(false)
      }
    )
  }

  const handleManualUpdate = (field, value) => {
    switch (field) {
      case 'street':
        setAddress(value)
        break
      case 'street_number':
        setStreetNumber(value)
        break
      case 'city':
        setCity(value)
        break
      case 'state':
        setState(value)
        break
      case 'country':
        setCountry(value)
        break
      case 'neighborhood':
        setNeighborhood(value)
        break
    }

    if (onLocationSelect) {
      onLocationSelect({
        street: field === 'street' ? value : address,
        street_number: field === 'street_number' ? value : streetNumber,
        city: field === 'city' ? value : city,
        state: field === 'state' ? value : state,
        country: field === 'country' ? value : country,
        neighborhood: field === 'neighborhood' ? value : neighborhood
      })
    }
  }

  return (
    <div className="border border-gray-300 p-4 mb-4 rounded bg-green-50">
      <h3 className="text-lg font-semibold mb-3">Ubicación</h3>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Ciudad (escribir primero ayuda a búsquedas más precisas)</label>
        <input
          type="text"
          value={city}
          onChange={(e) => handleManualUpdate('city', e.target.value)}
          placeholder="Ej: Mar del Plata"
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="font-semibold">Dirección</label>
          <button
            type="button"
            onClick={handleGeolocation}
            disabled={isGeolocating}
            className="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isGeolocating ? '📍 Obteniendo...' : '📍 Usar mi ubicación'}
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="Ej: Almirante Brown 1783"
            className="w-full p-2 border rounded"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 max-h-64 overflow-y-auto z-10 shadow">
              {suggestions.map((sugg, idx) => {
                const addr = sugg.address || {}
                const street = addr.road || addr.pedestrian || ''
                const number = addr.house_number || ''
                const neighborhood = addr.suburb || addr.neighbourhood || ''
                const city = addr.city || addr.town || addr.village || addr.municipality || ''
                const state = addr.state || addr.province || ''
                
                return (
                  <li
                    key={`${sugg.lat}-${sugg.lon}-${idx}`}
                    onClick={() => handleSuggestionSelect(sugg)}
                    className="p-2 hover:bg-green-100 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-semibold text-sm">
                      {street} {number}
                    </div>
                    <div className="text-xs text-gray-600">
                      {[neighborhood, city, state].filter(Boolean).join(', ')}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2 font-semibold">Número</label>
          <input
            type="text"
            value={streetNumber}
            onChange={(e) => handleManualUpdate('street_number', e.target.value)}
            placeholder="Ej: 123"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">Barrio</label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => handleManualUpdate('neighborhood', e.target.value)}
            placeholder="Ej: Belgrano"
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block mb-2 font-semibold">Provincia</label>
          <input
            type="text"
            value={state}
            onChange={(e) => handleManualUpdate('state', e.target.value)}
            placeholder="Ej: Buenos Aires"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">País</label>
          <input
            type="text"
            value={country}
            onChange={(e) => handleManualUpdate('country', e.target.value)}
            placeholder="Ej: Argentina"
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {mapUrl && (
        <div className="mt-3 p-2 bg-blue-100 text-blue-800 text-sm rounded">
          📍 <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="underline">
            Ver en OpenStreetMap
          </a>
        </div>
      )}
    </div>
  )
}
