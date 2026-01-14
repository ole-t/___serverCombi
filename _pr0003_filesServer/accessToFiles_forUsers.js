
import { requestToMainSever_service } from './requestToMainSever_service.js';
import { vars_and_functions___pr0003 } from './postService_pr0003.js';
import config_pr0003 from './config_pr0003.js';

export const accessToFiles_forUsers = {

    async access_toUploadFilesToServer_forUser(mArgObj, req) {

        let return_data_currentFunction = {
            // эти данные заменим ответом главного сервера
            userAccessToCurrentFilesManipulations: false,
            comment: null,
            data_fromMainServer: null,
        };

        try {
            // получаем наличие доступа пользователя и доп данные
            const answerFrom___get_userAccessData_toProjectFiles = await this.get_userAccessData_toProjectFiles(mArgObj);

            // console.log(" ");
            // console.log("answerFrom___get_userAccessData_toProjectFiles = ");
            // console.log(answerFrom___get_userAccessData_toProjectFiles);

            if (!answerFrom___get_userAccessData_toProjectFiles) {
                console.log("ОТКАЗ В ДОСТУПЕ ПОСЛЕ await this.get_userAccessData_toProjectFiles");

                return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                return return_data_currentFunction;
            }

            // не превышен ли размер для одного файла
            if (config_pr0003.maxSizeSingleFile
                &&
                (config_pr0003.maxSizeSingleFile < req.files.m_oneFile.size)) {
                // console.log(" ");
                // console.log("Превышен максимальный размер файла");
                console.log("ОТКАЗ В ДОСТУПЕ --- single file size - over limit");

                return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                return_data_currentFunction.comment = "single file size - over limit";
                return return_data_currentFunction;
            }

            // достаточно ли выделенного места в проекте для добавления файла
            if (answerFrom___get_userAccessData_toProjectFiles?.projectData.project_settings?.project_attachedFiles_settings?.maxFilesSpaseForCurrentProject <
                (req.files.m_oneFile.size + vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email]?.corpAccounts[mArgObj.corpAccount_ID]?.projects[mArgObj.project_ID]?.used_filesSize_forThisProject)
            ) {
                return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                return_data_currentFunction.comment = "projekt files space - over limit";
                return return_data_currentFunction;
            }

            // достаточно ли оплаченного места в на диске Владельца
            let availableFilesSpase = config_pr0003.defaultFreeFilesSpaceForUser;
            // уточняем максимально допустимый объем
            if (answerFrom___get_userAccessData_toProjectFiles.ownerData.owner_tarif_plan.max_diskSpace_forUploadFiles > availableFilesSpase) {
                availableFilesSpase = answerFrom___get_userAccessData_toProjectFiles.ownerData.owner_tarif_plan.max_diskSpace_forUploadFiles;
            }
            // исключаем превышение оплаченного места в на диске Владельца
            if (availableFilesSpase < (answerFrom___get_userAccessData_toProjectFiles.ownerData.owner_tarif_plan.max_diskSpace_forUploadFiles + req.files.m_oneFile.size)) {
                return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                return_data_currentFunction.comment = "Owner files space - over limit";
                return return_data_currentFunction;
            }

            // не превышен ли объем в глобальном хранилище
            if ((vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles + req.files.m_oneFile.size) > config_pr0003.maxTotalSpaceInServerForFiles) {
                return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                return_data_currentFunction.comment = "Over total space for files";

                try {
                    vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                        "Превышен лимит Диска для хранения файлов",
                        '\u{1F534}' + "📈❗"
                    );
                } catch (error) {
                    console.log(" ");
                    console.log("Ошибка отправки сообщения из access_toUploadFilesToServer_forUser");
                    console.log(error);
                }

                return return_data_currentFunction;
            }

            // если все проверки пройдены 
            return_data_currentFunction.userAccessToCurrentFilesManipulations = true;
            return_data_currentFunction.comment = "Access ok";
            return_data_currentFunction.data_fromMainServer = answerFrom___get_userAccessData_toProjectFiles;

            return return_data_currentFunction;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в access_toUploadFilesToServer_forUser");
            console.log(error);

            return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
            return_data_currentFunction.comment = "comment = Ошибка в access_toUploadFilesToServer_forUser";
            return return_data_currentFunction;
        }
    },

    async access_readFilesForCurrentProject(mArgObj) {

        let return_data_currentFunction = {
            userAccessToCurrentFilesManipulations: false,
            comment: null,
        };

        try {
            // получаем наличие доступа пользователя и доп данные
            const answerFrom___get_userAccessData_toProjectFiles = await this.get_userAccessData_toProjectFiles(
                mArgObj,
                // "readOrDelete_FilesForCurrentProject_REQ"   // это typeOfRequest
            );

            // console.log(" ");
            // console.log("answerFrom___get_userAccessData_toProjectFiles из access_readFilesForCurrentProject = ");
            // console.log(answerFrom___get_userAccessData_toProjectFiles);

            if (!answerFrom___get_userAccessData_toProjectFiles) {
                console.log("ОТКАЗ В ДОСТУПЕ ПОСЛЕ await this.get_userAccessData_toProjectFiles из access_readFilesForCurrentProject");

                return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                return_data_currentFunction.comment = "no access from get_userAccessData_toProjectFiles";
                return return_data_currentFunction;
            }

            // если все проверки пройдены, и ответ главного сервера корректный
            return_data_currentFunction = answerFrom___get_userAccessData_toProjectFiles;
            return_data_currentFunction.userAccessToCurrentFilesManipulations = true;
            return_data_currentFunction.comment = "Access ok";

            return return_data_currentFunction;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка в access_readFilesForCurrentProject");
            console.log(error);

            return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
            return_data_currentFunction.comment = "Ошибка в access_readFilesForCurrentProject";
            return return_data_currentFunction;
        }

    },

    async access_deleteFilesListOfProjectFromServer(mArgObj) {
        return await new Promise(async (resolve, reject) => {

            let return_data_currentFunction = {
                // эти данные заменим ответом главного сервера
                userAccessToCurrentFilesManipulations: false,
                comment: null,
                data_fromMainServer: null,
            };

            try {
                // получаем наличие доступа пользователя и доп данные
                const answerFrom_GetAccessData = await this.get_userAccessData_toProjectFiles(
                    mArgObj,
                    "readOrDelete_FilesForCurrentProject_REQ"   // это typeOfRequest
                );

                if (!answerFrom_GetAccessData) {
                    return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                    return_data_currentFunction.comment = "no access from get_userAccessData_toProjectFiles";
                    return resolve(return_data_currentFunction);
                }

                // если все проверки пройдены, и ответ главного сервера корректный
                return_data_currentFunction = answerFrom_GetAccessData;
                return_data_currentFunction.userAccessToCurrentFilesManipulations = true;
                return_data_currentFunction.comment = "Access ok";
                return resolve(return_data_currentFunction);
            }
            catch (error) {
                // console.log(" ");
                // console.log("Ошибка в access_deleteFilesListOfProjectFromServer");
                // console.log(error);

                return_data_currentFunction.userAccessToCurrentFilesManipulations = false;
                return_data_currentFunction.comment = "Ошибка в access_deleteFilesListOfProjectFromServer";
                return resolve(return_data_currentFunction);
            }
        })
    },

    async fullAccess_toFilesCurrentOwner(mArgObj) {
        return await new Promise(async (resolve, reject) => {

            let answer_from_userAccessData = {
                userAccessToCurrentFilesManipulations: false,
                comment: null,
                // также сюда поместим ответ сервера
            };

            try {
                // получаем наличие доступа пользователя и доп данные
                answer_from_userAccessData = await this.get_userAccessData_toProjectFiles(
                    mArgObj,
                    "getFull_filesListForCurrentOwner_REQ"   // это typeOfRequest
                );

                if (!answer_from_userAccessData) {
                    answer_from_userAccessData.userAccessToCurrentFilesManipulations = false;
                    answer_from_userAccessData.comment = "no access from get_userAccessData_toProjectFiles";
                    return resolve(answer_from_userAccessData);
                }

                // если все проверки пройдены 
                answer_from_userAccessData.userAccessToCurrentFilesManipulations = true;
                answer_from_userAccessData.comment = "Access ok";
                return resolve(answer_from_userAccessData);

            }
            catch (error) {
                console.log(" ");
                console.log("Ошибка в fullAccess_toFilesCurrentOwner");
                console.log(error);

                answer_from_userAccessData.userAccessToCurrentFilesManipulations = false;
                answer_from_userAccessData.comment = "Ошибка в fullAccess_toFilesCurrentOwner";
                return resolve(answer_from_userAccessData);
            }
        })
    },

    // ---------------------------

    // Эта функция проверяет наличие допуска данного юзера к данному проекту и его файлам, запрашивает данные на главном сервере, и хеширует данные
    async get_userAccessData_toProjectFiles(mArgObj) {

        // console.log(" ");
        // console.log("--- ЗАПУСК get_userAccessData_toProjectFiles, mArgObj =  ");
        // console.log(mArgObj);

        let userAccessData_toProjectFiles = null;

        // предварительно проверяем наличие минимальных входных данных
        let emaile_token_project_control = this.emaile_token_project_control(
            mArgObj.user_Email,
            mArgObj.accessToken,
            mArgObj.project_ID,
        );

        if (!emaile_token_project_control.predvAccessControl) {
            console.log("Отказ доступа в get_userAccessData_toProjectFiles - 1");

            userAccessData_toProjectFiles.userAccessToCurrentFilesManipulations = false;
            userAccessData_toProjectFiles.comment = "No Access emaile_token_project_control";
            return null;
        }


        try {
            // тут мы создаем пользователя (не овнера) в реестре и проверяем наличие кешированных данных для него, либо запрашиваем о обрабатываем права доступа
            vars_and_functions___pr0003.checkOrCreateNewOwner_in_filesReestr(
                mArgObj.user_Email,
                // mArgObj.user_ID - ID мы получаем позже из ответа главного сервера
            );

            // если есть хешированные данные, и они актуальные, берем данные оттуда
            if (
                // тут проверяем наличие данных в кеше
                vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email]?.usersCash?.timeUpdateData
                // тут проверяем актуальность по времени
                &&
                ((Date.now() - vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email]?.usersCash?.timeUpdateData) < config_pr0003.timeSaveCashData)
                // тут проверяем соответствие запрашиваемомого проекта и кешированных данных
                &&
                vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email]?.usersCash?.projectData?.project_ID === mArgObj.project_ID
            ) {
                userAccessData_toProjectFiles = vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email].usersCash;
            }
            // иначе запрашиваем из главного сервера
            else {
                userAccessData_toProjectFiles =
                    await requestToMainSever_service
                        .access_ToFiles_ForCurrentUser_fromMainServer_REQ(
                            mArgObj,
                        );

                // тут свежие данные сохраняем в Хеш
                vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email].usersCash ??= {};
                vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email].usersCash = userAccessData_toProjectFiles;
                vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email].usersCash.timeUpdateData = Date.now();
            }

            //  проверка принадлежности юзера к проекту
            if (!Object.keys(userAccessData_toProjectFiles.projectData.project_settings.teamList).includes(mArgObj.user_Email)) {
                console.log(" ");
                console.log("!!! Пользователь не является участником данного проекта");
                return null;
            };

            // console.log(" ");
            // console.log("userAccessData_toProjectFiles =  ");
            // console.log(userAccessData_toProjectFiles);

            // также проверяем наличие овнера в реестре файлов, и при необходимости создаем. Поскольку это может быть первая запись файлов в реестр овнера
            vars_and_functions___pr0003.checkOrCreateNewOwner_in_filesReestr(
                mArgObj.owner_Email,
                // mArgObj.user_ID - ID мы получаем позже из ответа главного сервера
            );
            // в информацию Овнера добавляем его ID от главного сервера
            vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].owner_ID ??= userAccessData_toProjectFiles.ownerData.owner_ID;

            return userAccessData_toProjectFiles;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_userAccessData_toProjectFiles");
            console.log(error);

            userAccessData_toProjectFiles.userAccessToCurrentFilesManipulations = false;
            userAccessData_toProjectFiles.comment = "Ошибка в get_userAccessData_toProjectFiles";

            return null;
        }
    },

    emaile_token_project_control(user_Email, accessToken, project_ID) {

        // console.log("ЗАПУСК  emaile_token_project_control");
        // console.log("mArgObj= ");
        // console.log(mArgObj);

        let result = {
            predvAccessControl: true,
            comment: " ",
        }



        try {
            // Проверить наличие Емейла
            if (!user_Email) {
                // console.log("No Emale in reqest");
                result.predvAccessControl = false;
                result.comment = "No Emale in request";
                return result;
            }

            // Проверить наличие Токена
            if (!accessToken) {
                // console.log("No Emale in reqest");
                result.predvAccessControl = false;
                result.comment = "No accessToken in request";
                return result;
            }

            // Предварительно проверить валидность токена
            // добавить код сюда

            // Проверить наличие ID-проекта
            if (!project_ID) {
                // console.log("No project_ID in reqest");
                result.predvAccessControl = false;
                result.comment = "No project_ID in request";
                return result;
            }

            // по умолчанию возвращаем:
            return result;

        } catch (error) {
            // console.log("");
            // console.log("Ошибка в emaile_token_project_control");
            // console.log(error);

            result.predvAccessControl = false;
            result.comment = "Ошибка в emaile_token_project_control";
            return result;
        }
    },

}

