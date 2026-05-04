import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa'
import { login } from '../store/slices/authSlice'
import { useToast } from '../components/ToastProvider'
import { ERROR_MESSAGES } from '../utils/constants'
import logo from '../assets/logofondoblanco.png'

export default function Login() {
  const [email, setEmail] = useState('agent.demo@example.com')
  const [password, setPassword] = useState('secret123')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const dispatch = useDispatch()
  const nav = useNavigate()
  const toast = useToast()

  const submit = async e => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await dispatch(login({ email, password })).unwrap()
      toast.success('¡Bienvenido!')
      nav('/admin')
    } catch (err) {
      console.error('Error en login:', err)
      const errorMsg = err?.message || ERROR_MESSAGES.LOGIN_FAILED
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-surface to-black"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md bg-primary/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-6 md:p-8"
      >
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Faleroni Propiedades"
            className="h-20 w-auto object-contain mx-auto mb-6"
          />

          <span className="text-secondary tracking-[0.25em] text-xs uppercase font-bold block mb-3">
            Panel administrativo
          </span>

          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Acceso interno
          </h1>

          <p className="text-on-surface-variant text-sm mt-3">
            Gestioná propiedades, consultas y publicaciones.
          </p>
        </div>

        <div className="space-y-6">
          <Field
            label="Correo"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div>
            <label className="text-secondary/70 text-[10px] tracking-widest uppercase font-bold block mb-2">
              Contraseña
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-0 border-b border-white/20 focus:border-secondary focus:ring-0 px-0 py-3 pr-10 text-white placeholder:text-white/40 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-white/45 hover:text-secondary transition"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-8 bg-secondary text-primary h-14 flex items-center justify-center gap-3 text-[11px] tracking-widest uppercase font-bold hover:brightness-110 disabled:opacity-50 transition rounded-sm"
        >
          <FaLock />
          {submitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <p className="text-center text-white/35 text-xs mt-6">
          © Faleroni Propiedades
        </p>
      </form>
    </div>
  )
}

function Field({ label, type, value, onChange, required }) {
  return (
    <div>
      <label className="text-secondary/70 text-[10px] tracking-widest uppercase font-bold block mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-transparent border-0 border-b border-white/20 focus:border-secondary focus:ring-0 px-0 py-3 text-white placeholder:text-white/40 outline-none"
      />
    </div>
  )
}