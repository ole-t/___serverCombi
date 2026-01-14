import express from "express";
import { Router } from "express";
import { body as m_bodyValidator } from 'express-validator';
import {postController_pr0001} from './postController_pr0001.js';

import middleware_authControl___pr_0001 from './middleWares_pr0001/middleware_authControl___pr_0001.js';

const router_pr0001 = new Router();

//======================== 


// Ограничиваем макс размер тела запроса
router_pr0001.use(express.json({ limit: '20kb' }));

// Проверяем наличие и валидность Емейла во всех типах запросов, а также ограничиваем частоту запросов 
router_pr0001.post('*', middleware_authControl___pr_0001);

router_pr0001.post('/get_full_data_from_server', postController_pr0001.get_full_data_from_server); // получение всей базы данных

router_pr0001.post('/getTopData_ByClient', postController_pr0001.getTopData_ByClient_PC); // получение всей базы данных

router_pr0001.post('/needDownload_clientsContractsData_fromGitHub', postController_pr0001.download_clientsContractsData_cms_fromGitHub_toMainServer_PC); // получение cms-данных главным сервером

router_pr0001.post('/getFullData_CurrentProject', postController_pr0001.getFullData_CurrentProject_PC);

router_pr0001.post('/get_lastMessages_currentChat', postController_pr0001.get_lastMessages_currentChat_PC);
router_pr0001.post('/get_PreviousItems_chatList_CurrentProject', postController_pr0001.get_PreviousItems_chatList_CurrentProject_PC);

router_pr0001.post('/add_new_project', postController_pr0001.add_newProject_PC); // добавление нового проектаа

router_pr0001.post('/newMessageInChat', postController_pr0001.new_message_in_chat_PC);
router_pr0001.post('/add_new_subProject', postController_pr0001.add_new_subProject_PC); // добавление нового суб-проекта

router_pr0001.post('/dell_One_Project', postController_pr0001.delete_one_project_PC); // удаление одной записи
router_pr0001.post('/dell_one_subProject', postController_pr0001.delete_one_subProject_PC); // удаление одной записи
router_pr0001.post('/updateTeamForProject', postController_pr0001.updateTeamForProject_PC); // обновление списка участников проекта
router_pr0001.post('/update_ofResponsibleList_subProject', postController_pr0001.update_ofResponsibleList_subProject_PC); // обновление списка участников проекта

router_pr0001.post('/set_subProject_settings', postController_pr0001.set_subProject_settings_PC);
router_pr0001.post('/set_project_settings', postController_pr0001.set_project_settings_PC);
router_pr0001.post('/addUser_toContactList', postController_pr0001.addUser_toContactList_PC);
router_pr0001.post('/deleteUsers_fromContactList', postController_pr0001.deleteUsers_fromContactList_PC);
router_pr0001.post('/set_newContactList', postController_pr0001.set_newContactList_PC);
router_pr0001.post('/getUsersOnlineStatusFromServer_forCurrentProject', postController_pr0001.getUsersOnlineStatusFromServer_forCurrentProject_PC);

//========================
// Настройки пользователя
router_pr0001.post('/setUserSettings', postController_pr0001.setUserSettings_PC);
router_pr0001.post('/uploadAvatarUser', postController_pr0001.uploadAvatarUser_PC);
router_pr0001.post('/deleteAvatarFromServer', postController_pr0001.delete_avatarFromServer_PC);

//========================
// Корп Аккаунты
router_pr0001.post('/addNewCorpAccount', postController_pr0001.add_newCorpAccount_PC);
router_pr0001.post('/renameCorpAccount', postController_pr0001.rename_corpAccount_PC);
router_pr0001.post('/deleteCorpAccount', postController_pr0001.delete_oneCorpAccount_PC);
router_pr0001.post('/ignorOwnerCorpAccount', postController_pr0001.ignor_ownerCorpAccount_PC);
router_pr0001.post('/restoreOwnerCorpAccount', postController_pr0001.restore_ownerCorpAccount_PC);

//========================
// Обработчики для foolTimeSubscriber
router_pr0001.post('/subscribeFullTime', postController_pr0001.subscribeFullTime_PC);

//========================
// Уведомления:
router_pr0001.post('/timeUpdate_wasReadChat', postController_pr0001.timeUpdate_wasReadChat_PC);
router_pr0001.post('/timeUpdate_wasReadProjectSettings', postController_pr0001.timeUpdate_wasReadProjectSettings_PC);
router_pr0001.post('/timeUpdate_wasRead_subChat', postController_pr0001.timeUpdate_wasRead_subChat_PC);
router_pr0001.post('/timeUpdate_wasRead_subProject_settings', postController_pr0001.timeUpdate_wasRead_subProject_settings_PC);

//========================
// Авторизация:
router_pr0001.post('/logOutOneGadget', postController_pr0001.logOutOneGadget_PC);
router_pr0001.post('/logOutAllGadgets', postController_pr0001.logOutAllGadgets_PC);
router_pr0001.post('/GoogleAuth_01', postController_pr0001.m_GoogleAuth_01);

//========================
// Запросы от файлового сервиса:
router_pr0001.post('/FS_access_toProjectFiles', postController_pr0001.access_toProjectFiles_PC___pr0001);
/* 
router_pr0001.post('/FS_accessUploadOneFileToServer', postController_pr0001.accessUploadOneFileToServer_PC);
router_pr0001.post('/FS_ReadOrDelete_FilesForCurrentProject', postController_pr0001.accessReadOrDelete_FilesForCurrentProject_PC);
router_pr0001.post('/FS_getFull_filesListForCurrentOwner', postController_pr0001.access_getFull_filesListForCurrentOwner_PC);
 */

//========================
export default router_pr0001;







