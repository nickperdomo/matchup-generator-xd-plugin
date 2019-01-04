/* Created by Nick Perdomo
 * Questions, praise, hate? Sling it here: nickperdomo121@gmail.com
 */
const application = require("application");
const fs = require("uxp").storage.localFileSystem;
const { Rectangle, Color, ImageFill } = require("scenegraph");
const { xhrBinary, base64ArrayBuffer } = require("./utils/network");
const { setupDialog } = require("./ui/modal");

// TODO: Capture user input from plugin UI to set sportCode
const sportCode = "NFL";

// The main function fires when a user clicks the menu item in Plugins.
function myPluginCommand(selection, documentRoot) {
    // return statement of plugin handler
    return setupDialog.showModal()
    .then((result) => {
        const docNode = documentRoot;
        
        // Capture exportableAssets(exportable assets) and team logo containers
        const exportableAssets = docNode.children.filter(child => child.markedForExport);
        const homeLogoConts = [],
              awayLogoConts = [];

        exportableAssets.forEach( asset => {
            homeLogoConts.push( asset.children.filter(child => child.name === 'homeLogoContainer')[0] )
            awayLogoConts.push( asset.children.filter(child => child.name === 'awayLogoContainer')[0] )
        });
        // console.log("Home: ", homeLogoConts);
        // console.log("Away: ", awayLogoConts);  

        // node.children.forEach(function (childNode, i) {
        //     console.log("Child " + i + " type: " + childNode.constructor.name);
        //     console.log("Child " + i + " name: " + childNode.name);
        //     console.log("Child " + i + " export: " + childNode.markedForExport);

        // });

        const sheetsuEndpoint = 'https://sheetsu.com/apis/v1.0su/8c894eb7a43d/sheets/exportList';

        fetch(sheetsuEndpoint)
            .then( response => response.json() )
            .then( jsonResponse => {
                console.log(jsonResponse);
            })
            .catch( reason => console.log(`Failure Reason: ${reason}`) );
                
        //         let dataset = {
        //             jsonResponse: jsonResponse,
        //             exportableAssets: exportableAssets,
        //             homeLogoConts: homeLogoConts,
        //             awayLogoConts: awayLogoConts,
        //         }        
        //         return dataset;
        //     })
        //     
        })    
    // .then( (resolvedValue) => {
    //     return (
    //         console.log(resolvedValue)
    //         // downloadImage(resolvedValue.homeLogoConts, resolvedValue.jsonResponse, "home"),
    //         // downloadImage(resolvedValue.awayLogoConts, resolvedValue.jsonResponse, "away")
    //     );
    // })
    // .then( function () {
    //     return exportRenditions(exportableAssets); 
    // });
    


    //     async function exportRenditions(exportableAssets) {
    //         try {
    //             if (exportableAssets.length > 0) {
    //                 const folder = await fs.getFolder();
    //                 const arr = await exportableAssets.map(async asset => {		
    //                     const file = await folder.createFile(`${asset.name}.png`, {overwrite: true});
    //                     let obj = {
    //                         node: asset,               
    //                         outputFile: file,                    
    //                         type: application.RenditionType.PNG,    
    //                         scale: 2   
    //                     }
    //                     return obj
    //                 });
    //                 const renditions = await Promise.all(arr);
     
    //                 await application.createRenditions(renditions)    
    //                     .then(results => {                             
    //                         console.log(`Renditions have been saved at ${results[0].outputFile.nativePath}`);
    //                     })
    //                     .catch(error => {                             
    //                         console.log(error);
    //                     });

    //             }
    //         } catch (err) {
    //             console.log("error");
    //             console.log(err.message);
    //         }
    //     } 

    //     async function downloadImage(logoConts, jsonResponse, team) {
    //         try {
    //             const logoSide = (team => {
    //                 switch (team) {
    //                     case "home":
    //                         return "homeTeamLogoURL";
    //                     case "away":
    //                         return "awayTeamLogoURL";  
    //                     default:
    //                         return null;
    //                 }
    //             })(team);
    //             const logoUrl = jsonResponse[0][logoSide];
    //             const logoObj = await xhrBinary(logoUrl);
    //             const logoObjBase64 = await base64ArrayBuffer(logoObj);
    //             applyImagefill(logoConts, logoObjBase64);

    //             console.log(logoUrl);

    //         } catch (err) {
    //             console.log("error");
    //             console.log(err.message);
    //         }
    //     }
    
    //     function applyImagefill(logoConts, base64) {
    //         const imageFill = new ImageFill(`data:image/png;base64,${base64}`);
    //         logoConts.forEach(container =>
    //             container.fill = imageFill
    //         );
    //     }

} //modal closing bracket

module.exports = {
    commands: {
        myPluginCommand: myPluginCommand
    }
};
