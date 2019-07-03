const DialogHelper = require('../utils/dialog-helper');

async function showSetupDialog(url) {
    try {
        const result = await DialogHelper.showDialog('setupDialog', 'Matchup Image Generator', 
        // Dialog contents
        [
            {
                type: DialogHelper.HR,
                id: 'titleHR'
            },
            {   
                type: DialogHelper.TEXT_INPUT,
                id: 'sheetsuEndpoint',
                label: 'Sheetsu URL',
                value: `${url}`,
            },
        ],
        // Dialog options
        {
            okButtonText: 'Export Images',
            cancelButtonText: 'Cancel',
        });
        
        return result;
    } catch (e) {
        return console.log(e);
        // The dialog got canceled by the user.
    }    
}

async function showMissingAlert(missingList) {
    try {
        const result = await DialogHelper.showDialog('missingAlert', 'Missing Logos', 
        // Dialog contents
        [
            {
                type: DialogHelper.HR,
                id: 'titleHR'
            },
            {   
                type: DialogHelper.TEXT,
                id: 'list',
                label: `${missingList}`,
            },
            {   
                type: DialogHelper.TEXT,
                id: 'listBreak',
                label: '  ',
            },
            {   
                type: DialogHelper.TEXT,
                id: 'tip',
                label: "Continue to begin exporting without the missing logos (wrong logos will appear in those sets) or cancel to add them online or locally.",
            },
        ],
        // Dialog options
        {
            okButtonText: 'Continue',
            cancelButtonText: 'Cancel',
        });
        
        return result;
    } catch (e) {
        console.log(`The following logos were missing:\n${missingList}`);
        // The dialog got canceled by the user.
    }    
}

module.exports = {
    showSetupDialog: showSetupDialog,
    showMissingAlert: showMissingAlert, 
};