/*
 * Sample plugin scaffolding for Adobe XD.
 *
 * 
 */

const { Rectangle, Color, ImageFill } = require('scenegraph');
const { xhrBinary, base64ArrayBuffer } = require('./utils/network');
// const xhrBinary = require('./network').xhrBinary;


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
const sportCode = 'NFL'




// Main function fires when user click on it in the Plugins menu.
function myPluginCommand(selection) {
    
    const idJSON = ((sport) => {
        switch(sport) {
            case 'NFL':
                return 'https://sheetsu.com/apis/v1.0su/8c894eb7a43d';
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

}

async function downloadImage(selection, jsonResponse) {
    try {

        const photoUrl = jsonResponse[14].logo;
        const photoObj = await xhrBinary(photoUrl);
        const photoObjBase64 = await base64ArrayBuffer(photoObj);
        applyImagefill(selection, photoObjBase64);

        console.log(photoUrl)

    } catch (err) {
        console.log("error")
        console.log(err.message);
    }
}

function applyImagefill(selection, base64) {
    const imageFill = new ImageFill(`data:image/png;base64,${base64}`);
    selection.items[0].fill = imageFill;
}


module.exports = {
    commands: {
        myPluginCommand: myPluginCommand
    }
};
