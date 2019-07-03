const application = require("application");
const uxp = require("uxp").storage;
const fs = uxp.localFileSystem;
const { ImageFill, Color } = require("scenegraph");
const { xhrBinary, base64ArrayBuffer } = require("./utils/network");
const { showSetupDialog, showMissingAlert } = require("./ui/modal");


// The main function fires when a user clicks the menu item in Plugins.
async function myPluginCommand() {
    const { root } = require("scenegraph");
    let missingLogos = [];

    // Get the last used Sheetsu URL in the current document
    let lastUsedURL = '';
    if (root.pluginData !== undefined) {
        lastUsedURL = root.pluginData.lastUsedURL
    } else {
        root.pluginData = {
            lastUsedURL: lastUsedURL,
        }
    }

    // return statement of plugin handler MUST BE A PROMISE!
    return showSetupDialog(lastUsedURL)
        .then( async function (result) {
            // Capture setup dialog entries
           root.pluginData = {
               ...root.pluginData,
               lastUsedURL: result.sheetsuEndpoint,
           }

           // Ask user to pick an output folder
           const exportFolder = await fs.getFolder();
           let exportSubfolders = [],
               logosFolder = undefined,
               localLogos  = [],
               logoOverrides = [];      
           
           // Check if foxnow, fsgo, and logos subfolders exist 
           const exportFolderEntries = await exportFolder.getEntries();
           const exportFolders = await exportFolderEntries.filter(entry => entry.isFolder);
           exportFolders.forEach( folder => {
                if (folder.name === 'foxnow' || folder.name === 'fsgo'){
                    exportSubfolders.push(folder);
                } else if (folder.name === 'logos'){
                    logosFolder = folder;
                }
           });

           // Create them if they don't exist
           if (exportSubfolders.length === 0){
                const foxnowFolder = await exportFolder.createFolder("foxnow");
                const fsgoFolder = await exportFolder.createFolder("fsgo");
                exportSubfolders = [foxnowFolder,fsgoFolder];
           // If only one exists, create the other and add it to the
           // array with foxnow always first in the array
           } else if (exportSubfolders.length < 2){
                if (exportSubfolders[0].name === 'foxnow'){
                    const fsgoFolder = await exportFolder.createFolder("fsgo");
                    exportSubfolders.push(fsgoFolder);
                } else {
                    const foxnowFolder = await exportFolder.createFolder("foxnow");
                    exportSubfolders.unshift(foxnowFolder);
                }
           }
           
           // Check for local logo overrides
            if (logosFolder) {
                localLogos = await logosFolder.getEntries();
                // console.log("Found local logos:")
                localLogos.forEach( logo => {
                   let override = {
                       image: logo,
                       name: logo.name,
                       path: logo.nativePath,
                   }
                   logoOverrides.push(override);
                });
            }

            // Capture assets marked for export and team logo containers
            const exportableAssets = root.children.filter(child => child.markedForExport);
            const homeLogoConts = [],
                  awayLogoConts = [];

            exportableAssets.forEach( asset => {
                homeLogoConts.push( asset.children.filter(child => child.name === 'homeLogoContainer')[0] )
                awayLogoConts.push( asset.children.filter(child => child.name === 'awayLogoContainer')[0] )
            });

            // Download matchup data JSON
            let sheetsuEndpoint;
            if (result.sheetsuEndpoint) {
                sheetsuEndpoint = result.sheetsuEndpoint;
            } else {
                // Default to the NFL custom-export sheet if Sheetsu URL is left empty (useful for testing)
                sheetsuEndpoint = 'https://sheetsu.com/apis/v1.0su/cf140788914a/sheets/custom-export';
            }

            return fetchJSON(sheetsuEndpoint)
                .catch( error => {
                    console.log(`Error fetching JSON: ${error}`);
                })
                .then( async function (matchups) {        
                    // Loop through all matchups for each local logo to find matching teams
                    if (logoOverrides.length > 0){
                        logoOverrides.forEach(override => {
                            matchups.forEach(matchup => {
                                if ( typeof matchup.awayTeamLogoURL === 'string' && matchup.awayTeamLogoURL.search("/"+ override.name) !== -1 ){
                                    matchup.awayTeamLogoURL = override.image;
                                }
                                if ( typeof matchup.homeTeamLogoURL === 'string' && matchup.homeTeamLogoURL.search("/"+ override.name) !== -1 ){
                                    matchup.homeTeamLogoURL = override.image;
                                }
                            });
                        });
                    }
                    // Check URLs of non-local logos before processing exportable sets
                    await checkLogos(matchups);

                    // Export rendition sets one at a time (an XD API requirement)
                    for ( let [matchupIndex,matchup] of matchups.entries() ) {
                        await exportRenditions(matchups, matchupIndex, homeLogoConts, awayLogoConts, exportableAssets, exportSubfolders);
                    }
                    // Reset logo containers to original placeholders
                    resetPlaceholders(homeLogoConts,'#FD7575')
                    resetPlaceholders(awayLogoConts,'#75D3FD')
                })
        })
} // end of plugin command
    


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
    let cleanList = [];

    list.forEach( item => {
        let itemName = item.match(/(\d+\.png)/g)[0];
        cleanList.push(` ${itemName}`);
    });

    return cleanList.toString().trimStart();
}

async function downloadImage(logoConts, jsonResponse, team, matchupIndex) {
    try {
        const logoSide = (team => {
            switch (team) {
                case "home":
                    return "homeTeamLogoURL";
                case "away":
                    return "awayTeamLogoURL";  
                default:
                    return null;
            }
        })(team);
        let logoUrl,
            logoObj,
            logoObjBase64,
            localLogo;

        if (typeof jsonResponse[matchupIndex][logoSide] === 'string'){
            try {
                logoUrl = jsonResponse[matchupIndex][logoSide];
                logoObj = await xhrBinary(logoUrl);
                logoObjBase64 = await base64ArrayBuffer(logoObj);
                localLogo = false;
            } catch (err) {
            }   
        } else { // Handle logo override
            localLogo = jsonResponse[matchupIndex][logoSide];
        }

        applyImagefill(logoConts, logoObjBase64, localLogo);

    } catch (err) {
        console.log(err.message);
    }
}

async function applyImagefill(logoConts, base64, localImage) {
    let imageFill;
    
    if (localImage === false){
        imageFill = new ImageFill(`data:image/png;base64,${base64}`);
    } else {
        imageFill = new ImageFill(localImage);
    }

    logoConts.forEach(container => {
        container.fill = imageFill;
    });
}

function resetPlaceholders(placeholders, colorHex) {
    placeholders.forEach( placeholder => {
        const colorFill = new Color(colorHex, 1)
        placeholder.fill = colorFill
    })
}

async function exportRenditions(data, matchupIndex, homeLogoConts, awayLogoConts, exportableAssets, folders) {
    try {
        const foxnowSubfolder = folders[0];
        const fsgoSubfolder = folders[1];
        let outputFolder;

        if (exportableAssets.length > 0) {
            await downloadImage(homeLogoConts, data, "home", matchupIndex);
            await downloadImage(awayLogoConts, data, "away", matchupIndex);
            const arr = await exportableAssets.map(async asset => {	   
                // Set the output folder based on the dimensions of the artboard
                if (asset.width === 720 && asset.height === 440) {
                    outputFolder = fsgoSubfolder;
                } else {
                    outputFolder = foxnowSubfolder; 
                } 

                let fileName = createFileName(asset.name, data[matchupIndex].matchupName);
                const file = await outputFolder.createFile(
                    fileName,
                    {overwrite: true}
                );

                let obj = {
                    node: asset,               
                    outputFile: file,                    
                    type: application.RenditionType.JPG,
                    quality: 90,    
                    scale: 2
                }
                return obj
            });
            const renditions = await Promise.all(arr);

            await application.createRenditions(renditions)    
                .then(results => {                             
                    console.log(`Exported ${data[matchupIndex].matchupName} matchup set.`);
                })
                .catch(error => {                             
                    console.log(error);
                });

        }
    } catch (err) {
        console.log("error");
        console.log(err.message);
    }
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
    commands: {
        myPluginCommand: myPluginCommand
    }
};
