import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import DashboardLineChart from "../components/DashboardLineChart";
import SummaryCard from "../components/UI/SummaryCard";
import SummaryCards from "../components/UI/SummaryCards";
import PageHeader from "../components/UI/PageHeader";
import DetailDrawer from "../components/UI/DetailDrawer";
import ViewModal from "../components/UI/ViewModal";
import ActionButtons from "../components/UI/ActionButtons";
import UpdateProjectForm from "../components/UI/UpdateProjectForm";
import UpdateDeviceForm from "../components/UI/UpdateDeviceForm";
import ChangeDevicePasswordForm from "../components/UI/ChangeDevicePasswordForm";

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
KeyRound
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

const navigate = useNavigate();

const loggedInUser = JSON.parse(
  localStorage.getItem("user") || "{}"
);

const canManageRecords = [
  "ADMIN",
  "SUPER_ADMIN",
].includes(loggedInUser.role);


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

const [passwordNotifications, setPasswordNotifications] = useState([]);

const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
const [totalProjectDrawerOpen, setTotalProjectDrawerOpen] = useState(false);
const [overdueProjectDrawerOpen, setOverdueProjectDrawerOpen] = useState(false);
const [deviceDrawerOpen, setDeviceDrawerOpen] = useState(false);
const [viewingProject, setViewingProject] = useState(null);
const [viewingDevice, setViewingDevice] = useState(null);
const [updatingProjectId, setUpdatingProjectId] = useState(null);
const [updatingDeviceId, setUpdatingDeviceId] = useState(null);
const [changingPasswordDevice, setChangingPasswordDevice] = useState(null);

const [selectedNotification, setSelectedNotification] = useState(null);

const [currentAssignedUser, setCurrentAssignedUser] = useState(null);
const [projectDevice, setProjectDevice] = useState(null);

const [allUsers, setAllUsers] = useState([]);
const [deviceCategories, setDeviceCategories] = useState([]);

const userNameCounts = allUsers.reduce(
  (counts, user) => {
    const name = user.name?.trim().toLowerCase();

    if (name) {
      counts[name] = (counts[name] || 0) + 1;
    }

    return counts;
  },
  {}
);

const getAssignedUserLabel = (user) => {
  if (!user) {
    return "—";
  }

  const name = user.name?.trim() || "";
  const normalizedName = name.toLowerCase();

  const isDuplicate =
    userNameCounts[normalizedName] > 1;

  return `${name}${
    isDuplicate
      ? ` — ${user.email}`
      : ""
  }${
    user.is_active === false
      ? " (Inactive)"
      : ""
  }`;
};

const handleNotificationClick = (notification) => {
   setSelectedNotification(notification);
};

const handleNotificationViewProject = async (notification) => {
  try {
    setError("");

    const response = await api.get(
      `/projects/${notification.targetId}`
    );

    const project = response.data;

    const assignedUser = allUsers.find(
      (user) =>
        Number(user.id) === Number(project.assigned_to)
    );

    setCurrentAssignedUser(assignedUser || null);
    setViewingProject(project);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
        "Failed to load project details"
    );
  }
};

const handleNotificationUpdateProject = (notification) => {
  setError("");
  setUpdatingProjectId(notification.targetId);
};

const handleCloseUpdateProject = () => {
  setUpdatingProjectId(null);
};

const handleProjectUpdated = async () => {
  setUpdatingProjectId(null);
 
};


const handleNotificationViewDevice = async (notification) => {
  try {
    setError("");

    const deviceId = notification.targetId;

    const response = await api.get(`/devices/${deviceId}`);

    setViewingDevice(response.data);
  } catch (err) {
    console.error(err);
    setError(
      err.response?.data?.detail ||
      "Failed to load device details"
    );
  }
};

const handleNotificationUpdateDevice = (notification) => {
  setError("");
  setUpdatingDeviceId(notification.targetId);
};

const handleCloseUpdateDevice = () => {
  setUpdatingDeviceId(null);
};

const handleDeviceUpdated = () => {
  setUpdatingDeviceId(null);
};

const handleNotificationChangePassword = async (notification) => {
  try {
    setError("");

    const response = await api.get(
      `/devices/${notification.device_id}`
    );

    setChangingPasswordDevice(response.data);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
        "Failed to load device details"
    );
  }
};

const handleCloseChangePassword = () => {
  setChangingPasswordDevice(null);
};

const handleViewDevice = async (deviceId) => {
  try {
    setError("");

    const response = await api.get(`/devices/${deviceId}`);

    setViewingDevice(response.data);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load device details"
    );
  }
};

const closeProjectView = () => {
  setViewingProject(null);
  setCurrentAssignedUser(null);
  setProjectDevice(null);
};

const closeDeviceView = () => {
  setViewingDevice(null);
};

const closeNotificationDetail = () => {
  setSelectedNotification(null);
};

const fetchDeviceCategories = async () => {
  try {
    const response = await api.get("/device-categories/", {
      params: {
        page: 1,
        limit: 1000,
      },
    });

    setDeviceCategories(
      Array.isArray(response.data.data)
        ? response.data.data
        : []
    );
  } catch (err) {
    console.error("Failed to load device categories:", err);
  }
};


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
      usersResponse,
      categoriesResponse,
    ] = await Promise.all([
      api.get("/dashboard/summary"),
      api.get("/projects/?page=1&limit=100"),
      api.get("/devices/?page=1&limit=100"),
      api.get("/users/?page=1&limit=100"),
       api.get("/device-categories/?page=1&limit=1000"),
    ]);

    setSummary(summaryResponse.data);

    setProjects(
      projectsResponse.data.data || []
    );

    setDevices(
      devicesResponse.data.data || []
    );

    setAllUsers(
       usersResponse.data.data || []
    );

    setDeviceCategories(
      Array.isArray(categoriesResponse.data.data)
        ? categoriesResponse.data.data
        : []
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

  try {
  const response = await api.get(
    "/dashboard/device-password-notifications"
  );

  setPasswordNotifications(response.data);
} catch (err) {
  console.error(
    "Failed to load password notifications:",
    err
  );
}

try {
  const response = await api.get(
    "/dashboard/device-password-notifications"
  );

  setPasswordNotifications(response.data);
} catch (err) {
  console.error(
    "Failed to load password notifications:",
    err
  );
}

};







useEffect(() => {
  loadDashboard();
}, []);





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


const projectYearStatusData = useMemo(() => {
  return projectMonthlyData.reduce(
    (totals, month) => {
      totals.pending += Number(month.pending || 0);
      totals.completed += Number(month.completed || 0);
      totals.overdue += Number(month.overdue || 0);

      return totals;
    },
    {
      pending: 0,
      completed: 0,
      overdue: 0,
    }
  );
}, [projectMonthlyData]);

const deviceYearConditionData = useMemo(() => {
  return deviceMonthlyData.reduce(
    (totals, month) => {
      totals.reachable += Number(month.reachable || 0);
      totals.unreachable += Number(month.unreachable || 0);
      totals.switched_off += Number(month.switched_off || 0);
      totals.unused += Number(month.unused || 0);

      return totals;
    },
    {
      reachable: 0,
      unreachable: 0,
      switched_off: 0,
      unused: 0,
    }
  );
}, [deviceMonthlyData]);

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
        targetType: "project",
        targetId: project.id,
        recordName: project.project_name,
        title: "Project overdue",
        description:
          `${project.project_name} has passed its deadline.`,
        icon: AlertTriangle,
        created_at: project.updated_at,
      });

      return;
    }

    // Pending = Medium priority
    if (project.project_status === "Pending") {
      list.push({
        id: `project-pending-${project.id}`,
        type: "Projects",
        targetType: "project",
        targetId: project.id,
        recordName: project.project_name,
        priority: "Medium",
        title: "Project pending",
        description:
          `${project.project_name} is currently pending.`,
        icon: Clock3,
        created_at: project.updated_at,
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
        targetType: "device",
        targetId: device.id,
        recordName: device.device_name,
        priority: "High",
        title: "Device unreachable",
        description:
          `${device.device_name} is currently unreachable.`,
        icon: WifiOff,
        created_at: device.updated_at,
      });

      return;
    }

    // Switched Off = Medium priority
    if (device.device_condition === "Switched Off") {
      list.push({
        id: `device-off-${device.id}`,
        type: "Devices",
        targetType: "device",
        targetId: device.id,
        recordName: device.device_name,
        priority: "Medium",
        title: "Device switched off",
        description:
          `${device.device_name} is switched off.`,
        icon: Power,
        created_at: device.updated_at,
      });

      return;
    }

    // Inactive = Medium priority
    if (device.device_status === "Inactive") {
      list.push({
        id: `device-inactive-${device.id}`,
        type: "Devices",
        targetType: "device",
        targetId: device.id,
        recordName: device.device_name,
        priority: "Medium",
        title: "Device inactive",
        description:
          `${device.device_name} is marked inactive.`,
        icon: WifiOff,
        created_at: device.updated_at,
      });

      return;
    }

    // Unused = Low priority
    if (device.device_condition === "Unused") {
      list.push({
        id: `device-unused-${device.id}`,
        type: "Devices",
        targetType: "device",
        targetId: device.id,
        recordName: device.device_name,
        priority: "Low",
        title: "Unused device",
        description:
          `${device.device_name} is currently unused.`,
        icon: PackageOpen,
        created_at: device.updated_at,
      });
    }
  });

  passwordNotifications.forEach((notification) => {
  list.push({
    ...notification,
    targetType: "device",
    targetId: notification.device_id,
    icon: KeyRound,
    created_at: notification.created_at,
  });
});

  return list;
}, [projects, devices, passwordNotifications]);


/* =========================================================
   FILTER NOTIFICATIONS
========================================================= */

const filteredNotifications = [...notifications]
  .sort((a, b) => {
    return (
      new Date(b.created_at || 0) -
      new Date(a.created_at || 0)
    );
  })
  .filter((notification) => {

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
    onClick={() => setTotalProjectDrawerOpen(true)}
  />

  <SummaryCard
    title="Pending Projects"
    value={summary.projects.pending}
    icon={Clock3}
    variant="warning"
    onClick={() => setProjectDrawerOpen(true)}
  />

  <SummaryCard
    title="Overdue Projects"
    value={summary.projects.overdue}
    icon={AlertTriangle}
    variant="danger"
    onClick={() => setOverdueProjectDrawerOpen(true)}
  />

  <SummaryCard
    title="Total Devices"
    value={summary.devices.total}
    icon={Server}
    variant="info"
    onClick={() => setDeviceDrawerOpen(true)}
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
   
    year={projectYear}
    onYearChange={setProjectYear}
    donutTitle="Project Status"
      donutData={[
        {
          name: "Pending",
          value: projectYearStatusData.pending,
          color: "#f59e0b",
        },
        {
          name: "Completed",
          value: projectYearStatusData.completed,
          color: "#16a34a",
        },
        {
          name: "Overdue",
          value: projectYearStatusData.overdue,
          color: "#dc2626",
        },
      ]}
  />

  {/* DEVICE OVERVIEW */}

  <DashboardLineChart
    title="Device Overview"
    description="Active, inactive and device conditions"
    icon={Server}
    data={deviceMonthlyData}
    lines={deviceLines}
    
    year={deviceYear}
    onYearChange={setDeviceYear}
    donutTitle="Device Condition"
    donutData={[
      {
        name: "Reachable",
        value: deviceYearConditionData.reachable,
        color: "#16a34a",
      },
      {
        name: "Unreachable",
        value: deviceYearConditionData.unreachable,
        color: "#dc2626",
      },
      {
        name: "Switched Off",
        value: deviceYearConditionData.switched_off,
        color: "#f59e0b",
      },
      {
        name: "Unused",
        value: deviceYearConditionData.unused,
        color: "#8b5cf6",
      },
    ]}
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
                    onClick={() => handleNotificationClick(notification)}
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

      <DetailDrawer
        open={totalProjectDrawerOpen}
        title="Total Projects"
        subtitle="All projects currently in the system"
        onClose={() => setTotalProjectDrawerOpen(false)}
        headerBackground="#f8fafc"
        footer={
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setTotalProjectDrawerOpen(false);
              navigate("/projects?dashboard=true");
            }}
          >
            View in Projects
          </button>
        }
      >
        {projects.length === 0 ? (
          <div className="dashboard-drawer-empty">
            No projects found.
          </div>
        ) : (
          projects.map((project) => {
            const assignedUser = allUsers.find(
              (user) => Number(user.id) === Number(project.assigned_to)
            );

            return (
              <div key={project.id} className="dashboard-drawer-record">
                <div className="dashboard-drawer-record-info">
                  <strong style={{color:"#2563eb"}}>
                    {project.project_name || "Unnamed Project"}</strong>
                  <span>
                    Assigned To - {getAssignedUserLabel(assignedUser)}
                  </span>
                  <span>
                    Status - {project.project_status || "—"}
                  </span>
                  <span>
                    Deadline - {project.deadline ? String(project.deadline).slice(0, 10) : "No deadline"}
                  </span>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setCurrentAssignedUser(assignedUser || null);
                    setViewingProject(project);
                  }}
                >
                  View
                </button>
              </div>
            );
          })
        )}
      </DetailDrawer>

      <DetailDrawer
        open={projectDrawerOpen}
        title="Pending Projects"
        subtitle="Projects currently in pending status"
        onClose={() => setProjectDrawerOpen(false)}
        headerBackground="#fff7ed"
        footer={
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setProjectDrawerOpen(false);
              // navigation will be added in the next step
              navigate(
                "/projects?status=Pending&dashboard=true"
              );
            }}
          >
            View in Projects
          </button>
        }
      >
        {(() => {
          const pendingProjects = projects.filter(
            (project) =>
              project.project_status === "Pending"
          );

          if (pendingProjects.length === 0) {
            return (
              <div className="dashboard-drawer-empty">
                No pending projects found.
              </div>
            );
          }

          return pendingProjects.map((project) => (
            <div
              key={project.id}
              className="dashboard-drawer-record"
            >
              <div className="dashboard-drawer-record-info">
                <strong style={{ color: "#f59e0b" }}>
                  {project.project_name || "Unnamed Project"}
                </strong>
                    <span>
                    Assigned To -{" "}
                    {(() => {
                      const assignedUser = allUsers.find(
                        (user) =>
                          Number(user.id) ===
                          Number(project.assigned_to)
                      );

                      return getAssignedUserLabel(
                        assignedUser
                      );
                    })()}
                  </span>
                                  <span>
                  Deadline -{" "}
                  {project.deadline
                    ? String(project.deadline).slice(0, 10)
                    : "No deadline"}
                </span>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const assignedUser = allUsers.find(
                    (user) =>
                      Number(user.id) ===
                      Number(project.assigned_to)
                  );

                  setCurrentAssignedUser(
                    assignedUser || null
                  );

                  setViewingProject(project);
                }}
              >
                View
              </button>
            </div>
          ));
        })()}
      </DetailDrawer>

      <DetailDrawer
        open={overdueProjectDrawerOpen}
        title="Overdue Projects"
        subtitle="Projects currently in overdue status"
        onClose={() => setOverdueProjectDrawerOpen(false)}
        headerBackground="#fef2f2"
        footer={
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setOverdueProjectDrawerOpen(false);
              navigate("/projects?status=Overdue&dashboard=true");
            }}
          >
            View in Projects
          </button>
        }
      >
        {(() => {
          const overdueProjects = projects.filter(
            (project) => project.project_status === "Overdue"
          );

          if (overdueProjects.length === 0) {
            return (
              <div className="dashboard-drawer-empty">
                No overdue projects found.
              </div>
            );
          }

          return overdueProjects.map((project) => {
            const assignedUser = allUsers.find(
              (user) => Number(user.id) === Number(project.assigned_to)
            );

            return (
              <div key={project.id} className="dashboard-drawer-record">
                <div className="dashboard-drawer-record-info">
                  <strong style={{ color: "#dc2626" }}>
                    {project.project_name || "Unnamed Project"}
                  </strong>
                  <span>
                    Assigned To - {getAssignedUserLabel(assignedUser)}
                  </span>
                  <span>
                    Deadline - {project.deadline ? String(project.deadline).slice(0, 10) : "No deadline"}
                  </span>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setCurrentAssignedUser(assignedUser || null);
                    setViewingProject(project);
                  }}
                >
                  View
                </button>
              </div>
            );
          });
        })()}
      </DetailDrawer>

      <DetailDrawer
        open={deviceDrawerOpen}
        title="Total Devices"
        subtitle="All infrastructure devices currently in the system"
        onClose={() => setDeviceDrawerOpen(false)}
        headerBackground="#eff6ff"
        footer={
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setDeviceDrawerOpen(false);
              navigate("/devices?dashboard=true");
            }}
          >
            View in Devices
          </button>
        }
      >
        {devices.length === 0 ? (
          <div className="dashboard-drawer-empty">
            No devices found.
          </div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="dashboard-drawer-record">
              <div className="dashboard-drawer-record-info">
                <strong style={{color:" #2563eb" }}>
                  {device.device_name || "Unnamed Device"}</strong>
                <span>Host - {device.host || "—"}</span>
                <span>Status - {device.device_status || "—"}</span>
                <span>Device Status - {device.device_condition || "—"}</span>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => handleViewDevice(device.id)}
              >
                View
              </button>
            </div>
          ))
        )}
      </DetailDrawer>
      
      {viewingProject && (
        <ViewModal
          className={selectedNotification ? "notification-record-modal" : ""}
          open={!!viewingProject}
          title="Project Details"
          subtitle="View project information"
          onClose={closeProjectView}
          style={{ zIndex: 1100 }}
          footer={
            <button
              type="button"
              className="secondary-button"
              onClick={closeProjectView}
            >
              Close
            </button>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label>ID</label>
              <div className="view-value">
                {viewingProject.id ?? "—"}
              </div>
            </div>

            <div className="form-group">
              <label>Project Name</label>
              <div className="view-value">
                {viewingProject.project_name || "—"}
              </div>
            </div>

            <div className="form-group">
              <label>Repository</label>
              <div className="view-value">
                {viewingProject.repo_name || "—"}
              </div>
            </div>

            <div className="form-group">
              <label>Assigned To</label>
              <div className="view-value">
                {getAssignedUserLabel(currentAssignedUser)}
              </div>
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <div className="view-value">
                {viewingProject.start_date
                  ? String(viewingProject.start_date).slice(0, 10)
                  : "—"}
              </div>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <div className="view-value">
                {viewingProject.deadline
                  ? String(viewingProject.deadline).slice(0, 10)
                  : "—"}
              </div>
            </div>

            <div className="form-group">
            <label>Device</label>
            <div className="view-value">
              {(() => {
                const device = devices.find(
                  (item) =>
                    Number(item.id) ===
                    Number(viewingProject.device_master_id)
                );

                return device
                  ? `${device.device_name} - ${device.host}`
                  : "—";
              })()}
            </div>
          </div>

            <div className="form-group">
              <label>Status</label>
              <div className="view-value">
                {viewingProject.project_status || "—"}
              </div>
            </div>

            <div className="form-group">
              <label>Project Path</label>
              <div className="view-value">
                {viewingProject.project_path || "—"}
              </div>
            </div>

            <div className="form-group">
              <label>Deployment Script Path</label>
              <div className="view-value">
                {viewingProject.deployment_script_path || "—"}
              </div>
            </div>

            <div className="form-group">
              <label>Tech Stack</label>
              <div className="view-value">
                {viewingProject.tech_stack || "—"}
              </div>
            </div>

            <div className="form-group full-width">
              <label>Comments</label>
              <div className="view-value multiline">
                {viewingProject.comments || "—"}
              </div>
            </div>
          </div>
        </ViewModal>
      )}



      {updatingProjectId && (
        <UpdateProjectForm
          projectId={updatingProjectId}
          onClose={handleCloseUpdateProject}
          onUpdated={handleProjectUpdated}
        />
      )}

      {updatingDeviceId && (
        <UpdateDeviceForm
          deviceId={updatingDeviceId}
          onClose={handleCloseUpdateDevice}
          onUpdated={handleDeviceUpdated}
        />
      )}


      {changingPasswordDevice && (
        <ChangeDevicePasswordForm
          device={changingPasswordDevice}
          onClose={handleCloseChangePassword}
          onChanged={async () => {
            setChangingPasswordDevice(null);
            await loadDashboard();
          }}
        />
      )}



      {viewingDevice && (
        <ViewModal
         className={selectedNotification ? "notification-record-modal" : ""}
          open={!!viewingDevice}
          title="Device Details"
          subtitle="View device information"
          onClose={closeDeviceView}
          footer={
            <button
              type="button"
              className="secondary-button"
              onClick={closeDeviceView}
            >
              Close
            </button>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label>ID</label>
              <div className="view-value">{viewingDevice.id ?? "—"}</div>
            </div>
            <div className="form-group">
              <label>Device Name</label>
              <div className="view-value">{viewingDevice.device_name || "—"}</div>
            </div>
            <div className="form-group">
              <label>Host</label>
              <div className="view-value">{viewingDevice.host || "—"}</div>
            </div>
            <div className="form-group">
              <label>Port</label>
              <div className="view-value">{viewingDevice.port ?? "—"}</div>
            </div>
            <div className="form-group">
              <label>Connection Type</label>
              <div className="view-value">{viewingDevice.connection_type || "—"}</div>
            </div>
            <div className="form-group">
              <label>Username</label>
              <div className="view-value">{viewingDevice.username || "—"}</div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="view-value">{viewingDevice.password || "—"}</div>
            </div>
            <div className="form-group">
            <label>Device Category</label>
            <div className="view-value">
              {deviceCategories.find(
                (category) =>
                  String(category.id) ===
                  String(viewingDevice.device_category_id)
              )?.category_name || "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Password Rotation Days</label>
            <div className="view-value">
              {viewingDevice.password_rotation_days
                ? `${viewingDevice.password_rotation_days} Days`
                : `${
                    deviceCategories.find(
                      (category) =>
                        String(category.id) ===
                        String(viewingDevice.device_category_id)
                    )?.default_rotation_days ?? "—"
                  } Days`}
            </div>
          </div>
            <div className="form-group">
              <label>Status</label>
              <div className="view-value">{viewingDevice.device_status || "—"}</div>
            </div>
            <div className="form-group">
              <label>Device Status</label>
              <div className="view-value">{viewingDevice.device_condition || "—"}</div>
            </div>
            <div className="form-group full-width">
              <label>Comments</label>
              <div className="view-value multiline">{viewingDevice.comments || "—"}</div>
            </div>
          </div>
        </ViewModal>
      )}







{selectedNotification && (
  
  <div
    className = "notification-layout"
  >

  <div className="notification-overlay">
    <div className="notification-detail-card">

      {/* Header */}
      <div className="notification-detail-header">
        <div className="notification-detail-heading">
          <div className="notification-detail-icon">
            !
          </div>

          <div>
            <span className="notification-eyebrow">
              INFRAVAULT ALERT
            </span>
            <h2>Notification Details</h2>
          </div>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={closeNotificationDetail}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {/* Priority and notification type */}
      <div className="notification-detail-content">

        <div className="notification-detail-meta">
          <span
            className={`notification-priority ${
              selectedNotification.priority?.toLowerCase()
            }`}
          >
            {selectedNotification.priority || "Notification"}
          </span>

          <span className="notification-detail-type">
            {selectedNotification.type}
          </span>
        </div>

        {/* Title */}
        <div className="notification-detail-section">
          <span className="notification-field-label">
            NOTIFICATION
          </span>

          <h3 className="notification-detail-title">
            {selectedNotification.title || "Notification"}
          </h3>
        </div>

        {/* Description */}
        <div className="notification-detail-section">
          <span className="notification-field-label">
            DESCRIPTION
          </span>

          <p className="notification-detail-description">
            {selectedNotification.description || "No description available."}
          </p>
        </div>

        {/* Related record */}
        {(selectedNotification.targetType === "project" ||
          selectedNotification.targetType === "device") && (
          <div className="notification-related-record">
            <span className="notification-field-label">
              RELATED RECORD
            </span>

            <div className="notification-related-content">
              <div className="notification-related-icon">
                {selectedNotification.targetType === "project"
                  ? "P"
                  : "D"}
              </div>

              <div className="notification-related-info">
                <strong>
                  {selectedNotification.recordName ||
                    selectedNotification.description?.split(" — ")[0]}
                </strong>

                <span>
                  ID: {selectedNotification.targetId ?? "—"}
                </span>
              </div>

          <ActionButtons
              onView={() => {
                if (selectedNotification.targetType === "project") {
                  handleNotificationViewProject(selectedNotification);
                } else {
                  handleNotificationViewDevice(selectedNotification);
                }
              }}
              onEdit={
                canManageRecords &&
                selectedNotification.targetType === "project"
                  ? () => handleNotificationUpdateProject(selectedNotification)
                  : canManageRecords &&
                    selectedNotification.targetType === "device" &&
                    !selectedNotification.id?.startsWith("device-password-")
                  ? () => handleNotificationUpdateDevice(selectedNotification)
                  : undefined
              }
              onChangePassword={
                canManageRecords &&
                selectedNotification.targetType === "device" &&
                selectedNotification.id?.startsWith("device-password-")
                  ? () => handleNotificationChangePassword(selectedNotification)
                  : undefined
              }
            />

            </div>
          </div>
        )}

      </div>

      {/* Actions */}
      <div className="notification-detail-footer">


        <button
          type="button"
          className="secondary-button"
          onClick={closeNotificationDetail}
        >
          Close
        </button>

      </div>

    </div>
  </div>
  </div>
)}




    </div>
  );
}

export default Dashboard;