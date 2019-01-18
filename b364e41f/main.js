/* Created by Nick Perdomo
 * Questions, praise, hate? Sling it here: nickperdomo121@gmail.com
 */
const application = require("application");
const fs = require("uxp").storage.localFileSystem;
const { ImageFill } = require("scenegraph");
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
            //    exportEspanol: result['exportEspanol']
           }

           // Ask user to pick an output folder
           const exportFolder = await fs.getFolder();
           let exportSubfolders = [];

           // Check if foxnow and fsgo subfolders exist 
           const entries = await exportFolder.getEntries();
           const folderEntries = await entries.filter(entry => entry.isFolder);
           folderEntries.forEach( folder => {
                if (folder.name === 'foxnow' || folder.name === 'fsgo'){
                    exportSubfolders.push(folder)
                }
           });
           // Create them if they don't exist
           if (exportSubfolders.length === 0){
                const foxnowFolder = await exportFolder.createFolder("foxnow");
                const fsgoFolder = await exportFolder.createFolder("fsgo");
                exportSubfolders = [foxnowFolder,fsgoFolder]
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
           
            // Capture assets marked for export and team logo containers
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
            const sheetsuEndpoint = 'https://sheetsu.com/apis/v1.0su/8c894eb7a43d/sheets/custom-export';
            // const sheetsuEndpoint = dialogEntries.json;
            return fetchJSON(sheetsuEndpoint)
                .catch( error => {
                    console.log(`Error fetching JSON: ${error}`);
                })
                .then( async function (matchups) {
                    // Export rendition sets one at a time (an XD API requirement)
                    for ( let [matchupIndex,matchup] of matchups.entries() ) {
                        await exportRenditions(matchups, matchupIndex, homeLogoConts, awayLogoConts, exportableAssets, exportSubfolders);
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

async function exportRenditions(data, matchupIndex, homeLogoConts, awayLogoConts, exportableAssets, folders) {
    try {
        const foxnowSubfolder = folders[0];
        const fsgoSubfolder = folders[1];
        let outputFolder;

        if (exportableAssets.length > 0) {
            const arr = await exportableAssets.map(async asset => {	   
                downloadImage(homeLogoConts, data, "home", matchupIndex);
                downloadImage(awayLogoConts, data, "away", matchupIndex);
                
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

const createFileName = (assetName,matchupName) => {
    const fileName = assetName.replace(/MATCHUPNAME/g, matchupName) + '.jpg';
    return fileName;
}

module.exports = {
    commands: {
        myPluginCommand: myPluginCommand
    }
};
