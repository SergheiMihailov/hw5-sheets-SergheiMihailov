const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '1Ynr4olX0gHgTpdTEq3AjOmtdhBCq5aAxcej-JL4vi0Y';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  console.log(rows);

  const objArray = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    let newEntry = {};
    for (let colIndex = 0; colIndex < rows[0].length; colIndex++) {
      newEntry[rows[0][colIndex]] = rows[rowIndex][colIndex];
    }
    objArray.push(newEntry);
  }

  res.json( objArray );
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;
  const preRows = await sheet.getRows();
  const rows = preRows.rows;
  const docArray = [];

  for (const field in messageBody) {
    docArray[field] = messageBody[field];
  }

  const payload = [];
  for (field in docArray) {
    const fieldIndex = rows[0].findIndex((element) => {
      return element === field;
    });
    payload[fieldIndex] = docArray[field];
  }

  console.log(docArray);
  console.log(payload);
  const result = await sheet.appendRow(payload);
  res.json(result);
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const messageBody = req.body;
  const preRows = await sheet.getRows();
  const rows = preRows.rows;
  const docArray = [];

  // TODO(you): Implement onPatch.
  const colIndex = rows[0].findIndex((element, index, array) => {
    return element === column;
  });
  const indexToPatch = rows.findIndex((element, index, array) => {
      return element[colIndex] === value;
    }
  );

  for (const field in messageBody) {
    docArray[field] = messageBody[field];
  }

  const payload = [];
  for (field in docArray) {
    const fieldIndex = rows[0].findIndex((element) => {
      return element === field;
    });
    payload[fieldIndex] = docArray[field];
  }

  const result = await sheet.setRow(indexToPatch, payload);

  res.json(result);
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const getRows = await sheet.getRows();
  const rows = getRows.rows;

  const colIndex = rows[0].findIndex((element, index, array) => {
    return element === column;
  });
  const indexToDelete = rows.findIndex((element, index, array) => {
      return element[colIndex] === value;
    }
  );
  const result = await sheet.deleteRow(indexToDelete);
  res.json(result);
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});
