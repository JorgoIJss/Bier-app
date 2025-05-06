import React from "react";

const stars = [1, 2, 3, 4, 5];

const BeerScore = ({ beerId, score, onVote }) => {
    return (
        <div className="beer-score">
            {score > 0 ? (
                <div>
                    {stars.map((star) => (
                        <span
                            key={star}
                            onClick={() => onVote(beerId, star)}
                            style={{ 
                                cursor: "pointer", 
                                color: star <= score ? "gold" : "gray" 
                            }}
                        >
                            ★
                        </span>
                    ))}
                </div>
            ) : (
                <div>
                    {stars.map((star) => (
                        <span
                            key={star}
                            onClick={() => onVote(beerId, star)}
                            style={{ cursor: "pointer", color: "gray" }}
                        >
                            ★
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BeerScore;