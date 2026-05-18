import { useAuth } from '../context/AuthContext';
import './AccountPages.css';

export default function Profile() {
  const { user } = useAuth();

  return (
    <section className="account-page">
      <h1>Profile</h1>
      <p className="account-lead">Your customer account details.</p>
      <dl className="profile-details">
        <div>
          <dt>Name</dt>
          <dd>{user?.full_name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>
        {user?.created_at && (
          <div>
            <dt>Member since</dt>
            <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
