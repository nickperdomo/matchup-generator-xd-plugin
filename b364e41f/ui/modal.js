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
        ],
        // Dialog options
        {
            okButtonText: 'Shucks',
        });
        
        return result;
    } catch (e) {
        return console.log(e);
        // The dialog got canceled by the user.
    }    
}

module.exports = {
    showSetupDialog: showSetupDialog,
    showMissingAlert: showMissingAlert, 
};