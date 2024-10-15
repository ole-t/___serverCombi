import express from "express";
import { Router } from "express";
import { body as m_bodyValidator } from 'express-validator';
import postController_pr0001 from './postController_pr0001.js';
import mMiddleWare_accessTokenControl_pr0001 from './m_MiddleWares_pr0001/mMiddleWare_assessTokenControl.js';
import m_authMiddleWare from './m_MiddleWares_pr0001/m_authMiddleWare.js';

const router_pr0001 = new Router(); // этот код работает также без команды "new": const router_pr0001 = Router();



//======================== 

// router_pr0001.use(express.cookieParser());

// в роутере для всех типов запросов подключаем наш MiddleWare в цепочке обработки функций. Затем, в случае успешного пропуска результата, передаем выполнение остальным Ендпоинтам
router_pr0001.post(
    '*',
    mMiddleWare_accessTokenControl_pr0001,
    (req, res, next) => {
        console.log(" ");
        console.log("+++ +++ Пришел запрос на роутер pr0001" + req.url);
        console.log(" ");
        next();
    });

// повторно запускаем обработку для проверки продолжения процесса
router_pr0001.post(
    '*',
    (req, res, next) => {
        console.log(" ");
        console.log("== Продолжение, req.url= " + req.url);
        console.log(" ");
        next();
    });



router_pr0001.post('/get_full_data_from_server', postController_pr0001.m_get_full_data_from_server); // получение всей базы данных
router_pr0001.post('/getAll_DB', postController_pr0001.m_getAllDB); // получение всей базы данных
router_pr0001.post('/getTopData_ByClient', postController_pr0001.m_getTopData_ByClient); // получение всей базы данных
router_pr0001.post('/getFullData_CurrentProject', postController_pr0001.m_getFullData_CurrentProject);
// Не используем, вместо этого используем порционную загрузку сообщений "get_lastMessages_currentChat"
router_pr0001.post('/get_chatList_CurrentProject', postController_pr0001.m_get_chatList_CurrentProject);

router_pr0001.post('/get_lastMessages_currentChat', postController_pr0001.m_get_lastMessages_currentChat);
router_pr0001.post('/get_PreviousItems_chatList_CurrentProject', postController_pr0001.m_get_PreviousItems_chatList_CurrentProject);


router_pr0001.post('/add_new_project', postController_pr0001.m_addNewProject); // добавление нового проекта
router_pr0001.post('/newMessageChatProject', postController_pr0001.m_newMessageChatProject); // добавление нового проекта
router_pr0001.post('/add_new_sub_Project', postController_pr0001.m_add_new_sub_Project); // добавление нового суб-проекта
router_pr0001.post('/newMessageChat_sub_Project', postController_pr0001.m_newMessageChat_sub_Project);
router_pr0001.post('/dell_One_Project', postController_pr0001.m_dell_One_Project); // удаление одной записи
router_pr0001.post('/dell_one_sub_Project', postController_pr0001.m_dell_One_sub_Project); // удаление одной записи
router_pr0001.post('/updateTeamForProject', postController_pr0001.m_updateTeamForProject); // обновление списка участников проекта
router_pr0001.post('/update_ofResponsibleList_subProject', postController_pr0001.m_update_ofResponsibleList_subProject); // обновление списка участников проекта

router_pr0001.post('/dellAllProjects', postController_pr0001.m_dellAllProjects); // для удаления всех записей
router_pr0001.post('/set_subProject_settings', postController_pr0001.m_set_subProject_settings);
router_pr0001.post('/set_project_settings', postController_pr0001.m_set_project_settings);
router_pr0001.post('/addUser_toContactList', postController_pr0001.m_addUser_toContactList);
router_pr0001.post('/deleteUsers_fromContactList', postController_pr0001.m_deleteUsers_fromContactList);
router_pr0001.post('/set_newContactList', postController_pr0001.m_set_newContactList);
router_pr0001.post('/confirmOnlineStatus', postController_pr0001.m_confirmOnlineStatus);
router_pr0001.post('/getUsersOnlineStatusFromServer_forCurrentProject', postController_pr0001.m_getUsersOnlineStatusFromServer_forCurrentProject);
// Не используется
router_pr0001.post('/getUsersOnlineStatusFromServer_forContactListCurrentAdmin', postController_pr0001.m_getUsersOnlineStatusFromServer_forContactListCurrentAdmin);

//========================
// Настройки пользователя
router_pr0001.post('/setUserSettings', postController_pr0001.m_setUserSettings);

router_pr0001.post('/uploadAvatarUser', postController_pr0001.m_uploadAvatarUser);

router_pr0001.post('/deleteAvatarFromServer', postController_pr0001.m_deleteAvatarFromServer);

router_pr0001.post('/orderTarifPlan', postController_pr0001.m_orderTarifPlan);

//========================
// Корп Аккаунты
router_pr0001.post('/addNewCorpAccount', postController_pr0001.m_addNewCorpAccount);
router_pr0001.post('/renameCorpAccount', postController_pr0001.m_renameCorpAccount);
router_pr0001.post('/deleteCorpAccount', postController_pr0001.m_deleteCorpAccount);
router_pr0001.post('/ignorOwnerCorpAccount', postController_pr0001.m_ignorOwnerCorpAccount);
router_pr0001.post('/restoreOwnerCorpAccount', postController_pr0001.m_restoreOwnerCorpAccount);

//========================
// Обработчики для foolTimeSubscriber
router_pr0001.post('/subscribeFullTime', postController_pr0001.m_subscribeFullTime);

//========================
// Уведомления:
router_pr0001.post('/timeUpdate_wasReadChat',
    postController_pr0001.m_timeUpdate_wasReadChat);
router_pr0001.post('/timeUpdate_wasReadProjectSettings', postController_pr0001.m_timeUpdate_wasReadProjectSettings);
router_pr0001.post('/timeUpdate_wasRead_subChat', postController_pr0001.m_timeUpdate_wasRead_subChat);
router_pr0001.post('/timeUpdate_wasRead_subProject_settings', postController_pr0001.m_timeUpdate_wasRead_subProject_settings);

//========================
// Авторизация:
router_pr0001.post('/registration_User', m_bodyValidator('eMail').isEmail(), m_bodyValidator('password').isLength({ min: 5, max: 32 }), postController_pr0001.m_registration_User);

// в след строке обрабатываем GET-запрос. В строке ендпоинта используем подстроку "/activate/:link'", поскольку в параметрах в строке гет-запроса будет передаваться доп информация, потому что в гет-запроса отсутствует body
router_pr0001.get('/activate/:link', postController_pr0001.m_confirmRegistrationUser);

router_pr0001.post('/changePassword', m_bodyValidator('eMail').isEmail(), m_bodyValidator('password').isLength({ min: 5, max: 32 }), postController_pr0001.m_changePassword);

router_pr0001.get('/confirmChangePassword/:link', postController_pr0001.m_confirmChangePassword);

router_pr0001.post('/logIn', postController_pr0001.m_logIn);
// след функцию не используем, вместо нее "m_logOutOneGadget"
router_pr0001.post('/logOut', postController_pr0001.m_logOut);
router_pr0001.post('/logOutOneGadget', postController_pr0001.m_logOutOneGadget);
router_pr0001.post('/logOutAllGadgets', postController_pr0001.m_logOutAllGadgets);


router_pr0001.post('/refreshToken', postController_pr0001.m_refreshToken);
// в обработке след запроса - перед выполнением запроса,  используем мидлВеер m_authMiddleWare для проверки авторизации пользоавтеля, а уже затем (в случае отсутствия ошибок во время проверки) - вызываем обработчик запроса в postController_pr0001  
router_pr0001.post('/test_01', m_authMiddleWare, postController_pr0001.m_test_01);

router_pr0001.post('/GoogleAuth_01', postController_pr0001.m_GoogleAuth_01);
//========================
// Загрузка/скачивание файлов:
router_pr0001.post('/uploadFilesToServer', postController_pr0001.m_uploadFilesToServer); // НЕ ИСПОЛЬЗУЕМ, вместо этого дагружаем по одному файлу
router_pr0001.post('/uploadOneFileToServer', postController_pr0001.m_uploadOneFileToServer);
router_pr0001.post('/downloadOneFileFromServer', postController_pr0001.m_downloadOneFileFromServer);
router_pr0001.post('/deleteFilesFromServer', postController_pr0001.m_deleteFilesFromServer);
router_pr0001.post('/getFilesListFromServer', postController_pr0001.m_getFilesListFromServer);


//========================
export default router_pr0001;







