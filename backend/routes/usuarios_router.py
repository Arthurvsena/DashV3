from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from database import get_connection
from utils import hash_password
from auth import verify_token

router = APIRouter()

class UsuarioCreate(BaseModel):
    schema: str
    nome: str
    senha: str

@router.get("/api/schemas")
def listar_schemas(usuario=Depends(verify_token)):
    if not usuario.get("tipo") == "master":
        raise HTTPException(status_code=403, detail="Acesso negado")

    return usuario.get("schemas_autorizados", [])

@router.get("/api/usuarios")
def listar_usuarios(schema: str):
    if not schema:
        raise HTTPException(status_code=400, detail="Schema não informado")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f"SELECT nome FROM {schema}.funcionarios ORDER BY nome")
    usuarios = cur.fetchall()
    return [{"nome": row[0]} for row in usuarios]

@router.post("/api/usuarios")
def criar_usuario(dados: UsuarioCreate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {dados.schema}.funcionarios (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            senha_hash TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute(
        f"INSERT INTO {dados.schema}.funcionarios (nome, senha_hash) VALUES (%s, %s)",
        (dados.nome, hash_password(dados.senha))
    )
    conn.commit()
    return {"mensagem": "Usuário criado com sucesso"}
