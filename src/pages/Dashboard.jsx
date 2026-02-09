import React, {useEffect} from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, initToken } from '../store/slices/authSlice'

function Sidebar(){
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector(s=>s.auth.user)

  const handleLogout = () =>{
    dispatch(logout())
    nav('/login')
  }

  return (
    <div className="w-64 bg-white border-r p-4 flex flex-col h-screen">
      <h3 className="text-lg font-bold mb-4 text-primary">Inmobiliaria</h3>
      <nav className="flex-1">
        <ul>
          <li className="mb-2"><Link to="properties" className="text-primary hover:underline">Propiedades</Link></li>
          <li className="mb-2"><Link to="inquiries" className="text-primary hover:underline">Consultas</Link></li>
        </ul>
      </nav>
      <div className="border-t pt-4">
        <div className="text-sm mb-3">{user?.name || user?.email}</div>
        <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 rounded text-sm">Cerrar sesion</button>
      </div>
    </div>
  )
}

export default function Dashboard(){
  const dispatch = useDispatch()

  useEffect(()=>{
    dispatch(initToken())
  }, [dispatch])

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
