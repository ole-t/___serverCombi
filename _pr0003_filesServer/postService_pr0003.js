

import fs from 'fs';
import Busboy from "busboy";

import config_pr0003 from './config_pr0003.js';
import config_serverCombi from '../config_serverCombi.js';
import { global_Functions_and_Servises_forAll_Projects } from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import { first_LoadData_pr0003 } from './saveAndLoadDataServise_pr0003.js';
import { accessToFiles_forUsers } from './accessToFiles_forUsers.js';
import { add_data_to_input_steck_deleting_projects_and_corpAccounts } from './deleteClientsDeadsFiles_service_pr0003.js';

console.log(" ");
console.log("=== === ЗАПУСК  postService_pr0003.js");


export let connectionTo_infoTelegramBot___pr0003 = null;
try {
    console.log(" ");
    console.log("+++ Попытка подключения connectionTo_infoTelegramBot___pr0003");

    connectionTo_infoTelegramBot___pr0003 = global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.setConnectionCurrentTelegramBot(
        config_pr0003.telegramAccessToken___pr0003___infoBot
    );

    console.log(" ");
    console.log("=== Установлено соединение с Телеграм ИНФО-БОТОМ - pr0003");
} catch (error) {
    console.log(" ");
    console.log("=== ОШИБКА ПОДКЛЮЧЕНИЯ К ИНФО-БОТУ - pr0003");
    console.log(error);
}

// переменные сервера помещаем в объект, чтобы можно ссылаться на них в качестве указателя
export const vars_and_functions___pr0003 = {
    need_SaveData: false,
    access_SaveData: true,
    timePreviousSaveData: 0,

    usersFiles_Reestr: {
        // Тут храним общий размер файлов пользователей на диске
        _usedTotalSpaceForAllClientsFiles: 0,
        // тут описана структура реестра
        ["user_Email"]: {
            owner_Email: "aaa@aaa.aaa",
            owner_ID: "owner_ID",
            currentFilesSize_forThisUser: 0,

            corpAccounts: {
                ["corpAccount_ID"]: {
                    maxSpace_forThisCorpAcc: 0,
                    filesSize_forThisCorpAcc: 0,

                    projects: {
                        ["project_ID"]: {
                            maxSpace_forThisProject: 0,
                            used_filesSize_forThisProject: 0,

                            files: {
                                ["file_ID"]: {
                                    // данные Юзера
                                    senderFile_Email: null,
                                    // senderFile_ID: null,
                                    // known_senderFile_index_inReestr: null,

                                    // данные Владельца, родительских проектов и корп аккаунтов
                                    owner_Email: null,
                                    owner_ID: null,
                                    // known_owner_index_inReestr: null,

                                    // данные непосредственно файла
                                    file_ID: null,
                                    file_Name: null,
                                    endOfFileName: null,
                                    fileFullNameByID: null,
                                    file_Size: null,
                                    timeUploading: null,
                                }
                            },
                        },
                    },
                },
            },

            usersCash: {
                // сюда кладем данные от главного сервера



                /* 
                                // сюда для каждого типа операции будет создаваться объект с данными Кеша 
                                accessUploadOneFileToServer_REQ: {
                                    timeUpdateData: null,
                                    cashData: {},
                                },
                                readOrDelete_FilesForCurrentProject_REQ: {
                                    timeUpdateData: null,
                                    cashData: {},
                                },
                */
            },
        }
    },

    tempBlockedReestr: {},

    checkOrCreateNewOwner_in_filesReestr: (owner_Email, owner_ID) => {
        try {

            // console.log(" ");
            // console.log("Запуск checkOrCreateNewOwner_in_filesReestr, vars_and_functions___pr0003.usersFiles_Reestr= ");
            // console.log(vars_and_functions___pr0003.usersFiles_Reestr);


            if (!vars_and_functions___pr0003.usersFiles_Reestr[owner_Email]) {

                vars_and_functions___pr0003.usersFiles_Reestr[owner_Email] = {};
                vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].owner_Email = owner_Email;
                // vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].owner_ID = owner_ID;
                vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].currentFilesSize_forThisUser = 0;

                // создаем список корп аккаунтов и вложенных проектов с файлами
                vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts = {};
                // создаем кеш
                vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].usersCash = {};
            }


        } catch (error) {
            console.log("Ошибка в checkOrCreateNewOwner_in_filesReestr");
            console.log(error);
        }
    },// 

    create_newFileItem_inFilesReestr: (mArgObj) => {
        try {
            // console.log(" ");
            // console.log("Запуск create_newFileItem_inFilesReestr, mArgObj=");
            // console.log(mArgObj);

            // проверяем размер файла на числовое значение
            if (typeof mArgObj.file_Size !== "number" || Number.isNaN(mArgObj.file_Size)) {
                // console.log("! ! ! ! ! ! !   РАЗМЕР ФАЙЛА НЕ ОПРЕДЕЛЕН");
            }

            // Сначала проверияеv и при необходимости создаем Владельца в реестре
            if (!vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email]) {
                vars_and_functions___pr0003.checkOrCreateNewOwner_in_filesReestr(mArgObj.owner_Email, mArgObj.owner_ID);
            }

            // console.log(" ");
            // console.log("vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email]=");
            // console.log(vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email]);

            // создаем корп аккаунт в реестре
            if (!vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID]) {
                vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID] = {
                    maxSpace_forThisCorpAcc: 0,
                    filesSize_forThisCorpAcc: 0,
                    projects: {},
                };
            }

            // console.log("");
            // console.log("vars_and_functions___pr0003.usersFiles_Reestr=");
            // console.log(vars_and_functions___pr0003.usersFiles_Reestr);

            // создаем проект в реестреmaxSpace_forThisProject: 0,
            if (!(vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].projects[mArgObj.project_ID])) {
                vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].projects[mArgObj.project_ID] = {
                    maxSpace_forThisProject: 0,
                    used_filesSize_forThisProject: 0,
                    files: {},
                };
            };

            // далее вносим данные
            vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].projects[mArgObj.project_ID].files[mArgObj.file_ID] = {
                /* 
                                // данные Юзера
                                senderFile_Email: mArgObj.senderFile_Email,
                                senderFile_ID: mArgObj.senderFile_ID,
                                known_senderFile_index_inReestr: mArgObj.known_senderFile_index_inReestr,
                
                                // данные Владельца, родительских проектов и корп аккаунтов
                                owner_Email: mArgObj.owner_Email,
                                owner_ID: mArgObj.owner_ID,
                                known_owner_index_inReestr: mArgObj.known_owner_index_inReestr,
                
                                // данные непосредственно файла
                                file_ID: mArgObj.file_ID,
                                file_Name: mArgObj.file_Name,
                                endOfFileName: mArgObj.endOfFileName,
                                fileFullNameByID: mArgObj.fileFullNameByID,
                                file_Size: mArgObj.file_Size,
                 */
                ...mArgObj,
                timeUploading: Date.now(),
            }

            // пересчитываем фактический объем файлов в Проекте
            vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].projects[mArgObj.project_ID].used_filesSize_forThisProject = vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].projects[mArgObj.project_ID].used_filesSize_forThisProject + mArgObj.file_Size;
            // пересчитываем фактический объем файлов в Корп Аккаунте
            vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].filesSize_forThisCorpAcc = vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].filesSize_forThisCorpAcc + mArgObj.file_Size;
            // пересчитываем фактический объем файлов для данного Клиента
            vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].currentFilesSize_forThisUser = vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].currentFilesSize_forThisUser + mArgObj.file_Size;

            // пересчитываем фактический объем файлов в глобальном хранилище
            vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles = vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles + mArgObj.file_Size;

            // Проверить тут - mArgObj.file_Size

            // console.log(" ");
            // console.log("vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.user_Email].corpAccounts[mArgObj.corpAccount_ID].projects[mArgObj.project_ID].files=");
            // console.log(vars_and_functions___pr0003.usersFiles_Reestr[mArgObj.owner_Email].corpAccounts[mArgObj.corpAccount_ID].projects[mArgObj.project_ID].files);

        } catch (error) {
            // console.log("Ошибка в create_newFileItem_inFilesReestr");
            // console.log(error);
        }

    },

    delete_fileItem_inFilesReestr: function (
        // Тут используем "function" вместо стрелочной функции, как обычно, чтобы получить доступ к "arguments"
        owner_Email,
        corpAccount_ID,
        project_ID,
        file_ID
    ) {
        try {
            // console.log(" ");
            // console.log("Запуск delete_fileItem_inFilesReestr, arguments=");
            // console.log(arguments);

            if (
                !vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].files[file_ID]
            ) {
                console.log(" ");
                console.log("При попытке удаления файла из реестра - запись не обнаружена");
                return;
            }

            // пересчитываем фактический объем файлов в Проекте
            vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].used_filesSize_forThisProject = vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].used_filesSize_forThisProject - vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].files[file_ID].file_Size;
            // пересчитываем фактический объем файлов в Корп Аккаунте
            vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].filesSize_forThisCorpAcc = vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].filesSize_forThisCorpAcc - vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].files[file_ID].file_Size;
            // пересчитываем фактический объем файлов для данного Клиента
            vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].currentFilesSize_forThisUser = vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].currentFilesSize_forThisUser - vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].files[file_ID].file_Size;
            // пересчитываем фактический объем файлов в глобальном хранилище
            vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles = vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles - vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].files[file_ID].file_Size;

            // удаляем запись из реестра
            delete vars_and_functions___pr0003.usersFiles_Reestr[owner_Email].corpAccounts[corpAccount_ID].projects[project_ID].files[file_ID];

            // console.log(" ");
            // console.log("Запись Файла успешно удалена из реестра файлов")

        } catch (error) {
            console.log("Ошибка вычеркивания файла из реестра в delete_fileItem_inFilesReestr");
            console.log(error);
        }

    },

    sendTelegramInfo_from_pr0003: async (text, additional__emodzi_or_name_or_color_emodzi) => {
        try {

            let secondEmodzi = additional__emodzi_or_name_or_color_emodzi ? additional__emodzi_or_name_or_color_emodzi : "";  // тут указываем дополнительное инфо емодзи к основному емодзи 

            if (additional__emodzi_or_name_or_color_emodzi == "green") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green;
            if (additional__emodzi_or_name_or_color_emodzi == "yellow") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow;
            if (additional__emodzi_or_name_or_color_emodzi == "red") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red;
            if (additional__emodzi_or_name_or_color_emodzi == "blue") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_blue;

            if (additional__emodzi_or_name_or_color_emodzi == "white") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_white;
            if (additional__emodzi_or_name_or_color_emodzi == "black") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_black;
            if (additional__emodzi_or_name_or_color_emodzi == "brown") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_brown;
            if (additional__emodzi_or_name_or_color_emodzi == "light_blue") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_light_blue;
            if (additional__emodzi_or_name_or_color_emodzi == "pink") secondEmodzi = " " + config_serverCombi.emodziListTelegram_currentProject.variants.circle_pink;

            return await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.messegeToCurrentTelegramBot(
                connectionTo_infoTelegramBot___pr0003, // соединение с Телеграм
                config_serverCombi.adminTelegramAccount_ID_for_information, // мой аккаунт для входящих сообщений
                config_pr0003.projectNameID, // Название проекта
                text, // текст сообщения
                (config_pr0003.emodziListTelegram_currentProject.default_currentProjectEmodzi + " " + secondEmodzi + " ") //емодзи из переменной, из списка 
            );
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    },



    controlAndMessages_aboutDiskSpace: {

        previos_usedTotalSpaceForAllClientsFiles: 0,
        timePreviousMassage: 0,

        // это сообщиние при увеличении занятого места
        messagesOverflow_increases: {
            "message_spaceOver_%_10": false,
            "message_spaceOver_%_20": false,
            "message_spaceOver_%_30": false,
            "message_spaceOver_%_40": false,
            "message_spaceOver_%_50": false,
            "message_spaceOver_%_60": false,
            "message_spaceOver_%_70": false,
            "message_spaceOver_%_80": false,
            "message_spaceOver_%_90": false,
            "message_spaceOver_%_100": false,
        },

        // это сообщиние при уменьшении занятого места
        messagesOverflow_decreases: {
            "message_spaceOver_%_10": false,
            "message_spaceOver_%_20": false,
            "message_spaceOver_%_30": false,
            "message_spaceOver_%_40": false,
            "message_spaceOver_%_50": false,
            "message_spaceOver_%_60": false,
            "message_spaceOver_%_70": false,
            "message_spaceOver_%_80": false,
            "message_spaceOver_%_90": false,
            "message_spaceOver_%_100": false,
        },

        controlOverflow_andInfoMessages: () => {
            try {

                // если с момента предыдущего сообщения прошло меньше часа - прерываем
                //  if ((Date.now() - vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.timePreviousMassage) < config_pr0003.periodAlerts_totalSpaceDisk) return;

                function clearMessagesReestr_increases() {
                    for (let i = 10; i <= 100; i += 10) {
                        let karrentKeyName = "message_spaceOver_%_" + i;
                        vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_increases[karrentKeyName] = false;
                    }
                }

                function clearMessagesReestr_decreases() {
                    for (let i = 10; i <= 100; i += 10) {
                        let karrentKeyName = "message_spaceOver_%_" + i;
                        vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_decreases[karrentKeyName] = false;
                    }
                }

                let carrentUsedProcents = vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles / config_pr0003.maxTotalSpaceInServerForFiles * 100;

                console.log(" ");
                console.log("Запуск controlOverflow_andInfoMessages");
                console.log("_usedTotalSpaceForAllClientsFiles = " + vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles);
                console.log("maxTotalSpaceInServerForFiles = " + config_pr0003.maxTotalSpaceInServerForFiles);

                vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                    "Заполнение дискового места = " + Math.round(carrentUsedProcents) + " % ( = " + Math.round(vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles / 1000) + " кБайт)",
                    "blue"

                );

                // console.log(" ");
                // console.log("_usedTotalSpaceForAllClientsFiles= " + vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles);

                // console.log("previos_usedTotalSpaceForAllClientsFiles= " + vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.previos_usedTotalSpaceForAllClientsFiles);


                // если произошло увеличение занятого места
                if (vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles > vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.previos_usedTotalSpaceForAllClientsFiles) {

                    // проходим по интересующим нас значением и сравниваем
                    // тут идем сверху вниз
                    for (let i = 100; i >= 10; i -= 10) {

                        let karrentKeyName = "message_spaceOver_%_" + i;
                        // если создается условие отправки уведомления, и до этого оно не было отправлено - тогда отправляем его
                        if (carrentUsedProcents > i) {

                            console.log(" ");
                            console.log([karrentKeyName] + " = " + vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_increases[karrentKeyName]);

                            if (!vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_increases[karrentKeyName]) {
                                // отправляем сообщение
                                let emodzi = "📈";
                                if (i > 50) emodzi = "📈 ❗"; // если занято больше половины места - меняем на красный цвет
                                vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                                    "Заполнение дискового места превысило " + i + "%, и составило " +
                                    Math.round(carrentUsedProcents) + "% = " +
                                    vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles + "байт",
                                    emodzi
                                );
                                // ставим отметку об отправке данного сообщения
                                vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_increases[karrentKeyName] = true;

                                console.log("После изменения: ");
                                console.log([karrentKeyName] + " = " + vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_increases[karrentKeyName]);

                                // Очищаем противоположный реестр сообщений:
                                clearMessagesReestr_decreases();
                                vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.timePreviousMassage = Date.now();
                            }

                            break;
                        }
                    }

                }
                else {  // тут - если произошло уменьшение занятого места
                    // проходим по интересующим нас значением и сравниваем
                    // тут идем снизу вверх 
                    for (let i = 10; i <= 100; i += 10) {
                        let karrentKeyName = "message_spaceOver_%_" + i;
                        // если создается условие отправки уведомления, и до этого оно не было отправлено - тогда отправляем его
                        if (carrentUsedProcents < i) {

                            // тут при необходимости отправляем сообщение
                            if (!vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_decreases[karrentKeyName]) {
                                vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                                    "Уменьшилось заполнение дискового места, ниже " + i + "%, и составило " +
                                    Math.round(carrentUsedProcents) + "% = " +
                                    vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles + "байт",
                                    '📉'
                                );
                                // ставим отметку об отправке данного сообщения
                                vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.messagesOverflow_decreases[karrentKeyName] = true;

                                // Очищаем противоположный реестр сообщений:
                                clearMessagesReestr_increases();
                                vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.timePreviousMassage = Date.now();
                            }

                            break;
                        }
                    }
                }

                vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.previos_usedTotalSpaceForAllClientsFiles = vars_and_functions___pr0003.usersFiles_Reestr._usedTotalSpaceForAllClientsFiles;




            } catch (error) {
                console.log(" ");
                console.log("Ошибка в controlOverflow_andInfoMessages ");
                console.log(error);
            }
        }
    },

}

await first_LoadData_pr0003();

//===============================


export const postService_pr0003 = {

    async uploadOneFileToServer_PS(req) {

        let postServise_answer = {
            comment: " ",
            mResStatus: 0,
        };

        try {
            const busboy = Busboy({ headers: req.headers });

            let postDataToServer = null;
            let accessToWork_vs_files_data = null;

            let fileWriteFinished = false;
            let real_file_Size = 0;

            let file_ID = null;
            let fileFullNameByID = null;
            let endOfFileName = null;
            let file_Name = null;

            const fileWritePromises = []; // массив промисов для ожидания записи

            // ─────────────────────────────
            // читаем поля (JSON с клиента)
            // ─────────────────────────────
            busboy.on('field', (fieldname, value) => {
                if (fieldname === 'postDataToServer_Obj_stringify') {
                    try {
                        postDataToServer = JSON.parse(value);
                        // console.log("postDataToServer =");
                        // console.log(postDataToServer);
                    } catch (e) {
                        throw new Error("Invalid JSON in postDataToServer_Obj_stringify");
                    }
                }
            });

            // ─────────────────────────────
            // читаем файл
            // ─────────────────────────────
            busboy.on('file', (fieldname, file, filename) => {

                if (!postDataToServer) {
                    file.resume();
                    return fileWritePromises.push(Promise.reject(new Error("postDataToServer not received before file")));
                }

                const filePromise = new Promise(async (resolve, reject) => {
                    try {
                        // проверка прав доступа
                        accessToWork_vs_files_data =
                            await accessToFiles_forUsers.access_toUploadFilesToServer_forUser(
                                {
                                    ...postDataToServer,
                                    accessToken_fromHeader: postDataToServer.accessToken,
                                }
                            );

                        if (!accessToWork_vs_files_data?.userAccessToCurrentFilesManipulations) {
                            file.resume();
                            return reject(new Error(accessToWork_vs_files_data?.comment || "Access denied"));
                        }

                        // console.log(" ");
                        // console.log("accessToWork_vs_files_data =");
                        // console.log(accessToWork_vs_files_data);

                        const owner_ID = accessToWork_vs_files_data.data_fromMainServer.ownerData.owner_ID;

                        const {
                            owner_Email,
                            user_Email,
                            corpAccount_ID,
                            project_ID,
                            file_NameFor_UTF8,
                        } = postDataToServer;

                        file_Name = file_NameFor_UTF8;

                        // формирование пути
                        const pathSaveFile =
                            await global_Functions_and_Servises_forAll_Projects
                                .files_loadAndSave_service
                                .createDir_andAll_intermediateDirectories(
                                    config_pr0003.usersDownloadFilesAdress + '/' +
                                    owner_ID + '/' +
                                    corpAccount_ID + '/' +
                                    project_ID
                                );

                        if (!pathSaveFile) {
                            file.resume();
                            return reject(new Error("error in createDir"));
                        }

                        const arrayOfName = file_Name.split(".");
                        endOfFileName = arrayOfName[arrayOfName.length - 1];

                        file_ID = global_Functions_and_Servises_forAll_Projects.random_id();
                        fileFullNameByID = `${file_ID}.${endOfFileName}`;

                        const fullPathAndName = `${pathSaveFile}/${fileFullNameByID}`;

                        const writeStream = fs.createWriteStream(fullPathAndName);

                        file.on('data', chunk => {
                            real_file_Size += chunk.length;

                            // проверка превышения заявленного размера
                            if (postDataToServer.file_Size && (real_file_Size > postDataToServer.file_Size)) {
                                file.unpipe(writeStream); // отключаем поток
                                writeStream.destroy();   // прерываем запись
                                file.resume();           // сбрасываем оставшиеся данные

                                vars_and_functions___pr0003.sendTelegramInfo_from_pr0003("Превышен заявленный клиентом размер файла !!!  Отправитель: " + postDataToServer.user_Email, "red");

                                return reject(new Error(`File size exceeded: expected ${postDataToServer.file_Size}, got >${real_file_Size}`));
                            }

                        });

                        file.pipe(writeStream);

                        writeStream.on('finish', () => {
                            fileWriteFinished = true;
                            resolve();
                        });

                        writeStream.on('error', reject);

                    } catch (error) {
                        reject(error);
                    }
                });

                fileWritePromises.push(filePromise);
            });

            // ─────────────────────────────
            // ожидание окончания Busboy
            // ─────────────────────────────
            await new Promise((resolve, reject) => {
                busboy.on('finish', resolve);
                busboy.on('error', reject);
                req.pipe(busboy);
            });

            // ждём окончания записи всех файлов на диск
            await Promise.all(fileWritePromises);

            console.log("fileWriteFinished= " + fileWriteFinished);

            if (!fileWriteFinished) {
                postServise_answer.comment = "file not uploaded";
                return postServise_answer;
            }

            // ─────────────────────────────
            // запись в реестр файлов
            // ─────────────────────────────
            vars_and_functions___pr0003.create_newFileItem_inFilesReestr({
                senderFile_Email: postDataToServer.user_Email,
                owner_Email: postDataToServer.owner_Email,
                owner_ID: accessToWork_vs_files_data.data_fromMainServer.ownerData.owner_ID,

                corpAccount_ID: postDataToServer.corpAccount_ID,
                project_ID: postDataToServer.project_ID,
                file_ID,
                file_Name,
                endOfFileName,
                fileFullNameByID,
                file_Size: real_file_Size,
            });

            vars_and_functions___pr0003.need_SaveData = true;
            vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace
                .controlOverflow_andInfoMessages();

            postServise_answer.comment = "file was succesful uploaded";
            postServise_answer.mResStatus = 1;

            return postServise_answer;

        } catch (error) {
            console.log("Ошибка uploadOneFileToServer_PS:", error);
            postServise_answer.comment = error.message || "upload error";
            return postServise_answer;
        }
    },

    //---------

    async getFilesListForCurrentProjectFromServer_PS(req) {

        // console.log(" ");
        // console.log("ЗАПУСК  getFilesListForCurrentProjectFromServer_PS");
        // console.log("req.body= ");
        // console.log(req.body);

        let postServise_answer = {
            comment: " ",
            mResStatus: 0, // варианты кодов: 1-успешно сохранено, 10, 11, 12 ...   
            // также сюда поместим ответ сервера
        };

        try {
            // запрашиваем права доступра для данного пользователя
            const accessToWork_vs_files_data = await accessToFiles_forUsers.access_readFilesForCurrentProject({
                ...req.body,
            });

            if (!accessToWork_vs_files_data?.userAccessToCurrentFilesManipulations) {
                console.log(" ");
                console.log("Отказано в доступе: ");
                console.log(accessToWork_vs_files_data?.comment);

                postServise_answer.comment = "user has not asses to project";
                postServise_answer.mResStatus = 0;
                return postServise_answer;
            }

            // если проверки пройдены - отдаем клиенту список файлов по нужному проекту
            postServise_answer.mResStatus = 1;
            postServise_answer.comment = "Access ok";
            postServise_answer.projectFilesList =
                vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email]?.corpAccounts[req.body.corpAccount_ID]?.projects[req.body.project_ID]?.files
                    ? vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email].corpAccounts[req.body.corpAccount_ID].projects[req.body.project_ID].files
                    : "Is no files in current project";

            postServise_answer.ownerslimitFiles = {
                currentFilesSize_forOwner: null,
                globAccessFilesSize_forOwner: null,
            }

            return postServise_answer;

        } catch (error) {
            // console.log("Ошибка в getFilesListForCurrentProjectFromServer_PS");
            // console.log(error);

            postServise_answer.comment = "Ошибка в getFilesListForCurrentProjectFromServer_PS";
            postServise_answer.mResStatus = 0;
            return postServise_answer;
        }
    },

    //---------

    async getAllFilesListForCurrentOwner_PS(req) {

        // console.log("ЗАПУСК  getFilesListForCurrentProjectFromServer_PS");
        // console.log("req.body= ");
        // console.log(req.body);

        let postServise_answer = {
            comment: " ",
            mResStatus: 0, // варианты кодов: 1-успешно сохранено, 10, 11, 12 ...   
            // также сюда поместим ответ сервера
        };

        try {
            // запрашиваем права доступа для данного пользователя
            const accessToWork_vs_files_data = await accessToFiles_forUsers.fullAccess_toFilesCurrentOwner({
                ...req.body,
            });

            if (!accessToWork_vs_files_data?.userAccessToCurrentFilesManipulations) {
                // console.log(" ");
                // console.log("Отказано в доступе: ");
                // console.log(accessToWork_vs_files_data?.comment);

                postServise_answer.comment = "user has not asses to project";
                postServise_answer.mResStatus = 0;
                return postServise_answer;
            }

            // если проверки пройдены - отдаем клиенту список всех его файлов //

            // console.log(" ");
            // console.log("vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email] = ");
            // console.log(vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email]);

            postServise_answer.mResStatus = 1;
            postServise_answer.comment = "Access ok";
            postServise_answer.allFilesList = vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email];

            // console.log(" ");
            // console.log("postServise_answer.allFilesList= ");
            // console.log(postServise_answer.allFilesList);

            return postServise_answer;

        } catch (error) {
            // console.log("Ошибка в getFilesListForCurrentProjgetAllFilesListForCurrentOwner_PSectFromServer_PS");
            // console.log(error);

            postServise_answer.comment = "Ошибка в getAllFilesListForCurrentOwner_PS";
            postServise_answer.mResStatus = 0;
            return postServise_answer;
        }
    },

    //---------

    async deleteFilesListOfProjectFromServer_PS(req) {

        // console.log(" ");
        // console.log("ЗАПУСК  deleteFilesListOfProjectFromServer_PS, req.body=");
        // console.log(req.body);
        // console.log("vars_and_functions___pr0003.usersFiles_Reestr= ");
        // console.log(vars_and_functions___pr0003.usersFiles_Reestr);

        let postServise_answer = {
            deleteErrorsList: [
                // сюда добавим список файлов, которые не удалось удалить
            ],

            comment: " ",
            mResKod: 0, // варианты кодов: 1-успешно сохранено, 10, 11, 12 ...   
            // также сюда поместим ответ сервера
        };

        try {
            // запрашиваем права доступа для данного пользователя
            const accessToWork_vs_files_data = await accessToFiles_forUsers.access_deleteFilesListOfProjectFromServer({
                ...req.body,
            });

            if (!accessToWork_vs_files_data?.userAccessToCurrentFilesManipulations) {
                console.log(" ");
                console.log("Отказано в доступе: ");
                console.log(accessToWork_vs_files_data?.comment);

                postServise_answer.comment = "user has not asses to project";
                postServise_answer.mResStatus = 0;
                return postServise_answer;
            }

            // если проверки пройдены - удаляем файлы по списку
            try {
                for (const element of req.body.deleteFilesList) {
                    try {
                        // Проверяем, является ли пользователь отправителем данного файла, 
                        // и разрешено ли отправителям в данном проекте удалять свои файлы
                        if (
                            req.body.user_Email !== element.senderFile_Email
                            ||
                            !accessToWork_vs_files_data.projectData.project_settings.project_attachedFiles_settings.isPosibleDeleteFalesForSenderInCurrentProject
                        ) {
                            element.errorDeleteComment = "Пользователю не разрешено удалять данный файл";
                            postServise_answer.deleteErrorsList.push({ element });
                            // активировать
                            // continue;
                        }

                        // console.log(" ");
                        // console.log("element = ");
                        // console.log(element);

                        // удаляем файл
                        await this.delete_oneFileFromDisk_andFromReestr(
                            element.owner_Email,
                            element.owner_ID,
                            element.corpAccount_ID,
                            element.project_ID,
                            element.file_ID,
                            element.fileFullNameByID
                        );

                    } catch (error) {
                        console.log(" ");
                        console.log("Ошибка при удалении файла: " + element);
                        console.log(error);

                        try {
                            element.errorDeleteComment = "Файл не найден на диске";
                            postServise_answer.deleteErrorsList.push({ element });
                        } catch (error) {
                            console.log(" ");
                            console.log("Ошибка при добавлении инфо об удалении файла");
                            console.log(error);
                        }
                    }
                }
            } catch (error) {
                console.log("Ошибка в deleteFilesListOfProjectFromServer_PS (в цикле)");
                console.log(error);
            }

            // далее контроль свободного места на диске
            vars_and_functions___pr0003.controlAndMessages_aboutDiskSpace.controlOverflow_andInfoMessages();

            //  Не работает удаление из реестра

            postServise_answer.mResStatus = 1;
            postServise_answer.comment = "Access ok";
            postServise_answer.allFilesList = vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email];

            postServise_answer.projectFilesList =
                vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email]?.corpAccounts[req.body.corpAccount_ID]?.projects[req.body.project_ID]?.files
                    ? vars_and_functions___pr0003.usersFiles_Reestr[req.body.user_Email].corpAccounts[req.body.corpAccount_ID].projects[req.body.project_ID].files
                    : "Is no files in current project";

            return postServise_answer;

        } catch (error) {
            console.log("Ошибка в deleteFilesListOfProjectFromServer_PS");
            console.log(error);

            postServise_answer.comment = "Ошибка в deleteFilesListOfProjectFromServer_PS";
            postServise_answer.mResStatus = 0;
            return postServise_answer;
        }
    },

    //---------

    async downloadOneFileFromServer_PS(req) {

        console.log(" ");
        console.log("Pfgecr downloadOneFileFromServer_PS, req.body= ");
        console.log(req.body);

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно найдено
            comment: " ",
        };

        try {
            // запрашиваем права доступа для данного пользователя
            const accessToWork_vs_files_data = await accessToFiles_forUsers.access_readFilesForCurrentProject({
                ...req.body,
            });

            if (!accessToWork_vs_files_data) {
                postServise_answer.comment = "user has not access to project";
                postServise_answer.mResStatus = 0;
                return postServise_answer;
            }

            // формируем путь **как в твоем исходном коде** (исключительно из req.body)
            const filePath =
                global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(
                    config_pr0003.usersDownloadFilesAdress + '/' +
                    req.body.owner_ID + '/' +
                    req.body.corpAccount_ID + '/' +
                    req.body.project_ID + '/' +
                    req.body.fileFullNameByID
                );

            // проверяем, что файл реально существует
            await fs.promises.access(filePath, fs.constants.F_OK);

            postServise_answer.mResStatus = 1;
            postServise_answer.filePath = filePath;
            postServise_answer.fileName = req.body.file_Name;

            return postServise_answer;

        } catch (error) {
            console.log("Ошибка в downloadOneFileFromServer_PS");
            console.log(error);

            postServise_answer.comment = "Ошибка в downloadOneFileFromServer_PS";
            postServise_answer.mResStatus = 0;
            return postServise_answer;
        }
    },
    //---------

    async delete_oneFileFromDisk_andFromReestr(
        owner_Email,
        owner_ID,
        corpAccount_ID,
        project_ID,
        file_ID, // это нужно для удалеия из реестра
        fileFullNameByID // это нужно для удаления с диска
    ) {

        try {
            let pathDeleteFile = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(
                config_pr0003.usersDownloadFilesAdress +
                owner_ID + '/' +
                corpAccount_ID + '/' +
                project_ID + '/' +
                fileFullNameByID
            )

            // console.log(" ");
            // console.log("pathDeleteFile =");
            // console.log(pathDeleteFile);

            // Проверяем наличие файла
            try {
                await fs.promises.access(pathDeleteFile, fs.constants.F_OK);
                // Если файл найден - Удаляем его с диска
                await fs.promises.unlink(pathDeleteFile);
            } catch {
                // Файл не найден
                // element.errorDeleteComment = "Файл не найден на диске";
                // postServise_answer.deleteErrorsList.push({ element });

                console.log(" ");
                console.log("Ошибка при удалении файла - Файл не найден на диске");
            }

            // Удаляем запись в реестре, независимо от наличия файла на диске, т.к. при частой перегрузке сервера в режиме отладки реестр не всегда успевает сохраниться на диск после удаления файлов
            vars_and_functions___pr0003.delete_fileItem_inFilesReestr(
                owner_Email,
                corpAccount_ID,
                project_ID,
                file_ID
            );

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в delete_oneFileFromDisk_andFromReestr");
            console.log(error);
        }
    },

    //---------

    get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PS(req) {
        // console.log(" = = = = = = = = = = = = =  ");
        // console.log("ЗАПУСК  get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PS, req.body=");
        // console.log(req.body);

        let postServise_answer = {
            mResKod: 0,    // варианты кодов: 1-успешно, 10, 11, 12 ...   
            comment: " ",
        };

        try {
            // Сюда добавить функционал
            let resCopyData =
                add_data_to_input_steck_deleting_projects_and_corpAccounts(req.body);

            if (resCopyData.mResKod == 1) {
                postServise_answer.mResKod = 1;
                postServise_answer.comment = "List was sucsessful accepted";
                return (postServise_answer);
            }
            else {
                postServise_answer.mResKod = 0;
                postServise_answer.comment = "Error coping data list";
                return (postServise_answer);
            }

        } catch (error) {
            console.log("Ошибка в get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PS");
            console.log(error);

            postServise_answer.mResKod = 0;
            postServise_answer.comment = "Ошибка в get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PS";
            return (postServise_answer);
        }
    },
}
