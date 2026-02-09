import React, {useState} from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../store/slices/authSlice'

export default function Login(){
  const [email,setEmail] = useState('agent.demo@example.com')
  const [password,setPassword] = useState('secret123')
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
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 border rounded mb-4" />
        <button className="w-full bg-primary text-white py-2 rounded font-medium">Iniciar sesión</button>
      </form>
    </div>
  )
}
