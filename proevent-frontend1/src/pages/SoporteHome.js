import React, { useState } from 'react';
import { 
    FiHelpCircle, FiChevronDown, FiCheckCircle, FiClock, FiMail, FiInfo, FiUser, FiBriefcase, FiMonitor, FiTruck, FiVideo, FiDollarSign, FiShoppingCart, FiShield
} from 'react-icons/fi';
import './../css/SoporteHome.css';

const FAQS = [
    { id: 1, question: '¿Cómo crear una solicitud de evento?', answer: 'Debes acceder al módulo de "Crear Evento", completar el formulario con todos los datos requeridos y enviarlo con suficiente anticipación. Luego será evaluado por las autoridades correspondientes.' },
    { id: 2, question: '¿Cómo modificar una solicitud enviada?', answer: 'Ve a la sección de tus solicitudes, selecciona el evento que deseas modificar y haz clic en el botón de edición. Ten en cuenta que algunas modificaciones pueden requerir nueva aprobación.' },
    { id: 3, question: '¿Cómo solicitar servicios audiovisuales?', answer: 'Dentro del formulario de creación del evento, encontrarás una sección dedicada a requerimientos audiovisuales. Marca las opciones necesarias (proyector, sonido, etc.).' },
    { id: 4, question: '¿Cómo consultar el estado de mi solicitud?', answer: 'En el panel principal (Dashboard), puedes ver el estado actual de tus solicitudes (Pendiente, Aprobado, Rechazado).' },
    { id: 5, question: '¿Cómo cancelar una solicitud?', answer: 'Selecciona la solicitud en tu panel y utiliza la opción de "Cancelar". Si el evento ya estaba aprobado, te recomendamos notificar a los departamentos involucrados.' },
    { id: 6, question: '¿Quién aprueba los eventos?', answer: 'Las solicitudes pasan por un flujo de aprobación que incluye tu decanato o departamento, y posteriormente las áreas de logística y recursos (si aplica).' },
    { id: 7, question: '¿Qué hacer si ocurre un error en el sistema?', answer: 'Toma una captura de pantalla del error y contacta al soporte técnico a través de los correos listados en la sección de Contacto.' },
    { id: 8, question: '¿Cómo contactar al administrador?', answer: 'Puedes utilizar los correos electrónicos disponibles en la sección "¿Necesitas ayuda personalizada?" al final de esta página.' }
];

const QUICK_GUIDE = [
    { text: 'Completar todos los campos obligatorios en los formularios.', icon: <FiCheckCircle /> },
    { text: 'Enviar solicitudes con suficiente anticipación.', icon: <FiClock /> },
    { text: 'Verificar la disponibilidad de recursos antes de solicitar.', icon: <FiInfo /> },
    { text: 'Revisar periódicamente el estado de las solicitudes.', icon: <FiMonitor /> },
    { text: 'Mantener actualizada la información del evento.', icon: <FiCheckCircle /> }
];

const SUPPORT_CONTACTS = [
    { id: 1, dept: 'Administración General', desc: 'Administración general del sistema, gestión de usuarios, roles, permisos y configuración institucional.', role: 'Administrador General', email: 'administracion@uapa.edu.do', schedule: 'Lunes a Viernes 8:00 AM - 5:00 PM', icon: <FiShield />, color: 'blue' },
    { id: 2, dept: 'Gestión de Eventos', desc: 'Atención de solicitudes de eventos, aprobaciones, modificaciones y coordinación de eventos institucionales.', role: 'Coordinador de Eventos', email: 'eventos@uapa.edu.do', schedule: 'Lunes a Viernes 8:00 AM - 5:00 PM', icon: <FiBriefcase />, color: 'green' },
    { id: 3, dept: 'Departamento Audiovisual', desc: 'Soporte para solicitudes audiovisuales, asignación de equipos, producción y transmisión de eventos.', role: 'Coordinador Audiovisual', email: 'audiovisual@uapa.edu.do', schedule: 'Lunes a Sábado 8:00 AM - 8:00 PM', icon: <FiVideo />, color: 'purple' },
    { id: 4, dept: 'Presupuesto (POA)', desc: 'Validación presupuestaria, disponibilidad de recursos y gestión del POA institucional.', role: 'Analista Presupuestario', email: 'presupuesto@uapa.edu.do', schedule: 'Lunes a Viernes 8:00 AM - 5:00 PM', icon: <FiDollarSign />, color: 'orange' },
    { id: 5, dept: 'Compras y Licitaciones', desc: 'Gestión de cotizaciones, proveedores, procesos de licitación y adjudicación de servicios.', role: 'Encargado de Compras', email: 'compras@uapa.edu.do', schedule: 'Lunes a Viernes 8:00 AM - 5:00 PM', icon: <FiShoppingCart />, color: 'teal' },
    { id: 6, dept: 'Soporte Tecnológico', desc: 'Asistencia técnica del sistema, incidencias, acceso a la plataforma y soporte informático.', role: 'Especialista de Soporte TI', email: 'soporte@uapa.edu.do', schedule: 'Lunes a Viernes 8:00 AM - 6:00 PM', icon: <FiMonitor />, color: 'red' }
];

function SoporteHome() {
    const [activeFaq, setActiveFaq] = useState(null);
    const [activeTab, setActiveTab] = useState('faq');

    const toggleFaq = (id) => {
        setActiveFaq(activeFaq === id ? null : id);
    };

    return (
        <div className="soporte-modern-page soporte-fade-in">
            {/* 1. Encabezado (Hero) */}
            <div className="soporte-hero-modern">
                <div className="soporte-hero-content">
                    <h1>Centro de Ayuda y Soporte</h1>
                    <p>
                        Consulta información frecuente sobre el uso del sistema y contacta a nuestro 
                        personal administrativo si necesitas asistencia adicional.
                    </p>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="soporte-tabs-wrapper">
                <div className="soporte-tabs">
                    <button 
                        className={`soporte-tab-btn ${activeTab === 'faq' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('faq')}
                    >
                        <FiHelpCircle /> Preguntas Frecuentes
                    </button>
                    <button 
                        className={`soporte-tab-btn ${activeTab === 'guia' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('guia')}
                    >
                        <FiCheckCircle /> Guía Rápida
                    </button>
                    <button 
                        className={`soporte-tab-btn ${activeTab === 'contacto' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('contacto')}
                    >
                        <FiUser /> Contacto de Soporte
                    </button>
                </div>
            </div>

            <div className="soporte-container">
                {/* TAB: PREGUNTAS FRECUENTES */}
                {activeTab === 'faq' && (
                    <section className="soporte-section soporte-fade-in">
                        <div className="section-header">
                            <div className="section-icon icon-blue">
                                <FiHelpCircle />
                            </div>
                            <h2>Preguntas Frecuentes</h2>
                        </div>
                        <div className="soporte-faq-accordion">
                            {FAQS.map(faq => (
                                <div key={faq.id} className="soporte-faq-item">
                                    <div 
                                        className={`soporte-faq-header ${activeFaq === faq.id ? 'open' : ''}`}
                                        onClick={() => toggleFaq(faq.id)}
                                    >
                                        <span>{faq.question}</span>
                                        <FiChevronDown className="faq-icon" />
                                    </div>
                                    <div className={`soporte-faq-body ${activeFaq === faq.id ? 'open' : ''}`}>
                                        <div style={{ paddingTop: '10px' }}>{faq.answer}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* TAB: GUÍA RÁPIDA */}
                {activeTab === 'guia' && (
                    <section className="soporte-section soporte-fade-in">
                        <div className="section-header">
                            <div className="section-icon icon-green">
                                <FiCheckCircle />
                            </div>
                            <h2>Guía Rápida</h2>
                        </div>
                        <div className="soporte-guide-grid">
                            {QUICK_GUIDE.map((item, index) => (
                                <div key={index} className="guide-card">
                                    <div className="guide-icon">
                                        {item.icon}
                                    </div>
                                    <p>{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* TAB: CONTACTO Y SOPORTE */}
                {activeTab === 'contacto' && (
                    <div className="soporte-fade-in">
                        <section className="soporte-section">
                            <div className="section-header">
                                <div className="section-icon icon-purple">
                                    <FiUser />
                                </div>
                                <h2>Directorio de Contacto Institucional</h2>
                            </div>
                            <p style={{ color: '#525252', marginBottom: '30px', fontSize: '1.05rem', lineHeight: '1.6' }}>
                                Si después de consultar las preguntas frecuentes aún necesitas asistencia, puedes comunicarte directamente con el departamento correspondiente. Nuestro equipo estará disponible para brindarte orientación y resolver cualquier inquietud relacionada con el sistema.
                            </p>
                            <div className="soporte-directory-grid">
                                {SUPPORT_CONTACTS.map(contact => (
                                    <div key={contact.id} className="directory-card">
                                        <div className="directory-card-header">
                                            <div className={`directory-icon icon-${contact.color}`}>{contact.icon}</div>
                                            <div>
                                                <h3>{contact.dept}</h3>
                                                <span className="directory-role">{contact.role}</span>
                                            </div>
                                        </div>
                                        <div className="directory-card-body">
                                            <p className="directory-desc">{contact.desc}</p>
                                            <div className="directory-info-item">
                                                <FiMail className="info-item-icon" /> <span>{contact.email}</span>
                                            </div>
                                            <div className="directory-info-item">
                                                <FiClock className="info-item-icon" /> <span>{contact.schedule}</span>
                                            </div>
                                        </div>
                                        <div className="directory-card-footer">
                                            <a href={`mailto:${contact.email}`} className="directory-email-btn">
                                                <FiMail /> Enviar correo
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="soporte-section additional-info" style={{ marginTop: '40px' }}>
                            <div className="soporte-info-card">
                                <div className="info-icon-wrapper">
                                    <FiInfo className="info-icon" />
                                </div>
                                <div className="info-content">
                                    <h4>Información Importante</h4>
                                    <ul>
                                        <li><strong>Horario de atención general:</strong> Lunes a Viernes de 8:00 AM a 6:00 PM.</li>
                                        <li><strong>Tiempo estimado de respuesta:</strong> 24 a 48 horas laborables.</li>
                                        <li>Te recomendamos consultar la sección de <strong>Preguntas Frecuentes</strong> antes de contactar al soporte, ya que podrías encontrar la respuesta a tus dudas de forma inmediata.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
            
            <div className="soporte-footer">
                © {new Date().getFullYear()} UAPA PROEVENT • Sistema de Gestión de Eventos Universitarios
            </div>
        </div>
    );
}

export default SoporteHome;
