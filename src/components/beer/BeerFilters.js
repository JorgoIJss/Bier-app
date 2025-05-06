import React from 'react';

const BeerFilters = ({ filters, onFilterChange, onResetFilters }) => {
    return (
        <div className="beer-filters">
            <div className="filter-group">
                <label>Status:</label>
                <select 
                    value={filters.status} 
                    onChange={(e) => onFilterChange('status', e.target.value)}
                >
                    <option value="">Alle</option>
                    <option value="Available">Beschikbaar</option>
                    <option value="Unavailable">Niet beschikbaar</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Type:</label>
                <select 
                    value={filters.type} 
                    onChange={(e) => onFilterChange('type', e.target.value)}
                >
                    <option value="">Alle</option>
                    <option value="Pils">Pils</option>
                    <option value="Speciaalbier">Speciaalbier</option>
                    <option value="Trappist">Trappist</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Prijs:</label>
                <select 
                    value={filters.price} 
                    onChange={(e) => onFilterChange('price', e.target.value)}
                >
                    <option value="">Alle</option>
                    <option value="0-2.5">€0 - €2.50</option>
                    <option value="2.5-3.5">€2.50 - €3.50</option>
                    <option value="3.5-5.5">€3.50 - €5.50</option>
                    <option value="5.5+">€5.50+</option>
                </select>
            </div>

            <button onClick={onResetFilters} className="reset-filters">
                Filters resetten
            </button>
        </div>
    );
};

export default BeerFilters; 