import './StatCard.css';

export default function StatCard({ label, value, hint, variant = 'default' }) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
  );
}
