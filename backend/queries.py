# Arquivo: queries.py
import pandas as pd
from collections import defaultdict
import queries
from utils import get_connection
from database import executar_query_lista
from database import executar_query_df

def execute_query(schema, query):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    cur.close()
    conn.close()
    return pd.DataFrame(rows, columns=columns)

def get_orders_query(schema, start_date, end_date):
    query = f"""
        SELECT id, data_pedido, cliente_cpf_cnpj, numero_ecommerce, forma_pagamento, forma_envio
        FROM {schema}.tiny_orders
        WHERE TO_DATE(data_pedido, 'DD/MM/YYYY') BETWEEN '{start_date}' AND '{end_date}';
    """
    return execute_query(schema, query)

def get_nfs_query(schema, start_date, end_date):
    query = f"""
        SELECT 
            id,
            cliente_cpf_cnpj,
            tipo,
            valor_frete,
            valor,
            numero_ecommerce,
            endereco_entrega_uf,
            "createdAt",
            numero
        FROM {schema}.tiny_nfs
        WHERE DATE("createdAt") BETWEEN '{start_date}' AND '{end_date}';
    """
    return execute_query(schema, query)

def get_order_item_query(schema, start_date, end_date):
    query = f"""
        SELECT 
            oi.order_id,
            oi.codigo AS sku,
            oi.descricao,
            oi.quantidade,
            oi.valor_unitario,
            (CAST(oi.valor_unitario AS NUMERIC) * CAST(oi.quantidade AS NUMERIC)) AS valor_total
        FROM {schema}.tiny_order_item oi
        JOIN {schema}.tiny_orders o ON oi.order_id = o.id
        WHERE DATE(oi."createdAt") BETWEEN '{start_date}' AND '{end_date}';
    """
    return execute_query(schema, query)

def get_valor_total_faturado_query(schema, start_date, end_date):
    conn = get_connection()
    cur = conn.cursor()
    query = f"""
        SELECT SUM(CAST(valor AS NUMERIC))
        FROM {schema}.tiny_nfs
        WHERE tipo = 'S'
          AND "createdAt" BETWEEN '{start_date}' AND '{end_date}'
    """
    cur.execute(query)
    result = cur.fetchone()[0]
    cur.close()
    conn.close()
    return result or 0

def get_products_query(schema):
    query = f"""
        SELECT 
            codigo, 
            nome, 
            categoria,
            estoque,
            preco_custo,
            preco,
            "tipoVariacao",
            marca
        FROM {schema}.tiny_products;
    """
    return execute_query(schema, query)

def get_pareto_data_query(schema, start_date, end_date):
    query = f"""
        SELECT 
            oi.codigo AS sku,
            p.nome AS descricao,
            p."tipoVariacao",
            SUM(CAST(oi.quantidade AS NUMERIC)) AS quantidade_total,
            SUM(CAST(oi.valor_unitario AS NUMERIC) * CAST(oi.quantidade AS NUMERIC)) AS faturamento
        FROM {schema}.tiny_order_item oi
        JOIN {schema}.tiny_orders o ON oi.order_id = o.id
        JOIN {schema}.tiny_nfs nfs ON o.cliente_cpf_cnpj = nfs.cliente_cpf_cnpj
        JOIN {schema}.tiny_products p ON oi.codigo = p.codigo
        WHERE nfs.tipo = 'S' 
          AND nfs.numero_ecommerce IS NOT NULL
          AND nfs."createdAt" BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY oi.codigo, p.nome, p."tipoVariacao"
        ORDER BY faturamento DESC;
    """
    return execute_query(schema, query)

def get_ticket_medio_query(schema, start_date, end_date):
    conn = get_connection()
    cur = conn.cursor()
    query = f"""
        SELECT 
            SUM(CAST(oi.valor_unitario AS NUMERIC) * CAST(oi.quantidade AS NUMERIC)) AS total_faturado,
            SUM(CAST(oi.quantidade AS NUMERIC)) AS total_quantidade
        FROM {schema}.tiny_order_item oi
        JOIN {schema}.tiny_orders o ON oi.order_id = o.id
        JOIN {schema}.tiny_nfs nfs ON o.cliente_cpf_cnpj = nfs.cliente_cpf_cnpj
        WHERE nfs.tipo = 'S'
          AND nfs."createdAt" BETWEEN '{start_date}' AND '{end_date}';
    """
    cur.execute(query)
    result = cur.fetchone()
    cur.close()
    conn.close()
    return {
        "total_faturado": result[0] or 0,
        "total_quantidade": result[1] or 0
    }

#def get_mapa_query(schema):
  #  query = f'''
   #     SELECT estado, quantidade, preco
    #    FROM {schema}.tiny_order_item
     #   WHERE estado IS NOT NULL
    #'''
    #return execute_query(schema, query)

def get_top_10_produtos_query(schema):
    query = f'''
         SELECT codigo AS produto_id, SUM(CAST(quantidade AS NUMERIC)) AS total_vendido
         FROM {schema}.tiny_order_item
         GROUP BY codigo
         ORDER BY total_vendido DESC
         LIMIT 10
     '''  
    return query  # Apenas retorna a string, a execução fica com load_data(query)

def get_categorias_query(schema, start_date, end_date):
    query = f'''
        SELECT p.categoria, SUM(CAST(oi.quantidade AS NUMERIC)) AS quantidade_total
        FROM {schema}.tiny_order_item oi
        JOIN {schema}.tiny_products p ON oi.codigo = p.codigo
        JOIN {schema}.tiny_orders o ON oi.order_id = o.id
        WHERE DATE(o."createdAt") BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY p.categoria
        ORDER BY quantidade_total DESC
    '''
    return execute_query(schema, query)
def get_valor_total_frete_query(schema, start_date, end_date):
    conn = get_connection()
    cur = conn.cursor()
    query = f"""
        SELECT SUM(CAST(valor_frete AS NUMERIC))
        FROM {schema}.tiny_nfs
        WHERE tipo = 'S'
          AND "createdAt" BETWEEN '{start_date}' AND '{end_date}'
    """
    cur.execute(query)
    result = cur.fetchone()[0]
    cur.close()
    conn.close()
    return result or 0

def get_valor_total_devolucao_query(schema, start_date, end_date):
    conn = get_connection()
    cur = conn.cursor()

    query = f"""
        WITH vendas AS (
            SELECT id, cliente_cpf_cnpj
            FROM {schema}.tiny_orders
            WHERE cliente_cpf_cnpj IS NOT NULL
        ),
        itens_venda AS (
            SELECT oi.order_id, oi.codigo, oi.valor_unitario, oi.quantidade
            FROM {schema}.tiny_order_item oi
        ),
        notas_saida AS (
            SELECT cliente_cpf_cnpj
            FROM {schema}.tiny_nfs
            WHERE tipo = 'S'
              AND "createdAt" BETWEEN '{start_date}' AND '{end_date}'
        ),
        notas_entrada AS (
            SELECT cliente_cpf_cnpj
            FROM {schema}.tiny_nfs
            WHERE tipo = 'E'
              AND "createdAt" BETWEEN '{start_date}' AND '{end_date}'
        ),
        devolucoes_validas AS (
            SELECT 
                v.cliente_cpf_cnpj,
                i.codigo,
                i.valor_unitario,
                i.quantidade
            FROM vendas v
            INNER JOIN itens_venda i ON v.id = i.order_id
            INNER JOIN notas_entrada e ON v.cliente_cpf_cnpj = e.cliente_cpf_cnpj
            INNER JOIN notas_saida s ON v.cliente_cpf_cnpj = s.cliente_cpf_cnpj
        )
        SELECT 
            COALESCE(SUM(CAST(valor_unitario AS NUMERIC) * CAST(quantidade AS NUMERIC)), 0) AS valor_total_devolvido,
            COUNT(*) AS qtd_devolucoes
        FROM devolucoes_validas;
    """

    cur.execute(query)
    result = cur.fetchone()
    cur.close()
    conn.close()

    if result and result[0] is not None:
        return float(result[0]), int(result[1])
    return 0.0, 0

def get_faturamento_por_marketplace_query(schema: str, start_date: str, end_date: str):
    conn = get_connection()
    cur = conn.cursor()
    try:
        query = f"""
            SELECT
              CASE
                WHEN o.forma_pagamento = 'multiplas' THEN
                  CASE
                    WHEN LOWER(o.nome_transportador) LIKE '%magalu%' OR LOWER(o.forma_envio) LIKE '%magalu%' THEN 'Magazine Luiza'
                    WHEN LOWER(o.nome_transportador) LIKE '%melhor envio%' OR LOWER(o.forma_envio) LIKE '%melhor envio%' THEN 'NuvemShop'
                    ELSE 'Outros'
                  END
                ELSE o.forma_pagamento
              END AS marketplace,
              DATE_TRUNC('month', nfs."createdAt") AS mes,
              SUM(CAST(nfs.valor AS NUMERIC)) AS valor_total
            FROM {schema}.tiny_nfs nfs
            INNER JOIN {schema}.tiny_orders o
              ON nfs.cliente_cpf_cnpj = o.cliente_cpf_cnpj
            WHERE nfs.tipo = 'S'
              AND nfs."createdAt" BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY marketplace, mes
            ORDER BY mes ASC;
        """
        cur.execute(query)
        rows = cur.fetchall()

        # Processar dados
        marketplace_dict = defaultdict(lambda: [])

        if rows:
            df = pd.DataFrame(rows, columns=['marketplace', 'mes', 'valor_total'])
            meses = sorted(df['mes'].dt.strftime('%Y-%m').unique())

            for marketplace in df['marketplace'].unique():
                valores = []
                for mes in meses:
                    filtro = (df['marketplace'] == marketplace) & (df['mes'].dt.strftime('%Y-%m') == mes)
                    valor = df.loc[filtro, 'valor_total'].sum()
                    valores.append(float(valor) if not pd.isna(valor) else 0)
                marketplace_dict[marketplace] = valores

        return dict(marketplace_dict)

    finally:
        cur.close()
        conn.close()

def get_faturamento_mensal_query(schema, start_date, end_date):
    conn = get_connection()
    cur = conn.cursor()

    query = f"""
        SELECT 
            TO_CHAR(nfs."createdAt", 'YYYY-MM') AS mes,
            SUM(CAST(nfs.valor AS NUMERIC)) AS faturamento,
            COUNT(DISTINCT nfs.id) AS qtd_pedidos,
            CASE 
                WHEN COUNT(DISTINCT nfs.id) = 0 THEN 0
                ELSE SUM(CAST(nfs.valor AS NUMERIC)) / COUNT(DISTINCT nfs.id)
            END AS ticket_medio
        FROM {schema}.tiny_nfs nfs
        WHERE nfs.tipo = 'S'
          AND nfs."createdAt" BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY mes
        ORDER BY mes;
    """

    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Devolver formato pronto para o gráfico
    dados = []
    for row in rows:
        dados.append({
            "mes": row[0],
            "faturamento": float(row[1]),
            "qtd_pedidos": int(row[2]),
            "ticket_medio": float(row[3])
        })
    return dados
def get_produto_campeao(schema, data_inicio, data_fim):
    from utils import get_connection
    conn = get_connection()
    cur = conn.cursor()
    print("Executando busca do produto campeão")
    print("Schema:", schema)
    print("Data início:", data_inicio)
    print("Data fim:", data_fim)


    query = f'''
        WITH notas_saida AS (
    SELECT REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') AS cpf_cnpj
    FROM {schema}.tiny_nfs
        WHERE tipo = 'S' AND "createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
    ),
    pedidos_filtrados AS (
        SELECT id FROM {schema}.tiny_orders
        WHERE REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') IN (SELECT cpf_cnpj FROM notas_saida)
    ),
    itens_venda AS (
        SELECT descricao, valor_unitario FROM {schema}.tiny_order_item
        WHERE order_id IN (SELECT id FROM pedidos_filtrados)
    )
    SELECT descricao, SUM(valor_unitario::numeric) AS total
    FROM itens_venda
    GROUP BY descricao
    ORDER BY total DESC
    LIMIT 1;

    '''
    print("DEBUG QUERY:", query)
    cur.execute(query)
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result

def get_total_produtos_vendidos(schema, data_inicio, data_fim):
    query = f"""
        WITH notas_saida AS (
            SELECT REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') AS cpf_cnpj
            FROM {schema}.tiny_nfs
            WHERE tipo = 'S' AND "createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        ),
        pedidos_filtrados AS (
            SELECT id
            FROM {schema}.tiny_orders
            WHERE REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') IN (SELECT cpf_cnpj FROM notas_saida)
        )
        SELECT SUM(CAST(quantidade AS NUMERIC)) AS total
        FROM {schema}.tiny_order_item
        WHERE order_id IN (SELECT id FROM pedidos_filtrados);
    """
    df = execute_query(schema, query)
    return int(df["total"][0]) if not df.empty and df["total"][0] else 0

def get_produto_mais_devolvido(schema, data_inicio, data_fim):
    from utils import get_connection
    conn = get_connection()
    cur = conn.cursor()

    print("🔍 Executando busca do produto mais devolvido")
    print(f"Schema: {schema}")
    print(f"Data início: {data_inicio}")
    print(f"Data fim: {data_fim}")

    query = f"""
        WITH notas_saida AS (
            SELECT cliente_cpf_cnpj
            FROM {schema}.tiny_nfs
            WHERE tipo = 'S'
            AND "createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        ),
        notas_entrada AS (
            SELECT cliente_cpf_cnpj
            FROM {schema}.tiny_nfs
            WHERE tipo = 'E'
            AND "createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        ),
        pedidos_com_devolucao AS (
            SELECT id, cliente_cpf_cnpj
            FROM {schema}.tiny_orders
            WHERE cliente_cpf_cnpj IN (SELECT cliente_cpf_cnpj FROM notas_saida)
              AND cliente_cpf_cnpj IN (SELECT cliente_cpf_cnpj FROM notas_entrada)
        ),
        itens_devolvidos AS (
            SELECT codigo, descricao
            FROM {schema}.tiny_order_item
            WHERE order_id IN (SELECT id FROM pedidos_com_devolucao)
        )
        SELECT descricao, COUNT(*) AS total_devolucoes
        FROM itens_devolvidos
        GROUP BY descricao
        ORDER BY total_devolucoes DESC
        LIMIT 1;
    """

    try:
        cur.execute(query)
        result = cur.fetchone()
    except Exception as e:
        print(f"Erro na consulta de devoluções: {e}")
        result = None
    finally:
        cur.close()
        conn.close()

    # 🔐 Retorno seguro, sempre uma tupla
    if isinstance(result, tuple) and len(result) == 2:
        return result
    return ('-', 0)

def get_top_devolved_products_query(schema):
    query = f"""
    WITH devolucoes AS (
        SELECT oi.descricao, COUNT(*) AS num_devolucoes
        FROM {schema}.tiny_nfs nf
        INNER JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        INNER JOIN {schema}.tiny_order_item oi ON o.id = oi.order_id
        WHERE nf.tipo = 'E'
        GROUP BY oi.descricao
    )
    SELECT descricao, num_devolucoes
    FROM devolucoes
    ORDER BY num_devolucoes DESC
    LIMIT 3;
    """
    return execute_query(schema, query)

def get_total_produtos_sem_venda(schema, start_date, end_date):
    query = f"""
        WITH notas_saida AS (
            SELECT REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') AS cpf_cnpj
            FROM {schema}.tiny_nfs
            WHERE tipo = 'S'
              AND "createdAt" BETWEEN '{start_date}' AND '{end_date}'
        ),
        pedidos_filtrados AS (
            SELECT id
            FROM {schema}.tiny_orders
            WHERE REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') IN (SELECT cpf_cnpj FROM notas_saida)
        ),
        produtos_vendidos AS (
            SELECT DISTINCT codigo
            FROM {schema}.tiny_order_item
            WHERE order_id IN (SELECT id FROM pedidos_filtrados)
        )
        SELECT COUNT(*) AS total
        FROM {schema}.tiny_products
        WHERE "tipoVariacao" = 'P'
          AND codigo IS NOT NULL
          AND codigo NOT IN (SELECT codigo FROM produtos_vendidos);
    """
    df = execute_query(schema, query)
    return int(df["total"][0]) if not df.empty and df["total"][0] else 0

def get_faturamento_por_estado(schema, data_inicio, data_fim):
    query = f"""
        WITH notas_saida AS (
            SELECT REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') AS cpf_cnpj
            FROM {schema}.tiny_nfs
            WHERE tipo = 'S' AND "createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        ),
        pedidos_filtrados AS (
            SELECT cliente_uf, total_pedido
            FROM {schema}.tiny_orders
            WHERE REGEXP_REPLACE(cliente_cpf_cnpj, '[^0-9]', '', 'g') IN (SELECT cpf_cnpj FROM notas_saida)
        )
        SELECT cliente_uf AS estado, SUM(total_pedido::numeric) AS valor
        FROM pedidos_filtrados
        WHERE cliente_uf IS NOT NULL
        GROUP BY cliente_uf
        ORDER BY valor DESC;
    """
    df = execute_query(schema, query)
    return df.to_dict(orient="records")

def get_curva_abc(schema: str, data_inicio: str, data_fim: str):
    query = f"""
        SELECT 
            oi.codigo AS sku,
            p.nome AS descricao,
            SUM(CAST(oi.quantidade AS NUMERIC)) AS quantidade_total,
            SUM(CAST(oi.valor_unitario AS NUMERIC) * CAST(oi.quantidade AS NUMERIC)) AS faturamento
        FROM {schema}.tiny_order_item oi
        JOIN {schema}.tiny_orders o ON oi.order_id = o.id
        JOIN {schema}.tiny_nfs nfs ON o.numero_ecommerce = nfs.numero_ecommerce
        JOIN {schema}.tiny_products p ON oi.codigo = p.codigo
        WHERE nfs.tipo = 'S'
          AND nfs.numero_ecommerce IS NOT NULL
          AND nfs."createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        GROUP BY oi.codigo, p.nome
        ORDER BY faturamento DESC;
    """

    df = execute_query(schema, query)
    if df.empty:
        return []

    df["percentual_acumulado"] = (df["faturamento"].cumsum() / df["faturamento"].sum()) * 100
    df["percentual_acumulado"] = df["percentual_acumulado"].round(2)

    def classificar(p):
        if p <= 80:
            return "A"
        elif p <= 95:
            return "B"
        return "C"

    df["classe_abc"] = df["percentual_acumulado"].apply(classificar)
    df["nome"] = df["descricao"]  # Corrige o undefined
    return df[["nome", "faturamento", "percentual_acumulado", "classe_abc"]].to_dict(orient="records")

def get_curva_abc_por_pai(schema: str, data_inicio: str, data_fim: str, marca: str = None):
    filtro_marca = "AND pp.marca = %s" if marca and marca != 'Todas' else ""
    params = (data_inicio, data_fim) if not filtro_marca else (data_inicio, data_fim, marca)

    query = f"""
        WITH produtos_pai AS (
            SELECT codigo AS codigo_pai, marca
            FROM {schema}.tiny_products
            WHERE "tipoVariacao" = 'P'
        ),
        produtos_var AS (
            SELECT codigo, 
                   -- Tenta encontrar o código pai com maior correspondência por prefixo
                   (SELECT codigo_pai FROM produtos_pai 
                    WHERE POSITION(codigo_pai IN codigo) = 1 
                    ORDER BY LENGTH(codigo_pai) DESC 
                    LIMIT 1) AS codigo_pai
            FROM {schema}.tiny_products
            WHERE "tipoVariacao" = 'V'
        ),
        vendas_com_pai AS (
            SELECT i.*, pv.codigo_pai, pp.marca
            FROM {schema}.tiny_order_item i
            JOIN produtos_var pv ON i.codigo = pv.codigo
            JOIN produtos_pai pp ON pv.codigo_pai = pp.codigo_pai
            JOIN {schema}.tiny_orders o ON o.id = i.order_id
            WHERE o."createdAt" BETWEEN %s AND %s
            {filtro_marca}
        )
        SELECT 
            v.codigo_pai AS produto,
            SUM(CAST(v.quantidade AS NUMERIC) * CAST(v.valor_unitario AS NUMERIC)) AS faturamento
        FROM vendas_com_pai v
        GROUP BY v.codigo_pai
        ORDER BY faturamento DESC;
    """

    dados = executar_query_lista(query, params)
    if not dados:
        return []

    df = pd.DataFrame(dados, columns=['produto', 'faturamento'])
    df["percentual_acumulado"] = (df["faturamento"].cumsum() / df["faturamento"].sum()) * 100
    df["percentual_acumulado"] = df["percentual_acumulado"].round(2)
    df["classe_abc"] = df["percentual_acumulado"].apply(lambda p: "A" if p <= 80 else ("B" if p <= 95 else "C"))
    df["nome"] = df["produto"]
    return df[["nome", "faturamento", "percentual_acumulado", "classe_abc"]].to_dict(orient="records")

def get_curva_abc_por_marca(schema: str, data_inicio: str, data_fim: str, marca: str = None):
    filtro_marca = "AND pp.marca = %s" if marca and marca != 'Todas' else ""
    params = (data_inicio, data_fim) if not filtro_marca else (data_inicio, data_fim, marca)

    query = f"""
        WITH produtos_pai AS (
            SELECT codigo AS codigo_pai, marca
            FROM {schema}.tiny_products
            WHERE "tipoVariacao" = 'P'
        ),
        produtos_var AS (
            SELECT codigo, 
                   (SELECT codigo_pai FROM produtos_pai 
                    WHERE POSITION(codigo_pai IN codigo) = 1 
                    ORDER BY LENGTH(codigo_pai) DESC 
                    LIMIT 1) AS codigo_pai
            FROM {schema}.tiny_products
            WHERE "tipoVariacao" = 'V'
        ),
        vendas_com_pai AS (
            SELECT i.*, pv.codigo_pai, pp.marca
            FROM {schema}.tiny_order_item i
            JOIN produtos_var pv ON i.codigo = pv.codigo
            JOIN produtos_pai pp ON pv.codigo_pai = pp.codigo_pai
            JOIN {schema}.tiny_orders o ON o.id = i.order_id
            WHERE o."createdAt" BETWEEN %s AND %s
            {filtro_marca}
        )
        SELECT 
            v.marca,
            SUM(CAST(v.quantidade AS NUMERIC) * CAST(v.valor_unitario AS NUMERIC)) AS faturamento
        FROM vendas_com_pai v
        GROUP BY v.marca
        ORDER BY faturamento DESC;
    """

    dados = executar_query_lista(query, params)
    if not dados:
        return []

    df = pd.DataFrame(dados, columns=['produto', 'faturamento'])
    df["percentual_acumulado"] = (df["faturamento"].cumsum() / df["faturamento"].sum()) * 100
    df["percentual_acumulado"] = df["percentual_acumulado"].round(2)
    df["classe_abc"] = df["percentual_acumulado"].apply(lambda p: "A" if p <= 80 else ("B" if p <= 95 else "C"))
    df["nome"] = df["produto"]
    return df[["nome", "faturamento", "percentual_acumulado", "classe_abc"]].to_dict(orient="records")

def get_marcas_disponiveis(schema: str):
    query = f"""
        SELECT DISTINCT marca
        FROM {schema}.tiny_products
        WHERE "tipoVariacao" = 'P'
        ORDER BY marca;
    """
    dados = executar_query_lista(query)
    return [linha[0] for linha in dados if linha[0]]

def get_produtos(schema: str) -> pd.DataFrame:
    query = f"""
        SELECT codigo, nome, marca, "tipoVariacao"
        FROM {schema}.tiny_products
        WHERE "tipoVariacao" IS NOT NULL
    """
    return executar_query_df(query)

def get_produtos_por_status(schema, start_date, end_date, status='Todos'):
    if status == 'Todos':
        query = f"""
            SELECT codigo, nome, estoque, preco, categoria, preco_custo_medio
            FROM {schema}.tiny_products
        """
    elif status == 'Vendidos':
        query = f"""
            SELECT DISTINCT p.codigo, p.nome, p.estoque, p.preco, p.categoria, p.preco_custo_medio
            FROM {schema}.tiny_nfs nf
            JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
            JOIN {schema}.tiny_order_item oi ON o.id = oi.order_id
            JOIN {schema}.tiny_products p ON oi.codigo = p.codigo
            WHERE nf.tipo = 'S'
              AND nf."createdAt" BETWEEN '{start_date}' AND '{end_date}'
        """
    elif status == 'Sem Venda':
        query = f"""
            SELECT codigo, nome, estoque, preco, categoria, preco_custo_medio
            FROM {schema}.tiny_products
            WHERE codigo NOT IN (
                SELECT DISTINCT oi.codigo
                FROM {schema}.tiny_nfs nf
                JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
                JOIN {schema}.tiny_order_item oi ON o.id = oi.order_id
                WHERE nf.tipo = 'S'
                  AND nf."createdAt" BETWEEN '{start_date}' AND '{end_date}'
            )
        """
    else:
        return []

    df = execute_query(schema, query)
    return df.to_dict(orient="records")

def get_media_vendas_diarias(schema, data_inicio, data_fim):
    query = f"""
        SELECT oi.codigo, SUM(oi.quantidade::numeric) / 90 AS media_diaria
        FROM {schema}.tiny_nfs nf
        JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        JOIN {schema}.tiny_order_item oi ON o.id = oi.order_id
        WHERE nf.tipo = 'S'
        AND nf."createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        GROUP BY oi.codigo
    """
    df = execute_query(schema, query)
    return {row['codigo']: row['media_diaria'] for _, row in df.iterrows()}

def get_ultima_venda_por_produto(schema, data_inicio, data_fim):
    query = f"""
        SELECT oi.codigo, MAX(nf."createdAt") AS ultima_venda
        FROM {schema}.tiny_nfs nf
        JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        JOIN {schema}.tiny_order_item oi ON o.id = oi.order_id
        WHERE nf.tipo = 'S'
        AND nf."createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        GROUP BY oi.codigo
    """
    df = execute_query(schema, query)
    return {row['codigo']: row['ultima_venda'] for _, row in df.iterrows()}

def get_top_marketplaces_query(schema, data_inicio, data_fim):
    query = f"""
        SELECT o.forma_pagamento, SUM(o.total_pedido) AS total
        FROM {schema}.tiny_nfs nfs
        JOIN {schema}.tiny_orders o
          ON nfs.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        WHERE nfs.tipo = 'S'
          AND nfs."createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
          AND o.forma_pagamento IS NOT NULL
        GROUP BY o.forma_pagamento
        ORDER BY total DESC
    """
    return executar_query_df(query)  # ou equivalente à sua função padrão

def get_cancelled_orders_count(schema: str, data_inicio: str, data_fim: str) -> int:
    query = f"""
        SELECT COUNT(*) AS total_cancelados
        FROM {schema}.tiny_nfs nfs
        JOIN {schema}.tiny_orders o ON nfs.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        WHERE nfs.tipo = 'S'
        AND nfs."createdAt" BETWEEN '{data_inicio}' AND '{data_fim}'
        AND o.situacao ILIKE 'cancelado'
    """
    df = execute_query(schema, query)
    return int(df['total_cancelados'][0]) if not df.empty else 0

def get_ticket_medio(schema: str, data_inicio: str, data_fim: str) -> float:
    query = f"""
        SELECT 
            CASE 
                WHEN COUNT(*) > 0 THEN SUM(total_pedido) / COUNT(*)
                ELSE 0
            END AS ticket_medio
        FROM {schema}.tiny_orders
        WHERE "createdAt" BETWEEN '{data_inicio}' AND '{data_fim}';
    """
    df = execute_query(schema, query)
    return float(df['ticket_medio'][0]) if not df.empty else 0.0


def get_ranking_vendas_query(schema: str, start_date: str, end_date: str):
    query = f"""
        SELECT 
            o.cliente_cidade AS cidade,
            o.cliente_uf AS estado,
            o.forma_pagamento AS marketplace,
            ROUND(AVG(CASE WHEN o.valor_frete > 0 THEN o.valor_frete ELSE NULL END), 2) AS frete_medio,
            ROUND(AVG(o.total_pedido), 2) AS ticket_medio,
            TO_CHAR(o."createdAt", 'HH24') AS hora
        FROM {schema}.tiny_nfs nf
        JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        WHERE nf.tipo = 'S'
          AND nf."createdAt" BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY o.cliente_cidade, o.cliente_uf, o.forma_pagamento, TO_CHAR(o."createdAt", 'HH24')
        ORDER BY o.cliente_cidade, o.cliente_uf;
    """
    return execute_query(schema, query)

def get_detalhes_ranking_vendas(schema: str, start_date: str, end_date: str):
    query = f"""
        WITH notas_saida AS (
            SELECT cliente_cpf_cnpj, cliente_cidade, cliente_uf, id AS order_id, total_pedido
            FROM {schema}.tiny_orders
            WHERE cliente_cpf_cnpj IS NOT NULL
              AND cliente_cidade IS NOT NULL
              AND cliente_uf IS NOT NULL
              AND "createdAt" BETWEEN '{start_date}' AND '{end_date}'
        ),
        itens AS (
            SELECT 
                ns.cliente_cidade AS cidade,
                ns.cliente_uf AS estado,
                oi.codigo,
                SUM(CAST(oi.quantidade AS NUMERIC)) AS total_vendido,
                SUM(CAST(oi.quantidade AS NUMERIC) * CAST(oi.valor_unitario AS NUMERIC)) AS valor_faturado
            FROM notas_saida ns
            JOIN {schema}.tiny_order_item oi ON oi.order_id = ns.order_id
            GROUP BY ns.cliente_cidade, ns.cliente_uf, oi.codigo
        ),
        com_nomes AS (
            SELECT 
                i.cidade,
                i.estado,
                i.codigo,
                i.total_vendido,
                i.valor_faturado,
                p.nome
            FROM itens i
            LEFT JOIN {schema}.tiny_products p ON i.codigo = p.codigo
        ),
        classificados AS (
            SELECT 
                cidade,
                estado,
                SUM(valor_faturado) OVER (PARTITION BY cidade, estado) AS valor_total,
                FIRST_VALUE(nome) OVER (PARTITION BY cidade, estado ORDER BY total_vendido DESC) AS produto_mais_vendido
            FROM com_nomes
        )
        SELECT DISTINCT cidade, estado, valor_total, produto_mais_vendido
        FROM classificados
    """
    return execute_query(schema, query)

def get_valor_total_faturado_simples(schema, start_date, end_date):
    conn = get_connection()
    cur = conn.cursor()
    query = f"""
        SELECT SUM(CAST(valor AS NUMERIC)) AS total
        FROM {schema}.tiny_nfs
        WHERE tipo = 'S'
          AND "createdAt" BETWEEN '{start_date}' AND '{end_date}';
    """
    cur.execute(query)
    result = cur.fetchone()[0] or 0
    cur.close()
    conn.close()
    return result