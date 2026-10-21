import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, X } from 'lucide-react';

const initialForm = { name: '', email: '', phone: '', date: '' };

function getToday() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export default function BookingModal({ content, onClose }) {
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const updateField = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Booking request failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close booking form"><X size={21} /></button>
        {status === 'success' ? (
          <div className="booking-success" role="status">
            <span className="success-icon"><Check size={26} /></span>
            <p className="eyebrow">{content.bookingSuccessEyebrow}</p>
            <h2 id="booking-title">{content.bookingSuccessTitle}</h2>
            <p>{content.bookingSuccessCopy}</p>
            <button className="button" onClick={onClose}>Done <ArrowUpRight size={17} /></button>
          </div>
        ) : (
          <>
            <p className="eyebrow"><span className="eyebrow-line" /> {content.bookingEyebrow}</p>
            <h2 id="booking-title">{content.bookingTitle}</h2>
            <p className="modal-intro">{content.bookingIntro}</p>
            <form className="booking-form" onSubmit={handleSubmit}>
              <label>Full name<input autoFocus required name="name" autoComplete="name" maxLength="100" value={formData.name} onChange={updateField} /></label>
              <label>Email address<input required name="email" type="email" autoComplete="email" maxLength="254" value={formData.email} onChange={updateField} /></label>
              <label>Phone number<input required name="phone" type="tel" autoComplete="tel" maxLength="32" value={formData.phone} onChange={updateField} /></label>
              <label>Preferred date<input required name="date" type="date" min={getToday()} value={formData.date} onChange={updateField} /></label>
              <button className="button form-submit" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending request…' : content.bookingSubmitLabel} <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              {status === 'error' && <p className="form-error" role="alert">We couldn’t send your request just now. Please try again, or call {content.phone}.</p>}
            </form>
            <p className="form-footnote">{content.bookingFootnote}</p>
          </>
        )}
      </section>
    </div>
  );
}
