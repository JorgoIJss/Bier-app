import React from 'react';

const ColorExplanationModal = ({ showColorExplanation, toggleColorExplanation }) => {
  // Conditionally render the modal based on showColorExplanation
  if (!showColorExplanation) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={toggleColorExplanation}>×</span>
        <h2>Uitleg Kleuren</h2>
        <table>
          <thead>
            <tr>
              <th>Kleur</th>
              <th>Prijsklasse</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="color-box green"></span></td>
              <td> {"<= €2,50"}</td>
            </tr>
            <tr>
              <td><span className="color-box blue"></span></td>
              <td> {"<= €3,50"}</td>
            </tr>
            <tr>
              <td><span className="color-box yellow"></span></td>
              <td> {"<= €5,50"}</td>
            </tr>
            <tr>
              <td><span className="color-box lightpink"></span></td>
              <td> {"<= €10"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColorExplanationModal;