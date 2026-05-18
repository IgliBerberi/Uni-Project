import { cardBrandLabel, formatExpiry } from '../utils/cardDisplay';
import './SavedCardSelector.css';

export default function SavedCardSelector({
  cards,
  selectedId,
  onSelect,
  onDelete,
}) {
  if (cards.length === 0) return null;

  return (
    <div className="saved-cards">
      <p className="saved-cards-title">Saved payment methods</p>
      <ul className="saved-cards-list">
        {cards.map((card) => (
          <li key={card.id}>
            <label className={`saved-card-option ${selectedId === card.id ? 'selected' : ''}`}>
              <input
                type="radio"
                name="saved_card"
                checked={selectedId === card.id}
                onChange={() => onSelect(card.id)}
              />
              <span className="saved-card-visual" aria-hidden>
                <span className={`card-chip card-chip--${card.card_brand}`}>
                  {cardBrandLabel(card.card_brand).charAt(0)}
                </span>
                <span className="saved-card-digits">•••• •••• •••• {card.last_four}</span>
              </span>
              <span className="saved-card-meta">
                <strong>{card.label || `${cardBrandLabel(card.card_brand)} •••• ${card.last_four}`}</strong>
                <small>
                  {card.cardholder_name} · Exp {formatExpiry(card.expiry_month, card.expiry_year)}
                </small>
              </span>
            </label>
            <button
              type="button"
              className="saved-card-remove"
              onClick={() => onDelete(card.id)}
              aria-label="Remove saved card"
            >
              ×
            </button>
          </li>
        ))}
        <li>
          <label className={`saved-card-option ${selectedId === 'new' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="saved_card"
              checked={selectedId === 'new'}
              onChange={() => onSelect('new')}
            />
            <span className="saved-card-meta">
              <strong>Use a new card</strong>
              <small>Enter different payment details</small>
            </span>
          </label>
        </li>
      </ul>
    </div>
  );
}
