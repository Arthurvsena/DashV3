from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.dashboard import router as dashboard_router
from routes.categorias import router as categorias_router
from routes.produtos import router as produtos_router
from routes.calculadora import router as calculadora_router
from routes.usuarios_router import router as usuarios_router
from auth import router as auth_router
from crud import router as vendas_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou restrinja por domínio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(vendas_router)
app.include_router(dashboard_router)
app.include_router(categorias_router)
app.include_router(calculadora_router)
app.include_router(produtos_router, prefix="/api")
app.include_router(usuarios_router)
