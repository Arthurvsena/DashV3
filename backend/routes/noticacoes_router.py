# backend/routes/notificacoes_router.py
from fastapi import APIRouter, Header, Request, HTTPException
from backend.database import get_connection
import psycopg2.extras

router = APIRouter()

@router.get("/notificacoes/nao-lidas")
def listar_notificacoes_nao_lidas(request: Request, x_schema: str = Header(...)):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Token ausente")

    payload = request.state.usuario  # Assumindo que verify_token já populou isso
    usuario = payload.get("sub")
    is_master = payload.get("tipo") == "master"

    conn = get_connection(x_schema)
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    if is_master:
        cur.execute("""
            SELECT id, descricao, criado_em FROM atividades_dashboard
            WHERE lida = FALSE AND (tipo = 'sistema' OR usuario_destino = %s)
            ORDER BY criado_em DESC
            LIMIT 5
        """, (usuario,))
    else:
        cur.execute("""
            SELECT id, descricao, criado_em FROM atividades_dashboard
            WHERE lida = FALSE AND usuario_destino = %s
            ORDER BY criado_em DESC
            LIMIT 5
        """, (usuario,))

    notificacoes = cur.fetchall()
    cur.close()
    conn.close()

    return [dict(n) for n in notificacoes]
