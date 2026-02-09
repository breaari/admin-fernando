import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchProperties = createAsyncThunk('properties/fetch', async ()=>{
  const res = await api.get('/properties')
  return res.data.data
})

const slice = createSlice({
  name: 'properties',
  initialState: { list: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder)=>{
    builder.addCase(fetchProperties.fulfilled, (state,action)=>{
      const payload = action.payload.data || action.payload
      // normalize image urls for list thumbnails
      function normalizeImageUrl(img) {
        if(!img) return img
        if (img.startsWith('http') || img.startsWith('//')) return img
        let v = img.replace(/\\/g, '/')
        if (!v.startsWith('/')) v = '/' + v
        const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        return base.replace(/\/$/, '') + v
      }

      let list = payload
      if (Array.isArray(payload)) {
        list = payload.map(p => {
          if (p.images && Array.isArray(p.images)) {
            p.images = p.images.map(img => ({
              ...img,
              image_url: normalizeImageUrl(img.image_url)
            }))
          }
          return p
        })
      }
      state.list = list
    })
  }
})

export default slice.reducer
