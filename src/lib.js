export const STAGE_LABELS = {
  "5698192615": "In Progress",
  "5698192620": "Closed Won",
};

export function stageLabel(id) {
  return STAGE_LABELS[id] || id || "Unknown";
}

export const EXPENSE_CATEGORIES = ["Software", "Infrastructure", "Marketing", "Contractors", "Other"];
