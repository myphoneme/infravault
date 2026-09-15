import "./SummaryCards.css";

const SummaryCards = ({ children }) => {
  return (
    <div className="summary-cards">
      {children}
    </div>
  );
};

export default SummaryCards;