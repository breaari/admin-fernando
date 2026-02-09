import React, {useEffect, useState} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import LocationPicker from '../components/LocationPicker'

// Componente para seleccionar múltiples items (amenities, tags)
function MultiSelect({label, items, selected, onChange, required}) {
  return (
    <div className="mb-4">
      <label className="block mb-2 font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="border rounded p-3 bg-gray-50 max-h-48 overflow-y-auto">
        {items && items.length > 0 ? (
          items.map(item => (
            <label key={item.id} className="flex items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected && selected.includes(item.id)}
                onChange={(e) => {
                  if(e.target.checked) {
                    onChange([...(selected || []), item.id])
                  } else {
                    onChange((selected || []).filter(x => x !== item.id))
                  }
                }}
                className="mr-2"
              />
              <span>{item.name}</span>
            </label>
          ))
        ) : (
          <p className="text-gray-500">No hay elementos disponibles</p>
        )}
      </div>
    </div>
  )
}

// Componente para input numérico con select
function NumericSelect({label, value, onChange, required, disabled, max = 20}) {
  const options = Array.from({length: max + 1}, (_, i) => i)
  return (
    <div>
      <label className="block mb-2 font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select 
        value={value || ''} 
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        disabled={disabled}
        className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Seleccionar</option>
        {options.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

export default function PropertyEdit(){
  const { id } = useParams()
  const nav = useNavigate()
  
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Catálogos
  const [propertyTypes, setPropertyTypes] = useState([])
  const [operationTypes, setOperationTypes] = useState([])
  const [marketStatuses, setMarketStatuses] = useState([])
  const [amenities, setAmenities] = useState([])
  const [tags, setTags] = useState([])
  
  // Relaciones
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [images, setImages] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(()=>{
    if(id && id !== 'new'){
      api.get(`/properties/${id}`).then(r=> {
        const prop = r.data.data
        // normalize image urls
        if (prop.images && Array.isArray(prop.images)) {
          prop.images = prop.images.map(img => ({
            ...img,
            image_url: normalizeImageUrl(img.image_url)
          }))
        }
        setProperty({
          ...prop,
          state: prop.state || prop.province || ''
        })
        setSelectedAmenities(prop.amenities?.map(a => a.id) || [])
        setSelectedTags(prop.tags?.map(t => t.id) || [])
        setImages(prop.images || [])
      }).catch(err=> console.error('Error cargando propiedad:', err))
    } else {
      setProperty({ 
        title: '', 
        description: '',
        price: 0, 
        currency: 'ARS', 
        status: 'draft',
        is_new: false,
        is_featured: false
      })
      setSelectedAmenities([])
      setSelectedTags([])
      setImages([])
    }
  },[id])

  function normalizeImageUrl(img) {
    if(!img) return img
    // If it's an absolute URL, return as is
    if (img.startsWith('http') || img.startsWith('//')) return img
    // Replace backslashes with slashes (Windows paths)
    let v = img.replace(/\\/g, '/')
    // Ensure leading slash
    if (!v.startsWith('/')) v = '/' + v
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return base.replace(/\/$/, '') + v
  }

  useEffect(()=>{
    Promise.all([
      api.get('/catalog/property-types').then(r=> setPropertyTypes(r.data.data.property_types || [])),
      api.get('/catalog/operation-types').then(r=> setOperationTypes(r.data.data.operation_types || [])),
      api.get('/catalog/market-statuses').then(r=> setMarketStatuses(r.data.data.market_statuses || [])),
      api.get('/catalog/amenities').then(r=> setAmenities(r.data.data.amenities || [])),
      api.get('/catalog/tags').then(r=> setTags(r.data.data.tags || []))
    ]).catch(err=> console.error('Error cargando catálogos:', err))
  },[])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if(!file) {
      return
    }
    // If this is a new property, keep the file locally as a preview and queue for upload after save
    if(!id || id === 'new') {
      const previewUrl = URL.createObjectURL(file)
      const localImg = {
        _localId: 'local_' + Date.now() + Math.random().toString(36).slice(2,8),
        isLocal: true,
        file,
        preview_url: previewUrl
      }
      setImages(prev => [...(prev || []), localImg])
      e.target.value = ''
      return
    }

    // Existing property: upload immediately
    const formData = new FormData()
    formData.append('image', file)
    api.post(`/properties/${id}/images`, formData, {headers:{'Content-Type':'multipart/form-data'}})
      .then(r=> {
        const newImage = r.data.data || r.data
        if (newImage && newImage.id) {
          newImage.image_url = normalizeImageUrl(newImage.image_url)
          setImages(prev => [...(prev || []), newImage])
          toast.success('Imagen subida correctamente')
        } else {
          console.error('Estructura de imagen inesperada:', newImage)
          toast.error('Error: estructura de respuesta inesperada')
        }
        e.target.value = ''
      })
      .catch(err=> {
        console.error('Error:', err.response || err)
        toast.error('Error al subir imagen: ' + (err.response?.data?.message || err.message))
      })
  }

  const deleteImage = (img) => {
    // Local preview - just remove
    if(img.isLocal) {
      setImages(prev => (prev || []).filter(x => x._localId !== img._localId))
      // revoke object URL
      if(img.preview_url) URL.revokeObjectURL(img.preview_url)
      toast.info('Imagen local eliminada')
      return
    }

    // Existing image - confirm then delete via API
    setDeleteConfirm({
      img,
      onConfirm: () => {
        api.delete(`/properties/${id}/images/${img.id}`)
          .then(()=> {
            setImages(prev => (prev || []).filter(x=> x.id !== img.id))
            toast.success('Imagen eliminada correctamente')
            setDeleteConfirm(null)
          })
          .catch(err=> {
            toast.error('Error al eliminar imagen')
            setDeleteConfirm(null)
          })
      },
      onCancel: () => setDeleteConfirm(null)
    })
  }

  const save = async ()=>{
    try {
      if(!property.title?.trim()) {
        toast.error('El título es obligatorio')
        return
      }
      if(!property.price || property.price <= 0) {
        toast.error('El precio es obligatorio y debe ser mayor a 0')
        return
      }
      if(!property.property_type_id) {
        toast.error('El tipo de propiedad es obligatorio')
        return
      }
      if(!property.operation_type_id) {
        toast.error('El tipo de operación es obligatorio')
        return
      }

      const payload = {
        ...property,
        province: property.state || property.province,
        amenity_ids: selectedAmenities,
        tag_ids: selectedTags
      }

      setLoading(true)

      if(id === 'new'){
        const res = await api.post('/properties', payload)
        const newId = res.data.data?.id || res.data.id
        toast.success('Propiedad creada correctamente')

        // Upload any locally queued images
        const localImages = (images || []).filter(i => i && i.isLocal)
        if(localImages.length > 0 && newId) {
          try {
            await Promise.all(localImages.map(li => {
              const fd = new FormData()
              fd.append('image', li.file)
              return api.post(`/properties/${newId}/images`, fd, {headers:{'Content-Type':'multipart/form-data'}})
                .then(r => {
                  const uploaded = r.data.data || r.data
                  if (uploaded && uploaded.id) uploaded.image_url = normalizeImageUrl(uploaded.image_url)
                  // replace local preview with uploaded image
                  setImages(prev => {
                    const others = (prev || []).filter(x => x._localId !== li._localId)
                    return [...others, uploaded]
                  })
                })
            }))
            toast.success('Imágenes subidas correctamente')
          }catch(e){
            console.error('Error subiendo imágenes locales:', e)
            toast.error('Error subiendo algunas imágenes')
          }
        }

        setTimeout(() => nav('/admin/properties'), 1500)
      } else {
        await api.put(`/properties/${id}`, payload)
        toast.success('Propiedad guardada correctamente')
        setTimeout(() => nav('/admin/properties'), 1500)
      }
    }catch(e){ 
      toast.error('Error al guardar: ' + (e.response?.data?.message || e.message)) 
    } finally {
      setLoading(false)
    }
  }

  if(!property) return <div className="p-4">Cargando...</div>

  return (
    <div className="bg-white p-6 rounded shadow max-w-5xl">
      <h2 className="text-2xl font-semibold mb-4">
        {id === 'new' ? 'Nueva Propiedad' : 'Editar Propiedad'}
      </h2>

      {/* Datos Básicos */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Datos Básicos</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Título <span className="text-red-500">*</span></label>
            <input 
              value={property.title || ''} 
              onChange={e=>setProperty({...property, title:e.target.value})} 
              className="w-full p-2 border rounded"
              placeholder="Ej: Departamento 2 amb en Belgrano"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Descripción</label>
            <textarea 
              value={property.description || ''} 
              onChange={e=>setProperty({...property, description:e.target.value})} 
              className="w-full p-2 border rounded" 
              rows="3"
            />
          </div>
        </div>
      </fieldset>

      {/* Precio y Expensas */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Precio y Expensas</legend>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Precio <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              value={property.price || ''} 
              onChange={e=>setProperty({...property, price:e.target.value})} 
              className="w-full p-2 border rounded no-spin"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Moneda</label>
            <select 
              value={property.currency || 'ARS'} 
              onChange={e=>setProperty({...property, currency:e.target.value})} 
              className="w-full p-2 border rounded"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold">Expensas</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={property.expenses_amount || ''} 
                onChange={e=>setProperty({...property, expenses_amount:e.target.value})} 
                className="flex-1 p-2 border rounded no-spin"
                step="0.01"
                min="0"
                placeholder="Monto"
              />
              <select 
                value={property.expenses_currency || 'ARS'} 
                onChange={e=>setProperty({...property, expenses_currency:e.target.value})} 
                className="w-20 p-2 border rounded"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Ubicación */}
      <LocationPicker 
        initialValues={{
          street: property.street,
          street_number: property.street_number,
          city: property.city,
          state: property.state,
          country: property.country,
          neighborhood: property.neighborhood
        }}
        onLocationSelect={(loc) => {
          setProperty(prev => ({
            ...prev,
            street: loc.street,
            street_number: loc.street_number,
            city: loc.city,
            state: loc.state,
            country: loc.country,
            neighborhood: loc.neighborhood
          }))
        }}
      />

      {/* Piso y Departamento */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Piso y Departamento</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Piso</label>
            <input 
              value={property.floor || ''} 
              onChange={e=>setProperty({...property, floor:e.target.value})} 
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Departamento</label>
            <input 
              value={property.apartment || ''} 
              onChange={e=>setProperty({...property, apartment:e.target.value})} 
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </fieldset>

      {/* Características Físicas */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Características Físicas</legend>
        <div className="grid grid-cols-4 gap-4">
          <NumericSelect max={6} label="Dormitorios" value={property.bedrooms} onChange={v=>setProperty({...property, bedrooms:v})} />
          <NumericSelect max={6} label="Ambientes" value={property.rooms} onChange={v=>setProperty({...property, rooms:v})} />
          <NumericSelect max={6} label="Baños" value={property.bathrooms} onChange={v=>setProperty({...property, bathrooms:v})} />
          <NumericSelect label="Cocheras" value={property.garages} onChange={v=>setProperty({...property, garages:v})} />
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block mb-2 font-semibold">Superficie Total (m²)</label>
            <input 
              type="number" 
              value={property.surface_total || ''} 
              onChange={e=>setProperty({...property, surface_total:e.target.value})} 
              className="w-full p-2 border rounded no-spin"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Superficie Cubierta (m²)</label>
            <input 
              type="number" 
              value={property.surface_covered || ''} 
              onChange={e=>setProperty({...property, surface_covered:e.target.value})} 
              className="w-full p-2 border rounded no-spin"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Superficie Semi-Cubierta (m²)</label>
            <input 
              type="number" 
              value={property.surface_semi_covered || ''} 
              onChange={e=>setProperty({...property, surface_semi_covered:e.target.value})} 
              className="w-full p-2 border rounded no-spin"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Superficie Descubierta (m²)</label>
            <input 
              type="number" 
              value={property.surface_uncovered || ''} 
              onChange={e=>setProperty({...property, surface_uncovered:e.target.value})} 
              className="w-full p-2 border rounded no-spin"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <NumericSelect label="Pisos" value={property.total_floors} onChange={v=>setProperty({...property, total_floors:v})} />
          
          <div>
            <label className="block mb-2 font-semibold">¿Es Nuevo?</label>
            <select 
              value={property.is_new ? '1' : '0'} 
              onChange={e=>setProperty({...property, is_new:e.target.value === '1'})} 
              className="w-full p-2 border rounded"
            >
              <option value="0">No</option>
              <option value="1">Sí</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Antigüedad (años) {property.is_new && <span className="text-gray-400 text-sm">(deshabilitado)</span>}
            </label>
            <input 
              type="number" 
              value={property.antiquity_years || ''} 
              onChange={e=>setProperty({...property, antiquity_years:e.target.value})} 
              disabled={property.is_new}
              className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed no-spin"
              min="0"
            />
          </div>
        </div>
      </fieldset>

      {/* Tipo y Estado */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Tipo y Estado</legend>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Tipo de Propiedad <span className="text-red-500">*</span></label>
            <select 
              value={property.property_type_id || ''} 
              onChange={e=>setProperty({...property, property_type_id:e.target.value})} 
              className="w-full p-2 border rounded"
            >
              <option value="">Seleccionar</option>
              {propertyTypes.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Tipo de Operación <span className="text-red-500">*</span></label>
            <select 
              value={property.operation_type_id || ''} 
              onChange={e=>setProperty({...property, operation_type_id:e.target.value})} 
              className="w-full p-2 border rounded"
            >
              <option value="">Seleccionar</option>
              {operationTypes.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Estado de Publicación</label>
            <select 
              value={property.status || 'draft'} 
              onChange={e=>setProperty({...property, status:e.target.value})} 
              className="w-full p-2 border rounded"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="paused">En Pausa</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block mb-2 font-semibold">Estado de la Propiedad</label>
          <select 
            value={property.market_status_id || ''} 
            onChange={e=>setProperty({...property, market_status_id:e.target.value})} 
            className="w-full p-2 border rounded"
          >
            <option value="">Seleccionar</option>
            {marketStatuses.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </fieldset>

      {/* Características Especiales */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Características Especiales</legend>
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={property.is_featured || false} 
            onChange={e=>setProperty({...property, is_featured:e.target.checked})} 
            className="mr-2 w-4 h-4"
          />
          <span>Destacado</span>
        </label>
      </fieldset>

      {/* Amenities */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Amenidades</legend>
        <MultiSelect 
          label="Selecciona amenidades" 
          items={amenities} 
          selected={selectedAmenities}
          onChange={setSelectedAmenities}
        />
      </fieldset>

      {/* Tags */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Etiquetas</legend>
        <MultiSelect 
          label="Selecciona etiquetas" 
          items={tags} 
          selected={selectedTags}
          onChange={setSelectedTags}
        />
      </fieldset>

      {/* Fotos */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Fotos</legend>
        <div>
          <label className="block mb-2 font-semibold">Agregar Foto</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageUpload}
            className="block mb-2"
          />
          {id === 'new' && <p className="text-gray-500 text-sm mb-2">Las imágenes se guardarán después de crear la propiedad</p>}

          {(images && images.length > 0) && (
            <div className="grid grid-cols-3 gap-4">
              {(images || []).map(img=> (
                <div key={img.id || img._localId} className="relative group">
                  <img 
                    src={img.isLocal ? img.preview_url : normalizeImageUrl(img.image_url)} 
                    alt="Propiedad" 
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={()=> deleteImage(img)}
                    className="absolute top-1 right-1 bg-red-500 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {/* Videos */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Videos</legend>
        <div>
          <label className="block mb-2 font-semibold">URL del Video</label>
          <input 
            type="url"
            value={property.video_url || ''}
            onChange={e=>setProperty({...property, video_url:e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="https://youtube.com/watch?v=..."
          />
          {property.video_url && (
            <p className="text-sm text-gray-500 mt-2">
              Soporta videos de YouTube, Vimeo y enlaces directos
            </p>
          )}
        </div>
      </fieldset>

      {/* Notas */}
      <fieldset className="border border-gray-300 p-4 mb-4 rounded">
        <legend className="text-lg font-semibold px-2">Notas Privadas</legend>
        <textarea 
          value={property.private_notes || ''} 
          onChange={e=>setProperty({...property, private_notes:e.target.value})} 
          className="w-full p-2 border rounded" 
          rows="3"
          placeholder="Notas solo visibles para administradores"
        />
      </fieldset>

      {/* Botones */}
      <div className="flex gap-2 mt-6">
        <button 
          onClick={save}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button 
          onClick={()=>nav('/admin/properties')}
          className="px-6 py-2 border rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar esta imagen?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={deleteConfirm.onCancel}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={deleteConfirm.onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}
