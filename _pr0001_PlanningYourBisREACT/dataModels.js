
import { global_Functions_and_Servises_forAll_Projects } from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';


export const NEW__dataModels = {

    //-------------------------------
    // ЭТО ШАБЛОНЫ ЮЗЕРОВ
    create_user_inUsersReestr(
        user_Email,

        user_firstName, // необязательный аргумент
        user_secondName,  // необязательный аргумент
        user_nick,  // необязательный аргумент
        userFotoAderessFromGoogle, // необязательный аргумент
    ) {
        try {

            return {
                user_Email: user_Email,
                user_ID: "user_" + global_Functions_and_Servises_forAll_Projects.random_id(),

                userPublicData: {
                    user_Email: user_Email,
                    user_firstName: user_firstName,
                    user_secondName: user_secondName,
                    user_nick: user_nick,
                    userFotoAderessFromGoogle: userFotoAderessFromGoogle,

                    user_full_name: user_firstName + " " + user_secondName,
                },

                onlineStatus: {
                    lastOnlineTime: 0,
                    needHidestatus: false,
                },

                autorisationData: {
                    email: user_Email,

                    changePasswordData: {
                        changePasswordHesh_awaitConfirm: null,
                        changePassword_awaitConfirm: null, // позже удалить
                        changePasswordActivationLink: null,
                        changePassword_newTokens: {},
                    },

                    tokensDifferentGadgets: {},
                    googleAuthData: {},
                },

                contactList: {},

                tarif_plan: {
                    tarif_name: null,
                    max_diskSpace_forUploadFiles: 100000,

                    maxCount_freeContacts: null,
                    maxCount_freeCorpAccounts: null,
                    maxCount_freeProjects_inEachCorpAccount: null,
                    maxCount_freeSubProjects_inEachProject: null,
                    maxCount_freeMessages_inEachChat: null,
                },

            };
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_user_inReestr");
            console.log(error);
            return null;
        }
    },

    //-------------------------------
    //-------------------------------
    //-------------------------------
    // ЭТО ШАБЛОНЫ ДАННЫХ 

    create_newCorpAccauntItem_forNewUser_in_projectsDB(parent_owner_Email) {
        try {
            const includeDefaultCorpAcc = this.create_singleCorpAccount(
                parent_owner_Email,
                "My fist corpAccaunt",
            );

            return {
                corpAccounts: {
                    ownCorpAccounts: {
                        // это корп аккаунт по умолчанию для нового пользователя
                        [includeDefaultCorpAcc.corpAccount_data.corpAccount_ID]: includeDefaultCorpAcc,
                    },

                    otherAccounts: {

                    },

                    ignor_owners_and_corpAccouns: {
                        _ignorAccounts: {},
                        _ignorOwnersOfAccounts: {},
                    }
                }
            }

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_singleCorpAccount");
            console.log(error);
            return null;
        }
    },

    //-------------------------------

    create_singleCorpAccount(
        parent_owner_Email,
        corpAccount_Name
    ) {
        try {
            if (!parent_owner_Email || !parent_owner_Email) {
                console.log(" ");
                console.log("Ошибка в create_singleCorpAccount - в аргументах отсутствует овнер или название корп аккаунта ");
                return null;
            }

            return {

                corpAccount_data: {
                    parent_owner_Email: parent_owner_Email,
                    corpAccount_ID: "corpAcc_" + global_Functions_and_Servises_forAll_Projects.random_id(),
                    corpAccount_Name: corpAccount_Name,
                    dateOfCreate_corpAccount: Date.now(),
                },

                projects: {},

                /* 
                parent_owner_Email: parent_owner_Email,
                corpAccount_ID: "corpAcc_" + lobal_Functions_and_Servises_forAll_Projects.random_id(),
                corpAccount_Name: corpAccount_Name,
                dateOfCreate_corpAccount: Date.now(),
                */
            }
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_singleCorpAccount");
            console.log(error);
            return null;
        }
    },

    //-------------------------------

    create_singleProject(
        parent_owner_Email,
        parent_corpAccount_ID,
        project_settings
    ) {

        console.log(" ");
        console.log("Запуск  create_singleProject, project_settings= ");
        console.log(project_settings);

        try {
            let currentTime = Date.now();
            return {
                project_data: {
                    project_ID: "pr_" + global_Functions_and_Servises_forAll_Projects.random_id(),
                    parent_owner_Email: parent_owner_Email,

                    parent_corpAccount_ID: parent_corpAccount_ID,
                    dateOfCreateProject: currentTime,

                    time_update_current_project: {
                        time_update_projectSettings: currentTime,
                        time_update_chat: 0,
                    },

                    time_individual_wasRead_projectEvents_byUser: {
                        time_wasRead_settings: currentTime,  // не переименовывать переменную, используется в проектах и субПроектах общей функцией
                        time_wasReadChat: 0,  // не переименовывать переменную, используется в проектах и субПроектах общей функцией
                    },

                    project_settings: {
                        // Тут сначала используем шаблон, и зате заменяем некоторые данные при их наличии во входящих аргументах
                        project_Name: "",
                        dopInfo: "",
                        status: 0, // 0-100%

                        deadline: {
                            deadline_Date: "----:--:--",
                            deadline_Time: "--:--",
                            deadline_signalTime_preRemind_days: 2,
                        },

                        project_attachedFiles_settings: {
                            accessToAttachedFiles: "no",
                            maxDiskSpace_forProject: null,
                            permissionToDeleteProjectFiles: "no", // возможные значения: "no"  "yes"  "onlyForAuthor"                            
                        },

                        // далее перезаписываем некоторые свойства из переданных аргументов
                        ...project_settings,

                        // далее в teamList добавляем parent_owner_Email
                        teamList: {
                            // если во входящих данных есть  список teamList - тогда разворачиваем его сюда
                            ...(project_settings?.teamList ? project_settings.teamList : {}),

                            // добавляем владельца по умолчанию в teamList
                            [parent_owner_Email]: this.create_user_in_teamList(
                                parent_owner_Email,
                                "role_Owner",
                            )
                        },

                    },
                },

                subProjects: {},
            }
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_singleProject");
            console.log(error);
            return null;
        }
    },

    //-------------------------------

    create_single_subProject(
        parent_owner_Email,
        parent_corpAccount_ID,
        parent_project_ID,
        subProject_settings
    ) {

        try {
            let currentTime = Date.now();
            return {
                parent_owner_Email: parent_owner_Email,
                parent_corpAccount_ID: parent_corpAccount_ID,
                parent_project_ID: parent_project_ID,
                subProject_ID: "subPr_" + global_Functions_and_Servises_forAll_Projects.random_id(),

                timeOfCreate_subProject: currentTime,

                time_update_current_subProject: {
                    time_update_subProject_settings: currentTime,
                    time_update_chat: 0,
                },

                time_individual_wasRead_subProjectEvents_byUser: {
                    time_wasRead_settings: currentTime, // не переименовывать переменную, используется в проектах и субПроектах общей функцией
                    time_wasReadChat: 0, // не переименовывать переменную, используется в проектах и субПроектах общей функцией
                },

                subProject_settings: {
                    // Тут сначала используем шаблон, и зате заменяем некоторые данные при их наличии во входящих аргументах
                    subProject_Name: null,
                    task_for_subProject: "",
                    status: 0, // 0-100%

                    deadline: {
                        deadline_Date: "----:--:--",
                        deadline_Time: "--:--",
                        deadline_signalTime_preRemind_days: 2,
                    },

                    // далее перезаписываем некоторые свойства из переданных аргументов
                    ...subProject_settings,


                    teamList_ofResponsible_subProject: {
                        // если во входящих данных есть  список teamList_ofResponsible_subProject - тогда разворачиваем его сюда
                        ...(subProject_settings?.teamList_ofResponsible_subProject ? subProject_settings.teamList_ofResponsible_subProject : {})
                    },
                },

            }
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_single_subProject");
            console.log(error);
            return null;
        }
    },

    //-------------------------------

    create_user_in_teamList(user_Email, user_Role) {
        try {
            return {
                user_Email: user_Email,
                user_Role: user_Role, // role_Owner   role_Moderator   role_user_
            }
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_user_in_teamList");
            console.log(error);
            return null;
        }
    },

    //-------------------------------

    create_user_in_contactList(user_Email, user_Group, comments) {
        try {
            return {
                user_Email: user_Email,
                user_Group: user_Group,
                comments: comments,
            }
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_user_in_teamList");
            console.log(error);
            return null;
        }
    },

    //-------------------------------

    create_User_ResponseStack(user_Email) {
        return {
            user_Email: user_Email,
            user_ResStack: [],
        }
    },
    //-------------------------------
    //-------------------------------
    //-------------------------------
    // ЭТО ШАБЛОНЫ ЧАТОВ 

    create_Chat_or_subChat(
        parent_owner_Email,
        parent_corpAccount_ID,
        parent_project_ID,
        parent_subProject_ID   // для чата проекта тут не будет данных 
    ) {
        try {
            return {
                parent_owner_Email: parent_owner_Email,
                parent_corpAccount_ID: parent_corpAccount_ID,
                parent_project_ID: parent_project_ID,
                parent_subProject_ID: parent_subProject_ID, // для чата проекта тут не будет данных 

                time_last_update: Date.now(),

                messages: [],


            };
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_Chat_or_subChat");
            console.log(error);
            return null;
        }
    },

    //-------------------------------

    create_message_in_Chat_or_subChat(
        parent_owner_Email,
        parent_corpAccount_ID,
        parent_project_ID,
        parent_subProject_ID,  // для чата проекта тут не будет данных 

        autor,
        textMessage,

        knownIndexInReestr,
    ) {
        try {
            return {
                parent_owner_Email: parent_owner_Email,
                parent_corpAccount_ID: parent_corpAccount_ID,
                parent_project_ID: parent_project_ID,
                parent_subProject_ID: parent_subProject_ID,

                autor: autor,
                textMessage: textMessage,
                timeOfCreate: Date.now(),
                message_ID: "mess_" + global_Functions_and_Servises_forAll_Projects.random_id(),

                knownIndexInReestr: knownIndexInReestr,
            };
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_message_in_subChat");
            console.log(error);
            return null;
        }
    },



}



// =============================




