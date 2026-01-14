


// import { serverVarriorsDataFromBD_pr0001 } from './postService_pr0001.js';
import { NEW__dataModels } from './dataModels.js';

import fs from 'fs';
import e, { json } from 'express';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';

import fetch, { Headers, Request, Response } from 'node-fetch';
import { Blob } from 'fetch-blob';
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.Blob = Blob;

import validator from 'validator';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import nodemailer from 'nodemailer';
import zlib from 'zlib'; // для сжатия данных
import config_pr0001 from './config_pr0001.js';
// import { create_singleProject, create_single_subProject, create_User_ResponseStack, } from "./dataModels.js";
import { create_user_inReestr, create_user_AccessProjects, create_subProjectEvents_inUserReestr } from "./usersReestrModels.js";
import { create_Chat, create_messageInChat } from "./chatStructure.js";
import { global_Functions_and_Servises_forAll_Projects } from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import { first_LoadData_pr0001 } from './saveAndLoadDataServise_pr0001.js'

import { download_githab_cms_file } from './clients_cms_data_pr0001/clients_contracts_cms_service_pr0001.js';

import config_serverCombi from '../config_serverCombi.js';
import { connectionTo_infoTelegramBot } from '../server.js';
import { vars_and_functions___pr0003 } from '../_pr0003_filesServer/postService_pr0003.js';
import { addProject_toDeletingFiles, addCorpAcc_toDeletingFiles } from './deleteClientsDeadsFiles_service_pr0001.js';
import { error } from 'console';
import { Error } from 'mongoose';



//----------------------------------
//----------------------------------
//----------------------------------

// Непрерывная функция контроля зависших респонсов
async function clearDeadResponses() {
    const CHECK_INTERVAL = 20_000;     // как часто проверяем
    const LONG_POLL_TIMEOUT = 20_000;  // максимальное время жизни запроса

    while (true) {

        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));

        try {
            const now = Date.now();
            // счетчик удаленных запросов
            let timeoutsTriggered = 0;

            // перебор всех пользователей
            for (const user_Email in serverVarriorsDataFromBD_pr0001.longPoollingList) {

                const stack = serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email];
                if (!Array.isArray(stack) || stack.length === 0) continue;

                // перебор всех long-polling объектов
                for (const item of stack) {

                    // обязательная защита
                    if (!item || item.isFinished) continue;

                    // проверка тайм-аута
                    if (now - item.time_ofCreateCallBack >= LONG_POLL_TIMEOUT) {
                        try {
                            // тут вызываем закрытие зависшего запроса
                            item.callBack_longPoolling({ timeout: true });
                            timeoutsTriggered++;
                        } catch (err) {
                            console.log("clearDeadResponses: ошибка при вызове callback:", err);
                        }
                    }

                    // console.log(" ");
                    // console.log("После срабатывания clearDeadResponses количество зависших ЛонгПуллингов в НОВОЙ версии= " + stack.length);
                }
            }

            if (timeoutsTriggered > 0) {
                // console.log( "clearDeadResponses: тайм-аутов инициировано =",   timeoutsTriggered    );
            }


        } catch (error) {
            console.log("clearDeadResponses: критическая ошибка:", error);
        }
    }
}
// Запуск функции
clearDeadResponses();

//----------------------------------
//----------------------------------

export const serverVarriorsDataFromBD_pr0001 = {
    users_Reestr: {},
    projects_DB: {},
    chat_DB: {},
    longPoollingList: new Set(),


    clientsContractsReestr_cms: {},

    deletingSteck_of_corppAccaunts_and_projects__forDeletingUsersFiles: {
        deleting_Projects: [],
        deleting_corpAccounts: [],
    },

    // это объект для передачи списка удаленных проектов и корпАккаунтов на файловый сервер для удаления соответствующих файлов пользователей
    control_and_send___listOfDeleting__projects_and_corpAccounts: {

        currentIndex_saveObject: 0,   // тут либо 0, либо 1
        saveObject: [ // тут поместим два элемента массива из функции f_returnClearList, которые будут использоваться поочередно для накопления данных, в то время как с другого эелементы в асинхронном режиме будут отправляться данные на файловый сервер
            {
                deleting_Projects: [],
                deleting_corpAccounts: [],
            },

            {
                deleting_Projects: [],
                deleting_corpAccounts: [],
            },
        ],

        f_returnClearList: () => { //эта фун возвращает очищенные реестр для хранения списков
            return {
                deleting_Projects: [],
                deleting_corpAccounts: [],
            }
        },

        // Эта функция добавляет проекты
        f_addProject_toDeletingFiles: (mArgObj) => {
            try {
                this.saveObject[currentIndex_saveObject].deleting_Projects.push(mArgObj);
            } catch (error) {
                console.log("Ошибка в f_addProject_toDeletingFiles", error);
            }
        },

        // Эта функция добавляет корпАккаунты
        f_addCorpAcc_toDeletingFiles: (mArgObj) => {
            try {
                control_and_send___listOfDeleting__projects_and_corpAccounts.saveObject[currentIndex_saveObject].deleting_corpAccounts.push(mArgObj);
            } catch (error) {
                console.log("Ошибка в f_addCorpAcc_toDeletingFiles", error);
            }
        },


        f_send_data_to_filesServer: async () => {

            // проверяем, есть ли данные для передачи
            try {
                if (
                    !(control_and_send___listOfDeleting__projects_and_corpAccounts.saveObject[currentIndex_saveObject].deleting_Projects.length > 0)
                    &&
                    !(control_and_send___listOfDeleting__projects_and_corpAccounts.saveObject[currentIndex_saveObject].deleting_corpAccounts.length > 0)
                ) {
                    // если нет данных для передачи, перезапускаем таймер и прерываем функцию

                    return;
                }
            } catch (error) {
                console.log("Ошибка при проверке необходимости передавать данные", error);
            }

            // запоминаем номер объекта, из которого будем отправлять данные
            let usedIndex_saveObject = serverVarriorsDataFromBD_pr0001.control_and_send___listOfDeleting__projects_and_corpAccounts.currentIndex_saveObject;

            // предварительно переключаем объект для накопления новых данных
            serverVarriorsDataFromBD_pr0001.control_and_send___listOfDeleting__projects_and_corpAccounts.currentIndex_saveObject =
                serverVarriorsDataFromBD_pr0001.control_and_send___listOfDeleting__projects_and_corpAccounts.currentIndex_saveObject == 0 ? 1 : 0;

            // обнуляем содержимое нового объекта
            // начинаем отправку данных
        }
    },


    mySecretKey_forAccessToken: "thisIsMySecretKey_ForAccessToken",
    mySecretKey_forRefreshToken: "thisIsMySecretKey_ForRefreshToken",
}

// Загружаем базы данных в проект
await first_LoadData_pr0001();
// Загружаем файл настроек
await download_githab_cms_file();

//----------------------------------

export const postService_pr0001 = {

    get_full_data_from_server_PS() {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            postServise_answer.mResStatus = 1;
            postServise_answer.dataFromServer = {
                projects_DB: serverVarriorsDataFromBD_pr0001.projects_DB,
                users_Reestr: serverVarriorsDataFromBD_pr0001.users_Reestr,
                chat_DB: serverVarriorsDataFromBD_pr0001.chat_DB,

                usersFiles_Reestr: vars_and_functions___pr0003.usersFiles_Reestr,

                projects_DB: serverVarriorsDataFromBD_pr0001.projects_DB,
                users_Reestr: serverVarriorsDataFromBD_pr0001.users_Reestr,
                chat_DB: serverVarriorsDataFromBD_pr0001.chat_DB,
            }
            return postServise_answer;
        }
        catch (error) {

            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- get_full_data_from_server: ");
            console.log(error);

            postServise_answer.mResStatus = 0;
            dataFromServer = null;

            return postServise_answer;
        }

    },

    async download_clientsContractsData_cms_fromGitHub_toMainServer_PS() {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        // Отправляем информацию на телеграмм
        try {
            await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.messegeToCurrentTelegramBot(
                connectionTo_infoTelegramBot,
                config_serverCombi.adminTelegramAccount_ID_for_information,
                config_pr0001.projectNameID, // Название проекта
                "Запускаем download_clientsContractsData_cms_fromGitHub_toMainServer_PS", // текст сообщения
                config_pr0001.emodziListTelegram_currentProject.default_currentProjectEmodzi //емодзи из переменной, из списка 
            );
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }


        try {
            postServise_answer.dataFromServer = await download_githab_cms_file();
            postServise_answer.mResStatus = 1;

            return postServise_answer;
        }

        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- download_clientsContractsData_cms_fromGitHub_toMainServer_PS: ");
            console.log(error);

            postServise_answer.dataFromServer = null;
            postServise_answer.mResStatus = 0;

            return postServise_answer;
        }
    },

    getTopData_ByClient_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            // console.log(" ");
            // console.log("+++++ ЗАПУСК getTopData_ByClient_PS, headers=");
            // console.log(req.headers);
            // console.log("+++++ ЗАПУСК getTopData_ByClient_PS, postDataToServer=");
            // console.log(req.body.postDataToServer);


            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let user_Email = req.headers.decodeAT_____user_Email;
            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);
            let pointer_currentUser_in_projectsDB = functions___pr0001.get_pointer_currentUser_in_projectsDB(user_Email);

            /* 
            console.log(" ");
            console.log("user_Email= "+user_Email);

            console.log(" ");
            console.log("req.body.postDataToServer.user_Email= "+req.body.postDataToServer.user_Email);

            console.log(" ");
            console.log("pointer_currentUserInReestr=");
            console.log(pointer_currentUserInReestr);

            console.log(" ");
            console.log("pointer_currentUser_in_projectsDB=");
            console.log(pointer_currentUser_in_projectsDB);
            */

            if (
                // если не совпадает Емайл пользователя
                user_Email != req.body.postDataToServer.user_Email
                ||
                // или пользователь не найден в реестре пользователей
                !pointer_currentUserInReestr
                ||
                // или пользователь не найден в БД
                !pointer_currentUser_in_projectsDB
            ) {
                throw new Error("Ошибка в идентификации клиента: " + req.body.postDataToServer.user_Email)
            }

            // Перед отправкой данных - нужно заполнить/освежить названия сторонних корп Аккаунтов, доступных данному пользователю
            let other_corpAccounts_list_Arr = Object.values(pointer_currentUser_in_projectsDB.corpAccounts.otherAccounts);
            other_corpAccounts_list_Arr.forEach(current_other_corpAcc => {

                // Добавить сюда функционал

            });


            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "getTopData_ByClient",
                dataBD_fromServer_FILTER_FOR_CURRENT_CLIENT: {
                    user_Email: user_Email,
                    user_ID: pointer_currentUserInReestr.user_ID,
                    user_corpAccounts_and_Projects: pointer_currentUser_in_projectsDB.corpAccounts,
                    contactList: pointer_currentUserInReestr.contactList,
                    tarif_plan: pointer_currentUserInReestr.tarif_plan,
                    userPublicData: pointer_currentUserInReestr.userPublicData,
                },
            }

            // Позже добавить данные - в каждый посторонний корпАккаунт добавить его название, тк по умолчанию мы имеем только ID стороннего корп аккаунта

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- getTopData_ByClient_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- getTopData_ByClient_PS, user_Email= " + req.body.postDataToServer.user_Email;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    async GoogleAuth_01_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            // проверяем токен от Гугл 
            const GOOGLE_CLIENT_ID = config_serverCombi.mGoogle_client_id; // твой client_id от Google
            const client = new OAuth2Client(GOOGLE_CLIENT_ID);

            // let credentialFromGoogle = jwt_decode(req.body.postDataToServer.credentialFromGoogle);

            // Проверка токена
            let credentialFromGoogle = null;
            try {
                credentialFromGoogle = await client.verifyIdToken({
                    idToken: req.body.postDataToServer.credentialFromGoogle,
                    audience: GOOGLE_CLIENT_ID,
                });
                console.log(" ");
                console.log("Валидация пройдена ✅");
            } catch (err) {
                console.log("Валидация не пройдена ❌");
                console.log(err);

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Валидация не пройдена ❌";
                return postServise_answer;
            }

            // console.log(" ");
            // console.log("credentialFromGoogle.payload= ");
            // console.log(credentialFromGoogle.payload);

            if (!credentialFromGoogle) {  // в случае непройденной валидации - в эту переменную ничего не запишется

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка при аудентификации пользователя";
                return postServise_answer;
            }

            // Если проверка токена Гугл пройдена - используем раскешированные данные из токена Гугл
            let client_googleEmail = credentialFromGoogle.payload.email;
            let gadget_process_ID = req.body.postDataToServer.gadget_process_ID;
            let timeCreateRequest = req.body.postDataToServer.timeCreatRequest; // нужно будет при расшифровке нашего токена

            // далее в случае успешной проверки авторизируем (либо добавляем нового пользователя в реестр и также авторизируем)            
            const userPointer = functions___pr0001.get_pointer_currentUserInReestr__OR__add_newUser_and_getPointer(
                client_googleEmail,
                credentialFromGoogle.payload.given_name, // необязательный аргумент
                credentialFromGoogle.payload.family_name,  // необязательный аргумент
                null, // user_nick,  // необязательный аргумент
                credentialFromGoogle.payload.picture,  // необязательный аргумент
            );

            // console.log(" ");
            // console.log("userPointer= ");
            // console.log(userPointer);

            if (!userPointer) {
                console.log(" ");
                console.log("Ошибка при доступе к пользователю в реестре ");

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка при доступе к пользователю в реестре";
                return postServise_answer;
            }

            // добавляем в реестр пользователя данные авторизации, из входящего токена
            serverVarriorsDataFromBD_pr0001.users_Reestr[client_googleEmail].autorisationData.googleAuthData = credentialFromGoogle;

            // Создаем токен доступа и рефреш токен для данного пользователя (с учетом активного Гаджета) 
            let newTokens = functions___pr0001.generateTokens({
                user_Email: client_googleEmail,
                gadget_process_ID: gadget_process_ID,
            });

            // записываем/перезаписываем токены в реестр юзера
            serverVarriorsDataFromBD_pr0001.users_Reestr[client_googleEmail].autorisationData.tokensDifferentGadgets[gadget_process_ID] = {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
            };

            // далее, если пользователь новый - создаем первичные данные и базовый корпАккаунт в БД проектов
            try {
                functions___pr0001.check_AND_get___OR___create_AND_get___currentUsersCorpAccaunts_in_projectsDB(client_googleEmail);

            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке проверить и создать новыю запись пользователя в projects_DB ");
                console.log(error);

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка при попытке проверить и создать новыю запись пользователя в projects_DB";
                return postServise_answer;
            }

            let postServise_answer = {
                mResStatus: 1,

                dataFromServer: {
                    user_Email: serverVarriorsDataFromBD_pr0001.users_Reestr[client_googleEmail].user_Email,
                    accessToken: serverVarriorsDataFromBD_pr0001.users_Reestr[client_googleEmail].autorisationData.tokensDifferentGadgets[gadget_process_ID].accessToken,
                }
            }

            return postServise_answer;

        } catch (error) {
            console.log("ОШИБКА m_GoogleAuth_01_PS: " + error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "ОШИБКА m_GoogleAuth_01_PS";
            return postServise_answer;
        }

    },

    subscribeFullTime_PS(req, res) {
        // Важно - сюда поступает Респонс для дальнейшей обруботки ззесь
        try {
            // console.log(" ");
            // console.log("Запуск subscribeFullTime_PS, postDataToServer= ");
            // console.log(req.body.postDataToServer);

            let user_Email = req.headers.decodeAT_____user_Email;
            const reqID_fromRequest = req.body.postDataToServer.req_ID;

            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);
            let pointer_currentUser_in_projectsDB = functions___pr0001.get_pointer_currentUser_in_projectsDB(user_Email);

            if (
                // если не совпадает Емайл пользователя
                user_Email != req.body.postDataToServer.user_Email
                ||
                // или пользователь не найден в реестре пользователей
                !pointer_currentUserInReestr
                ||
                // или пользователь не найден в БД
                !pointer_currentUser_in_projectsDB
            ) {
                throw new Error("Ошибка в идентификации клиента в subscribeFullTime_PS: " + req.body.postDataToServer.user_Email)
            }

            // Унифицированная функция очистки текущего запроса
            function removeLongPollingFromStack(user_Email, longPolling_answer_Obj) {
                // эта функция удаляет для конкретного пользователя отработанные или мертвый запрос ЛонгПуллинг из стека вызовов
                const stack = serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email];
                if (!stack) return;

                serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email] = stack.filter(item => item !== longPolling_answer_Obj);
            }

            let longPolling_answer_Obj = {
                isFinished: false,   // флаг завершения
                time_ofCreateCallBack: Date.now(),
                res: res,

                callBack_longPoolling: (dataFromServer) => {
                    // 1️⃣ защита от повторного вызова
                    if (longPolling_answer_Obj.isFinished) return;
                    longPolling_answer_Obj.isFinished = true;

                    // 2️⃣ формируем ответ
                    const responseFromServer_longPoolling = {
                        user_Email: user_Email,
                        req_ID: reqID_fromRequest,
                        dataFromServer: dataFromServer, // может быть { timeout: true } или реальные данные
                    };

                    try {
                        // 3️⃣ отправка ответа, если соединение ещё открыто
                        if (res && !res.writableEnded) {
                            res.status(200).json(responseFromServer_longPoolling);
                        }
                    } catch (err) {
                        // 4️⃣ res мог быть закрыт конкурентно — игнорируем
                        console.log("callBack_longPoolling: ошибка при отправке ответа", err);
                    } finally {
                        // 5️⃣ удаляем себя из стека через единую функцию очистки
                        removeLongPollingFromStack(user_Email, longPolling_answer_Obj);
                    }
                }
            };

            // создаем стек запросов для пользователя, если до этого его не было
            serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email] ??= [];

            // добавляем в стек пользователя очередной ЛонгПуллинг
            serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email].push(longPolling_answer_Obj);

            // console.log(" ");
            // console.log("Количество зависших res-ЛонгПуллингов в НОВОЙ версии= " + serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email].length);

            // В случае закрытия браузера клиентом или при штатном закрытии res.json() 
            res.on("close", () => {
                if (longPolling_answer_Obj.isFinished) return;
                longPolling_answer_Obj.isFinished = true;

                try {
                    if (!res.writableEnded) {
                        res.end();
                    }
                } catch (error) {
                    // игнор — соединение могло быть убито
                    console.log(" ");
                    console.log("Ошибка в res.on  close");
                    console.log(error);
                }
                removeLongPollingFromStack(user_Email, longPolling_answer_Obj);
            });

            // обновляем информацию об онлайн статусе данного пользователя
            pointer_currentUserInReestr.onlineStatus.lastOnlineTime = Date.now();

            // console.log(" ");
            // console.log("longPoollingList= ");
            // console.log(serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email]);

            // контролируем количество висящих запросов для пользователя
            if (serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email].length > 5) {
                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Слишком большое количество лонгПуллингов для одного клиента, user_Email= " + user_Email + ", и составляет " + serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email].length + " соединений",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red);
            }

            else if (serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email].length > 2) {
                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Повышенное количество лонгПуллингов для одного клиента, user_Email= " + user_Email + ", и составляет " + serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email].length + " соединений",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow);
            }

        }

        catch (error) {

            console.log(" ");
            console.log("Ошибка в subscribeFullTime_PS");
            console.log(error);

            // закрываем res             
            try {
                res.status(500).json("error subscribeFullTime_PS");
                return;
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при отправке res.status(500) в catch - subscribeFullTime_PS");
                console.log(error);
            }
        }
    },

    // ========================

    add_newCorpAccount_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: null,
        };


        try {
            console.log(" ");
            console.log("Запуск add_newCorpAccount_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            let user_Email = req.body.postDataToServer.user_Email;
            let countCorpAccounts_currentOwner = 0;

            let pointer_currentUser_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);

            if (!pointer_currentUser_inUsersReestr) {
                console.log(" ");
                console.log("Ошибка в add_newCorpAccount_PS - не найден пользователь: " + user_Email);

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка в add_newCorpAccount_PS - не найден пользователь: " + user_Email;
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }


            let pointer_currentUser_in_projects_DB = functions___pr0001.check_AND_get___OR___create_AND_get___currentUsersCorpAccaunts_in_projectsDB(user_Email);

            // проверяем переполнение лимита количества корпАккаунтов и при необх отправляем себе уведомление        

            const limit_countCorpAcc_forCurrentOwner = pointer_currentUser_inUsersReestr?.tarif_plan?.maxCount_freeCorpAccounts
                ? pointer_currentUser_inUsersReestr.tarif_plan.maxCount_freeCorpAccounts
                : config_pr0001?.default_limits_forOneUser?.defaultMaxCount_freeCorpAccounts;

            try {

                countCorpAccounts_currentOwner = Object.keys(pointer_currentUser_in_projects_DB.corpAccounts.ownCorpAccounts).length;

                if (
                    limit_countCorpAcc_forCurrentOwner
                    &&
                    (limit_countCorpAcc_forCurrentOwner <= countCorpAccounts_currentOwner)
                ) {
                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        "Превышен лимит бесплатных корпАккаунтов, и составил " + countCorpAccounts_currentOwner + " шт, владелец: " + user_Email,
                        '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red);

                    postServise_answer.mResStatus = 444;
                    postServise_answer.comment = "Превышен лимит бесплатных корпАккаунтов, и составил ";
                    postServise_answer.messageForClient = "Overflow corpAccaunts count limit";
                    postServise_answer.dataFromServer = null;
                    return postServise_answer;
                }

                // тут проверяем приближение к половинному лимиту
                else {
                    if (limit_countCorpAcc_forCurrentOwner
                        &&
                        ((limit_countCorpAcc_forCurrentOwner / 2) <= countCorpAccounts_currentOwner)
                    ) {
                        functions___pr0001.sendTelegramInfo_from_pr0001(
                            "Пройдена половина бесплатных корпАккаунтов, и составила " + (countCorpAccounts_currentOwner + 1) + ", владелец: " + user_Email,
                            '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow);
                    }
                }

            } catch (error) {
                console.log(" ");
                console.log("Ошибка при проверке лимита количества корпАккаунтов");
                console.log(error);

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка при проверке лимита количества корпАккаунтов" + ", владелец: " + user_Email,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка при проверке лимита количества корпАккаунтов";
                dataFromServer = null;
                return postServise_answer;
            }

            let new_corpAccount_Name = req.body.postDataToServer.corpAccount_Name;

            // Проверяем наличие название корп аккаунта
            if (!new_corpAccount_Name) {
                console.log(" ");
                console.log("Ошибка при создании корпАккаунта, имя корпаккаунта не указано");

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка при создании корпАккаунта, имя корпаккаунта не указано";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // Проверяем лимит по длинне названия корп аккаунта
            if (new_corpAccount_Name.length > config_pr0001.data_limits.name_corpAcc_longLimit) {
                throw new Error("Ошибка в add_newCorpAccount_PS, имя корпАккаунта длиньше установленного предела");
            }

            // предотвращаем дублирование имен Корп аккаунтов при создании
            let existNameDublicate = Object.values(pointer_currentUser_in_projects_DB.corpAccounts.ownCorpAccounts).some(
                item => item.corpAccount_data.corpAccount_Name == new_corpAccount_Name
            )
            if (existNameDublicate) {
                throw new Error("Ошибка в add_newCorpAccount_PS, дублирование названия");
            }

            // создаем корп аккаунт в реестре пользователя
            let newCorpAccount = NEW__dataModels.create_singleCorpAccount(
                user_Email,
                new_corpAccount_Name
            )

            if (!newCorpAccount) {
                console.log(" ");
                console.log("Ошибка создании корпАккаунта, корп аккаунт не был создан");

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка создании корпАккаунта, корп аккаунт не был создан";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // добавляем в реестр пользователя
            pointer_currentUser_in_projects_DB.corpAccounts.ownCorpAccounts[newCorpAccount.corpAccount_data.corpAccount_ID] = newCorpAccount;


            console.log(" ");
            console.log("Корп аккаунт успешно создан: ");
            console.log(newCorpAccount);

            // Отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Добавлен новый корпАккаунт, пользователь: " + user_Email + ", число корпАккаунтов = " + (countCorpAccounts_currentOwner + 1) + " шт.",
                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green
            );

            postServise_answer.mResStatus = 1;
            postServise_answer.comment = "Корп аккаунт успешно создан";
            postServise_answer.dataFromServer = {
                resEndPoint: "was_added_new_corpAccount",
                user_Email: user_Email,
                newCorpAccount: newCorpAccount,

                // возможно это позже удалить
                newOwnCorpAccountsList: pointer_currentUser_in_projects_DB.corpAccounts.ownCorpAccounts,
            }

            return postServise_answer;
        }

        catch (error) {

            console.log(" ");
            console.log("Ошибка в add_newCorpAccount_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в add_newCorpAccount_PS";
            postServise_answer.dataFromServer = null;
            return postServise_answer;
        }
    },

    add_newProject_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            // console.log(" ");
            // console.log("Запуск add_newProject_PS, postDataToServer= ");
            // console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.sender_ofRequest_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount.corpAccount_ID;
            let project_settings = req.body.postDataToServer.projectSettings;


            let pointer_currentUser_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(parent_owner_Email);

            let pointer_currentOwnCorpAccount_in_projectsDB = functions___pr0001.get_pointer_current_corpAccount_in_projectsDB(parent_owner_Email, parent_corpAccount_ID);

            // Проверяет наличие пользователя в реестре Юзеров и родительский корпАккаунт 
            if (!pointer_currentUser_inUsersReestr || !pointer_currentOwnCorpAccount_in_projectsDB) {
                console.log(" ");
                console.log("Ошибка добавления проекта - Не обнаружен пользователь в реестре Юзеров, либо родительский корпАккаунт ");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка добавления проекта - Не обнаружен пользователь в реестре Юзеров, либо родительский корпАккаунт, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Не обнаружен пользователь в реестре Юзеров, либо родительский корпАккаунт";
                return postServise_answer;
            }


            let countProjects_inCurrentCorpAcc = Object.keys(pointer_currentOwnCorpAccount_in_projectsDB.projects).length;

            // проверяем переполнение лимита количества проектов и при необх отправляем себе уведомление         

            const limit_countPtojects_forCurrentOwner = pointer_currentUser_inUsersReestr?.tarif_plan?.maxCount_freeProjects_inEachCorpAccount
                ? pointer_currentUser_inUsersReestr.tarif_plan.maxCount_freeProjects_inEachCorpAccount
                : config_pr0001?.default_limits_forOneUser?.defaultMaxCount_freeProjects_inEachCorpAccount;

            try {
                if (limit_countPtojects_forCurrentOwner
                    &&
                    (limit_countPtojects_forCurrentOwner <= countProjects_inCurrentCorpAcc)) {
                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        "Превышен лимитт количества проектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + " , и составил: " + countProjects_inCurrentCorpAcc + " шт.",
                        '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                    );

                    console.log(" ");
                    console.log("Превышен лимитт количества проектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + " , и составил: " + countProjects_inCurrentCorpAcc + " шт.");

                    postServise_answer.mResStatus = 444;
                    postServise_answer.comment = "Превышен лимитт количества проектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + " , и составил: " + countProjects_inCurrentCorpAcc + " шт.";
                    postServise_answer.messageForClient = "Overflow project count limit";
                    postServise_answer.dataFromServer = null;
                    return postServise_answer;
                }

                // тут проверяем приближение к половинному лимиту
                else {
                    if (limit_countPtojects_forCurrentOwner
                        &&
                        ((limit_countPtojects_forCurrentOwner / 2) <= countProjects_inCurrentCorpAcc)) {
                        functions___pr0001.sendTelegramInfo_from_pr0001(
                            "Пройдена половина бесплатных Проектов для одного корп аккаунта, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + " , и составил: " + (countProjects_inCurrentCorpAcc + 1) + " шт.",
                            '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                        );
                    }
                }
            } catch (error) {
                console.log("Ошибка при проверке лимита количества проектов");
                console.log(error);

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка при проверке лимита количества проектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка при проверке лимита количества проектов";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // создаем экземпляр нового проекта
            let newProject = NEW__dataModels.create_singleProject(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_settings
            );

            let newProject_ID = newProject.project_data.project_ID;

            // Добавляем в БД проектов для овнера
            pointer_currentOwnCorpAccount_in_projectsDB.projects[newProject_ID] = newProject;

            // добавляем проект в реестр доступных пользователей
            try {
                if (
                    project_settings?.teamList
                    &&
                    (Object.keys(project_settings.teamList).length > 0)
                ) {
                    // создаем оперативный массив из списков участников
                    let tempArr_teamItems = Object.values(project_settings.teamList);

                    // для каждого участника проекта - добавляем данный проект в список долсутпных проектов для каждого юзера из команды
                    tempArr_teamItems.forEach(item => {
                        functions___pr0001.include_currentProject_inAssessList_teamUser(
                            parent_owner_Email,
                            parent_corpAccount_ID,
                            newProject_ID,

                            item.user_Email, // Тут Емейл члена команды, которому даем доступ к данному проекту
                        )
                    });
                }

            } catch (error) {
                console.log("Ошибка при добавлении проекта в список Доступных для участников проекта");
                console.log(error);
                return error;
            }


            // Отправляем рассылку на ЛонгПуллинг
            try {
                // console.log("Попытка вызова responseLongPoolling:");
                // создаем данные для ответа  responseLongPoolling
                const responseLongPoolling_Data = {
                    resEndPoint: "added_newProject",
                    newAddedProject: newProject,
                    userSendList_Obj: newProject?.project_settings?.teamList
                }
                // Активировать позже
                // responseLongPoolling(responseLongPoolling_Data);
            } catch (error) {
                console.log("Ошибка Попытка вызова responseLongPoolling");
                console.log(error);
            }

            // Отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Добавлен новый Проект, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + " , количество в корпаккаунте: " + (countProjects_inCurrentCorpAcc + 1) + " шт.",
                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green
            );

            // Активировать позже
            // saveAllDataHandle();

            postServise_answer.mResStatus = 1;   // 0   444
            postServise_answer.comment = "Новый проект успешно создан";
            postServise_answer.dataFromServer = {
                resEndPoint: "was_added_new_Project",
                newAddProject: newProject,
            };
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
        catch (error) {
            console.log("Ошибка add_newProject_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка add_newProject_PS";
            return postServise_answer;
        }
    },

    add_newSubProject_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            // console.log(" ");
            // console.log("Запуск add_newSubProject_PS, postDataToServer= ");
            // console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.parent_corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount.corpAccount_ID;
            let parent_project_ID = req.body.postDataToServer.parent_project_ID;
            let subProject_settings = req.body.postDataToServer.subProject_settings;
            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            let pointer_senderOfRequest_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(sender_ofRequest_Email);

            let pointer_parentOwner_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(parent_owner_Email);

            let pointer_parentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID
            );

            //  проверяем, является ли пользователь админом, чтобы создать субПроект
            let check_isUser_adminOrModerator_forCurrentProject = functions___pr0001.isUser_adminOrModerator_forCurrentProject(sender_ofRequest_Email, pointer_parentProject_in_projectsDB);

            // если юзеру не разрешено добавлять субпроекты в проект
            if (!check_isUser_adminOrModerator_forCurrentProject) {
                console.log(" ");
                console.log("Пользователю не разрешено создавать субПроекты в этом проекте");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено создавать субПроекты в этом проекте",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено создавать субПроекты в этом проекте";
                postServise_answer.messageForClient = "Negativ - no access for User to create subProjects";
                postServise_answer.dataFromServer = null;
                return postServise_answer;

            }

            // Проверяет наличие пользователя в реестре Юзеров и родительский корпАккаунт 
            if (!pointer_senderOfRequest_inUsersReestr || !pointer_parentProject_in_projectsDB) {
                console.log(" ");
                console.log("Ошибка добавления субПроекта - Не обнаружен пользователь в реестре Юзеров, либо родительский проект ");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка добавления субПроекта - Не обнаружен пользователь в реестре Юзеров, либо родительский проект, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Не обнаружен пользователь в реестре Юзеров, либо родительский проект";
                return postServise_answer;
            }

            let count_subProjects_in_parentProject = Object.keys(pointer_parentProject_in_projectsDB.subProjects).length;

            // проверяем переполнение лимита количества субПроектов и при необх отправляем себе уведомление     
            const limit_count_subProjects_forCurrentOwner = pointer_parentOwner_inUsersReestr?.tarif_plan?.maxCount_freeSubProjects_inEachProject
                ? pointer_parentOwner_inUsersReestr.tarif_plan.maxCount_freeSubProjects_inEachProject
                : config_pr0001?.default_limits_forOneUser?.defaultMaxCount_freeSubProjects_inEachProject;

            try {
                if (limit_count_subProjects_forCurrentOwner
                    &&
                    (limit_count_subProjects_forCurrentOwner <= count_subProjects_in_parentProject)) {

                    console.log(" ");
                    console.log("Превышен лимит количества субПроектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + count_subProjects_in_parentProject + " шт.");

                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        "Превышен лимит количества субПроектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + count_subProjects_in_parentProject + " шт.",
                        '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                    );

                    postServise_answer.mResStatus = 444;
                    postServise_answer.comment = "Превышен лимит количества субПроектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + count_subProjects_in_parentProject + " шт.";
                    postServise_answer.messageForClient = "Overflow subProject count limit";
                    postServise_answer.dataFromServer = null;
                    return postServise_answer;
                }

                // тут проверяем приближение к половинному лимиту
                else {
                    if (limit_count_subProjects_forCurrentOwner
                        &&
                        ((limit_count_subProjects_forCurrentOwner / 2) <= count_subProjects_in_parentProject)) {
                        functions___pr0001.sendTelegramInfo_from_pr0001(
                            "Пройдена половина бесплатных субПроектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + count_subProjects_in_parentProject + " шт.",
                            '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                        );
                    }
                }
            } catch (error) {
                console.log("Ошибка при проверке лимита количества субПроектов");
                console.log(error);

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка при проверке лимита количества субПроектов, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Ошибка при проверке лимита количества субПроектов";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // создаем экземпляр нового проекта
            let new_subProject = NEW__dataModels.create_single_subProject(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                subProject_settings
            );

            let new_subProject_ID = new_subProject.subProject_ID;

            // Добавляем в БД проектов для овнера
            pointer_parentProject_in_projectsDB.subProjects[new_subProject_ID] = new_subProject;

            // Отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Добавлен новый субПроект, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + count_subProjects_in_parentProject + " шт.",
                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green
            );

            // Активировать позже
            // saveAllDataHandle();

            postServise_answer.mResStatus = 1;   // 0   444
            postServise_answer.comment = "Новый субПроект успешно создан";
            postServise_answer.dataFromServer = {
                resEndPoint: "was_added_new_subProject",
                new_subProject: new_subProject,
                shablon_SubProjectEvents_inUserReestr: create_subProjectEvents_inUserReestr(new_subProject.subProject_ID),

                sender_ofRequest_Email,
                gadget_process_ID: req.body.postDataToServer.gadget_process_ID,
            };
            postServise_answer.messageForClient = null;

            // Отправляем рассылку на ЛонгПуллинг
            try {
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                functions___pr0001.responseLongPoolling(
                    pointer_parentProject_in_projectsDB.project_data.project_settings.teamList,
                    postServise_answer.dataFromServer
                )
            } catch (error) {
                console.log("Ошибка Попытка вызова responseLongPoolling --- add_newSubProject_PS");
                console.log(error);
            }

            return postServise_answer;

        }
        catch (error) {
            console.log("Ошибка в add_newSubProject_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в add_newSubProject_PS";
            return postServise_answer;
        }
    },

    new_message_in_chat_PS(req) {
        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск new_message_in_chat_PS,  postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let parent_project_ID = req.body.postDataToServer.project_ID;
            let subProject_ID = req.body.postDataToServer.subProject_ID;
            let autor_Email = req.body.postDataToServer.autor;
            let textMessage = req.body.postDataToServer.textMessage;

            // выполнить проверку, что отправитель является участником родительского проекта
            let exist_user_in_team_list = functions___pr0001.is_user_member_ofCurrentProject(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                autor_Email,
            );

            if (!exist_user_in_team_list) {
                console.log(" ");
                console.log("Ошибка new_message_in_chat_PS - автор сообщения не является участником родительского проекта");

                postServise_answer.mResStatus = 0;   // 1   444
                postServise_answer.comment = "Ошибка new_message_in_chat_PS - автор сообщения не является участником родительского проекта";
                postServise_answer.dataFromServer = null;   // {}
                postServise_answer.messageForClient = null;
                return postServise_answer;
            }

            // если сообщение в чат субпроекта - предварительно  проверяем существование соответсвуующего субПроекта в главной БД
            if (subProject_ID) {
                let pointer_current_subProject_in_projectsDB = functions___pr0001.get_pointer_current_subProject_in_projectsDB(
                    parent_owner_Email,
                    parent_corpAccount_ID,
                    parent_project_ID,
                    subProject_ID
                );

                if (!pointer_current_subProject_in_projectsDB) {
                    console.log(" ");
                    console.log("Ошибка new_message_in_chat_PS - не найден соответствующий субПроект в базе данных");

                    postServise_answer.mResStatus = 0;   // 1   444
                    postServise_answer.comment = "Ошибка new_message_in_chat_PS - не найден соответствующий субПроект в базе данных";
                    postServise_answer.dataFromServer = null;   // {}
                    postServise_answer.messageForClient = null;
                    return postServise_answer;
                }
            }

            let pointer_current_chat = functions___pr0001.get_pointer_currentChat_OR_create_AND_getPointer_currentChat(
                parent_owner_Email,
                parent_corpAccount_ID,

                parent_project_ID,
                subProject_ID    // в случае чата для Проекта - тут будет undefined
            );

            // проверяем переполнение лимита количества субПроектов и при необх отправляем себе уведомление   
            {
                let pointer_parentOwner_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(parent_owner_Email);

                let current_count_messages_inChat = pointer_current_chat.messages.length;

                const limit_count_messages_inChat = pointer_parentOwner_inUsersReestr?.tarif_plan?.maxCount_freeMessages_inEachChat
                    ? pointer_parentOwner_inUsersReestr.tarif_plan.maxCount_freeMessages_inEachChat
                    : config_pr0001?.default_limits_forOneUser?.defaultMaxCount_freeMessages_inEachChat;

                try {
                    if (limit_count_messages_inChat
                        &&
                        (limit_count_messages_inChat <= current_count_messages_inChat)
                    ) {

                        console.log(" ");
                        console.log("Превышен лимит количества сообщений в чат, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + current_count_messages_inChat + " шт.");

                        functions___pr0001.sendTelegramInfo_from_pr0001(
                            "Превышен лимит количества сообщений в чат, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + current_count_messages_inChat + " шт.",
                            '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                        );

                        postServise_answer.mResStatus = 444;
                        postServise_answer.comment = "Превышен лимит количества сообщений в чат, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + current_count_messages_inChat + " шт.";
                        postServise_answer.messageForClient = "Overflow subProject count limit";
                        postServise_answer.dataFromServer = null;
                        return postServise_answer;
                    }

                    // тут проверяем приближение к половинному лимиту
                    else {
                        if (limit_count_messages_inChat
                            &&
                            ((limit_count_messages_inChat / 2) <= current_count_messages_inChat)) {
                            functions___pr0001.sendTelegramInfo_from_pr0001(
                                "Пройдена половина бесплатных сообщений в чат, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + " , и составил: " + current_count_messages_inChat + " шт.",
                                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                            );
                        }
                    }
                } catch (error) {
                    console.log("Ошибка при проверке лимита количества сообщений в чат");
                    console.log(error);

                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        "Ошибка при проверке лимита количества сообщений в чат, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID,
                        '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                    );

                    postServise_answer.mResStatus = 0;
                    postServise_answer.comment = "Ошибка при проверке лимита количества сообщений в чат";
                    postServise_answer.dataFromServer = null;
                    return postServise_answer;
                }
            }

            let new_message_inChat = NEW__dataModels.create_message_in_Chat_or_subChat(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                subProject_ID,  // для чата проекта тут не будет данных - undefined

                autor_Email,
                textMessage,

                pointer_current_chat.messages.length, // это будет изместный индекс нового сообщения в реестра
            );

            pointer_current_chat.messages.push(new_message_inChat);

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.comment = "Сообщение в чат успешно добавлено";
            postServise_answer.dataFromServer = {
                resEndPoint: "was_added_newMessage_inChat",
                new_message_inChat: new_message_inChat,
            };
            postServise_answer.messageForClient = null;

            let pointer_currentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID
            );

            // оповещаем всех подписанных пользователей
            try {
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                functions___pr0001.responseLongPoolling(
                    pointer_currentProject_in_projectsDB.project_data.project_settings.teamList,
                    postServise_answer.dataFromServer
                );
            } catch (error) {
                console.log("Ошибка Попытка вызова responseLongPoolling из new_message_in_chat_PS");
                console.log(error);
            }









            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в new_message_in_chat_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка в new_message_in_chat_PS";
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    delete_one_subProject_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            // console.log(" ");
            // console.log("Запуск delete_one_subProject_PS, postDataToServer= ");
            // console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let parent_project_ID = req.body.postDataToServer.parent_project_ID;
            let subProject_ID = req.body.postDataToServer.subProject_ID;
            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            //  проверяем, является ли пользователь админом, чтобы удалить субПроект
            let pointer_parentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID
            );

            // console.log(" ");
            // console.log("pointer_parentProject_in_projectsDB= ");
            // console.log(pointer_parentProject_in_projectsDB);

            //  проверяем, является ли пользователь админом, чтобы создать субПроект
            let check_isUser_adminOrModerator_forCurrentProject = functions___pr0001.isUser_adminOrModerator_forCurrentProject(sender_ofRequest_Email, pointer_parentProject_in_projectsDB);

            // если юзеру не разрешено удалять субпроекты в проекте
            if (!check_isUser_adminOrModerator_forCurrentProject) {
                console.log(" ");
                console.log("Пользователю не разрешено удалять субпроекты в этом проекте");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено удалять субпроекты в этом проекте",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено удалять субпроекты в этом проекте";
                postServise_answer.messageForClient = "Negativ - no access for User to delete  subProjects";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // удаляем субпроект
            try {
                delete pointer_parentProject_in_projectsDB.subProjects[subProject_ID];
                console.log(" ");
                console.log("Субпроект успешно удален");
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке удаления Субпроекта из БД");
                console.log(error);
            }

            // удаляем чат субпроекта
            try {
                if (serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email]
                    ?.corpAccounts?.[parent_corpAccount_ID]?.projects?.[parent_project_ID]?.subProjectsChats[subProject_ID]) {

                    delete serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID].projects[parent_project_ID].subProjectsChats[subProject_ID];

                    console.log(" ");
                    console.log("Чат субпроекта успешно удален");
                }
                else {
                    console.log(" ");
                    console.log("Не найден целевой чат субПроекта при попытке его удаления");
                }
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке удаления чата суброекта");
                console.log(error);
            }

            // возвращаем ответ из функции
            postServise_answer.mResStatus = 1;
            postServise_answer.comment = "Субпроект успешно удален";
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = {
                resEndPoint: "wasDeleted_one_subProject",
                parent_owner_Email: parent_owner_Email,
                parent_corpAccount_ID: parent_corpAccount_ID,
                parent_project_ID: parent_project_ID,
                project_ID: parent_project_ID, // УДАЛИТЬ ПОСЛЕ ПЕРЕДЕЛКИ ФРОНТЕНДА, нужно для старой версии
                subProject_ID: subProject_ID,


                sender_ofRequest_Email: req.body.postDataToServer.sender_ofRequest_Email,
                gadget_process_ID: req.body.postDataToServer.gadget_process_ID,
            };

            // оповещаем всех подписанных пользователей
            try {
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                functions___pr0001.responseLongPoolling(
                    pointer_parentProject_in_projectsDB.project_data.project_settings.teamList,
                    postServise_answer.dataFromServer
                );
            } catch (error) {
                console.log("Ошибка Попытка вызова responseLongPoolling из delete_one_subProject_PS");
                console.log(error);
            }

            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в delete_one_subProject_PS");
            console.log(error);
            return null;
        }
    },

    delete_one_project_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            console.log(" ");
            console.log("Запуск delete_one_project_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let project_ID = req.body.postDataToServer.project_ID;
            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            //  проверяем, является ли пользователь админом, чтобы удалить субПроект

            let pointer_currentOwnCorpAccount_in_projectsDB = functions___pr0001.get_pointer_current_corpAccount_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
            );

            let pointer_currentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID
            );

            //  проверяем, является ли пользователь админом, чтобы создать субПроект
            let check_isUser_adminOrModerator_forCurrentProject = functions___pr0001.isUser_adminOrModerator_forCurrentProject(sender_ofRequest_Email, pointer_currentProject_in_projectsDB);

            // если юзеру не разрешено удалять данный проект
            if (!check_isUser_adminOrModerator_forCurrentProject) {
                console.log(" ");
                console.log("Пользователю не разрешено удалять данный проект");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено удалять данный проект",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено удалять данный проект";
                postServise_answer.messageForClient = "Negativ - no access for User to delete current project";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }


            // удаляем чат проекта и субпроекта
            try {
                if (serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email]
                    ?.corpAccounts?.[parent_corpAccount_ID]?.projects?.[project_ID]) {

                    delete serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID].projects[project_ID];

                    console.log(" ");
                    console.log("Чат проекта и субпроектов успешно удален");
                }
                else {
                    console.log(" ");
                    console.log("Не найден целевой чат проекта при попытке его удаления");
                }
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке удаления чата проекта");
                console.log(error);
            }

            // удаляем из списка доступных проектов других пользователей
            try {
                let tempArr_teamItems = Object.keys(pointer_currentProject_in_projectsDB.project_data.project_settings.teamList);
                // для каждого участника проекта - удаляем данный проект из списка долсутпных проектов
                tempArr_teamItems.forEach(item => {
                    functions___pr0001.delete_currentProject_fromAssessList_teamUser(
                        parent_owner_Email,
                        parent_corpAccount_ID,
                        project_ID,

                        item, // Тут будет user_Email - Емейл члена команды, в качестве ключа - keys
                    )
                });




            } catch (error) {
                console.log(" ");
                console.log("Ошибка удаления проекта из списка доступных файлов других пользователей");
                console.log(error);
            }

            // удаляем файлы проекта, добавляем их в реестр удаляемых проектов
            addProject_toDeletingFiles(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID
            );


            // удаляем непосредственно проект из БД
            try {
                delete pointer_currentOwnCorpAccount_in_projectsDB.projects[project_ID];
                console.log(" ");
                console.log("Проект успешно удален из БД");
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке удаления проекта из БД");
                console.log(error);
            }

            // оповещаем подписанных пользователей
            // добавить тут функционал

            // возвращаем ответ из функции

            postServise_answer = {
                mResStatus: 1,
                comment: "Проект успешно удален",
                messageForClient: null,
                dataFromServer: {
                    endPoint: "wasDeleted_one_Project",
                    corpAccount: pointer_currentOwnCorpAccount_in_projectsDB.corpAccount_data,
                    deleted_project_ID: project_ID,
                },
            }

            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в delete_one_subProject_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в delete_one_project_PS";
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = null;
            return postServise_answer;
        }
    },

    delete_one_corpAccaunt_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            console.log(" ");
            console.log("Запуск delete_one_corpAccaunt_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;


            let pointer_currentOwnCorpAccount_in_projectsDB = functions___pr0001.get_pointer_current_corpAccount_in_projectsDB(
                parent_owner_Email,
                corpAccount_ID,
            );

            if (!pointer_currentOwnCorpAccount_in_projectsDB) {
                console.log(" ");
                console.log("Удаляемый корпАккаунт не найдн");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Удаляемый корпАккаунт не найдн",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Удаляемый корпАккаунт не найдн";
                postServise_answer.messageForClient = null;
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // если юзеру не разрешено удалять данный проект
            if (sender_ofRequest_Email != parent_owner_Email) {
                console.log(" ");
                console.log("Пользователю не разрешено удалять данный корпАккаунт");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено удалять данный корпАккаунт",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено удалять данный корпАккаунт";
                postServise_answer.messageForClient = "Negativ - no access for User to delete current corpAccaunt";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // удаляем папку чатов корпАккаунта, со вложенными часами проектов и субпроекта
            try {
                if (serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email]
                    ?.corpAccounts?.[corpAccount_ID]) {

                    delete serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[corpAccount_ID];

                    console.log(" ");
                    console.log("Чаты корпАккаунта - проектов и субпроектов - успешно удалены");
                }
                else {
                    console.log(" ");
                    console.log("Не найден целевой чат корпАккаунта");
                }
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке удаления вложенных чатов корпАккаунта");
                console.log(error);
            }

            // по отдельности удаляем запись о проектах удаляемого корпАккаунта из списка доступных проектов других пользователей
            try {
                // получаем массив проектов данного корп Аккаунта
                let tempArr_deleteProjectsList = Object.keys(pointer_currentOwnCorpAccount_in_projectsDB.projects ?? {});
                // внутри каждого проекта проходим по списку участников, и удаляем данный проект из списка долсутпных для них проектов
                tempArr_deleteProjectsList.forEach(item => {
                    // получаем ссылку на каждый проект
                    let pointer_currentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                        parent_owner_Email,
                        corpAccount_ID,
                        item,  // - это project_ID
                    );

                    // получаем массив участников данного проекта
                    let tempArr_teamItems = Object.keys(pointer_currentProject_in_projectsDB.project_data.project_settings.teamList ?? {});
                    // для каждого участника проекта - удаляем данный проект из списка доступных проектов
                    tempArr_teamItems.forEach(item_2 => {
                        functions___pr0001.delete_currentProject_fromAssessList_teamUser(
                            parent_owner_Email,
                            corpAccount_ID,
                            item,  // - это project_ID

                            item_2, // Тут будет user_Email - Емейл члена команды, в качестве ключа - keys
                        );
                    });
                });
            } catch (error) {
                console.error(" ");
                console.error("Ошибка удаления проектов корпАккаунта из списка доступных проектов других пользователей");
                console.error(error);
            }

            // удаляем файлы корпАккаунта, добавляем их в реестр удаляемых проектов
            addCorpAcc_toDeletingFiles(
                parent_owner_Email,
                corpAccount_ID,
            );

            // удаляем непосредственно корпАккаунта из БД
            try {
                delete serverVarriorsDataFromBD_pr0001.projects_DB[parent_owner_Email].corpAccounts.ownCorpAccounts[corpAccount_ID];
                console.log(" ");
                console.log("КорпАккаунт успешно удален из БД");
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке удаления корпАккаунта из БД");
                console.log(error);
            }

            // оповещаем подписанных пользователей
            // добавить тут функционал

            // возвращаем ответ из функции
            postServise_answer.mResStatus = 1;
            postServise_answer.comment = "КорпАккаунт успешно удален";
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = {
                endPoint: "was_deletedCorpAccount",
                deleted_corpAccount_ID: corpAccount_ID,
            };
            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в delete_one_corpAccaunt_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в delete_one_corpAccaunt_PS";
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = null;
            return postServise_answer;
        }
    },
    //----------------------------------
    // ПЕРЕДЕЛАТЬ В НОВОМ ФОРМАТЕ
    m_ignorOwnerCorpAccount_PS(req, res) {
        try {
            /*                 
    
                let postServise_answer_newFormat = postService_pr0001.ignor_ownerCorpAccount_PS(req);
    
    
                let dataFromServer = {};
                // console.log("=== ЗАПУСК m_ignorOwnerCorpAccount_PS, req.body= ");
                // console.log(req.body);
    
                let finedUserIndex = findUser_Index_inReestr(req.body.postDataToServer.admin_ID);
                // console.log("finedUserIndex=" + finedUserIndex);
    
                if (finedUserIndex != null && finedUserIndex >= 0) {
                    // добавляем овнера в игнор-лист (если он еще не был добавлен)
                    let finedIndex_ignoredOwnerCorpAcc = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].ignorOwnersList.findIndex(
                        item => item.ignorOwner_ID === req.body.postDataToServer.ignorOwner_ID
                    );
    
                    // console.log("finedIndex_ignoredOwnerCorpAcc=" + finedIndex_ignoredOwnerCorpAcc);
    
                    if (!(finedIndex_ignoredOwnerCorpAcc != null && finedIndex_ignoredOwnerCorpAcc >= 0)) {
                        // console.log("Добавляем Юзера в Игнор ");
                        serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].ignorOwnersList.push(
                            {
                                ignorOwner_ID: req.body.postDataToServer.ignorOwner_ID,
                                ignorOwner_EMAIL: req.body.postDataToServer.ignorOwner_EMAIL,
                            }
                        )
    
                        dataFromServer = {
                            resEndPoint: "was_ignoredOwnerCorpAccount",
                            ignorOwner_ID: req.body.postDataToServer.ignorOwner_ID,
                            ignorOwner_EMAIL: req.body.postDataToServer.ignorOwner_EMAIL,
                        }
                    }
                }
    
                saveAllDataHandle();
                // console.log("Ретерним ответ, dataFromServer= ");
                // console.log(dataFromServer);
                return res.status(200).json(dataFromServer);
            */
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_restoreOwnerCorpAccount_PS: " + error);
        }
    },
    //----------------------------------
    // ПЕРЕДЕЛАТЬ В НОВОМ ФОРМАТЕ
    m_restoreOwnerCorpAccount_PS(req,) {
        try {
            /* 
                        let dataFromServer = {};
                        // console.log("=== ЗАПУСК m_restoreOwnerCorpAccount_PS, req.body= ");
                        // console.log(req.body);
            
                        let finedUserIndex = findUser_Index_inReestr(req.body.postDataToServer.admin_ID);
                        // console.log("finedUserIndex=" + finedUserIndex);
            
                        if (finedUserIndex != null && finedUserIndex >= 0) {
                            // восстанавливаем овнера - удаляем из игнор-листа
                            let finedIndex_ignoredOwnerCorpAcc = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].ignorOwnersList.findIndex(
                                item => item.ignorOwner_ID === req.body.postDataToServer.ignorOwner_ID
                            );
            
                            // console.log("finedIndex_ignoredOwnerCorpAcc=" + finedIndex_ignoredOwnerCorpAcc);
            
                            if (finedIndex_ignoredOwnerCorpAcc != null && finedIndex_ignoredOwnerCorpAcc >= 0) {
                                // console.log("Добавляем Юзера в Игнор ");
                                serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].ignorOwnersList.splice(finedIndex_ignoredOwnerCorpAcc, 1);
            
                                dataFromServer = {
                                    resEndPoint: "was_restoredOwnerCorpAccount",
                                    ignorOwner_ID: req.body.postDataToServer.ignorOwner_ID,
                                    ignorOwner_EMAIL: req.body.postDataToServer.ignorOwner_EMAIL,
                                }
                            }
                        }
            
                        saveAllDataHandle();
                        // console.log("Ретерним ответ, dataFromServer= ");
                        // console.log(dataFromServer);
                        return (dataFromServer);
             */
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_restoreOwnerCorpAccount_PS: " + error);
        }
    },

    // ========================

    getFullData_CurrentProject_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let project_ID = req.body.postDataToServer.project_ID;
            let sender_ofRequest_Email = req.body.postDataToServer.user_Email;

            let pointer_currentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID
            );

            //  проверяем, является ли пользователь участником данного проекта
            let exist_user_in_team_list = functions___pr0001.is_user_member_ofCurrentProject(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID,
                sender_ofRequest_Email,
            );

            // если юзеру не разрешено просматривать данный проект
            if (!exist_user_in_team_list) {
                console.log(" ");
                console.log("Отказ в Просмотре проекта, пользователь не является участником проекта");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Отказ в Просмотре проекта, пользователь не является участником проекта",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 0;   // 1   444
                postServise_answer.comment = "Отказ в Просмотре проекта, пользователь не является участником проекта";
                postServise_answer.dataFromServer = null;   // {}
                postServise_answer.messageForClient = "Negative - no access to Ptoject";
                return postServise_answer;
            }

            // возвращаем ответ из функции
            postServise_answer.mResStatus = 1;
            postServise_answer.comment = null;
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = {
                endPoint: "getFullData_CurrentProject",
                // project_ID: pointer_currentProject_in_projectsDB.project_data.project_ID,
                current_project_data: pointer_currentProject_in_projectsDB.project_data,
            };

            // console.log(" ");
            // console.log("postServise_answer.dataFromServer - getFullData_CurrentProject:");
            // console.log(postServise_answer.dataFromServer);

            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в getFullData_CurrentProject_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в getFullData_CurrentProject_PS";
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = null;
            return postServise_answer;
        }
    },

    get_lastMessages_currentChat_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            // console.log(" ");
            // console.log("Запуск get_lastMessages_currentChat_PS, postDataToServer= ");
            // console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;

            let parent_project_ID = req.body.postDataToServer.parent_project_ID;
            let parent_subProject_ID = req.body.postDataToServer.parent_subProject_ID;

            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;



            //  проверяем, является ли пользователь участником Родительского проекта/субПроекта проекта
            let exist_user_in_team_list = functions___pr0001.is_user_member_ofCurrentProject(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                sender_ofRequest_Email,
            );

            // если юзеру не разрешено просматривать данный проект
            if (!exist_user_in_team_list) {
                console.log(" ");
                console.log("Отказ в просмотре чата, пользователь не является участником родительского проекта");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Отказ в просмотре чата, пользователь не является участником родительского проекта",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 0;   // 1   444
                postServise_answer.comment = "Отказ в просмотре чата, пользователь не является участником родительского проекта";
                postServise_answer.dataFromServer = null;   // {}
                postServise_answer.messageForClient = "Negative - no access to read chat";
                return postServise_answer;
            }

            let needsMessages = [];

            let pointer_current_chat = functions___pr0001.get_pointer_currentChat(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                parent_subProject_ID    // в случае чата для Проекта - тут будет undefined
            );

            // если чат существует, и длинна списка больше, чем указанное количество нужных записей - берем из массива нужное количество последних записей
            if (pointer_current_chat?.messages?.length > req.body.postDataToServer.quantityLastMessages) {
                needsMessages = pointer_current_chat.messages.slice(-req.body.postDataToServer.quantityLastMessages); // знак отрицания "-" означает извлечение данных с конца массива 
            }
            else {
                // если  если чат существует, и длинна списка меньше, чем количество нужных записей - забираем все записи
                if (pointer_current_chat?.messages) {
                    needsMessages = pointer_current_chat.messages;
                }
            }


            // возвращаем ответ из функции
            postServise_answer.mResStatus = 1;
            postServise_answer.comment = null;
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = {
                endPoint: "get_lastMessages_currentChat_PS",
                // разморачиванием мы копируем только верхние ключи чата
                ...pointer_current_chat,

                needsMessages: needsMessages,
            };
            delete postServise_answer.dataFromServer.messages; // при этом в исходном объекте pointer_current_chat - объект messages не будет удален, поскольку мы использовали поверхностное копирование (...)

            // console.log(" ");
            // console.log("postServise_answer.dataFromServer - get_lastMessages_currentChat_PS:");
            // console.log(postServise_answer.dataFromServer);

            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_lastMessages_currentChat_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в get_lastMessages_currentChat_PS";
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = null;
            return postServise_answer;
        }
    },

    get_PreviousItems_chatList_CurrentProject_PS(req) {

        // функция не проверена в работе из-за меленького количества сообщений в чате

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            // console.log(" ");
            // console.log("Запуск get_PreviousItems_chatList_CurrentProject_PS, postDataToServer= ");
            // console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;

            let parent_project_ID = req.body.postDataToServer.parent_project_ID;
            let parent_subProject_ID = req.body.postDataToServer.parent_subProject_ID;

            let sender_ofRequest_Email = req.body.postDataToServer.user_Email;

            //  проверяем, является ли пользователь участником Родительского проекта/субПроекта проекта
            let exist_user_in_team_list = functions___pr0001.is_user_member_ofCurrentProject(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                sender_ofRequest_Email,
            );

            // если юзеру не разрешено просматривать данный проект
            if (!exist_user_in_team_list) {
                console.log(" ");
                console.log("Отказ в просмотре чата, пользователь не является участником родительского проекта");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Отказ в просмотре чата, пользователь не является участником родительского проекта",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 0;   // 1   444
                postServise_answer.comment = "Отказ в просмотре чата, пользователь не является участником родительского проекта";
                postServise_answer.dataFromServer = null;   // {}
                postServise_answer.messageForClient = "Negative - no access to read chat";
                return postServise_answer;
            }

            let needsMessages = [];

            let pointer_current_chat = functions___pr0001.get_pointer_currentChat(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                parent_subProject_ID    // в случае чата для Проекта - тут будет undefined
            );

            // если чат существует, и длинна списка больше, чем указанное количество нужных записей - берем из массива нужное количество последних записей
            if (pointer_current_chat) {

                // вычисляем, сколько предыдущих сообщений осталось, которые предшествуют указанному TOP-индексу
                let currentPreviousIndex = req.body.postDataToServer.currentPreviousIndex; // количество оставшихся предыдущих сообщений, Оно также эквивалентно текущему индексу первого из загруженных ранее клиенту сообщений
                let needsQuantityPreviousMessages = req.body.postDataToServer.
                    needsQuantityPreviousMessages; // необходимое количество сообщений для подгрузки
                let beginIndex = currentPreviousIndex - needsQuantityPreviousMessages; // начальный индекс подгрузки

                // если  начальный индекс подгрузки >=0 - берем из массива нужное количество предыдущих записей
                if (beginIndex >= 0) {
                    // console.log("Отбираем нужное количество записей, beginIndex= " + beginIndex);
                    needsMessages = pointer_current_chat.messages.slice(beginIndex, currentPreviousIndex);
                }
                // иначе, если количество  оставшихся предыдущих сообщений меньше (или равно), чем количество нужных записей - забираем все оставшиеся записи, т.е. если  начальный индекс подгрузки < 0
                else {
                    // console.log("Забираем все оставшиеся записи... ");
                    needsMessages = pointer_current_chat.messages.slice(0, currentPreviousIndex);
                }
            }

            // возвращаем ответ из функции
            postServise_answer.mResStatus = 1;
            postServise_answer.comment = null;
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = {
                endPoint: "get_PreviousItems_chatList_CurrentProject_PS",
                // разморачиванием мы копируем только верхние ключи чата
                ...pointer_current_chat,
                needsMessages: needsMessages,
            };
            delete postServise_answer.dataFromServer.messages; // при этом в исходном объекте pointer_current_chat - объект messages не будет удален, поскольку мы использовали поверхностное копирование (...)

            // console.log(" ");
            // console.log("postServise_answer.dataFromServer - get_PreviousItems_chatList_CurrentProject_PS:");
            // console.log(postServise_answer.dataFromServer);

            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_PreviousItems_chatList_CurrentProject_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в get_PreviousItems_chatList_CurrentProject_PS";
            postServise_answer.messageForClient = null;
            postServise_answer.dataFromServer = null;
            return postServise_answer;
        }
    },

    set_project_settings_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск set_project_settings_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.parent_corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount.corpAccount_ID;
            let project_ID = req.body.postDataToServer.project_ID;
            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            let new_project_settings = req.body.postDataToServer.projectSettings;

            if (typeof new_project_settings !== "object" || new_project_settings === null) {
                throw new Error("Входящие настройки - new_project_settings - не являются объектом, как ожидалось ");
            }

            let pointer_senderOfRequest_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(sender_ofRequest_Email);

            let pointer_senderOfRequest_in_projectsDB = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email);

            let pointer_currentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID
            );

            //  проверяем, является ли пользователь админом, чтобы внести изменения в проект
            let check_isUser_adminOrModerator_forCurrentProject = functions___pr0001.isUser_adminOrModerator_forCurrentProject(sender_ofRequest_Email, pointer_currentProject_in_projectsDB);

            // если юзеру не разрешено вносить изменения в проект
            if (!check_isUser_adminOrModerator_forCurrentProject) {
                console.log(" ");
                console.log("Пользователю не разрешено менять настройки проекта");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено менять настройки проекта",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено менять настройки проекта";
                postServise_answer.messageForClient = "Negativ - no access for User to change project settings";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // Проверяет наличие пользователя в реестре Юзеров и родительский корпАккаунт 
            if (
                !pointer_senderOfRequest_inUsersReestr
                || !pointer_currentProject_in_projectsDB
                || !pointer_senderOfRequest_in_projectsDB
            ) {
                console.log(" ");
                console.log("Ошибка в set_project_settings_PS - Не обнаружен пользователь в реестре Юзеров, либо в БД, либо не обнаружен непосредственно родительский проект ");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка в set_project_settings_PS - Не обнаружен пользователь в реестре Юзеров, либо родительский проект , parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + project_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Не обнаружен пользователь в реестре Юзеров, либо родительский проект";
                return postServise_answer;
            }

            // обновляем настройки проекта методом перезаписывания в старых настройках ТОЛЬКО ТЕХ полей, которые пришли в новых настройках. При этом согранятся те поля, которые не нужно перезаписывать
            Object.assign(pointer_currentProject_in_projectsDB.project_data.project_settings, new_project_settings);

            // обновляем информацию о времени обновления настроек проекта
            let currentTime = Date.now();
            pointer_currentProject_in_projectsDB.project_data.time_update_current_project.time_update_projectSettings = currentTime;

            // для отправителя обновлений устанавливаем сразу время просмотра этих обновлений.   Поскольку отправитель обновлений может быть как владельцем проекта, так и назначенным Админом - проверяем, проверяем в каком объекте доступных корп аккаунтов искать данный проект
            try {
                //  если отправитель запроса является владельцем проекта, токда обращаем к дереву его собственных корп аккаунтов - ownCorpAccounts
                if (parent_owner_Email == sender_ofRequest_Email) {
                    pointer_senderOfRequest_in_projectsDB.corpAccounts.ownCorpAccounts[parent_corpAccount_ID].projects[project_ID].project_data.time_individual_wasRead_projectEvents_byUser.time_wasRead_settings = currentTime;

                }
                //  иначе обращаем к дереву его сторонних корп аккаунтов - otherAccounts
                else {
                    pointer_senderOfRequest_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID].projects[project_ID].project_data.time_individual_wasRead_projectEvents_byUser.time_wasRead_settings = currentTime;
                }
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке записать время просмотра настроек проекта для отправителя новых настроек");
                console.log(error);
            }

            // Отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Обновлены настройки проекта, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + project_ID,
                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green
            );

            // Активировать позже
            // saveAllDataHandle();

            postServise_answer.mResStatus = 1;   // 0   444
            postServise_answer.comment = "Настройки проекта успешно обновлены";
            postServise_answer.dataFromServer = {
                resEndPoint: "set_project_settings",
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID,
                new_project_settings,

                sender_ofRequest_Email,
                gadget_process_ID: req.body.postDataToServer.gadget_process_ID,
            };
            postServise_answer.messageForClient = null;

            // оповещаем всех подписанных пользователей
            try {
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                functions___pr0001.responseLongPoolling(
                    pointer_currentProject_in_projectsDB.project_data.project_settings.teamList,
                    postServise_answer.dataFromServer
                );
            } catch (error) {
                console.log("Ошибка Попытка вызова responseLongPoolling из new_message_in_chat_PS");
                console.log(error);
            }

            return postServise_answer;
        }
        catch (error) {
            console.log("Ошибка в set_project_settings_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в set_project_settings_PS";
            return postServise_answer;
        }
    },

    updateTeamForProject_PS(req) {
        // эту функцию тестировать после того, когда на клиенте список новых участников будет передаваться в виде объекта, а не массива

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск updateTeamForProject_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.parent_corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount.corpAccount_ID;
            let project_ID = req.body.postDataToServer.project_ID;
            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            const newTeamForProject = req.body.postDataToServer.teamDataUpdate.newTeamForProject;
            const deleteListForTeam = req.body.postDataToServer.teamDataUpdate.deleteListForTeam;

            if (typeof newteamList !== "object" || newteamList === null) {
                //  throw new Error("Входящие настройки - new_project_settings - не являются объектом, как ожидалось ");
            }

            let pointer_senderOfRequest_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(sender_ofRequest_Email);

            let pointer_senderOfRequest_in_projectsDB = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email);

            let pointer_currentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID
            );

            //  проверяем, является ли пользователь админом, чтобы внести изменения в проект
            let check_isUser_adminOrModerator_forCurrentProject = functions___pr0001.isUser_adminOrModerator_forCurrentProject(sender_ofRequest_Email, pointer_currentProject_in_projectsDB);

            // если юзеру не разрешено вносить изменения в проект
            if (!check_isUser_adminOrModerator_forCurrentProject) {
                console.log(" ");
                console.log("Пользователю не разрешено менять настройки проекта");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено менять настройки проекта",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено менять настройки проекта";
                postServise_answer.messageForClient = "Negativ - no access for User to change project settings";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }

            // Проверяет наличие пользователя в реестре Юзеров и родительский корпАккаунт 
            if (
                !pointer_senderOfRequest_inUsersReestr
                || !pointer_currentProject_in_projectsDB
                || !pointer_senderOfRequest_in_projectsDB
            ) {
                console.log(" ");
                console.log("Ошибка в updateTeamForProject_PS - Не обнаружен пользователь в реестре Юзеров, либо в БД, либо не обнаружен непосредственно родительский проект ");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка в updateTeamForProject_PS - Не обнаружен пользователь в реестре Юзеров, либо родительский проект , parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + project_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Не обнаружен пользователь в реестре Юзеров, либо родительский проект";
                return postServise_answer;
            }

            // валидируем newTeamForProject на предмет массива
            if (!Array.isArray(newTeamForProject) || newTeamForProject === null) {
                throw new Error("Входящие настройки - new_project_settings - не являются объектом, как ожидалось ");
            }

            // обновляем teamList в проекте
            pointer_currentProject_in_projectsDB.project_data.project_settings.teamList = newTeamForProject;

            // обновляем информацию о времени обновления настроек проекта
            let currentTime = Date.now();
            pointer_currentProject_in_projectsDB.project_data.time_update_current_project.time_update_projectSettings = currentTime;

            // при наличии исключенных пользователей - удаляем текущий проект из списка доступных проектов для исключенных пользователей
            // проверяем наличие и валидируем на предмет массива

            try {
                if (deleteListForTeam) {
                    if (Array.isArray(deleteListForTeam)) {

                        deleteListForTeam.forEach(item => {
                            functions___pr0001.delete_currentProject_fromAssessList_teamUser(
                                parent_owner_Email,
                                parent_corpAccount_ID,
                                project_ID,

                                item.user_Email, // Тут будет user_Email - Емейл члена команды, в качестве ключа - keys
                            )

                        });
                    }
                    else {
                        console.error(" ");
                        console.error("Ошибка при изменении teamList проекта и удаления исключенных пользователей - deleteListForTeam не является массивом ");
                    }
                }
            } catch (error) {
                console.error(" ");
                console.error("Ошибка при изменении teamList проекта:");
                console.error(error);
            }

            // Отправляем рассылку на ЛонгПуллинг


            // Отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Обновлен teamList проекта, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + project_ID,
                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green
            );

            // Активировать позже
            // saveAllDataHandle();

            postServise_answer.mResStatus = 1;   // 0   444
            postServise_answer.comment = "Настройки teamList проекта успешно обновлены";
            postServise_answer.dataFromServer = {
                resEndPoint: "wasUpdateTeamForProject",
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID,
                sender_ofRequest_Email,
                newTeamForProject,
            };
            postServise_answer.messageForClient = null;
            return postServise_answer;

        }
        catch (error) {
            console.log("Ошибка в updateTeamForProject_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в updateTeamForProject_PS";
            return postServise_answer;
        }
    },

    set_subProject_settings_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск set_subProject_settings_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.parent_corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount.corpAccount_ID;
            let parent_project_ID = req.body.postDataToServer.parent_project_ID;
            let subProject_ID = req.body.postDataToServer.subProject_ID;

            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            let new_subProject_settings = req.body.postDataToServer.subProject_settings;

            // Удаляем из объекта новых настроек teamList_ofResponsible_subProject, потому что список ответственных мы передаем в отдельном пост запросе
            delete new_subProject_settings.teamList_ofResponsible_subProject;

            if (typeof new_subProject_settings !== "object" || new_subProject_settings === null) {
                throw new Error("Входящие настройки - new_subProject_settings - не являются объектом, как ожидалось ");
            }

            let pointer_senderOfRequest_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(sender_ofRequest_Email);

            let pointer_senderOfRequest_in_projectsDB = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email);

            let pointer_parentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID
            );

            let pointer_current_subProject_in_projectsDB = functions___pr0001.get_pointer_current_subProject_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                subProject_ID
            );

            // Проверяет наличие пользователя в реестре Юзеров и проч
            if (
                !pointer_senderOfRequest_inUsersReestr
                || !pointer_parentProject_in_projectsDB
                || !pointer_current_subProject_in_projectsDB
                || !pointer_senderOfRequest_in_projectsDB
            ) {
                console.log(" ");
                console.log("Ошибка в set_subProject_settings_PS - Не обнаружен пользователь в реестре Юзеров, либо в БД, либо не обнаружен непосредственно родительский проект ");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка в set_subProject_settings_PS - Не обнаружен пользователь в реестре Юзеров, либо родительский проект , parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Не обнаружен пользователь в реестре Юзеров, либо нужные указатели на объекты";
                return postServise_answer;
            }

            //  проверяем, является ли пользователь админом родительского проекта
            let check_isUser_adminOrModerator_forCurrentProject = functions___pr0001.isUser_adminOrModerator_forCurrentProject(sender_ofRequest_Email, pointer_parentProject_in_projectsDB);

            // если юзеру не разрешено вносить изменения 
            if (!check_isUser_adminOrModerator_forCurrentProject) {
                console.log(" ");
                console.log("Пользователю не разрешено менять настройки субПроекта");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено менять настройки проекта",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено менять настройки субПроекта";
                postServise_answer.messageForClient = "Negativ - no access for User to change subProject settings";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }


            // обновляем настройки проекта методом перезаписывания в старых настройках ТОЛЬКО ТЕХ полей, которые пришли в новых настройках. При этом согранятся те поля, которые не нужно перезаписывать
            Object.assign(pointer_current_subProject_in_projectsDB.subProject_settings, new_subProject_settings);

            // обновляем информацию о времени обновления настроек проекта
            let currentTime = Date.now();
            pointer_current_subProject_in_projectsDB.time_update_current_subProject.time_update_subProject_settings = currentTime;

            // для отправителя обновлений устанавливаем сразу время просмотра этих обновлений.   Поскольку отправитель обновлений может быть как владельцем проекта, так и назначенным Админом - проверяем, проверяем в каком объекте доступных корп аккаунтов искать данный проект
            try {
                //  если отправитель запроса является владельцем проекта, токда обращаем к дереву его собственных корп аккаунтов - ownCorpAccounts
                if (parent_owner_Email == sender_ofRequest_Email) {
                    pointer_senderOfRequest_in_projectsDB.corpAccounts.ownCorpAccounts[parent_corpAccount_ID].projects[parent_project_ID].subProjects[subProject_ID].time_individual_wasRead_subProjectEvents_byUser.time_wasRead_settings = currentTime;
                }
                //  если отправитель запроса является назначенным Админом проекта, токда обращаем к дереву его сторонних корп аккаунтов - otherAccounts
                else {
                    pointer_senderOfRequest_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID].projects[parent_project_ID].subProjects[subProject_ID].time_individual_wasRead_subProjectEvents_byUser.time_wasRead_settings = currentTime;
                }
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке записать время просмотра настроек субПроекта для отправителя новых настроек");
                console.log(error);
            }


            // Отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Обновлены настройки субПроекта, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + ", субПроект=" + subProject_ID,
                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green
            );

            // Активировать позже
            // saveAllDataHandle();

            postServise_answer.mResStatus = 1;   // 0   444
            postServise_answer.comment = "Настройки субПроекта успешно обновлены";
            postServise_answer.dataFromServer = {
                resEndPoint: "set_subProject_settings",
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                subProject_ID,
                new_subProject_settings,

                sender_ofRequest_Email: req.body.postDataToServer.sender_ofRequest_Email,
                gadget_process_ID: req.body.postDataToServer.gadget_process_ID,
            };
            postServise_answer.messageForClient = null;

            // оповещаем всех подписанных пользователей
            try {
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                functions___pr0001.responseLongPoolling(
                    pointer_parentProject_in_projectsDB.project_data.project_settings.teamList,
                    postServise_answer.dataFromServer
                );
            } catch (error) {
                console.log("Ошибка Попытка вызова responseLongPoolling из new_message_in_chat_PS");
                console.log(error);
            }

            return postServise_answer;
        }
        catch (error) {
            console.log("Ошибка в set_subProject_settings_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в set_subProject_settings_PS";
            return postServise_answer;
        }
    },

    update_ofResponsibleList_subProject_PS(req) {
        // Эту функцию отладить на клиенту и тут

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск update_ofResponsibleList_subProject_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.parent_corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount.corpAccount_ID;
            let parent_project_ID = req.body.postDataToServer.parent_project_ID;
            let subProject_ID = req.body.postDataToServer.subProject_ID;

            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            let new_teamList_ofResponsible_subProject = req.body.postDataToServer.teamList_ofResponsible_subProject;

            if (typeof new_subProject_settings !== "object" || new_subProject_settings === null) {
                // Активировать после обновления формата на клиенте
                // throw new Error("Входящие настройки - new_subProject_settings - не являются объектом, как ожидалось ");
            }

            let pointer_senderOfRequest_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(sender_ofRequest_Email);

            let pointer_senderOfRequest_in_projectsDB = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email);

            let pointer_currentProject_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID
            );

            let pointer_current_subProject_in_projectsDB = functions___pr0001.get_pointer_current_subProject_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                subProject_ID
            );

            // Проверяет наличие пользователя в реестре Юзеров и проч
            if (
                !pointer_senderOfRequest_inUsersReestr
                || !pointer_currentProject_in_projectsDB
                || !pointer_current_subProject_in_projectsDB
                || !pointer_senderOfRequest_in_projectsDB
            ) {
                console.log(" ");
                console.log("Ошибка в update_ofResponsibleList_subProject_PS- Не обнаружен пользователь в реестре Юзеров, либо в БД, либо не обнаружен непосредственно родительский проект ");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Ошибка в update_ofResponsibleList_subProject_PS- Не обнаружен пользователь в реестре Юзеров, либо родительский проект , parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID,
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_red
                );

                postServise_answer.mResStatus = 0;
                postServise_answer.comment = "Не обнаружен пользователь в реестре Юзеров, либо нужные указатели на объекты";
                return postServise_answer;
            }

            //  проверяем, является ли пользователь админом родительского проекта
            let check_isUser_adminOrModerator_forCurrentProject = functions___pr0001.isUser_adminOrModerator_forCurrentProject(sender_ofRequest_Email, pointer_currentProject_in_projectsDB);

            // если юзеру не разрешено вносить изменения 
            if (!check_isUser_adminOrModerator_forCurrentProject) {
                console.log(" ");
                console.log("Пользователю не разрешено менять настройки teamList_ofResponsible_subProject");

                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Пользователю не разрешено менять настройки teamList_ofResponsible_subProject",
                    '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_yellow
                );

                postServise_answer.mResStatus = 444;
                postServise_answer.comment = "Пользователю не разрешено менять настройки teamList_ofResponsible_subProject";
                postServise_answer.messageForClient = "Negativ - no access for User to change subProject settings";
                postServise_answer.dataFromServer = null;
                return postServise_answer;
            }



            // обновляем список ответственных за задание
            pointer_current_subProject_in_projectsDB.subProject_settings.teamList_ofResponsible_subProject = new_teamList_ofResponsible_subProject;

            // обновляем информацию о времени обновления настроек проекта
            let currentTime = Date.now();
            pointer_current_subProject_in_projectsDB.time_update_current_subProject.time_update_subProject_settings = currentTime;

            // для отправителя обновлений устанавливаем сразу время просмотра этих обновлений.   Поскольку отправитель обновлений может быть как владельцем проекта, так и назначенным Админом - проверяем, проверяем в каком объекте доступных корп аккаунтов искать данный проект
            try {
                //  если отправитель запроса является владельцем проекта, токда обращаем к дереву его собственных корп аккаунтов - ownCorpAccounts
                if (parent_owner_Email == sender_ofRequest_Email) {
                    pointer_senderOfRequest_in_projectsDB.corpAccounts.ownCorpAccounts[parent_corpAccount_ID].projects[parent_project_ID].subProjects[subProject_ID].time_individual_wasRead_subProjectEvents_byUser.time_wasRead_settings = currentTime;
                }
                //  если отправитель запроса является назначенным Админом проекта, токда обращаем к дереву его сторонних корп аккаунтов - otherAccounts
                else {
                    pointer_senderOfRequest_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID].projects[parent_project_ID].subProjects[subProject_ID].time_individual_wasRead_subProjectEvents_byUser.time_wasRead_settings = currentTime;
                }
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при попытке записать время просмотра настроек субПроекта для отправителя новых настроек");
                console.log(error);
            }

            // Отправляем рассылку на ЛонгПуллинг


            // Отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Обновлены настройки teamList_ofResponsible_subProject, parent_owner_Email=" + parent_owner_Email + ", parent_corpAccount_ID=" + parent_corpAccount_ID + ", parentProject=" + parent_project_ID + ", субПроект=" + subProject_ID,
                '🙍' + config_serverCombi.emodziListTelegram_currentProject.variants.circle_green
            );

            // Активировать позже
            // saveAllDataHandle();

            postServise_answer.mResStatus = 1;   // 0   444
            postServise_answer.comment = "Настройки teamList_ofResponsible_subProject успешно обновлены";
            postServise_answer.dataFromServer = {
                resEndPoint: "update_ofResponsibleList_subProject",
                parent_owner_Email,
                parent_corpAccount_ID,
                parent_project_ID,
                subProject_ID,
                sender_ofRequest_Email,
                new_teamList_ofResponsible_subProject,
            };
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
        catch (error) {
            console.log("Ошибка в update_ofResponsibleList_subProject_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка в update_ofResponsibleList_subProject_PS";
            return postServise_answer;
        }
    },

    timeUpdate_wasReadChat_PS(req) {
        // ФУНКЦИЯ НЕ ПРОТЕСТИРОВАНА, нужно многопользовательское взаимодействие
        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск timeUpdate_wasReadChat_PS,  postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let parent_project_ID = req.body.postDataToServer.project_ID;
            let subProject_ID = req.body.postDataToServer.subProject_ID;

            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;
            let time_wasReadChat = req.body.postDataToServer.time_wasReadChat;

            // сюда запишем ссылку на объект для конкретного юзера с датой просмотра чача
            let pointer_time_individual_wasRead____project_OR_subProject_events = null;
            // если это чат проекта
            if (!subProject_ID) {
                // если отправитель поста является владельцем проекта
                if (parent_owner_Email === sender_ofRequest_Email) {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.ownCorpAccounts[parent_corpAccount_ID]?.projects[parent_project_ID]?.project_data?.time_individual_wasRead_projectEvents_byUser;
                }
                // иначе если отправитель поста не является владельцем проекта
                else {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID]?.projects[parent_project_ID]?.project_data?.time_individual_wasRead_projectEvents_byUser;
                }
            }

            // если это чат субПроекта
            if (subProject_ID) {
                // если отправитель поста является владельцем родительского проекта
                if (parent_owner_Email === sender_ofRequest_Email) {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.ownCorpAccounts[parent_corpAccount_ID]?.projects[parent_project_ID]?.subProjects?.[subProject_ID]?.time_individual_wasRead_subProjectEvents_byUser;
                }
                // иначе если отправитель поста не является владельцем проекта
                else {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID]?.projects[parent_project_ID]?.subProjects?.[subProject_ID]?.time_individual_wasRead_subProjectEvents_byUser;
                }
            }


            if (pointer_time_individual_wasRead____project_OR_subProject_events !== undefined && pointer_time_individual_wasRead____project_OR_subProject_events !== null) {
                pointer_time_individual_wasRead____project_OR_subProject_events.time_wasReadChat = time_wasReadChat;
            }
            else {
                throw new Error("Ошибка в timeUpdate_wasReadChat_PS - не удалось найти целевой объект pointer_time_individual_wasRead____project_OR_subProject_events");
            }

            // добавить рассылку уведомлений 

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.comment = "Время просмотра чата успешно обновлено";
            postServise_answer.dataFromServer = {
                resEndPoint: "time_wasReadChat_was_updated",
            };
            postServise_answer.messageForClient = null;
            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в timeUpdate_wasReadChat_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка в timeUpdate_wasReadChat_PS";
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    timeUpdate_wasReadSettings_for_progects_and_subProjects_PS(req) {
        // ФУНКЦИЯ НЕ ПРОТЕСТИРОВАНА, нужно многопользовательское взаимодействие
        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск timeUpdate_wasReadSettings_for_progects_and_subProjects_PS,  postDataToServer= ");
            console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let parent_project_ID = req.body.postDataToServer.project_ID;
            let subProject_ID = req.body.postDataToServer.subProject_ID;

            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;
            let time_wasRead_settings = req.body.postDataToServer.time_wasRead_settings;

            // сюда запишем ссылку на объект для конкретного юзера с датой просмотра чача
            let pointer_time_individual_wasRead____project_OR_subProject_events = null;
            // если это чат проекта
            if (!subProject_ID) {
                // если отправитель поста является владельцем проекта
                if (parent_owner_Email === sender_ofRequest_Email) {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.ownCorpAccounts[parent_corpAccount_ID]?.projects[parent_project_ID]?.project_data?.time_individual_wasRead_projectEvents_byUser;
                }
                // иначе если отправитель поста не является владельцем проекта
                else {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID]?.projects[parent_project_ID]?.project_data?.time_individual_wasRead_projectEvents_byUser;
                }
            }

            // если это чат субПроекта
            if (subProject_ID) {
                // если отправитель поста является владельцем родительского проекта
                if (parent_owner_Email === sender_ofRequest_Email) {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.ownCorpAccounts[parent_corpAccount_ID]?.projects[parent_project_ID]?.subProjects?.[subProject_ID]?.time_individual_wasRead_subProjectEvents_byUser;
                }
                // иначе если отправитель поста не является владельцем проекта
                else {
                    pointer_time_individual_wasRead____project_OR_subProject_events = functions___pr0001.get_pointer_currentUser_in_projectsDB(sender_ofRequest_Email)?.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID]?.projects[parent_project_ID]?.subProjects?.[subProject_ID]?.time_individual_wasRead_subProjectEvents_byUser;
                }
            }


            if (pointer_time_individual_wasRead____project_OR_subProject_events !== undefined && pointer_time_individual_wasRead____project_OR_subProject_events !== null) {
                pointer_time_individual_wasRead____project_OR_subProject_events.time_wasRead_settings = time_wasRead_settings;
            }
            else {
                throw new Error("Ошибка в timeUpdate_wasReadSettings_for_progects_and_subProjects_PS - не удалось найти целевой объект pointer_time_individual_wasRead____project_OR_subProject_events");
            }

            // добавить рассылку уведомлений 

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.comment = "Время просмотра настроек успешно обновлено";
            postServise_answer.dataFromServer = {
                resEndPoint: "time_wasRead_settings",
            };
            postServise_answer.messageForClient = null;
            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в timeUpdate_wasReadSettings_for_progects_and_subProjects_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка в timeUpdate_wasReadSettings_for_progects_and_subProjects_PS";
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    add_user_toContactList_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("ЗАПУСК add_user_toContactList_PS, postDataToServer=");
            console.log(req.body.postDataToServer);

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let owner_Email = req.body.postDataToServer.admin_ID;

            let addUser_eMail = req.body.postDataToServer.addUser_eMail;
            let user_Group = req.body.postDataToServer.user_Group;
            let comments = req.body.postDataToServer.comments;


            let pointer_currentUser_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(owner_Email);

            if (
                // если не совпадает Емайл пользователя с переданным в токене после расшифровки
                owner_Email != req.headers.decodeAT_____user_Email
                ||
                // или пользователь не найден в реестре пользователей
                !pointer_currentUser_inUsersReestr
            ) {
                postServise_answer.mResStatus = 0;   // 1   444
                postServise_answer.comment = "Ошибка в идентификации клиента: " + req.body.postDataToServer.admin_ID;
                postServise_answer.dataFromServer = null;   // {}
                postServise_answer.messageForClient = null;
                return postServise_answer;
            }

            // валидируем Емейл добавляемого контакта
            try {
                if (!addUser_eMail || !(validator.isEmail(addUser_eMail))) {
                    console.log(`Ошибка в add_user_toContactList_PS при проверке наличия Емейла нового контакта и его синтаксической валидности, addUser_eMail=${addUser_eMail}, validator.isEmail(user_Email)= ${validator.isEmail(addUser_eMail)}`);

                    throw new Error(`Ошибка в add_user_toContactList_PS при проверке наличия Емейла нового контакта и его синтаксической валидности, addUser_eMail=${addUser_eMail}, validator.isEmail(user_Email)=${validator.isEmail(addUser_eMail)}`);

                }
            } catch (error) {
                console.log(" ");
                console.log("Ошибка в add_user_toContactList_PS при проверке валидности addUser_eMail");
                console.log(error);
                return null;
            }

            //  pointer_currentUser_inUsersReestr.contactList = {};

            console.log(" ");
            console.log("pointer_currentUser_inUsersReestr ДО ДОБАВЛЕНИЯ контакта=");
            console.log(pointer_currentUser_inUsersReestr);

            // добавляем новый контакт в контакт-лист
            pointer_currentUser_inUsersReestr.contactList[addUser_eMail] = NEW__dataModels.create_user_in_contactList(addUser_eMail, user_Group, comments);

            console.log(" ");
            console.log("pointer_currentUser_inUsersReestr ПОСЛЕ ДОБАВЛЕНИЯ контакта=");
            console.log(pointer_currentUser_inUsersReestr);

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "was_added_user_inContaktsList",
                owner_Email,
                addUser_eMail,
                user_Group,
                comments
            }

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- add_user_toContactList_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- add_user_toContactList_PS, admin_ID= " + req.body.postDataToServer.admin_ID;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    set_newContactList_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("ЗАПУСК set_newContactList_PS, postDataToServer=");
            console.log(req.body.postDataToServer);

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let owner_Email = req.body.postDataToServer.admin_ID;
            let deleteList = req.body.postDataToServer.deleteList;
            let newContactList = req.body.postDataToServer.newContactList;

            let pointer_currentUser_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(owner_Email);

            /*  ДОБАВИТЬ ФУНКЦИОНАЛ ПО УДАЛЕНИЮ ПОЛЬЗОВАТЕЛЕЙ ИЗ СОСТАВА УЧАСТНИКОВ ВСЕХ ПРОЕКТОВ,СУБПРОЕКТОВ ДАННОГО ОВНЕРА, И УДАЛЕНИЯ ДЛЯ НИХ СООТВЕТСТВУЮЩИХ ПРОЕКТОВ ИЗ ЧИСЛА ДОСТУПНЫХ
            let all_own_projects_list = [];
            let all_own_subProjects_list = [];
            */

            //  устанавливаем новый переданный контакт-лист для админа
            // Добавить валидацию на предмет объекта, а не массива, для нового формата данных

            if (!global_Functions_and_Servises_forAll_Projects.check_isVar_object(newContactList)) {
                console.log(" ");
                console.log("ОШИБКА ПРИ УСТАНОВКЕ КОНТАКТ ЛИСТА, данные не являются объектом, newContactList =");
                console.log(newContactList);

                return;
            }

            pointer_currentUser_inUsersReestr.contactList = newContactList;

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "set_newContactList_PS",
                owner_Email,
                newContactList,
            }
            return postServise_answer;

        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- set_newContactList_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- set_newContactList_PS, admin_ID= " + req.body.postDataToServer.admin_ID;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    delete_users_fromContactList_PS(req) {
        // Задействовать, сейчас по факту не используется, функционал перенесен в фун. m_set_newContactList_PS
        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("ЗАПУСК delete_users_fromContactList_PS, postDataToServer=");
            console.log(req.body.postDataToServer);

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let owner_Email = req.body.postDataToServer.admin_ID;
            let deleteList = req.body.postDataToServer.deleteList;

            let pointer_currentUser_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(owner_Email);

            // удаляем каждый юзера из изконтакт-листа
            try {
                deleteList.forEach(item => {
                    delete pointer_currentUser_inUsersReestr.contactList[item.user_Email];
                });
            } catch (error) {
                console.log(" ");
                console.log("Ошибка при удалении узера из контакт листа:");
                console.log(error);
            }

            let usersList_Arr = deleteList; // нужно проверить, что во входящих - объект или массив

            // создаем списко всех проектов и субпроектов владельца контакт листа
            const owner_ownProjectsListVectors_and_ownSubProjectsListVectors = functions___pr0001.get_own_projectsListVectors_and_subProjectsListVectors(owner_Email);
            const owner_projectsList_Arr = owner_ownProjectsListVectors_and_ownSubProjectsListVectors.projectsList_Arr;
            const owner_subProjectsList_Arr = owner_ownProjectsListVectors_and_ownSubProjectsListVectors.subProjectsList_Arr;


            usersList_Arr.forEach(userInContactList_Email => {
                // вычеркиваем юзера из списка teamList своих проектов
                owner_projectsList_Arr.forEach(current_project_pointer => {
                    try {
                        delete current_project_pointer.project_data.project_settings.teamList[userInContactList_Email];
                    } catch (error) {
                        console.log(" ");
                        console.log("Ошибка при попытке удаления пользователя из teamList проекта, при удалении его из контактЛиста:");
                        console.log(error);
                    }
                });
                // вычеркиваем юзера из списка teamList_ofResponsible_subProject своих субПроектов
                owner_subProjectsList_Arr.forEach(current_subProject_pointer => {
                    try {
                        delete current_subProject_pointer.subProject_settings.teamList_ofResponsible_subProject[userInContactList_Email];
                    } catch (error) {
                        console.log(" ");
                        console.log("Ошибка при попытке удаления пользователя из teamList_ofResponsible_subProject субПроекта, при удалении его из контактЛиста:");
                        console.log(error);
                    }
                });

                // далее удаляем свои проекты из списка доступных проектов для каждого удаленного из контактов юзера
                owner_projectsList_Arr.forEach(current_project_pointer => {
                    try {
                        functions___pr0001.delete_currentProject_fromAssessList_teamUser(
                            current_project_pointer.project_data.parent_owner_Email,
                            current_project_pointer.project_data.parent_corpAccount_ID,
                            current_project_pointer.project_data.project_ID,

                            userInContactList_Email
                        );
                    } catch (error) {
                        console.log(" ");
                        console.log("Ошибка при удалении проекта из списка доступных проектов для конкретного юзера:");
                        console.log(error);
                    }
                })
            })

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "was_deleted_users_fromContaktsList",
                owner_Email,
            }

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- delete_users_fromContactList_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- delete_users_fromContactList_PS, admin_ID= " + req.body.postDataToServer.admin_ID;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    get_usersOnlineStatusFromServer_forCurrentProject_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            // console.log(" ");
            // console.log("ЗАПУСК get_usersOnlineStatusFromServer_forCurrentProject_PS, postDataToServer=");
            // console.log(req.body.postDataToServer);

            let parent_owner_Email = req.body.postDataToServer.parent_corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount.corpAccount_ID;
            let project_ID = req.body.postDataToServer.project_ID;
            let sender_ofRequest_Email = req.body.postDataToServer.sender_ofRequest_Email;

            let pointer_current_project_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(parent_owner_Email, parent_corpAccount_ID, project_ID);

            let usersOnlineStatus = null;

            let teamUsersList = pointer_current_project_in_projectsDB?.project_data.project_settings?.teamList;

            // проверяем, что список является объектом
            if (global_Functions_and_Servises_forAll_Projects.check_isVar_object(teamUsersList)) {
                // преобразуем объект в массив
                teamUsersList = global_Functions_and_Servises_forAll_Projects.convert_mObjectToArray(teamUsersList);

                // для каждого юзера получаем его онлайн статус
                usersOnlineStatus = teamUsersList.map(item => {
                    return {
                        user_Email: item.user_Email,

                        onlineTime: functions___pr0001.getOnlineTimeCurrentUser(item.user_Email)
                    }
                });

                // преобразуем массив обратно в объект
                usersOnlineStatus = global_Functions_and_Servises_forAll_Projects.convert_mArrayToObject(usersOnlineStatus, "user_Email");
            }
            else {
                throw new Error("Переменная - teamUsersList - не являются объектом, как ожидалось ");
            }

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "get_usersOnlineStatusFromServer_forCurrentProject_PS",
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID,
                sender_ofRequest_Email,

                usersOnlineStatus: usersOnlineStatus,
            }

            // console.log(" ");
            // console.log("usersOnlineStatus=");
            // console.log(usersOnlineStatus);

            return postServise_answer;

        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- get_usersOnlineStatusFromServer_forCurrentProject_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- get_usersOnlineStatusFromServer_forCurrentProject_PS, admin_ID= " + req.body.postDataToServer.admin_ID;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    setUserSettings_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let user_Email = req.headers.decodeAT_____user_Email;
            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);
            let new_userPublicData = req.body.postDataToServer.userPublicData;

            if (
                // если не совпадает Емайл пользователя
                user_Email != req.body.postDataToServer.user_Email
                ||
                // или пользователь не найден в реестре пользователей
                !pointer_currentUserInReestr
            ) {
                throw new Error("Ошибка в setUserSettings_PS при идентификации клиента: " + req.body.postDataToServer.user_Email)
            }

            if (!new_userPublicData || !global_Functions_and_Servises_forAll_Projects.check_isVar_object(new_userPublicData)) {
                throw new Error("Ошибка в setUserSettings_PS - нет корректных данных для записи: " + req.body.postDataToServer.user_Email)
            }

            // записываем данные, переписываем только данные, которые пришли в настройках
            Object.assign(pointer_currentUserInReestr.userPublicData, new_userPublicData);

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "setUserSettings",
                user_Email,
                new_userPublicData,
            }

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- setUserSettings_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- setUserSettings_PS, user_Email= " + req.body.postDataToServer.user_Email;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    async uploadAvatarUser_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let user_Email = req.headers.decodeAT_____user_Email;
            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);
            let newAvatarFile = req.body.newAvatarFile;

            if (!user_Email || !pointer_currentUserInReestr) {
                throw new Error("Ошибка в uploadAvatarUser_PS при идентификации клиента: " + user_Email);
            }

            if (!newAvatarFile) throw new Error("Ошибка в uploadAvatarUser_PS - Пустой файл аватара");

            // из потока данных файла необх удалить часть потоковых данных для возможности дальнейшего его сохранения в файл, поскольку эти данные добавляются канвасом для описания метода шифрования изображения
            // Для вырезания этих данных мы удаляемый фрагмент заменяем на пустой текст), см. видео https://www.youtube.com/watch?v=KVeMsy4qCdg&ab_channel=UlbiTV,   min   1:10:10
            // newAvatarFile = newAvatarFile.replace('data:image/jpeg;base64,', '');
            newAvatarFile = newAvatarFile.replace(/^data:image\/\w+;base64,/, '');
            // далее запись файла на диск
            // Поскольку файл аватара мы получили от клиента в виже потока данных, без имени , то название файла назначаем тут самостоятельно
            let user_ID = pointer_currentUserInReestr.user_ID;
            let newAvatarFileName = "av___" + user_ID + "." + "jpeg";

            // let pathSaveFile = './static/avatars/' + newAvatarFileName;
            let pathSaveFile = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.createDir_andAll_intermediateDirectories(config_pr0001.static_Adress + 'avatars');


            console.log("pathSaveFile= " + pathSaveFile);


            if (!pathSaveFile) {
                throw new Error("Ошибка в uploadAvatarUser_PS при попытке создать папку для скачивания аватара, либо получить путь к папке, user_Email= " + user_Email)
            }

            let fullPathAndName = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(pathSaveFile + "/" + newAvatarFileName);

            // далее запись файла на диск. Оборачиваем в промис, чтобы можно было использовать await
            await new Promise((resolve, reject) => {
                fs.writeFile(fullPathAndName, newAvatarFile, 'base64', (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });


            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "wasUloadedAvatarUser",
                user_Email,
            }

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- uploadAvatarUser_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- uploadAvatarUser_PS ";
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    async delete_avatarFromServer_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let user_Email = req.headers.decodeAT_____user_Email;
            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);

            if (!user_Email || !pointer_currentUserInReestr) {
                throw new Error("Ошибка в uploadAvatarUser_PS при идентификации клиента: " + user_Email);
            }

            // Поскольку файл аватара мы получили от клиента в виже потока данных, без имени , то название файла назначаем тут самостоятельно
            let user_ID = pointer_currentUserInReestr.user_ID;
            let avatarFileName = "av___" + user_ID + "." + "jpeg";

            let fullPath_toAvatarFile = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(config_pr0001.static_Adress + 'avatars/' + avatarFileName);

            // далее запись файла на диск. Оборачиваем в промис, чтобы можно было использовать await
            await new Promise((resolve, reject) => {
                fs.unlink(fullPath_toAvatarFile, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "wasUloadedAvatarUser",
                user_Email,
            }

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- delete_avatarFromServer_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- delete_avatarFromServer_PS ";
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    rename_corpAccount_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск rename_corpAccount_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);


            let parent_owner_Email = req.body.postDataToServer.corpAccount.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.corpAccount.corpAccount_ID;
            let new_corpAccount_Name = req.body.postDataToServer.new_corpAccount_Name;

            let pointer_currentUser_in_projects_DB = functions___pr0001.get_pointer_currentUser_in_projectsDB(parent_owner_Email);

            let pointer_currentOwnCorpAccount_in_projectsDB = functions___pr0001.get_pointer_current_corpAccount_in_projectsDB(parent_owner_Email, parent_corpAccount_ID);


            // Проверяем лимит по длинне названия корп аккаунта при переименовании
            if (new_corpAccount_Name.length > config_pr0001.data_limits.name_corpAcc_longLimit) {
                throw new Error("Ошибка в rename_corpAccount_PS, имя корпАккаунта длиньше установленного предела");
            }

            // предотвращаем дублирование имен Корп аккаунтов при создании
            let existNameDublicate = Object.values(pointer_currentUser_in_projects_DB.corpAccounts.ownCorpAccounts).some(
                item => item.corpAccount_data.corpAccount_Name == new_corpAccount_Name
            )
            if (existNameDublicate) {
                throw new Error("Ошибка в rename_corpAccount_PS,  дублирование названия");
            }

            // Проверяем наличие целевого корпАккаунта
            if (!pointer_currentOwnCorpAccount_in_projectsDB) {
                throw new Error("Ошибка в rename_corpAccount_PS, не найден целевой  pointer_currentOwnCorpAccount_in_projectsDB");
            }

            // Переписываем новое название корп Аккаунта в БД
            pointer_currentOwnCorpAccount_in_projectsDB.corpAccount_data.corpAccount_Name = new_corpAccount_Name;

            console.log(" ");
            console.log("pointer_currentOwnCorpAccount_in_projectsDB = ");
            console.log(pointer_currentOwnCorpAccount_in_projectsDB);

            // Отправляем рассылку на ЛонгПуллинг
            // Активировать позже

            postServise_answer.mResStatus = 1;   // 0   444
            postServise_answer.comment = "Корп Аккаунт успешно переименован";
            postServise_answer.dataFromServer = {
                resEndPoint: "was_renamed_corpAccount",
                renamed_corpAccaunt_data: {
                    parent_owner_Email: pointer_currentOwnCorpAccount_in_projectsDB.corpAccount_data.parent_owner_Email,
                    corpAccount_ID: pointer_currentOwnCorpAccount_in_projectsDB.corpAccount_data.corpAccount_ID,
                    corpAccount_Name: pointer_currentOwnCorpAccount_in_projectsDB.corpAccount_data.corpAccount_Name,
                }
            };
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
        catch (error) {
            console.log("Ошибка rename_corpAccount_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка rename_corpAccount_PS";
            return postServise_answer;
        }
    },

    // Функция не отлажена, отладить на клиента и здесь. Требуется многопользовательское взаимодействий
    ignor_ownerCorpAccount_PS(req) {
        // Функция не отлажена, отладить на клиента и здесь

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск ignor_ownerCorpAccount_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);


            // добавить функционал
        }
        catch (error) {
            console.log("Ошибка ignor_ownerCorpAccount_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка ignor_ownerCorpAccount_PS";
            return postServise_answer;
        }
    },

    // Функция не отлажена, отладить на клиента и здесь. Требуется многопользовательское взаимодействий
    restore_ownerCorpAccount_PS(req) {
        // Функция не отлажена, отладить на клиента и здесь


        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {
            console.log(" ");
            console.log("Запуск restore_ownerCorpAccount_PS, postDataToServer= ");
            console.log(req.body.postDataToServer);

            // добавить функционал
        }
        catch (error) {
            console.log("Ошибка restore_ownerCorpAccount_PS");
            console.log(error);

            postServise_answer.mResStatus = 0;
            postServise_answer.comment = "Ошибка restore_ownerCorpAccount_PS";
            return postServise_answer;
        }
    },

    logOutOneGadget_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let user_Email = req.headers.decodeAT_____user_Email;
            let gadget_process_ID = req.body.postDataToServer.gadget_process_ID;

            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);

            if (
                // если пользователь не найден в реестре пользователей
                !pointer_currentUserInReestr
            ) {
                throw new Error("Ошибка logOutOneGadget_PS - пользователь не найден: " + user_Email);
            }

            // удаляем accessToken для соответствующего гаджета
            if (pointer_currentUserInReestr.autorisationData?.tokensDifferentGadgets[gadget_process_ID]) {
                delete pointer_currentUserInReestr.autorisationData?.tokensDifferentGadgets[gadget_process_ID];
                console.log("Успешно выполднен logOutOneGadget_PS для пользователя: " + user_Email + ", на гаджете: " + gadget_process_ID);
            }
            else {
                console.log("При попытке выполнения logOutOneGadget_PS для пользователя: " + user_Email + ", на гаджете: " + gadget_process_ID + ", не был найден в реестре доступа соотвентствующий гаджет");
            }

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "logOutOneGadget_PS",
            }

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- logOutOneGadget_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- logOutOneGadget_PS, user_Email= " + req.body.postDataToServer.user_Email;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    logOutAllGadgets_PS(req) {

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: {},
            messageForClient: null,
        };

        try {

            // проверяем, что клиент подлинный, сравниваем расшифрованное имя из заголовка и имя в теле запроса
            let user_Email = req.headers.decodeAT_____user_Email;
            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);

            if (
                // если пользователь не найден в реестре пользователей
                !pointer_currentUserInReestr
            ) {
                throw new Error("Ошибка logOutAllGadgets_PS - пользователь не найден: " + user_Email);
            }

            // удаляем все accessToken для для всех гаджетов для соответствующего Юзера
            pointer_currentUserInReestr.autorisationData.tokensDifferentGadgets = {};
            console.log("Успешно выполднен logOutAllGadgets_PS для пользователя: " + user_Email);

            postServise_answer.mResStatus = 1;   // 1   444
            postServise_answer.dataFromServer = {
                resEndPoint: "logOutAllGadgets_PS",
            }

            return postServise_answer;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- logOutAllGadgets_PS: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- logOutAllGadgets_PS, user_Email= " + req.body.postDataToServer.user_Email;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    },

    //----------------------------------
    //----------------------------------
    //----------------------------------

    // Запросы от файлового сервера

    async access_toProjectFiles_PS___pr0001(req) {
        // это одна функция применяется ко всем типам операций с файлами. 
        // Она только делает валидацию отправителя и собирает данные о пользователе и интересующем проекте, и отправляет инфу на файловый сервер, без проверки. Вся проверка на файловом сервере

        let postServise_answer = {
            mResStatus: 0,    // варианты кодов: 1 - успешно сохранено, 10, 11, 12 ...
            comment: " ",
            dataFromServer: null,
            messageForClient: null,
        };

        try {
            // console.log(" ");
            // console.log(" + + + + + ЗАПУСК access_toProjectFiles_PS___pr0001, req.body=:");
            // console.log(req.body);

            let parent_owner_Email = req.body.postDataToServer.parent_owner_Email;
            let parent_corpAccount_ID = req.body.postDataToServer.parent_corpAccount_ID;
            let project_ID = req.body.postDataToServer.project_ID;
            let user_Email = req.body.postDataToServer.user_Email;

            let pointer_current_owner_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(parent_owner_Email);
            let pointer_current_user_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);
            let pointer_current_project_in_projectsDB = functions___pr0001.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID
            );

            // валидация входящих данных
            if (
                !parent_owner_Email
                || !parent_corpAccount_ID
                || !project_ID
                || !user_Email
                || !pointer_current_owner_inUsersReestr
                || !pointer_current_user_inUsersReestr
                || !pointer_current_project_in_projectsDB
            ) {
                console.log("");
                console.log("Не достаточно входящих данных - access_toProjectFiles_PS___pr0001");

                postServise_answer.comment = "Не достаточно входящих данных - access_toProjectFiles_PS___pr0001";
                return postServise_answer;
            }

            // валидация токена
            let gajet_ID = req.body.postDataToServer.gajet_ID;
            let accessToken = req.body.postDataToServer.accessToken;
            if (pointer_current_user_inUsersReestr.autorisationData.tokensDifferentGadgets[gajet_ID].accessToken != accessToken) {
                console.log("");
                console.log("Токен не валидный");

                postServise_answer.comment = "Токен не валидный";
                return postServise_answer;
            }

            // заготовка полезных данных в ответе
            postServise_answer.dataFromServer = {
                comment: null,
                userData: {
                    user_Email: user_Email,
                },
                ownerData: {
                    owner_Email: parent_owner_Email,
                    owner_ID: pointer_current_owner_inUsersReestr.user_ID,
                    owner_tarif_plan: pointer_current_owner_inUsersReestr.tarif_plan,
                },
                projectData: {
                    ...pointer_current_project_in_projectsDB.project_data,

                    // parent_corpAccount: parent_corpAccount_ID,
                    // project_ID: project_ID,
                    // project_attachedFiles_settings: pointer_current_project_in_projectsDB.project_data.project_settings.project_attachedFiles_settings
                },
            };

            // удаляем из ответа лишнюю информацию
            delete postServise_answer.dataFromServer.projectData.time_update_current_project;
            delete postServise_answer.dataFromServer.projectData.time_individual_wasRead_projectEvents_byUser;
            delete postServise_answer.dataFromServer.projectData.time_individual_wasRead_projectEvents_byUser;

            postServise_answer.mResStatus = 1;

            // console.log(" ");
            // console.log("УСПЕШНЫЙ ОТВЕТ ИЗ postService_pr0001 --- access_toProjectFiles_PS___pr0001: ");
            // console.log(postServise_answer);

            return postServise_answer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка из postService_pr0001 --- access_toProjectFiles_PS___pr0001: ");
            console.log(error);

            postServise_answer.mResStatus = 0;   // 1   444
            postServise_answer.comment = "Ошибка из postService_pr0001 --- access_toProjectFiles_PS___pr0001, user_Email= " + req.body.postDataToServer.user_Email;
            postServise_answer.dataFromServer = null;   // {}
            postServise_answer.messageForClient = null;
            return postServise_answer;
        }
    }


}
 
//----------------------------------
//----------------------------------
//----------------------------------

export const functions___pr0001 = {

    sendTelegramInfo_from_pr0001: async (text, additional__emodzi_or_name_or_color_emodzi) => {
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
                connectionTo_infoTelegramBot, // соединение с Телеграм
                config_serverCombi.adminTelegramAccount_ID_for_information, // мой аккаунт для входящих сообщений
                config_pr0001.projectNameID, // Название проекта
                text, // текст сообщения
                (config_pr0001.emodziListTelegram_currentProject.default_currentProjectEmodzi + " " + secondEmodzi + " ") //емодзи из переменной, из списка 
            );
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    },

    isSenderValidationRequired(endPoint) {
        // эта функция сообщает, требуется ли валидация отправителя для конкретного ЕндПоинта
        let rerult = true; // т.е. требуется валидация
        try {
            //  список ЕндПоинтов, которые не требуют Токен доступа
            let exclusionaryEndpoints = config_pr0001.exclusionaryEndpoints;
            // Если Ендпоинт содержит один из вышеперечисленных адресов - прерываем проверку и продолжаем выполнение
            if (exclusionaryEndpoints.some(exclusionaryEndpoints => endPoint.includes(exclusionaryEndpoints))
            ) {
                rerult = false;
            }

            return rerult;

        } catch (error) {
            console.log(" ");
            console.log("Сработал  catch в isSenderValidationRequired:");
            console.log(error);
            return rerult;
        }
    },

    //----------------------------------

    responseLongPoolling(
        userList_Obj, // тут получаем объект со списком получателей
        responseLongPoolling_Data,
    ) {
        try {

            if (!userList_Obj || !responseLongPoolling_Data) {
                console.log("Ошибка в responseLongPoolling - нет данных в аргументах");
                return;
            }

            const usersList_Arr = Object.keys(userList_Obj);

            usersList_Arr.forEach(user_Email => {
                try {
                    const stack = serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email];
                    if (!Array.isArray(stack) || stack.length === 0) {
                        return;
                    }

                    // рассылаем данные каждому long-polling запросу пользователя
                    stack.forEach(item_longPolling => {
                        try {
                            if (item_longPolling?.callBack_longPoolling) {
                                item_longPolling.callBack_longPoolling(responseLongPoolling_Data);
                            }
                        } catch (err) {
                            console.log("Ошибка при вызове callBack_longPoolling для пользователя", user_Email, err);
                        }
                    });

                    // очищаем стек после рассылки
                    delete serverVarriorsDataFromBD_pr0001.longPoollingList[user_Email];

                } catch (err) {
                    console.log("Ошибка при рассылке long-polling для пользователя", user_Email, err);
                }
            });


        } catch (error) {
            console.log(" ");
            console.log("Ошибка в responseLongPoolling");
            console.log(error);
        }
    },

    //----------------------------------

    generateTokens(payLoad) {

        let accessToken = jwt.sign(payLoad, serverVarriorsDataFromBD_pr0001.mySecretKey_forAccessToken, { expiresIn: '10d' });
        let refreshToken = jwt.sign(payLoad, serverVarriorsDataFromBD_pr0001.mySecretKey_forRefreshToken, { expiresIn: '300d' });
        return { accessToken, refreshToken };
    },

    //----------------------------------

    add_newUser_inUsersReestr(
        user_Email,
        user_firstName, // необязательный аргумент
        user_secondName,  // необязательный аргумент
        user_nick,  // необязательный аргумент
        userFotoAderessFromGoogle,  // необязательный аргумен
    ) {
        try {
            if (!user_Email || !(validator.isEmail(user_Email))) {
                console.log(`Ошибка в add_newUser при проверке наличия Емейла и его синтаксической валидности, user_Email=${user_Email}, validator.isEmail(user_Email)=${validator.isEmail(user_Email)}`);
                return null;
            }

            // создаем и записываем в реестр нового пользователя
            serverVarriorsDataFromBD_pr0001.users_Reestr[user_Email] = NEW__dataModels.create_user_inUsersReestr(
                user_Email,
                user_firstName,
                user_secondName,
                user_nick,
                userFotoAderessFromGoogle
            );
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_currentUserInReestr");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    check_AND_get___OR___create_AND_get___currentUsersCorpAccaunts_in_projectsDB(user_Email) {
        try {
            serverVarriorsDataFromBD_pr0001.projects_DB[user_Email] ??= NEW__dataModels.create_newCorpAccauntItem_forNewUser_in_projectsDB(user_Email);
            return serverVarriorsDataFromBD_pr0001.projects_DB[user_Email];

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_currentUserInReestr");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    get_pointer_currentUser_in_projectsDB(user_Email) {
        try {
            return serverVarriorsDataFromBD_pr0001.projects_DB[user_Email];

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_currentUserInReestr");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    get_pointer_currentUserInReestr__OR__add_newUser_and_getPointer(
        user_Email,
        user_firstName, // необязательный аргумент
        user_secondName,  // необязательный аргумент
        user_nick,  // необязательный аргумент
        userFotoAderessFromGoogle,  // необязательный аргумент
    ) {
        try {
            let pointer_currentUser = this.get_pointer_currentUserInReestr(user_Email);
            // если пользователь не существует, тогда создаем его в реестре
            if (!pointer_currentUser) {
                pointer_currentUser = this.add_newUser_inUsersReestr(
                    user_Email,
                    user_firstName,
                    user_secondName,
                    user_nick,
                    userFotoAderessFromGoogle
                )
                // повторно ищем ссылку на пользователя
                pointer_currentUser = this.get_pointer_currentUserInReestr(user_Email)
            }
            return pointer_currentUser;
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_currentUserInReestr__OR__add_newUser_and_getPointer");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    get_pointer_currentUserInReestr(user_Email) {
        try {

            // console.log(" ");
            // console.log("Запуск get_pointer_currentUserInReestr, user_Email= " + user_Email);

            if (serverVarriorsDataFromBD_pr0001.users_Reestr[user_Email]) {
                return serverVarriorsDataFromBD_pr0001.users_Reestr[user_Email];
            }
            else return null;
        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_currentUserInReestr");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    // тут получаем ссылку на свои конкретный собственный корп аккаунт
    get_pointer_current_corpAccount_in_projectsDB(parent_owner_Email, corpAccount_ID) {
        try {
            // console.log(" ");
            // console.log("Зауск get_pointer_current_corpAccount_in_projectsDB, arguments= ");
            // console.log(arguments);

            // console.log(" ");
            // console.log("serverVarriorsDataFromBD_pr0001.projects_DB[parent_owner_Email]= ");
            // console.log(serverVarriorsDataFromBD_pr0001.projects_DB[parent_owner_Email]);

            return serverVarriorsDataFromBD_pr0001.projects_DB[parent_owner_Email]?.corpAccounts?.ownCorpAccounts[corpAccount_ID];

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_current_corpAccount_in_projectsDB");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    // тут получаем информацию о конкретно корп аккаунте (ID, название и т.п.), без вложенных проектов
    get_info_current_corpAccount(parent_owner_Email, corpAccount_ID) {
        try {

            if (serverVarriorsDataFromBD_pr0001.projects_DB[parent_owner_Email]?.corpAccounts?.ownCorpAccounts[corpAccount_ID]) {

                let pointer_current_corpAccount_in_projectsDB = this.get_pointer_current_corpAccount_in_projectsDB(parent_owner_Email, corpAccount_ID);

                let info_corpAcc = { ...pointer_current_corpAccount_in_projectsDB.corpAccount_data };

                // удаляем из этих данных объект с проектами
                delete info_corpAcc.projects;

                return info_corpAcc;
            }

            else return null;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_current_corpAccount_in_projectsDB");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    get_pointer_current_project_in_projectsDB(
        parent_owner_Email,
        parent_corpAccount_ID,
        project_ID
    ) {

        try {
            return serverVarriorsDataFromBD_pr0001.projects_DB[parent_owner_Email]?.corpAccounts?.ownCorpAccounts?.[parent_corpAccount_ID]?.projects?.[project_ID];

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_current_project_in_projectsDB");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    get_pointer_current_subProject_in_projectsDB(
        parent_owner_Email,
        parent_corpAccount_ID,
        parent_project_ID,
        subProject_ID
    ) {
        try {
            return serverVarriorsDataFromBD_pr0001.projects_DB[parent_owner_Email]?.corpAccounts?.ownCorpAccounts?.[parent_corpAccount_ID]?.projects?.[parent_project_ID]?.subProjects?.[subProject_ID];

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_current_subProject_in_projectsDB");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    is_user_member_ofCurrentProject(
        parent_owner_Email,
        parent_corpAccount_ID,
        project_ID,

        userInTeam_Email,
    ) {
        try {
            let pointer_parentProject_in_BD = this.get_pointer_current_project_in_projectsDB(
                parent_owner_Email,
                parent_corpAccount_ID,
                project_ID
            );

            if (!pointer_parentProject_in_BD) {
                console.log(" ");
                console.log("Не найден целевой проект в is_user_member_ofCurrentProject");
                return null;
            }

            // проверяем и сразу возвращаем ответ, есть ли данный участник в составе teamList проекта
            return (
                (parent_owner_Email === userInTeam_Email)
                ||
                (
                    Object.keys(
                        pointer_parentProject_in_BD.project_data?.project_settings?.teamList ?? {}
                    ).includes(userInTeam_Email)
                )
            );

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в is_user_member_ofCurrentProject");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    include_currentProject_inAssessList_teamUser(
        parent_owner_Email,
        parent_corpAccount_ID,
        project_ID,

        teamUser_Email,
    ) {
        try {
            if (!parent_owner_Email || !parent_corpAccount_ID || !project_ID || !teamUser_Email) {
                console.log(" ");
                console.log("Ошибка в includeCarrentProject_inAssessList_teamUser - недостаточно аргументов");
                return null;
            }

            // проверяем валидность Емейла
            if (!validator.isEmail(teamUser_Email)) {
                console.log(" ");
                console.log("Отказ в include_currentProject_inAssessList_teamUser - Емайл пользователя не прошел валидацию, teamUser_Email= " + teamUser_Email);
                return null;
            }

            // для случаев, когда пользователей добавляют в список команды до того, как они сами зарегистрировались на сервере - проверяем, есть ли аккаунт данного пользователя в БД, и при необходимости создаем его. В любом сслучае получаем на него ссылку
            let teamUser_in_projectsDB = this.check_AND_get___OR___create_AND_get___currentUsersCorpAccaunts_in_projectsDB(teamUser_Email);

            // добавляем входящий проект в список доступных проектов пользователя

            teamUser_in_projectsDB.corpAccounts ??= {};
            teamUser_in_projectsDB.corpAccounts.otherAccounts ??= {};
            teamUser_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email] ??= {};
            teamUser_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID] ??= {};
            teamUser_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID].projects ??= {};

            teamUser_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID].projects[project_ID] ??= {
                parent_owner_Email: parent_owner_Email,
                parent_corpAccount_ID: parent_corpAccount_ID,
                project_ID: project_ID,

                time_individual_wasReadEvents_byCurrentUser: {
                    time_wasRead_settings: 0,
                    time_wasReadChat: 0,
                },
            };

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в includeCarrentProject_inAssessList_teamUser");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    delete_currentProject_fromAssessList_teamUser(
        parent_owner_Email,
        parent_corpAccount_ID,
        project_ID,

        teamUser_Email,
    ) {
        try {
            if (!parent_owner_Email || !parent_corpAccount_ID || !project_ID || !teamUser_Email) {
                console.log(" ");
                console.log("Ошибка в delete_currentProject_fromAssessList_teamUser - недостаточно аргументов");
                return null;
            }

            let teamUser_in_projectsDB = this.get_pointer_currentUser_in_projectsDB(teamUser_Email);
            // удаляем указанный проект из списка доступных проектов пользователя
            if (teamUser_in_projectsDB?.corpAccounts?.otherAccounts?.[parent_owner_Email]?.[parent_corpAccount_ID]?.projects?.[project_ID]) {
                delete teamUser_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID].projects[project_ID];


                // дополнительно проверяем, есть ли в стороннем корпАккаунте другие доступные проекты, и при необходимости удаляем родительский корпАккаунт из списка, чтобы не засорять реестр и не отображеть пустой корпАккакнт в списке Меню для стороннего пользователя
                if (
                    !(Object.keys(teamUser_in_projectsDB?.corpAccounts?.otherAccounts[parent_owner_Email]?.[parent_corpAccount_ID]?.projects)?.length > 0)
                ) {
                    delete teamUser_in_projectsDB.corpAccounts.otherAccounts[parent_owner_Email][parent_corpAccount_ID];
                }
            }

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в delete_currentProject_fromAssessList_teamUser");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    isUser_adminOrModerator_forCurrentProject(user_Email, pointer_parentProject_in_projectsDB) {
        try {

            // console.log(" ");
            // console.log("Запуск isUser_adminOrModerator_forCurrentProject, arguments= ");
            // console.log(arguments);

            // если юзер является владельцем проекта по умолчанию
            if (pointer_parentProject_in_projectsDB.project_data.parent_owner_Email == user_Email) {
                return true;
            }

            // если юзер является назначенным Админом или Модератором проекта 
            if (
                pointer_parentProject_in_projectsDB.project_data?.project_settings?.teamList?.[user_Email]?.user_Role === "role_Owner"
                ||
                pointer_parentProject_in_projectsDB.project_data?.project_settings?.teamList?.[user_Email]?.user_Role === "role_Moderator"
            ) {
                return true;
            }

            // по умолчанию ответ отрицательный
            return false;
        } catch (error) {
            console.log("Ошибка isUser_adminOrModerator_forCurrentProject");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    get_pointer_currentChat(
        parent_owner_Email,
        parent_corpAccount_ID,
        parent_project_ID,
        subProject_ID
    ) {

        try {
            let pointer_current_chat = null;
            // если речь идет о чате для Проекта
            if (!subProject_ID) {
                pointer_current_chat = serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email]?.corpAccounts[parent_corpAccount_ID]?.projects[parent_project_ID]?.mainProjectChat;
            }
            // если речь идет о чате для субпроекта, тогда добавляем вложенный объект чата для родительского проекта
            if (subProject_ID) {
                pointer_current_chat = serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email]?.corpAccounts[parent_corpAccount_ID]?.projects[parent_project_ID]?.subProjectsChats[subProject_ID];
            }

            return pointer_current_chat;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_pointer_currentChat");
            console.log(error);

            return null;
        }
    },

    //----------------------------------

    get_pointer_currentChat_OR_create_AND_getPointer_currentChat(
        parent_owner_Email,
        parent_corpAccount_ID,
        parent_project_ID,
        subProject_ID
    ) {

        try {
            let pointer_current_chat = null;

            // сначала проверяем/создаем при необходимости структуру чата до родительского проекта
            serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email] ??= {};
            serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts ??= {};
            serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID] ??= {};
            serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID].projects ??= {};
            serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID].projects[parent_project_ID] ??= {
                mainProjectChat: NEW__dataModels.create_Chat_or_subChat(
                    parent_owner_Email,
                    parent_corpAccount_ID,
                    parent_project_ID
                ),

                subProjectsChats: {},
            };
            // присваиваем переменной ссылку на чат проекта
            pointer_current_chat = serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID].projects[parent_project_ID].mainProjectChat;

            // далее, если речь идет о чате для субпроекта, тогда добавляем вложенный объект чата для родительского проекта
            if (subProject_ID) {
                //при необходимости сначала создаем чат при его отсутствии
                serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID].projects[parent_project_ID].subProjectsChats[subProject_ID] ??= NEW__dataModels.create_Chat_or_subChat(
                    parent_owner_Email,
                    parent_corpAccount_ID,
                    parent_project_ID,
                    subProject_ID
                );

                // переназначаем значение переменной на ссылку на чат субПроекта
                pointer_current_chat = serverVarriorsDataFromBD_pr0001.chat_DB[parent_owner_Email].corpAccounts[parent_corpAccount_ID].projects[parent_project_ID].subProjectsChats[subProject_ID];
            }

            return pointer_current_chat;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в create_Chat_or_subChat");
            console.log(error);

            return null;
        }
    },

    //----------------------------------

    getOnlineTimeCurrentUser(user_Email) {
        try {
            let pointer_currentUserInReestr = functions___pr0001.get_pointer_currentUserInReestr(user_Email);

            let onlineTime = null;
            // если юзером не установлено скрытие своего онлайн статуса
            if (!pointer_currentUserInReestr.onlineStatus.needHidestatus) {
                onlineTime = pointer_currentUserInReestr.onlineStatus.lastOnlineTime;
            }
            return onlineTime;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в getOnlineTimeCurrentUser");
            console.log(error);
            return null;
        }
    },

    //----------------------------------

    get_own_projectsListVectors_and_subProjectsListVectors(owner_Email) {
        // эта функция возвращает отдельно массив всех собственных проектов и массив всех собственных субПроектов
        try {

            const projectsList_Arr = [];  // сюда добавляем указатели на проекты 
            const subProjectsList_Arr = [];   // сюда добавляем указатели на субПроекты

            let pointer_currentOwner_in_projectsDB = functions___pr0001.get_pointer_currentUser_in_projectsDB(owner_Email);

            if (!owner_Email || !pointer_currentOwner_in_projectsDB) {
                throw Error("Не указан owner_Email или не найден целевой pointer_currentOwner_in_projectsDB")
            }

            Object.values(pointer_currentOwner_in_projectsDB.corpAccounts.ownCorpAccounts).forEach(current_own_CorpAcc => {

                Object.values(current_own_CorpAcc.projects).forEach(current_own_roject => {

                    projectsList_Arr.push(current_own_roject);

                    Object.values(current_own_roject.subProjects).forEach(current_own_supProject => {
                        subProjectsList_Arr.push(current_own_supProject);
                    })

                })
            })

            return {
                projectsList_Arr,
                subProjectsList_Arr
            };

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в get_ownProkectsList_and_ownSubProjectsList:");
            console.log(error);
        }
    },


    //----------------------------------








}






