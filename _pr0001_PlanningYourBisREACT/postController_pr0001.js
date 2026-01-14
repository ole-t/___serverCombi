
import { postService_pr0001 } from './postService_pr0001.js';
import { validationResult } from 'express-validator';



export const postController_pr0001 = {


    async get_full_data_from_server(req, res) {

        try {
            const postServise_answer = await postService_pr0001.get_full_data_from_server_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, get_full_data_from_server");
            }
        } catch (error) {
            res.status(500).json("Server error, get_full_data_from_server, from catch");
        }

    },
    //---------
    async download_clientsContractsData_cms_fromGitHub_toMainServer_PC(req, res) {

        try {
            const postServise_answer = await postService_pr0001.download_clientsContractsData_cms_fromGitHub_toMainServer_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, download_clientsContractsData_cms_fromGitHub_toMainServer_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, download_clientsContractsData_cms_fromGitHub_toMainServer_PC, from catch");
        }

    },
    //---------
    async getTopData_ByClient_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.getTopData_ByClient_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, getTopData_ByClient_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, getTopData_ByClient_PC, from catch");
        }
    },
    //---------
    async getFullData_CurrentProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.getFullData_CurrentProject_PS(req);

            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, getFullData_CurrentProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, getFullData_CurrentProject_PC, from catch");
        }
    },
    //---------
    async add_newProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.add_newProject_PS(req, res);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, add_newProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, add_newProject_PC, from catch");
        }
    },
    //---------
    async add_new_subProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.add_newSubProject_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, add_new_subProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, add_new_subProject_PC, from catch");
        }
    },
    //---------
    async new_message_in_chat_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.new_message_in_chat_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, new_message_in_chat_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, new_message_in_chat_PC, from catch");
        }
    },
    //---------
    async get_lastMessages_currentChat_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.get_lastMessages_currentChat_PS(req);

            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, get_lastMessages_currentChat_PC");
            }

        } catch (error) {
            res.status(500).json("Server error, get_lastMessages_currentChat_PC, from catch");
        }
    },
    //---------
    async get_PreviousItems_chatList_CurrentProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.get_PreviousItems_chatList_CurrentProject_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, get_PreviousItems_chatList_CurrentProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, get_PreviousItems_chatList_CurrentProject_PC, from catch");
        }
    },
    //---------
    async delete_one_project_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.delete_one_project_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, delete_one_project_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, delete_one_project_PC, from catch");
        }
    },
    //---------
    async delete_one_subProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.delete_one_subProject_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, delete_one_subProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, delete_one_subProject_PC, from catch");
        }
    },
    //---------
    async updateTeamForProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.updateTeamForProject_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, updateTeamForProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, updateTeamForProject_PC, from catch");
        }
    },
    //---------
    async update_ofResponsibleList_subProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.update_ofResponsibleList_subProject_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, update_ofResponsibleList_subProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, update_ofResponsibleList_subProject_PC, from catch");
        }
    },
    //---------
    async set_subProject_settings_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.set_subProject_settings_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, set_subProject_settings_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, set_subProject_settings_PC, from catch");
        }
    },
    //---------
    async set_project_settings_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.set_project_settings_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, set_project_settings_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, set_project_settings_PC, from catch");
        }
    },
    //---------
    async addUser_toContactList_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.add_user_toContactList_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, addUser_toContactList_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, addUser_toContactList_PC, from catch");
        }
    },
    //---------
    async set_newContactList_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.set_newContactList_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, set_newContactList_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, set_newContactList_PC, from catch");
        }
    },
    //---------
    async deleteUsers_fromContactList_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.delete_users_fromContactList_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, deleteUsers_fromContactList_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, deleteUsers_fromContactList_PC, from catch");
        }
    },
    //========================
    // Обработчики для foolTimeSubscriber    

    async subscribeFullTime_PC(req, res) {
        // ОБРАТИТЬ ВНИМАНИЕ - тут Респонст передаем дальше для прямой обработки в постСервисе !!!
        try {
            //const longPoollingToServer = await postService_pr0001.m_subscribeFullTime_PS(req, res);
            //res.status(200).json(longPoollingToServer); // res вызываем внутри longPoollingToServer
            postService_pr0001.subscribeFullTime_PS(req, res);
        } catch (error) {
            res.status(500).json("Ошибка из postController_pr0001 --- subscribeFullTime_PC: " + error);
        }
    },
    //---------
    async getUsersOnlineStatusFromServer_forCurrentProject_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.get_usersOnlineStatusFromServer_forCurrentProject_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, getUsersOnlineStatusFromServer_forCurrentProject_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, getUsersOnlineStatusFromServer_forCurrentProject_PC, from catch");
        }
    },

    // Настройки пользователя ========================================
    //---------
    async setUserSettings_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.setUserSettings_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, setUserSettings_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, setUserSettings_PC, from catch");
        }
    },
    //---------
    async uploadAvatarUser_PC(req, res) {
        try {
            const postServise_answer = await postService_pr0001.uploadAvatarUser_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, uploadAvatarUser_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, uploadAvatarUser_PC, from catch");
        }
    },
    //---------
    async delete_avatarFromServer_PC(req, res) {
        try {
            const postServise_answer = await postService_pr0001.delete_avatarFromServer_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, delete_avatarFromServer_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, delete_avatarFromServer_PC, from catch");
        }
    },

    // Корп Аккаунты ========================================
    //---------
    async add_newCorpAccount_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.add_newCorpAccount_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, add_newCorpAccount_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, add_newCorpAccount_PC, from catch");
        }
    },
    //---------
    async rename_corpAccount_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.rename_corpAccount_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, rename_corpAccount_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, rename_corpAccount_PC, from catch");
        }
    },
    //---------
    async delete_oneCorpAccount_PC(req, res) {
        try {
            const postServise_answer =  postService_pr0001.delete_one_corpAccaunt_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, delete_oneCorpAccount_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, delete_oneCorpAccount_PC, from catch");
        }
    },
    //---------
    async ignor_ownerCorpAccount_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.ignor_ownerCorpAccount_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, ignor_ownerCorpAccount_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, ignor_ownerCorpAccount_PC, from catch");
        }
    },
    //---------
    async restore_ownerCorpAccount_PC(req, res) {
        try {
            const postServise_answer =  postService_pr0001.restore_ownerCorpAccount_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, restore_ownerCorpAccount_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, restore_ownerCorpAccount_PC, from catch");
        }
    },

    //========================
    // Обработчики для уведомлений
    
    async timeUpdate_wasReadChat_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.timeUpdate_wasReadChat_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, timeUpdate_wasReadChat_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, timeUpdate_wasReadChat_PC, from catch");
        }
    },
    //---------
    // видимо функция замененв на униерсальн функцию для проектов и субПроектов
    async timeUpdate_wasReadProjectSettings_PC(req, res) {
        try {
            const postServise_answer =  postService_pr0001.timeUpdate_wasReadProjectSettings_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, timeUpdate_wasReadProjectSettings_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, timeUpdate_wasReadProjectSettings_PC, from catch");
        }
    },
    //---------
    // видимо функция замененв на униерсальн функцию для проектов и субПроектов
    async timeUpdate_wasRead_subChat_PC(req, res) {
        try {
            const postServise_answer = postService_pr0001.timeUpdate_wasRead_subChat_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, timeUpdate_wasRead_subChat_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, timeUpdate_wasRead_subChat_PC, from catch");
        }
    },
    //---------
    // видимо функция замененв на униерсальн функцию для проектов и субПроектов
    async timeUpdate_wasRead_subProject_settings_PC(req, res) {
        try {
            const postServise_answer =  postService_pr0001.timeUpdate_wasRead_subProject_settings_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, timeUpdate_wasRead_subProject_settings_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, timeUpdate_wasRead_subProject_settings_PC, from catch");
        }
    },

    //========================
    // Авторизация:

    //---------
    async m_GoogleAuth_01(req, res) {
        try {
            const postServise_answer = await postService_pr0001.GoogleAuth_01_PS(req);
            if (postServise_answer.mResStatus === 1) {

                // console.log(" ");
                // console.log("Отправляем ответ из m_GoogleAuth_01, dataFromServer = ");
                // console.log(postServise_answer.dataFromServer);

                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, m_GoogleAuth_01");
            }
        } catch (error) {



            res.status(500).json("Server error, m_GoogleAuth_01, from catch");
        }
    },
    //---------
    async logOutOneGadget_PC(req, res) {
        try {
            const postServise_answer =  postService_pr0001.logOutOneGadget_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, logOutOneGadget_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, logOutOneGadget_PC, from catch");
        }
    },
    //---------
    async logOutAllGadgets_PC(req, res) {
        try {
            const postServise_answer =  postService_pr0001.logOutAllGadgets_PS(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, logOutAllGadgets_PC");
            }
        } catch (error) {
            res.status(500).json("Server error, logOutAllGadgets_PC, from catch");
        }
    },

    //========================
    // Запросы от файлового сервиса:

    async access_toProjectFiles_PC___pr0001(req, res) {
        try {

            // console.log(" ");
            // console.log("ЗАПУСК access_toProjectFiles_PC___pr0001, req.body = ");
            // console.log(req.body);

            const postServise_answer = await postService_pr0001.access_toProjectFiles_PS___pr0001(req);
            if (postServise_answer.mResStatus === 1) {
                res.status(200).json(postServise_answer.dataFromServer);
            }
            else {
                res.status(500).json("Server error, access_toProjectFiles_PC___pr0001");
            }
        } catch (error) {
            res.status(500).json("Server error, access_toProjectFiles_PC___pr0001, from catch");
        }
    },
    
}






