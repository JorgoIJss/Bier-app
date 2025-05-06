import React, { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import AdminLoginModal from "./components/AdminLoginModal";
import ColorExplanationModal from "./components/ColorExplanationModal";
import BeerScore from "./components/BeerScore";
import InkoopModal from "./components/InkoopModal";
import BeerHeader from "./components/beer/BeerHeader";
import BeerList from "./components/beer/BeerList";
import BeerFilters from "./components/beer/BeerFilters";
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Import logo direct als string-URL
const logoImage = "https://placehold.co/400x400/FFC107/000000?text=BIERLIJST";

// Helper functions
Object.groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

const CollapsibleBeerRow = ({ beer, votedBeers, handleBeerVote, preferences }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getPriceColor = (price) => {
        if (price <= 2.5) return "green";
        if (price <= 3.5) return "blue";
        if (price <= 5.5) return "yellow";
        if (price <= 10) return "lightpink";
        return "transparent";
    };

    const toggleOpen = () => {
        const isUnavailable = beer.status === 'Unavailable';
        const isStriked = preferences.strikedBeers.includes(beer.id) && isUnavailable;

        if (!isStriked) {
            setIsOpen(!isOpen);
        }
    };

    const isUnavailable = beer.status === 'Unavailable';
    const isHidden = preferences.invisibleBeers.includes(beer.id) && isUnavailable;
    const isStriked = preferences.strikedBeers.includes(beer.id) && isUnavailable;

    const mainRowClass = isStriked ? "beer-main-row striked" : "beer-main-row";

    return (
        <div className={`beer-row ${isHidden ? 'hidden-beer' : ''}`}>
            <div className={mainRowClass} onClick={toggleOpen} style={{ textDecoration: isStriked ? 'line-through' : 'none' }}>
                <span className="beer-color-indicator" style={{ backgroundColor: getPriceColor(beer.prijs) }}></span>
                <span className="beer-name">{beer.naam}</span>
                <span className="beer-type">{beer.type}</span>
                {!isStriked && <span className="expand-icon">{isOpen ? "▼" : "►"}</span>}
            </div>
            {isOpen && !isStriked && (
                <div className="beer-details">
                    <div className="beer-detail-row">
                        <div className="beer-detail-label"><strong>Brouwer:</strong></div>
                        <div className="beer-detail-value">{beer.brouwer}</div>
                    </div>
                    <div className="beer-detail-row">
                        <div className="beer-detail-label"><strong>Prijs:</strong></div>
                        <div className="beer-detail-value">€{parseFloat(beer.prijs).toFixed(2)}</div>
                    </div>
                    <div className="beer-detail-row">
                        <div className="beer-detail-label"><strong>Alcohol %:</strong></div>
                        <div className="beer-detail-value">{beer.alcoholpercentage}%</div>
                    </div>
                    <div className="beer-detail-row">
                        <div className="beer-detail-label"><strong>Amervallei score:</strong></div>
                        <div className="beer-detail-value">{beer.avg_score}</div>
                    </div>
                    <div className="beer-detail-row">
                        <div className="beer-detail-label"><strong>Opmerkingen:</strong></div>
                        <div className="beer-detail-value">{beer.remark}</div>
                    </div>
                    <div className="beer-detail-row">
                        <div className="beer-detail-label"><strong>Aantal ratings:</strong></div>
                        <div className="beer-detail-value">{beer.vote_count || 0}</div>
                    </div>
                    <div className="beer-detail-row">
                        <div className="beer-detail-label"><strong>Beoordeling:</strong></div>
                        <div className="beer-detail-value">
                            <BeerScore
                                beerId={beer.id}
                                hasVoted={!!votedBeers[beer.id]}
                                onVote={handleBeerVote}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Test bieren voor als de API niet beschikbaar is
const TEST_BEERS = [
    {
        id: 1,
        naam: "Hertog Jan Pilsener",
        brouwerij: "Hertog Jan",
        brouwer: "Hertog Jan",
        type: "Pilsener",
        alcohol: 5.1,
        alcoholpercentage: 5.1,
        prijs: 2.25,
        status: "Available",
        beschrijving: "Een verfrissend pilsener bier met een volle smaak en lichte bitterheid.",
        avg_score: 4.2,
        vote_count: 45
    },
    {
        id: 2,
        naam: "Leffe Blond",
        brouwerij: "AB InBev",
        brouwer: "AB InBev",
        type: "Abdijbier",
        alcohol: 6.6,
        alcoholpercentage: 6.6,
        prijs: 3.75,
        status: "Available",
        beschrijving: "Een zacht, moutig en fruitig bier met een rijke schuimkraag.",
        avg_score: 4.5,
        vote_count: 32
    },
    {
        id: 3,
        naam: "Duvel",
        brouwerij: "Duvel Moortgat",
        brouwer: "Duvel Moortgat",
        type: "Strong Ale",
        alcohol: 8.5,
        alcoholpercentage: 8.5,
        prijs: 4.25,
        status: "Available",
        beschrijving: "Een sterk blond bier met een uitgesproken hopkarakter.",
        avg_score: 4.7,
        vote_count: 41
    },
    {
        id: 4,
        naam: "La Chouffe",
        brouwerij: "Achouffe",
        brouwer: "Achouffe",
        type: "Blond",
        alcohol: 8.0,
        alcoholpercentage: 8.0,
        prijs: 4.50,
        status: "Available",
        beschrijving: "Ongefilterd blond bier met een fruitige smaak en subtiele kruidentonen.",
        avg_score: 4.4,
        vote_count: 28
    },
    {
        id: 5,
        naam: "Tripel Karmeliet",
        brouwerij: "Brouwerij Bosteels",
        brouwer: "Brouwerij Bosteels",
        type: "Tripel",
        alcohol: 8.4,
        alcoholpercentage: 8.4,
        prijs: 4.75,
        status: "Available",
        beschrijving: "Gebrouwen volgens een authentiek bierrecept uit 1679 van het klooster 'De Karmelieten'.",
        avg_score: 4.8,
        vote_count: 39
    },
    {
        id: 6,
        naam: "Westmalle Dubbel",
        brouwerij: "Westmalle",
        brouwer: "Westmalle",
        type: "Dubbel",
        alcohol: 7.0,
        alcoholpercentage: 7.0,
        prijs: 4.10,
        status: "Available",
        beschrijving: "Roodbruin trappistenbier met een rijke, complexe smaak.",
        avg_score: 4.6,
        vote_count: 26
    },
    {
        id: 7,
        naam: "Grolsch Premium Pilsner",
        brouwerij: "Grolsch",
        brouwer: "Grolsch",
        type: "Pilsener",
        alcohol: 5.0,
        alcoholpercentage: 5.0,
        prijs: 2.10,
        status: "Available",
        beschrijving: "Een karaktervol pilsener met een bittertje en een frisse afdronk.",
        avg_score: 3.9,
        vote_count: 33
    },
    {
        id: 8,
        naam: "Weihenstephaner Hefeweissbier",
        brouwerij: "Weihenstephaner",
        brouwer: "Weihenstephaner",
        type: "Weizen",
        alcohol: 5.4,
        alcoholpercentage: 5.4,
        prijs: 3.85,
        status: "Available",
        beschrijving: "Troebel tarwebier met aroma's van banaan en kruidnagel.",
        avg_score: 4.7,
        vote_count: 31
    },
    {
        id: 9,
        naam: "Guinness Draught",
        brouwerij: "Guinness",
        brouwer: "Guinness",
        type: "Stout",
        alcohol: 4.2,
        alcoholpercentage: 4.2,
        prijs: 4.15,
        status: "Available",
        beschrijving: "Donker bier met een romige textuur en smaken van koffie en chocolade.",
        avg_score: 4.3,
        vote_count: 37
    },
    {
        id: 10,
        naam: "Franziskaner Weissbier",
        brouwerij: "Spaten-Franziskaner",
        brouwer: "Spaten-Franziskaner",
        type: "Weizen",
        alcohol: 5.0,
        alcoholpercentage: 5.0,
        prijs: 3.65,
        status: "Unavailable",
        beschrijving: "Volmondig Duits tarwebier met fruitige en kruidige aroma's.",
        avg_score: 4.2,
        vote_count: 24
    }
];

const App = () => {
    const [beers, setBeers] = useState(TEST_BEERS);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    const [previewData, setPreviewData] = useState([]);
    const [votedBeers, setVotedBeers] = useState({});
    const [gildeavondDateInput, setGildeavondDateInput] = useState(null);
    const [beers_gildeavond, setBeers_Gildeavond] = useState([]);
    const [showGildeavondInput, setShowGildeavondInput] = useState(false);
    const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
    const [showInkoopModal, setShowInkoopModal] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [appHidden, setAppHidden] = useState(true);
    const [activeTab, setActiveTab] = useState('beers');
    const [preferences, setPreferences] = useState({
        invisibleBeers: [],
        strikedBeers: [],
        invisibleBeersName: 'invisibleBeers',
        strikedBeersName: 'strikedBeers',
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedGildeavond, setSelectedGildeavond] = useState("All dates");
    const [latestGildeavondDate, setLatestGildeavondDate] = useState(null);
    const [showColorExplanation, setShowColorExplanation] = useState(false);
    const [selectedBeers, setSelectedBeers] = useState([]);
    const [sortField, setSortField] = useState('naam');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        price: ''
    });
    const [printGildeavondDate, setPrintGildeavondDate] = useState(null);
    const [selectedBeerDetails, setSelectedBeerDetails] = useState(null);
    const [eerderGeserveerdData, setEerderGeserveerdData] = useState([]);
    const [inkopenData, setInkopenData] = useState([]);
    const [newPurchase, setNewPurchase] = useState({
        beer_id: null,
        leverancier: "",
        inkoopdatum: "",
        inkoopprijs: "",
        inkoopaantal: ""
    });
    const [filteredInkopenData, setFilteredInkopenData] = useState([]);
    const [newBeer, setNewBeer] = useState({
        naam: "",
        brouwer: "",
        type: "",
        alcoholpercentage: "",
        prijs: "",
        remark: "",
        avg_score: 0,
        inkoopprijs: "",
        voorraad_aantal: 0,
        koelkast: ""
    });
    const [gildeavondFilter, setGildeavondFilter] = useState("All dates");
    const [uniqueGildeavondDates, setUniqueGildeavondDates] = useState([]);
    const [transferKoelkast, setTransferKoelkast] = useState('Links');
    const tableRef = useRef(null);
    const [tableContainerHeight, setTableContainerHeight] = useState('auto');
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showAddBeerModal, setShowAddBeerModal] = useState(false);
    const [uniqueGildeavonden, setUniqueGildeavonden] = useState(["All dates"]);
     const [showPrintModal, setShowPrintModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminAuthenticated, setAdminAuthenticated] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        hideUnavailable: false,
        hideStriked: false,
        hideHidden: true,
        searchTerm: '',
        sortBy: 'name',
        sortDirection: 'asc'
    });
    const [isLoading, setIsLoading] = useState(true);

    const handleBeerSelect = (beer) => {
        setSelectedBeerDetails(beer);
        fetchEerderGeserveerdData(beer.id);
        fetchInkopenData(beer.id);
        if (beer) {
            setFilteredInkopenData(inkopenData.filter(purchase => purchase.beer_id === beer.id));
        } else {
            setFilteredInkopenData([]);
        }
    };

    const adjustTableHeight = () => {
        if (tableRef.current) {
            const headerHeight = document.querySelector('.app-header').offsetHeight + document.querySelector('.admin-tabs').offsetHeight + document.querySelector('.admin-controls').offsetHeight
            const availableHeight = window.innerHeight - headerHeight - 200;
            setTableContainerHeight(availableHeight > 200 ? `${availableHeight}px` : "300px");
        }
    };

    useEffect(() => {
        console.log("App component geladen, initialisatie start");
        
        const initializeApp = async () => {
            try {
                console.log("App initialiseert...");
                
                // Probeer data te laden, maar gebruik altijd testdata als backup
                setBeers(TEST_BEERS); // Zet altijd eerst de testdata
                
                try {
                    await fetchBeers();
                    await fetchVotedBeers();
                    await fetchPreferences();
                    await fetchGildeavondBeers();
                    console.log("API data succesvol geladen");
                } catch (error) {
                    console.error("API's niet beschikbaar, gebruik testdata:", error);
                    // Testdata blijft behouden omdat we die al hebben ingesteld
                }
                
                // Splash screen altijd verbergen, zelfs als er fouten zijn
        setTimeout(() => {
                    console.log("Splash screen timer afgelopen, hiding splash en tonen app");
            setShowSplash(false);
            setAppHidden(false);
        }, 2000);
            } catch (error) {
                console.error('Kritieke fout bij initialiseren app:', error);
                // Zelfs bij fatale fouten, toon de app
                setShowSplash(false);
                setAppHidden(false);
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (beers.length > 0 && activeTab === 'beers') {
            handleBeerSelect(beers[0]);
        } else if (activeTab === 'inkopen') {
            // Laad alle inkopen data bij het openen van de inkopen tab
            fetchInkopenData();
        } else if (activeTab === 'gildeavondBeers') {
            fetchGildeavondBeers();
        }
    }, [activeTab, beers]);

    const fetchPreferences = async () => {
        try {
            const response = await fetch("/api/preferences");
            if (response.ok) {
                const data = await response.json();
                setPreferences({
                    invisibleBeers: data.invisible_beers || [],
                    strikedBeers: data.striked_beers || [],
                    invisibleBeersName: data.invisible_beers_name || 'invisibleBeers',
                    strikedBeersName: data.striked_beers_name || 'strikedBeers',
                });
            } else {
                console.error('Voorkeurdata niet beschikbaar, gebruik standaardwaarden');
                // Behoud standaard voorkeuren
            }
        } catch (error) {
            console.error('Error bij voorkeuren:', error);
            // Behoud standaard voorkeuren
        }
    };

    const fetchGildeavondBeers = async () => {
        try {
            const response = await fetch("/api/gildeavondBeers");
            if (response.ok) {
            const data = await response.json();

            // Find the latest gildeavond_date
            const latestDate = data.reduce((latest, current) => {
                const currentDate = new Date(current.gildeavond_date);
                return currentDate > latest ? currentDate : latest;
            }, new Date(0));

            setLatestGildeavondDate(latestDate.toLocaleDateString('nl-NL'));

            if (gildeavondFilter === "All dates") {
                setBeers_Gildeavond(data);
            } else  {
                const filteredData = data.filter(beer => new Date(beer.gildeavond_date).toLocaleDateString('nl-NL') === gildeavondFilter);
                setBeers_Gildeavond(filteredData);
            }

            // Extract and format unique gildeavond dates
            const uniqueDates = Array.from(new Set(data.map(beer => new Date(beer.gildeavond_date).toLocaleDateString('nl-NL'))));
                setUniqueGildeavondDates(["All dates", ...uniqueDates]);
            } else {
                console.error("Error fetching gildeavond beers: API response not OK");
            }
        } catch (error) {
            console.error("Error fetching gildeavond beers:", error);
        }
    };

    const fetchBeers = async () => {
        console.log("fetchBeers functie wordt aangeroepen");
        try {
            // Hier zou normaal het API-endpoint staan, maar we gebruiken een timeout als simulatie
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('API timeout')), 5000)
            );
            
            console.log("API verzoek start naar /api/beers");
            // Race tussen het normale API-verzoek en de timeout
            const response = await Promise.race([
                fetch('/api/beers'),
                timeoutPromise
            ]);
            
            if (!response.ok) {
                throw new Error(`API response niet ok: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`API response ontvangen met ${data?.length || 0} bieren`);
            
            if (Array.isArray(data) && data.length > 0) {
                console.log(`${data.length} bieren geladen van API`);
                setBeers(data);
            } else {
                console.log("Geen bieren van API, behoud testdata");
                // Behoud de testdata die we al hebben ingesteld
            }
        } catch (error) {
            console.error(`Error bij bierdata: ${error.message}`);
            console.log("API-call mislukt, behoud testdata");
            // Behoud de testdata die we al hebben ingesteld in initializeApp
        }
    };

    const fetchVotedBeers = async () => {
        try {
            const response = await fetch("/api/beers/score");
            const data = await response.json();
            setVotedBeers(data.votedBeers || {});
        } catch (error) {
            console.error("Error fetching voted beers:", error);
        }
    };

    const handleUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const abuf = e.target.result;
            const wb = XLSX.read(abuf, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            let data = XLSX.utils.sheet_to_json(sheet);

            setPreviewData(data);

            setShowGildeavondInput(true);
        };

        reader.readAsArrayBuffer(file);
    };

    const handleAdminLogin = async () => {
        if (adminPassword === "admin123") {
            setIsAdmin(true);
            setShowAdminLoginModal(false);

            try {
                await fetchBeers(true);
            } catch (error) {
                console.error("Error fetching beers for admin:", error);
                alert("Failed to fetch beers for admin.");
            }
        } else {
            alert("Incorrect password");
        }
    };

    const handleGildeavondBeersStatusToggle = async (id) => {
        const beer = beers_gildeavond.find((b) => b.id === id);
        const newStatus = beer.status === "Available" ? "Unavailable" : "Available";

        try {
            const response = await fetch(`/api/gildeavondBeers?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                const updatedBeer = await response.json();
                // Update direct de lokale staat
                const updatedBeers = beers_gildeavond.map((b) => 
                    b.id === id ? { ...b, ...updatedBeer } : b
                );
                setBeers_Gildeavond(updatedBeers);
                
                // Update ook de hoofdlijst van bieren als het dezelfde ID betreft
                setBeers(prevBeers => 
                    prevBeers.map(b => 
                        b.id === id ? { ...b, status: newStatus } : b
                    )
                );
                
                // Haal de bierlijsten opnieuw op
                fetchGildeavondBeers();
                fetchBeers(isAdmin);
                
                console.log(`Bierstatus bijgewerkt naar: ${newStatus}`);
            } else {
                const errorData = await response.json()
                alert(`Status bijwerken mislukt: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Fout bij status bijwerken:", error);
            alert("Status bijwerken mislukt");
        }
    };

    const handleDeleteGildeavondBeer = async (id) => {
        if (window.confirm("Are you sure you want to delete this beer?")) {
            try {
                const response = await fetch(`/api/gildeavondBeers?id=${id}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    setBeers_Gildeavond((prevBeers) => prevBeers.filter((beer) => beer.id !== id));
                    fetchGildeavondBeers();
                } else {
                    const errorData = await response.json();
                    alert(`Failed to delete beer: ${errorData.error}`);
                }
            } catch (error) {
                console.error("Error deleting beer:", error);
                alert("Failed to delete beer");
            }
        }
    };

    const handleFieldEdit = async (id, field, value) => {
        try {
            const response = await fetch(`/api/beers?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            });

            if (response.ok) {
                const updatedBeer = await response.json();
                setBeers((prevBeers) =>
                    prevBeers.map((beer) =>
                        beer.id === id ? { ...beer, ...updatedBeer } : beer
                    )
                );
            } else {
                const errorData = await response.json()
                alert(`Failed to update beer: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error updating beer:", error);
            alert("Failed to update beer");
        }
    };

    const handleDeleteBeer = async (id) => {
        if (window.confirm("Are you sure you want to delete this beer?")) {
            try {
                const response = await fetch(`/api/beers?id=${id}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    setBeers((prevBeers) => prevBeers.filter((beer) => beer.id !== id));
                } else {
                    const errorData = await response.json()
                    alert(`Failed to delete beer: ${errorData.error}`);
                }
            } catch (error) {
                console.error("Error deleting beer:", error);
                alert("Failed to delete beer");
            }
        }
    };

    const handleStatusToggle = async (id) => {
        const beer = beers.find((b) => b.id === id);
        const newStatus = beer.status === "Available" ? "Unavailable" : "Available";

        try {
            const response = await fetch(`/api/beers?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                const updatedBeer = await response.json();
                setBeers((prevBeers) =>
                    prevBeers.map((b) => (b.id === id ? { ...b, ...updatedBeer } : b))
                );
            } else {
                const errorData = await response.json()
                alert(`Failed to update status: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleCheckboxChange = (event, beerId) => {
        if (event.target.checked) {
            setSelectedBeers([...selectedBeers, beerId]);
        } else {
            setSelectedBeers(selectedBeers.filter((id) => id !== beerId));
        }
    };

    const handleAddUploadedBeers = () => {
        if (!/^\d{8}$/.test(gildeavondDateInput)) {
            alert("Invalid date format. Please use YYYYMMDD.");
            return;
        }

        const gildeavondDateFormatted = `${gildeavondDateInput.slice(
            0,
            4
        )}-${gildeavondDateInput.slice(4, 6)}-${gildeavondDateInput.slice(6, 8)}`;

        const existingBeers = [];
        const newBeers = [];

        previewData.forEach((beer) => {
            const existingBeer = beers.find(
                (b) =>
                    b.naam === beer.naam &&
                    b.brouwer === beer.brouwer &&
                    b.type === beer.type &&
                    b.alcoholpercentage === beer.alcoholpercentage
            );

            if (existingBeer) {
                existingBeers.push({ ...existingBeer, ...beer });
            } else {
                newBeers.push({
                    ...beer,
                    gildeavond: gildeavondDateFormatted,
                    status: "Available",
                });
            }
        });

        fetch("/api/beers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ existingBeers, newBeers }),
        })
            .then((response) => response.json())
            .then((data) => {
                setPreviewData([]);
                fetchBeers(isAdmin);
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("Failed to add beers. See console for details.");
            });
    };

    const getNextGildeavondDate = () => {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        let lastFriday = new Date(nextMonth);
        while (lastFriday.getDay() !== 5) { // 5 represents Friday
            lastFriday.setDate(lastFriday.getDate() - 1);
        }

        // Format the date as YYYY-MM-DD
        const year = lastFriday.getFullYear();
        const month = (lastFriday.getMonth() + 1).toString().padStart(2, '0');
        const day = lastFriday.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const handleCopySelectedBeers = async () => {
        if (!gildeavondDateInput) {
            // Set the default gildeavond date to the last Friday of the next month
            const defaultGildeavondDate = getNextGildeavondDate();
            setGildeavondDateInput(defaultGildeavondDate);
        }
        try {
            const response = await fetch("/api/gildeavondBeers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectedBeers: selectedBeers,
                    gildeavond_date: gildeavondDateInput,
                    koelkast : transferKoelkast
                }),
            });

            if (response.ok) {
                fetchGildeavondBeers();
                setSelectedBeers([]);
                setShowGildeavondInput(false);
                setActiveTab("gildeavondBeers");
            } else {
                const errorData = await response.json();
                console.error("Failed to move beers:", errorData);
                alert(`Failed to move beers: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error moving beers to Gildeavond: ", error)
            alert("Failed to move beers to Gildeavond");
        }
    };

    const handleBeerVote = async (beerId, score) => {
        try {
            const response = await fetch("/api/beers/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ beerId, score }),
            });

            if (response.ok) {
                const data = await response.json();
                setBeers((prevBeers) =>
                    prevBeers.map((beer) =>
                        beer.id === beerId
                            ? {
                                ...beer,
                                avg_score: data.averageScore,
                                vote_count: data.totalVotes,
                            }
                            : beer
                    )
                );
                setVotedBeers((prevVoted) => ({
                    ...prevVoted,
                    [beerId]: true,
                }));
            } else {
                const errorData = await response.json();
                console.error("Failed to submit beer score:", errorData);
                alert(errorData.error || "Failed to submit score");
            }
        } catch (error) {
            console.error("Error voting:", error);
            alert("Failed to submit vote");
        }
    };

     const handlePrintPDF = () => {
        if (!printGildeavondDate) {
            alert("Selecteer eerst een Gildeavond datum om te printen.");
            return;
        }

        console.log("Print PDF functie gestart met datum:", printGildeavondDate);
        try {
        const doc = new jsPDF();
        const printDate = new Date(printGildeavondDate);
        const formattedPrintDate = printDate.toLocaleDateString('nl-NL');

            console.log("Gefilterde datum:", formattedPrintDate);
            console.log("Totaal aantal bieren:", beers_gildeavond.length);

            // Filter bieren voor de geselecteerde datum
        const beersToPrint = beers_gildeavond.filter(beer => {
            const beerDate = new Date(beer.gildeavond_date);
                return beerDate.toDateString() === printDate.toDateString();
            });

            console.log("Aantal bieren voor deze datum:", beersToPrint.length);

            if (beersToPrint.length === 0) {
                alert("Geen bieren gevonden voor deze datum.");
                return;
            }

            // Groepeer bieren per koelkast
            const groupedBeers = {};
            beersToPrint.forEach(beer => {
                const koelkast = beer.koelkast || "Onbekend";
                if (!groupedBeers[koelkast]) {
                    groupedBeers[koelkast] = [];
                }
                groupedBeers[koelkast].push(beer);
            });

        let yPos = 20;
            // Titel
            doc.setFontSize(16);
            doc.text(`Bierlijst - ${formattedPrintDate}`, 14, yPos);
        yPos += 10;

            // Voor elke koelkast een tabel maken
        Object.entries(groupedBeers).forEach(([koelkast, koelkastBeers]) => {
                doc.setFontSize(12);
            doc.text(`Koelkast: ${koelkast}`, 14, yPos);
            yPos += 10;

            doc.autoTable({
                startY: yPos,
                head: [
                    [
                        "Naam",
                        "Brouwer",
                        "Type",
                        "Alcohol %",
                        "Prijs",
                            "Score",
                            "Status",
                    ],
                ],
                body: koelkastBeers.map((beer) => [
                    beer.naam,
                        beer.brouwer || beer.brouwerij,
                    beer.type,
                        `${beer.alcoholpercentage || beer.alcohol}%`,
                    `€${parseFloat(beer.prijs).toFixed(2)}`,
                        beer.avg_score || '-',
                        beer.status,
                ]),
            });

            yPos = doc.lastAutoTable.finalY + 10;
        });

            // Bestandsnaam met datum
            const filename = `bierlijst-${formattedPrintDate.replace(/\//g, '-')}.pdf`;
            console.log("PDF genereren:", filename);
            doc.save(filename);
            
            // Sluit modal na succesvol printen
        setShowPrintModal(false);
            
            console.log("PDF succesvol gegenereerd en gedownload");
        } catch (error) {
            console.error("Fout bij het genereren van de PDF:", error);
            alert("Er is een fout opgetreden bij het genereren van de PDF. Zie console voor details.");
        }
    };

    const handlePreferenceChange = async (beerId, type) => {
        let newInvisibleBeers = [...preferences.invisibleBeers];
        let newStrikedBeers = [...preferences.strikedBeers];

        if (type === 'invisible') {
            newInvisibleBeers = newInvisibleBeers.length > 0 ? [] : beers.map((beer) => beer.id);
            newStrikedBeers = [];
        } else if (type === 'striked') {
            newStrikedBeers = newStrikedBeers.length > 0 ? [] : beers.map((beer) => beer.id);
            newInvisibleBeers = [];
        }

        setPreferences({
            invisibleBeers: newInvisibleBeers,
            strikedBeers: newStrikedBeers,
            invisibleBeersName: preferences.invisibleBeersName,
            strikedBeersName: preferences.strikedBeersName,
        });
        try {
            const response = await fetch("/api/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invisibleBeers: newInvisibleBeers,
                    strikedBeers: newStrikedBeers,
                    invisibleBeersName: preferences.invisibleBeersName,
                    strikedBeersName: preferences.strikedBeersName,
                }),
            });
            if (response.ok) {
                console.log('Preferences updated successfully via API');
            } else {
                console.error('Failed to update preferences via API:', response);
                const errorData = await response.json();
                console.error('API error details:', errorData);
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchBeers(true);
        }
    }, [preferences, isAdmin]);

    const getGildeavondDates = (beerId, allBeers) => {
        const gildeavondDates = allBeers
            .filter((beer) => beer.id === beerId && beer.gildeavond_dates)
            .map((beer) => new Date(beer.gildeavond).toLocaleDateString('nl-NL'));
        return gildeavondDates.join(', ');
    };

    const handleGildeavondChange = (event) => {
        const selectedValue = event.target.value;
        setGildeavondFilter(selectedValue);
         fetchGildeavondBeers();
    };

    const toggleColorExplanation = () => {
        setShowColorExplanation(!showColorExplanation);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSort = (field) => {
        if (field === 'remark' || field === 'gildeavond_dates' || field === 'beer_naam') {
            return;
        }
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters({
            ...filters,
            [field]: value,
        });
    };

    // Bereken gefilterde en gesorteerde bieren voor de tabel
    const filteredAndSortedBeers = useMemo(() => {
        console.log("Berekenen gefilterde bieren, totaal:", beers.length);
        return beers
            .filter(beer => {
                if (filters.status && beer.status !== filters.status) return false;
                if (filters.type && beer.type !== filters.type) return false;
                if (filters.price) {
                    const price = parseFloat(beer.prijs);
                    if (filters.price === 'cheap' && price > 3) return false;
                    if (filters.price === 'medium' && (price <= 3 || price > 5)) return false;
                    if (filters.price === 'expensive' && price <= 5) return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortField === 'naam' || sortField === 'brouwer' || sortField === 'type' || sortField === 'status') {
                    const aValue = a[sortField] || '';
                    const bValue = b[sortField] || '';
                    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                } else {
                    const aValue = parseFloat(a[sortField]) || 0;
                    const bValue = parseFloat(b[sortField]) || 0;
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }
            });
    }, [beers, filters, sortField, sortOrder]);

    const handleAddBeer = async () => {
        try {
            const response = await fetch("/api/beers", {
                method: "POST", 
                
                headers: { "Content-Type": "application/json" },                body: JSON.stringify({ newBeers: [{ ...newBeer, status: "Available" }] }),
            });

            if (response.ok) {
                const data = await response.json();
                await fetch("/api/beers/inkopen", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...newPurchase,
                        beer_id: data.newBeers[0].id,
                        inkoopdatum: new Date(newPurchase.inkoopdatum).toISOString()
                    }),
                });

                setNewBeer({
                    naam: "",
                    brouwer: "",
                    type: "",
                    alcoholpercentage: "",
                    prijs: "",
                    remark: "",
                    status: "Available",
                    avg_score: 0,
                    inkoopprijs: ""
                });
                setNewPurchase({
                    leverancier: "",
                    inkoopdatum: "",
                    inkoopprijs: "",
                    inkoopaantal: ""
                });
                setShowAddBeerModal(false);
                fetchBeers(isAdmin);
                fetchInkopenData();
            } else {
                const errorData = await response.json();
                console.error("Failed to add beer:", errorData);
                alert(`Failed to add beer: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error adding beer:", error);
            alert("Failed to add beer");
        }
    };

     const handleTransferKoelkastChange = (event) => {
        setNewBeer(prev => ({ ...prev, koelkast: event.target.value }));
    };

    const handleNewBeerChange = (field, value) => {
        console.log(`Updating ${field} to ${value}`);
        setNewBeer(prev => ({ ...prev, [field]: value }));
    };

    const handleOpenAddBeerModal = () => {
        console.log("Opening add beer modal...");
        setNewBeer({
            naam: "",
            brouwer: "",
            type: "",
            alcoholpercentage: "",
            prijs: "",
            remark: "",
            avg_score: 0,
            inkoopprijs: "",
            voorraad_aantal: 0,
            koelkast: ""
        });

        setNewPurchase({
            beer_id: null,
            leverancier: "",
            inkoopdatum: new Date().toISOString().split('T')[0],
            inkoopprijs: "",
            inkoopaantal: ""
        });
        setShowAddBeerModal(true);
    };

    const handleCloseAddBeerModal = () => {
        setShowAddBeerModal(false);
    };

     const handlePrintModalOpen = () => {
         const latestDate = beers_gildeavond.reduce((latest, current) => {
             const currentDate = new Date(current.gildeavond_date);
             return currentDate > latest ? currentDate : latest;
         }, new Date(0));
          setPrintGildeavondDate(latestDate.toISOString().split('T')[0]);
          setShowPrintModal(true);
     };

    const handlePrintModalClose = () => {
         setShowPrintModal(false);
    };

    const fetchEerderGeserveerdData = async (beerId) => {
        try {
            const response = await fetch(`/api/beers/eerdergeserveerd?beerId=${beerId}`);
            if (response.ok) {
                const data = await response.json();
                setEerderGeserveerdData(data);
            } else {
                console.error("Failed to fetch Eerder geserveerd data");
            }
        } catch (error) {
            console.error("Error fetching Eerder geserveerd data:", error)
        }
    };

    const fetchInkopenData = async (beerId = null) => {
        try {
            // Haal alle inkoopdata op
            const response = await fetch("/api/beers/inkopen");

            if (response.ok) {
                const data = await response.json();
                console.log("Inkopen data opgehaald:", data.length);
                
                // Sla alle inkopen op
                setInkopenData(data);
                
                // Als er een bierId is meegegeven, filter dan de data voor dat bier
                 if (beerId) {
                    setFilteredInkopenData(data.filter(purchase => purchase.beer_id === beerId));
                 }
            } else {
                console.error("Fout bij ophalen inkoopdata");
            }
        } catch (error) {
            console.error("Error bij ophalen inkoopdata:", error);
        }
    };

      const handleOpenInkoopModal = async (beer) => {
          if (beer) {
              setNewPurchase(prev => ({ ...prev, beer_id: beer.id }));
             fetchInkopenData(beer.id)
         } else {
              setNewPurchase({
                beer_id: null,
                leverancier: "",
                inkoopdatum: "",
                inkoopprijs: "",
                inkoopaantal: ""
            });
         }
        setShowInkoopModal(true);
    };

    const handleCloseInkoopModal = () => {
        setShowInkoopModal(false);
    };

     const handleAddPurchase = async () => {
        try {
            // Als er geen beer_id is maar wel een naam, maak dan eerst een nieuw bier aan
            if (!newPurchase.beer_id && newBeer.naam) {
                console.log("Nieuw bier maken en dan inkoop toevoegen...");
                
                // Maak eerst een nieuw bier aan
                const beerResponse = await fetch("/api/beers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        newBeers: [{ 
                            ...newBeer, 
                            status: "Available",
                            avg_score: 0,
                            vote_count: 0
                        }] 
                    }),
                });

                if (beerResponse.ok) {
                    const beerData = await beerResponse.json();
                    const newBeerId = beerData.newBeers[0].id;
                    
                    // Voeg inkoop toe voor het nieuwe bier
                    await addPurchaseForBeer(newBeerId);
                    
                    // Reset formulieren
                    setNewBeer({
                        naam: "",
                        brouwer: "",
                        type: "",
                        alcoholpercentage: "",
                        prijs: "",
                        remark: "",
                        status: "Available",
                        avg_score: 0,
                        inkoopprijs: ""
                    });
                    
                    // Refresh de bierlijst
                    await fetchBeers(isAdmin);
                } else {
                    const errorData = await beerResponse.json();
                    console.error("Fout bij toevoegen bier:", errorData);
                    alert(`Fout bij toevoegen bier: ${errorData.error}`);
                }
            } else if (newPurchase.beer_id) {
                // Als er wel een beer_id is, voeg dan alleen de inkoop toe
                await addPurchaseForBeer(newPurchase.beer_id);
            } else {
                alert("Selecteer een bier of maak een nieuw bier aan");
            }
        } catch (error) {
            console.error("Fout bij inkoop toevoegen:", error);
            alert("Fout bij inkoop toevoegen. Controleer de console voor details.");
        }
    };
    
    // Helper functie om inkoop toe te voegen voor een specifiek bier
    const addPurchaseForBeer = async (beerId) => {
        try {
            // Controle of alle velden zijn ingevuld
            if (!newPurchase.leverancier || !newPurchase.inkoopdatum || !newPurchase.inkoopprijs || !newPurchase.inkoopaantal) {
                alert("Vul alle verplichte velden in");
                return false;
            }
            
             const response = await fetch("/api/beers/inkopen", {
                 method: "POST",
                headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({
                    beer_id: beerId,
                    leverancier: newPurchase.leverancier,
                    inkoopdatum: new Date(newPurchase.inkoopdatum).toISOString(),
                    inkoopprijs: newPurchase.inkoopprijs,
                    inkoopaantal: newPurchase.inkoopaantal
                }),
            });

            if (response.ok) {
                // Reset formulier
                 setNewPurchase({
                    beer_id: null,
                    leverancier: "",
                    inkoopdatum: new Date().toISOString().split('T')[0],
                     inkoopprijs: "",
                     inkoopaantal: ""
                });
                
                // Refresh data
                await fetchInkopenData();
                if (selectedBeerDetails) {
                    fetchInkopenData(selectedBeerDetails.id);
                }
                
                alert("Inkoop succesvol toegevoegd");
                return true;
            } else {
                const errorData = await response.json();
                console.error("Fout bij inkoop toevoegen:", errorData);
                alert(`Fout bij inkoop toevoegen: ${errorData.error}`);
                return false;
            }
       } catch (error) {
            console.error("Fout bij inkoop toevoegen:", error);
            alert("Fout bij inkoop toevoegen");
            return false;
        }
   };

    const handleNewPurchaseChange = (field, value) => {
         setNewPurchase(prev => ({ ...prev, [field]: value }))
    }

     const handleOpenAdminLoginModal = () => {
        setShowAdminLoginModal(true);
     };

      const handleCloseAdminLoginModal = () => {
         setShowAdminLoginModal(false);
     };

      const handleOpenGildeavondModal = () => {
         setShowGildeavondInput(true);
          if (!gildeavondDateInput) {
             const defaultGildeavondDate = getNextGildeavondDate();
            setGildeavondDateInput(defaultGildeavondDate);
        }
    }

       const handleCloseGildeavondModal = () => {
         setShowGildeavondInput(false);
    }

     const handleBeerSelectForPurchase = (beer) => {
         setSelectedBeerDetails(beer)
        setFilteredInkopenData(inkopenData.filter(purchase => purchase.beer_id === beer.id));
    };

     const handleDeletePurchase = async (id) => {
        if (window.confirm("Are you sure you want to delete this purchase?")) {
            try {
                const response = await fetch(`/api/beers/inkopen?id=${id}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    fetchInkopenData(selectedBeerDetails?.id); // Use optional chaining
                      // Remove the deleted purchase from inkopenData
                      setInkopenData(prevInkopenData => prevInkopenData.filter(purchase => purchase.id !== id));
                 } else {
                    const errorData = await response.json()
                     alert(`Failed to delete purchase: ${errorData.error}`);
                 }
            } catch (error) {
                console.error("Error deleting purchase:", error);
                alert("Failed to delete purchase");
            }
         }
     };

    const handleFilterGildeavond = async (event) => {
        const selectedValue = event.target.value;
        setGildeavondFilter(selectedValue);
        
        try {
            const response = await fetch("/api/gildeavondBeers");
            if (response.ok) {
                const data = await response.json();
                
                if (selectedValue === "All dates") {
                    setBeers_Gildeavond(data);
                } else {
                    const filteredData = data.filter(beer => 
                        new Date(beer.gildeavond_date).toLocaleDateString('nl-NL') === selectedValue
                    );
                    setBeers_Gildeavond(filteredData);
                }
                
                console.log(`Gildeavond bieren gefilterd op datum: ${selectedValue}`);
            } else {
                console.error("Fout bij ophalen van gildeavond bieren");
            }
        } catch (error) {
            console.error("Error bij filteren van gildeavond bieren:", error);
        }
    };

    const handleResetFilters = () => {
        setGildeavondFilter("All dates");
          fetchGildeavondBeers();
    };

    // Gebruik deze functie om een bier toe te voegen via de InkoopModal
    const addBeer = (newBeer) => {
        // Voeg ID en status toe
        const beerWithId = {
            ...newBeer,
            id: beers.length + 1, // Eenvoudige ID generatie voor demo
            status: "Beschikbaar"
        };
        
        // Voeg het nieuwe bier toe aan de lijst
        setBeers([...beers, beerWithId]);
    };

    const handleLogin = (success) => {
        if (success) {
            setAdminAuthenticated(true);
            setIsAdmin(true);  // Zorg dat isAdmin ook wordt ingesteld
            setAdminPassword("admin123"); // Stel het adminPassword in
            setShowAdminLoginModal(false);
            
            // Laad de bieren opnieuw voor de admin weergave
            try {
                fetchBeers(true);
            } catch (error) {
                console.error("Error fetching beers for admin:", error);
            }
        }
    };

    return (
        <ErrorBoundary showDetails={adminAuthenticated}>
            <div className="app-container">
                {showSplash && (
                    <div className={`splash-screen ${showSplash ? '' : 'hidden'}`}>
            <img src={logoImage} alt="Splash Screen" />
        </div>
                )}
                
                <div 
                    className={`app-content ${appHidden ? "hidden" : ""}`} 
                    style={{
                        display: appHidden ? 'none' : 'block',
                        opacity: appHidden ? 0 : 1,
                        transition: 'opacity 0.5s ease-in-out',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '20px'
                    }}
                >
                    <div className="app-header">
                        <h1>Bierlijst App</h1>
                        {!isAdmin ? (
                            <button 
                                className="admin-button"
                                onClick={() => setShowAdminLoginModal(true)}
                            >
                            Admin Login
                        </button>
                        ) : (
                            <button 
                                className="admin-button logout"
                                onClick={() => setIsAdmin(false)}
                            >
                                Uitloggen
                        </button>
                        )}
                    </div>
                    
                    {/* Debug informatie */}
                    <div className="debug-info" style={{margin: '10px 0', fontSize: '12px', color: '#666'}}>
                        <p>App status: Splash {showSplash ? 'zichtbaar' : 'verborgen'}, App {appHidden ? 'verborgen' : 'zichtbaar'}</p>
                        <p>Bieren geladen: {beers?.length || 0}</p>
                    </div>
                    
                    {!isAdmin ? (
                        // Gebruikersweergave
                        <div className="user-view">
                            {console.log("Rendering gebruikersweergave, beers:", beers?.length || 0)}
                            <BeerList
                                beers={beers}
                                votedBeers={votedBeers}
                                handleBeerVote={handleBeerVote}
                                preferences={preferences}
                                sortField={sortField}
                                sortDirection={sortOrder}
                            />
                        </div>
                    ) : (
                        // Admin weergave
                        <div className="admin-panel">
                            <div className="admin-tabs">
                                <button 
                                    className={activeTab === 'beers' ? 'active' : ''}
                                    onClick={() => setActiveTab('beers')}
                                >
                                    Bieren Beheren
                                </button>
                                <button 
                                    className={activeTab === 'inkopen' ? 'active' : ''}
                                    onClick={() => setActiveTab('inkopen')}
                                >
                                    Inkopen
                                </button>
                                <button 
                                    className={activeTab === 'gildeavondBeers' ? 'active' : ''}
                                    onClick={() => setActiveTab('gildeavondBeers')}
                                >
                                    Gildeavond Bieren
                                </button>
                            </div>
                            
                            <div className="admin-content">
                                {activeTab === 'beers' && (
                                    <div className="admin-beers">
                                        <h2 className="text-xl font-bold mb-4">Bieren Beheren</h2>
                                        <div className="flex gap-4 mb-4">
                                            <button 
                                                className="action-button"
                                                onClick={() => handleOpenAddBeerModal()}
                                            >
                                                Nieuw Bier Toevoegen
                                            </button>
                                            <button 
                                                className="action-button bg-blue-600 hover:bg-blue-700"
                                                onClick={() => handleOpenGildeavondModal()}
                                            >
                                                Naar Gildeavond
                                            </button>
                                        </div>
                                        <div className="beer-table">
                                            <table ref={tableRef}>
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            <div onClick={() => handleSort('naam')}>
                                                                Naam {sortField === 'naam' && (sortOrder === 'asc' ? '▲' : '▼')}
                                                            </div>
                                                        </th>
                                                        <th>
                                                            <div onClick={() => handleSort('brouwer')}>
                                                                Brouwerij {sortField === 'brouwer' && (sortOrder === 'asc' ? '▲' : '▼')}
                                                            </div>
                                                        </th>
                                                        <th>
                                                            <div onClick={() => handleSort('type')}>
                                                                Type {sortField === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
                                                            </div>
                                                        </th>
                                                        <th>
                                                            <div onClick={() => handleSort('prijs')}>
                                                                Prijs {sortField === 'prijs' && (sortOrder === 'asc' ? '▲' : '▼')}
                                                            </div>
                                                        </th>
                                                        <th>
                                                            <div onClick={() => handleSort('status')}>
                                                                Status {sortField === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                                                            </div>
                                                        </th>
                                                        <th>
                                                            <div onClick={() => handleSort('avg_score')}>
                                                                Score {sortField === 'avg_score' && (sortOrder === 'asc' ? '▲' : '▼')}
                                                            </div>
                                                        </th>
                                                        <th>Acties</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredAndSortedBeers.map(beer => (
                                                        <tr 
                                                            key={beer.id} 
                                                            onClick={() => handleBeerSelect(beer)}
                                                            style={{
                                                                backgroundColor: selectedBeerDetails?.id === beer.id ? '#e0e0e0' : 'transparent'
                                                            }}
                                                        >
                                                            <td>{beer.naam}</td>
                                                            <td>{beer.brouwer || beer.brouwerij}</td>
                                                            <td>{beer.type}</td>
                                                            <td>€{parseFloat(beer.prijs).toFixed(2)}</td>
                                                            <td>{beer.status}</td>
                                                            <td>{beer.avg_score || '-'}</td>
                                                            <td>
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        className="px-2 py-1 bg-amber-500 text-white rounded text-xs"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleStatusToggle(beer.id);
                                                                        }}
                                                                    >
                                                                        Status
                                                                    </button>
                                                                    <button 
                                                                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteBeer(beer.id);
                                                                        }}
                                                                    >
                                                                        Verwijderen
                                                                    </button>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedBeers.includes(beer.id)}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCheckboxChange(e, beer.id);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {selectedBeerDetails && (
                                            <div className="beer-details-panel mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="detail-grid bg-white p-4 rounded-lg shadow">
                                                    <h3 className="text-lg font-bold mb-2">Details</h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="font-semibold">Naam:</div>
                                                        <div>{selectedBeerDetails.naam}</div>
                                                        
                                                        <div className="font-semibold">Brouwer:</div>
                                                        <div>{selectedBeerDetails.brouwer || selectedBeerDetails.brouwerij}</div>
                                                        
                                                        <div className="font-semibold">Type:</div>
                                                        <div>{selectedBeerDetails.type}</div>
                                                        
                                                        <div className="font-semibold">Alcohol %:</div>
                                                        <div>{selectedBeerDetails.alcoholpercentage || selectedBeerDetails.alcohol}%</div>
                                                        
                                                        <div className="font-semibold">Prijs:</div>
                                                        <div>€{parseFloat(selectedBeerDetails.prijs).toFixed(2)}</div>
                                                        
                                                        <div className="font-semibold">Score:</div>
                                                        <div>{selectedBeerDetails.avg_score || '-'}</div>
                                                        
                                                        <div className="font-semibold">Status:</div>
                                                        <div>{selectedBeerDetails.status}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="inkoop-history bg-white p-4 rounded-lg shadow">
                                                    <h3 className="text-lg font-bold mb-2">Inkoop geschiedenis</h3>
                        <button
                                                        className="px-3 py-1 bg-blue-600 text-white rounded mb-3 text-sm"
                                                        onClick={() => handleOpenInkoopModal(selectedBeerDetails)}
                        >
                                                        Nieuwe inkoop
                        </button>
                                                    
                                                    <div className="max-h-60 overflow-y-auto">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    <th className="p-2 text-left">Datum</th>
                                                                    <th className="p-2 text-left">Leverancier</th>
                                                                    <th className="p-2 text-left">Prijs</th>
                                                                    <th className="p-2 text-left">Aantal</th>
                                                                    <th className="p-2 text-left">Acties</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {filteredInkopenData.map(inkoop => (
                                                                    <tr key={inkoop.id} className="border-b">
                                                                        <td className="p-2">
                                                                            {new Date(inkoop.inkoopdatum).toLocaleDateString('nl-NL')}
                                                                        </td>
                                                                        <td className="p-2">{inkoop.leverancier}</td>
                                                                        <td className="p-2">€{parseFloat(inkoop.inkoopprijs).toFixed(2)}</td>
                                                                        <td className="p-2">{inkoop.inkoopaantal}</td>
                                                                        <td className="p-2">
                        <button
                                                                                className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                                                                onClick={() => handleDeletePurchase(inkoop.id)}
                        >
                                                                                Verwijderen
                        </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {filteredInkopenData.length === 0 && (
                                                                    <tr>
                                                                        <td colSpan="5" className="p-2 text-center text-gray-500">
                                                                            Geen inkoop geschiedenis beschikbaar
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {activeTab === 'inkopen' && (
                                    <div className="admin-inkopen">
                                        <h2 className="text-xl font-bold mb-4">Inkopen Beheren</h2>
                                        <div className="flex gap-4 mb-4">
                        <button
                                                className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                                                onClick={() => setShowInkoopModal(true)}
                        >
                                                Nieuwe Inkoop Maken
                        </button>
                                        </div>
                                        <div className="beer-table mb-4 w-full">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Naam</th>
                                                        <th>Brouwerij</th>
                                                        <th>Type</th>
                                                        <th>Prijs</th>
                                                        <th>Datum</th>
                                                        <th>Leverancier</th>
                                                        <th>Inkoopprijs</th>
                                                        <th>Aantal</th>
                                                        <th>Acties</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {inkopenData.map(inkoop => {
                                                        const beer = beers.find(b => b.id === inkoop.beer_id);
                                                        return (
                                                            <tr key={inkoop.id}>
                                                                <td>{beer?.naam || 'Onbekend'}</td>
                                                                <td>{beer?.brouwer || beer?.brouwerij || 'Onbekend'}</td>
                                                                <td>{beer?.type || 'Onbekend'}</td>
                                                                <td>€{beer ? parseFloat(beer.prijs).toFixed(2) : '0.00'}</td>
                                                                <td>{new Date(inkoop.inkoopdatum).toLocaleDateString('nl-NL')}</td>
                                                                <td>{inkoop.leverancier}</td>
                                                                <td>€{parseFloat(inkoop.inkoopprijs).toFixed(2)}</td>
                                                                <td>{inkoop.inkoopaantal}</td>
                                                                <td>
                        <button
                                                                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                                                        onClick={() => handleDeletePurchase(inkoop.id)}
                        >
                                                                        Verwijderen
                        </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {inkopenData.length === 0 && (
                                                        <tr>
                                                            <td colSpan="9" className="p-2 text-center text-gray-500">
                                                                Geen inkopen beschikbaar
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                    </div>
                )}

                                {activeTab === 'gildeavondBeers' && (
                                    <div className="admin-gildeavond">
                                        <h2 className="text-xl font-bold mb-4">Gildeavond Bieren</h2>
                                        
                                        <div className="flex justify-between mb-4">
                                            <div className="flex gap-2 items-center">
                                                <label className="font-medium">Filter op datum:</label>
                                                <select 
                                                    value={gildeavondFilter} 
                                                    onChange={handleFilterGildeavond}
                                                    className="p-2 border rounded"
                                                >
                                                    {uniqueGildeavondDates.map(date => (
                                                        <option key={date} value={date}>{date}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded"
                                                    onClick={handleResetFilters}
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                            
                                            <button 
                                                className="px-4 py-2 bg-green-600 text-white rounded font-bold"
                                                onClick={handlePrintModalOpen}
                                            >
                                                Print lijst
                                            </button>
                                        </div>
                                        
                                        <div className="beer-table">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Naam</th>
                                                        <th>Brouwerij</th>
                                                        <th>Type</th>
                                                        <th>Prijs</th>
                                                        <th>Status</th>
                                                        <th>Koelkast</th>
                                                        <th>Datum</th>
                                                        <th>Acties</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {beers_gildeavond.map(beer => (
                                                        <tr key={beer.id}>
                                                            <td>{beer.naam}</td>
                                                            <td>{beer.brouwer || beer.brouwerij}</td>
                                                            <td>{beer.type}</td>
                                                            <td>€{parseFloat(beer.prijs).toFixed(2)}</td>
                                                            <td>{beer.status}</td>
                                                            <td>{beer.koelkast || '-'}</td>
                                                            <td>{new Date(beer.gildeavond_date).toLocaleDateString('nl-NL')}</td>
                                                            <td>
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        className="px-2 py-1 bg-amber-500 text-white rounded text-xs"
                                                                        onClick={() => handleGildeavondBeersStatusToggle(beer.id)}
                                                                    >
                                                                        Status
                                                                    </button>
                                                                    <button 
                                                                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                                                        onClick={() => handleDeleteGildeavondBeer(beer.id)}
                                                                    >
                                                                        Verwijderen
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showAdminLoginModal && (
                        <AdminLoginModal
                            onClose={() => setShowAdminLoginModal(false)}
                            onLogin={handleLogin}
                        />
                    )}

                    {showColorExplanation && (
                        <ColorExplanationModal
                            onClose={toggleColorExplanation}
                        />
                    )}

                    {showInkoopModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Nieuwe Inkoop Maken</h2>
                                <div className="modal-form">
                                    <div className="form-group">
                                        <label htmlFor="bier-select">Selecteer Bier:</label>
                                        <select
                                            id="bier-select"
                                            value={newPurchase.beer_id || ''}
                                            onChange={(e) => handleNewPurchaseChange('beer_id', e.target.value)}
                                        >
                                            <option value="">-- Selecteer een bier --</option>
                                            {beers.map(beer => (
                                                <option key={beer.id} value={beer.id}>
                                                    {beer.naam} - {beer.brouwer || beer.brouwerij}
                                                </option>
                                            ))}
                                        </select>
            </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="leverancier">Leverancier:</label>
                                        <input
                                            type="text"
                                            id="leverancier"
                                            value={newPurchase.leverancier}
                                            onChange={(e) => handleNewPurchaseChange('leverancier', e.target.value)}
                                        />
        </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="inkoopdatum">Inkoopdatum:</label>
                                        <input
                                            type="date"
                                            id="inkoopdatum"
                                            value={newPurchase.inkoopdatum}
                                            onChange={(e) => handleNewPurchaseChange('inkoopdatum', e.target.value)}
                                        />
    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="inkoopprijs">Inkoopprijs:</label>
                                        <input
                                            type="number"
                                            id="inkoopprijs"
                                            step="0.01"
                                            value={newPurchase.inkoopprijs}
                                            onChange={(e) => handleNewPurchaseChange('inkoopprijs', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="inkoopaantal">Inkoopaantal:</label>
                                        <input
                                            type="number"
                                            id="inkoopaantal"
                                            value={newPurchase.inkoopaantal}
                                            onChange={(e) => handleNewPurchaseChange('inkoopaantal', e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="modal-buttons">
                                    <button onClick={handleAddPurchase}>Inkoop Toevoegen</button>
                                    <button onClick={() => setShowInkoopModal(false)}>Annuleren</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {showGildeavondInput && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Bieren naar Gildeavond</h2>
                                <div className="form-group">
                                    <label htmlFor="gildeavondDate">Gildeavond Datum:</label>
                                    <input
                                        type="date"
                                        id="gildeavondDate"
                                        value={gildeavondDateInput}
                                        onChange={(e) => setGildeavondDateInput(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="koelkast">Koelkast:</label>
                                    <select
                                        id="koelkast"
                                        value={transferKoelkast}
                                        onChange={(e) => setTransferKoelkast(e.target.value)}
                                    >
                                        <option value="Links">Links</option>
                                        <option value="Rechts">Rechts</option>
                                        <option value="Midden">Midden</option>
                                    </select>
                                </div>
                                <p className="mb-2">Geselecteerde bieren: {selectedBeers.length}</p>
                                <div className="modal-buttons">
                                    <button onClick={handleCopySelectedBeers}>Kopiëren naar Gildeavond</button>
                                    <button onClick={handleCloseGildeavondModal}>Annuleren</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {showPrintModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Print Gildeavond Lijst</h2>
                                <div className="form-group">
                                    <label htmlFor="printDate">Kies een datum:</label>
                                    <select
                                        id="printDate"
                                        value={printGildeavondDate}
                                        onChange={(e) => setPrintGildeavondDate(e.target.value)}
                                    >
                                        {uniqueGildeavondDates
                                            .filter(date => date !== "All dates")
                                            .map(date => {
                                                const dateObj = new Date(date);
                                                return (
                                                    <option key={date} value={dateObj.toISOString().split('T')[0]}>
                                                        {dateObj.toLocaleDateString('nl-NL')}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                </div>
                                <div className="modal-buttons">
                                    <button onClick={handlePrintPDF}>Print PDF</button>
                                    <button onClick={handlePrintModalClose}>Annuleren</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Beer Modal */}
                    {showAddBeerModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Nieuw Bier Toevoegen</h2>
                                <div className="modal-form">
                                    <div className="form-group">
                                        <label htmlFor="naam">Naam:</label>
                                        <input
                                            type="text"
                                            id="naam"
                                            value={newBeer.naam}
                                            onChange={(e) => handleNewBeerChange('naam', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="brouwer">Brouwer:</label>
                                        <input
                                            type="text"
                                            id="brouwer"
                                            value={newBeer.brouwer}
                                            onChange={(e) => handleNewBeerChange('brouwer', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="type">Type:</label>
                                        <input
                                            type="text"
                                            id="type"
                                            value={newBeer.type}
                                            onChange={(e) => handleNewBeerChange('type', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="alcoholpercentage">Alcohol %:</label>
                                        <input
                                            type="number"
                                            id="alcoholpercentage"
                                            step="0.1"
                                            value={newBeer.alcoholpercentage}
                                            onChange={(e) => handleNewBeerChange('alcoholpercentage', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="prijs">Verkoopprijs:</label>
                                        <input
                                            type="number"
                                            id="prijs"
                                            step="0.01"
                                            value={newBeer.prijs}
                                            onChange={(e) => handleNewBeerChange('prijs', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="koelkast">Koelkast:</label>
                                        <select
                                            id="koelkast"
                                            value={newBeer.koelkast}
                                            onChange={(e) => handleTransferKoelkastChange(e)}
                                        >
                                            <option value="">Selecteer een koelkast</option>
                                            <option value="Links">Links</option>
                                            <option value="Rechts">Rechts</option>
                                            <option value="Midden">Midden</option>
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="remark">Opmerkingen:</label>
                                        <textarea
                                            id="remark"
                                            value={newBeer.remark}
                                            onChange={(e) => handleNewBeerChange('remark', e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="modal-buttons">
                                    <button onClick={handleAddBeer}>Bier toevoegen</button>
                                    <button onClick={handleCloseAddBeerModal}>Annuleren</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
);
};

export default App;