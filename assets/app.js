const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAME = "Population_Registry";

function doGet(e) {
    const action = e.parameter.action;

    try {
        switch (action) {
            case 'getLLGList':
                return getLLGList();
            case 'getWardsData':
                return getWardsData(e.parameter.llgId);
            case 'getVillageData':
                return getVillageData(e.parameter.wardId);
            case 'getRecords':
                return getRecords(e.parameter.filter, e.parameter.token);
            default:
                return sendError('Invalid action', 400);
        }
    } catch (error) {
        return sendError(error.message, 500);
    }
}

function doPost(e) {
    const data = JSON.parse(e.postData.contents);

    try {
        switch (data.action) {
            case 'submitRecord':
                return submitRecord(data);
            case 'deleteRecord':
                return deleteRecord(data.id, data.token);
            default:
                return sendError('Invalid action', 400);
        }
    } catch (error) {
        return sendError(error.message, 500);
    }
}

function submitRecord(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
        sheet.appendRow([
            "Timestamp", "Type", "LLG_ID", "Ward_ID", "Village_ID",
            "Name", "Gender", "Date_of_Birth", "Age", "Mother_Name",
            "Father_Name", "Notes", "Deceased"
        ]);
    }

    // If record is a death, delete corresponding birth record
    if (data.type === "Death") {
        deleteBirthRecord(data.name, data.dob);
    }

    // Calculate age if DOB is provided
    const age = data.dob ? calculateAge(data.dob) : "";

    // Append new record
    sheet.appendRow([
        new Date(),
        data.type,
        data.llgId,
        data.wardId,
        data.villageId,
        data.name,
        data.gender,
        data.dob,
        age,
        data.motherName || "",
        data.fatherName || "",
        data.notes || "",
        data.isDeceased || "N"
    ]);

    return sendResponse({ success: true });
}

function deleteBirthRecord(name, dob) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = data.length - 1; i >= 1; i--) { // Skip header row
        if (data[i][5] === name && data[i][7] === dob && data[i][1] === "Birth") {
            sheet.deleteRow(i + 1); // Rows are 1-indexed
            break;
        }
    }
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function getRecords(filter, token) {
    // Verify token (simple example - implement proper auth in production)
    if (!token || token !== "VALID_TOKEN") {
        return sendError("Unauthorized", 401);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const records = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
        const record = {};
        for (let j = 0; j < headers.length; j++) {
            record[headers[j].toLowerCase().replace(/\s+/g, '_')] = data[i][j];
        }
        record.id = i; // Use row number as ID

        // Apply filters
        if (filter === "all" ||
            (filter === "birth" && record.type === "Birth") ||
            (filter === "death" && record.type === "Death") ||
            (filter === "today" && isToday(record.timestamp))) {

            // Get ward/village names
            const wardData = getWardData(record.llg_id, record.ward_id);
            const villageData = getVillageData(record.ward_id, record.village_id);

            records.push({
                ...record,
                wardName: wardData?.name || "Unknown",
                villageName: villageData?.name || "Unknown"
            });
        }
    }

    return sendResponse({ records });
}

function isToday(date) {
    const today = new Date();
    const recordDate = new Date(date);
    return recordDate.getDate() === today.getDate() &&
        recordDate.getMonth() === today.getMonth() &&
        recordDate.getFullYear() === today.getFullYear();
}

function deleteRecord(id, token) {
    // Verify token
    if (!token || token !== "VALID_TOKEN") {
        return sendError("Unauthorized", 401);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    sheet.deleteRow(parseInt(id) + 1); // +1 for header row

    return sendResponse({ success: true });
}

// Helper functions for LLG/Ward/Village data (keep your existing implementations)
function getLLGList() { /* ... */ }
function getWardsData(llgId) { /* ... */ }
function getVillageData(wardId) { /* ... */ }
function getWardData(llgId, wardId) { /* ... */ }
function getVillageData(wardId, villageId) { /* ... */ }

function sendResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function sendError(message, code = 400) {
    return ContentService.createTextOutput(JSON.stringify({
        error: message,
        code: code
    })).setMimeType(ContentService.MimeType.JSON);
}