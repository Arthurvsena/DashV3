# backend/routes/produtos.py
from fastapi import APIRouter, Request, HTTPException
from queries import (
    get_produto_campeao,
    get_produto_mais_devolvido,
    get_total_produtos_vendidos,
    get_total_produtos_sem_venda,
    get_faturamento_por_estado,
    get_produtos_por_status,
    get_curva_abc,
    get_curva_abc_por_pai,
    get_curva_abc_por_marca,
    get_marcas_disponiveis
)
from utils import get_data_periodo

router = APIRouter()

def get_schema(request: Request):
    schema = request.headers.get("x-schema")
    if not schema:
        raise HTTPException(status_code=400, detail="Schema não fornecido no header")
    return schema

@router.get("/produto-campeao")
def produto_campeao(request: Request, start_date: str = None, end_date: str = None):
    schema = get_schema(request)
    start, end = get_data_periodo(start_date, end_date)
    result = get_produto_campeao(schema, start, end)
    return {"nome": result[0] if result else "-", "total": float(result[1]) if result and result[1] else 0}

@router.get("/produto-mais-devolvido")
def produto_mais_devolvido(request: Request, start_date: str = None, end_date: str = None):
    schema = get_schema(request)
    start, end = get_data_periodo(start_date, end_date)
    result = get_produto_mais_devolvido(schema, start, end)
    return {"nome": result[0] if result else "-", "qtd": int(result[1]) if result and result[1] else 0}

@router.get("/total-vendidos")
def total_vendidos(request: Request, start_date: str = None, end_date: str = None):
    schema = get_schema(request)
    start, end = get_data_periodo(start_date, end_date)
    total = get_total_produtos_vendidos(schema, start, end)
    return {"total": total}

@router.get("/sem-venda")
def produtos_sem_venda(request: Request, start_date: str = None, end_date: str = None):
    schema = get_schema(request)
    start, end = get_data_periodo(start_date, end_date)
    total = get_total_produtos_sem_venda(schema, start, end)
    return {"total": total}

@router.get("/produtos")
def listar_produtos(request: Request, status: str = "Todos", start_date: str = None, end_date: str = None):
    schema = get_schema(request)
    start, end = get_data_periodo(start_date, end_date)
    return get_produtos_por_status(schema, start, end, status)

@router.get("/faturamento-por-estado")
def faturamento_por_estado(request: Request, start_date: str = None, end_date: str = None):
    schema = get_schema(request)
    start, end = get_data_periodo(start_date, end_date)
    return get_faturamento_por_estado(schema, start, end)

@router.get("/curva-abc")
def curva_abc(
    request: Request,
    start_date: str = None,
    end_date: str = None,
    tipo: str = "sku",  # sku, pai ou marca
    marca: str = None
):
    schema = get_schema(request)
    start, end = get_data_periodo(start_date, end_date)

    if tipo == "pai":
        return get_curva_abc_por_pai(schema, start, end, marca)
    elif tipo == "marca":
        return get_curva_abc_por_marca(schema, start, end, marca)
    else:
        return get_curva_abc(schema, start, end)

@router.get("/marcas")
def listar_marcas(request: Request):
    schema = get_schema(request)
    return get_marcas_disponiveis(schema)