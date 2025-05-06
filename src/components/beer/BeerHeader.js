import React from 'react';

const BeerHeader = ({ 
    isAdmin, 
    onOpenAddBeerModal, 
    onOpenAdminLoginModal, 
    onOpenColorExplanationModal,
    onPrintPDF,
    onExportExcel
}) => {
    return (
        <div className="beer-header">
            <div className="header-left">
                <h1>Bierlijst</h1>
            </div>
            
            <div className="header-right">
                <button onClick={onOpenColorExplanationModal} className="color-explanation-btn">
                    Kleuren uitleg
                </button>
                
                <button onClick={onPrintPDF} className="print-btn">
                    PDF Exporteren
                </button>
                
                <button onClick={onExportExcel} className="excel-btn">
                    Excel Exporteren
                </button>
                
                {isAdmin ? (
                    <button onClick={onOpenAddBeerModal} className="add-beer-btn">
                        Bier toevoegen
                    </button>
                ) : (
                    <button onClick={onOpenAdminLoginModal} className="admin-login-btn">
                        Admin Login
                    </button>
                )}
            </div>
        </div>
    );
};

export default BeerHeader; 