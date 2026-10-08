import "./SummaryCard.css";

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  variant = "primary",
  onClick,
}) => {
  const handleKeyDown = (event) => {
    if (!onClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`summary-card summary-card-${variant}${
        onClick ? " summary-card-clickable" : ""
      }`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="summary-card-icon">
        <Icon size={32} strokeWidth={2} />
      </div>

      <div className="summary-card-content">
        <span className="summary-card-label">{title}</span>
        <strong className="summary-card-number">{value}</strong>
      </div>
        {onClick && (
                <span className="summary-card-action" aria-hidden="true">
    
                  <span className="summary-card-action-arrow">→</span>
                </span>
              )}

    </div>
  );
};

export default SummaryCard;