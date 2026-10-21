'use client';

import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Heart,
  Leaf,
  MapPin,
  MessageCircle,
  Menu,
  Phone,
  Salad,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import BookingModal from './components/BookingModal';
import defaultSiteContent from '../shared/siteContentDefaults.json';

const FEATURE_ICONS = { clipboard: ClipboardList, heart: Heart, salad: Salad, leaf: Leaf, user: UserRound };
const VALUE_ICONS = { clipboard: ClipboardList, heart: Heart, salad: Salad, leaf: Leaf, user: UserRound };

function Brand({ light = false }) {
  return (
    <a href="#top" className={`brand-mark ${light ? 'brand-mark-light' : ''}`} aria-label="Nutrition with Linda, home">
      <span className="brand-title">NUTRITION</span>
      <span className="brand-subtitle">with Linda <Leaf aria-hidden="true" size={17} /></span>
    </a>
  );
}

function App({ initialSiteContent = defaultSiteContent }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [siteContent] = useState(() => ({ ...defaultSiteContent, ...initialSiteContent }));

  const phoneHref = siteContent.phone.replace(/[^\d+]/g, '');
  const whatsappNumber = siteContent.whatsappNumber.replace(/\D/g, '');

  const openBooking = () => {
    setIsMenuOpen(false);
    setIsModalOpen(true);
  };

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-brand-cream font-sans text-brand-dark">
      <header className="site-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Brand />
          <nav className={`nav-links ${isMenuOpen ? 'nav-links-open' : ''}`} aria-label="Main navigation">
            <a href="#consultation" onClick={() => setIsMenuOpen(false)}>The consultation</a>
            <a href="#approach" onClick={() => setIsMenuOpen(false)}>Our approach</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
            <button className="button button-small nav-booking" onClick={openBooking}>
              Book a consultation <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </nav>
          <button
            className="menu-toggle"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      <main>
        <section id="consultation" className="hero-section">
          <div className="hero-grid mx-auto max-w-7xl px-6 lg:px-10">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> {siteContent.heroEyebrow}</div>
              <h1 className="hero-heading">{siteContent.heroTitle} <em>{siteContent.heroEmphasis}</em></h1>
              <p className="hero-description">{siteContent.heroDescription}</p>
              <div className="hero-actions">
                <button className="button" onClick={openBooking}>
                  Book your consultation <ArrowUpRight size={18} aria-hidden="true" />
                </button>
                <a className="text-link" href="#approach">Explore the experience <ArrowDownRight size={17} aria-hidden="true" /></a>
              </div>
              <div className="hero-note"><span className="note-check"><Check size={13} /></span> {siteContent.heroNote}</div>
            </div>

            <div className="hero-visual" aria-label="A colourful, nourishing meal prepared with fresh ingredients">
              <div className="image-frame">
                <img
                  src={siteContent.heroImageUrl}
                  alt={siteContent.heroImageAlt}
                  fetchPriority="high"
                />
                <div className="image-shade" />
                <div className="image-caption">
                  <Sparkles size={17} aria-hidden="true" />
                  <span>{siteContent.heroCaption}</span>
                </div>
              </div>
              <div className="price-card">
                <span className="price-label">{siteContent.priceLabel}</span>
                <span className="price-amount">{siteContent.priceAmount}</span>
                <span className="price-caption">{siteContent.priceCaption}</span>
                <span className="price-divider" />
                <span className="price-medical"><FileText size={15} aria-hidden="true" /> {siteContent.medicalNote}</span>
              </div>
              <div className="leaf-stamp" aria-hidden="true"><Leaf size={28} strokeWidth={1.3} /></div>
            </div>
          </div>
          <div className="hero-bottom mx-auto max-w-7xl px-6 lg:px-10">
            <div className="scroll-cue"><span /> A more balanced you starts here</div>
            <span className="hero-coordinate">{siteContent.location}</span>
          </div>
        </section>

        <section id="approach" className="approach-section">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
            <div className="section-heading-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> {siteContent.consultationEyebrow}</div>
                <h2 className="section-heading">{siteContent.consultationTitle}<br /><em>{siteContent.consultationEmphasis}</em></h2>
              </div>
              <p className="section-intro">
                {siteContent.consultationDescription}
              </p>
            </div>
            <div className="feature-grid">
              {siteContent.features.map(({ icon, title, description }, index) => {
                const Icon = FEATURE_ICONS[icon] || Leaf;
                return (
                <article className="feature-card" key={title}>
                  <div className="feature-topline"><span>0{index + 1}</span><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
                );
              })}
            </div>
            <div className="approach-callout">
              <div className="callout-icon"><Leaf size={23} strokeWidth={1.6} aria-hidden="true" /></div>
              <p><strong>{siteContent.calloutTitle}</strong> {siteContent.calloutDescription}</p>
              <button className="text-link" onClick={openBooking}>Let’s get started <ArrowUpRight size={16} aria-hidden="true" /></button>
            </div>
          </div>
        </section>

        <section className="values-section" aria-label="What you can expect">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3 lg:px-10">
            {siteContent.values.map(({ icon, title, detail }) => (
              <ValueItem key={title} icon={VALUE_ICONS[icon] || Leaf} title={title} detail={detail} />
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="site-footer">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.3fr_1fr_1fr] lg:items-center lg:px-10">
          <button className="footer-booking" onClick={openBooking}>
            <span className="footer-calendar"><CalendarDays size={24} strokeWidth={1.5} aria-hidden="true" /></span>
            <span><small>{siteContent.footerPrompt}</small><strong>{siteContent.bookingTitle}</strong></span>
            <ArrowUpRight className="footer-arrow" size={19} aria-hidden="true" />
          </button>
          <div className="footer-contact">
            <a href={`tel:${phoneHref}`}><Phone size={16} aria-hidden="true" /> {siteContent.phone}</a>
            <span><MapPin size={16} aria-hidden="true" /> {siteContent.address}</span>
          </div>
          <div className="footer-brand"><Brand light /><p>{siteContent.footerTagline}</p></div>
        </div>
        <div className="footer-bottom mx-auto max-w-7xl px-6 lg:px-10">
          <span>© {new Date().getFullYear()} Nutrition with Linda</span>
          <span>{siteContent.footerBottomLine}</span>
        </div>
      </footer>

      <a
        className="whatsapp-float"
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(siteContent.whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Linda on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle size={25} strokeWidth={2.1} aria-hidden="true" />
        <span>Chat on WhatsApp</span>
      </a>

      {isModalOpen && <BookingModal content={siteContent} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function ValueItem({ icon: Icon, title, detail }) {
  return (
    <div className="value-item">
      <span className="value-icon"><Icon size={20} strokeWidth={1.7} aria-hidden="true" /></span>
      <span><strong>{title}</strong><small>{detail}</small></span>
    </div>
  );
}

export default App;
