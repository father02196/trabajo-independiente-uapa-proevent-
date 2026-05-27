import React from 'react';
import { FiCamera, FiChevronDown, FiChevronUp, FiClock, FiMail, FiMonitor, FiTruck } from 'react-icons/fi';
import './../css/SoporteHome.css';

function SoporteHome() {
    return (
        <div className="soporte-container">
            <div className="soporte-header">
                <span className="soporte-subtitle">¿CÓMO PODEMOS AYUDARTE?</span>
                <h1 className="soporte-title">Centro de Ayuda y Soporte</h1>
                <p className="soporte-description">
                    Conecta con el departamento adecuado para asegurar el éxito de tu evento universitario. Gestionamos la logística, tecnología y producción para toda la comunidad UAPA.
                </p>
            </div>

            <div className="support-cards-grid">
                <div className="support-card">
                    <div className="support-card-icon blue-bg">
                        <FiTruck aria-hidden="true" />
                    </div>
                    <h3>Transporte</h3>
                    <p>Coordina la logística, horarios de vehículos y llegada de invitados para eventos fuera del campus o a gran escala.</p>
                    <div className="support-card-footer">
                        <span className="support-detail"><FiMail aria-hidden="true" /><span className="email-link">transporte@uapa.edu.do</span></span>
                        <span className="support-detail response-time"><FiClock aria-hidden="true" />Tiempo de respuesta: &lt; 24h</span>
                    </div>
                </div>

                <div className="support-card">
                    <div className="support-card-icon purple-bg">
                        <FiCamera aria-hidden="true" />
                    </div>
                    <h3>Producción Audiovisual</h3>
                    <p>Grabación multimedia profesional, configuraciones de transmisión en vivo y gestión de sonido de alta fidelidad.</p>
                    <div className="support-card-footer">
                        <span className="support-detail"><FiMail aria-hidden="true" /><span className="email-link">audiovisual@uapa.edu.do</span></span>
                        <span className="support-detail response-time"><FiClock aria-hidden="true" />Tiempo de respuesta: &lt; 12h</span>
                    </div>
                </div>

                <div className="support-card">
                    <div className="support-card-icon green-bg">
                        <FiMonitor aria-hidden="true" />
                    </div>
                    <h3>Soporte Técnico</h3>
                    <p>Configuración de equipos, solución de problemas de software y asistencia técnica in situ durante eventos en vivo.</p>
                    <div className="support-card-footer">
                        <span className="support-detail"><FiMail aria-hidden="true" /><span className="email-link">soporte.tecnico@uapa.edu.do</span></span>
                        <span className="support-detail response-time"><FiClock aria-hidden="true" />Tiempo de respuesta: &lt; 4h</span>
                    </div>
                </div>
            </div>

            <div className="faq-section">
                <div className="faq-header">
                    <h2>Preguntas Frecuentes</h2>
                    <a href="#" className="view-all-link">Ver base de conocimientos completa</a>
                </div>
                <div className="faq-list">
                    <div className="faq-item">
                        <div className="faq-question">
                            <span>¿Cómo solicito un nuevo evento institucional?</span>
                            <FiChevronDown className="chevron" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="faq-item expanded">
                        <div className="faq-question">
                            <span>¿Cuál es el tiempo de antelación para solicitudes audiovisuales?</span>
                            <FiChevronUp className="chevron up" aria-hidden="true" />
                        </div>
                        <div className="faq-answer">
                            Todas las solicitudes de producción audiovisual deben presentarse al menos 5 días hábiles antes de la fecha del evento para garantizar la disponibilidad de equipos y personal. Para eventos importantes en auditorios, recomendamos 10 días hábiles.
                        </div>
                    </div>
                    <div className="faq-item">
                        <div className="faq-question">
                            <span>¿Cómo puedo cancelar o reprogramar una solicitud de transporte?</span>
                            <FiChevronDown className="chevron" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="faq-item">
                        <div className="faq-question">
                            <span>¿Dónde puedo encontrar recursos de la marca universitaria para materiales del evento?</span>
                            <FiChevronDown className="chevron" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="support-footer">
                <div className="footer-left">
                    <span>© 2024 UAPA PROEVENT</span>
                    <span className="dot">•</span>
                    <span>Sistema de Gestión de Eventos Universitarios</span>
                </div>
                <div className="footer-right">
                    <span className="status-dot"></span> Todos los sistemas operativos
                </div>
            </div>
        </div>
    );
}

export default SoporteHome;
