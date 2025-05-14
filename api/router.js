const express = require('express')
const { importAll, getFiles, getDataByFolderIdAndFileName, updateValues, addNewRow, updateData } = require('./controller')
const router = express.Router();

router.post('/import', importAll);
router.get('/get_files', getFiles);
router.get('/fetch_data_by_file/:folder_id/:file_name', getDataByFolderIdAndFileName)
router.post('/update_values', updateValues)
router.post('/addNewRow', addNewRow);
router.put('/updateData', updateData);


module.exports = router;