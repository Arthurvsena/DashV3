# backend/routes/atividades_router.py
from fastapi import APIRouter, Header, Depends, HTTPException
from pydantic import BaseModel
from database import get_connection
from datetime import datetime
import psycopg2.extras
from auth import verify_token

router = APIRouter()

class NovaAtividade(BaseModel):
    descricao: str
    usuario_destino: str

class AlterarStatus(BaseModel):
    status: str

@router.get("/atividades")
def listar_atividades(payload: dict = Depends(verify_token), x_schema: str = Header(...)):
    usuario = payload.get("sub")
    is_master = payload.get("tipo") == "master"

    conn = get_connection(x_schema)
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    if is_master:
        cur.execute("SELECT * FROM atividades_dashboard ORDER BY criado_em DESC")
    else:
        cur.execute("SELECT * FROM atividades_dashboard WHERE usuario_destino = %s ORDER BY criado_em DESC", (usuario,))

    atividades = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(a) for a in atividades]

@router.post("/atividades")
def delegar_atividade(dados: NovaAtividade, payload: dict = Depends(verify_token), x_schema: str = Header(...)):
    criado_por = payload.get("sub")

    conn = get_connection(x_schema)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO atividades_dashboard
        (usuario_destino, descricao, status, criado_em, criado_por, tipo, lida)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        dados.usuario_destino,
        dados.descricao,
        "pendente",
        datetime.utcnow(),
        criado_por,
        "atividade",
        False
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Atividade delegada com sucesso"}

@router.put("/atividades/{id}/status")
def atualizar_status(id: int, dados: AlterarStatus, payload: dict = Depends(verify_token), x_schema: str = Header(...)):
    usuario = payload.get("sub")
    is_master = payload.get("tipo") == "master"

    if dados.status not in ["pendente", "em_execucao", "pausada", "finalizada"]:
        raise HTTPException(status_code=400, detail="Status inválido")

    conn = get_connection(x_schema)
    cur = conn.cursor()
    cur.execute("""
        UPDATE atividades_dashboard SET status = %s,
            inicio_em = CASE WHEN %s = 'em_execucao' THEN NOW() ELSE inicio_em END,
            fim_em = CASE WHEN %s = 'finalizada' THEN NOW() ELSE fim_em END,
            lida = TRUE
        WHERE id = %s AND (usuario_destino = %s OR %s = TRUE)
    """, (dados.status, dados.status, dados.status, id, usuario, is_master))

    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Status atualizado com sucesso"}