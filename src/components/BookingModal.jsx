import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, X } from 'lucide-react';

const initialForm = { name: '', email: '', phone: '', date: '' };

function getToday() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export default function BookingModal({ onClose }) {
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
            <p className="eyebrow">Thank you</p>
            <h2 id="booking-title">Your next step is underway.</h2>
            <p>Your consultation request has been sent. Linda will be in touch shortly to confirm your appointment.</p>
            <button className="button" onClick={onClose}>Done <ArrowUpRight size={17} /></button>
          </div>
        ) : (
          <>
            <p className="eyebrow"><span className="eyebrow-line" /> Let’s get started</p>
            <h2 id="booking-title">Book your consultation</h2>
            <p className="modal-intro">Share a few details and we’ll be in touch to arrange a time that works for you.</p>
            <form className="booking-form" onSubmit={handleSubmit}>
              <label>Full name<input autoFocus required name="name" autoComplete="name" maxLength="100" value={formData.name} onChange={updateField} /></label>
              <label>Email address<input required name="email" type="email" autoComplete="email" maxLength="254" value={formData.email} onChange={updateField} /></label>
              <label>Phone number<input required name="phone" type="tel" autoComplete="tel" maxLength="32" value={formData.phone} onChange={updateField} /></label>
              <label>Preferred date<input required name="date" type="date" min={getToday()} value={formData.date} onChange={updateField} /></label>
              <button className="button form-submit" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending request…' : 'Send booking request'} <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              {status === 'error' && <p className="form-error" role="alert">We couldn’t send your request just now. Please try again, or call 078 490 9690.</p>}
            </form>
            <p className="form-footnote">Consultations are $40. Medical aid accepted.</p>
          </>
        )}
      </section>
    </div>
  );
}
