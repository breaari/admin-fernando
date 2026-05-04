import React, { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, initToken } from '../store/slices/authSlice'
import {
  FaBars,
  FaTimes,
  FaHome,
  FaBuilding,
  FaEnvelopeOpenText,
  FaSignOutAlt,
  FaUserCircle,
} from 'react-icons/fa'
import logo from '../assets/logofondoblanco.png'

function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const location = useLocation()
  const user = useSelector(s => s.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    nav('/login')
  }

  const handleLinkClick = () => {
    if (window.innerWidth < 768) onClose()
  }

  const isActive = path => location.pathname.includes(path)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 bg-primary border-r border-white/10 flex flex-col h-screen
          transform transition-transform duration-300 ease-in-out shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* LOGO */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link to="/admin" onClick={handleLinkClick}>
              <img
                src={logo}
                alt="Faleroni Propiedades"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <button
              onClick={onClose}
              className="md:hidden text-white/60 hover:text-secondary transition"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <p className="text-secondary text-[10px] tracking-[0.25em] uppercase font-bold mt-5">
            Panel administrativo
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <SidebarLink
              to="/admin"
              icon={<FaHome />}
              label="Inicio"
              active={location.pathname === '/admin'}
              onClick={handleLinkClick}
            />

            <SidebarLink
              to="properties"
              icon={<FaBuilding />}
              label="Propiedades"
              active={isActive('/admin/properties')}
              onClick={handleLinkClick}
            />

            <SidebarLink
              to="inquiries"
              icon={<FaEnvelopeOpenText />}
              label="Consultas"
              active={isActive('/admin/inquiries')}
              onClick={handleLinkClick}
            />
          </ul>
        </nav>

        {/* USER */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
            <FaUserCircle className="text-secondary text-2xl flex-shrink-0" />

            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user?.name || 'Administrador'}
              </p>
              <p className="text-on-surface-variant text-xs truncate">
                {user?.email || 'Sesión activa'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full h-12 flex items-center justify-center gap-3 border border-secondary/50 text-secondary text-[11px] tracking-widest uppercase font-bold hover:bg-secondary hover:text-primary transition rounded-sm"
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

function SidebarLink({ to, icon, label, active, onClick }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition
          ${
            active
              ? 'bg-secondary text-primary'
              : 'text-on-surface-variant hover:bg-white/5 hover:text-secondary'
          }
        `}
      >
        <span className="text-base">{icon}</span>
        {label}
      </Link>
    </li>
  )
}

export default function Dashboard() {
  const dispatch = useDispatch()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    dispatch(initToken())
  }, [dispatch])

  return (
    <div className="min-h-screen flex bg-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* HEADER MOBILE */}
        <div className="md:hidden bg-primary border-b border-white/10 p-4 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-secondary transition"
          >
            <FaBars className="text-xl" />
          </button>

          <h1 className="text-sm font-bold text-secondary tracking-[0.18em] uppercase">
            Panel Admin
          </h1>
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}