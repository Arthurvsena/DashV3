# backend/routes/usuarios_router.py

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils import hash_password
from database import get_connection

router = APIRouter()

class UsuarioBase(BaseModel):
    nome: str
    email: str
    usuario: str

class UsuarioCreate(UsuarioBase):
    senha: str

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    senha: Optional[str] = None

@router.get("/usuarios")
def listar_usuarios(x_schema: str = Header(...)):
    conn = get_connection(x_schema)
    cur = conn.cursor()
    cur.execute("SELECT id, nome, email, criado_em, usuario FROM funcionarios ORDER BY id ASC")
    dados = cur.fetchall()
    colunas = [desc[0] for desc in cur.description]
    cur.close()
    conn.close()
    return [dict(zip(colunas, linha)) for linha in dados]

@router.post("/usuarios")
def criar_usuario(dados: UsuarioCreate, x_schema: str = Header(...)):
    conn = get_connection(x_schema)
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM funcionarios WHERE usuario = %s", (dados.usuario,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Usuário já existe")

    senha_cripto = hash_password(dados.senha)
    cur.execute("""
        INSERT INTO funcionarios (nome, email, usuario, senha_hash, criado_em)
        VALUES (%s, %s, %s, %s, %s)
    """, (dados.nome, dados.email, dados.usuario, senha_cripto, datetime.utcnow()))

    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Usuário criado com sucesso"}

@router.put("/usuarios/{id}")
def atualizar_usuario(id: int, dados: UsuarioUpdate, x_schema: str = Header(...)):
    conn = get_connection(x_schema)
    cur = conn.cursor()

    campos = []
    valores = []

    if dados.nome:
        campos.append("nome = %s")
        valores.append(dados.nome)
    if dados.email:
        campos.append("email = %s")
        valores.append(dados.email)
    if dados.senha:
        campos.append("senha_hash = %s")
        valores.append(hash_password(dados.senha))

    if not campos:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Nada para atualizar")

    valores.append(id)
    cur.execute(f"UPDATE funcionarios SET {', '.join(campos)} WHERE id = %s", tuple(valores))

    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Usuário atualizado com sucesso"}

@router.delete("/usuarios/{id}")
def deletar_usuario(id: int, x_schema: str = Header(...)):
    conn = get_connection(x_schema)
    cur = conn.cursor()
    cur.execute("DELETE FROM funcionarios WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Usuário removido com sucesso"}
