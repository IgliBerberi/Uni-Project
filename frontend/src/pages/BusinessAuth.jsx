import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

export default function BusinessAuth() {
  const navigate = useNavigate();
  const { signInBusiness, signUpBusiness } = useAuth();

  async function handleLogin(credentials) {
    await signInBusiness(credentials);
    navigate('/dashboard');
  }

  async function handleRegister(payload) {
    await signUpBusiness(payload);
    navigate('/dashboard');
  }

  return (
    <AuthForm
      variant="business"
      title="Business portal"
      subtitle="Manage your products and inventory from the dashboard."
      onLogin={handleLogin}
      onRegister={handleRegister}
      redirectHint={
        <>
          Shopping as a customer? <Link to="/account">Customer login</Link>
        </>
      }
    />
  );
}
