import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import { useToast } from '../components/ToastProvider'
import { APP_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants'
import {
  FaEnvelopeOpenText,
  FaTrash,
  FaPhoneAlt,
  FaEnvelope,
  FaBuilding,
  FaCalendarAlt,
  FaFilter,
} from 'react-icons/fa'

export default function Inquiries() {
  const toast = useToast()
  const token = useSelector(s => s.auth.token)

  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [filters, setFilters] = useState({
    type: '',
    start_date: '',
    end_date: '',
  })

  const itemsPerPage = 5

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)

      const url = `/inquiries${params.toString() ? '?' + params.toString() : ''}`

      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const list = response.data.data.inquiries || []

      setInquiries(list)
      setSelectedInquiry(prev => prev || list[0] || null)
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

  const handleDelete = async id => {
    if (!window.confirm('¿Está seguro de eliminar esta consulta?')) return

    try {
      await api.delete(`/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success(SUCCESS_MESSAGES.DELETED)
      setSelectedInquiry(null)
      loadInquiries()
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      toast.error(ERROR_MESSAGES.GENERIC)
    }
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      start_date: '',
      end_date: '',
    })
  }

  const formatDate = dateString => {
    const date = new Date(dateString)

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getInquiryType = inquiry => {
    return inquiry.property_id ? 'Consulta sobre propiedad' : 'Contacto general'
  }

  const totalPages = Math.ceil(inquiries.length / itemsPerPage)
  const paginatedInquiries = inquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-8 text-slate-900">
      <div>
        <span className="text-blue-900 tracking-[0.25em] text-xs uppercase block mb-3">
          Gestión comercial
        </span>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-2">
              Consultas
            </h1>
            <p className="text-slate-600">
              Revisá los mensajes recibidos desde propiedades, contacto y formularios.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 min-w-[170px] shadow-sm">
            <p className="text-blue-900 text-[10px] tracking-widest uppercase font-bold mb-1">
              Total
            </p>
            <p className="text-2xl font-bold text-slate-950">
              {loading ? '...' : inquiries.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <FaFilter className="text-blue-900" />
          <h2 className="text-slate-950 font-bold">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <SelectField
            label="Tipo"
            value={filters.type}
            onChange={value => setFilters({ ...filters, type: value })}
            options={[
              { value: '', label: 'Todos' },
              { value: 'property', label: 'Consultas sobre propiedades' },
              { value: 'contact', label: 'Contacto general' },
            ]}
          />

          <DateField
            label="Desde"
            value={filters.start_date}
            onChange={value => setFilters({ ...filters, start_date: value })}
          />

          <DateField
            label="Hasta"
            value={filters.end_date}
            onChange={value => setFilters({ ...filters, end_date: value })}
          />
        </div>

        {(filters.type || filters.start_date || filters.end_date) && (
          <button
            onClick={clearFilters}
            className="mt-5 text-blue-900 text-[11px] tracking-widest uppercase font-bold hover:opacity-80 transition"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <EmptyState text="Cargando consultas..." />
      ) : inquiries.length === 0 ? (
        <EmptyState text="No hay consultas que coincidan con los filtros" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-4">
            {paginatedInquiries.map(inquiry => (
              <button
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className={`
                  w-full text-left bg-white border rounded-xl p-5 transition shadow-sm
                  ${
                    selectedInquiry?.id === inquiry.id
                      ? 'border-blue-900 ring-2 ring-blue-900/20'
                      : 'border-slate-200 hover:border-blue-900/40 hover:shadow-md'
                  }
                `}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-slate-950 text-lg font-bold mb-1">
                      {inquiry.name}
                    </h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-2">
                        <FaEnvelope className="text-blue-900" />
                        {inquiry.email}
                      </span>

                      {inquiry.phone && (
                        <span className="flex items-center gap-2">
                          <FaPhoneAlt className="text-blue-900" />
                          {inquiry.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge type={inquiry.property_id ? 'property' : 'contact'}>
                    {getInquiryType(inquiry)}
                  </Badge>
                </div>

                {inquiry.property_title && (
                  <p className="text-sm text-slate-700 mb-3 flex items-center gap-2">
                    <FaBuilding className="text-blue-900" />
                    {inquiry.property_title}
                  </p>
                )}

                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {inquiry.message}
                </p>

                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-900/60" />
                  {formatDate(inquiry.created_at)}
                </p>
              </button>
            ))}

            {inquiries.length > itemsPerPage && (
              <div className="flex flex-wrap justify-center items-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-sm disabled:opacity-40 hover:border-blue-900 hover:text-blue-900 transition bg-white"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      px-3 py-2 border rounded-sm transition
                      ${
                        currentPage === page
                          ? 'bg-blue-900 border-blue-900 text-white font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-900 hover:text-blue-900'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-sm disabled:opacity-40 hover:border-blue-900 hover:text-blue-900 transition bg-white"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          <div className="xl:col-span-2">
            {selectedInquiry ? (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 xl:sticky xl:top-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="text-blue-900 tracking-[0.25em] text-xs uppercase block mb-2">
                      Detalle
                    </span>
                    <h2 className="text-2xl font-bold text-slate-950">
                      Consulta seleccionada
                    </h2>
                  </div>

                  <button
                    onClick={() => handleDelete(selectedInquiry.id)}
                    className="w-10 h-10 flex items-center justify-center border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition rounded-full"
                    title="Eliminar consulta"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="space-y-5">
                  <DetailItem label="Tipo" value={getInquiryType(selectedInquiry)} />

                  {selectedInquiry.property_title && (
                    <DetailItem label="Propiedad" value={selectedInquiry.property_title} />
                  )}

                  <DetailItem label="Nombre" value={selectedInquiry.name} />

                  <div>
                    <Label>Email</Label>
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="text-blue-900 hover:underline break-all font-semibold"
                    >
                      {selectedInquiry.email}
                    </a>
                  </div>

                  {selectedInquiry.phone && (
                    <div>
                      <Label>Teléfono</Label>
                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        className="text-blue-900 hover:underline font-semibold"
                      >
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  )}

                  <div>
                    <Label>Mensaje</Label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  <DetailItem label="Fecha" value={formatDate(selectedInquiry.created_at)} />
                </div>
              </div>
            ) : (
              <EmptyState text="Seleccioná una consulta para ver el detalle" />
            )}
          </div>
        </div>
      )}
    </div>
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

function DateField({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent border-0 border-b border-slate-200 focus:border-blue-900 focus:ring-0 px-0 py-3 text-slate-900 outline-none"
      />
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-slate-950 font-semibold">
        {value}
      </p>
    </div>
  )
}

function Label({ children }) {
  return (
    <label className="text-blue-900 text-[10px] tracking-widest uppercase font-bold block mb-2">
      {children}
    </label>
  )
}

function Badge({ children, type }) {
  const isProperty = type === 'property'

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-wider uppercase font-bold whitespace-nowrap border
        ${
          isProperty
            ? 'bg-blue-900/10 text-blue-900 border-blue-900/30'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }
      `}
    >
      {children}
    </span>
  )
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16 border border-slate-200 bg-white rounded-xl text-slate-500 shadow-sm">
      <FaEnvelopeOpenText className="text-blue-900 text-4xl mx-auto mb-4" />
      {text}
    </div>
  )
}