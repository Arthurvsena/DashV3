import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import logo from '../assets/logo.png'
import "./Login.css"


export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', schema: '' })
  const [schemas, setSchemas] = useState([])
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [emailRecuperacao, setEmailRecuperacao] = useState('')
  const [msgRecuperacao, setMsgRecuperacao] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await api.post('/login', {
        username: form.username,
        password: form.password
      })
  
      // Salva token e schemas autorizados
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('schemas', JSON.stringify(res.data.schemas))
  
      // Redireciona para página de seleção de schema
      navigate('/select-schema')
    } catch (err) {
      console.error('Erro no login:', err)
      setError('Usuário ou senha inválidos.')
    }
  }

  const recuperarSenha = async () => {
    try {
      await api.post('/recuperar-senha', { email: emailRecuperacao })
      setMsgRecuperacao('📬 Senha enviada com sucesso!')
    } catch {
      setMsgRecuperacao('❌ Erro ao enviar a senha.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Logo Help Seller" className="logo" />
        <h2 className="login-title">🔐 Acesse seu painel</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <label>Usuário</label>
          <input type="text" name="username" placeholder="Digite seu usuário" onChange={handleChange} />
          
          <label>Senha</label>
          <input type="password" name="password" placeholder="Digite sua senha" onChange={handleChange} />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" >Entrar</button>
        
        </form>

        <p className="forgot" onClick={() => setShowModal(true)}>Esqueci minha senha</p>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>📨 Recuperar Senha</h3>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              onChange={e => setEmailRecuperacao(e.target.value)}
            />
            {msgRecuperacao && <p>{msgRecuperacao}</p>}
            <div className="modal-buttons">
              <button onClick={recuperarSenha} className="btn-primary">Enviar</button>
              <button onClick={() => { setShowModal(false); setMsgRecuperacao('') }} className="btn-danger">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
