import React, { useRef, useState, useEffect } from "react";
import api from "../../api/axios";
import ActionButtons from "../../components/UI/ActionButtons";

import PageHeader from "../../components/UI/PageHeader";
import Pagination from "../../components/UI/Pagination";

import FormModal from "../../components/UI/FormModal";
import SearchableSelect from "../../components/UI/SearchableSelect";

import SummaryCards from "../../components/UI/SummaryCards";
import SummaryCard from "../../components/UI/SummaryCard";
import DataTable from "../../components/UI/DataTable";
import DeviceForm from "./DeviceForm";

import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  Server,
  AlertCircle,
  XCircle,
  RefreshCw,
  Trash2,
  ArrowUpFromLine,
  CircleHelp,
} from "lucide-react";
import "./DeviceImport.css";

const VALIDATE_ENDPOINT = "/devices/import/validate";
const COMMIT_ENDPOINT = "/devices/import/commit";


const DEVICE_IMPORT_SESSION_KEY = "device_import_session";
const DEVICE_IMPORT_DB_NAME = "device_import_storage";
const DEVICE_IMPORT_DB_VERSION = 1;
const DEVICE_IMPORT_FILE_STORE = "files";
const DEVICE_IMPORT_FILE_KEY = "current_workbook";

const openDeviceImportDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DEVICE_IMPORT_DB_NAME,
      DEVICE_IMPORT_DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DEVICE_IMPORT_FILE_STORE)) {
        db.createObjectStore(DEVICE_IMPORT_FILE_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

const saveDeviceImportFile = async (file) => {
  if (!file) return;

  const db = await openDeviceImportDb();

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(
      DEVICE_IMPORT_FILE_STORE,
      "readwrite"
    );

    transaction.objectStore(DEVICE_IMPORT_FILE_STORE).put(
      file,
      DEVICE_IMPORT_FILE_KEY
    );

    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
};

const getDeviceImportFile = async () => {
  const db = await openDeviceImportDb();

  const file = await new Promise((resolve, reject) => {
    const transaction = db.transaction(
      DEVICE_IMPORT_FILE_STORE,
      "readonly"
    );

    const request = transaction
      .objectStore(DEVICE_IMPORT_FILE_STORE)
      .get(DEVICE_IMPORT_FILE_KEY);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  db.close();

  return file;
};

const clearDeviceImportFile = async () => {
  const db = await openDeviceImportDb();

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(
      DEVICE_IMPORT_FILE_STORE,
      "readwrite"
    );

    transaction.objectStore(DEVICE_IMPORT_FILE_STORE).delete(
      DEVICE_IMPORT_FILE_KEY
    );

    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
};

const saveDeviceImportSession = (session) => {
  localStorage.setItem(
    DEVICE_IMPORT_SESSION_KEY,
    JSON.stringify({
      ...session,
      updatedAt: new Date().toISOString(),
    })
  );
};

const getDeviceImportSession = () => {
  try {
    const stored = localStorage.getItem(
      DEVICE_IMPORT_SESSION_KEY
    );

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const clearDeviceImportSession = () => {
  localStorage.removeItem(DEVICE_IMPORT_SESSION_KEY);
};


/*
 * These helpers accept several common response field names.
 * If your backend uses different names, only the helpers below
 * should need to be adjusted to match its exact response schema.
 */

const getFirstArray = (object, keys) => {
  for (const key of keys) {
    if (Array.isArray(object?.[key])) {
      return object[key];
    }
  }

  return [];
};

const getRowNumber = (item) =>
  item?.row_number ??
  item?.row ??
  item?.excel_row ??
  item?.row_num ??
  item?.line ??
  null;

const getDeviceValue = (item, field) =>
  item?.[field] ??
  item?.data?.[field] ??
  item?.incoming_device?.[field] ??
  item?.excel_data?.[field] ??
  item?.device?.[field] ??
  item?.existing_device?.[field] ??
  null;

const displayValue = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : String(value);

const getDeviceName = (item) =>
  displayValue(getDeviceValue(item, "device_name"));

const getHost = (item) =>
  displayValue(getDeviceValue(item, "host"));

const getPort = (item) =>
  displayValue(getDeviceValue(item, "port"));

const getConnectionType = (item) =>
  displayValue(getDeviceValue(item, "connection_type"));

const getUsername = (item) =>
  displayValue(getDeviceValue(item, "username"));

const getDeviceRemarks = (item) =>
  displayValue(
    getDeviceValue(item, "comments") ??
    getDeviceValue(item, "remarks")
  );



const getErrorMessage = (item) => {
  if (typeof item === "string") return item;

  if (Array.isArray(item?.errors)) {
    return item.errors
      .map((error) =>
        typeof error === "string"
          ? error
          : error?.message || error?.msg || JSON.stringify(error)
      )
      .join("; ");
  }

  return (
    item?.message ||
    item?.msg ||
    item?.detail ||
    item?.error ||
    item?.reason ||
    "Please review this row."
  );
};

const matchImportSelectValue = (
  value,
  options,
  fallback = ""
) => {
  if (value == null || value === "") {
    return fallback;
  }

  const normalizedValue = String(value)
    .trim()
    .toLowerCase();

  const matchedOption = options.find(
    (option) =>
      String(option)
        .trim()
        .toLowerCase() === normalizedValue
  );

  return matchedOption ?? fallback;
};

const getImportSelectValue = (value, options, fallback = "") => {
  if (value == null || value === "") {
    return fallback;
  }

  const normalizedValue = String(value)
    .trim()
    .toLowerCase();

  return (
    options.find(
      (option) =>
        String(option).trim().toLowerCase() ===
        normalizedValue
    ) ?? fallback
  );
};

const getImportEditFormData = (row) => ({
  device_name: getDeviceValue(row, "device_name") || "",
  host: getDeviceValue(row, "host") || "",
  port: getDeviceValue(row, "port") ?? "",

  connection_type:
    getDeviceValue(row, "connection_type") || "SSH",

  username: getDeviceValue(row, "username") || "",
  password: "",

  

  device_category_id:
    getDeviceValue(row, "device_category_id") == null
      ? ""
      : String(getDeviceValue(row, "device_category_id")),

  password_rotation_days:
    matchImportSelectValue(
      getDeviceValue(row, "password_rotation_days"),
      ["90", "180", "270", "360"],
      ""
    ),

  comments:
    getDeviceValue(row, "comments") ??
    getDeviceValue(row, "remarks") ??
    "",

  device_status:
    matchImportSelectValue(
      getDeviceValue(row, "device_status"),
      ["Active", "Inactive"],
      "Active"
    ),

 device_condition:
  matchImportSelectValue(
    getDeviceValue(row, "device_condition"),
    [
      "Reachable",
      "Unreachable",
      "Switched Off",
      "Unused",
    ],
    "Unused"
  ),

});


const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getConflictRowId = (conflict, index) =>
  String(
    getRowNumber(conflict) ??
      conflict?.id ??
      conflict?.device_id ??
      index
  );

function DeviceImport() {
  const fileInputRef = useRef(null);
  const previousImportScopeRef = useRef(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [hasSavedImportSession, setHasSavedImportSession] = useState(false);
  const [restoringImportSession, setRestoringImportSession] = useState(true);
  const [isReplacingSavedSession, setIsReplacingSavedSession] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [validationResult, setValidationResult] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importScope, setImportScope] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  

  const [totalRows, setTotalRows] = useState(0);
    const [totalUploaded, setTotalUploaded] = useState(0);
    const [existingDevices, setExistingDevices] = useState(0);
    const [validationErrors, setValidationErrors] = useState(0);

    

    const PAGE_SIZE = 5;

const [newDevicesPage, setNewDevicesPage] = useState(1);
const [conflictsPage, setConflictsPage] = useState(1);
const [errorsPage, setErrorsPage] = useState(1);

const [deviceCategories, setDeviceCategories] = useState([]);
  /*
   * Decisions are stored by Excel row number / conflict identifier.
   * Example: { "2": "update", "5": "skip" }
   */
  const [decisions, setDecisions] = useState({});
  const [editingErrorRow, setEditingErrorRow] = useState(null);

 const [errorCorrections, setErrorCorrections] = useState(() => {
  try {
    return JSON.parse(
      sessionStorage.getItem("deviceImportErrorCorrections") || "{}"
    );
  } catch {
    return {};
  }
});

 const [revalidatingErrors, setRevalidatingErrors] = useState(false);

  const [editingErrorForm, setEditingErrorForm] = useState({
  device_name: "",
  host: "",
  port: 22,
  connection_type: "SSH",
  username: "",
  password: "",
  device_category_id: "",
  password_rotation_days: "",
  comments: "",
  device_status: "Active",
  device_condition: "Unused",
});

  const clearResults = () => {
    setValidationResult(null);
    setValidationError("");
    setImportError("");
    setImportResult(null);
    setDecisions({});
    setErrorCorrections({});
    sessionStorage.removeItem("deviceImportErrorCorrections");
    setTotalRows(0);
    setTotalUploaded(0);
    setExistingDevices(0);
    setValidationErrors(0);
    setNewDevicesPage(1);
    setConflictsPage(1);
    setErrorsPage(1);
  };

const persistImportSession = ({
  file = selectedFile,
  result = validationResult,
  uploaded = totalUploaded,
  conflictDecisions = decisions,
  corrections = errorCorrections,
  rows = totalRows,
  newPage = newDevicesPage,
  conflictsPageValue = conflictsPage,
  errorsPageValue = errorsPage,
} = {}) => {
  if (!file || !result) {
    return;
  }

  saveDeviceImportSession({
    fileName: file.name,
    fileSize: file.size,
    fileLastModified: file.lastModified,

    totalRows: rows,
    totalUploaded: uploaded,

    validationResult: result,

    decisions: conflictDecisions,
    errorCorrections: corrections,

    newDevicesPage: newPage,
    conflictsPage: conflictsPageValue,
    errorsPage: errorsPageValue,
  });
};


const commonDeviceColumns = [
  { key: "row", label: "Excel Row" },
  { key: "device_name", label: "Device Name" },
  { key: "host", label: "Host / IP" },
  { key: "port", label: "Port" },
  { key: "connection_type", label: "Connection Type" },
  { key: "username", label: "Username" },
  { key: "remarks", label: "Remarks / Issues" },
];

const newDeviceColumns = commonDeviceColumns;

const conflictColumns = [
  ...commonDeviceColumns,
  { key: "decision", label: "Action" },
];

const errorColumns = [
  ...commonDeviceColumns,
  { key: "action", label: "Action" },
];



  const handleFileChange =async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    clearResults();

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "xlsx") {
      setSelectedFile(null);
      setValidationError(
        "Invalid file type. Please select an Excel workbook (.xlsx)."
      );

    
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    await saveDeviceImportFile(file);
  };



  const handleRemoveFile = async() => {
    setSelectedFile(null);
    clearResults();
    await clearDeviceImportFile();


    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * NORMALIZE VALIDATION RESPONSE
   *
   * Supports common field names for:
   * - validation errors
   * - duplicate conflicts
   * - new device rows
   * - row counts
   *
   * Adjust the field names here if your FastAPI response differs.
   */
  const normalizeValidationResponse = (data) => {
      const rawErrors = getFirstArray(data, [
        "errors",
        "validation_errors",
        "row_errors",
        "invalid_rows",
      ]);

      const groupedErrors = new Map();

      rawErrors.forEach((error, index) => {
        const rowNumber = getRowNumber(error);

        const key =
          rowNumber != null
            ? String(rowNumber)
            : `error-${index}`;

        const existing = groupedErrors.get(key);

        const messages = Array.isArray(error?.errors)
          ? error.errors.map((item) =>
              typeof item === "string"
                ? item
                : item?.message ||
                  item?.msg ||
                  item?.reason ||
                  JSON.stringify(item)
            )
          : [
              error?.reason ||
                error?.message ||
                error?.msg ||
                error?.detail ||
                error?.error ||
                "Please review this row.",
            ];

        if (existing) {
          existing.errors.push(...messages);
        } else {
          groupedErrors.set(key, {
            ...error,
            errors: messages,
          });
        }
      });

      const errors = Array.from(groupedErrors.values());



      const conflicts = getFirstArray(data, [
        "conflicts",
        "duplicate_conflicts",
        "existing_devices",
        "duplicates",
      ]);

      const newDevices = getFirstArray(data, [
        "new_devices",
        "new_rows",
        "devices_to_insert",
        "valid_rows",
      ]);

      const totalRows =
        data?.total_rows ??
        data?.total ??
        data?.row_count ??
        data?.total_records ??
        null;

      const explicitValid =
        data?.valid ??
        data?.is_valid ??
        data?.validation_passed ??
        data?.success ??
        null;

      const hasErrors =
        errors.length > 0 ||
        data?.has_errors === true ||
        data?.validation_passed === false ||
        data?.valid === false ||
        data?.is_valid === false;

      return {
        raw: data,
        errors,
        conflicts,
        newDevices,
        totalRows,
        valid: explicitValid === false ? false : !hasErrors,
      };
  };



  const handleValidate = async () => {
    if (!selectedFile) {
      setValidationError("Please select an Excel file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setValidating(true);
      clearResults();

      const response = await api.post(
        VALIDATE_ENDPOINT,
        formData
      );


      const normalized = normalizeValidationResponse(
        response.data
      );

     const uniqueConflicts = Array.from(
        new Map(
          normalized.conflicts.map((item, index) => [
            String(
              item?.row_number ??
              item?.row ??
              item?.excel_row ??
              item?.row_num ??
              item?.line ??
              `conflict-${index}`
            ),
            item,
          ])
        ).values()
      );

      const revalidatedResult = {
        ...normalized,
        conflicts: uniqueConflicts,
      };



      setValidationResult(revalidatedResult);
      setExistingDevices(revalidatedResult.conflicts.length);
      setIsUploadModalOpen(false);
      setTotalRows(normalized.totalRows ?? 0);
      setExistingDevices(normalized.conflicts.length);
      setValidationErrors(normalized.errors.length);

      /*
       * Initialize each conflict as unresolved.
       * The admin must explicitly choose Update or Skip.
       */
      const initialDecisions = {};

      revalidatedResult.conflicts.forEach((conflict, index) => {
        const rowId = getConflictRowId(conflict, index);
        initialDecisions[rowId] = "";
      });

      setDecisions(initialDecisions);

      await saveDeviceImportSession({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileLastModified: selectedFile.lastModified,

        totalRows: normalized.totalRows ?? 0,
        totalUploaded: 0,

        validationResult: normalized,

        decisions: initialDecisions,

        newDevicesPage: 1,
        conflictsPage: 1,
        errorsPage: 1,
      });

    } catch (err) {
      const detail = err.response?.data?.detail;

      setValidationError(
        typeof detail === "string"
          ? detail
          : "Unable to validate the workbook. Please check the file and try again."
      );
    } finally {
      setValidating(false);
    }
  };

 const handleDecisionChange = (rowId, decision) => {
  const nextDecisions = {
    ...decisions,
    [rowId]: decision,
  };

  setDecisions(nextDecisions);

  persistImportSession({
    conflictDecisions: nextDecisions,
  });
};


const allConflictsResolved = () => {
  return conflicts.every((conflict, index) => {
    const rowId = getConflictRowId(conflict, index);
    const decision = decisions[rowId];

    return decision === "update" || decision === "skip";
  });
};


const handleValidationErrorEditSubmit = (event) => {
  event.preventDefault();

  if (!editingErrorRow) return;

  const rowNumber = getRowNumber(editingErrorRow);

  const passwordOverride =
    editingErrorForm.password.trim() !== ""
      ? editingErrorForm.password
      : null;



const nextCorrections = {
  ...errorCorrections,
  [String(rowNumber)]: {
    device_name: editingErrorForm.device_name,
    host: editingErrorForm.host,
    port: editingErrorForm.port,
    connection_type: editingErrorForm.connection_type,
    username: editingErrorForm.username,
    device_category_id:
      editingErrorForm.device_category_id === ""
        ? null
        : Number(editingErrorForm.device_category_id),
    password_rotation_days:
      editingErrorForm.password_rotation_days,
    comments: editingErrorForm.comments,
    device_status: editingErrorForm.device_status,
    device_condition: editingErrorForm.device_condition,
    ...(passwordOverride !== null
      ? { password: passwordOverride }
      : {}),
  },
};

setErrorCorrections(nextCorrections);

sessionStorage.setItem(
  "deviceImportErrorCorrections",
  JSON.stringify(nextCorrections)
);



const nextValidationResult = validationResult
  ? {
      ...validationResult,
      errors: validationResult.errors.map((row) => {
        if (getRowNumber(row) !== rowNumber) {
          return row;
        }

        return {
          ...row,
          device_name: editingErrorForm.device_name,
          host: editingErrorForm.host,
          port: editingErrorForm.port,
          connection_type: editingErrorForm.connection_type,
          username: editingErrorForm.username,
          device_category_id:
            editingErrorForm.device_category_id === ""
              ? null
              : Number(editingErrorForm.device_category_id),
          password_rotation_days:
            editingErrorForm.password_rotation_days,
          comments: editingErrorForm.comments,
          device_status: editingErrorForm.device_status,
          device_condition: editingErrorForm.device_condition,
        };
      }),
    }
  : validationResult;

setValidationResult(nextValidationResult);

persistImportSession({
  result: nextValidationResult,
  corrections: nextCorrections,
});



  setValidationResult((previous) => {
    if (!previous) return previous;

    return {
      ...previous,
      errors: previous.errors.map((row) => {
        if (getRowNumber(row) !== rowNumber) {
          return row;
        }

        return {
          ...row,
          device_name: editingErrorForm.device_name,
          host: editingErrorForm.host,
          port: editingErrorForm.port,
          connection_type: editingErrorForm.connection_type,
          username: editingErrorForm.username,
         device_category_id:
          editingErrorForm.device_category_id === ""
            ? null
            : Number(editingErrorForm.device_category_id),
          password_rotation_days:
            editingErrorForm.password_rotation_days,
          comments: editingErrorForm.comments,
          device_status: editingErrorForm.device_status,
          device_condition: editingErrorForm.device_condition,
        };
      }),
    };
  });

  setEditingErrorRow(null);
};



const handleRevalidateErrors = async () => {
  if (!selectedFile || validating || committing || revalidatingErrors) {
    return;
  }

  setRevalidatingErrors(true);
  setValidationError("");
  setImportError("");

  try {
    const errorRows =
      validationResult?.errors?.map((row) => getRowNumber(row)) ?? [];

    const formData = new FormData();

    formData.append("file", selectedFile);

    formData.append(
      "error_corrections",
      JSON.stringify(errorCorrections)
    );

    formData.append(
      "revalidate_rows",
      JSON.stringify(errorRows)
    );

    const response = await api.post(
      "/devices/import/validate",
      formData
    );


    const normalized = normalizeValidationResponse(
  response.data
);

const revalidatedRowIds = new Set(
  errorRows
    .filter((rowNumber) => rowNumber != null)
    .map((rowNumber) => String(rowNumber))
);

const remainingNewDevices =
  validationResult?.newDevices?.filter(
    (row) =>
      !revalidatedRowIds.has(
        String(getRowNumber(row))
      )
  ) ?? [];

const remainingConflicts =
  validationResult?.conflicts?.filter(
    (row) =>
      !revalidatedRowIds.has(
        String(getRowNumber(row))
      )
  ) ?? [];

const remainingErrors =
  validationResult?.errors?.filter(
    (row) =>
      !revalidatedRowIds.has(
        String(getRowNumber(row))
      )
  ) ?? [];

const revalidatedResult = {
  ...validationResult,
  newDevices: [
    ...remainingNewDevices,
    ...(normalized.newDevices ?? []),
  ],
  conflicts: [
    ...remainingConflicts,
    ...(normalized.conflicts ?? []),
  ],
  errors: [
    ...remainingErrors,
    ...(normalized.errors ?? []),
  ],
};

const nextDecisions = {};

revalidatedResult.conflicts.forEach((conflict) => {
  const rowNumber = getRowNumber(conflict);

  if (rowNumber == null) {
    return;
  }

  const rowId = String(rowNumber);

  nextDecisions[rowId] =
    decisions[rowId] ?? "";
});

setValidationResult(revalidatedResult);

setExistingDevices(
  revalidatedResult.conflicts.length
);

setValidationErrors(
  revalidatedResult.errors.length
);

setDecisions(nextDecisions);

setNewDevicesPage(1);
setConflictsPage(1);
setErrorsPage(1);

persistImportSession({
  result: revalidatedResult,
  corrections: errorCorrections,
  conflictDecisions: nextDecisions,
  rows: totalRows,
  newPage: 1,
  conflictsPageValue: 1,
  errorsPageValue: 1,
});

  } catch (error) {
    setValidationError(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Revalidation failed."
    );
  } finally {
    setRevalidatingErrors(false);
  }
};




const handleCommit = async (scope, confirmed = false) => {
  if (!selectedFile || !validationResult) return;

  if (!confirmed) {
    if (scope === "existing" && !allConflictsResolved()) {
      setImportError(
        "Please select Update or Skip for every existing-device conflict."
      );
      return;
    }

    setImportScope(scope);
    setImportResult(null);
    setImportError("");
    setImportProgress(0);
    return;
  }

  if (scope === "existing" && !allConflictsResolved()) {
    setImportError(
      "Please select Update or Skip for every existing-device conflict."
    );
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile);

  formData.append(
    "scope",
    scope === "new" ? "new" : "existing"
  );

  const rowsToImport =
    scope === "new"
      ? newDevices
      : conflicts;

  const excelRows = rowsToImport
    .map((row) => getRowNumber(row))
    .filter(
      (rowNumber) =>
        rowNumber !== null &&
        rowNumber !== undefined
    );

  formData.append(
    "excel_rows",
    JSON.stringify(excelRows)
  );

  formData.append(
    "decisions",
    JSON.stringify(decisions)
  );

  formData.append(
    "error_corrections",
    JSON.stringify(errorCorrections)
  );

  formData.append(
    "revalidate_rows",
    JSON.stringify(
      validationResult?.errors?.map((row) => getRowNumber(row)) ?? []
    )
  );


  setCommitting(true);
  setImportError("");
  setImportResult(null);
  setImportProgress(5);

  let progressTimer = null;

  try {
    progressTimer = window.setInterval(() => {
      setImportProgress((current) => {
        if (current >= 90) {
          return 90;
        }

        return Math.min(
          current + 5,
          90
        );
      });
    }, 400);

    const response = await api.post(
      COMMIT_ENDPOINT,
      formData
    );

    if (progressTimer) {
      window.clearInterval(progressTimer);
      progressTimer = null;
    }

    const result = response.data;

    if (result?.success !== true) {
      setImportProgress(0);

      setImportError(
        result?.message ||
          "The device import could not be completed."
      );

      setImportResult(null);

      return;
    }

    setImportProgress(100);
    setImportResult(result);


    const inserted =
      result?.imported_count ??
      result?.inserted_count ??
      result?.inserted ??
      result?.created_count ??
      result?.created ??
      0;

    const updated = Number(
      result?.updated_count ??
      result?.updated ??
      0
    );

setTotalUploaded((current) => {
  const skipped =Number(
    result.skipped_count ??
    result.skipped ??
    0
  );

  const added =
    scope === "new"
      ? inserted
      : updated + skipped;

  return current + added;
});


  } catch (err) {
    if (progressTimer) {
      window.clearInterval(progressTimer);
      progressTimer = null;
    }

    setImportProgress(0);

    const detail = err.response?.data?.detail;

    setImportError(
      typeof detail === "string"
        ? detail
        : "The import could not be completed. All changes were rolled back."
    );
  } finally {
    setCommitting(false);
  }
};




useEffect(() => {
  const loadDeviceCategories = async () => {
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

  loadDeviceCategories();
}, []);


useEffect(() => {
  const restoreImportSession = async () => {
    try {
      const session = getDeviceImportSession();

      if (!session) {
        setRestoringImportSession(false);
        return;
      }

      const savedFile = await getDeviceImportFile();

      if (!savedFile) {
        clearDeviceImportSession();
        setRestoringImportSession(false);
        return;
      }

      setHasSavedImportSession(true);
    } catch (error) {
      console.error("Unable to restore device import session.", error);
      setHasSavedImportSession(false);
    } finally {
      setRestoringImportSession(false);
    }
  };

  restoreImportSession();
}, []);


useEffect(() => {
  if (!importScope || committing || importResult) {
    return;
  }

  handleCommit(importScope, true);
}, [importScope]);




const handleImportClose = () => {
  if (committing || !importResult || !importScope) {
    return;
  }

  if (importScope === "new") {
    const importedRows = new Set(
      newDevices.map((row) =>
        String(getRowNumber(row))
      )
    );

    const remainingNewDevices =
      newDevices.filter(
        (row) =>
          !importedRows.has(
            String(getRowNumber(row))
          )
      );

    setValidationResult((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        newDevices: remainingNewDevices,
      };
    });

  } else {
    const processedRows = new Set(
      conflicts.map((row) =>
        String(getRowNumber(row))
      )
    );

    const remainingConflicts =
      conflicts.filter(
        (row) =>
          !processedRows.has(
            String(getRowNumber(row))
          )
      );

    setValidationResult((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        conflicts: remainingConflicts,
      };
    });

    setExistingDevices(
      remainingConflicts.length
    );

    setDecisions((previous) => {
      const next = { ...previous };

      processedRows.forEach((rowId) => {
        delete next[rowId];
      });

      return next;
    });
  }

  setImportScope(null);
  setImportResult(null);
  setImportError("");
  setImportProgress(0);
};


useEffect(() => {
  const previousImportScope =
    previousImportScopeRef.current;

  if (
    previousImportScope &&
    !importScope &&
    validationResult &&
    getDeviceImportSession()
  ) {
    persistImportSession();
  }

  previousImportScopeRef.current = importScope;
}, [
  importScope,
  validationResult,
  totalUploaded,
  decisions,
  errorCorrections,
  newDevicesPage,
  conflictsPage,
  errorsPage,
]);



const handleStartOver = async () => {
  setHasSavedImportSession(false);

  setSelectedFile(null);
  clearResults();

  clearDeviceImportSession();
  await clearDeviceImportFile();

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

const handleResumeImportSession = async () => {
  try {
    const session = getDeviceImportSession();
    const savedFile = await getDeviceImportFile();

    if (!session || !savedFile) {
      setHasSavedImportSession(false);
      return;
    }

    setSelectedFile(savedFile);

    setTotalRows(session.totalRows ?? 0);
    setTotalUploaded(session.totalUploaded ?? 0);

    setValidationResult(session.validationResult ?? null);

    const restoredConflicts =
      session.validationResult?.conflicts ?? [];

    setExistingDevices(restoredConflicts.length);

    const restoredErrors =
      session.validationResult?.errors ?? [];

    setValidationErrors(restoredErrors.length);

    setDecisions(session.decisions ?? {});

    setErrorCorrections(session.errorCorrections ?? {});

    setNewDevicesPage(session.newDevicesPage ?? 1);
    setConflictsPage(session.conflictsPage ?? 1);
    setErrorsPage(session.errorsPage ?? 1);

    setValidationError("");
    setImportError("");
    setImportResult(null);
    setImportScope(null);
    setImportProgress(0);

    setHasSavedImportSession(false);
    setIsReplacingSavedSession(false);
  } catch {
    setValidationError(
      "Unable to restore the saved import session."
    );
  }
};


  const validation = validationResult;
  const conflicts = validation?.conflicts || [];
  const errors = validation?.errors || [];
  const newDevices = validation?.newDevices || [];

  const resolvedCount = conflicts.filter(
    (conflict, index) => {
      const rowId = getConflictRowId(conflict, index);
      return ["update", "skip"].includes(decisions[rowId]);
    }
  ).length;

const insertedCount =
  importResult?.imported_count ??
  importResult?.inserted ??
  importResult?.inserted_count ??
  importResult?.created ??
  importResult?.created_count ??
  importResult?.new_devices ??
  0;

  const updatedCount = Number(
    importResult?.updated_count ??
    importResult?.updated ??
    0
  );

  const skippedCount = Number(
    importResult?.skipped_count ??
    importResult?.skipped ??
    0
  );

  const failedCount =
    importResult?.failed ??
    importResult?.failed_count ??
    null;

const paginate = (items, page) => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
};

const getTotalPages = (items) =>
    Math.max(1, Math.ceil(items.length / PAGE_SIZE));




const renderPagination = (items, page, setPage) => (
  <div className="app-pagination-card">
    <Pagination
      currentPage={page}
      totalPages={getTotalPages(items)}
      totalItems={items.length}
      itemsPerPage={PAGE_SIZE}
      onPageChange={setPage}
    />
  </div>
);




  return (
    <div className="page-container device-import-page">

      {!restoringImportSession && hasSavedImportSession && (
          <FormModal
            title="Resume Import Session"
            subtitle="A previous device import session was found in this browser."
            
            onClose={() => setHasSavedImportSession(false)}
            onSubmit={async (event) => {
              event.preventDefault();

              clearDeviceImportSession();
              await clearDeviceImportFile();

              setHasSavedImportSession(false);
          
            }}
            saving={false}
            submitText="Start New Import"
            modalClassName="device-import-upload-modal"
          >
            <div className="device-import-upload">
              <div className="device-import-upload-icon">
                <FileSpreadsheet size={24} />
              </div>

              <h3>
                Resume your previous import?
              </h3>

              <p>
                Your Excel file and import progress are still available.
              </p>

              <div className="device-import-actions">
                <button
                  type="button"
                  className="device-import-secondary-button"
                  onClick={handleResumeImportSession}
                >
                  Resume Import
                </button>
              </div>
            </div>
          </FormModal>
        )}

        {isReplacingSavedSession && (
          <FormModal
            title="Previous Import Session Found"
            subtitle="An unfinished import session is still saved in this browser."
            onClose={() => setIsReplacingSavedSession(false)}
            onSubmit={async (event) => {
              event.preventDefault();

              clearDeviceImportSession();
              await clearDeviceImportFile();

              setIsReplacingSavedSession(false);
              setIsUploadModalOpen(true);
            }}
            saving={false}
            submitText="Discard & Upload New File"
            modalClassName="device-import-upload-modal"
          >
            <div className="device-import-upload">
              <div className="device-import-upload-icon">
                <AlertCircle size={24} />
              </div>

              <h3>
                Start a new import?
              </h3>

              <p>
                Starting a new import will replace your unfinished
                import session. Any unsaved import decisions or
                validation work in that session will be discarded.
              </p>
              <div className="device-import-actions">
                <button
                  type="button"
                  className="device-import-secondary-button"
                  onClick={handleResumeImportSession}
                >
                  Resume Import
                </button>
              </div>
            </div>
          </FormModal>
        )}

      {isClearConfirmOpen && (
        <FormModal
          title="Clear Import Data?"
          subtitle="This will remove the current Excel file, validation results, import progress, and saved import session."
          onClose={() => setIsClearConfirmOpen(false)}
          onSubmit={async (event) => {
            event.preventDefault();

            await handleStartOver();

            setIsClearConfirmOpen(false);
          }}
          saving={false}
          submitText="Clear"
          modalClassName="device-import-upload-modal"
        >
          <div className="device-import-upload">
            <div className="device-import-upload-icon">
              <AlertCircle size={24} />
            </div>

            <h3>
              Clear the current import?
            </h3>

            <p>
              Your current workbook and import progress will be cleared.
              This action cannot be undone.
            </p>
          </div>
        </FormModal>
      )}


      <PageHeader
        title="Import Devices"
        description="Import and manage your infrastructure devices from an Excel workbook."
        secondaryActionLabel="Clear"
        onSecondaryAction={() => setIsClearConfirmOpen(true)}
        actionLabel="Upload Excel"
        onAction={() => {
          if (getDeviceImportSession()) {
            setIsReplacingSavedSession(true);
            return;
          }

          setIsUploadModalOpen(true);
        }}
      />


        {isUploadModalOpen && (
  <FormModal
    title="Upload Excel File"
    subtitle="Select an Excel workbook to validate device records."
    onClose={() => {
      if (!validating) {
        setIsUploadModalOpen(false);
      }
    }}
    onSubmit={(event) => {
      event.preventDefault();
      handleValidate();
    }}
    saving={validating}
    submitText="Validate File"
    savingText="Validating..."
    modalClassName="device-import-upload-modal"
  >
    <div className="device-import-upload">
      <div className="device-import-upload-icon">
        <Upload size={24} />
      </div>

      <h3>
        {selectedFile
          ? "Excel file selected"
          : "Upload your Excel file"}
      </h3>

      <p>
        {selectedFile
          ? "Your workbook is ready to validate."
          : "Select an .xlsx workbook from your computer."}
      </p>

      <input
        ref={fileInputRef}
        id="device-excel-file"
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        hidden
      />

      <button
        type="button"
        className="device-import-primary-button"
        onClick={() => fileInputRef.current?.click()}
        disabled={validating || committing}
      >
        {selectedFile ? "Choose Another File" : "Choose File"}
      </button>
    </div>

    {validationError && (
      <div
        className="device-import-alert device-import-alert-error"
        role="alert"
      >
        <AlertCircle size={18} />
        <span>{validationError}</span>
      </div>
    )}

    {selectedFile && (
      <div className="device-import-selected-file">
        <div className="device-import-file-info">
          <div className="device-import-file-icon">
            <FileSpreadsheet size={22} />
          </div>

          <div className="device-import-file-details">
            <strong>{selectedFile.name}</strong>
            <p>{formatBytes(selectedFile.size)}</p>
          </div>
        </div>

        <button
          type="button"
          className="device-import-text-button danger"
          onClick={handleRemoveFile}
          disabled={validating || committing}
        >
          <Trash2 size={16} />
          Remove
        </button>
      </div>
    )}

    <div className="device-import-requirements">
      <h3>
        <CircleHelp size={17} />
        File Requirements
      </h3>

      <ul>
        <li>Use Excel workbook format (.xlsx).</li>
        <li>
          Include the required device columns and follow
          the backend's expected column names.
        </li>
        <li>Device name and host/IP must be provided.</li>
      </ul>
    </div>
  </FormModal>
)}


{importScope && (
  <div className="device-import-modal-overlay">
    <div
      className="device-import-progress-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-import-progress-title"
    >
      <div className="device-import-progress-header">
        <div>
          <h2 id="device-import-progress-title">
            {importResult
              ? "Import Completed"
              : "Importing Devices"}
          </h2>

          <p>
            {importResult
              ? "The device import has finished successfully."
              : "Please wait while the selected rows are being imported."}
          </p>
        </div>
      </div>

      <div className="device-import-progress-content">
        {!importResult && !importError && (
          <>
            <div className="device-import-progress-icon">
              <RefreshCw
                size={28}
                className="device-import-spin"
              />
            </div>

            <h3>
              Importing rows...
            </h3>

            <div className="device-import-progress-track">
              <div
                className="device-import-progress-fill"
                style={{
                  width: `${importProgress}%`,
                }}
              />
            </div>

            <div className="device-import-progress-percentage">
              {importProgress}%
            </div>

            <p className="device-import-section-description">
              {importScope === "new"
                ? `Importing ${newDevices.length} new device${
                    newDevices.length === 1 ? "" : "s"
                  }.`
                : `Processing ${conflicts.length} existing-device conflict${
                    conflicts.length === 1 ? "" : "s"
                  }.`}
            </p>
          </>
        )}

        {importError && (
          <div
            className="device-import-alert device-import-alert-error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{importError}</span>
            <button
              type="button"
              onClick={() => {
                setImportError("");
                setImportResult(null);
              }}
              className="device-import-error-close"
            >
              Close
            </button>
          </div>
        )}

        {importResult && (
          <>
            <div className="device-import-progress-icon success">
              <CheckCircle size={32} />
            </div>

            <div className="device-import-progress-track">
              <div
                className="device-import-progress-fill"
                style={{
                  width: "100%",
                }}
              />
            </div>

            <div className="device-import-progress-percentage">
              100%
            </div>

            <div className="device-import-import-result">
              <div className="device-import-alert device-import-alert-success">
                <CheckCircle size={18} />
                <span>
                  The import completed successfully.
                </span>
              </div>

              <div className="device-import-summary-grid">
                {importScope === "new" && (
                  <div className="device-import-summary-item">
                    <span>Imported</span>
                    <strong>
                      {insertedCount ?? 0} out of{" "}
                      {newDevices.length} rows
                    </strong>
                  </div>
                )}

                {importScope === "existing" && (
                  <>
                    <div className="device-import-summary-item">
                      <span>Updated</span>
                      <strong>
                        {updatedCount ?? 0}
                      </strong>
                    </div>

                    <div className="device-import-summary-item">
                      <span>Skipped</span>
                      <strong>
                        {skippedCount ?? 0}
                      </strong>
                    </div>

                    <div className="device-import-summary-item">
                      <span>Total Processed</span>
                      <strong>
                        {conflicts.length} out of{" "}
                        {conflicts.length} rows
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="device-import-progress-footer">
        {!importResult && !importError && (
          <span className="device-import-progress-waiting">
            Import in progress...
          </span>
        )}

        {importResult && (
          <button
            type="button"
            className="device-import-primary-button"
            onClick={handleImportClose}
          >
            Close
          </button>
        )}
      </div>
    </div>
  </div>
)}



<SummaryCards>
  <SummaryCard
    title="Total Rows"
    value={totalRows}
    icon={FileSpreadsheet}
    variant="primary"
  />

  <SummaryCard
    title="Total Uploaded"
    value={totalUploaded}
    icon={CheckCircle}
    variant="success"
  />

  <SummaryCard
    title="Existing Devices"
    value={existingDevices}
    icon={Server}
    variant="warning"
  />

  <SummaryCard
    title="Validation Errors"
    value={validationErrors}
    icon={AlertCircle}
    variant="danger"
  />
</SummaryCards>

{/* ===============validation results ===============*/}

<div className="device-import-table-section device-import-category-card">
  
<div className="device-import-card-header">
  <div style={{ width: "100%" }}>
    <div className="device-import-section-title-row">
      <h3>New Devices ({newDevices.length})</h3>

      <button
        type="button"
        className="device-import-primary-button"
        onClick={()=>handleCommit("new")}
        disabled={
          committing ||
          validating ||
          !validationResult ||          
          newDevices.length === 0
        }
      >
        {committing ? "Importing..." : "Import Devices"}
      </button>
    </div>

    <p className="device-import-section-description">
      These devices are eligible for import.
    </p>
  </div>
</div>
  <DataTable
    columns={newDeviceColumns}
    data={paginate(newDevices, newDevicesPage)}
    rowKey="excel_row"
    emptyMessage="No new devices found."
    renderCell={(row, column) => {
      if (column.key === "row") {
        return getRowNumber(row) ?? "—";
      }

      if (column.key === "device_name") {
        return getDeviceName(row);
      }

      if (column.key === "host") {
        return getHost(row);
      }

      if (column.key === "port") {
    return getPort(row);
    }

    if (column.key === "connection_type") {
    return getConnectionType(row);
    }

    if (column.key === "username") {
    return getUsername(row);
    }

    if (column.key === "remarks") {
    return getDeviceRemarks(row);
    }

      return row[column.key] ?? "—";
    }}
  />

  {renderPagination(
    newDevices,
    newDevicesPage,
    setNewDevicesPage
  )}
</div>


{/*========== Conflict List =========*/}

<div className="device-import-table-section device-import-category-card">
 
<div className="device-import-card-header">
  <div style={{ width: "100%" }}>
    {/* Heading and Import button */}
    <div className="device-import-section-title-row">
      <h3>Existing Devices ({conflicts.length})</h3>

      <button
        type="button"
        className="device-import-primary-button"
        onClick={()=> handleCommit("existing")}
        disabled={
          committing ||
          validating ||
          !validation||
          
          conflicts.length === 0 ||
          !allConflictsResolved()
        }
      >
        {committing ? "Importing..." : "Import Devices"}
      </button>
    </div>

    {/* Description */}
    <p className="device-import-section-description">
      Choose Update or Skip for each conflicting row.
    </p>

    <p className="device-import-section-description">
      Conflicts resolved:{" "}
      {
        conflicts.filter((conflict, index) => {
          const decision = decisions[getConflictRowId(conflict, index)];
          return decision === "update" || decision === "skip";
        }).length
      }{" "}
      / {conflicts.length}
    </p>

    {/* Bulk actions on their own row */}
    <div className="device-import-actions">
      <button
        type="button"
        className="device-import-secondary-button"
        onClick={() => {
          const updated = { ...decisions };
          conflicts.forEach((conflict, index) => {
            updated[getConflictRowId(conflict, index)] = "update";
          });
          setDecisions(updated);

          persistImportSession({
            conflictDecisions: updated,
          });
        }}

        disabled={committing}
      >
        Update All
      </button>

      <button
        type="button"
        className="device-import-secondary-button"
        onClick={() => {
          const updated = { ...decisions };
          conflicts.forEach((conflict, index) => {
            updated[getConflictRowId(conflict, index)] = "skip";
          });
          setDecisions(updated);

          persistImportSession({
            conflictDecisions: updated,
          });
        }}
        disabled={committing}
      >
        Skip All
      </button>
    </div>
  </div>
</div>

  <DataTable
    columns={conflictColumns}
    data={paginate(conflicts, conflictsPage)}
    rowKey="excel_row"
    emptyMessage="No existing-device conflicts found."
    renderCell={(row, column) => {
      const index = conflicts.indexOf(row);
      const rowId = getConflictRowId(row, index);
      const currentDecision = decisions[rowId] || "";

      if (column.key === "row") {
        return getRowNumber(row) ?? "—";
      }

      if (column.key === "device_name") {
        return getDeviceName(row);
      }

      if (column.key === "host") {
        return getHost(row);
      }

if (column.key === "port") {
  return getPort(row);
}

if (column.key === "connection_type") {
  return getConnectionType(row);
}

if (column.key === "username") {
  return getUsername(row);
}

if (column.key === "remarks") {
  return getDeviceRemarks(row);
}

      if (column.key === "decision") {
         return (
          <div className="device-import-conflict-actions">
 

          <label
            className={`device-import-decision ${
              currentDecision === "update" ? "selected" : ""
            }`}
          >
            <input
                type="radio"
                name={`decision-${rowId}`}
                checked={currentDecision === "update"}
                onChange={() => {
                  if (currentDecision !== "update") {
                    handleDecisionChange(rowId, "update");
                  }
                }}
                onClick={() => {
                  if (currentDecision === "update") {
                    handleDecisionChange(rowId, "");
                  }
                }}
                disabled={committing}
              />
            <span>Update</span>
          </label>

          <label
            className={`device-import-decision ${
              currentDecision === "skip" ? "selected" : ""
            }`}
          >
            <input
              type="radio"
              name={`decision-${rowId}`}
              checked={currentDecision === "skip"}
              onChange={() => {
                if (currentDecision !== "skip") {
                  handleDecisionChange(rowId, "skip");
                }
              }}
              onClick={() => {
                if (currentDecision === "skip") {
                  handleDecisionChange(rowId, "");
                }
              }}
              disabled={committing}
            />
            <span>Skip</span>
          </label>
        </div>

        );
      }

      return "—";
    }}
  />

  {renderPagination(
    conflicts,
    conflictsPage,
    setConflictsPage
  )}
</div>


<div className="device-import-table-section device-import-category-card">
  <div className="device-import-card-header">
    <div style={{ width: "100%" }}>
    
     <div className="device-import-section-title-row">
    
      <h3>Validation Errors ({errors.length})</h3>
      <button
        type="button"
        className="device-import-primary-button"
        onClick={handleRevalidateErrors}
        disabled={
          revalidatingErrors ||
          validating ||
          committing ||
          !selectedFile ||
          errors.length === 0
        }
      >
      
        {revalidatingErrors
          ? "Revalidating..."
          : "Revalidate"}
      </button>
      </div>
      <p className="device-import-section-description">
        Correct these rows in the workbook and upload it again.
      </p>
    </div>
    {/* Download action can be added here */}
  </div>

  <DataTable
    columns={errorColumns}
    data={paginate(errors, errorsPage)}
    rowKey="excel_row"
    emptyMessage="No validation errors found."
    renderCell={(row, column) => {
      if (column.key === "row") {
        return getRowNumber(row) ?? "—";
      }

      if (column.key === "device_name") {
        return getDeviceName(row);
      }

      if (column.key === "host") {
        return getHost(row);
      }

if (column.key === "port") {
  return getPort(row);
}

if (column.key === "connection_type") {
  return getConnectionType(row);
}

if (column.key === "username") {
  return getUsername(row);
}
if (column.key === "remarks") {
  return getErrorMessage(row);
}

if (column.key === "action") {
  return (
    <ActionButtons
      onEdit={() => {
        const rowNumber = getRowNumber(row);

        const savedCorrection =
          errorCorrections[String(rowNumber)];

        setEditingErrorRow(row);

        setEditingErrorForm(
          savedCorrection
            ? {
                ...getImportEditFormData(row),
                ...savedCorrection,
                password:
                  savedCorrection.password ?? "",
                device_category_id:
                  savedCorrection.device_category_id == null
                    ? ""
                    : String(
                        savedCorrection.device_category_id
                      ),
              }
            : getImportEditFormData(row)
        );
      }}
    />
  );
}

return row[column.key] ?? "—";
    }}
  />

  {renderPagination(
    errors,
    errorsPage,
    setErrorsPage
  )}

  {editingErrorRow && (
  <FormModal
    title="Edit Import Row"
    subtitle="Correct the validation error before revalidating"
    modalClassName="notification-record-modal"
    onClose={() => setEditingErrorRow(null)}
    onSubmit={handleValidationErrorEditSubmit}
    saving={false}
    submitText="Save Changes"
    savingText="Saving..."
  >
    <div className="device-import-edit-context">
      <div>
        <strong>Excel Row:</strong>{" "}
        {getRowNumber(editingErrorRow) ?? "—"}
      </div>

      <div>
        <strong>Validation Error:</strong>{" "}
        {getErrorMessage(editingErrorRow)}
      </div>

      <div>
        <strong>What to Correct:</strong>{" "}
        Review the validation error above and correct
        the corresponding field below.
      </div>
    </div>

    <div className="form-grid">
      <div className="form-group">
        <label>Device Name</label>
        <input
          type="text"
          name="device_name"
          value={editingErrorForm.device_name}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              device_name: event.target.value,
            }))
          }
          required
        />
      </div>

      <div className="form-group">
        <label>Host</label>
        <input
          type="text"
          name="host"
          value={editingErrorForm.host}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              host: event.target.value,
            }))
          }
          required
        />
      </div>

      <div className="form-group">
        <label>Port</label>
        <input
          type="number"
          name="port"
          value={editingErrorForm.port ?? ""}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              port:
                event.target.value === ""
                  ? null
                  : Number(event.target.value),
            }))
          }
          required
        />
      </div>

      <div className="form-group">
        <label>Connection Type</label>
        <select
          name="connection_type"
          value={getImportSelectValue(
            editingErrorForm.connection_type,
            ["SSH", "RDP", "FTP", "SFTP", "HTTP", "HTTPS"],
            "SSH"
          )}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              connection_type: event.target.value,
            }))
          }
        >
          <option value="SSH">SSH</option>
          <option value="RDP">RDP</option>
          <option value="FTP">FTP</option>
          <option value="SFTP">SFTP</option>
          <option value="HTTP">HTTP</option>
          <option value="HTTPS">HTTPS</option>
        </select>
      </div>

      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={editingErrorForm.username}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              username: event.target.value,
            }))
          }
          required
        />
      </div>

    <div className="form-group">
      <label>Password</label>
      <input
        type="password"
        value={editingErrorForm.password}
        onChange={(e) =>
          setEditingErrorForm((previous) => ({
            ...previous,
            password: e.target.value,
          }))
        }
        placeholder="Enter password only if changing it"
      />
    </div>

      <div className="form-group">
        <label>Device Category</label>
        <SearchableSelect
          value={editingErrorForm.device_category_id}
          onChange={(value) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              device_category_id: value,
            }))
          }
          options={deviceCategories}
          placeholder="Select Category"
          searchPlaceholder="Search device category..."
          getOptionValue={(option) => String(option.id)}
          getOptionLabel={(option) => option.category_name}
        />
      </div>

      <div className="form-group">
        <label>Password Rotation Days</label>
        <select
          name="password_rotation_days"
          value={editingErrorForm.password_rotation_days ?? ""}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              password_rotation_days:
                event.target.value === ""
                  ? null
                  : Number(event.target.value),
            }))
          }
        >
          <option value="">Use Category Default</option>
          <option value="90">90 Days</option>
          <option value="180">180 Days</option>
          <option value="270">270 Days</option>
          <option value="360">360 Days</option>
        </select>
      </div>

      <div className="form-group">
        <label>Status</label>
        <select
          name="device_status"
          value={getImportSelectValue(
            editingErrorForm.device_status,
            ["Active", "Inactive"],
            "Active"
          )}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              device_status: event.target.value,
            }))
          }
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="form-group">
        <label>Device Status</label>
        <select
          name="device_condition"
          value={getImportSelectValue(
            editingErrorForm.device_condition,
            [
              "Reachable",
              "Unreachable",
              "Switched Off",
              "Unused",
            ],
            "Unused"
          )}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              device_condition: event.target.value,
            }))
          }
        >
          <option value="Reachable">Reachable</option>
          <option value="Unreachable">Unreachable</option>
          <option value="Switched Off">Switched Off</option>
          <option value="Unused">Unused</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label>Comments</label>
        <textarea
          name="comments"
          value={editingErrorForm.comments}
          onChange={(event) =>
            setEditingErrorForm((previous) => ({
              ...previous,
              comments: event.target.value,
            }))
          }
          rows="3"
        />
      </div>
    </div>
  </FormModal>
)}

</div>



     
      </div>
    
  );
}

export default DeviceImport;