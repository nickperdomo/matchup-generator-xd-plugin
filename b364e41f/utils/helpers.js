const { Color } = require("scenegraph");
const { xhrBinary } = require("./network");
const { showMissingAlert } = require("../ui/modal");


async function checkLogos(jsonResponse) {
  let missingLogoURLs = [];
  const allLogoURLs = jsonResponse
      .map( matchup => [matchup.homeTeamLogoURL, matchup.awayTeamLogoURL])
      .reduce((acc, val) => acc.concat(val), [])
      .filter((item, index, a) => a.indexOf(item) == index);
  
  const startCheck = async (list) => {
      await asyncForEach(allLogoURLs, async (url) => {
          await checkURL(url, list);
      })
  }
  await startCheck(missingLogoURLs);

  return missingLogoURLs.length > 0 
      ? showMissingAlert(sanitizeList(missingLogoURLs))
      : console.log("All logos were found.") ;

  
  async function checkURL(url, list) {
    if (typeof url === 'string'){
        try {
            let logoObj = await xhrBinary(url);
        } catch (err) {
            list.push(url);
        }    
    }
  }
  
  async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
      }
  } 
}

function sanitizeList(list) {
  const cleanList = [];
  list.forEach( item => {
      let itemName = item.match(/(\d+\.png)/g)[0];
      cleanList.push(` ${itemName}`);
  });

  return cleanList.toString().trimStart();
}

function resetPlaceholders(placeholders, colorHex) {
  placeholders.forEach( placeholder => {
      const colorFill = new Color(colorHex, 1)
      placeholder.fill = colorFill
  })
}

async function fetchJSON (endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) {
      throw new Error(response.status);
  }
  const data = await response.json();
  return data;
}

const createFileName = (assetName,matchupName) => {
  const fileName = assetName.replace(/MATCHUPNAME/g, matchupName) + '.jpg';
  return fileName;
}


module.exports = {
  checkLogos,
  sanitizeList,
  resetPlaceholders,
  fetchJSON,
  createFileName,
};