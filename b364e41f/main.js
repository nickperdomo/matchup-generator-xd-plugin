/* Created by Nick Perdomo
 * Questions, praise, hate? Spam me at nickperdomo121@gmail.com
 */
const application = require("application");
const fs = require("uxp").storage.localFileSystem;
const { Rectangle, Color, ImageFill } = require("scenegraph");
const { xhrBinary, base64ArrayBuffer } = require("./utils/network");
const { setupDialog } = require("./ui/modal");


// The main function fires when a user clicks the menu item in Plugins.
function myPluginCommand(selection, documentRoot) {
    return setupDialog.showModal().then(result => {
        let docNode = documentRoot;
        
        // Capture all assets marked for export and team logo containers
        const exportableAssets = docNode.children.filter(child => child.markedForExport);
        const homeLogoConts = 
            exportableAssets.map(asset => 
                asset.children.filter(child => 
                    child.name === 'homeLogoContainer'
                )[0]
            );
        const awayLogoConts = 
            exportableAssets.map(asset => 
                asset.children.filter(child => 
                    child.name === 'awayLogoContainer'
                )[0]
            );

        // TODO: Remove sport selector and pull all required data from JSON
        // which should include logo urls and tricodes for file names
        const exportListJSON = 'https://sheetsu.com/apis/v1.0su/8c894eb7a43d/sheets/exportList';

        // return statement of plugin handler
        return fetch(exportListJSON)
            .then(function (response) {
                return response.json();
            })
            .then(function (jsonResponse) {
                return (
                    console.log(jsonResponse),
                    downloadImage(homeLogoConts, jsonResponse, "home"),
                    downloadImage(awayLogoConts, jsonResponse, "away")
                );
            })
            .then( function () {
                return exportRenditions(exportableAssets); 
            });
        


        async function exportRenditions(exportableAssets) {
            try {
                if (exportableAssets.length > 0) {
                    const folder = await fs.getFolder();
                    const arr = await exportableAssets.map(async asset => {		
                        const file = await folder.createFile(`${asset.name}.png`, {overwrite: true});
                        let obj = {
                            node: asset,               
                            outputFile: file,                    
                            type: application.RenditionType.PNG,    
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

        async function downloadImage(logoConts, jsonResponse, team) {
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
                const logoUrl = jsonResponse[0][logoSide];
                const logoObj = await xhrBinary(logoUrl);
                const logoObjBase64 = await base64ArrayBuffer(logoObj);
                applyImagefill(logoConts, logoObjBase64);

                console.log(logoUrl);

            } catch (err) {
                console.log("error");
                console.log(err.message);
            }
        }
    
        function applyImagefill(logoConts, base64) {
            const imageFill = new ImageFill(`data:image/png;base64,${base64}`);
            logoConts.forEach(container =>
                container.fill = imageFill
            );
        }
    });
} //modal closing bracket

module.exports = {
    commands: {
        myPluginCommand: myPluginCommand
    }
};
