import { NavLink, useNavigate } from "react-router-dom";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h5l2 2h6A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M18 14.5c1.8.8 3 2.6 3 4.5" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.8-3.6 3.5-5.8 7.5-5.8s6.7 2.2 7.5 5.8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
      <path d="M14 8l4 4-4 4M8 12h10" />
    </svg>
  );
}

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">

      {/* Brand */}
      <div className="sidebar-logo">
        <h2>
          Infra<span>Vault</span>
        </h2>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">

        <NavLink to="/" end>
          <DashboardIcon />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/projects">
          <ProjectsIcon />
          <span>Projects</span>
        </NavLink>

        <NavLink to="/devices">
          <DevicesIcon />
          <span>Devices</span>
        </NavLink>

        <NavLink to="/users">
          <UsersIcon />
          <span>Users</span>
        </NavLink>

      </nav>

      {/* Bottom Navigation */}
      <div className="sidebar-bottom">

        <NavLink to="/profile" className="sidebar-profile-link">
  
          <ProfileIcon />
          <span>Profile</span>
        </NavLink>
        

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;