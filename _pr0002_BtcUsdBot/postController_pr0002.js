

import {mExportImportLink_postService_pr0002} from './postService_pr0002.js';

class postController_pr0002 {

    async m_get_full_data_from_server(req, res) {
        try {
           // const m_postToDB = await postService_pr0002.m_get_full_data_from_server_PS(req);
            res.status(200).json(m_postToDB);
        } catch (error) {
            res.status(500).json("Ошибка из postController_pr0002 --- m_get_full_DB_and_Reestr: " + error);
        }
    }
    //---------
}

//===============================
export default new postController_pr0002();






