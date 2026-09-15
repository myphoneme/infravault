import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import DashboardLineChart from "../components/DashboardLineChart";
import SummaryCard from "../components/UI/SummaryCard";
import SummaryCards from "../components/UI/SummaryCards";
import PageHeader from "../components/UI/PageHeader";

import {
AlertTriangle,
Bell,
CheckCircle,
Clock3,
Folder,
FolderKanban,
PackageOpen,
Power,
Server,
Wifi,
WifiOff,
Search,
} from "lucide-react";



function Dashboard() {
const [summary, setSummary] = useState({
projects: {
total: 0,
pending: 0,
completed: 0,
overdue: 0,
},

devices: {
  total: 0,
  active: 0,
  inactive: 0,
  reachable: 0,
  unreachable: 0,
  switched_off: 0,
  unused: 0,
},

});

const [projects, setProjects] = useState([]);
const [devices, setDevices] = useState([]);


const [notificationFilter, setNotificationFilter] =
useState("All");

const [priorityFilter, setPriorityFilter] =
useState("All");

const[notificationSearch, setNotificationSearch]= useState("");

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const currentYear = new Date().getFullYear();

const [projectYear, setProjectYear] = useState(currentYear);
const [deviceYear, setDeviceYear] = useState(currentYear);

const [projectMonthlyData, setProjectMonthlyData] = useState([]);
const [deviceMonthlyData, setDeviceMonthlyData] = useState([]);


/* =========================================================
   LOAD DASHBOARD
========================================================= */

const loadDashboard = async () => {
  try {
    setLoading(true);
    setError("");

    const [
      summaryResponse,
      projectsResponse,
      devicesResponse,
    ] = await Promise.all([
      api.get("/dashboard/summary"),
      api.get("/projects/?page=1&limit=100"),
      api.get("/devices/?page=1&limit=100"),
    ]);

    setSummary(summaryResponse.data);

    setProjects(
      projectsResponse.data.data || []
    );

    setDevices(
      devicesResponse.data.data || []
    );

  } catch (err) {
    console.error(err);

    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      setError(
        detail.map((item) => item.msg).join(", ")
      );
    } else {
      setError(
        detail || "Failed to load dashboard data"
      );
    }

  } finally {
    setLoading(false);
  }
};






useEffect(() => {
  loadDashboard();
}, []);

useEffect(() => {
  const loadProjectMonthlyData = async () => {
    try {
      const response = await api.get(
        `/dashboard/project-monthly?year=${projectYear}`
      );

      setProjectMonthlyData(response.data.months || []);
    } catch (err) {
      console.error("Project monthly data error:", err);
    }
  };

  loadProjectMonthlyData();
}, [projectYear]);


useEffect(() => {
  const loadDeviceMonthlyData = async () => {
    try {
      const response = await api.get(
        `/dashboard/device-monthly?year=${deviceYear}`
      );

      setDeviceMonthlyData(response.data.months || []);
    } catch (err) {
      console.error("Device monthly data error:", err);
    }
  };

  loadDeviceMonthlyData();
}, [deviceYear]);

/* =========================================================
   LOAD PROJECT MONTHLY DATA
========================================================= */

useEffect(() => {
  const loadProjectMonthlyData = async () => {
    try {
      const response = await api.get(
        `/dashboard/project-monthly?year=${projectYear}`
      );

      setProjectMonthlyData(
        response.data.months || []
      );

    } catch (err) {
      console.error("Project monthly data error:", err);
    }
  };

  loadProjectMonthlyData();
}, [projectYear]);


/* =========================================================
   LOAD DEVICE MONTHLY DATA
========================================================= */

useEffect(() => {
  const loadDeviceMonthlyData = async () => {
    try {
      const response = await api.get(
        `/dashboard/device-monthly?year=${deviceYear}`
      );

      setDeviceMonthlyData(
        response.data.months || []
      );

    } catch (err) {
      console.error("Device monthly data error:", err);
    }
  };

  loadDeviceMonthlyData();
}, [deviceYear]);


/* =========================================================
   NOTIFICATIONS
========================================================= */

const notifications = useMemo(() => {
  const list = [];

  /*
   * Project notifications
   */

  projects.forEach((project) => {
    // Completed projects do not need a notification
    if (project.project_status === "Completed") {
      return;
    }

    // Overdue = High priority
    if (project.project_status === "Overdue") {
      list.push({
        id: `project-overdue-${project.id}`,
        type: "Projects",
        priority: "High",
        title: "Project overdue",
        description:
          `${project.project_name} has passed its deadline.`,
        icon: AlertTriangle,
      });

      return;
    }

    // Pending = Medium priority
    if (project.project_status === "Pending") {
      list.push({
        id: `project-pending-${project.id}`,
        type: "Projects",
        priority: "Medium",
        title: "Project pending",
        description:
          `${project.project_name} is currently pending.`,
        icon: Clock3,
      });
    }
  });


  /*
   * Device notifications
   *
   * Only one notification is generated per device.
   * Higher-priority conditions are checked first.
   */

  devices.forEach((device) => {
    // Unreachable = High priority
    if (device.device_condition === "Unreachable") {
      list.push({
        id: `device-unreachable-${device.id}`,
        type: "Devices",
        priority: "High",
        title: "Device unreachable",
        description:
          `${device.device_name} is currently unreachable.`,
        icon: WifiOff,
      });

      return;
    }

    // Switched Off = Medium priority
    if (device.device_condition === "Switched Off") {
      list.push({
        id: `device-off-${device.id}`,
        type: "Devices",
        priority: "Medium",
        title: "Device switched off",
        description:
          `${device.device_name} is switched off.`,
        icon: Power,
      });

      return;
    }

    // Inactive = Medium priority
    if (device.device_status === "Inactive") {
      list.push({
        id: `device-inactive-${device.id}`,
        type: "Devices",
        priority: "Medium",
        title: "Device inactive",
        description:
          `${device.device_name} is marked inactive.`,
        icon: WifiOff,
      });

      return;
    }

    // Unused = Low priority
    if (device.device_condition === "Unused") {
      list.push({
        id: `device-unused-${device.id}`,
        type: "Devices",
        priority: "Low",
        title: "Unused device",
        description:
          `${device.device_name} is currently unused.`,
        icon: PackageOpen,
      });
    }
  });

  return list;
}, [projects, devices]);


/* =========================================================
   FILTER NOTIFICATIONS
========================================================= */

const filteredNotifications =
  notifications.filter((notification) => {

    const typeMatches =
      notificationFilter === "All" ||
      notification.type === notificationFilter;


    const priorityMatches =
      priorityFilter === "All" ||
      notification.priority === priorityFilter;


    const searchText =
      notificationSearch.trim().toLowerCase();


    const searchMatches =
      !searchText ||
      notification.title
        .toLowerCase()
        .includes(searchText) ||
      notification.description
        .toLowerCase()
        .includes(searchText);


    return (
      typeMatches &&
      priorityMatches &&
      searchMatches
    );

  });


/* =========================================================
   PRIORITY CLASS
========================================================= */

const getPriorityClass = (priority) => {

  switch (priority) {

    case "High":
      return "notification-priority-high";

    case "Medium":
      return "notification-priority-medium";

    case "Low":
      return "notification-priority-low";

    default:
      return "";

  }

};



/* =========================================================
LOADING
========================================================= */

if (loading) {
return (
<div className="page-container">

    <PageHeader
      title="Dashboard"
      description="Infrastructure overview"
   />

    <div className="dashboard-loading">
      Loading dashboard...
    </div>

  </div>
);

}

const projectLines = [
  {
    dataKey: "pending",
    name: "Pending",
    color: "#f59e0b",
  },
  {
    dataKey: "completed",
    name: "Completed",
    color: "#16a34a",
  },
  {
    dataKey: "overdue",
    name: "Overdue",
    color: "#dc2626",
  },
];

const deviceLines = [
  {
    dataKey: "active",
    name: "Active",
    color: "#2563eb",
  },
  {
    dataKey: "inactive",
    name: "Inactive",
    color: "#6b7280",
  },
  {
    dataKey: "reachable",
    name: "Reachable",
    color: "#16a34a",
  },
  {
    dataKey: "unreachable",
    name: "Unreachable",
    color: "#dc2626",
  },
  {
    dataKey: "switched_off",
    name: "Switched Off",
    color: "#f59e0b",
  },
  {
    dataKey: "unused",
    name: "Unused",
    color: "#8b5cf6",
  },
];



/* =========================================================
DASHBOARD
========================================================= */

return (
<div className="page-container">

  {/* =====================================================
      PAGE HEADER
  ===================================================== */}

  <PageHeader
    title="Dashboard"
    description="Infrastructure overview"
  />


  {error && (
    <div className="error-message">
      {error}
    </div>
  )}


  {/* =====================================================
    SUMMARY CARDS
===================================================== */}

<SummaryCards>
  <SummaryCard
    title="Total Projects"
    value={summary.projects.total}
    icon={FolderKanban}
    variant="primary"
  />

  <SummaryCard
    title="Pending Projects"
    value={summary.projects.pending}
    icon={Clock3}
    variant="warning"
  />

  <SummaryCard
    title="Overdue Projects"
    value={summary.projects.overdue}
    icon={AlertTriangle}
    variant="danger"
  />

  <SummaryCard
    title="Total Devices"
    value={summary.devices.total}
    icon={Server}
    variant="info"
  />
</SummaryCards>



 {/* =====================================================
    PROJECT + DEVICE OVERVIEW
===================================================== */}

<div className="dashboard-chart-grid">

  {/* PROJECT OVERVIEW */}

  <DashboardLineChart
    title="Project Overview"
    description="Pending, completed and overdue projects"
    icon={Folder}
    data={projectMonthlyData}
    lines={projectLines}
    metrics={[
      {
        label: "Pending",
        value: summary.projects.pending,
        className: "dashboard-metric-pending",
      },
      {
        label: "Completed",
        value: summary.projects.completed,
        className: "dashboard-metric-completed",
      },
      {
        label: "Overdue",
        value: summary.projects.overdue,
        className: "dashboard-metric-overdue",
      },
    ]}
    year={projectYear}
    onYearChange={setProjectYear}
  />

  {/* DEVICE OVERVIEW */}

  <DashboardLineChart
    title="Device Overview"
    description="Active, inactive and device conditions"
    icon={Server}
    data={deviceMonthlyData}
    lines={deviceLines}
    metrics={[
      {
        label: "Active",
        value: summary.devices.active,
        className: "dashboard-metric-active",
      },
      {
        label: "Inactive",
        value: summary.devices.inactive,
        className: "dashboard-metric-inactive",
      },
      {
        label: "Reachable",
        value: summary.devices.reachable,
        className: "dashboard-metric-reachable",
      },
      {
        label: "Unreachable",
        value: summary.devices.unreachable,
        className: "dashboard-metric-unreachable",
      },
      {
        label: "Switched Off",
        value: summary.devices.switched_off,
        className: "dashboard-metric-switched-off",
      },
      {
        label: "Unused",
        value: summary.devices.unused,
        className: "dashboard-metric-unused",
      },
    ]}
    year={deviceYear}
    onYearChange={setDeviceYear}
  />

</div>

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <div className="dashboard-section full-width">

        <div className="dashboard-section-header">

          <div>
            <h2>Notifications</h2>

            <p>
              Important project and device updates
            </p>
          </div>

          <Bell
            size={24}
            strokeWidth={1.8}
          />

        </div>


      {/* Notification Filters */}

<div className="dashboard-notification-toolbar">

  {/* TYPE FILTER */}

  <div className="dashboard-notification-type-filter">

    <button
      type="button"
      className={
        notificationFilter === "All"
          ? "dashboard-notification-tab active"
          : "dashboard-notification-tab"
      }
      onClick={() =>
        setNotificationFilter("All")
      }
    >
      All
    </button>

    <button
      type="button"
      className={
        notificationFilter === "Projects"
          ? "dashboard-notification-tab active"
          : "dashboard-notification-tab"
      }
      onClick={() =>
        setNotificationFilter("Projects")
      }
    >
      Projects
    </button>

    <button
      type="button"
      className={
        notificationFilter === "Devices"
          ? "dashboard-notification-tab active"
          : "dashboard-notification-tab"
      }
      onClick={() =>
        setNotificationFilter("Devices")
      }
    >
      Devices
    </button>

  </div>


  {/* SEARCH */}

  <div className="dashboard-notification-search">

    <Search
      size={17}
      strokeWidth={1.8}
    />

    <input
      type="text"
      placeholder="Search notifications..."
      value={notificationSearch}
      onChange={(e) =>
        setNotificationSearch(e.target.value)
      }
    />

  </div>


  {/* PRIORITY */}

  <div className="dashboard-notification-priority-filter">

    <button
      type="button"
      className={
        priorityFilter === "All"
          ? "dashboard-notification-priority-button active"
          : "dashboard-notification-priority-button"
      }
      onClick={() =>
        setPriorityFilter("All")
      }
    >
      All Priority
    </button>

    <button
      type="button"
      className={
        priorityFilter === "High"
          ? "dashboard-notification-priority-button active"
          : "dashboard-notification-priority-button"
      }
      onClick={() =>
        setPriorityFilter("High")
      }
    >
      High
    </button>

    <button
      type="button"
      className={
        priorityFilter === "Medium"
          ? "dashboard-notification-priority-button active"
          : "dashboard-notification-priority-button"
      }
      onClick={() =>
        setPriorityFilter("Medium")
      }
    >
      Medium
    </button>

    <button
      type="button"
      className={
        priorityFilter === "Low"
          ? "dashboard-notification-priority-button active"
          : "dashboard-notification-priority-button"
      }
      onClick={() =>
        setPriorityFilter("Low")
      }
    >
      Low
    </button>

  </div>

</div> 

        {/* Notification List */}

        {filteredNotifications.length === 0 ? (

          <div className="dashboard-empty-state">

            <Bell
              size={40}
              strokeWidth={1.5}
            />

            <h3>No notifications</h3>

            <p>
              There are no notifications matching
              the selected filters.
            </p>

          </div>

        ) : (

          <div className="dashboard-notification-list">

            {filteredNotifications.map(
              (notification) => {

                const NotificationIcon =
                  notification.icon;

                return (
                  <div
                    className="dashboard-notification-item"
                    key={notification.id}
                  >

                    <div className="dashboard-notification-icon">
                      <NotificationIcon
                        size={22}
                        strokeWidth={1.8}
                      />
                    </div>


                    <div className="dashboard-notification-content">

                      <strong>
                        {notification.title}
                      </strong>

                      <p>
                        {notification.description}
                      </p>

                    </div>


                    <span
                      className={`dashboard-notification-priority ${getPriorityClass(
                        notification.priority
                      )}`}
                    >
                      {notification.priority}
                    </span>

                  </div>
                );

              }
            )}

          </div>

        )}

      </div>


      


    </div>
  );
}

export default Dashboard;