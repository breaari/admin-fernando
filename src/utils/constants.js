// Configuración general de la aplicación
export const APP_CONFIG = {
  ITEMS_PER_PAGE: 5,
  API_TIMEOUT: 10000,
  IMAGE_PLACEHOLDER: '/placeholder-property.jpg'
}

// Límites y validaciones
export const VALIDATION = {
  MIN_SEARCH_CHARS: 2,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 6,
  PHONE_REGEX: /^[0-9\s\-\+\(\)]+$/
}

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  GENERIC: 'Ocurrió un error. Por favor, intenta nuevamente.',
  NETWORK: 'Error de conexión. Verifica tu internet.',
  NOT_FOUND: 'No se encontró el recurso solicitado.',
  VALIDATION: 'Por favor, verifica los datos ingresados.',
  REQUIRED_FIELDS: 'Todos los campos son obligatorios.',
  LOGIN_FAILED: 'Credenciales incorrectas.',
  UNAUTHORIZED: 'No tienes permisos para esta acción.'
}

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  SAVED: 'Guardado exitosamente.',
  DELETED: 'Eliminado exitosamente.',
  UPDATED: 'Actualizado exitosamente.',
  CREATED: 'Creado exitosamente.'
}

// Estados de propiedades
export const PROPERTY_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  PAUSED: 'paused',
  SOLD: 'sold',
  RENTED: 'rented'
}

// Traducciones de estado
export const STATUS_LABELS = {
  published: 'Publicado',
  draft: 'Borrador',
  paused: 'En Pausa',
  sold: 'Vendido',
  rented: 'Alquilado',
  available: 'Disponible'
}
