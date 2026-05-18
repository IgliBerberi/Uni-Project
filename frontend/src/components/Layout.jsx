import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import CartIcon from './CartIcon';
import UserMenu from './UserMenu';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isUserLoggedIn, isBusinessLoggedIn, signOutBusiness, loading } = useAuth();

  const isDashboard = pathname.startsWith('/dashboard');

  async function handleBusinessLogout() {
    await signOutBusiness();
    navigate('/account');
  }

  return (
    <div className="app">
      <header className="header">
        <Link to={isBusinessLoggedIn ? '/dashboard' : '/'} className="logo">
          <span className="logo-mark">◆</span>
          NovaShop
        </Link>
        <nav className="nav">
          {isBusinessLoggedIn ? (
            <>
              <Link to="/dashboard" className={isDashboard ? 'active' : ''}>
                Dashboard
              </Link>
              {!loading && (
                <button
                  type="button"
                  className="btn btn-logout btn-sm"
                  onClick={handleBusinessLogout}
                >
                  Logout
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/" className={pathname === '/' ? 'active' : ''}>
                Store
              </Link>
              {!isUserLoggedIn && (
                <Link
                  to="/business/login"
                  className={pathname.startsWith('/business') ? 'active' : ''}
                >
                  Business
                </Link>
              )}
              <div className="nav-customer-tools">
                <CartIcon />
                {!loading &&
                  (isUserLoggedIn ? (
                    <UserMenu />
                  ) : (
                    <Link
                      to="/account"
                      className={`nav-login ${pathname === '/account' ? 'active' : ''}`}
                    >
                      Customer login
                    </Link>
                  ))}
              </div>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} NovaShop — University E-commerce Project</p>
      </footer>
    </div>
  );
}
