// const { root } = require("scenegraph");
const DialogHelper = require('../utils/dialog-helper');

async function showSetupDialog() {
    try {
        const result = await DialogHelper.showDialog('setup-dialog', 'Matchup Image Generator', 
        // Dialog contents
        [
            {
                type: DialogHelper.HR,
                id: 'titleHR'
            },
            // {
            //     type: DialogHelper.TEXT,
            //     id: 'explanation',
            //     label: 'Just enter the text you want to replace and the one you want to replace it with and hit the "Replace text" button below.'
            // },
            {   
                type: DialogHelper.TEXT_INPUT,
                id: 'sheetsuEndpoint',
                label: 'Sheetsu URL'
            },
            {
                type: DialogHelper.TEXT_INPUT,
                id: 'outputFolder',
                label: 'Output Folder'
            },
        ],
        // Dialog options
        {
            okButtonText: 'Export Images',
            cancelButtonText: 'Cancel'
        });
        return result;
        // now, result is the object containing all the values
        // await someExampleAsynchronousFunction();
        // selection.items[0].text = selection.items[0].text.split(results.match).join(results.replace); // Replace all isntances of results.match with results.replace in the first selected layer
    } catch (e) {
        return console.log(e);
        // The dialog got canceled by the user.
    }    
}

module.exports = {
    showSetupDialog: showSetupDialog, 
};