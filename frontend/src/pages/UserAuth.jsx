import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

export default function UserAuth() {
  const navigate = useNavigate();
  const { signInUser, signUpUser } = useAuth();

  async function handleLogin(credentials) {
    await signInUser(credentials);
    navigate('/');
  }

  async function handleRegister(payload) {
    await signUpUser(payload);
    navigate('/');
  }

  return (
    <AuthForm
      variant="user"
      title="Customer account"
      subtitle="Register or log in to shop on NovaShop."
      onLogin={handleLogin}
      onRegister={handleRegister}
      redirectHint={
        <>
          Business owner? <Link to="/business/login">Business login</Link>
        </>
      }
    />
  );
}
