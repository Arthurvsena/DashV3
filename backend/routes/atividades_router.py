from fastapi import APIRouter, Header, Depends, HTTPException, Query
from pydantic import BaseModel
from database import get_connection
from datetime import datetime
import psycopg2.extras
from auth import verify_token

router = APIRouter()

class NovaAtividade(BaseModel):
    descricao: str
    usuario_destino: str
    prazo_dias: int
    marketplace: str

class AlterarStatus(BaseModel):
    status: str

@router.get("/atividades")
def listar_atividades(payload: dict = Depends(verify_token), x_schema: str = Header(...)):
    usuario = payload.get("sub")
    is_master = payload.get("is_master") == True

    conn = get_connection(x_schema)
    cur = conn.cursor()

    if is_master:
        cur.execute(f"SELECT * FROM {x_schema}.atividades_dashboard WHERE tipo = %s", ('atividade',))
    else:
        cur.execute(f"""
        SELECT * FROM {x_schema}.atividades_dashboard
        WHERE LOWER(usuario_destino) = LOWER(%s) AND tipo = %s
    """, (usuario, 'atividade'))

    atividades = cur.fetchall()
    print("🔥 Atividades do banco:", atividades)

    resultado = []
    for a in atividades:
        resultado.append({
            "id": a[0],
            "usuario_destino": a[1],
            "descricao": a[2],
            "status": a[3],
            "inicio_em": a[4],
            "fim_em": a[5],
            "criado_em": a[6],
            "criado_por": a[7],
            "marketplace": a[8],
            "lida": a[9],
            "tipo": a[10],
            "prazo_dias": a[11]
        })

    cur.close()
    conn.close()
    return resultado

@router.post("/atividades")
def delegar_atividade(dados: NovaAtividade, payload: dict = Depends(verify_token), x_schema: str = Header(...)):
    criado_por = payload.get("sub")

    conn = get_connection(x_schema)
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {x_schema}.atividades_dashboard
        (usuario_destino, descricao, status, criado_em, criado_por, tipo, lida, prazo_dias, marketplace)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        dados.usuario_destino,
        dados.descricao,
        "backlog",
        datetime.utcnow(),
        criado_por,
        "atividade",
        False,
        dados.prazo_dias,
        dados.marketplace
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Atividade delegada com sucesso"}

@router.put("/atividades/{id}/status")
def atualizar_status(id: int, dados: AlterarStatus, payload: dict = Depends(verify_token), x_schema: str = Header(...)):
    usuario = payload.get("sub")
    is_master = payload.get("is_master") == True

    if dados.status not in ["backlog", "em andamento", "pausada", "finalizada"]:
        raise HTTPException(status_code=400, detail="Status inválido")

    conn = get_connection(x_schema)
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {x_schema}.atividades_dashboard SET status = %s,
            inicio_em = CASE WHEN %s = 'em andamento' THEN NOW() ELSE inicio_em END,
            fim_em = CASE WHEN %s = 'finalizada' THEN NOW() ELSE fim_em END,
            lida = TRUE
        WHERE id = %s AND (usuario_destino = %s OR %s = TRUE)
    """, (dados.status, dados.status, dados.status, id, usuario, is_master))

    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Status atualizado com sucesso"}

@router.put("/atividades/{id}/acao")
def acao_atividade(
    id: int,
    acao: str = Query(..., enum=["iniciar", "pausar", "finalizar"]),
    payload: dict = Depends(verify_token),
    x_schema: str = Header(...)
):
    conn = get_connection(x_schema)
    cur = conn.cursor()

    if acao == "iniciar":
        cur.execute(f"""
            UPDATE {x_schema}.atividades_dashboard
            SET status = 'em andamento', inicio_em = %s
            WHERE id = %s
        """, (datetime.utcnow(), id))
    elif acao == "pausar":
        cur.execute(f"""
            UPDATE {x_schema}.atividades_dashboard
            SET status = 'pausada'
            WHERE id = %s
        """, (id,))
    elif acao == "finalizar":
        cur.execute(f"""
            UPDATE {x_schema}.atividades_dashboard
            SET status = 'finalizada', fim_em = %s
            WHERE id = %s
        """, (datetime.utcnow(), id))
    else:
        raise HTTPException(status_code=400, detail="Ação inválida")

    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Status atualizado com sucesso"}

@router.delete("/atividades/{id}")
def excluir_atividade(id: int, x_schema: str = Header(...), db=Depends(get_connection)):
    with db.cursor() as cur:
        cur.execute(f"DELETE FROM {x_schema}.atividades_dashboard WHERE id = %s", (id,))
        db.commit()
    return {"mensagem": "Atividade excluída"}