import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import PropertyEdit from './pages/PropertyEdit'
import Inquiries from './pages/Inquiries'

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/admin" element={<Dashboard/>}>
        <Route index element={<Navigate to="properties" replace/>} />
        <Route path="properties" element={<Properties/>} />
        <Route path="properties/:id" element={<PropertyEdit/>} />
        <Route path="inquiries" element={<Inquiries/>} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace/>} />
    </Routes>
  )
}
