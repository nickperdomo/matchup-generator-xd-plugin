/* Created by Nick Perdomo
 * Questions, praise, hate? Email: nickperdomo121@gmail.com
 */

const { Rectangle, Color, ImageFill } = require("scenegraph");
const { xhrBinary, base64ArrayBuffer } = require("./utils/network");
const { setupDialog } = require("./ui/modal");

// function myPluginCommand(selection) {
//     // Go to Plugins > Development > Developer Console to see this log output
//     console.log("Plugin command is running!");

//     // Insert a red square at (0, 0) in the current artboard or group/container
//     var shape = new Rectangle();
//     shape.width = 100;
//     shape.height = 100;
//     shape.fill = new Color("lime");
//     // selection.insertionParent.addChild(shape);
// }

// TODO: Capture user input from plugin UI to set sportCode
const sportCode = "NFL";

// The main function fires when a user clicks the menu item in Plugins.
function myPluginCommand(selection, documentRoot) {
    return setupDialog.showModal().then(result => {
        let docNode = documentRoot;
        // let node = selection.items[0];
        // console.log("The selected node is a: " + node.constructor.name);
        
        // Capture renditions(exportable assets) and team logo containers
        const renditions = docNode.children.filter(child => child.markedForExport);
        const homeLogoConts = 
            renditions.map(rendition => 
                rendition.children.filter(child => 
                    child.name === 'homeLogoCont'
                )[0]
            );
        const awayLogoConts = 
            renditions.map(rendition => 
                rendition.children.filter(child => 
                    child.name === 'awayLogoCont'
                )[0]
            );
        console.log(awayLogoConts);

        homeLogoConts.forEach(container =>
            // TODO define homeLogo
            container.fill = homeLogo
        );

        


        // node.children.forEach(function (childNode, i) {
        //     console.log("Child " + i + " type: " + childNode.constructor.name);
        //     console.log("Child " + i + " name: " + childNode.name);
        //     console.log("Child " + i + " export: " + childNode.markedForExport);

        // });
        

        const idJSON = (sport => {
            switch (sport) {
                case "NFL":
                    return "https://sheetsu.com/apis/v1.0su/8c894eb7a43d";
                default:
                    return null;
            }
        })(sportCode);

        if (selection.items.length) {
            return fetch(idJSON)
                .then(function (response) {
                    return response.json();
                })
                .then(function (jsonResponse) {
                    return downloadImage(selection, jsonResponse);
                });
        } else {
            console.log("Please select a shape to apply the downloaded image.");
        }

        async function downloadImage(selection, jsonResponse) {
            try {
                const photoUrl = jsonResponse[19].logo;
                const photoObj = await xhrBinary(photoUrl);
                const photoObjBase64 = await base64ArrayBuffer(photoObj);
                applyImagefill(selection, photoObjBase64);

                console.log(photoUrl);
            } catch (err) {
                console.log("error");
                console.log(err.message);
            }
        }
    });

    function applyImagefill(selection, base64) {
        const imageFill = new ImageFill(`data:image/png;base64,${base64}`);
        selection.items[0].fill = imageFill;
    }
} //modal closing bracket

module.exports = {
    commands: {
        myPluginCommand: myPluginCommand
    }
};
