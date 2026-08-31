import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>InfraVault</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end>
          Dashboard
        </NavLink>

        <NavLink to="/users">
          Users
        </NavLink>

        <NavLink to="/devices">
          Devices
        </NavLink>

        <NavLink to="/projects">
          Projects
        </NavLink>

        <NavLink to="/profile">
          Profile
        </NavLink>
      </nav>

      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
      >
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;