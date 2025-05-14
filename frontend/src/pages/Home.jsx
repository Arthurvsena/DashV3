import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
    const navigate = useNavigate();
    const [modulos, setModulos] = useState([]);

    useEffect(() => {
        try {
            const token = localStorage.getItem("token");
            const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
            setModulos(payload?.modulos_ativos || []);
        } catch (err) {
            console.error("Erro ao carregar módulos:", err);
        }
    }, []);

    const possuiModulo = (modulo) => modulos.includes(modulo);

    return (
        <div className="home-wrapper">
            <div className="home-header">
                <div>
                    <h1>Bem vindo Seller</h1>
                    <p className="subtitle">Essa é a sua central</p>
                </div>
                <button className="config-button" onClick={() => navigate("/config")}>
                    <i className="fa-solid fa-gear"></i>
                </button>
            </div>

            <div className="home-main">
                <div className="video-card">
                    <h3>Conheça a plataforma:</h3>
                    <div className="video-wrapper">
                        <iframe
                            src="https://www.youtube.com/embed/r3bsDYfr6tM?si=pOqHKSvnzuIMbLDD"
                            title="Video institucional"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>

                <div className="novidades-card">
                    <span className="badge">2</span>
                    <h3>Novidades:</h3>
                    <div className="novidade-box">
                        <h4>🔔 Novidades no Mercado Livre</h4>
                        <p>Alteração nos valores das comissões</p>
                        <button onClick={() => alert("Em breve")} className="btn-ver">
                            Ver novidades
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-banner">
                <div className="home-banner">
                    <img src="/logo.png" alt="Help Seller" className="banner-img" />
                    <div>
                        <h2>Descubra novas funcionalidades!</h2>
                        <p>Conheça todas as funcionalidades da nossa plataforma.</p>
                        <button className="btn-shopping" onClick={() => navigate("/shopping")}>Shopping 🛒</button>
                    </div>
                </div>

                <div className="dashboard-access">
                    {possuiModulo("dashboard") ? (
                        <button className="btn-dashboard" onClick={() => navigate("/dashboard")}>
                            <i className="fa-solid fa-chart-simple"></i>
                            <span>Dashboard</span>
                        </button>
                    ) : (
                        <div
                            className="btn-dashboard locked"
                            title="Tenha controle total do seu negócio! Conheça o nosso dashboard com todos os indicativos para que você possa acompanhar sua loja de perto"
                        >
                            <i className="fa-solid fa-chart-simple"></i>
                            <span>Dashboard</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
