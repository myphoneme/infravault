import DataTable from "../../components/UI/DataTable";

function ProjectList({ projects, onView, onEdit, onDelete }) {
  const columns = [
    { key: "id", label: "ID" },
    { key: "project_name", label: "Project Name" },
    { key: "repo_name", label: "Repository" },
    { key: "start_date", label: "Start Date" },
    { key: "deadline", label: "Deadline" },
    { key: "tech_stack", label: "Tech Stack" },
    { key: "project_status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <DataTable
      columns={columns}
      data={projects}
      emptyMessage="No projects found."
      renderCell={(project, column) => {
        if (column.key === "project_status") {
          return (
            <span
              className={
                project.project_status === "Pending"
                  ? "status-pending"
                  : project.project_status === "Completed"
                    ? "status-completed"
                    : "status-overdue"
              }
            >
              {project.project_status}
            </span>
          );
        }

        if (column.key === "actions") {
          return (
            <div className="action-buttons">
              <button
                type="button"
                className="view-button"
                onClick={() => onView(project)}
              >
                View
              </button>

              <button
                type="button"
                className="edit-button"
                onClick={() => onEdit(project)}
              >
                Edit
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={() => onDelete(project)}
              >
                Delete
              </button>
            </div>
          );
        }

        return project[column.key];
      }}
    />
  );
}

export default ProjectList;