import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import api from "../api/axios";

import SummaryCard from "../components/UI/SummaryCard";
import SummaryCards from "../components/UI/SummaryCards";
import SearchFilterBar from "../components/UI/SearchFilterBar";
import PageHeader from "../components/UI/PageHeader";
import FormModal from "../components/UI/FormModal";
import DataTable from "../components/UI/DataTable";
import ActionButtons from "../components/UI/ActionButtons";
import Pagination from "../components/UI/Pagination";

import {
  Layers3,
  CalendarDays,
  CalendarRange,
  Clock3,
} from "lucide-react";


function DeviceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [rotationFilter, setRotationFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [viewingCategory, setViewingCategory] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    category_name: "",
    default_rotation_days: "90",
  });

  const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
});

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const canManage =
    currentUser.role === "ADMIN" ||
    currentUser.role === "SUPER_ADMIN";

  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/device-categories/", {
        params: {
          page,
          limit: pagination.limit,
        },
      });

      
    setCategories(
      Array.isArray(response.data.data)
        ? response.data.data
        : []
    );

    setPagination(
      response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      }
    );




      setCurrentPage(page);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to load device categories."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCategories(1);
  }, []);

  const filteredCategories = useMemo(() => {
  const value = search.trim().toLowerCase();

  return categories.filter((category) => {
    const matchesSearch =
      !value ||
      category.category_name
        ?.toLowerCase()
        .includes(value);

    const matchesRotation =
      !rotationFilter ||
      String(category.default_rotation_days) ===
        rotationFilter;

    return matchesSearch && matchesRotation;
  });
}, [categories, search, rotationFilter]);



  const totalCategories = categories.length;

  const rotation90 = categories.filter(
    (category) =>
      Number(category.default_rotation_days) === 90
  ).length;

  const rotation180 = categories.filter(
    (category) =>
      Number(category.default_rotation_days) === 180
  ).length;

  const longRotation = categories.filter((category) =>
    [270, 360].includes(
      Number(category.default_rotation_days)
    )
  ).length;

  const handleAdd = () => {
    setEditingCategory(null);

    setFormData({
      category_name: "",
      default_rotation_days: "90",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);

    setFormData({
      category_name: category.category_name || "",
      default_rotation_days: String(
        category.default_rotation_days || 90
      ),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.category_name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        category_name:
          formData.category_name.trim(),
        default_rotation_days:
          Number(formData.default_rotation_days),
      };

      if (editingCategory) {
        await api.put(
          `/device-categories/${editingCategory.id}`,
          payload
        );

        setSuccess(
          "Device category updated successfully."
        );
      } else {
        await api.post(
          "/device-categories/",
          payload
        );

        setSuccess(
          "Device category created successfully."
        );
      }

      setShowForm(false);
      setEditingCategory(null);

      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to save device category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.category_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/device-categories/${category.id}`
      );

      setSuccess(
        "Device category deleted successfully."
      );

      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to delete device category."
      );
    }
  };

  const handleClear = () => {
    setSearch("");
    setError("");
    setSuccess("");
  };

  const columns = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "category_name",
      label: "Category Name",
    },
    {
      key: "default_rotation_days",
      label: "Default Rotation",
    },
    {
      key: "actions",
      label: "Actions",
    },
  ];

  const renderCell = (row, column) => {
    if (column.key === "default_rotation_days") {
      return `${row.default_rotation_days} Days`;
    }

    if (column.key === "actions") {
      return (
        <ActionButtons
          onView={() =>
            setViewingCategory(row)
          }
          onEdit={
            canManage
              ? () => handleEdit(row)
              : undefined
          }
          onDelete={
            canManage
              ? () => handleDelete(row)
              : undefined
          }
        />
      );
    }

    return row[column.key];
  };

  const categoryViewModal = viewingCategory && (
  <div
    className="modal-overlay"
    onClick={() => setViewingCategory(null)}
  >
    <div
      className="device-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <h2>Device Category Details</h2>
          <p>View device category information</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setViewingCategory(null)}
        >
          ×
        </button>
      </div>

      <div className="view-modal-body">
        <div className="form-grid">

          <div className="form-group">
            <label>ID</label>
            <div className="view-value">
              {viewingCategory.id ?? "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Category Name</label>
            <div className="view-value">
              {viewingCategory.category_name || "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Default Rotation Days</label>
            <div className="view-value">
              {viewingCategory.default_rotation_days != null
                ? `${viewingCategory.default_rotation_days} Days`
                : "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Created At</label>
            <div className="view-value">
              {viewingCategory.created_at || "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Updated At</label>
            <div className="view-value">
              {viewingCategory.updated_at || "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Created By</label>
            <div className="view-value">
              {viewingCategory.created_by || "—"}
            </div>
          </div>

          <div className="form-group">
            <label>Updated By</label>
            <div className="view-value">
              {viewingCategory.updated_by || "—"}
            </div>
          </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setViewingCategory(null)}
            >
              Close
            </button>
          </div>

        
      </div>
    </div>
  </div>
);

  return (
    <div className="page-container">
      <PageHeader
        title="Device Categories"
        description="Manage device categories and password rotation defaults."
        actionLabel={
          canManage ? " + Add Category" : undefined
        }
        onAction={
          canManage ? handleAdd : undefined
        }
      />

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

      <SummaryCards>
        <SummaryCard
          title="Total Categories"
          value={totalCategories}
          icon={Layers3}
          variant="primary"
        />

        <SummaryCard
          title="90-Day Rotation"
          value={rotation90}
          icon={CalendarDays}
          variant="warning"
        />

        <SummaryCard
          title="180-Day Rotation"
          value={rotation180}
          icon={CalendarRange}
          variant="success"
        />

        <SummaryCard
          title="Long Rotation"
          value={longRotation}
          icon={Clock3}
          variant="info"
        />
      </SummaryCards>


    <div className="app-content-card">

      <SearchFilterBar
        search={{
          value: search,
          placeholder: "Search device categories...",
          onChange: setSearch,
        }}
        filters={[
          {
            key: "rotation",
            value: rotationFilter,
            onChange: setRotationFilter,
            options: [
              {
                value: "",
                label: "All Rotation",
              },
              {
                value: "90",
                label: "90 Days",
              },
              {
                value: "180",
                label: "180 Days",
              },
              {
                value: "270",
                label: "270 Days",
              },
              {
                value: "360",
                label: "360 Days",
              },
            ],
          },
        ]}
        onSearch={() => {}}
        onClear={() => {
          setSearch("");
          setRotationFilter("");
          setError("");
          setSuccess("");
        }}
      />




      {loading ? (
        <div className="data-table-card">
          <p className="data-table-empty">
            Loading device categories...
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCategories}
          emptyMessage="No device categories found."
          renderCell={renderCell}
        />
      )}


     {/* =================================================
          PAGINATION
      ================================================== */}
    <div className="app-pagination-card">
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.total_pages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        onPageChange={fetchCategories}
      />

    </div>
    </div>



      {showForm &&
        createPortal(
          <FormModal
            title={
              editingCategory
                ? "Edit Device Category"
                : "Create Device Category"
            }
            subtitle={
              editingCategory
                ? "Update device category information"
                : "Add a new device category"
            }
            onClose={() => {
              if (!saving) {
                setShowForm(false);
                setEditingCategory(null);
              }
            }}
            onSubmit={handleSubmit}
            saving={saving}
            submitText={
              editingCategory
                ? "Update Category"
                : "Create Category"
            }
            savingText={
              editingCategory
                ? "Updating..."
                : "Creating..."
            }
          >
            <div className="form-grid">

              <div className="form-group">
                <label>Category Name</label>

                <input
                  type="text"
                  name="category_name"
                  value={formData.category_name}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      category_name:
                        event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Default Rotation Days</label>

                <select
                  name="default_rotation_days"
                  value={
                    formData.default_rotation_days
                  }
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      default_rotation_days:
                        event.target.value,
                    }))
                  }
                  required
                >
                  <option value="90">
                    90 Days
                  </option>

                  <option value="180">
                    180 Days
                  </option>

                  <option value="270">
                    270 Days
                  </option>

                  <option value="360">
                    360 Days
                  </option>
                </select>
              </div>

            </div>
          </FormModal>,
          document.body
        )}

      {categoryViewModal}
    </div>
  );
}


export default DeviceCategories;