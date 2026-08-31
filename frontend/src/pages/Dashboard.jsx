import { useEffect, useState } from "react";
import api from "../api/axios";

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [projects, setProjects] = useState([]);
  const [devices, setDevices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const projectsResponse = await api.get("/projects/");
      const devicesResponse = await api.get("/devices/");

      setProjects(projectsResponse.data.data);
      setDevices(devicesResponse.data.data);

      try {
        const usersResponse = await api.get("/users/");
        setUsers(usersResponse.data.data);
        setTotalUsers(usersResponse.data.pagination.total);
      } catch (userError) {
        console.log("User summary unavailable for this role.");
        setUsers([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeUsers = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveUsers = users.filter(
    (user) => !user.is_active
  ).length;

  const activeProjects = projects.filter(
    (project) => project.project_status === "Active"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.project_status === "Completed"
  ).length;

  const onHoldProjects = projects.filter(
    (project) => project.project_status === "On Hold"
  ).length;

  const archivedProjects = projects.filter(
    (project) => project.project_status === "Archived"
  ).length;

  const activeDevices = devices.filter(
    (device) => device.device_status === "Active"
  ).length;

  const inactiveDevices =
    devices.length - activeDevices;

  const getProjectStatusClass = (status) => {
    switch (status) {
      case "Active":
        return "status-active";

      case "Completed":
        return "status-completed";

      case "On Hold":
        return "status-on-hold";

      case "Archived":
        return "status-archived";

      default:
        return "status-inactive";
    }
  };

  const getDeviceStatusClass = (status) => {
    return status === "Active"
      ? "status-active"
      : "status-inactive";
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <h1>Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Infrastructure overview</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Summary Cards */}

      <div className="dashboard-cards">

  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <div>
        <h3>Users</h3>
        <div className="dashboard-card-number">
          {totalUsers}
        </div>
      </div>

      <div className="dashboard-card-icon">
        👥
      </div>
    </div>

    <p>Total Users</p>
  </div>


  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <div>
        <h3>Projects</h3>
        <div className="dashboard-card-number">
          {projects.length}
        </div>
      </div>

      <div className="dashboard-card-icon">
        📁
      </div>
    </div>

    <p>Total Projects</p>
  </div>


  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <div>
        <h3>Devices</h3>
        <div className="dashboard-card-number">
          {devices.length}
        </div>
      </div>

      <div className="dashboard-card-icon">
        🖥️
      </div>
    </div>

    <p>Total Devices</p>
  </div>


  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <div>
        <h3>System Status</h3>

        <div className="dashboard-card-status">
          <span className="status-badge status-active">
            ● Healthy
          </span>
        </div>
      </div>

      <div className="dashboard-card-icon">
        ⚡
      </div>
    </div>

    <p>Infrastructure Overview</p>
  </div>

</div>

      {/* Overview Sections */}

      <div className="dashboard-overview">

        {/* Users */}

        <div className="dashboard-section">
  <h2>Users Overview</h2>

  <div className="overview-row">
    <span>Active</span>
    <span className="status-badge status-active">
      {activeUsers}
    </span>
  </div>

  <div className="overview-row">
    <span>Inactive</span>
    <span className="status-badge status-inactive">
      {inactiveUsers}
    </span>
  </div>
</div>

        {/* Projects */}

        <div className="dashboard-section">
  <h2>Projects Overview</h2>

  <div className="overview-row">
    <span>Active</span>
    <span className="status-badge status-active">
      {activeProjects}
    </span>
  </div>

  <div className="overview-row">
    <span>Completed</span>
    <span className="status-badge status-completed">
      {completedProjects}
    </span>
  </div>

  <div className="overview-row">
    <span>On Hold</span>
    <span className="status-badge status-on-hold">
      {onHoldProjects}
    </span>
  </div>

  <div className="overview-row">
    <span>Archived</span>
    <span className="status-badge status-archived">
      {archivedProjects}
    </span>
  </div>
</div>


        {/* Devices */}

        <div className="dashboard-section">
  <h2>Devices Overview</h2>

  <div className="overview-row">
    <span>Active</span>
    <span className="status-badge status-active">
      {activeDevices}
    </span>
  </div>

  <div className="overview-row">
    <span>Inactive / Other</span>
    <span className="status-badge status-inactive">
      {inactiveDevices}
    </span>
  </div>
</div>

      </div>

      {/* Recent Projects */}

      {/* Recent Projects */}

<div className="dashboard-section full-width">
  <h2>Recent Projects</h2>

  {projects.length === 0 ? (
    <p>No projects found.</p>
  ) : (
    <div className="dashboard-list">

      {projects.slice(0, 5).map((project) => (
        <div
          className="dashboard-list-item"
          key={project.id}
        >
          <div>
            <strong>
              {project.project_name}
            </strong>

            <p>
              {project.repo_name}
            </p>
          </div>

          <span
            className={`status-badge ${
              getProjectStatusClass(project.project_status)
            }`}
          >
            {project.project_status}
          </span>
        </div>
      ))}

    </div>
  )}
</div>

      {/* Recent Devices */}

      {/* Recent Devices */}

<div className="dashboard-section full-width">
  <h2>Recent Devices</h2>

  {devices.length === 0 ? (
    <p>No devices found.</p>
  ) : (
    <div className="dashboard-list">

      {devices.slice(0, 5).map((device) => (
        <div
          className="dashboard-list-item"
          key={device.id}
        >
          <div>
            <strong>
              {device.device_name}
            </strong>

            <p>
              {device.host}
            </p>
          </div>

          <span
            className={`status-badge ${
              getDeviceStatusClass(device.device_status)
            }`}
          >
            {device.device_status}
          </span>
        </div>
      ))}

    </div>
  )}
</div>

    </div>
  );
}

export default Dashboard;