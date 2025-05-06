import React, { useState, useEffect } from "react";
import "./App.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const App = () => {
  const [beers, setBeers] = useState([]);
  const [uploadedBeers, setUploadedBeers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState("");
  const [selectedBeers, setSelectedBeers] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [gildeavondDate, setGildeavondDate] = useState("");
  const [beerScores, setBeerScores] = useState({}); // Local store for scores, but not the source of truth
  const [votedBeers, setVotedBeers] = useState([]); // Array to store ids of beers voted on by this user

  useEffect(() => {
    fetch('/api/beers')
      .then(response => response.json())
      .then(data => setBeers(data));

    // Fetch user's already voted beers
    fetch('/api/beers/score')
      .then(response => response.json())
      .then(data => {
        setVotedBeers(data.votedBeers)
      })
      .catch(error => console.error("Error fetching voted beers:", error));
  }, []);

  const handleFieldEdit = (id, field, value) => {
    setBeers(
      beers.map((beer) => beer.id === id ? { ...beer, [field]: value } : beer)
    );
  };

  const formatGildeavondDate = (dateNumber) => {
    if (!dateNumber) return ''; // Handle empty or null cases

    const date = new Date((dateNumber - 25569) * 86400 * 1000);
      if (isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  const handleUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const abuf = e.target.result;
      const wb = XLSX.read(abuf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      let data = XLSX.utils.sheet_to_json(sheet);

      // Format 'gildeavond' to date strings
        data = data.map(beer => ({
            ...beer,
            gildeavond: beer.gildeavond ? formatGildeavondDate(beer.gildeavond) : '',
        }));
        setPreviewData(data);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddUploadedBeers = () => {
    const existingBeers = [];
    const newBeers = [];

    previewData.forEach(beer => {
      const existingBeer = beers.find(b => b.naam === beer.naam && b.brouwer === beer.brouwer);
      if (existingBeer) {
        existingBeers.push({ ...existingBeer, ...beer });
      } else {
        newBeers.push({
          ...beer,
          id: beers.length + newBeers.length + 1,
          status: "Available"
        });
      }
    });

    // Update local state
    setBeers(prevBeers => [
      ...prevBeers.map(b => {
        const updatedBeer = existingBeers.find(eb => eb.id === b.id);
        return updatedBeer ? updatedBeer : b;
      }),
      ...newBeers
    ]);

    // Send updated and new beers to the API
    fetch('/api/beers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ existingBeers, newBeers }),
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setPreviewData([]);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleLogin = () => {
    if (username === "admin" && password === "admin123") {
      setUserRole("admin");
      setIsLoggedIn(true);
    } else if (username === "user" && password === "user123") {
      setUserRole("user");
      setIsLoggedIn(true);
    } else {
      alert("Incorrect username or password");
    }
  };

  const groupedByKoelkast = beers.reduce((groups, beer) => {
    const koelkast = beer.koelkast || 'Ungrouped';
    if (!groups[koelkast]) {
      groups[koelkast] = [];
    }
    groups[koelkast].push(beer);
    return groups;
  }, {});

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    const gildeavond = beers[0]?.gildeavond || 'Unknown';
    doc.text(`Bierlijst Gildeavond ${gildeavond}`, 14, 20);
    let rowIndex = 30;

    Object.keys(groupedByKoelkast).forEach((koelkast) => {
      doc.setFontSize(12);
      doc.text(`Koelkast: ${koelkast}`, 14, rowIndex);
      rowIndex += 10;
      doc.autoTable({
        head: [
          ["ID", "Naam", "Brouwer", "Type", "Alcohol %", "Prijs", "Remark", "avg_score"],
        ],
        body: groupedByKoelkast[koelkast].map((beer) => [
          beer.id,
          beer.naam,
          beer.brouwer,
          beer.type,
          beer.alcoholpercentage,
          beer.prijs,
          beer.remark,
          beer.avg_score
        ]),
        startY: rowIndex,
        columnStyles: {
          0: { halign: "left" },
          5: {
            cellWidth: 20,
            halign: "center",
            textColor: (cellData, rowIndex, columnIndex, tableData) => {
              return cellData > 3 ? [255, 0, 0] : cellData < 2.5 ? [0, 255, 0] : [0, 0, 0];
            },
          },
        },
      });
      rowIndex = doc.lastAutoTable.finalY + 10;
    });
    doc.save("beer-list.pdf");
  };

  const handleStatusToggle = (id) => {
    setBeers(
      beers.map((beer) =>
        beer.id === id
          ? { ...beer, status: beer.status === "Available" ? "Soldout" : "Available" }
          : beer
      )
    );
  };

    const handleBeerScore = async (beerId, score) => {
        try {
            const response = await fetch('/api/beers/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ beerId, score }),
            });

            if (response.ok) {
                const data = await response.json();
                setBeers(prevBeers => {
                    return prevBeers.map(beer => {
                        if (beer.id === beerId) {
                            return {...beer, avg_score: data.averageScore}
                        }
                        return beer;
                    })
                });
                setVotedBeers(prevVoted => [...prevVoted, beerId]) // Update local voted beers
                console.log("Beer score submitted successfully");

            } else {
                const errorData = await response.json();
                console.error("Failed to submit beer score:", errorData);
                alert(errorData.error || "Failed to submit score");

            }
        } catch (error) {
            console.error("Error submitting beer score:", error);
            alert("Failed to submit score");
        }
    };

  const getAverageScore = (beerId) => {
    const beer = beers.find(b => b.id === beerId);
      return beer ? beer.avg_score : 'N/A';
  };

    const BeerScore = ({ beerId }) => {
        const currentScore = beerScores[beerId] || 0;
        const hasVoted = votedBeers.includes(beerId);

        return (
            <div>
                {hasVoted ? (
                    <span>Voted</span>
                ) :
                    ([1, 2, 3, 4, 5].map(star => (
                        <span
                            key={star}
                            onClick={() => !hasVoted && handleBeerScore(beerId, star)}
                            style={{cursor: 'pointer', color: star <= currentScore ? 'gold' : 'gray'}}
                        >
                            â˜…
                        </span>
                    )))
                }
            </div>
        );
    };
  return (
    <div className="App" style={{ backgroundColor: "lightblue" }}>
      <h1>Beer List</h1>
      {!isLoggedIn && (
        <div className="login-container">
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      )}
      {userRole === "admin" && isLoggedIn && (
        <div className="admin-controls">
          <button onClick={() => setUserRole("user")} className="switch-role-btn">
            Switch to User Role
          </button>
          <button onClick={() => setUserRole("admin")} className="switch-role-btn">
            Switch to Admin Role
          </button>
          <input type="file" accept=".csv,.xlsx" onChange={handleUpload} className="upload-input" />
          <button onClick={handleAddUploadedBeers}>Add Uploaded Beers</button>
          <button onClick={handlePrintPDF} className="print-pdf-btn">
            Print PDF
          </button>
        </div>
      )}
      {previewData.length > 0 && userRole === "admin" && (
        <div>
          <h3>Preview of Uploaded Beers</h3>
          <table className="beer-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Brouwer</th>
                <th>Type</th>
                <th>Alcohol %</th>
                <th>Prijs</th>
                <th>Voorraad</th>
                <th>Remark</th>
                <th>Koelkast</th>
                <th>Gildeavond</th>
                <th>Untapped Score</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((beer, index) => (
                <tr key={index}>
                  <td><input value={beer.naam} onChange={(e) => {
                      const newPreviewData = [...previewData];
                      newPreviewData[index].naam = e.target.value;
                      setPreviewData(newPreviewData)
                  }} /></td>
                  <td><input value={beer.brouwer} onChange={(e) => {
                    const newPreviewData = [...previewData];
                    newPreviewData[index].brouwer = e.target.value;
                    setPreviewData(newPreviewData)
                  }} /></td>
                  <td><input value={beer.type} onChange={(e) => {
                    const newPreviewData = [...previewData];
                    newPreviewData[index].type = e.target.value;
                    setPreviewData(newPreviewData)
                  }} /></td>
                  <td><input value={beer.alcoholpercentage} onChange={(e) => {
                    const newPreviewData = [...previewData];
                    newPreviewData[index].alcoholpercentage = e.target.value;
                    setPreviewData(newPreviewData)
                  }} /></td>
                  <td><input value={beer.prijs} onChange={(e) => {
                    const newPreviewData = [...previewData];
                    newPreviewData[index].prijs = e.target.value;
                    setPreviewData(newPreviewData)
                  }} /></td>
                  <td><input value={beer.voorraad} onChange={(e) => {
                    const newPreviewData = [...previewData];
                    newPreviewData[index].voorraad = e.target.value;
                    setPreviewData(newPreviewData)
                  }} /></td>
                    <td><input value={beer.remark} onChange={(e) => {
                        const newPreviewData = [...previewData];
                        newPreviewData[index].remark = e.target.value;
                        setPreviewData(newPreviewData)
                    }} /></td>
                  <td><input value={beer.koelkast} onChange={(e) => {
                    const newPreviewData = [...previewData];
                    newPreviewData[index].koelkast = e.target.value;
                    setPreviewData(newPreviewData)
                  }} /></td>
                  <td>
                    <input
                        value={beer.gildeavond}
                        onChange={(e) => {
                            const newPreviewData = [...previewData];
                            newPreviewData[index].gildeavond = e.target.value;
                            setPreviewData(newPreviewData);
                        }}
                    />
                    </td>
                  <td><input value={beer.avg_score} onChange={(e) => {
                    const newPreviewData = [...previewData];
                    newPreviewData[index].avg_score = e.target.value;
                    setPreviewData(newPreviewData)
                  }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {userRole === "admin" && isLoggedIn && (
        <div>
          <h3>All Beers</h3>
          {Object.entries(groupedByKoelkast).map(([koelkast, koelkastBeers]) => (
            <div key={koelkast}>
              <h3 style={{textAlign: 'left'}}>{koelkast}</h3>
              <table className="beer-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Naam</th>
                    <th>Brouwer</th>
                    <th>Type</th>
                    <th>Alcohol %</th>
                    <th>Prijs</th>
                    <th>Voorraad</th>
                    <th>Remark</th>
                    <th>Status</th>
                    <th>Gildeavond</th>
                    <th>Untapped Score</th>
                    <th>Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {koelkastBeers.map((beer) => (
                    <tr key={beer.id}>
                      <td>{beer.id}</td>
                      <td>{beer.naam}</td>
                      <td>{beer.brouwer}</td>
                      <td>{beer.type}</td>
                      <td>{beer.alcoholpercentage}</td>
                      <td>{beer.prijs}</td>
                      <td>{beer.voorraad}</td>
                      <td>{beer.remark}</td>
                      <td>{beer.status}</td>
                      <td>{beer.gildeavond}</td>
                      <td>{beer.avg_score}</td>
                      <td>{getAverageScore(beer.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {userRole === "user" && isLoggedIn && (
        <div>
          <button onClick={() => setUserRole("admin")} className="switch-role-btn">
            Switch to Admin Role
          </button>
          <h1>Beer List - Gildeavond {gildeavondDate}</h1>
          {Object.entries(groupedByKoelkast).map(([koelkast, koelkastBeers]) => (
            <div key={koelkast}>
              <h3 style={{textAlign: 'left'}}>{koelkast}</h3>
              <table className="beer-table">
                <thead>
                  <tr>
                    <th>Naam</th>
                    <th>Brouwer</th>
                    <th>Type</th>
                    <th>Alcohol %</th>
                    <th>Prijs</th>
                    <th>Remark</th>
                    <th>Untapped Score</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {koelkastBeers
                    .filter((beer) => beer.status === "Available")
                    .map((beer) => (
                      <tr key={beer.id}>
                        <td>{beer.naam}</td>
                        <td>{beer.brouwer}</td>
                        <td>{beer.type}</td>
                        <td>{beer.alcoholpercentage}</td>
                        <td>{beer.prijs}</td>
                        <td>{beer.remark}</td>
                        <td>{beer.avg_score}</td>
                        <td><BeerScore beerId={beer.id} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;