import React, { useState } from 'react';
import BeerScore from '../BeerScore';

const BeerRow = ({ beer, votedBeers, handleBeerVote, preferences }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    console.log("BeerRow rendering for beer:", beer?.naam || "unknown");

    // Controleer of we een geldig biertje hebben
    if (!beer || typeof beer !== 'object') {
        console.error("BeerRow kreeg een ongeldig of geen biertje:", beer);
        return null;
    }

    // Fallback voor ontbrekende preferences
    const safePreferences = preferences || { invisibleBeers: [], strikedBeers: [] };

    const toggleOpen = () => {
        const isUnavailable = beer.status === 'Unavailable';
        const isStriked = safePreferences.strikedBeers.includes(beer.id) && isUnavailable;

        if (!isStriked) {
            setIsOpen(!isOpen);
        }
    };

    const isUnavailable = beer.status === 'Unavailable';
    const isHidden = safePreferences.invisibleBeers.includes(beer.id) && isUnavailable;
    const isStriked = safePreferences.strikedBeers.includes(beer.id) && isUnavailable;

    if (isHidden) return null;

    return (
        <div className={`beer-row ${isStriked ? 'striked' : ''}`}>
            <div className="beer-main-row" onClick={toggleOpen}>
                <div className="beer-name">
                    {beer.naam}
                </div>
                <div className="beer-price">â‚¬{(parseFloat(beer.prijs) || 0).toFixed(2)}</div>
                <div className="beer-score">
                    <BeerScore 
                        beerId={beer.id}
                        score={votedBeers && votedBeers[beer.id] ? votedBeers[beer.id] : 0}
                        onVote={handleBeerVote || (() => console.log("No vote handler provided"))}
                    />
                </div>
            </div>
            {isOpen && (
                <div className="beer-details">
                    <p><strong>Brouwerij:</strong> {beer.brouwerij || beer.brouwer || "Onbekend"}</p>
                    <p><strong>Type:</strong> {beer.type || "Onbekend"}</p>
                    <p><strong>Alcohol:</strong> {beer.alcohol || beer.alcoholpercentage || "?"}&nbsp;%</p>
                    <p><strong>Beschrijving:</strong> {beer.beschrijving || "Geen beschrijving beschikbaar"}</p>
                    <p><strong>Score:</strong> {beer.avg_score || '-'}</p>
                </div>
            )}
        </div>
    );
};

export default BeerRow; 