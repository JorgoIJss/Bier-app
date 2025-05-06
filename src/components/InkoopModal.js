import React, { useState } from 'react';
import PropTypes from 'prop-types';

const InkoopModal = ({ onClose, onAddBeer }) => {
    const [newBeer, setNewBeer] = useState({
        naam: "",
        brouwerij: "",
        type: "",
        alcohol: 0,
        prijs: 0,
        beschrijving: ""
    });

    const [errors, setErrors] = useState({});

    const validateField = (field, value) => {
        switch (field) {
            case 'alcohol':
                return value >= 0 && value <= 100 ? '' : 'Alcoholpercentage moet tussen 0 en 100 liggen';
            case 'prijs':
                return value >= 0 ? '' : 'Prijs mag niet negatief zijn';
            case 'naam':
            case 'brouwerij':
            case 'type':
                return value.trim() ? '' : 'Dit veld is verplicht';
            default:
                return '';
        }
    };

    const handleChange = (field, value) => {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
        
        setNewBeer({
            ...newBeer,
            [field]: value
        });
    };

    const handleSubmit = () => {
        // Valideer alle velden
        const newErrors = {};
        Object.keys(newBeer).forEach(field => {
            const error = validateField(field, newBeer[field]);
            if (error) newErrors[field] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onAddBeer(newBeer);
        onClose();
    };

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-content">
                <h2 id="modal-title">Nieuw Bier Toevoegen</h2>
                <div className="modal-form">
                    <div className="form-group">
                        <label htmlFor="naam">Naam *</label>
                        <input
                            type="text"
                            id="naam"
                            value={newBeer.naam}
                            onChange={(e) => handleChange('naam', e.target.value)}
                            required
                            aria-required="true"
                            aria-invalid={!!errors.naam}
                        />
                        {errors.naam && <span className="error-message">{errors.naam}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="brouwerij">Brouwerij *</label>
                        <input
                            type="text"
                            id="brouwerij"
                            value={newBeer.brouwerij}
                            onChange={(e) => handleChange('brouwerij', e.target.value)}
                            required
                            aria-required="true"
                            aria-invalid={!!errors.brouwerij}
                        />
                        {errors.brouwerij && <span className="error-message">{errors.brouwerij}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="type">Type *</label>
                        <input
                            type="text"
                            id="type"
                            value={newBeer.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            required
                            aria-required="true"
                            aria-invalid={!!errors.type}
                        />
                        {errors.type && <span className="error-message">{errors.type}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="alcohol">Alcohol %</label>
                        <input
                            type="number"
                            id="alcohol"
                            step="0.1"
                            min="0"
                            max="100"
                            value={newBeer.alcohol}
                            onChange={(e) => handleChange('alcohol', parseFloat(e.target.value))}
                            aria-invalid={!!errors.alcohol}
                        />
                        {errors.alcohol && <span className="error-message">{errors.alcohol}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="prijs">Prijs (€) *</label>
                        <input
                            type="number"
                            id="prijs"
                            step="0.01"
                            min="0"
                            value={newBeer.prijs}
                            onChange={(e) => handleChange('prijs', parseFloat(e.target.value))}
                            required
                            aria-required="true"
                            aria-invalid={!!errors.prijs}
                        />
                        {errors.prijs && <span className="error-message">{errors.prijs}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="beschrijving">Beschrijving</label>
                        <textarea
                            id="beschrijving"
                            value={newBeer.beschrijving}
                            onChange={(e) => handleChange('beschrijving', e.target.value)}
                            rows="3"
                        />
                    </div>

                    <div className="modal-buttons">
                        <button onClick={handleSubmit}>Toevoegen</button>
                        <button onClick={onClose}>Annuleren</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

InkoopModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onAddBeer: PropTypes.func.isRequired
};

export default InkoopModal;
