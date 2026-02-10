/**
 * Obtiene la URL completa de una imagen
 * @param {string} imagePath - Ruta relativa de la imagen
 * @returns {string} URL completa de la imagen
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // Si ya es una URL completa, devolverla tal cual
  if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
    return imagePath
  }
  
  // Normalizar la ruta
  let path = imagePath.replace(/\\/g, '/')
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return baseUrl.replace(/\/$/, '') + path
}

/**
 * Obtiene la primera imagen de un array o null
 * @param {Array} images - Array de imágenes
 * @returns {string|null} URL de la primera imagen o null
 */
export const getFirstImage = (images) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null
  }
  
  const firstImage = images[0]
  const imagePath = firstImage?.image_url || firstImage?.url
  
  return getImageUrl(imagePath)
}

/**
 * Obtiene todas las URLs de imágenes de un array
 * @param {Array} images - Array de imágenes
 * @returns {Array<string>} Array de URLs completas
 */
export const getImageUrls = (images) => {
  if (!images || !Array.isArray(images)) {
    return []
  }
  
  return images
    .map(img => img?.image_url || img?.url)
    .filter(Boolean)
    .map(getImageUrl)
}
