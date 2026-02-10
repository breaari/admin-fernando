import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProperties } from '../store/slices/propertiesSlice'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { getFirstImage } from '../utils/imageHelper'
import { APP_CONFIG, STATUS_LABELS } from '../utils/constants'
import { FaRulerCombined, FaHome, FaBed, FaBath, FaCar } from 'react-icons/fa'

export default function Properties(){
  const dispatch = useDispatch()
  const list = useSelector(s => s.properties.list)
  const [thumbs, setThumbs] = useState({})
  const [marketStatuses, setMarketStatuses] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])
  const [operationTypes, setOperationTypes] = useState([])

  // Filters / Search
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMarket, setFilterMarket] = useState('')
  const [filterPropertyType, setFilterPropertyType] = useState('')
  const [filterOperationType, setFilterOperationType] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterNeighborhood, setFilterNeighborhood] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = APP_CONFIG.ITEMS_PER_PAGE

  useEffect(()=>{ dispatch(fetchProperties()) }, [dispatch])

  useEffect(()=>{
    api.get('/catalog/market-statuses').then(r=> setMarketStatuses(r.data.data?.market_statuses || [])).catch(()=>{})
  }, [])

  useEffect(()=>{
    api.get('/catalog/property-types').then(r=> setPropertyTypes(r.data.data?.property_types || [])).catch(()=>{})
    api.get('/catalog/operation-types').then(r=> setOperationTypes(r.data.data?.operation_types || [])).catch(()=>{})
  }, [])

  useEffect(()=>{
    if(!list || list.length === 0) return
    list.forEach(p => {
      if((!p.images || p.images.length === 0) && !thumbs[p.id]){
        api.get(`/properties/${p.id}`).then(r=>{
          const prop = r.data.data
          const imageUrl = getFirstImage(prop.images)
          if(imageUrl){
            setThumbs(prev => ({...prev, [p.id]: imageUrl}))
          }
        }).catch(()=>{})
      }
    })
  }, [list, thumbs])

  const filteredList = useMemo(() => {
    const resolveMarketLabel = (p) => {
      let marketName = null
      const ms = (p.market_status ?? p.market_status_id)
      if(ms !== undefined && ms !== null){
        const maybeId = parseInt(ms)
        if(!isNaN(maybeId)){
          const found = marketStatuses.find(m => Number(m.id) === maybeId)
          marketName = found?.name || null
        }
        if(!marketName){
          if(typeof ms === 'object') marketName = ms.name || (ms.id ? (marketStatuses.find(m=>Number(m.id)===Number(ms.id))?.name) : null)
          else if(typeof ms === 'string') marketName = ms
        }
      }
      if(!marketName) return null
      const ml = marketName.toString().toLowerCase()
      if(ml.includes('rent') || ml.includes('alquil')) return 'Alquilado'
      if(ml.includes('sold') || ml.includes('vend')) return 'Vendido'
      if(ml.includes('available')) return 'Disponible'
      return marketName
    }

    const normalize = (v) => (v || '').toString().trim().toLowerCase()

    return (list || []).filter(p => {
      const locationText = [
        p.street,
        p.street_number,
        p.city,
        p.neighborhood,
        p.province || p.state,
        p.country
      ].filter(Boolean).join(' ')
      const text = ((p.title || '') + ' ' + locationText + ' ' + (p.id || '')).toLowerCase()
      if(q && !text.includes(q.toLowerCase())) return false

      if(filterStatus){
        const st = (p.status || '').toString().toLowerCase()
        if(filterStatus === 'published' && st !== 'published') return false
        if(filterStatus === 'draft' && st !== 'draft') return false
        if(filterStatus === 'paused' && st !== 'paused') return false
      }

      if(filterMarket){
        const ml = (resolveMarketLabel(p) || '').toLowerCase()
        if(filterMarket === 'alquilado' && ml !== 'alquilado') return false
        if(filterMarket === 'vendido' && ml !== 'vendido') return false
        if(filterMarket === 'disponible' && ml !== 'disponible') return false
      }

      if(filterPropertyType && String(p.property_type_id || p.property_type)?.toString() !== filterPropertyType) return false
      if(filterOperationType && String(p.operation_type_id || p.operation_type)?.toString() !== filterOperationType) return false

      if(filterCountry && !normalize(p.country).includes(normalize(filterCountry))) return false
      const stateVal = (p.state || p.province || '')
      if(filterState && !normalize(stateVal).includes(normalize(filterState))) return false
      if(filterCity && !normalize(p.city).includes(normalize(filterCity))) return false
      if(filterNeighborhood && !normalize(p.neighborhood).includes(normalize(filterNeighborhood))) return false

      return true
    })
  }, [list, q, filterStatus, filterMarket, filterPropertyType, filterOperationType, filterCountry, filterState, filterCity, filterNeighborhood, marketStatuses])

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg md:text-xl font-semibold">Propiedades</h2>
        <Link to="/admin/properties/new" className="bg-primary text-white px-3 py-2 rounded text-sm md:text-base whitespace-nowrap">+ Nueva propiedad</Link>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." className="flex-1 p-2 border rounded text-sm md:text-base" />
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="p-2 border rounded text-sm md:text-base">
            <option value="">Todos estados</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="paused">En Pausa</option>
          </select>
          <select value={filterMarket} onChange={e=>setFilterMarket(e.target.value)} className="p-2 border rounded text-sm md:text-base">
            <option value="">Estado mercado</option>
            <option value="alquilado">Alquilado</option>
            <option value="vendido">Vendido</option>
            <option value="disponible">Disponible</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input type="text" value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} placeholder="País" className="p-2 border rounded text-sm md:text-base" />
          <input type="text" value={filterState} onChange={e=>setFilterState(e.target.value)} placeholder="Provincia" className="p-2 border rounded text-sm md:text-base" />
          <input type="text" value={filterCity} onChange={e=>setFilterCity(e.target.value)} placeholder="Ciudad" className="p-2 border rounded text-sm md:text-base" />
          <input type="text" value={filterNeighborhood} onChange={e=>setFilterNeighborhood(e.target.value)} placeholder="Barrio" className="p-2 border rounded text-sm md:text-base" />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <select value={filterPropertyType} onChange={e=>setFilterPropertyType(e.target.value)} className="p-2 border rounded text-sm md:text-base">
            <option value="">Todos los tipos</option>
            {propertyTypes.map(t=> <option key={t.id} value={String(t.id)}>{t.name}</option>)}
          </select>
          <select value={filterOperationType} onChange={e=>setFilterOperationType(e.target.value)} className="p-2 border rounded text-sm md:text-base">
            <option value="">Todas las operaciones</option>
            {operationTypes.map(t=> <option key={t.id} value={String(t.id)}>{t.name}</option>)}
          </select>
          <button onClick={()=>{setQ(''); setFilterStatus(''); setFilterMarket(''); setFilterPropertyType(''); setFilterOperationType(''); setFilterCountry(''); setFilterState(''); setFilterCity(''); setFilterNeighborhood(''); }} className="px-3 py-2 border rounded text-sm md:text-base">Limpiar</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {filteredList.length === 0 ? (
          <div className="text-gray-500">{(list?.length || 0) === 0 ? 'No hay propiedades aun' : 'No hay propiedades que coincidan con los filtros'}</div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => {
              const img = getFirstImage(p.images) || thumbs[p.id] || null

              const rawStatus = (p.market_status?.name || p.status || '').toString()
              const sLower = rawStatus.toLowerCase()
              const statusLabel = p.market_status?.name || STATUS_LABELS[sLower] || rawStatus || '—'
              const statusClass = (sLower === 'published' || statusLabel.toLowerCase().includes('venta') || statusLabel.toLowerCase().includes('vendido')) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'

              let marketName = null
              const ms = (p.market_status ?? p.market_status_id)
              if(ms !== undefined && ms !== null){
                const maybeId = parseInt(ms)
                if(!isNaN(maybeId)){
                  const found = marketStatuses.find(m => Number(m.id) === maybeId)
                  marketName = found?.name || null
                }
                if(!marketName){
                  if(typeof ms === 'object') marketName = ms.name || (ms.id ? (marketStatuses.find(m=>m.id === ms.id)?.name) : null)
                  else if(typeof ms === 'string') marketName = ms
                }
              }
              const marketLower = (marketName || '').toString().toLowerCase()
              const marketLabel = marketName ? (
                marketLower.includes('rent') || marketLower.includes('alquil') ? 'Alquilado' :
                marketLower.includes('sold') || marketLower.includes('vend') ? 'Vendido' :
                marketLower.includes('available') ? 'Disponible' : marketName
              ) : null

              return (
                <div key={p.id} className="flex flex-col md:flex-row w-full border rounded overflow-hidden shadow-sm bg-white">
                  <div className="w-full md:w-48 h-48 md:h-40 flex-shrink-0 bg-gray-100">
                    {img ? (
                      <img src={img} alt={p.title || 'Propiedad'} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FaHome className="text-3xl" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                      <div className="flex flex-wrap items-center gap-2 max-w-xl">
                        <Link to={`/admin/properties/${p.id}`}>
                          <h3 className="font-semibold text-base md:text-lg truncate hover:text-blue-600 cursor-pointer transition">{p.title || 'Sin título'}</h3>
                        </Link>
                        {marketLabel && (
                          <span className="px-2 py-1 rounded text-xs md:text-sm bg-yellow-100 text-yellow-800">{marketLabel}</span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs md:text-sm ${statusClass} whitespace-nowrap`}>{statusLabel}</span>
                    </div>

                    <div className="text-primary font-bold text-lg md:text-xl mb-2">${p.price} {p.currency}</div>
                    {p.expenses_amount ? (<div className="text-xs md:text-sm text-gray-600 mb-2">Expensas: {p.expenses_amount} {p.expenses_currency || p.currency}</div>) : null}
                    <div className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-1">{[p.street, p.street_number, p.city, p.neighborhood].filter(Boolean).join(', ')}</div>

                    <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 md:gap-6 text-xs md:text-sm text-gray-700">
                      <div className="flex items-center gap-1 md:gap-2"><FaRulerCombined className="text-gray-500"/><span>{p.surface_total || '—'} m²</span></div>
                      <div className="hidden sm:flex items-center gap-1 md:gap-2"><FaHome className="text-gray-500"/><span>{p.surface_covered || '—'} m²</span></div>
                      <div className="flex items-center gap-1 md:gap-2"><FaBed className="text-gray-500"/><span>{p.rooms ?? p.ambientes ?? '—'}</span></div>
                      <div className="flex items-center gap-1 md:gap-2"><FaBath className="text-gray-500"/><span>{p.bathrooms ?? '—'}</span></div>
                      <div className="flex items-center gap-1 md:gap-2"><FaCar className="text-gray-500"/><span>{p.garages ?? p.cocheras ?? 0}</span></div>
                    </div>

                    <div className="mt-auto flex justify-end items-center pt-2">
                      <div className="text-xs md:text-sm text-gray-500">ID: {p.id}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
            
            {/* Paginación */}
            {filteredList.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Anterior
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.ceil(filteredList.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded ${
                        currentPage === page 
                          ? 'bg-blue-500 text-white' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(filteredList.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(filteredList.length / itemsPerPage)}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
