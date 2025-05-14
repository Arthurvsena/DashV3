import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './SelectSchema.css';

export default function PainelMaster() {
  const navigate = useNavigate();
  const [schemas, setSchemas] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let token = '';
    try {
      token = localStorage.getItem("token");
    } catch (err) {
      console.warn("localStorage bloqueado:", err);
    }

    if (!token) return navigate("/login");

    api.get("/schemas", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSchemas(res.data || []))
      .catch(console.error);
  }, []);

  const handleSelect = () => {
    let token = '';
    try {
      token = localStorage.getItem("token");
    } catch (err) {
      console.warn("localStorage bloqueado:", err);
    }

    const schema = schemas[current];
    if (!schema) return;

    api.post("/auth/select-schema", { schema }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      try {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("selectedSchema", res.data.schema);
        setTimeout(() => {
          window.location.href = "/";  // ou "/" dependendo da sua estrutura
        }, 100); // pequeno delay garante que o token seja escrito no localStorage
      } catch (err) {
        console.warn("Erro ao salvar token:", err);
      }
    }).catch(console.error);
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + schemas.length) % schemas.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % schemas.length);
  };

  const renderSchema = (offset) => {
    if (schemas.length === 0) return null;

    const index = (current + offset + schemas.length) % schemas.length;
    const schema = schemas[index];
    if (!schema) return null;

    return (
      <div
        key={schema}
        className={`schema-card ${offset === 0 ? 'active' : ''}`}
        style={{ transform: `scale(${offset === 0 ? 1 : 0.9})`, opacity: offset === 0 ? 1 : 0.5 }}
      >
        <span>{schema.replace('_tiny', '').replace(/_/g, ' ')}</span>
      </div>
    );
  };

  return (
    <div className="painel-container">
      <h2>Painel Master</h2>
      <p className="subtitulo">Selecione o schema que deseja acessar:</p>

      <div className="carousel-container">
        <button className="carousel-button" onClick={handlePrev}>←</button>
        <div className="carousel-flex">
          {renderSchema(-1)}
          {renderSchema(0)}
          {renderSchema(1)}
        </div>
        <button className="carousel-button" onClick={handleNext}>→</button>
      </div>

      <button className="botao-selecionar" onClick={handleSelect}>Selecionar</button>
    </div>
  );
}
