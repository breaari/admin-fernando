import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProperties } from '../store/slices/propertiesSlice'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { getFirstImage } from '../utils/imageHelper'
import { APP_CONFIG, STATUS_LABELS } from '../utils/constants'
import GoogleLocationInput from '../components/GoogleLocationInput'
import {
  FaRulerCombined,
  FaHome,
  FaBed,
  FaBath,
  FaCar,
  FaPlus,
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
} from 'react-icons/fa'

export default function Properties() {
  const dispatch = useDispatch()
  const list = useSelector(s => s.properties.list)

  const [thumbs, setThumbs] = useState({})
  const [marketStatuses, setMarketStatuses] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])
  const [operationTypes, setOperationTypes] = useState([])

  const [q, setQ] = useState('')
  const [location, setLocation] = useState({ query: '', city: '', state: '', country: '', lat: null, lng: null })
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMarket, setFilterMarket] = useState('')
  const [filterPropertyType, setFilterPropertyType] = useState('')
  const [filterOperationType, setFilterOperationType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = APP_CONFIG.ITEMS_PER_PAGE

  useEffect(() => {
    dispatch(fetchProperties())
  }, [dispatch])

  useEffect(() => {
    api.get('/catalog/market-statuses')
      .then(r => setMarketStatuses(r.data.data?.market_statuses || []))
      .catch(() => {})

    api.get('/catalog/property-types')
      .then(r => setPropertyTypes(r.data.data?.property_types || []))
      .catch(() => {})

    api.get('/catalog/operation-types')
      .then(r => setOperationTypes(r.data.data?.operation_types || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!list || list.length === 0) return

    list.forEach(p => {
      if ((!p.images || p.images.length === 0) && !thumbs[p.id]) {
        api.get(`/properties/${p.id}`)
          .then(r => {
            const prop = r.data.data
            const imageUrl = getFirstImage(prop.images)
            if (imageUrl) setThumbs(prev => ({ ...prev, [p.id]: imageUrl }))
          })
          .catch(() => {})
      }
    })
  }, [list, thumbs])

  const resolveMarketLabel = p => {
    let marketName = null
    const ms = p.market_status ?? p.market_status_id

    if (ms !== undefined && ms !== null) {
      const maybeId = parseInt(ms)

      if (!isNaN(maybeId)) {
        const found = marketStatuses.find(m => Number(m.id) === maybeId)
        marketName = found?.name || null
      }

      if (!marketName) {
        if (typeof ms === 'object') {
          marketName = ms.name || (ms.id ? marketStatuses.find(m => Number(m.id) === Number(ms.id))?.name : null)
        } else if (typeof ms === 'string') {
          marketName = ms
        }
      }
    }

    if (!marketName) return null

    const ml = marketName.toString().toLowerCase()

    if (ml.includes('rent') || ml.includes('alquil')) return 'Alquilado'
    if (ml.includes('sold') || ml.includes('vend')) return 'Vendido'
    if (ml.includes('available') || ml.includes('disponible')) return 'Disponible'

    return marketName
  }

  const filteredList = useMemo(() => {
    const normalize = v => (v || '').toString().trim().toLowerCase()

    return (list || []).filter(p => {
      const locationText = [
        p.street,
        p.street_number,
        p.city,
        p.neighborhood,
        p.province || p.state,
        p.country,
      ].filter(Boolean).join(' ')

      const text = `${p.title || ''} ${locationText} ${p.id || ''}`.toLowerCase()

      if (q && !text.includes(q.toLowerCase())) return false

      if (location.query.trim()) {
        const loc = normalize(location.query)

        const locationMatch =
          normalize(p.city).includes(loc) ||
          normalize(p.neighborhood).includes(loc) ||
          normalize(p.province || p.state).includes(loc) ||
          normalize(p.street).includes(loc) ||
          normalize(p.country).includes(loc) ||
          normalize(locationText).includes(loc)

        if (!locationMatch) return false
      }

      if (filterStatus) {
        const st = (p.status || '').toString().toLowerCase()
        if (filterStatus === 'published' && st !== 'published') return false
        if (filterStatus === 'draft' && st !== 'draft') return false
        if (filterStatus === 'paused' && st !== 'paused') return false
      }

      if (filterMarket) {
        const ml = (resolveMarketLabel(p) || '').toLowerCase()
        if (filterMarket === 'alquilado' && ml !== 'alquilado') return false
        if (filterMarket === 'vendido' && ml !== 'vendido') return false
        if (filterMarket === 'disponible' && ml !== 'disponible') return false
      }

      if (filterPropertyType && String(p.property_type_id || p.property_type) !== filterPropertyType) return false
      if (filterOperationType && String(p.operation_type_id || p.operation_type) !== filterOperationType) return false

      return true
    })
  }, [
    list,
    q,
    location,
    filterStatus,
    filterMarket,
    filterPropertyType,
    filterOperationType,
    marketStatuses,
  ])

  const clearFilters = () => {
    setQ('')
    setLocation({ query: '', city: '', state: '', country: '', lat: null, lng: null })
    setFilterStatus('')
    setFilterMarket('')
    setFilterPropertyType('')
    setFilterOperationType('')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-8 text-slate-900">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <span className="text-blue-900 tracking-[0.25em] text-xs uppercase block mb-3">
            Gestión inmobiliaria
          </span>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-2">
            Propiedades
          </h1>

          <p className="text-slate-600">
            Administrá publicaciones, estados, precios y disponibilidad del catálogo.
          </p>
        </div>

        <Link
          to="/admin/properties/new"
          className="inline-flex items-center justify-center gap-3 bg-blue-900 text-white h-12 px-5 rounded-md text-[11px] tracking-widest uppercase font-bold hover:bg-blue-700 transition"
        >
          <FaPlus />
          Nueva propiedad
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <FaFilter className="text-blue-900" />
          <h2 className="text-slate-950 font-bold">Filtros</h2>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <FaSearch className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-900" />
                <input
                  value={q}
                  onChange={e => {
                    setQ(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Título, ubicación o ID"
                  className="w-full bg-transparent border-0 border-b border-slate-200 focus:border-blue-900 focus:ring-0 pl-7 pr-0 py-3 text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            <div>
              <Label>Ubicación</Label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-900 z-10" />
                <GoogleLocationInput
                  value={location.query}
                  onChange={value => {
                    setLocation(prev => ({ ...prev, query: value }))
                    setCurrentPage(1)
                  }}
                  onSelect={place => {
                    setLocation({
                      query: place.query || '',
                      city: place.city || '',
                      state: place.state || '',
                      country: place.country || '',
                      lat: place.lat || null,
                      lng: place.lng || null,
                    })
                    setCurrentPage(1)
                  }}
                  placeholder="Ciudad, barrio o dirección"
                  className="w-full bg-transparent border-0 border-b border-slate-200 focus:border-blue-900 focus:ring-0 pl-7 pr-0 py-3 text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            <SelectField
              label="Publicación"
              value={filterStatus}
              onChange={value => {
                setFilterStatus(value)
                setCurrentPage(1)
              }}
              options={[
                { value: '', label: 'Todos' },
                { value: 'published', label: 'Publicado' },
                { value: 'draft', label: 'Borrador' },
                { value: 'paused', label: 'En pausa' },
              ]}
            />

            <SelectField
              label="Mercado"
              value={filterMarket}
              onChange={value => {
                setFilterMarket(value)
                setCurrentPage(1)
              }}
              options={[
                { value: '', label: 'Todos' },
                { value: 'disponible', label: 'Disponible' },
                { value: 'alquilado', label: 'Alquilado' },
                { value: 'vendido', label: 'Vendido' },
              ]}
            />

            <SelectField
              label="Tipo"
              value={filterPropertyType}
              onChange={value => {
                setFilterPropertyType(value)
                setCurrentPage(1)
              }}
              options={[
                { value: '', label: 'Todos' },
                ...propertyTypes.map(t => ({ value: String(t.id), label: t.name })),
              ]}
            />

            <SelectField
              label="Operación"
              value={filterOperationType}
              onChange={value => {
                setFilterOperationType(value)
                setCurrentPage(1)
              }}
              options={[
                { value: '', label: 'Todas' },
                ...operationTypes.map(t => ({ value: String(t.id), label: t.name })),
              ]}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="h-11 px-5 border border-slate-200 text-slate-600 rounded-md text-[11px] tracking-widest uppercase font-bold hover:border-blue-900 hover:text-blue-900 transition"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Metric label="Resultados" value={filteredList.length} />
        <Metric label="Total cargadas" value={list?.length || 0} />
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-16 border border-slate-200 bg-white rounded-xl text-slate-500 shadow-sm">
          <FaHome className="text-blue-900 text-4xl mx-auto mb-4" />
          {(list?.length || 0) === 0
            ? 'No hay propiedades aún'
            : 'No hay propiedades que coincidan con los filtros'}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedList.map(p => {
            const img = getFirstImage(p.images) || thumbs[p.id] || null
            const rawStatus = (p.market_status?.name || p.status || '').toString()
            const sLower = rawStatus.toLowerCase()
            const statusLabel = p.market_status?.name || STATUS_LABELS[sLower] || rawStatus || '—'
            const isPublished = sLower === 'published'
            const marketLabel = resolveMarketLabel(p)

            return (
              <div
                key={p.id}
                className="flex flex-col md:flex-row w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-900 transition"
              >
                <div className="w-full md:w-56 h-52 md:h-44 flex-shrink-0 bg-slate-100">
                  {img ? (
                    <img src={img} alt={p.title || 'Propiedad'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <FaHome className="text-4xl" />
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Link to={`/admin/properties/${p.id}`}>
                        <h3 className="font-bold text-xl text-slate-950 hover:text-blue-900 transition truncate">
                          {p.title || 'Sin título'}
                        </h3>
                      </Link>

                      <p className="text-sm text-slate-500 mt-1">
                        ID: {p.id}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {marketLabel && <Badge variant="blue">{marketLabel}</Badge>}
                      <Badge variant={isPublished ? 'green' : 'neutral'}>{statusLabel}</Badge>
                    </div>
                  </div>

                  <p className="text-blue-900 font-bold text-2xl mb-2">
                    ${Number(p.price || 0).toLocaleString()} {p.currency}
                  </p>

                  {p.expenses_amount ? (
                    <p className="text-sm text-slate-500 mb-2">
                      Expensas: {p.expenses_amount} {p.expenses_currency || p.currency}
                    </p>
                  ) : null}

                  <p className="text-sm text-slate-600 mb-4 line-clamp-1">
                    {[p.street, p.street_number, p.city, p.neighborhood].filter(Boolean).join(', ')}
                  </p>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                    <Feature icon={<FaRulerCombined />} value={`${p.surface_total || '—'} m²`} />
                    <Feature icon={<FaHome />} value={`${p.surface_covered || '—'} m² cub.`} />
                    <Feature icon={<FaBed />} value={p.rooms ?? p.ambientes ?? '—'} />
                    <Feature icon={<FaBath />} value={p.bathrooms ?? '—'} />
                    <Feature icon={<FaCar />} value={p.garages ?? p.cocheras ?? 0} />
                  </div>
                </div>
              </div>
            )
          })}

          {filteredList.length > itemsPerPage && (
            <div className="flex flex-wrap justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md disabled:opacity-40 hover:border-blue-900 hover:text-blue-900 transition bg-white"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-md transition ${
                    currentPage === page
                      ? 'bg-blue-900 border-blue-900 text-white font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-900 hover:text-blue-900'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md disabled:opacity-40 hover:border-blue-900 hover:text-blue-900 transition bg-white"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Label({ children }) {
  return (
    <label className="text-slate-500 text-[10px] tracking-widest uppercase font-bold block mb-2">
      {children}
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent border-0 border-b border-slate-200 focus:border-blue-900 focus:ring-0 px-0 py-3 text-slate-900 outline-none"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm border-l-4 border-l-blue-900">
      <p className="text-slate-500 text-[10px] tracking-widest uppercase font-bold mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function Badge({ children, variant }) {
  const classes = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-900',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-[11px] tracking-wider uppercase font-bold border ${classes[variant] || classes.neutral}`}>
      {children}
    </span>
  )
}

function Feature({ icon, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-full">
      <span className="text-blue-900">{icon}</span>
      <span>{value}</span>
    </div>
  )
}