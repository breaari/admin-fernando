import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const login = createAsyncThunk('auth/login', async (credentials)=>{
  const res = await api.post('/auth/login', credentials)
  return res.data
})

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    status: 'idle'
  },
  reducers: {
    logout(state){
      state.user = null
      state.token = null
      localStorage.removeItem('token')
    },
    initToken(state){
      state.token = localStorage.getItem('token')
    }
  },
  extraReducers: (builder)=>{
    builder.addCase(login.fulfilled, (state,action)=>{
      state.user = action.payload.data.user
      state.token = action.payload.data.token
      localStorage.setItem('token', state.token)
    })
  }
})

export const { logout, initToken } = slice.actions
export default slice.reducer
