import momentumLogo from '../assets/momentum-group-logo.png';

export function Logo({ className = 'logo-image', alt = 'Momentum Group logo' }: { className?: string; alt?: string }) {
  return <img src={momentumLogo} alt={alt} className={className} />;
}
