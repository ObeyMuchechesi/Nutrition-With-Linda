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

const features = [
  {
    icon: ClipboardList,
    title: 'Know your numbers',
    description: 'Blood glucose and blood pressure screening, with a clear explanation of what your results mean.',
  },
  {
    icon: Heart,
    title: 'Understand your risk',
    description: 'A thoughtful review of your diabetes and hypertension risk, health history, and everyday habits.',
  },
  {
    icon: Salad,
    title: 'See the whole picture',
    description: 'Body composition insights that put your health goals into context, without quick fixes or judgement.',
  },
  {
    icon: Leaf,
    title: 'Make a plan that fits',
    description: 'Practical nutrition advice for weight loss, weight gain, or finding a healthy balance that lasts.',
  },
];

function Brand({ light = false }) {
  return (
    <a href="#top" className={`brand-mark ${light ? 'brand-mark-light' : ''}`} aria-label="Nutrition with Linda, home">
      <span className="brand-title">NUTRITION</span>
      <span className="brand-subtitle">with Linda <Leaf aria-hidden="true" size={17} /></span>
    </a>
  );
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <div className="eyebrow"><span className="eyebrow-line" /> Personalised nutrition, made practical</div>
              <h1 className="hero-heading">Feel better in your body. <em>For good.</em></h1>
              <p className="hero-description">
                Thoughtful, one-to-one nutrition guidance to help you understand your health and build habits that last.
              </p>
              <div className="hero-actions">
                <button className="button" onClick={openBooking}>
                  Book your consultation <ArrowUpRight size={18} aria-hidden="true" />
                </button>
                <a className="text-link" href="#approach">Explore the experience <ArrowDownRight size={17} aria-hidden="true" /></a>
              </div>
              <div className="hero-note"><span className="note-check"><Check size={13} /></span> Real people. Lasting change.</div>
            </div>

            <div className="hero-visual" aria-label="A colourful, nourishing meal prepared with fresh ingredients">
              <div className="image-frame">
                <img
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=85&w=1400&auto=format&fit=crop"
                  alt="A colourful table of fresh vegetables, grains, and nourishing food"
                  fetchPriority="high"
                />
                <div className="image-shade" />
                <div className="image-caption">
                  <Sparkles size={17} aria-hidden="true" />
                  <span>Small choices. A healthier you.</span>
                </div>
              </div>
              <div className="price-card">
                <span className="price-label">Your first step</span>
                <span className="price-amount">$40</span>
                <span className="price-caption">per consultation</span>
                <span className="price-divider" />
                <span className="price-medical"><FileText size={15} aria-hidden="true" /> Medical aid accepted</span>
              </div>
              <div className="leaf-stamp" aria-hidden="true"><Leaf size={28} strokeWidth={1.3} /></div>
            </div>
          </div>
          <div className="hero-bottom mx-auto max-w-7xl px-6 lg:px-10">
            <div className="scroll-cue"><span /> A more balanced you starts here</div>
            <span className="hero-coordinate">HARARE · ZIMBABWE</span>
          </div>
        </section>

        <section id="approach" className="approach-section">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
            <div className="section-heading-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> Your consultation</div>
                <h2 className="section-heading">A clearer picture.<br /><em>A more confident you.</em></h2>
              </div>
              <p className="section-intro">
                Get to know your health with a supportive, evidence-based consultation designed around you—not a one-size-fits-all plan.
              </p>
            </div>
            <div className="feature-grid">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article className="feature-card" key={title}>
                  <div className="feature-topline"><span>0{index + 1}</span><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <div className="approach-callout">
              <div className="callout-icon"><Leaf size={23} strokeWidth={1.6} aria-hidden="true" /></div>
              <p><strong>No extremes. No guilt.</strong> Just a realistic next step, made together.</p>
              <button className="text-link" onClick={openBooking}>Let’s get started <ArrowUpRight size={16} aria-hidden="true" /></button>
            </div>
          </div>
        </section>

        <section className="values-section" aria-label="What you can expect">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3 lg:px-10">
            <ValueItem icon={Leaf} title="Evidence-based" detail="Guidance grounded in good science." />
            <ValueItem icon={UserRound} title="Personalised" detail="Care shaped around your life and goals." />
            <ValueItem icon={Heart} title="Here for the long run" detail="Support for a healthier future." />
          </div>
        </section>
      </main>

      <footer id="contact" className="site-footer">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.3fr_1fr_1fr] lg:items-center lg:px-10">
          <button className="footer-booking" onClick={openBooking}>
            <span className="footer-calendar"><CalendarDays size={24} strokeWidth={1.5} aria-hidden="true" /></span>
            <span><small>Ready to take the next step?</small><strong>Book your consultation</strong></span>
            <ArrowUpRight className="footer-arrow" size={19} aria-hidden="true" />
          </button>
          <div className="footer-contact">
            <a href="tel:+263784909690"><Phone size={16} aria-hidden="true" /> 078 490 9690</a>
            <span><MapPin size={16} aria-hidden="true" /> 10 Silwood Close, Harare</span>
          </div>
          <div className="footer-brand"><Brand light /><p>NOURISH <i>·</i> BALANCE <i>·</i> THRIVE</p></div>
        </div>
        <div className="footer-bottom mx-auto max-w-7xl px-6 lg:px-10">
          <span>© {new Date().getFullYear()} Nutrition with Linda</span>
          <span>Real people. Lasting change.</span>
        </div>
      </footer>

      <a
        className="whatsapp-float"
        href="https://wa.me/263784909690?text=Hi%20Linda%2C%20I%27d%20like%20to%20ask%20about%20a%20nutrition%20consultation."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Linda on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle size={25} strokeWidth={2.1} aria-hidden="true" />
        <span>Chat on WhatsApp</span>
      </a>

      {isModalOpen && <BookingModal onClose={() => setIsModalOpen(false)} />}
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
