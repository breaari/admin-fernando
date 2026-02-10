import React, {useEffect, useState} from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, initToken } from '../store/slices/authSlice'
import { FaBars, FaTimes } from 'react-icons/fa'

function Sidebar({ isOpen, onClose }){
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector(s=>s.auth.user)

  const handleLogout = () =>{
    dispatch(logout())
    nav('/login')
  }

  const handleLinkClick = () => {
    if(window.innerWidth < 768) onClose()
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r p-4 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary">Inmobiliaria</h3>
          <button 
            onClick={onClose}
            className="md:hidden text-gray-600 hover:text-gray-800"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        
        <nav className="flex-1">
          <ul>
            <li className="mb-2">
              <Link 
                to="properties" 
                className="text-primary hover:underline block"
                onClick={handleLinkClick}
              >
                Propiedades
              </Link>
            </li>
            <li className="mb-2">
              <Link 
                to="inquiries" 
                className="text-primary hover:underline block"
                onClick={handleLinkClick}
              >
                Consultas
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="border-t pt-4">
          <div className="text-sm mb-3 truncate">{user?.name || user?.email}</div>
          <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 rounded text-sm">Cerrar sesión</button>
        </div>
      </div>
    </>
  )
}

export default function Dashboard(){
  const dispatch = useDispatch()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(()=>{
    dispatch(initToken())
  }, [dispatch])

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header mobile con hamburger */}
        <div className="md:hidden bg-white border-b p-4 flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-800"
          >
            <FaBars className="text-xl" />
          </button>
          <h1 className="text-lg font-semibold text-primary">Panel Admin</h1>
        </div>
        
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
