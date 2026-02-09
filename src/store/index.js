import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import propertiesReducer from './slices/propertiesSlice'

export default configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer
  }
})
