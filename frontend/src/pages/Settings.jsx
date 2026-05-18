import './AccountPages.css';

export default function Settings() {
  return (
    <section className="account-page">
      <h1>Settings</h1>
      <p className="account-lead">Account preferences will be available here in a future update.</p>
      <ul className="settings-list">
        <li>Email notifications</li>
        <li>Password & security</li>
        <li>Shipping addresses</li>
      </ul>
    </section>
  );
}
