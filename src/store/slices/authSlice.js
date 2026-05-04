import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', credentials)
      return res.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: 'No se pudo iniciar sesión' }
      )
    }
  }
)

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
    },
    initToken(state) {
      state.token = localStorage.getItem('token')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'

        const payload = action.payload?.data || action.payload

        state.user = payload.user
        state.token = payload.token

        localStorage.setItem('token', state.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload?.message || action.payload?.error || 'Error al iniciar sesión'
      })
  },
})

export const { logout, initToken } = slice.actions
export default slice.reducer