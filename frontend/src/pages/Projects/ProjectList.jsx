import DataTable from "../../components/UI/DataTable";
import ActionButtons from "../../components/UI/ActionButtons";

function ProjectList({
  projects,
  allUsers = [],
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    { key: "id", label: "ID" },
    { key: "project_name", label: "Project Name" },
    { key: "repo_name", label: "Repository" },
    { key: "start_date", label: "Start Date" },
    { key: "deadline", label: "Deadline" },
    { key: "assigned_to", label: "Assigned To" },
    { key: "tech_stack", label: "Tech Stack" },
    { key: "project_status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  const userNameCounts = allUsers.reduce(
    (counts, user) => {
      const normalizedName =
        user.name?.trim().toLowerCase();

      if (normalizedName) {
        counts[normalizedName] =
          (counts[normalizedName] || 0) + 1;
      }

      return counts;
    },
    {}
  );

  return (
    <DataTable
      columns={columns}
      data={projects}
      emptyMessage="No projects found."
      renderCell={(project, column) => {

        if (column.key === "assigned_to") {
          const assignedUser = allUsers.find(
            (user) =>
              Number(user.id) ===
              Number(project.assigned_to)
          );

          if (!assignedUser) {
            return "—";
          }

          const normalizedName =
            assignedUser.name?.trim().toLowerCase();

          const isDuplicateName =
            userNameCounts[normalizedName] > 1;

          let label =
            assignedUser.name?.trim() || "";

          if (isDuplicateName) {
            label += ` — ${assignedUser.email}`;
          }

          if (assignedUser.is_active === false) {
            label += " (Inactive)";
          }

          return label || "—";
        }

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
            <ActionButtons
              onView={() => onView(project)}
              onEdit={() => onEdit(project)}
              onDelete={() => onDelete(project)}
            />
          );
        }

        return project[column.key];
      }}
    />
  );
}

export default ProjectList;