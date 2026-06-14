// ============================================================
// COMPONENTE: SoporteHome
// Pertenece a: Módulo Global / Ayuda
// Propósito: Página estática que provee información de contacto
// y preguntas frecuentes a los usuarios (Soporte Técnico,
// Logística, Audiovisual).
// ============================================================

import React from 'react';
import { FiCamera, FiChevronDown, FiChevronUp, FiClock, FiMail, FiMonitor, FiTruck } from 'react-icons/fi';
import './../css/SoporteHome.css';

function SoporteHome() {
    return (
        <div className="soporte-page fade-in">
            <div className="soporte-hero">
                <div className="soporte-hero-content">
                    <h1>Centro de Ayuda y Soporte</h1>
                    <p>
                        Conecta con el departamento adecuado para asegurar el éxito de tu evento universitario. Gestionamos la logística, tecnología y producción para toda la comunidad UAPA.
                    </p>
                    <div className="soporte-search-bar">
                        <FiMonitor className="soporte-search-icon" />
                        <input type="text" placeholder="Busca artículos, guías o soluciones..." />
                    </div>
                </div>
            </div>

            <div className="soporte-contact-grid">
                <div className="soporte-contact-card">
                    <div className="soporte-contact-icon blue">
                        <FiTruck aria-hidden="true" />
                    </div>
                    <h3>Transporte</h3>
                    <p>Coordina la logística y llegada de invitados.</p>
                </div>

                <div className="soporte-contact-card">
                    <div className="soporte-contact-icon purple">
                        <FiCamera aria-hidden="true" />
                    </div>
                    <h3>Audiovisual</h3>
                    <p>Grabación y transmisión para eventos en vivo.</p>
                </div>

                <div className="soporte-contact-card">
                    <div className="soporte-contact-icon green">
                        <FiMonitor aria-hidden="true" />
                    </div>
                    <h3>Soporte Técnico</h3>
                    <p>Configuración de equipos y asistencia técnica.</p>
                </div>
            </div>

            <div className="soporte-faq-section">
                <h2>Preguntas Frecuentes</h2>
                <div className="faq-list">
                    <div className="faq-item">
                        <div className="faq-question">
                            <span>¿Cómo solicito un nuevo evento institucional?</span>
                            <FiChevronDown className="faq-chevron" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="faq-item open">
                        <div className="faq-question">
                            <span>¿Cuál es el tiempo de antelación para solicitudes audiovisuales?</span>
                            <FiChevronUp className="faq-chevron" aria-hidden="true" />
                        </div>
                        <div className="faq-answer">
                            <div className="faq-answer-inner">
                                Todas las solicitudes de producción audiovisual deben presentarse al menos 5 días hábiles antes de la fecha del evento para garantizar la disponibilidad de equipos y personal. Para eventos importantes en auditorios, recomendamos 10 días hábiles.
                            </div>
                        </div>
                    </div>
                    <div className="faq-item">
                        <div className="faq-question">
                            <span>¿Cómo puedo cancelar o reprogramar una solicitud de transporte?</span>
                            <FiChevronDown className="faq-chevron" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="faq-item">
                        <div className="faq-question">
                            <span>¿Dónde puedo encontrar recursos de la marca universitaria?</span>
                            <FiChevronDown className="faq-chevron" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '40px', color: '#94A3B8', fontSize: '13px' }}>
                © 2024 UAPA PROEVENT • Sistema de Gestión de Eventos Universitarios
            </div>
        </div>
    );
}

export default SoporteHome;
