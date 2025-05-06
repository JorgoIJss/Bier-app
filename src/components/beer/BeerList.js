import React from 'react';
import BeerRow from './BeerRow';

const BeerList = ({ beers, votedBeers, handleBeerVote, preferences, sortField, sortDirection }) => {
    console.log("BeerList rendering met bieren:", beers?.length || 0);
    
    // Controleer of beers een array is
    if (!beers || !Array.isArray(beers)) {
        console.error("BeerList heeft geen geldige bieren array gekregen:", beers);
        return (
            <div className="beer-list">
                <div className="beer-list-header">
                    <div className="beer-list-header-row">
                        <div className="header-name">Naam</div>
                        <div className="header-price">Prijs</div>
                        <div className="header-score">Score</div>
                    </div>
                </div>
                <div className="beer-list-empty-message">
                    <p>Geen bieren beschikbaar om weer te geven.</p>
                </div>
            </div>
        );
    }
    
    // Als er geen bieren zijn, toon een melding
    if (beers.length === 0) {
        return (
            <div className="beer-list">
                <div className="beer-list-header">
                    <div className="beer-list-header-row">
                        <div className="header-name">Naam</div>
                        <div className="header-price">Prijs</div>
                        <div className="header-score">Score</div>
                    </div>
                </div>
                <div className="beer-list-empty-message">
                    <p>Geen bieren beschikbaar om weer te geven.</p>
                </div>
            </div>
        );
    }
    
    // Sorteer de bieren veilig
    const sortedBeers = [...beers].sort((a, b) => {
        try {
            if (sortField === 'naam') {
                const aName = a.naam || '';
                const bName = b.naam || '';
                return sortDirection === 'asc' 
                    ? aName.localeCompare(bName)
                    : bName.localeCompare(aName);
            }
            
            const aValue = a[sortField] || 0;
            const bValue = b[sortField] || 0;
            
            return sortDirection === 'asc' 
                ? aValue - bValue
                : bValue - aValue;
        } catch (error) {
            console.error("Error bij sorteren bieren:", error);
            return 0;
        }
    });

    return (
        <div className="beer-list">
            <div className="beer-list-header">
                <div className="beer-list-header-row">
                    <div className="header-name">Naam</div>
                    <div className="header-price">Prijs</div>
                    <div className="header-score">Score</div>
                </div>
            </div>
            <div className="beer-list-content">
                {sortedBeers.map(beer => (
                    <BeerRow
                        key={beer.id}
                        beer={beer}
                        votedBeers={votedBeers}
                        handleBeerVote={handleBeerVote}
                        preferences={preferences}
                    />
                ))}
            </div>
        </div>
    );
};

export default BeerList; 