function runQuery() {
    const query = document.getElementById("queryInput").value;

    if (query.trim() === "") {
        alert("Please enter a query");
        return;
    }

    
    const responseData = [
        {
            company: "TCS",
            sector: "IT Services",
            pe: 22,
            promoter: 72,
            status: "Positive Earnings"
        },
        {
            company: "Infosys",
            sector: "IT Services",
            pe: 18,
            promoter: 68,
            status: "Positive Earnings"
        }
    ];

    displayResults(responseData);
}

function displayResults(data) {
    const tableBody = document.querySelector("#resultsTable tbody");
    tableBody.innerHTML = "";

    data.forEach(stock => {
        const row = `
            <tr>
                <td>${stock.company}</td>
                <td>${stock.sector}</td>
                <td>${stock.pe}</td>
                <td>${stock.promoter}</td>
                <td>${stock.status}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}
