import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import ProjectList from "./Projects/ProjectList";
import ProjectForm from "./Projects/ProjectForm";

function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
});

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [saving, setSaving] = useState(false);
const [showForm, setShowForm] = useState(false);
const [editingProject, setEditingProject] = useState(null);

const [devices, setDevices] = useState([]);

const [formData, setFormData] = useState({
  project_name: "",
  repo_name: "",
  start_date: "",
  deadline: "",
  assigned_to: "",
  comments: "",
  device_master_id: "",
  project_path: "",
  deployment_script_path: "",
  tech_stack: "",
  project_status: "Active",
});

  useEffect(() => {
    fetchProjects();
    fetchDevices();
  }, []);

  const fetchProjects = async (
  page = 1,
  searchValue = search,
  statusValue = statusFilter
) => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/projects/", {
      params: {
        page,
        limit: 20,
        search: searchValue || undefined,
        project_status: statusValue || undefined,
      },
    });

    setProjects(response.data.data);
    setPagination(response.data.pagination);
    setCurrentPage(page);

  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load projects"
    );
  } finally {
    setLoading(false);
  }
};



  const fetchDevices = async () => {
  try {
    const response = await api.get("/devices/");

    setDevices(response.data.data);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to load devices"
    );
  }
};

const handleChange = (event) => {
  const { name, value } = event.target;

  setFormData((previous) => ({
    ...previous,
    [name]:
      name === "device_master_id" || name === "assigned_to"
        ? value === ""
          ? ""
          : Number(value)
        : value,
  }));
};

const handleAdd = () => {
  setEditingProject(null);

  setFormData({
    project_name: "",
    repo_name: "",
    start_date: "",
    deadline: "",
    assigned_to: "",
    comments: "",
    device_master_id: "",
    project_path: "",
    deployment_script_path: "",
    tech_stack: "",
    project_status: "Active",
  });

  setError("");
  setSuccess("");
  setShowForm(true);
};

const handleEdit = (project) => {
  setEditingProject(project);

  setFormData({
    project_name: project.project_name || "",
    repo_name: project.repo_name || "",
    start_date: project.start_date
      ? project.start_date.substring(0, 10)
      : "",
    deadline: project.deadline
      ? project.deadline.substring(0, 10)
      : "",
    assigned_to: project.assigned_to ?? "",
    comments: project.comments || "",
    device_master_id: project.device_master_id ?? "",
    project_path: project.project_path || "",
    deployment_script_path:
      project.deployment_script_path || "",
    tech_stack: project.tech_stack || "",
    project_status: project.project_status || "Active",
  });

  setError("");
  setSuccess("");
  setShowForm(true);
};

const handleUpdate = async (event) => {
  event.preventDefault();

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    await api.put(
      `/projects/${editingProject.id}`,
      formData
    );

    setSuccess("Project updated successfully");

    resetForm();
    await fetchProjects();
  } catch (err) {
  console.error(err);

  const detail = err.response?.data?.detail;

  if (Array.isArray(detail)) {
    setError(
      detail
        .map((item) => item.msg)
        .join(", ")
    );
  } else {
    setError(
      detail ||
      "Failed to update project"
    );
  }
} finally {
  setSaving(false);
}
};

const handleDelete = async (project) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${project.project_name}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");
    setSuccess("");

    await api.delete(
      `/projects/${project.id}`
    );

    setSuccess("Project deleted successfully");

    await fetchProjects();
  } catch (err) {
    console.error(err);

    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      setError(
        detail
          .map((item) => item.msg)
          .join(", ")
      );
    } else {
      setError(
        detail ||
        "Failed to delete project"
      );
    }
  }
};

const handleCreate = async (event) => {
  event.preventDefault();

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    await api.post("/projects/", formData);

    setSuccess("Project created successfully");

    resetForm();
    await fetchProjects();
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.detail ||
      "Failed to create project"
    );
  } finally {
    setSaving(false);
  }
};


const resetForm = () => {
  setShowForm(false);
  setEditingProject(null);

  setFormData({
    project_name: "",
    repo_name: "",
    start_date: "",
    deadline: "",
    assigned_to: "",
    comments: "",
    device_master_id: "",
    project_path: "",
    deployment_script_path: "",
    tech_stack: "",
    project_status: "Active",
  });
};



  if (loading) {
    return <h2>Loading projects...</h2>;
  }

  return (
    <div className="device-page">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1>Project Management</h1>

          <p>
            Manage your infrastructure projects.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleAdd}
        >
          + Add Project
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
  <div className="success-message">
    {success}
  </div>
)}

{showForm && (
  <ProjectForm
    formData={formData}
    devices={devices}
    editingProject={editingProject}
    saving={saving}
    onChange={handleChange}
    onSubmit={
      editingProject
        ? handleUpdate
        : handleCreate
    }
    onCancel={resetForm}
  />
)}

{/* FILTERS */}

<div className="project-filters">

  <input
    type="text"
    placeholder="Search by project name"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="">All Status</option>
    <option value="Active">Active</option>
    <option value="Completed">Completed</option>
    <option value="On Hold">On Hold</option>
    <option value="Archived">Archived</option>
  </select>

  <button
    type="button"
    onClick={() => fetchProjects(1)}
  >
    Search
  </button>

  <button
    type="button"
    onClick={() => {
      setSearch("");
      setStatusFilter("");
      fetchProjects(1, "", "");
    }}
  >
    Clear
  </button>

</div>



      {/* PROJECT LIST */}

      <ProjectList
        projects={projects}
        onView={(project) =>
          navigate(`/projects/${project.id}`)
        }
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* PAGINATION */}

<div className="pagination-controls">

  <button
    type="button"
    onClick={() => fetchProjects(currentPage - 1)}
    disabled={!pagination.has_previous}
  >
    Previous
  </button>

  <span>
    Page {pagination.page} of {pagination.total_pages}
  </span>

  <button
    type="button"
    onClick={() => fetchProjects(currentPage + 1)}
    disabled={!pagination.has_next}
  >
    Next
  </button>

</div>

    </div>
  );
}


export default Projects;