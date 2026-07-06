import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import './../css/Welcome.css';
import uapaLogo from './../img/Logo-blanco-UAPA.png';
import logoProevent from './../img/logo-proevent.jpeg';
import emblemProevent from './../img/Emblema-Proevent.jpeg';

const API = "http://localhost:8080";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
    title: "Solicitud de Eventos",
    desc: "Gestiona y solicita eventos institucionales de manera rápida y estructurada, con todos los requisitos en un solo formulario.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    title: "Soporte Audiovisual",
    desc: "Solicita grabaciones, transmisiones en vivo y cobertura audiovisual con al menos 5 días de anticipación.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    title: "Gestión de Presupuesto POA",
    desc: "Verifica y gestiona los presupuestos del Plan Operativo Anual vinculados a cada actividad institucional.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Modalidad y Lugar",
    desc: "Define la modalidad (presencial, virtual o híbrida) y el lugar del evento con disponibilidad en tiempo real.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    title: "Servicios de Catering",
    desc: "Coordina alimentos y bebidas para tus eventos cumpliendo con las políticas institucionales establecidas.",
  },
];

const POLICIES = [
  {
    category: "Solicitud de Eventos",
    color: "blue",
    items: [
      "Toda solicitud debe realizarse conforme al tipo de actividad y los plazos establecidos.",
      "Protocolo y Eventos coordina reconocimientos institucionales y actividades con público externo.",
      "Reuniones presenciales (2-4 hrs): Solo se ofrecerá agua, café o té.",
      "Solicitudes de alimentos: 15 días laborables de anticipación (20 si requiere contratación externa).",
      "Toda actividad debe estar autorizada en el POA y tener presupuesto.",
      "Requisitos obligatorios: Programa, autorización del Vicerrector/Director y lista de invitados.",
      "Es obligatorio cotizar con al menos tres proveedores para servicios o bienes externos.",
    ],
  },
  {
    category: "Audiovisual",
    color: "orange",
    items: [
      "Grabación de video, cobertura y transmisión en vivo deben solicitarse con al menos 5 días de antelación.",
      "Consultas: produccionaudiovisual@uapa.edu.do o extensión 470.",
      "Actividades fuera de sede requieren gestionar transporte del equipo técnico: extensión 239.",
      "Si su grabación requiere teleprompter, debe enviar el texto al momento de hacer la solicitud.",
    ],
  },
];

/* ── Checkmark SVG ── */
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 8.5 6 12 13.5 4" />
  </svg>
);

function Welcome({ isLoggedIn, onLogoutClick }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [stats, setStats]               = useState({ eventos: 0, audiovisual: 0, usuarios: 0 });

  const toggleSidebar  = () => setSidebarOpen((v) => !v);
  const openHelpModal  = () => { setShowHelpModal(true); setSidebarOpen(false); };
  const closeHelpModal = () => setShowHelpModal(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resEv, resAv, resUs] = await Promise.all([
          fetch(`${API}/eventos`),
          fetch(`${API}/audiovisual`),
          fetch(`${API}/usuarios`),
        ]);
        const [ev, av, us] = await Promise.all([resEv.json(), resAv.json(), resUs.json()]);
        setStats({
          eventos:    Array.isArray(ev) ? ev.length : 0,
          audiovisual: Array.isArray(av) ? av.length : 0,
          usuarios:   Array.isArray(us) ? us.length : 0,
        });
      } catch (err) {
        console.error("Error fetching landing stats:", err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sidebarOpen && !e.target.closest(".sidebar") && !e.target.closest(".menu-icon")) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [sidebarOpen]);

  return (
    <div className="welcome-wrapper">

      {/* ══════════════════════ NAVBAR ══════════════════════ */}
      <header className={`welcome-header${scrolled ? " scrolled" : ""}`}>
        <div className="header-logo-area">
          <img src={emblemProevent} alt="Emblema UAPA" className="header-emblem-img" />
          <div className="header-text-block">
            <span className="header-title">
              <span className="header-uapa">UAPA</span>
              <span className="header-dash">-</span>
              <span className="header-proevent">ProEvent</span>
            </span>
            <span className="header-subtitle">Sistema de Gestión de Eventos Institucionales</span>
          </div>
        </div>

        <nav className="header-nav">
          <a href="#features"  className="nav-link">Módulos</a>
          <a href="#stats"     className="nav-link">Estadísticas</a>
          <a href="#policies"  className="nav-link">Políticas</a>
          <a href="#portal" onClick={(e) => { e.preventDefault(); navigate('/portal-proveedores'); }} className="nav-link">Portal Proveedores</a>
          <a href="#contact"   className="nav-link">Contacto</a>
          {isLoggedIn ? (
            <button type="button" className="nav-cta-btn" onClick={onLogoutClick}>Cerrar Sesión</button>
          ) : (
            <button type="button" className="nav-cta-btn" onClick={() => navigate('/login')}>Iniciar Sesión</button>
          )}
        </nav>

        <button type="button" className="menu-icon" onClick={toggleSidebar} aria-label="Menú">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
      </header>

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <nav className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">PE</div>
            <span>ProEvent</span>
          </div>
          <button type="button" className="close-btn" onClick={toggleSidebar}>×</button>
        </div>
        <ul className="sidebar-menu">
          <li><a href="#features"  className="sidebar-link" onClick={() => setSidebarOpen(false)}>📋 Módulos</a></li>
          <li><a href="#policies"  className="sidebar-link" onClick={() => setSidebarOpen(false)}>📜 Políticas</a></li>
          <li><a href="#portal" className="sidebar-link" onClick={(e) => { e.preventDefault(); setSidebarOpen(false); navigate('/portal-proveedores'); }}>🏢 Portal Proveedores</a></li>
          <li><button type="button" className="sidebar-link" onClick={openHelpModal}>🆘 Ayuda y Contacto</button></li>
          {isLoggedIn ? (
            <li className="sidebar-bottom-item">
              <button type="button" className="sidebar-link logout-link" onClick={onLogoutClick}>🚪 Cerrar Sesión</button>
            </li>
          ) : (
            <li className="sidebar-bottom-item">
              <button type="button" className="sidebar-link login-link" onClick={() => { setSidebarOpen(false); navigate('/login'); }}>🔐 Iniciar Sesión</button>
            </li>
          )}
        </ul>
      </nav>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="hero-section">
        {/* Background decorative shapes */}
        <div className="hero-bg-shapes">
          <div className="hero-shape shape-1" />
          <div className="hero-shape shape-2" />
          <div className="hero-shape shape-3" />
        </div>

        {/* Left — Copy */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Sistema Institucional UAPA
          </div>

          <h1 className="hero-title">
            Gestión de Eventos<br />
            <span className="hero-title-accent">Institucionales</span>
          </h1>

          <p className="hero-subtitle">
            ProEvent centraliza la coordinación de protocolos, eventos académicos y
            servicios audiovisuales de la Universidad UAPA, garantizando eficiencia,
            transparencia y cumplimiento institucional.
          </p>

          <div className="hero-actions">
            {isLoggedIn ? (
              <button type="button" className="hero-btn primary" onClick={() => navigate('/dashboard')}>
                Mi Cuenta
              </button>
            ) : (
              <button type="button" className="hero-btn primary" onClick={() => navigate('/login')}>
                Acceder al Sistema
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="8" x2="14" y2="8"/><polyline points="9 3 14 8 9 13"/>
                </svg>
              </button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="hero-trust">
            <div className="hero-trust-item">
              <svg className="hero-trust-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2.5 8.5 6 12 13.5 4" />
              </svg>
              Acceso seguro
            </div>
            <div className="hero-trust-item">
              <svg className="hero-trust-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2.5 8.5 6 12 13.5 4" />
              </svg>
              Datos institucionales
            </div>
            <div className="hero-trust-item">
              <svg className="hero-trust-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2.5 8.5 6 12 13.5 4" />
              </svg>
              Tiempo real
            </div>
          </div>
        </div>

        {/* Right — Dashboard Mockup */}
        <div className="hero-visual">
          {/* Floating top badge */}
          <div className="hero-float-badge badge-top">
            <span className="float-badge-dot green" />
            Sistema operativo
          </div>

          <div className="hero-card-mockup">
            {/* Window chrome */}
            <div className="mockup-header">
              <div className="mockup-dot red" />
              <div className="mockup-dot yellow" />
              <div className="mockup-dot green" />
              <span className="mockup-title">ProEvent · Dashboard</span>
            </div>

            <div className="mockup-body">
              {/* Mini stat cards */}
              <div className="mockup-stats-row">
                <div className="mockup-mini-stat">
                  <div className="mockup-mini-stat-value blue">{stats.eventos || "—"}</div>
                  <div className="mockup-mini-stat-label">Eventos</div>
                </div>
                <div className="mockup-mini-stat">
                  <div className="mockup-mini-stat-value green">{stats.audiovisual || "—"}</div>
                  <div className="mockup-mini-stat-label">Audiovisual</div>
                </div>
                <div className="mockup-mini-stat">
                  <div className="mockup-mini-stat-value orange">{stats.usuarios || "—"}</div>
                  <div className="mockup-mini-stat-label">Usuarios</div>
                </div>
              </div>

              {/* Data rows */}
              <div className="mockup-row">
                <div className="mockup-label">Módulo activo</div>
                <div className="mockup-value highlight">Solicitud de Eventos</div>
              </div>
              <div className="mockup-row">
                <div className="mockup-label">Estado</div>
                <div className="mockup-badge active">✓ Aprobado</div>
              </div>
              <div className="mockup-row">
                <div className="mockup-label">Modalidad</div>
                <div className="mockup-value">Presencial</div>
              </div>
              <div className="mockup-row">
                <div className="mockup-label">Solicitante</div>
                <div className="mockup-value">Tu Departamento</div>
              </div>

              {/* Progress bar */}
              <div className="mockup-progress">
                <div className="mockup-progress-label">Progreso de preparación</div>
                <div className="mockup-progress-bar">
                  <div className="mockup-progress-fill" style={{ width: "78%" }} />
                </div>
                <div className="mockup-progress-pct">78%</div>
              </div>
            </div>
          </div>

          {/* Floating bottom badge */}
          <div className="hero-float-badge badge-bottom">
            <span className="float-badge-dot blue" />
            Solicitud procesada
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint">
          <div className="scroll-mouse"><div className="scroll-wheel" /></div>
          <span>Desliza para explorar</span>
        </div>
      </section>

      {/* ══════════════════════ INFO STRIP ══════════════════════ */}
      <section className="info-strip">
        <div className="info-strip-inner">
          <div className="info-strip-item">
            <div className="info-strip-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <div className="info-strip-title">Solicitud de Eventos</div>
              <div className="info-strip-desc">Envía tu solicitud con anticipación según las políticas institucionales.</div>
            </div>
          </div>
          <div className="info-strip-divider" />
          <div className="info-strip-item">
            <div className="info-strip-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <div className="info-strip-title">Cobertura Audiovisual</div>
              <div className="info-strip-desc">Solicita servicios audiovisuales con mínimo 5 días de antelación.</div>
            </div>
          </div>
          <div className="info-strip-divider" />
          <div className="info-strip-item">
            <div className="info-strip-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-3" />
              </svg>
            </div>
            <div>
              <div className="info-strip-title">Coordinado por Protocolo</div>
              <div className="info-strip-desc">El departamento de Protocolo y Eventos coordina todos los recursos.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURES ══════════════════════ */}
      <section id="features" className="features-section">
        <div className="section-header">
          <div className="section-tag">Módulos del Sistema</div>
          <h2 className="section-title">Todo lo que necesitas en un solo lugar</h2>
          <p className="section-subtitle">
            ProEvent integra todos los procesos de coordinación de eventos institucionales
            en una plataforma moderna y eficiente.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section className="how-section">
        <div className="how-bg" />
        <div className="how-inner">
          <div className="section-header light">
            <div className="section-tag light">¿Cómo Funciona?</div>
            <h2 className="section-title">Proceso simple y transparente</h2>
            <p className="section-subtitle">
              Cuatro pasos para gestionar cualquier evento o servicio institucional de forma eficiente.
            </p>
          </div>
          <div className="steps-grid">
            {[
              { num: "01", title: "Inicia Sesión",           desc: "Accede con tus credenciales institucionales UAPA." },
              { num: "02", title: "Completa el Formulario",  desc: "Llena todos los campos requeridos para tu tipo de solicitud." },
              { num: "03", title: "Revisión y Aprobación",   desc: "El equipo de Protocolo revisará y aprobará tu solicitud." },
              { num: "04", title: "Coordinación del Evento", desc: "ProEvent coordina todos los recursos y servicios necesarios." },
            ].map((step, i) => (
              <div key={step.num} className="step-card">
                <div className="step-num">{step.num}</div>
                {i < 3 && <div className="step-connector" />}
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS ══════════════════════ */}
      <section id="stats" className="stats-section">
        <div className="section-header">
          <div className="section-tag">Impacto del Sistema</div>
          <h2 className="section-title">Resultados que Hablan Solos</h2>
          <p className="section-subtitle">
            ProEvent optimiza la gestión institucional a través de datos precisos y procesos coordinados.
          </p>
        </div>
        <div className="stats-container">
          {[
            { label: "Eventos Gestionados",    value: stats.eventos,    icon: "📅", color: "blue"   },
            { label: "Servicios Audiovisuales", value: stats.audiovisual, icon: "🎥", color: "orange" },
            { label: "Usuarios Registrados",   value: stats.usuarios,   icon: "👥", color: "navy"   },
            { label: "Sistema Operativo",      value: "100%",           icon: "⚡", color: "gold"   },
          ].map((stat) => (
            <div key={stat.label} className={`stat-box ${stat.color}`}>
              <div className="stat-box-icon">{stat.icon}</div>
              <div className="stat-box-value">{stat.value}</div>
              <div className="stat-box-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ POLICIES ══════════════════════ */}
      <section id="policies" className="policies-section">
        <div className="section-header">
          <div className="section-tag">Reglamento Institucional</div>
          <h2 className="section-title">Normas y Políticas</h2>
          <p className="section-subtitle">
            Conoce las directrices institucionales para garantizar el correcto desarrollo de cada actividad.
          </p>
        </div>
        <div className="policies-grid">
          {POLICIES.map((pol) => (
            <div key={pol.category} className={`policy-card policy-${pol.color}`}>
              <div className="policy-card-header">
                <div className={`policy-icon-circle ${pol.color}`}>
                  {pol.color === "blue" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8"  y1="2" x2="8"  y2="6" />
                      <line x1="3"  y1="10" x2="21" y2="10" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  )}
                </div>
                <h3 className="policy-category">{pol.category}</h3>
              </div>
              <ul className="policy-list">
                {pol.items.map((item, i) => (
                  <li key={i} className="policy-item">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ CTA BANNER ══════════════════════ */}
      {!isLoggedIn && (
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para gestionar tu próximo evento?</h2>
            <p className="cta-subtitle">Accede al sistema con tus credenciales institucionales y comienza hoy mismo.</p>
            <button type="button" className="hero-btn primary cta-main-btn" onClick={() => navigate('/login')}>
              Iniciar Sesión en ProEvent
            </button>
          </div>
          <div className="cta-shapes">
            <div className="cta-shape c1" />
            <div className="cta-shape c2" />
          </div>
        </section>
      )}

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer id="contact" className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={uapaLogo} alt="UAPA" className="footer-logo" />
            <p className="footer-tagline">
              Sistema de Gestión de Protocolos y Eventos Institucionales de la Universidad APEC (UAPA).
            </p>
            <div className="footer-social">
              <a href="https://www.uapa.edu.do" target="_blank" rel="noreferrer" className="footer-social-link" aria-label="Web UAPA">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Módulos</h4>
            <ul className="footer-links">
              <li><a href="#features">Solicitud de Eventos</a></li>
              <li><a href="#features">Soporte Audiovisual</a></li>
              <li><a href="#features">Presupuesto POA</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Contacto</h4>
            <ul className="footer-links">
              <li><span>📧 eventos@uapa.edu.do</span></li>
              <li><span>📧 produccionaudiovisual@uapa.edu.do</span></li>
              <li><span>📞 (809) 724-0266 ext. 112</span></li>
              <li><button type="button" className="footer-help-btn" onClick={openHelpModal}>Centro de Ayuda</button></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} UAPA · ProEvent · Sistema de Gestión Institucional. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ══════════════════════ HELP MODAL ══════════════════════ */}
      {showHelpModal && createPortal(
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeHelpModal()}>
          <div className="modal-content help-modal">
            <button type="button" className="modal-close" onClick={closeHelpModal}>×</button>
            <div className="modal-icon-header">
              <div className="modal-icon-circle">🆘</div>
              <h3 className="modal-title">Centro de Ayuda</h3>
              <p className="modal-desc">Contacta a los encargados correspondientes según tu tipo de solicitud.</p>
            </div>
            <div className="contact-info">
              <div className="contact-group blue">
                <h4>Coordinación de Eventos</h4>
                <p><strong>Correo:</strong> eventos@uapa.edu.do</p>
                <p><strong>Teléfono:</strong> (809) 724-0266</p>
                <p><strong>Extensión:</strong> 112 / 113</p>
              </div>
              <div className="contact-group orange">
                <h4>Soporte Audiovisual</h4>
                <p><strong>Correo:</strong> produccionaudiovisual@uapa.edu.do</p>
                <p><strong>Teléfono:</strong> (809) 724-0266</p>
                <p><strong>Extensión:</strong> 470 / 239</p>
              </div>
            </div>
            <button type="button" className="primary-btn" onClick={closeHelpModal}>Cerrar</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Welcome;
