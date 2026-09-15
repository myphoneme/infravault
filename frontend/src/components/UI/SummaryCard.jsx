import "./SummaryCard.css";

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  variant = "primary",
}) => {
  return (
    <div className={`summary-card summary-card-${variant}`}>
      <div className="summary-card-icon">
        <Icon size={32} strokeWidth={2} />
      </div>

      <div className="summary-card-content">
        <span className="summary-card-label">
          {title}
        </span>

        <strong className="summary-card-number">
          {value}
        </strong>
      </div>
    </div>
  );
};

export default SummaryCard;