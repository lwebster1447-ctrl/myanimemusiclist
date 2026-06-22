export default function StarRating({ value = 0, onChange, max = 5 }) {
  return (
    <div className="star-rating" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={filled}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            className={filled ? "filled" : ""}
            onClick={() => onChange?.(starValue === value ? 0 : starValue)}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
