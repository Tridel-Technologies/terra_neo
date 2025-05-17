const express = require('express')
const { importAll, getFiles, getDataByFolderIdAndFileName, updateValues, createFolderAndFile, getFoldersWithFiles, getUser, loginUser, signup, checkusername, forget_password, change_password } = require('./controller')
const router = express.Router();

router.post('/import', importAll);
router.get('/get_files', getFiles);
router.get('/fetch_data_by_file/:file_id', getDataByFolderIdAndFileName)
router.post('/update_values', updateValues)


router.post('/createFile', createFolderAndFile);
router.get('/files', getFoldersWithFiles);

router.get('/getuser',getUser)
router.post('/login', loginUser);
router.post('/signup',signup);
router.post('/check',checkusername);
router.post('/verifyUser',forget_password);
router.post('/resetPassword',change_password);

module.exports = router;