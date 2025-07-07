let authToken = null;

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // In a real implementation, you would hash the password before sending
    try {
        const response = await fetch('YOUR_APPS_SCRIPT_URL', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (result.success) {
            authToken = result.token;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminControls').style.display = 'block';
            loadRecentRecords();
        } else {
            alert('Login failed: ' + result.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function loadRecentRecords() {
    try {
        const response = await fetch('YOUR_APPS_SCRIPT_URL?action=getRecords');
        const records = await response.json();

        const tableBody = document.getElementById('recordsTable');
        tableBody.innerHTML = '';

        records.slice(0, 50).forEach(record => {
            const row = document.createElement('tr');

            row.innerHTML = `
        <td>${new Date(record[0]).toLocaleDateString()}</td>
        <td>${record[1]}</td>
        <td>${record[2]}</td>
        <td>${record[4]}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('${record[0]}')">
            Delete
          </button>
        </td>
      `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading records:', error);
    }
}

document.getElementById('recordForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        type: document.querySelector('input[name="recordType"]:checked').value,
        name: document.getElementById('fullName').value,
        date: document.getElementById('recordDate').value,
        gender: document.getElementById('gender').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value,
        username: document.getElementById('username').value,
        token: authToken
    };

    try {
        const response = await fetch('YOUR_APPS_SCRIPT_URL', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Record added successfully!');
            document.getElementById('recordForm').reset();
            loadRecentRecords();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error submitting record:', error);
        alert('Failed to submit record. Please try again.');
    }
});