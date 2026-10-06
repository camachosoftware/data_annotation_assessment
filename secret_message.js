// npm init
// npm install cheerio
// node filename.js '{googleUrl}'

const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');

async function downloadDocument(url) {
  try {
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let chunks = '';

        res.on('data', chunk => chunks += chunk);
        res.on('end', () => resolve(chunks));
      }).on('error', err => reject(err));
    });

    fs.writeFileSync('document.html', data);
  } catch (err) {
    console.error('Error downloading HTML:', err.message);
  }
}

async function parseCoordinates() {
  const html = fs.readFileSync('document.html', 'utf8'),
    $ = cheerio.load(html),
    $coordinateTable = $('table'),
    $coordinateRows = $coordinateTable.find('tr');

  let coordinates = [];

  $coordinateRows.slice(1).each((i, row) => {
    const $row = $(row),
      $cells = $row.find('td > p');

    let coordinate = $cells.map((j, cell) => {
        const value = $(cell).text().trim(),
          parsedValue = parseInt(value);

        return isNaN(parsedValue) ? value : parsedValue;
      }).get();

    coordinates.push(coordinate);
  });

  return coordinates;
}

async function sortCoordinates(coordinates) {
  return coordinates.sort((coordinate1, coordinate2) => {
    const xCoordinate1 = parseInt(coordinate1[0]),
      yCoordinate1 = parseInt(coordinate1[2]),
      xCoordinate2 = parseInt(coordinate2[0]),
      yCoordinate2 = parseInt(coordinate2[2]),
      yDiff = yCoordinate2 - yCoordinate1;

    return yDiff === 0 ? xCoordinate1 - xCoordinate2 : yDiff;
  });
}

async function decodeSecretMessage(url) {
  let coordinates, currentY,
    line = '',
    currentX = 0;

  await downloadDocument(url);
  coordinates = await parseCoordinates();
  coordinates = await sortCoordinates(coordinates);
  currentY = coordinates[0][coordinates[0].length - 1];

  coordinates.forEach(cmd => {
    const yCoordinate = cmd[cmd.length - 1],
      xCoordinate = cmd[0],
      character = cmd[1];

    let numberOfSpaces = 0;

    if (yCoordinate !== currentY) {
      console.log(line);
      line = '';
      currentX = 0;
      currentY = yCoordinate;
    }

    numberOfSpaces = xCoordinate - currentX;
    for (let currentSpace = 0; currentSpace < numberOfSpaces; currentSpace++) {
      line += ' ';
    }

    line += character;
    currentX = xCoordinate + 1;
  });

  console.log(line);
}

decodeSecretMessage(process.argv[2]);
