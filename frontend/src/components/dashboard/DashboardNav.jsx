import './DashboardNav.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'inventory', label: 'Inventory', icon: '▤' },
  { id: 'add', label: 'Add product', icon: '+' },
  { id: 'orders', label: 'Orders', icon: '◎' },
];

export default function DashboardNav({ active, onChange }) {
  return (
    <nav className="dashboard-nav" aria-label="Dashboard sections">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`dashboard-nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon" aria-hidden>{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
          {tab.badge && <span className="nav-badge">{tab.badge}</span>}
        </button>
      ))}
    </nav>
  );
}
