const UPLOADS_URL =
  import.meta.env.VITE_UPLOADS_URL ||
  'https://permuok.com/back-fernando/public'

export function getImageUrl(url) {
  if (!url) return null

  if (typeof url !== 'string') return null

  if (url.startsWith('http')) {
    // Corregir URLs que incluyen /index.php/uploads/ por /uploads/
    return url.replace('/index.php/uploads/', '/uploads/')
  }

  const cleanPath = url.replace(/^\/+/, '')

  return `${UPLOADS_URL}/${cleanPath}`
}

export function getFirstImage(images) {
  if (!images || !Array.isArray(images) || images.length === 0) return null

  const first = images[0]

  const rawUrl =
    first?.image_url ||
    first?.url ||
    first?.path ||
    first

  return getImageUrl(rawUrl)
}