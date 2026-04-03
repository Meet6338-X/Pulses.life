import './globals.css';

export const metadata = {
  title: 'Pulses.life — AI Health Assistant',
  description: 'Voice-First Multilingual AI Health Assistant for India',
  keywords: 'health assistant, AI, Indian languages, medical, hospitals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=general-sans@500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
