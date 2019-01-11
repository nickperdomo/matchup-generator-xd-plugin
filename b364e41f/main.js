/* Created by Nick Perdomo
 * Questions, praise, hate? Sling it here: nickperdomo121@gmail.com
 */
const application = require("application");
const fs = require("uxp").storage.localFileSystem;
const { Rectangle, Color, ImageFill } = require("scenegraph");
const { xhrBinary, base64ArrayBuffer } = require("./utils/network");
const { showSetupDialog } = require("./ui/modal");


// The main function fires when a user clicks the menu item in Plugins.
async function myPluginCommand() {
    const { root } = require("scenegraph");
    // return statement of plugin handler (MUST BE A PROMISE!)
    return showSetupDialog()
        .then( async function (result) {
            // Capture setup dialog entries
           const dialogEntries = {
               json: result['sheetsuEndpoint'],
           }

           // Ask user to pick an output folder
           const exportFolder = await fs.getFolder();
           
            // Capture exportableAssets(exportable assets) and team logo containers
            const exportableAssets = root.children.filter(child => child.markedForExport);
            const homeLogoConts = [],
                  awayLogoConts = [];

            exportableAssets.forEach( asset => {
                homeLogoConts.push( asset.children.filter(child => child.name === 'homeLogoContainer')[0] )
                awayLogoConts.push( asset.children.filter(child => child.name === 'awayLogoContainer')[0] )
            });
            // console.log("Home: ", homeLogoConts);
            // console.log("Away: ", awayLogoConts);  

            // Download matchup data JSON
            const sheetsuEndpoint = 'https://sheetsu.com/apis/v1.0su/8c894eb7a43d/sheets/exportList';
            // const sheetsuEndpoint = dialogEntries.json;
            return fetchJSON(sheetsuEndpoint)
                .catch( error => {
                    console.log(`Error fetching JSON: ${error}`);
                })
                .then( async function (matchups) {
                    // Export rendition sets one at a time (an XD API requirement)
                    for (const matchup of matchups) {
                        let matchupIndex = matchups.indexOf(matchup);
                        await exportRenditions(matchups, matchupIndex, homeLogoConts, awayLogoConts, exportableAssets, exportFolder);
                    }
                    // Revert document to last saved stated (no XD API call exists yet)
                    throw new Error('Revert to Saved');
                })
                
   
        })
        // .catch( reason => {
        //     console.log(`Error with setup dialog: ${reason}`)
        // }) // modal end
} // plugin command end
    


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
    
        const logoUrl = jsonResponse[matchupIndex][logoSide];
        const logoObj = await xhrBinary(logoUrl);
        const logoObjBase64 = await base64ArrayBuffer(logoObj);
        applyImagefill(logoConts, logoObjBase64);

    } catch (err) {
        console.log("error");
        console.log(err.message);
    }
}

async function applyImagefill(logoConts, base64) {
    const imageFill = new ImageFill(`data:image/png;base64,${base64}`);
    logoConts.forEach(container =>
        container.fill = imageFill
    );
}

async function exportRenditions(data, matchupIndex, homeLogoConts, awayLogoConts, exportableAssets, folder) {
    try {
        if (exportableAssets.length > 0) {
            // const folder = await fs.getFolder();
            const arr = await exportableAssets.map(async asset => {	
                downloadImage(homeLogoConts, data, "home", matchupIndex);
                downloadImage(awayLogoConts, data, "away", matchupIndex);

                let fileName = `${data[matchupIndex].matchupName}_${asset.name}.jpg`;
                const file = await folder.createFile(
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
                    console.log(`Renditions have been saved at ${results[0].outputFile.nativePath}`);
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


module.exports = {
    commands: {
        myPluginCommand: myPluginCommand
    }
};
