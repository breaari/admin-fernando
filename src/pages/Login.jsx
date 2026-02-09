import React, {useState} from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../store/slices/authSlice'

export default function Login(){
  const [email,setEmail] = useState('agent.demo@example.com')
  const [password,setPassword] = useState('secret123')
  const [showPassword,setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const nav = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    try{
      await dispatch(login({email,password})).unwrap()
      nav('/admin')
    }catch(err){
      alert('Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-primary">Panel Administrativo</h2>
        <label className="block mb-2 text-sm font-medium">Correo</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded mb-3" />
        <label className="block mb-2 text-sm font-medium">Contraseña</label>
        <div className="relative mb-4">
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            className="w-full p-2 pr-10 border rounded" 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <button className="w-full bg-primary text-white py-2 rounded font-medium">Iniciar sesión</button>
      </form>
    </div>
  )
}
