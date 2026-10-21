import '../src/index.css';
import '../src/admin.css';

export const metadata = {
  title: 'Nutrition with Linda | Personalised Nutrition Consultations',
  description: 'Personalised nutrition consultations with Linda. Evidence-based advice, practical guidance, and support for a healthier future.',
};

export const viewport = {
  themeColor: '#243b2e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
