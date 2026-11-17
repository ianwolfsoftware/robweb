import { useEffect, useState } from 'react';

type Consent = 'accepted' | 'rejected' | null;
const storageKey = 'robweb-analytics-consent-v1';

function measurementId() { return import.meta.env.VITE_GA_MEASUREMENT_ID || ''; }

function enableGa4() {
  const id = measurementId();
  if (!/^G-[A-Z0-9]+$/.test(id) || document.querySelector(`script[data-robweb-ga="${id}"]`)) return;
  const global = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  global.dataLayer = global.dataLayer ?? [];
  global.gtag = (...args: unknown[]) => global.dataLayer!.push(args);
  global.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  const script = document.createElement('script');
  script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`; script.dataset.robwebGa = id;
  script.addEventListener('load', () => { global.gtag?.('js', new Date()); global.gtag?.('consent', 'update', { analytics_storage: 'granted' }); global.gtag?.('config', id, { send_page_view: false, allow_google_signals: false }); global.gtag?.('event', 'page_view', { page_path: location.pathname, page_title: document.title }); });
  document.head.append(script);
}

function sendFirstPartyVisit() {
  const referrerHost = document.referrer ? new URL(document.referrer).hostname : 'direct';
  const width = window.innerWidth;
  const deviceClass = width < 640 ? 'phone' : width < 1024 ? 'tablet' : 'desktop';
  void fetch('/api/analytics/visit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: location.pathname, referrerHost, deviceClass }), keepalive: true });
}

export function ConsentBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Consent;
    setConsent(saved === 'accepted' || saved === 'rejected' ? saved : null);
    if (saved === 'accepted') { enableGa4(); sendFirstPartyVisit(); }
  }, []);
  const choose = (choice: Exclude<Consent, null>) => {
    localStorage.setItem(storageKey, choice); setConsent(choice); setEditing(false);
    if (choice === 'accepted') { enableGa4(); sendFirstPartyVisit(); }
  };
  return <>{(consent === null || editing) && <section className="consent-banner" aria-label="Analytics choices"><div><b>Your privacy choices</b><p>Essential site features work without analytics. With permission, privacy-limited first-party counts and GA4 help Robin understand which pages are useful. No Google request is made before you accept.</p><a href="/legal/cookies/">Read the cookie notice</a></div><div className="consent-actions"><button className="button button-outline" onClick={() => choose('rejected')}>Reject analytics</button><button className="button" onClick={() => choose('accepted')}>Accept analytics</button></div></section>}<button className="privacy-button" type="button" onClick={() => setEditing(true)}>Privacy preferences</button></>;
}
