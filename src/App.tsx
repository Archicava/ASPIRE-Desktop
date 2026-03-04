import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';

import { useAuth } from './components/AuthContext';
import aspireLogo from '../img/AspireLogo.svg';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CasesPage } from './pages/CasesPage';
import { LoginPage } from './pages/LoginPage';
import { PredictivePage } from './pages/PredictivePage';
import { ResearchPage } from './pages/ResearchPage';
import { WorkspacePage } from './pages/WorkspacePage';

const navItems = [
  { to: '/workspace', label: 'Workspace' },
  { to: '/cases', label: 'Case Library' },
  { to: '/predict', label: 'Predictive Lab' },
  { to: '/research', label: 'Research' },
  { to: '/account', label: 'Account' }
];

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="login-shell">
        <section className="panel login-card">
          <h1>Connecting to ASPIRE...</h1>
          <p className="login-copy">
            Restoring your desktop session and syncing with the web platform.
          </p>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function AppShell() {
  const { user, logout, webAppBaseUrl } = useAuth();
  const items = user?.role === 'admin' ? [...navItems, { to: '/admin', label: 'Admin' }] : navItems;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src={aspireLogo} alt="Aspire Lab logo" />
          <p className="brand-mark">ASPIRE LAB</p>
          <p className="brand-sub">Desktop Platform</p>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-item active' : 'nav-item'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="logout-btn"
          onClick={() => {
            void logout();
          }}
        >
          Sign out {user?.displayName ? `(${user.displayName})` : ''}
        </button>

        <div className="sidebar-footer">
          <p>Web API {webAppBaseUrl ?? '-'}</p>
          <p>Electron {window.aspireDesktop?.versions?.electron ?? '-'}</p>
          <p>Platform {window.aspireDesktop?.platform ?? '-'}</p>
        </div>
      </aside>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/workspace" replace />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:caseId" element={<CaseDetailPage />} />
          <Route path="/predict" element={<PredictivePage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/workspace" replace />} />
    </Routes>
  );
}
