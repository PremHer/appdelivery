import { useState, useEffect } from 'react';
import {
    Utensils,
    Clock,
    MapPin,
    Star,
    Smartphone,
    Truck,
    Shield,
    CreditCard,
    Instagram,
    Facebook,
    Twitter,
    Mail,
    Phone,
    ChevronRight,
    Menu,
    X
} from 'lucide-react';

function App() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: <Clock size={36} />,
            title: 'Entrega Rápida',
            description: 'Recibe tu pedido en 30 minutos o menos. Repartidores cerca de ti listos para entregar.'
        },
        {
            icon: <MapPin size={36} />,
            title: 'Seguimiento en Vivo',
            description: 'Sigue tu pedido en tiempo real desde que sale del restaurante hasta tu puerta.'
        },
        {
            icon: <CreditCard size={36} />,
            title: 'Pago Seguro',
            description: 'Múltiples métodos de pago. Efectivo, tarjeta o billetera digital. Tú eliges.'
        },
        {
            icon: <Truck size={36} />,
            title: 'Variedad de Tiendas',
            description: 'Restaurantes, farmacias, supermercados, licorería y mucho más en un solo lugar.'
        },
        {
            icon: <Star size={36} />,
            title: 'Mejores Ofertas',
            description: 'Descuentos exclusivos y códigos promocionales para ahorrar en cada pedido.'
        },
        {
            icon: <Shield size={36} />,
            title: 'Garantía de Calidad',
            description: 'Productos frescos y bien empaquetados. Si algo falla, te reembolsamos.'
        }
    ];

    const steps = [
        { number: 1, title: 'Elige tu tienda', description: 'Explora restaurantes y tiendas cerca de ti' },
        { number: 2, title: 'Selecciona productos', description: 'Agrega lo que quieras al carrito' },
        { number: 3, title: 'Confirma tu pedido', description: 'Elige cómo pagar y tu dirección' },
        { number: 4, title: 'Recibe en tu puerta', description: 'Sigue el envío en tiempo real' }
    ];

    const categories = [
        { emoji: '🍔', name: 'Comida' },
        { emoji: '💊', name: 'Farmacia' },
        { emoji: '🍷', name: 'Licores' },
        { emoji: '🛒', name: 'Mercado' },
        { emoji: '🐕', name: 'Mascotas' }
    ];

    return (
        <div className="app">
            {/* Navbar */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="container navbar-content">
                    <a href="#" className="logo">
                        <div className="logo-icon">
                            <Utensils size={22} />
                        </div>
                        DeliveryApp
                    </a>

                    <div className="nav-links">
                        <a href="#features" className="nav-link">Características</a>
                        <a href="#how-it-works" className="nav-link">Cómo Funciona</a>
                        <a href="#categories" className="nav-link">Categorías</a>
                        <a href="#download" className="nav-link">Descargar</a>
                    </div>

                    <div className="nav-buttons">
                        <button className="btn btn-secondary">Iniciar Sesión</button>
                        <button className="btn btn-primary">Regístrate</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-text">
                        <h1>
                            Tu comida favorita<br />
                            <span>en minutos</span>
                        </h1>
                        <p>
                            Pide de los mejores restaurantes y tiendas de tu ciudad.
                            Entrega rápida, seguimiento en tiempo real y las mejores ofertas.
                        </p>
                        <div className="hero-buttons">
                            <a href="#download" className="btn btn-primary">
                                <Smartphone size={20} />
                                Descargar App
                            </a>
                            <a href="#categories" className="btn btn-secondary">
                                Ver Restaurantes
                                <ChevronRight size={20} />
                            </a>
                        </div>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Restaurantes</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">50K+</div>
                                <div className="stat-label">Usuarios Activos</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">4.8</div>
                                <div className="stat-label">Rating Promedio</div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-image">
                        <img
                            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=600&fit=crop"
                            alt="Delivery App"
                            className="hero-phone"
                            style={{ borderRadius: '30px' }}
                        />

                        <div className="floating-card left">
                            <div className="floating-icon orange">🍕</div>
                            <div className="floating-text">
                                <strong>Pedido en camino</strong>
                                <span>Llega en 15 min</span>
                            </div>
                        </div>

                        <div className="floating-card right">
                            <div className="floating-icon green">✓</div>
                            <div className="floating-text">
                                <strong>¡Entregado!</strong>
                                <span>Pedido #1234</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Por qué elegirnos</span>
                        <h2 className="section-title">La mejor experiencia de delivery</h2>
                        <p className="section-subtitle">
                            Diseñamos cada detalle pensando en ti. Rápido, seguro y conveniente.
                        </p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div className="feature-card" key={index}>
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="how-it-works" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Fácil y rápido</span>
                        <h2 className="section-title">¿Cómo funciona?</h2>
                        <p className="section-subtitle">
                            En solo 4 pasos tendrás tu pedido en la puerta de tu casa
                        </p>
                    </div>

                    <div className="steps-container">
                        {steps.map((step) => (
                            <div className="step-card" key={step.number}>
                                <div className="step-number">{step.number}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="categories" id="categories">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Explora</span>
                        <h2 className="section-title">Todo lo que necesitas</h2>
                        <p className="section-subtitle">
                            Desde comida hasta productos de farmacia, todo en una sola app
                        </p>
                    </div>

                    <div className="categories-grid">
                        {categories.map((cat, index) => (
                            <div className="category-card" key={index}>
                                <div className="category-icon">{cat.emoji}</div>
                                <h3>{cat.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Download CTA */}
            <section className="download-cta" id="download">
                <div className="container download-content">
                    <div className="download-text">
                        <h2>Descarga la App Ahora</h2>
                        <p>
                            Únete a miles de usuarios satisfechos. Descarga gratis y empieza
                            a pedir tus favoritos con descuentos exclusivos.
                        </p>
                        <div className="download-buttons">
                            <a href="https://expo.dev/artifacts/eas/hUqWktP2ojYmo1RVjcQaUc.apk" className="store-button" target="_blank" rel="noopener noreferrer">
                                <span className="store-icon">📱</span>
                                <div className="store-text">
                                    <small>Descargar APK</small>
                                    <strong>App Cliente</strong>
                                </div>
                            </a>
                            <a href="https://expo.dev/accounts/hernandezpremh/projects/delivery-driver-prem/builds/21fc5602-edb6-41e5-a4a1-d713be944001" className="store-button" target="_blank" rel="noopener noreferrer">
                                <span className="store-icon">🛵</span>
                                <div className="store-text">
                                    <small>Descargar APK</small>
                                    <strong>App Repartidor</strong>
                                </div>
                            </a>
                        </div>
                        <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>
                            ⚡ Versión Android • Próximamente en iOS
                        </p>
                    </div>

                    <div className="download-image">
                        <img
                            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=500&fit=crop"
                            alt="Descarga la app"
                            style={{ borderRadius: '24px' }}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <h3>🍕 DeliveryApp</h3>
                            <p>
                                La mejor plataforma de delivery de tu ciudad.
                                Conectamos restaurantes, tiendas y repartidores
                                para llevarte lo que necesitas a tu puerta.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-link"><Instagram size={20} /></a>
                                <a href="#" className="social-link"><Facebook size={20} /></a>
                                <a href="#" className="social-link"><Twitter size={20} /></a>
                            </div>
                        </div>

                        <div className="footer-links">
                            <h4>Empresa</h4>
                            <ul>
                                <li><a href="#">Sobre Nosotros</a></li>
                                <li><a href="#">Trabaja con Nosotros</a></li>
                                <li><a href="#">Blog</a></li>
                                <li><a href="#">Prensa</a></li>
                            </ul>
                        </div>

                        <div className="footer-links">
                            <h4>Socios</h4>
                            <ul>
                                <li><a href="#">Registra tu Restaurante</a></li>
                                <li><a href="#">Sé Repartidor</a></li>
                                <li><a href="#">Afiliados</a></li>
                            </ul>
                        </div>

                        <div className="footer-links">
                            <h4>Ayuda</h4>
                            <ul>
                                <li><a href="#">Centro de Ayuda</a></li>
                                <li><a href="#">Términos y Condiciones</a></li>
                                <li><a href="#">Política de Privacidad</a></li>
                                <li><a href="#">Contacto</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2024 DeliveryApp. Todos los derechos reservados.</p>
                        <p>Hecho con ❤️ para tu ciudad</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
