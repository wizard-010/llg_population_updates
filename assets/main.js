const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';

async function loadLLGData(llgId = 'sample-llg') {
    try {
        // Load LLG summary
        const llgResponse = await fetch(`${SCRIPT_URL}?action=getLLGData&llgId=${llgId}`);
        const llgData = await llgResponse.json();

        // Load Ward data
        const wardsResponse = await fetch(`${SCRIPT_URL}?action=getWardsData&llgId=${llgId}`);
        const wardsData = await wardsResponse.json();

        // Update the UI
        updateDashboard(llgData, wardsData);
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to sample data if API fails
        loadSampleData();
    }
}

function updateDashboard(llgData, wardsData) {
    // Update LLG header
    document.getElementById('llgTitle').textContent = llgData.name;
    document.getElementById('lastUpdated').textContent =
        new Date(llgData.lastUpdated).toLocaleString();

    // Update summary cards
    document.getElementById('totalPopulation').textContent =
        llgData.population.toLocaleString();

    // Calculate totals from wards
    const totals = calculateTotals(wardsData.wards);

    document.getElementById('votingPopulation').textContent =
        totals.votingAge.toLocaleString();
    document.getElementById('birthsCount').textContent =
        totals.birthsYTD.toLocaleString();
    document.getElementById('deathsCount').textContent =
        totals.deathsYTD.toLocaleString();

    // Update wards table
    updateWardsTable(wardsData.wards);
}

function calculateTotals(wards) {
    return wards.reduce((totals, ward) => {
        totals.votingAge += ward.votingAge;
        totals.maleVoters += ward.maleVoters;
        totals.femaleVoters += ward.femaleVoters;
        totals.birthsYTD += ward.birthsYTD;
        totals.deathsYTD += ward.deathsYTD;
        return totals;
    }, {
        votingAge: 0,
        maleVoters: 0,
        femaleVoters: 0,
        birthsYTD: 0,
        deathsYTD: 0
    });
}

function updateWardsTable(wards) {
    const tableBody = document.querySelector('#wardsTable tbody');
    tableBody.innerHTML = '';

    wards.forEach(ward => {
        const votingPercent = ((ward.votingAge / ward.population) * 100).toFixed(1);
        const row = document.createElement('tr');

        row.innerHTML = `
      <td>${ward.name}</td>
      <td>${ward.population.toLocaleString()}</td>
      <td>
        <div>${ward.votingAge.toLocaleString()} (${votingPercent}%)</div>
        <div class="progress progress-thin mt-1">
          <div class="progress-bar bg-primary" style="width: ${(ward.maleVoters / ward.votingAge * 100)}%"></div>
          <div class="progress-bar bg-danger" style="width: ${(ward.femaleVoters / ward.votingAge * 100)}%"></div>
        </div>
      </td>
      <td class="text-success">${ward.birthsYTD.toLocaleString()}</td>
      <td class="text-secondary">${ward.deathsYTD.toLocaleString()}</td>
      <td class="${ward.netChange >= 0 ? 'text-success' : 'text-danger'}">
        ${ward.netChange >= 0 ? '+' : ''}${ward.netChange}
      </td>
    `;

        tableBody.appendChild(row);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadLLGData('001'); // Load data for LLG ID 001
});