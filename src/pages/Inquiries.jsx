import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import { useToast } from '../components/ToastProvider'
import { APP_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants'

export default function Inquiries() {
  const toast = useToast()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    start_date: '',
    end_date: ''
  })
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = APP_CONFIG.ITEMS_PER_PAGE
  const token = useSelector(s => s.auth.token)

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      
      const url = `/inquiries${params.toString() ? '?' + params.toString() : ''}`
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInquiries(response.data.data.inquiries || [])
    } catch (error) {
      console.error('Error loading inquiries:', error)
      toast.error(ERROR_MESSAGES.GENERIC)
    } finally {
      setLoading(false)
    }
  }, [filters, token, toast])

  useEffect(() => {
    loadInquiries()
    setCurrentPage(1)
  }, [loadInquiries])

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta consulta?')) return
    
    try {
      await api.delete(`/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(SUCCESS_MESSAGES.DELETED)
      loadInquiries()
      setSelectedInquiry(null)
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      toast.error(ERROR_MESSAGES.GENERIC)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInquiryType = (inquiry) => {
    return inquiry.property_id ? 'Consulta sobre Propiedad' : 'Contacto General'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Consultas</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="">Todos</option>
              <option value="property">Consultas sobre Propiedades</option>
              <option value="contact">Contacto General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Desde</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Hasta</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
        </div>

        {(filters.type || filters.start_date || filters.end_date) && (
          <div className="mt-4">
            <button
              onClick={() => setFilters({ type: '', start_date: '', end_date: '' })}
              className="text-sm text-blue-600 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de consultas */}
      {loading ? (
        <div className="text-center py-12">Cargando consultas...</div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No hay consultas que coincidan con los filtros
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Lista */}
          <div>
            <div className="space-y-3 mb-4">
              {inquiries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(inquiry => (
              <div
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className={`bg-white p-3 md:p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition ${
                  selectedInquiry?.id === inquiry.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base md:text-lg">{inquiry.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600">{inquiry.email}</p>
                    {inquiry.phone && (
                      <p className="text-xs md:text-sm text-gray-600">{inquiry.phone}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                    inquiry.property_id 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {getInquiryType(inquiry)}
                  </span>
                </div>
                
                {inquiry.property_title && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Propiedad:</span> {inquiry.property_title}
                  </p>
                )}
                
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                  {inquiry.message}
                </p>
                
                <p className="text-xs text-gray-500">
                  {formatDate(inquiry.created_at)}
                </p>
              </div>
            ))}
            </div>
            
            {/* Paginación */}
            {inquiries.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Anterior
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.ceil(inquiries.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
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
                  onClick={() => setCurrentPage(Math.min(Math.ceil(inquiries.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(inquiries.length / itemsPerPage)}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Detalle - Solo se muestra cuando hay una consulta seleccionada en mobile */}
          {selectedInquiry && (
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                  <h2 className="text-xl md:text-2xl font-bold">Detalle de la Consulta</h2>
                  <button
                    onClick={() => handleDelete(selectedInquiry.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs md:text-sm font-medium text-gray-600">Tipo</label>
                    <p className="text-base md:text-lg">{getInquiryType(selectedInquiry)}</p>
                  </div>

                  {selectedInquiry.property_title && (
                    <div>
                      <label className="text-xs md:text-sm font-medium text-gray-600">Propiedad</label>
                      <p className="text-base md:text-lg">{selectedInquiry.property_title}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre</label>
                    <p className="text-lg">{selectedInquiry.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-lg">
                      <a 
                        href={`mailto:${selectedInquiry.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedInquiry.email}
                      </a>
                    </p>
                  </div>

                  {selectedInquiry.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Teléfono</label>
                      <p className="text-lg">
                        <a 
                          href={`tel:${selectedInquiry.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedInquiry.phone}
                        </a>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Mensaje</label>
                    <p className="text-base whitespace-pre-wrap bg-gray-50 p-3 rounded">
                      {selectedInquiry.message}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha</label>
                    <p className="text-lg">{formatDate(selectedInquiry.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
