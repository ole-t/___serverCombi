
// import console from 'console';
// import { text } from 'express';
import fs from 'fs';
import e, { json } from 'express';
import path from 'path';

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import nodemailer from 'nodemailer';
import zlib from 'zlib'; // для сжатия данных
import m_ApiErrors from './m_ApiErrors.js';
import config_pr0001 from './config_pr0001.js';
import { SingleProject, Single_subProject, User_ResponseStack, FOLDERS_FILES_MODELS } from "./dataModels.js";
import { User_inReestr, User_AccessProjects, SubProjectEvents_inUserReestr } from "./usersReestrModels.js";
import { Chat, MessageInChat } from "./chatStructure.js";
import global_Functions_and_Servises_forAll_Projects from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import { first_LoadData_pr0001 } from './saveAndLoadDataServise_pr0001.js'

let need_SaveData = false;
let access_SaveData = true;

let need_SaveChat = false;
let access_SaveChat = true;

let access_SaveFalesToMongoDB = true;
let timePreviousSave_FalesToMongoDB = 0;

// переменные сервера помещаем в объект, чтобы можно ссылаться на них в качестве указателя
export const serverVarriorsDataFromBD_pr0001 = {
    projects_DB: [],
    users_Reestr: [],
    chat_DB: [],
    listForResponse: [],
}

let mySecretKey_forAccessToken = "thisIsMySecretKey_ForAccessToken";
let mySecretKey_forRefreshToken = "thisIsMySecretKey_ForRefreshToken";

// Загружаем базы данных в проект
await first_LoadData_pr0001();

//===============================
class postService_pr0001 {

    async m_getStartPage_PS(req) {
        try {
            let full_data_from_server = {
                projects_DB: serverVarriorsDataFromBD_pr0001.projects_DB,
                users_Reestr: serverVarriorsDataFromBD_pr0001.users_Reestr,
                chat_DB: serverVarriorsDataFromBD_pr0001.chat_DB
            }
            return full_data_from_server;
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_getStartPage_PS: " + error);
        }
    }
    //----------------------------------
    async m_get_full_data_from_server_PS(req) {
        try {
            let full_data_from_server = {
                projects_DB: serverVarriorsDataFromBD_pr0001.projects_DB,
                users_Reestr: serverVarriorsDataFromBD_pr0001.users_Reestr,
                chat_DB: serverVarriorsDataFromBD_pr0001.chat_DB
            }
            return full_data_from_server;
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_get_full_data_from_server: " + error);
        }
    }
    //----------------------------------
    async m_getAllDB_PS(req) {
        try {
            let filterResFtomServ = dataPreparationForCurrentClient_firstIncome(req.body.postDataToServer.userLoginEmail);
            return filterResFtomServ;
        }
        catch (error) {
            return ("Ошибка из postService_pr0001: " + error);
        }
    }
    //----------------------------------
    async m_getTopData_ByClient_PS(req) {
        // console.log("+++++ ЗАПУСК m_getTopData_ByClient_PS");
        try {
            let dataFromServer = {
                resEndPoint: "getTpData_ByClient",

                dataBD_fromServer_FILTER_FOR_CURRENT_CLIENT: dataPreparation_ForCurrentClient_TopData(req.headers.decodeAT_____user_Email),
                // необходимо обработать на клиенте - а именно: сделать ЭКЗЕМПЛЯР, а не ссылку на объект !!!
                ShablonFromServer___SubProjectEvents_inUserReestr: new SubProjectEvents_inUserReestr(null),
                // необходимо на клиенте сделать ЭКЗЕМПЛЯР, а не ссылку на объект !!!
                ShablonFromServer___Chat: new Chat(null, null),
            }
            return dataFromServer;
        }
        catch (error) {
            console.log("Ошибка из postService_pr0001 --- m_getTopData_ByClient_PS: " + error);
            return ("Ошибка из postService_pr0001 --- m_getTopData_ByClient_PS: " + error);
        }
    }
    //----------------------------------
    async m_getFullData_CurrentProject_PS(req) {
        try {
            let user_Email = (req.body.postDataToServer.user_Email);
            let findIndex = findProjectIndex_inBD(req.body.postDataToServer.activeBisProject_ID);
            if (findIndex < 0) {
                //  console.log("ПРОЕКТ НЕ НАЙДЕН В БАЗЕ ДАННЫХ");
                return null;
            }

            if ((serverVarriorsDataFromBD_pr0001.projects_DB[findIndex].teamList.findIndex(item => item.user_Email == user_Email)) < 0) {
                //  console.log("ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН СРЕДИ УЧАСТНИКОВ ПРОЕКТА");
                return null;
            }

            let fullDataCurrentProject = serverVarriorsDataFromBD_pr0001.projects_DB[findIndex];
            //  console.log("fullDataCurrentProject");
            //  console.log(fullDataCurrentProject);
            return fullDataCurrentProject;
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_getFullData_CurrentProject_PS: " + error);
        }
    }
    //----------------------------------
    // Не используем, вместо этого используем порционную загрузку сообщений "get_lastMessages_currentChat"
    async m_get_chatList_CurrentProject_PS(req) {
        try {
            let findIndex = find_chatIndex_in_chatBD(
                req.body.postDataToServer.project_OR_subProject___id,
                req.body.postDataToServer.parent_Project_ID,
                req.body.postDataToServer.knownIndexInReestr,
            );

            if (findIndex < 0) {
                return [];
            }

            else {
                return serverVarriorsDataFromBD_pr0001.chat_DB[findIndex];
            }
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_get_chatList_CurrentProject_PS: " + error);
        }
    }

    //----------------------------------
    async m_get_lastMessages_currentChat_PS(req, res) {
        try {
            let findIndex = find_chatIndex_in_chatBD(
                req.body.postDataToServer.project_OR_subProject___id,
                req.body.postDataToServer.knownIndexInReestr,
            );
            let returnData = {
                project_ID: req.body.postDataToServer.project_OR_subProject___id,
                messages: []
            }

            if (findIndex != null && findIndex >= 0) {
                // если длинна списка больше, чем указанное количество нужных записей - берем из массива нужное количество последних записей
                if (serverVarriorsDataFromBD_pr0001.chat_DB[findIndex].messages.length > req.body.postDataToServer.quantityLastMessages) {
                    let needsMessages = serverVarriorsDataFromBD_pr0001.chat_DB[findIndex].messages.slice(-req.body.postDataToServer.quantityLastMessages); // знак отрицания "-" означает извлечение данных с конца массива 
                    returnData.messages = needsMessages;
                }
                // иначе, если длинна списка меньше, чем количество нужных записей - забераем все записи
                else {
                    returnData.messages = serverVarriorsDataFromBD_pr0001.chat_DB[findIndex].messages;
                }
            }
            // console.log("returnData= ");
            // console.log(returnData);
            return returnData;
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_get_lastMessages_currentChat_PS: " + error);
        }
    }
    //----------------------------------
    async m_get_PreviousItems_chatList_CurrentProject_PS(req, res) {
        try {
            console.log("ЗАПУСКАЕМ ПОДГРУЗКУ СООБЩЕНИЙ, m_get_PreviousItems_chatList_CurrentProject_PS... ");
            let findIndex = find_chatIndex_in_chatBD(
                req.body.postDataToServer.project_OR_subProject___id,
                req.body.postDataToServer.knownIndexInReestr,
            );

            let returnData = {
                project_OR_subProject___id: req.body.postDataToServer.project_OR_subProject___id,
                parent_Project_ID: req.body.postDataToServer.parent_Project_ID,
                messages: []
            }

            if (findIndex != null && findIndex >= 0) {
                // вычисляем, сколько предыдущих сообщений осталось, которые предшествуют указанному TOP-индексу
                let currentPreviousIndex = req.body.postDataToServer.currentPreviousIndex; // количество оставшихся предыдущих сообщений, Оно также эквивалентно текущему индексу первого из загруженных ранее клиенту сообщений
                let needsQuantityPreviousMessages = req.body.postDataToServer.
                    needsQuantityPreviousMessages; // необходимое количество сообщений для подгрузки
                let beginIndex = currentPreviousIndex - needsQuantityPreviousMessages; // начальный индекс подгрузки

                // console.log("currentPreviousIndex= " + currentPreviousIndex);
                //  console.log("needsQuantityPreviousMessages= " + needsQuantityPreviousMessages);

                // если  начальный индекс подгрузки >=0 - берем из массива нужное количество предыдущих записей
                if (beginIndex != null && beginIndex >= 0) {
                    // console.log("Отбираем нужное количество записей, beginIndex= " + beginIndex);
                    let filterNeedsMessages = serverVarriorsDataFromBD_pr0001.chat_DB[findIndex].messages.slice(beginIndex, currentPreviousIndex);
                    returnData.messages = filterNeedsMessages;
                }
                // иначе, если количество  оставшихся предыдущих сообщений меньше (или равно), чем количество нужных записей - забираем все оставшиеся записи, т.е. если  начальный индекс подгрузки < 0
                else {
                    // console.log("Забираем все оставшиеся записи... ");
                    returnData.messages = serverVarriorsDataFromBD_pr0001.chat_DB[findIndex].messages.slice(0, currentPreviousIndex);
                }
            }
            console.log("returnData= ");
            console.log(returnData);
            return returnData;

        }
        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_get_PreviousItems_chatList_CurrentProject_PS: " + error);
        }
    }

    //----------------------------------
    async m_addNewProject_PS(req, res) {
        console.log("Запуск m_addNewProject_PS:");
        console.log("req.body= ");
        console.log(req.body);

        let newAddProject = null;
        try {
            // извлекаем данные из поста для нового проекта
            newAddProject = new SingleProject(
                req.body.postDataToServer.project_ID,
                req.body.postDataToServer.user_Email,
                req.body.postDataToServer.projectSettings,
                req.body.postDataToServer.parentCorpAccount.corpAccount_ID,
                req.body.postDataToServer.parentCorpAccount.corpAccount_Name,
                Date.now(),
                serverVarriorsDataFromBD_pr0001.projects_DB.length, // не вычитаем единицу из length, т.к. это длинна списка до добавления нового проекта
            );
            // Добавляем в массив БД
            serverVarriorsDataFromBD_pr0001.projects_DB.push(newAddProject);
            //  console.log("Успешно добавлено в массив БД");
        }

        catch (error) {
            console.log("Ошибка m_addNewProject_PS - ошибка добавления в serverVarriorsDataFromBD_pr0001.projects_DB:");
            console.log(error);
            return error;
        }

        // добавляем проект в реестр пользователей
        try {
            add_AccessProjectsForUser_inReestr(req.body.postDataToServer.user_Email, req.body.postDataToServer.project_ID, "role_Admin", req.body.postDataToServer.user_Email);
        } catch (error) {
            console.log("Ошибка m_addNewProject_PS - ошибка добавления в реестр:");
            console.log(error);
            return error;
        }

        // добавляем в массив чатов serverVarriorsDataFromBD_pr0001.chat_DB
        /* 
        try {
            add_chat_in_chatBD(
                req.body.postDataToServer.project_OR_subProject___id,
                req.body.postDataToServer.parent_Project_ID,
                req.body.postDataToServer.knownIndexInReestr,
            );
        } catch (error) {
            //  console.log("Ошибка m_addNewProject_PS - ошибка добавления нового чата в БД чатов:");
            //  console.log(error);
            return error;
        }
         */

        // перед отправкой клиенту - пристегиваем "time_individual_wasReadEvents", устанавливаем нулевые значения (структуру "time_individual_wasReadEvents" извлекаем из конструктора в реестре пользователей)
        newAddProject.time_individual_wasReadEvents = (new User_AccessProjects).time_individual_wasReadEvents;

        saveAllDataHandle();

        // возвращаем ответ клиенту
        let dataFromServer = {
            resEndPoint: "was_added_new_Project",
            newAddProject: newAddProject,
        }

        console.log("=== dataFromServer: ");
        console.log(dataFromServer);

        return dataFromServer;
    }
    //----------------------------------
    async m_newMessageChatProject_PS(req, res) {

        try {
            console.log("Запуск m_newMessageChatProject_PS, req.body= ");
            console.log(req.body);

            let index__in_chat_DB = find___Or_Find_And_Add_NewChat_in_chatBD(
                req.body.postDataToServer.project_ID,
                req.body.postDataToServer.knownIndexInReestr,
            );
            console.log("index__in_chat_DB= " + index__in_chat_DB);
            //  console.log("Тест сообщения: " + req.body.postDataToServer.textMessage);
            let newMessage = new MessageInChat(
                req.body.postDataToServer.project_ID,
                req.body.postDataToServer.autor,
                req.body.postDataToServer.textMessage,
                Date.now(),
                serverVarriorsDataFromBD_pr0001.chat_DB[index__in_chat_DB].messages.length, //это knownIndexInReestr - от length не отнимаем единицу, поскольку это состояние длинны массива до добавления нового сообщения
                req.body.postDataToServer.message_ID,
            );

            console.log("newMessage= ");
            console.log(newMessage);

            try {
                // добавляем сообщение в БД чатов
                serverVarriorsDataFromBD_pr0001.chat_DB[index__in_chat_DB].messages.push(newMessage);
                need_SaveChat = true;
                need_SaveData = true;
                saveAllDataHandle();
            }
            catch (error) {
                console.log("Ошибка m_newMessageChatProject_PS --- push(new MessageInChat ");
                console.log(error);
            }

            // console.log("После добавления сообщения - Список сообщений= ");
            // console.log(serverVarriorsDataFromBD_pr0001.chat_DB[index__in_serverVarriorsDataFromBD_pr0001.chat_DB].messages);


            // обновляем дату обновления чата в связанном БД проекте
            let find_indexProject_in_BD = findProjectIndex_inBD(req.body.postDataToServer.project_ID);
            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].time_Update_including_Objects.time_Update_chat = newMessage.timeOfCreate

            // оповещаем всех подписанных пользователей
            try {
                console.log("Попытка вызова responseLongPoolling:");
                // создаем данные для ответа  responseLongPoolling
                const responseLongPoolling_Data = {
                    resEndPoint: "newMessageChatProject",
                    project_ID: req.body.postDataToServer.project_ID,
                    newMessage
                }
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                responseLongPoolling(responseLongPoolling_Data);
            } catch (error) {
                console.log("Ошибка Попытка вызова responseLongPoolling");
                console.log(error);
            }

            let dataFromServer = {
                resEndPoint: "was_added_newMessageChatProject",
                project_ID: req.body.postDataToServer.project_ID,
            }


            return dataFromServer; // ретерним только для корректного закрытия пост-запроса на стороне браузера. Ответ клиенту в чат идет отдельно через LongPulling
        }
        catch (error) {
            return ("Ошибка из postService_pr0001: ");
            return (error);
        }
    }
    //----------------------------------
    async m_add_new_sub_Project_PS(req, res) {

        try {
            console.log("ЗАПУСК m_add_new_sub_Project_PS, req.body= ");
            // console.log(req.body);

            // Добавляем субпроект к родительському проекту в БД
            let findIndex = findProjectIndex_inBD(req.body.postDataToServer.parent_Project_ID);
            // console.log("findIndex= " + findIndex);

            let currentTime = Date.now();
            let new_sub_Project = new Single_subProject(
                req.body.postDataToServer.parent_Project_ID,
                req.body.postDataToServer.subProject_ID,
                req.body.postDataToServer.subProjectSettings,
                currentTime,
            )
            serverVarriorsDataFromBD_pr0001.projects_DB[findIndex].subProjects.push(new_sub_Project);

            need_SaveData = true;
            saveAllDataHandle();

            // обновляем время текущих изменений в родительском проекте
            serverVarriorsDataFromBD_pr0001.projects_DB[findIndex].time_Update_including_Objects.time_added_new_subProgects = currentTime;

            // в реестр пользователей для каждого члена родительского проекта команды добавляем индивидуальное время просмотра событий для нового субпроекта. 
            let acsessTeamUsers = serverVarriorsDataFromBD_pr0001.projects_DB[findIndex].teamList;
            acsessTeamUsers.forEach(
                (item) => {
                    console.log("forEach - item.user_Email=" + item.user_Email);
                    // след фун возвращает, а при необходимости - ТАКЖЕ СОЗДАЕТ нужный объект
                    get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID(
                        item.user_Email,
                        req.body.postDataToServer.parent_Project_ID,
                        req.body.postDataToServer.subProject_ID
                    );
                }
            )

            // добавляем новый чат в БД чатов
            serverVarriorsDataFromBD_pr0001.chat_DB.push(new Chat(
                req.body.postDataToServer.subProject_ID,
                serverVarriorsDataFromBD_pr0001.chat_DB.length, // это knownIndexInReestr // не вычитаем единицу из length, т.к. это длинна массива до добавления нового проекта
            ));

            // делаем рассылку пользователям
            // сначала дублируем данные из поста от юзера
            let dataFromServer = req.body.postDataToServer;

            // удаляем из ответа сервера свойство subProjectSettings, поскольку эту информацию мы передаем далее уже в виде копии нового суб-проекта
            delete dataFromServer["subProjectSettings"];
            // добавляем к данным resEndPoint
            dataFromServer.resEndPoint = "was_added_new_sub_Project";
            // добавляем к данным копию нового субпроекта из базы данных
            dataFromServer.new_sub_Project = new_sub_Project;
            // добавляем к респонсу ШАБЛОН объекта просмотра событий
            dataFromServer.shablon_SubProjectEvents_inUserReestr = new SubProjectEvents_inUserReestr(req.body.postDataToServer.subProject_ID);

            // оповещаем всех подписанных пользователей
            try {
                responseLongPoolling(dataFromServer);
            }
            catch (error) {
                console.log("Ошибка из postService_pr0001 --- responseLongPoolling: ");
                console.log(error);
            }

            return dataFromServer; // возвращаем ответ
        }

        catch (error) {
            console.log("Ошибка из postService_pr0001 --- m_add_new_sub_Project_PS: " + error);
            return ("Ошибка из postService_pr0001 --- m_add_new_sub_Project_PS: " + error);
        }
    }
    //----------------------------------

    async m_newMessageChat_sub_Project_PS(req, res) {
        console.log("ЗАПУСК m_newMessageChat_sub_Project_PS:");
        console.log("postDataToServer= ");
        console.log(req.body.postDataToServer);

        try {
            let index__in_chat_DB = find___Or_Find_And_Add_NewChat_in_chatBD(req.body.postDataToServer.subProject_ID);
            let currentTime = Date.now();
            let newMessage = new MessageInChat(
                req.body.postDataToServer.subProject_ID,
                req.body.postDataToServer.autor,
                req.body.postDataToServer.textMessage,
                currentTime,
                serverVarriorsDataFromBD_pr0001.chat_DB[index__in_chat_DB].messages.length, //это knownIndexInReestr - от length не отнимаем единицу, поскольку это состояние длинны массива до добавления нового сообщения
                req.body.postDataToServer.message_ID,
            );

            try {
                // добавляем сообщение в БД чатов
                serverVarriorsDataFromBD_pr0001.chat_DB[index__in_serverVarriorsDataFromBD_pr0001.chat_DB].messages.push(newMessage);
                need_SaveChat = true;
                need_SaveData = true;
            }
            catch (error) {
                console.log("Ошибка m_newMessageChatProject_PS --- push(new MessageInChat " + error);
            }

            // обновляем дату обновления чата в связанном БД проекте
            let find_indexProject_in_BD = findProjectIndex_inBD(req.body.postDataToServer.project_ID);
            let find_index_subProject_in_BD = find_subProject_Index_inBD(req.body.postDataToServer.project_ID, req.body.postDataToServer.subProject_ID);

            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].subProjects[find_index_subProject_in_BD].time_Update_including_Objects_SUBPROJECT.time_Update_chat = newMessage.timeOfCreate;

            // для отправителя данного сообщения - обновляем время просмотра чата
            let mObject__get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID = get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID(
                req.body.postDataToServer.autor,
                req.body.postDataToServer.project_ID,
                req.body.postDataToServer.subProject_ID
            );
            mObject__get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID.time_wasRead_subChat = currentTime;

            // оповещаем всех подписанных пользователей
            try {
                const responseLongPoolling_Data = {
                    resEndPoint: "newMessageChat_sub_Project",
                    project_ID: req.body.postDataToServer.project_ID,
                    subProject_ID: req.body.postDataToServer.subProject_ID,
                    newMessage,
                }
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                console.log("ОТПРАВЛЯЕМ РАССЫЛКУ, responseLongPoolling_Data=");
                console.log(responseLongPoolling_Data);

                responseLongPoolling(responseLongPoolling_Data);
            } catch (error) {
                //  console.log(error);
            }

            // след респонс для закрытия запроса на прямой реквест
            let dataFromServer = {
                resEndPoint: "newMessageChat_sub_Project",
                project_ID: req.body.postDataToServer.project_ID,
            }
            return dataFromServer; // ретерним только для корректного закрытия пост-запроса на стороне браузера. Ответ клиенту в чат идет отдельно через LongPulling
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 - m_newMessageChat_sub_Project_PS: " + error);
        }

    }

    //----------------------------------

    async m_dell_One_Project_PS(req, res) {
        try {
            // console.log('ЗАПУСК m_dell_One_Project_PS, body=');
            // console.log(req.body);

            let resultDelete = delete_oneProjectFromBD(
                req.body.postDataToServer.project_ID,
                // knownIndexInReestr
            );

            if (resultDelete == "result_OK") {
                let dataFromServer = {
                    resEndPoint: "wasDeleted_one_Project",
                    project_ID: req.body.postDataToServer.project_ID,
                }
                // сначала делаем ответ на пост
                res.status(200).json(dataFromServer);


                // оповещаем всех подписанных пользователей
                try {
                    responseLongPoolling(dataFromServer);
                }
                catch (error) {
                    console.log("Ошибка из postService_pr0001 --- m_dell_One_Project_PS: " + error);
                }
            }

            /* 
            const dell_index = findProjectIndex_inBD(req.body.postDataToServer.project_ID);
            if (dell_index != null && dell_index >= 0) {
                // удаляем из реестра пользователей
                delete_UsersInReestr_forCurrentProject(req.body.postDataToServer.project_ID, serverVarriorsDataFromBD_pr0001.projects_DB[dell_index].teamList);

                need_SaveData = true;

                // удаляем проект из БД
                // serverVarriorsDataFromBD_pr0001.projects_DB.splice(dell_index, 1);
                // помечаем проект как временно удаленный
                serverVarriorsDataFromBD_pr0001.projects_DB[dell_index].isDeletedTemp = true;
                need_SaveData = true;

                // удалить - заменить способ сохранения данных
                mSaveUserReestr_inBD(serverVarriorsDataFromBD_pr0001.users_Reestr);

                let dataFromServer = {
                    resEndPoint: "wasDeleted_one_Project",
                    project_ID: req.body.postDataToServer.project_ID,
                }
                // сначала делаем ответ на пост
                res.status(200).json(dataFromServer);

                // оповещаем всех подписанных пользователей
                try {
                    responseLongPoolling(dataFromServer);
                }
                catch (error) {
                    console.log("Ошибка из postService_pr0001 --- m_dell_One_Project_PS: " + error);
                }
            }
            */

            else {
                console.log("Ошибка удаления проекта - проект не найден");
                res.status(200).json("Ошибка удаления проекта - проект не найден");
            }
        }

        catch (error) {
            console.log("Ошибка из postService_pr0001 --- m_dell_One_Project_PS: " + error);
            res.status(200).json("Ошибка из postService_pr0001 --- m_dell_One_Project_PS: " + error);
        }
    }
    //----------------------------------

    async m_dell_One_sub_Project_PS(req, res) {
        try {
            console.log("Вызов ф. m_dellOne_sub_Project_PS, req.body= ");
            console.log(req.body);
            let dell_mainProj_Index = findProjectIndex_inBD(req.body.postDataToServer.main_Project_ID);
            let dell_subProj_Index = -1;
            if (dell_mainProj_Index != null && dell_mainProj_Index >= 0) {
                dell_subProj_Index = find_subProject_Index_inBD(req.body.postDataToServer.main_Project_ID, req.body.postDataToServer.subProject_ID);
            }

            if (((dell_mainProj_Index != null && dell_mainProj_Index >= 0) && (dell_subProj_Index != null && dell_subProj_Index >= 0))) {
                // удаляем суб-проект
                serverVarriorsDataFromBD_pr0001.projects_DB[dell_mainProj_Index].subProjects.splice(dell_subProj_Index, 1);
                need_SaveData = true;
                // заготовка респонса
                let dataFromServer = {
                    resEndPoint: "wasDeleted_one_subProject",
                    project_ID: req.body.postDataToServer.main_Project_ID,
                    subProject_ID: req.body.postDataToServer.subProject_ID,
                }
                // сначала делаем ответ на пост
                res.status(200).json(dataFromServer);

                // оповещаем всех подписанных пользователей
                try {
                    responseLongPoolling(dataFromServer);
                }
                catch (error) {
                    console.log("Ошибка из postService_pr0001 --- m_dell_One_sub_Project_PS: " + error);
                    res.status(500).json("Ошибка удаления суб проекта --- responseLongPoolling");
                }
            }

            else {
                console.log("Ошибка удаления суб проекта - - не найден проект либо субпроект");
                res.status(500).json("Ошибка удаления суб проекта - не найден проект либо субпроект");
            }

            // return res.status(200).json(dataFromServer);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_dell_One_sub_Project_PS: " + error);
        }
    }
    //----------------------------------
    async m_updateTeamForProject_PS(req) {
        try {
            console.log(" ЗАПУСК m_updateTeamForProject_PS: ");
            // извлекаем данные из reuest запроса
            const proj_ID_inRequest = req.body.postDataToServer.project_ID;
            const deleteListForTeam = req.body.postDataToServer.teamDataUpdate.deleteListForTeam;
            const newTeamForProject = req.body.postDataToServer.teamDataUpdate.newTeamForProject;
            const defaultAdminForThisProject = req.body.postDataToServer.defaultAdminForThisProject;
            console.log("defaultAdminForThisProject = " + req.body.postDataToServer.defaultAdminForThisProject);

            // обновляем в БД
            // определяем индекс верхнего проджекта в БД по ID и обновляем 
            let projectIndexInBD = serverVarriorsDataFromBD_pr0001.projects_DB.findIndex(item => item.project_ID === proj_ID_inRequest);
            serverVarriorsDataFromBD_pr0001.projects_DB[projectIndexInBD].teamList = newTeamForProject;
            need_SaveData = true;

            // обновляем в Рестре пользователей
            // удаляем исключенных юзеров из проекта
            delete_UsersInReestr_forCurrentProject(proj_ID_inRequest, deleteListForTeam);
            // обновляем активных юзеров в проекте
            add_or_update___UsersInReestr_forCurrentProject(proj_ID_inRequest, newTeamForProject, defaultAdminForThisProject);

            // сохраняем данные в БД реестра
            need_SaveData = true;

            let dataFromServer = {
                resEndPoint: "wasUpdateTeamForProject",
                project_ID: proj_ID_inRequest,
                newTeamList: newTeamForProject,
            }
            return dataFromServer;

        }
        catch (error) {
            return ("Ошибка из postService_pr0001 - m_updateTeamForProject_PS: " + error);
        }
    }
    //----------------------------------
    async m_update_ofResponsibleList_subProject_PS(req, res) {
        try {
            console.log(" ЗАПУСК m_update_ofResponsible_subProject_PS: ");

            let find_indexProject_in_BD = findProjectIndex_inBD(req.body.postDataToServer.project_ID);
            let find_index_subProject_in_BD = find_subProject_Index_inBD(req.body.postDataToServer.project_ID, req.body.postDataToServer.subProject_ID);

            // обновляем данные в БД
            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].subProjects[find_index_subProject_in_BD].teamList_ofResponsible_subProject = req.body.postDataToServer.teamList_ofResponsible_subProject;
            // обновляем время обновления данных в БД
            let currentTime = Date.now();
            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].subProjects[find_index_subProject_in_BD].time_Update_including_Objects_SUBPROJECT.time_Update_subProjectSettings = currentTime;

            // в реестре пользователей ТОЛЬКО ДЛЯ ОТПРАВИТЕЛЯ РЕСПОНСА обновляем время просмотра настроек субпроекта
            try {
                let object_WasReadEvents_forSubproject___BY_ID = get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID(
                    req.body.postDataToServer.user_Email,
                    req.body.postDataToServer.project_ID,
                    req.body.postDataToServer.subProject_ID);
                console.log("ОБЪЕКТ object_WasReadEvents_forSubproject___BY_ID = ");
                console.log(object_WasReadEvents_forSubproject___BY_ID);
                // обновляем время просмотра субчата в реестре 
                object_WasReadEvents_forSubproject___BY_ID.time_wasRead_subProjectSettings = currentTime;

                console.log("ОБЪЕКТ object_WasReadEvents_forSubproject___BY_ID = ");
                console.log(object_WasReadEvents_forSubproject___BY_ID);

            } catch (error) {
                console.log(error);
            }


            // оповещаем всех подписанных пользователей
            try {
                console.log("===оповещаем всех подписанных пользователей из m_update_ofResponsibleList_subProject_PS");
                const responseLongPoolling_Data = {
                    resEndPoint: "update_ofResponsibleList_subProject",
                    user_Email: req.body.postDataToServer.user_Email,
                    project_ID: req.body.postDataToServer.project_ID,
                    subProject_ID: req.body.postDataToServer.subProject_ID,
                    teamList_ofResponsible_subProject: req.body.postDataToServer.teamList_ofResponsible_subProject,
                }
                responseLongPoolling(responseLongPoolling_Data);

            } catch (error) {
                // console.log(error);
            }

            // след респонс для закрытия запроса на прямой реквест
            let dataFromServer = {
                resEndPoint: "update_ofResponsibleList_subProject",
                user_Email: req.body.postDataToServer.user_Email,
                project_ID: req.body.postDataToServer.project_ID,
                subProject_ID: req.body.postDataToServer.subProject_ID,
                teamList_ofResponsible_subProject: req.body.postDataToServer.teamList_ofResponsible_subProject,
            }
            // ретерним только для корректного закрытия пост-запроса на стороне браузера. Ответ клиенту в чат идет отдельно через LongPulling
            return dataFromServer;
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 - m_update_ofResponsibleList_subProject_PS: " + error);
        }
    }


    //----------------------------------
    async m_dellAllProjects_PS() {
        try {
            serverVarriorsDataFromBD_pr0001.projects_DB = [];
            // mSaveFileDB(serverVarriorsDataFromBD_pr0001.projects_DB);
            await saveLocalFile(config_pr0001.mFileName_projectsDB, serverVarriorsDataFromBD_pr0001.projects_DB);
            return (serverVarriorsDataFromBD_pr0001.projects_DB);
        } catch (error) {
            return ("Ошибка из postService_pr0001: " + error);
        }
    }

    //========================
    // Обработчики для foolTimeSubscriber
    // эта ф. добавляет нового подписчика в список рассылки, прокидывает в этот список колбек функцию
    // и затем ждет вызов прокинутой кол-бек функции, и возвращает ответ сервера
    async m_subscribeFullTime_PS(req, res) {
        console.log("-------------------------------------");
        console.log("вызвана ф. m_subscribeFullTime_PS");

        const userID_fromRequest = req.body.postDataToServer.user_Email;
        const reqID_fromRequest = req.body.postDataToServer.req_ID;

        //  console.log("req.body.postDataToServer.user_Email= " + req.body.postDataToServer.user_Email);
        //  console.log("req.body.postDataToServer.req_ID= " + req.body.postDataToServer.req_ID);

        // создаем КолБек функцию, в нее прокидываем также ID пользователя и ID запроса
        function mCallBack(additionalIncludeData) {
            //  console.log("вызвана ф. mCallBack");
            let responseFromServer_longPoolling = {
                user_Email: userID_fromRequest,
                req_ID: reqID_fromRequest,
                dataFromServer: additionalIncludeData,
            }
            //  console.log("responseFromServer_longPoolling=");
            //  console.log(responseFromServer_longPoolling);
            res.status(200).json(responseFromServer_longPoolling);
        }

        try {

            // добавляем нового подписчика в общий реестр и прокидываем туда КоллБек 
            let index = serverVarriorsDataFromBD_pr0001.listForResponse.findIndex(item => item.user_Email === userID_fromRequest);
            if (index != null && index >= 0) {
                serverVarriorsDataFromBD_pr0001.listForResponse[index].user_ResStack.push(mCallBack);
            }
            else {
                // создаем подписчика, вкладываем необх Колбек из реквеста и затем добавляем к общему списку
                let newSubscriter = new User_ResponseStack(userID_fromRequest);
                newSubscriter.user_ResStack.push(mCallBack);
                serverVarriorsDataFromBD_pr0001.listForResponse.push(newSubscriter);
            }
            //  console.log("serverVarriorsDataFromBD_pr0001.listForResponse=");
            //  console.log(serverVarriorsDataFromBD_pr0001.listForResponse);
        } catch (error) {
            //  console.log(error);
        }
    }
    //========================
    // Обработчики для уведомлений
    async m_timeUpdate_wasReadChat_PS(req, res) {
        //  console.log("-------------------------------------");
        //  console.log("вызвана ф. m_timeUpdate_wasReadChat_PS");
        let findUserIndex = findUser_Index_inReestr(req.body.postDataToServer.user_Email);

        if (findUserIndex != null && findUserIndex >= 0) {
            let findProjectIdex_InCurr_Us_Reestr = findProjectIndex_InCurrentUserReestr(findUserIndex, req.body.postDataToServer.project_ID);

            if (findProjectIdex_InCurr_Us_Reestr != null && findProjectIdex_InCurr_Us_Reestr >= 0) {
                serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].accessProjects[findProjectIdex_InCurr_Us_Reestr].time_individual_wasReadEvents.time_wasReadChat = req.body.postDataToServer.time_wasReadChat;

                need_SaveData = true;
            }
        }

        //  console.log("вызвана ф. mCallBack");
        let responseFromServer = {
            dataFromServer: "time_wasReadChat was changed",
        }
        res.status(200).json(responseFromServer);
    }
    //----------------------------------
    async m_timeUpdate_wasReadProjectSettings_PS(req, res) {
        //  console.log("-------------------------------------");
        // console.log("вызвана ф. m_timeUpdate_wasReadProjectSettings_PS");
        let findUserIndex = findUser_Index_inReestr(req.body.postDataToServer.user_Email);

        if (findUserIndex != null && findUserIndex >= 0) {
            let findProjectIdex_InCurr_Us_Reestr = findProjectIndex_InCurrentUserReestr(findUserIndex, req.body.postDataToServer.project_ID);

            if (findProjectIdex_InCurr_Us_Reestr != null && findProjectIdex_InCurr_Us_Reestr >= 0) {
                serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].accessProjects[findProjectIdex_InCurr_Us_Reestr].time_individual_wasReadEvents.time_wasReadProjectSettings = req.body.postDataToServer.time_wasReadProjectSettings;

                need_SaveData = true;
            }
        }

        //  console.log("вызвана ф. mCallBack");
        let responseFromServer = {
            dataFromServer: "time_wasReadProjectSettings was changed",
        }
        res.status(200).json(responseFromServer);
    }
    //----------------------------------

    async m_timeUpdate_wasRead_subChat_PS(req, res) {
        // console.log("=== ЗАПУСК m_timeUpdate_wasRead_subChat_PS");
        set_timeUpdate_wasRead_subChat(
            req.body.postDataToServer.user_Email,
            req.body.postDataToServer.project_ID,
            req.body.postDataToServer.subProject_ID,
            req.body.postDataToServer.time_wasReadSubChat,
        );

        need_SaveData = true;

        // делаем ответ клиенту для закрытия респонса
        let responseFromServer = {
            dataFromServer: "time_wasRead_subChat was changed",
        }
        res.status(200).json(responseFromServer);
    }
    //----------------------------------
    async m_timeUpdate_wasRead_subProject_settings_PS(req, res) {
        console.log("=== ЗАПУСК m_timeUpdate_wasRead_subProject_settings_PS");

        let object_WasReadEvents_forSubproject___BY_ID = get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID(
            req.body.postDataToServer.user_Email,
            req.body.postDataToServer.project_ID,
            req.body.postDataToServer.subProject_ID);

        console.log("ОБЪЕКТ object_WasReadEvents_forSubproject___BY_ID = ");
        console.log(object_WasReadEvents_forSubproject___BY_ID);

        // обновляем время просмотра subProject_settings в реестре 
        object_WasReadEvents_forSubproject___BY_ID.time_wasRead_subProjectSettings = req.body.postDataToServer.time_wasRead_subProjectSettings;

        need_SaveData = true;

        // делаем ответ клиенту для закрытия респонса
        let responseFromServer = {
            dataFromServer: "time_wasRead_subChat was changed",
        }
        res.status(200).json(responseFromServer);
    }
    //----------------------------------
    async m_set_subProject_settings_PS(req) {
        // console.log("ЗАПУСК m_set_subProject_settings_PS:");
        // console.log("req.body= ");
        // console.log(req);
        try {
            let find_indexProject_in_BD = findProjectIndex_inBD(req.body.postDataToServer.project_ID);
            // console.log("find_indexProject_in_BD= ");
            // console.log(find_indexProject_in_BD);
            let find_index_subProject_in_BD = find_subProject_Index_inBD(req.body.postDataToServer.project_ID, req.body.postDataToServer.subProject_ID);

            // обновляем данные в БД
            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].subProjects[find_index_subProject_in_BD].subProjectSettings = req.body.postDataToServer.subProjectSettings;
            // console.log("newSettings_forSubproject= ");
            // console.log(serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].subProjects[find_index_subProject_in_BD].subProjectSettings = req.body.postDataToServer.newSettings_forSubproject);

            // обновляем время обновления данных в БД
            let currentTime = Date.now();
            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].subProjects[find_index_subProject_in_BD].time_Update_including_Objects_SUBPROJECT.time_Update_subProjectSettings = currentTime;

            // в реестре пользователей ТОЛЬКО ДЛЯ ОТПРАВИТЕЛЯ РЕСПОНСА обновляем время просмотра настроек субпроекта
            try {
                let object_WasReadEvents_forSubproject___BY_ID = get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID(
                    req.body.postDataToServer.user_Email,
                    req.body.postDataToServer.project_ID,
                    req.body.postDataToServer.subProject_ID);
                console.log("ОБЪЕКТ object_WasReadEvents_forSubproject___BY_ID = ");
                console.log(object_WasReadEvents_forSubproject___BY_ID);
                // обновляем время просмотра субчата в реестре 
                object_WasReadEvents_forSubproject___BY_ID.time_wasRead_subProjectSettings = currentTime;

                console.log("ОБЪЕКТ object_WasReadEvents_forSubproject___BY_ID = ");
                console.log(object_WasReadEvents_forSubproject___BY_ID);

            } catch (error) {
                console.log(error);
            }


            // оповещаем всех подписанных пользователей
            try {
                console.log("===оповещаем всех подписанных пользователей");
                const responseLongPoolling_Data = {
                    resEndPoint: "set_subProject_settings",
                    user_Email: req.body.postDataToServer.user_Email,
                    project_ID: req.body.postDataToServer.project_ID,
                    subProject_ID: req.body.postDataToServer.subProject_ID,
                    subProjectSettings: req.body.postDataToServer.subProjectSettings,
                }
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                // console.log("=== ЗАПУСКАЕМ responseLongPoolling");

                responseLongPoolling(responseLongPoolling_Data);

            } catch (error) {
                // console.log(error);
            }

            // след респонс для закрытия запроса на прямой реквест
            let dataFromServer = {
                resEndPoint: "set_subProject_settings",
            }
            return dataFromServer; // ретерним только для корректного закрытия пост-запроса на стороне браузера. Ответ клиенту в чат идет отдельно через LongPulling
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 - set_subProject_settings: " + error);
        }

    }

    //----------------------------------

    async m_addUser_toContactList_PS(req, res) {
        console.log("ЗАПУСК m_addUser_toContactList_PS:");
        try {
            let findUserIndex = findUser_Index_inReestr(req.body.postDataToServer.admin_ID);
            if (findUserIndex != null && findUserIndex >= 0) {
                serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].contactList.push({
                    user_Email: req.body.postDataToServer.addUser_eMail,
                    user_Group: req.body.postDataToServer.user_Group,
                    comments: req.body.postDataToServer.comments,
                });
                need_SaveData = true;
            }
            let dataFromServer = "mSuccerful from m_addUser_toContactList_PS";
            return dataFromServer;
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 - m_addUser_toContactList_PS: " + error);
        }

    }

    //----------------------------------

    // По факту не используется, функционал перенесен в фун. m_set_newContactList_PS
    async m_deleteUsers_fromContactList_PS(req, res) {
        console.log("ЗАПУСК m_deleteUsers_fromContactList_PS:");
        try {
            let deleteList = req.body.postDataToServer.deleteList;
            console.log("deleteList= ");
            console.log(deleteList);
            // находим Админа в реестре юзеров
            let findUserIndex = findUser_Index_inReestr(req.body.postDataToServer.admin_ID);
            console.log("findUserIndex= " + findUserIndex);
            if (findUserIndex >= 0) {
                if (deleteList && deleteList.length > 0) {
                    // получаем список СОБСТВЕННЫХ проектов для данного Админа
                    let projectsListAdmin = serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].accessProjects.filter(item => item.defaultAdminForThisProject === req.body.postDataToServer.user_Email);

                    // console.log("projectsListAdmin= ");
                    // console.log(projectsListAdmin);

                    // 1. Для удаляемых юзеров - в их списках доступных проектов удаляем проекты, из которых они исключены
                    deleteList.forEach((item_dellUser) => {
                        // находим каждого юзера в реестре]
                        let findIndexDeleteUser = findUser_Index_inReestr(item_dellUser.user_Email);
                        if (findIndexDeleteUser != null && findIndexDeleteUser >= 0) {
                            projectsListAdmin.forEach(item_AdminList => {
                                // удаляем из доступных юзеру проектов указанный проект
                                serverVarriorsDataFromBD_pr0001.users_Reestr[findIndexDeleteUser].accessProjects = serverVarriorsDataFromBD_pr0001.users_Reestr[findIndexDeleteUser].accessProjects.filter(item => {
                                    // console.log("item.project_ID=" + item.project_ID + ", item_AdminList.project_ID=" + item_AdminList.project_ID + "  Ретерним=" + (item.project_ID != item_AdminList.project_ID));
                                    if (item.project_ID != item_AdminList.project_ID) {
                                        return true;
                                    }
                                })
                            })
                        }
                    })

                    // 2. удаляем юзеров из списка teamList из каждого проекта Админа
                    projectsListAdmin.forEach(item_AdminList => {
                        let findProjectIndex = findProjectIndex_inBD(item_AdminList.project_ID);
                        if (findProjectIndex != null && findProjectIndex >= 0) {
                            // для каждой записи из deleteList - методом filter удаляем из каждого проекта
                            deleteList.forEach((item_dellList) => {
                                serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].teamList = serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].teamList.filter(item_teamList => {
                                    // console.log("item_teamList.user_Email=" + item_teamList.user_Email + ", item_dellList.user_Email=" + item_dellList.user_Email + "  Ретерним=" + (item_teamList.user_Email != item_dellList.user_Email))
                                    if (item_teamList.user_Email != item_dellList.user_Email) {
                                        return true;
                                    }
                                })
                            })
                        }
                    })

                    // 3. Далее удаляем каждого юзера из контакт-листа Админа
                    deleteList.forEach((item_dellList) => {
                        serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].contactList = serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].contactList.filter(item_contactList => item_contactList.user_Email != item_dellList.user_Email)
                    })

                    need_SaveData = true;
                }

                let dataFromServer = {
                    newContactListFromServer: serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].contactList,
                }
                console.log("dataFromServer= ");
                console.log(dataFromServer);
                return dataFromServer;
            }
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 - m_deleteUsers_fromContactList_PS: " + error);
        }
    }

    //----------------------------------

    async m_set_newContactList_PS(req, res) {
        console.log("ЗАПУСК m_set_newContactList_PS");

        try {
            let deleteList = req.body.postDataToServer.deleteList;

            // находим Админа в реестре юзеров
            let findUserIndex = findUser_Index_inReestr(req.body.postDataToServer.admin_ID);

            if (findUserIndex != null && findUserIndex >= 0) {
                if (deleteList && deleteList.length > 0) {
                    // получаем список СОБСТВЕННЫХ проектов для данного Админа
                    let projectsListAdmin = serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].accessProjects.filter(item => item.defaultAdminForThisProject === req.body.postDataToServer.admin_ID)

                    // 1. Для удаляемых юзеров - в их списках доступных проектов удаляем проекты, из которых они исключены
                    deleteList.forEach((item_dellUser) => {
                        // находим каждого юзера в реестре]
                        let findIndexDeleteUser = findUser_Index_inReestr(item_dellUser.user_Email);
                        if (findIndexDeleteUser != null && findIndexDeleteUser >= 0) {
                            projectsListAdmin.forEach(item_AdminList => {
                                // удаляем из доступных юзеру проектов указанный проект
                                serverVarriorsDataFromBD_pr0001.users_Reestr[findIndexDeleteUser].accessProjects = serverVarriorsDataFromBD_pr0001.users_Reestr[findIndexDeleteUser].accessProjects.filter(item => {
                                    // console.log("item.project_ID=" + item.project_ID + ", item_AdminList.project_ID=" + item_AdminList.project_ID + "  Ретерним=" + (item.project_ID != item_AdminList.project_ID));
                                    if (item.project_ID != item_AdminList.project_ID) {
                                        return true;
                                    }
                                })
                            })
                        }
                    })

                    // 2. удаляем юзеров из списка teamList из каждого проекта Админа
                    projectsListAdmin.forEach(item_AdminList => {
                        let findProjectIndex = findProjectIndex_inBD(item_AdminList.project_ID);
                        if (findProjectIndex != null && findProjectIndex >= 0) {
                            // для каждой записи из deleteList - методом filter удаляем из каждого проекта
                            deleteList.forEach((item_dellList) => {
                                serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].teamList = serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].teamList.filter(item_teamList => {
                                    // console.log("item_teamList.user_Email=" + item_teamList.user_Email + ", item_dellList.user_Email=" + item_dellList.user_Email + "  Ретерним=" + (item_teamList.user_Email != item_dellList.user_Email))
                                    if (item_teamList.user_Email != item_dellList.user_Email) {
                                        return true;
                                    }
                                })
                            })
                        }
                    })
                }

                // 3. Далее устанавливаем новый переданный контакт-лист для админа
                if (req.body.postDataToServer.newContactList) {
                    serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].contactList = req.body.postDataToServer.newContactList
                }
                need_SaveData = true;

                let dataFromServer = {
                    newContactListFromServer: serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].contactList,
                }

                res.status(200).json(dataFromServer);

            }
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 - m_set_newContactList_PS: " + error);
        }
    }

    //----------------------------------
    async m_set_project_settings_PS(req) {
        console.log("ЗАПУСК m_set_project_settings_PS:");
        console.log("req.body= ");
        console.log(req);
        try {
            let find_indexProject_in_BD = findProjectIndex_inBD(req.body.postDataToServer.project_ID);

            // обновляем данные в БД
            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].projectSettings = req.body.postDataToServer.projectSettings;
            // console.log("newSettings_forSubproject= ");
            // console.log(serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].subProjects[find_index_subProject_in_BD].subProjectSettings = req.body.postDataToServer.newSettings_forSubproject);

            // обновляем время обновления данных в БД
            let currentTime = Date.now();
            serverVarriorsDataFromBD_pr0001.projects_DB[find_indexProject_in_BD].time_Update_including_Objects.time_Update_projectSettings = currentTime;

            // в реестре пользователей ТОЛЬКО ДЛЯ ОТПРАВИТЕЛЯ РЕСПОНСА обновляем время просмотра настроек проекта
            try {
                let object_WasReadEvents_project___BY_ID = get_object_WasReadEvents_forProject___BY_ID(
                    req.body.postDataToServer.user_Email,
                    req.body.postDataToServer.project_ID);
                console.log("ОБЪЕКТ object_WasReadEvents_forSubproject___BY_ID = ");
                console.log(object_WasReadEvents_project___BY_ID);
                // обновляем время просмотра субчата в реестре 
                object_WasReadEvents_project___BY_ID.time_wasReadProjectSettings = currentTime;
                console.log("ОБЪЕКТ object_WasReadEvents_forSubproject___BY_ID = ");
                console.log(object_WasReadEvents_project___BY_ID);
            } catch (error) {
                console.log(error);
            }

            // оповещаем всех подписанных пользователей
            try {
                console.log("===оповещаем всех подписанных пользователей");
                const responseLongPoolling_Data = {
                    resEndPoint: "set_project_settings",
                    user_Email: req.body.postDataToServer.user_Email,
                    project_ID: req.body.postDataToServer.project_ID,
                    projectSettings: req.body.postDataToServer.projectSettings,
                }
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                // console.log("=== ЗАПУСКАЕМ responseLongPoolling");

                responseLongPoolling(responseLongPoolling_Data);

            } catch (error) {
                console.log("Ошибка оповещения " + error);
            }

            // след респонс для закрытия запроса на прямой реквест
            let dataFromServer = {
                resEndPoint: "set_sproject_settings",
            }
            return dataFromServer; // ретерним только для корректного закрытия пост-запроса на стороне браузера. Ответ клиенту в чат идет отдельно через LongPulling
        }
        catch (error) {
            return ("Ошибка из postService_pr0001 - set_project_settings: " + error);
        }

    }
    //----------------------------------
    async m_getUsersOnlineStatusFromServer_forCurrentProject_PS(req, res) {
        // console.log("ЗАПУСК m_getUsersOnlineStatusFromServer_forCurrentProject_PS");
        let dataFromServer = [];
        // console.log("req.postDataToServer.user_Email= " + req.body.postDataToServer.user_Email);

        try {
            let projectIndex = findProjectIndex_inBD(req.body.postDataToServer.project_ID);

            if (projectIndex != null && projectIndex >= 0) {
                dataFromServer = serverVarriorsDataFromBD_pr0001.projects_DB[projectIndex].teamList.map(item => {
                    return {
                        user_Email: item.user_Email,
                        lastOnlineTime: getOnlineTimeCurrentUser(item.user_Email)
                    }
                });
            }
            // console.log("dataFromServer=");
            // console.log(dataFromServer);
            return res.json(dataFromServer);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_getUsersOnlineStatusFromServer_forCurrentProject_PS: " + error);
        }
    }

    //----------------------------------

    async m_setUserSettings_PS(req, res) {
        try {
            // console.log("=== ЗАПУСК m_setUserSettings_PS, req.body= ");
            //  console.log(req.body);
            let dataFromServer = null;
            let finedUserIndex = findUser_Index_inReestr(req.body.postDataToServer.user_Email);
            if (finedUserIndex != null && finedUserIndex >= 0) {
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].userPublicData = req.body.postDataToServer.userPublicData;
                saveAllDataHandle();
                dataFromServer = {
                    resEndPoint: "wasChanged_UserSettings",
                    userPublicData: req.body.postDataToServer.userPublicData,
                }
            }
            res.status(200).json(dataFromServer);
        }

        catch (error) {
            return res.status(500).json("Ошибка из m_setUserSettings_PS: " + error);
        }
    }

    //----------------------------------

    async m_uploadAvatarUser_PS(req, res) {
        try {
            // console.log("=== ЗАПУСК m_uploadAvatarUser_PS, req.body= ");
            // console.log(req.body);
            let user_Email = req.body.user_Email;
            let newAvatarFile = req.body.newAvatarFile;
            // console.log("newAvatarFile= ");
            // console.log(newAvatarFile);
            // из потока данных файла необх удалить часть потоковых данных для возможности дальнейшего его сохранения в файл, поскольку эти данные добавляются канвасом для описания метода шифрования изображения
            // Для вырезания этих данных мы удаляемый фрагмент заменяем на пустой текст), см. видео https://www.youtube.com/watch?v=KVeMsy4qCdg&ab_channel=UlbiTV,   min   1:10:10
            newAvatarFile = newAvatarFile.replace('data:image/jpeg;base64,', '');
            // console.log("newAvatarFile после обрезания= ");
            // console.log(newAvatarFile);
            // далее запись файла на диск
            // Поскольку файл аватара мы получили от клиента в виже потока данных, без имени , то название файла назначаем тут самостоятельно
            let newAvatarFileName = "av___" + user_Email + "." + "jpeg";
            // console.log("newAvatarFileName= ");
            // console.log(newAvatarFileName);

            // let pathSaveFile = './static/avatars/' + newAvatarFileName;
            let pathSaveFile = get_valid_adress_fileOrFolder(config_pr0001.static_Adress + 'avatars/' + newAvatarFileName);

            // console.log("pathSaveFile= ");
            // console.log(pathSaveFile);
            // записываем на диск
            // newAvatarFile.mv(pathSaveFile);
            fs.writeFileSync(pathSaveFile, newAvatarFile, 'base64'); // 'base64' - это кодировка изображения, которая была применена при упаковке файла в FormData при передаче от клиента серверу, мы должны ее указать здесь при записи файла
            saveAllDataHandle();

            let dataFromServer = null;
            dataFromServer = {
                resEndPoint: "wasUloadedAvatarUser",
            }
            res.status(200).json(dataFromServer);
        }

        catch (error) {
            return res.status(500).json("Ошибка из m_uploadAvatarUser_PS: " + error);
        }
    }

    //----------------------------------

    async m_deleteAvatarFromServer_PS(req, res) {
        try {
            // console.log("=== ЗАПУСК m_deleteAvatarFromServer_PS, req.body= ");
            // console.log(req.body);
            let dataFromServer = null;
            let user_Email = req.body.postDataToServer.user_Email;
            let avatarFileName = "av___" + user_Email + "." + "jpeg";



            // console.log("newAvatarFileName= ");
            // console.log(newAvatarFileName);            

            // удаляем файла с диска
            // let pathDeleteFile = './static/avatars/' + avatarFileName;
            let pathDeleteFile = get_valid_adress_fileOrFolder(config_pr0001.static_Adress + 'avatars/' + avatarFileName);


            if (fs.existsSync(pathDeleteFile)) {
                fs.unlinkSync(pathDeleteFile);
                saveAllDataHandle();

                dataFromServer = {
                    resEndPoint: "wasDeletedAvatarFromServer",
                    user_Email: req.body.user_IDbyEMAI,
                }
                res.status(200).json(dataFromServer);
            }
            else {
                dataFromServer = {
                    resEndPoint: "dontExistAvatarFile",
                    user_Email: req.body.user_IDbyEMAI,
                }
                res.status(500).json(dataFromServer);
            }
        }

        catch (error) {
            return res.status(500).json("Ошибка из m_deleteAvatarFromServer_PS: " + error);
        }
    }

    //----------------------------------
    async m_addNewCorpAccount_PS(req, res) {
        try {
            // console.log("=== ЗАПУСК m_addNewCorpAccount_PS, req.body= ");
            // console.log(req.body);
            let finedUserIndex = findUser_Index_inReestr(req.body.postDataToServer.user_Email);
            if (finedUserIndex != null && finedUserIndex >= 0) {
                let finedCorpAccIndex = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts.findIndex(item => item.corpAccount_ID == req.body.postDataToServer.newCorpAccountName);
                if (finedCorpAccIndex != null && finedCorpAccIndex >= 0) {
                    console.log("Возвращаем ответ ");
                    return res.status(500).json("Error - Dublicate CorpAcc name");
                }
                else {
                    // добавляем в реестр
                    let newCorpAccount = {
                        corpAccount_ID: myRandomId(),
                        corpAccount_Name: req.body.postDataToServer.corpAccount_Name,
                        defaultAdmin_ID__forThisCorpAccount: req.body.postDataToServer.user_Email,
                        defaultAdmin_EMAIL__forThisCorpAccount: req.body.postDataToServer.user_Email, // исправить на Email при добавлении
                        defaultAdminForThisProject: req.body.postDataToServer.defaultAdminForThisProject,
                    }

                    serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts.push(newCorpAccount);
                    saveAllDataHandle();

                    let dataFromServer = {
                        resEndPoint: "was_added_new_corpAccount",
                        newCorpAccount: newCorpAccount,
                        user_Email: req.body.postDataToServer.user_Email,
                    }
                    console.log("Возвращаем ответ ");
                    return res.status(200).json(dataFromServer);
                }
            }
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_getUsersOnlineStatusFromServer_forCurrentProject_PS: " + error);
        }
    }
    //----------------------------------
    async m_renameCorpAccount_PS(req, res) {
        try {
            // console.log("=== ЗАПУСК m_renameCorpAccount_PS, req.body= ");
            // console.log(req.body);

            let dataFromServer = {};

            let finedUserIndex = findUser_Index_inReestr(req.body.postDataToServer.corpAccount.defaultAdmin_ID__forThisCorpAccount);

            // console.log("=== finedUserIndex= " + finedUserIndex);

            if (finedUserIndex != null && finedUserIndex >= 0) {
                // получаем список проектов данного Админа
                let projectsListCurrentUser = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].
                    accessProjects.filter(
                        // item => item.defaultAdminForThisProject === req.body.postDataToServer.admin_ID
                        item => item.defaultAdminForThisProject === req.body.postDataToServer.corpAccount.defaultAdmin_ID__forThisCorpAccount
                    );

                // console.log("=== projectsListCurrentUser= ");
                // console.log(projectsListCurrentUser);

                // в каждом проекте находим тот проект, который содержит переименовываемый родительский корп аккаунт, и меняем в нем имя корпАккаунта

                try {
                    projectsListCurrentUser.forEach(
                        (item, index) => {

                            // console.log("ЗАПУСКАЕМ forEach ");

                            // находим каждый проект в базе данных]
                            let finedProjectIndex = findProjectIndex_inBD(item.project_ID);

                            console.log("=== finedProjectIndex= " + finedProjectIndex);

                            if (finedProjectIndex != null && finedProjectIndex >= 0) {
                                // и далее проверяем - совпадает ли роодительский корп аккаунт каждого найденного проекта с тем корп аккаунтом, который подлежит удалению
                                if (
                                    serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndex].parentCorpAccount_ID == req.body.postDataToServer.corpAccount.corpAccount_ID
                                ) {
                                    // console.log("Переименовываем parentCorpAccount_Name В ЦИКЛЕ forEach");
                                    // console.log("Проект до переименовывания корп аккаунта:");
                                    // console.log(item);

                                    serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndex].parentCorpAccount_Name = req.body.postDataToServer.newRenamed_corpAccount_Name;

                                    // console.log("Проект ПОСЛЕ переименовывания корп аккаунта:");
                                    // console.log(item);
                                }
                            }
                        });
                } catch (error) {
                    console.log(error);
                }


                try {
                    // затем переименовываем корп аккаунт в реестре клиента
                    let finedCorpAccIndex = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts.findIndex(item => item.corpAccount_ID == req.body.postDataToServer.corpAccount.corpAccount_ID);

                    console.log(" = = = corpAccount_ID=" + req.body.postDataToServer.corpAccount.corpAccount_ID);
                    console.log(" = = = ownCorpAccounts =");
                    console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts);


                    console.log("ПЕРЕИМЕНОВЫВАЕМ finedCorpAccIndex=" + finedCorpAccIndex);

                    if (finedCorpAccIndex != null && finedCorpAccIndex >= 0) {
                        serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts[finedCorpAccIndex].corpAccount_Name = req.body.postDataToServer.newRenamed_corpAccount_Name;
                    }

                    dataFromServer = {
                        resEndPoint: "was_renamed_corpAccount",
                        renamed_corpAccount: serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts[finedCorpAccIndex],
                    }

                    saveAllDataHandle();

                } catch (error) {
                    console.log(error);
                }
            }

            return res.status(200).json(dataFromServer);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_renameCorpAccount_PS: " + error);
        }
    }

    //----------------------------------
    async m_deleteCorpAccount_PS(req, res) {
        try {
            console.log("=== ЗАПУСК m_deleteCorpAccount_PS, req.body= ");
            console.log(req.body);

            let finedUserIndex = findUser_Index_inReestr(req.body.postDataToServer.admin_ID);

            console.log("=== finedUserIndex= " + finedUserIndex);

            if (finedUserIndex != null && finedUserIndex >= 0) {
                // получаем список проектов данного Админа
                let projectsListCurrentUser = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].
                    accessProjects.filter(
                        item => item.defaultAdminForThisProject === req.body.postDataToServer.admin_ID
                    );

                console.log("=== projectsListCurrentUser= ");
                console.log(projectsListCurrentUser);

                // в каждом проекте определяем родительский корп аккаунтпроект данного аккаунта
                try {
                    projectsListCurrentUser.forEach(
                        (item, index) => {
                            // находим каждый проект в базе данных]
                            let finedProjectIndex = findProjectIndex_inBD(item.project_ID);
                            if (finedProjectIndex != null && finedProjectIndex >= 0) {
                                // и далее проверяем - совпадает ли роодительский корп аккаунт каждого найденного проекта с тем корп аккаунтом, который подлежит удалению
                                if (
                                    serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndex].parentCorpAccount_ID == req.body.postDataToServer.corpAccount.corpAccount_ID
                                ) {
                                    console.log("УДАЛЯЕМ ПРОЕКТ В ЦИКЛЕ forEach");
                                    delete_oneProjectFromBD(
                                        item.project_ID,
                                        finedProjectIndex // это knownIndexInReestr
                                    );
                                }
                            }
                        });

                    try {
                        // затем удаляем корп аккаунт из реестра клиента
                        let finedCorpAccIndex = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts.findIndex(item => item.corpAccount_ID == req.body.postDataToServer.corpAccount.corpAccount_ID);

                        console.log("finedCorpAccIndex=" + finedCorpAccIndex);

                        if (finedCorpAccIndex != null && finedCorpAccIndex >= 0) {
                            serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].corpAccounts.ownCorpAccounts.splice(finedCorpAccIndex, 1);
                        }

                    } catch (error) {
                        console.log(error);
                    }

                    saveAllDataHandle();

                } catch (error) {
                    console.log(error);
                }
            }

            let dataFromServer = {
                endPoint: "was_deletedCorpAccount",
                corpAccount: req.body.postDataToServer.corpAccount
            }

            console.log("Ретерним ответ, dataFromServer=");
            console.log(dataFromServer);

            return res.status(200).json(dataFromServer);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_deleteCorpAccount_PS: " + error);
        }
    }

    //----------------------------------
    async m_ignorOwnerCorpAccount_PS(req, res) {
        try {
            let dataFromServer = {};
            console.log("=== ЗАПУСК m_ignorOwnerCorpAccount_PS, req.body= ");
            console.log(req.body);

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
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_ignorOwnerCorpAccount_PS: " + error);
        }
    }

    //----------------------------------
    async m_restoreOwnerCorpAccount_PS(req, res) {
        try {
            let dataFromServer = {};
            console.log("=== ЗАПУСК m_restoreOwnerCorpAccount_PS, req.body= ");
            console.log(req.body);

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
            return res.status(200).json(dataFromServer);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_restoreOwnerCorpAccount_PS: " + error);
        }
    }

    //----------------------------------
    // не используется
    async m_getUsersOnlineStatusFromServer_forContactListCurrentAdmin_PS(req, res) {
        // console.log("ЗАПУСК m_getUsersOnlineStatusFromServer_forContactListCurrentAdmin_PS");
        let dataFromServer = [];
        // console.log("req.postDataToServer.user_Email= " + req.body.postDataToServer.user_Email);

        try {
            let adminIndex = findUser_Index_inReestr(req.body.postDataToServer.user_Email);

            if (adminIndex != null && adminIndex >= 0) {
                dataFromServer = serverVarriorsDataFromBD_pr0001.users_Reestr[adminIndex].contactList.map(item => {
                    return {
                        user_Email: item.user_Email,
                        lastOnlineTime: getOnlineTimeCurrentUser(item.user_Email)
                    }
                });
            }
            // console.log("dataFromServer=");
            // console.log(dataFromServer);
            return res.json(dataFromServer);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_getUsersOnlineStatusFromServer_forContactListCurrentAdmin_PS: " + error);
        }
    }
    //----------------------------------

    async m_confirmOnlineStatus_PS(req, res) {
        // console.log("Запуск m_confirmOnlineStatus_PS");
        // console.log("req.headers= ");
        // console.log(req.headers);

        try {
            // let userIndex = findUser_Index_inReestr(req.body.postDataToServer.user_Email);
            let userIndex = findUser_Index_inReestr(req.headers.decodeAT_____user_Email);

            if (userIndex != null && userIndex >= 0) {
                // обновляем время присутствия
                // serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus = {};

                try {
                    // удалить проверку после исправления реестра
                    if (!serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus) serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus = {}; // если свойства не было установлено в старых записях реестра - тогда добавили его
                    serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus.lastOnlineTime = Date.now();
                } catch (error) {
                    console.log("Ошибка из postService_pr0001 --- m_confirmOnlineStatus_PS: " + error);
                }

                // console.log("===== onlineStatus= " + serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus.lastOnlineTime);

                need_SaveData = true;
            }

            let dataFromServer = {
                // eser_ID: req.body.postDataToServer.user_Email,
                user_Email: req.headers.decodeAT_____user_Email,
                lastOnlineTime: serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus.lastOnlineTime
            }

            // console.log("dataFromServer= ");
            // console.log(dataFromServer);
            return res.status(200).json(dataFromServer);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 --- m_confirmOnlineStatus_PS: " + error);
        }
    }

    //========================

    // Загрузка/скачивание/удаление файлов:

    // ЭТУ НЕ ИСПОЛЬЗУЕМ, вместо этого дагружаем по одному файлу
    async m_uploadFilesToServer_PS(req, res) {
        // console.log("ЗАПУСК m_uploadFilesToServer_PS:");
        try {
            // загружаем файлы
            let newFilesList = await mFile_service.upLoadFiles(req);
            let dataFromServer = {
                newFilesList: newFilesList,
            }
            // console.log("Возвращаем res= ");
            // console.log(dataFromServer);

            saveAllDataHandle();

            // оповещаем всех подписанных пользователей
            try {
                console.log("===оповещаем всех подписанных пользователей - m_uploadFilesToServer_PS");
                const responseLongPoolling_Data = {
                    resEndPoint: "updateFilesListProject",
                    user_Email: req.body.user_Email,
                    project_ID: req.body.project_ID,
                    newFilesList: newFilesList,
                }
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                // console.log("=== ЗАПУСКАЕМ responseLongPoolling");
                responseLongPoolling(responseLongPoolling_Data);
            } catch (error) {
                console.log("Ошибка оповещения " + error);
            }

            return res.status(200).json(dataFromServer);
        }

        catch (error) {
            console.log("Ошибка из postService_pr0001 - uploadFilesToServer: " + error);
            return res.status(400).json("Ошибка m_uploadFilesToServer_PS");
        }
    }
    //---------

    async m_uploadOneFileToServer_PS(req, res) {
        console.log("ЗАПУСК m_uploadOneFileToServer_PS:");
        try {
            // загружаем файлы
            let newFilesList = await mFile_service.upLoadOneFile(req);
            let dataFromServer = {
                newFilesList: newFilesList,
            }
            // console.log("Возвращаем res= ");
            // console.log(dataFromServer);

            saveAllDataHandle();

            // оповещаем всех подписанных пользователей
            try {
                console.log("===оповещаем всех подписанных пользователей - m_uploadFilesToServer_PS");
                const responseLongPoolling_Data = {
                    resEndPoint: "updateFilesListProject",
                    user_Email: req.body.user_Email,
                    project_ID: req.body.project_ID,
                    newFilesList: newFilesList,
                }
                // вызываем ф. responseLongPoolling, и сразу заполняем аргументы:
                // console.log("=== ЗАПУСКАЕМ responseLongPoolling");
                responseLongPoolling(responseLongPoolling_Data);
            } catch (error) {
                console.log("Ошибка оповещения " + error);
            }
            return res.status(200).json(dataFromServer);
        }
        catch (error) {
            console.log("Ошибка из postService_pr0001 - uploadFilesToServer: " + error);
            return res.status(400).json("Ошибка m_uploadFilesToServer_PS");
        }
    }



    //---------

    async m_downloadOneFileFromServer_PS(req, res) {
        console.log("ЗАПУСК m_downloadOneFileFromServer_PS:");

        try {
            let admin_ID = req.body.postDataToServer.admin_ID; //исправить позже имя юзера
            let project_ID = req.body.postDataToServer.project_ID;
            let file_ID = req.body.postDataToServer.file_ID;
            // получаем искомый файл
            let returnedFile = await mFile_service.downLoadOneFile(admin_ID, project_ID, file_ID, res);

            console.log("Возвращаем returnedFile ...");
            //  return; // Ничего не ретерним, ответ res вместе с ретерном происходит из след вызываемой фун downLoadOneFile

        }


        catch (error) {
            return ("Ошибка из postService_pr0001 - uploadFilesToServer: " + error);
        }

    }

    //---------

    async m_deleteFilesFromServer_PS(req, res) {
        console.log("ЗАПУСК m_deleteFilesFromServer_PS, req.body= ");
        console.log(req.body);

        try {
            let admin_ID = req.body.postDataToServer.admin_ID;
            let project_ID = req.body.postDataToServer.project_ID;
            let deleteFilesList = req.body.postDataToServer.deleteFilesList;

            let finedUserIndexInReestr = findUser_Index_inReestr(admin_ID);
            let finedProjectIndexBD = findProjectIndex_inBD(project_ID);
            console.log("finedUserIndexInReestr= " + finedUserIndexInReestr);
            console.log("finedProjectIndexBD= " + finedProjectIndexBD);

            deleteFilesList.forEach(item => {

                let file_ID = item.file_ID;

                // удаляем с диска
                try {
                    mFile_service.deleteFile(admin_ID, project_ID, file_ID);
                } catch (error) {
                    console.log("Ошибка удаления файла с диска");
                }

                // удаляем из реестра
                try {
                    // вносим корректировки в реестр файлов и размер занятого места на диске
                    let finedFileIndexInFileList = serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndexBD].attachedFiles.filesList.findIndex(item => item.file_ID == file_ID);
                    console.log("finedFileIndexInFileList= " + finedFileIndexInFileList);
                    if (finedFileIndexInFileList != null && finedFileIndexInFileList >= 0) {
                        // корректируем размер занятого места на диске админа
                        serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndexInReestr].tarif_plan.used_diskSpace -=
                            serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndexBD].attachedFiles.filesList[finedFileIndexInFileList].file_size;
                        console.log("ОТКОРРЕКТИРОВАН РАЗМЕР ДИСКА В РЕЕСТЕ");

                        // удаляем также шаблон файла из списка файлов проекта
                        if (finedFileIndexInFileList != null && finedFileIndexInFileList >= 0) {
                            serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndexBD].attachedFiles.filesList.splice(finedFileIndexInFileList, 1);
                            console.log("УДАЛЕН шаблон файла из списка файлов проекта");
                        }
                    }
                    else {
                        console.log("Ошибка удаления файла из реестра - файл не найден");
                    }

                } catch (error) {
                    console.log("Ошибка удаления файла из реестра" + error);
                }

            });

            let dataFromServer = {
                newFilesList: serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndexBD].attachedFiles.filesList
            }

            saveAllDataHandle();
            return res.status(200).json(dataFromServer);
        }

        catch (error) {
            console.log("Ошибка из postService_pr0001 - m_deleteFilesFromServer_PS: " + error);
            return ("Ошибка из postService_pr0001 - m_deleteFilesFromServer_PS: " + error);
        }
    }

    //---------

    async m_getFilesListFromServer_PS(req, res) {
        console.log("ЗАПУСК m_getFilesListFromServer_PS:");
        try {
            let user_Email = req.body.user_Email;
            let project_ID = req.body.project_ID;
            let gettedFileList = await mFile_service.getFilesList(user_Email, project_ID);
            console.log("gettedFileList= ");
            console.log(gettedFileList);
            return res.json(gettedFileList);
        }

        catch (error) {
            return ("Ошибка из postService_pr0001 - m_getFilesListFromServer_PS: " + error);
        }

    }

    //========================
    // Авторизация:

    async m_registration_User_PS(req, res) {

        try {
            console.log("ЗАПУСК m_registration_User_PS, req.body= ");
            console.log(req.body);

            let logInData = await mUserService.registrationUser(req);

            console.log("logInData= ");
            console.log(logInData);

            // Подготавливаем данные в ответе для res
            res.cookie('refreshToken', logInData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });

            let dataFromServer = {
                // Важно - хотя мы и отправляем сейчас новому юзеру токен доступа, - на сервере они еще не перемещены в папку доступа из временной папки до тех пор, пока пользователь не даст подтверждение через свою почту
                user_Email: logInData.user_Email,
                accessToken: logInData.accessToken,
            }

            // далее отправляем ответ сервера
            res.status(200).json(dataFromServer);
        }
        catch (error) {
            console.log("ОШИБКА m_registration_User_PS:");
            console.log(error);
            res.status(400).json(error);
        }



    }

    //----------------------------------
    async m_confirmRegistrationUser_PS(req, res) {

        try {
            console.log("ЗАПУСК m_confirmRegistrationUser_PS ");
            console.log("req.params= ");
            console.log(req.params);

            // console.log(req);
            // в данных запроса отсутствует body, тк это ГЕТ-запрос. Поэтому извлекаем интересующие нас данные из строки запроса:
            let activationLink = req.params.link;

            let finedIndex = serverVarriorsDataFromBD_pr0001.users_Reestr.findIndex(item => item.autorisationData.activationLink === activationLink);
            // если пользователь не найден
            if (!(finedIndex != null && finedIndex >= 0)) {
                // throw new e("Некорректная ссылка активации");
                throw m_ApiErrors.m_BadRequest("Некорректная ссылка активации");
            }
            // иначе, если пользователь найден
            else {
                // ставим отметку об активации нового пользователя
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.isActivatedAsseptLink = true;
                need_SaveData = true;

                // переносим токены юзера из временной папки предрегистрации в данные юзера (создаем копию, а не ссылки на объект)
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.tokensDifferentGadgets =
                    JSON.parse(
                        JSON.stringify(serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.tokensBeforeRegistration)
                    );

                // очищаем предварительное хранилище токенов перед регистрацией юзера
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.tokensBeforeRegistration = {};
                // очищаем Линк для регистрации
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.activationLink = null;


            }

            // далее нужно переадресовать пользователя со страницы подтверждения ссылки на страницу нашей программы. Делаем Редирект. Он передается пользователю как ответ на его ГЕТ-запрос.
            res.redirect(config_pr0001.clientAdress);
        }
        catch (error) {
            console.log("Ошибка m_confirmRegistrationUser_PS:");
            console.log(error);
        }

    }

    //----------------------------------

    // Эту функцию отладить и протестировать после отладки на клиенте
    async m_changePassword_PS(req, res) {

        try {
            console.log("ЗАПУСК m_changePassword_PS, req.body= ");
            console.log(req.body);

            let logInData = await mUserService.changePassword(req);

            console.log("logInData= ");
            console.log(logInData);

            // Подготавливаем данные в ответе для res
            res.cookie('refreshToken', logInData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });

            let dataFromServer = {
                user_Email: logInData.user_Email,
                accessToken: logInData.accessToken,
            }

            // далее отправляем ответ сервера
            // res.status(200).json(dataFromServer);


            res.status(200).json("OKKK");
        }
        catch (error) {
            console.log("ОШИБКА m_changePassword_PS:");
            console.log(error);
            res.status(400).json(error);
        }
    }

    //----------------------------------

    async m_confirmChangePassword_PS(req, res) {

        try {
            // console.log("ЗАПУСК m_confirm_confirmChangePassword_PS ");
            // console.log("req.params= ");
            // console.log(req.params);

            // console.log("serverVarriorsDataFromBD_pr0001.users_Reestr[0].autorisationData= ");
            // console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[0].autorisationData);

            // console.log(req);
            // в данных запроса отсутствует body, тк это ГЕТ-запрос. Поэтому извлекаем интересующие нас данные из строки запроса:
            let changeLink = req.params.link;
            // console.log("changeLink= ");
            // console.log(changeLink);

            let finedIndex = serverVarriorsDataFromBD_pr0001.users_Reestr.findIndex(item => item.autorisationData.changePasswordData.changePasswordActivationLink === changeLink);
            // console.log("finedIndex= " + finedIndex);
            // если пользователь не найден
            if (!(finedIndex != null && finedIndex >= 0)) {
                // throw new e("Некорректная ссылка активации");
                throw m_ApiErrors.m_BadRequest("Некорректная ссылка изменения пароля");
            }
            // иначе, если пользователь найден
            else {
                // переносим токены юзера из временной папки changePasswordData в данные юзера (создаем копию, а не ссылки на объект)
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.tokensDifferentGadgets =
                    JSON.parse(
                        JSON.stringify(serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.changePasswordData.changePassword_newTokens)
                    );

                // очищаем предварительное хранилище токенов перед изменением пароля
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedIndex].autorisationData.changePasswordData = {
                    changePasswordHesh_awaitConfirm: null,
                    changePassword_awaitConfirm: null, //  позже удалить это поле
                    changePasswordActivationLink: null,
                    changePassword_newTokens: {},
                }


            }

            // далее нужно переадресовать пользователя со страницы подтверждения ссылки на страницу нашей программы. Делаем Редирект. Он передается пользователю как ответ на его ГЕТ-запрос.
            res.redirect(config_pr0001.clientAdress);
        }
        catch (error) {
            console.log("Ошибка m_confirmRegistrationUser_PS:");
            console.log(error);
        }

    }

    //----------------------------------

    async m_logIn_PS(req, res) {

        try {
            //console.log("ЗАПУСК m_logIn_PS req.body= ");
            // console.log(req.body);
            /* 
            let logInData = await mUserService.logIn(
                req.body.postDataToServer.eMail,
                req.body.postDataToServer.password,
                req.body.postDataToServer.mGadgetProcess_ID
            )

            let dataFromServer = {
                user_Email: logInData.user_Email,
                accessToken: logInData.accessToken,
            }
            */

            let dataFromServer = await mUserService.logIn(
                req.body.postDataToServer.eMail,
                req.body.postDataToServer.password,
                req.body.postDataToServer.mGadgetProcess_ID
            );

            // в случае успешной авторизации
            if (dataFromServer.logInResult == "logIn_Ok") {
                // помещаем куки в респонс 
                res.cookie('refreshToken', dataFromServer.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
                // устанавливаем параметры для сохранения куки на клиенте:
                // res.header("Access-Control-Allow-Origin", config_pr0001.clientAdress);
                // res.header("Access-Control-Allow-Origin", req.headers.origin);
                // res.header('Access-Control-Allow-Credentials', 'true');
                // удаляем рефреш токен из открытого поля  респонса
                delete dataFromServer.refreshToken;
            }

            //console.log("dataFromServer= ");
            //console.log(dataFromServer);

            // далее отправляем ответ сервера
            res.status(200).json(dataFromServer);

        } catch (error) {
            console.log("Ошибка Ошибка m_logIn_PS");
            res.status(500).json("Ошибка m_logIn_PS");
        }

    }

    //----------------------------------

    async m_GoogleAuth_01_PS(req, res) {
        // ВНИМАНИЕ! Мы используем несколько вариантов Гугл-авторизации, и поскольку не удалось разобраться с обменом кода клиента Гугл на токен доступа Гугл - пока что используем зашифрованный локальный PayLoad от клиента
        // console.log("=========================");
        // console.log("ЗАПУСК m_GoogleAuth_01_PS req.body= ");

        // Удалить
        /* 
                try {
                    console.log(req.body);
                } catch (error) {
                    console.log("Ошибка в m_GoogleAuth_01_PS");
                    console.log(error);
                }

                try {
                    console.log("=========================");
                    console.log("Пробное прочтение файла - m_GoogleAuth_01_PS");
                    // const pathNameID = 'dataBase/' + 'serverVarriorsDataFromBD_pr0001.users_Reestr' + '.json';
                    const pathNameID = get_valid_adress_fileOrFolder("../DataBase/m_DB.json");
                    let data = fs.readFileSync(pathNameID, 'utf8');
                    console.log("Файл успешно прочитан - mLoadUserReestr");
                    // console.log(data); 
                } catch (error) {
                    console.log("Ошибка чтения файла - mLoadUserReestr");
                    console.log(error);
                }
        */


        try {
            let clientEmailOpen = req.body.postDataToServer.clientEmailOpen;
            let mGadgetProcess_ID = req.body.postDataToServer.mGadgetProcess_ID;
            let timeCreateRequest = req.body.postDataToServer.timeCreatRequest; // нужно будет при расшифровке нашего токена
            let typeOfGoogleAuth = req.body.postDataToServer.typeOfGoogleAuth;
            // В переменной mPL - находится зашифрованный данные - my pay load
            let mPL = req.body.postDataToServer.mPL;

            // далее запускаем процесс авторизации
            // Если Тип авторизации - наш локальный Хеш-токен - "hashLoc"
            if (typeOfGoogleAuth == "mHashLoc") {
                try {
                    // сначала расхешируем зашифрованные данные. тут нужно ИСПРАВИТЬ - в браузере использовать хеширование с пааролем
                    mPL = jwt_decode(mPL);
                    // console.log("================================== ");
                    // console.log("mPL после расхеширования с паролем = ");
                    // console.log(mPL);
                    // console.log("================================== ");

                    // расхешируем открытый токен Гугла (он без пароля)
                    let googleClientToken = mPL.googleClientToken;
                    googleClientToken = jwt_decode(googleClientToken);
                    // console.log("googleHeshToken после распаковки Гугл jwt-токена ");
                    // console.log(googleClientToken);
                    // сравниваем идентичность открытых данных и зашифрованных на клиенте данных                    
                    if (!clientEmailOpen || (clientEmailOpen != googleClientToken.email)) return (
                        res.status(400).json("Ошибка при аудентификации пользователя")
                    )

                    // далее в случае успешной проверки авторизируем (либо добавляем нового пользователя и авторизируем)
                    try {
                        let finedUserIndex = find___Or_Find_And_Add_NewUserInReestr(googleClientToken.email);
                        // добавляем в реестр данные о пользователе - копируем их из входящего токена
                        serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.googleAuthData = googleClientToken;

                        // Создаем токен доступа и рефреж токен для данного пользователя (с учетом активного Гаджета) 
                        let newTokens = mUserService.generateTokens({
                            user_Email: googleClientToken.email,
                            mGadgetProcess_ID: mGadgetProcess_ID,
                            mKuiir: finedUserIndex, // это knownUserIndexInReestr - прячем за абревиатурой, чтоб на клиенте не было видно поря
                            // passwordHesh: "anyRandomDataForGoogleUser",
                        });

                        // записываем/перезаписываем токены в реестр юзера
                        try {
                            // в след строке мы создаем свойство, название которого создается динамически и соответствует идентификатору Гаджета [mGadgetProcess_ID]
                            serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets[mGadgetProcess_ID] = {
                                accessToken: newTokens.accessToken,
                                refreshToken: newTokens.refreshToken,
                            };

                            // console.log("serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets=");
                            // console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets);

                            // Отмечаем, что регистрация юзера подтверждена (это поле, которое подтверждается при других способах регистрации юзера). Это необходимо, если юзер в дальнейшем захочет логиниться с пом обычного логин/пароль
                            if (!(serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.isActivatedAsseptLink)) {
                                serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.isActivatedAsseptLink = true;
                            }

                            // Если раньше не было регистрации через логин/пароль, - ТОГДА ТОЛЬКО устанавливаем значение passwordHesh
                            if (!serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.passwordHesh) {
                                serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.passwordHesh = "wasAuthByGoogle";
                            }

                        }
                        catch (error) {
                            console.log("ОШИБКА: ");
                            console.log(error);
                        }


                        let dataFromServer = {
                            user_Email: serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].user_Email,
                            accessToken: serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets[mGadgetProcess_ID].accessToken,
                        }

                        console.log("ОТПРАВЛЯЕМ RES из SubDialog_logIn_Form, dataFromServer=");
                        console.log(dataFromServer);
                        res.status(200).json(dataFromServer);

                    } catch (error) {
                        console.log("ОШИБКА ПРИ ДОБАВЛЕНИИ ГУГЛ-ЮЗЕРА" + error);
                    }

                } catch (error) {
                    console.log(error);
                }

            }
        }
        catch (error) {
            console.log("ОШИБКА m_GoogleAuth_01_PS: " + error);
        }



        saveAllDataHandle();




        // НЕ УДАЛЯТЬ - нужно разобраться и запустить код
        // След код не работает
        // при попытке обменять токен клиента на токен доступа Гугла - от сервера Гугл получаем такой ответ:        
        // {
        //   error: 'unsupported_grant_type',
        //   error_description: 'Invalid grant_type: '
        // }
        // НЕ УДАЛЯТЬ - нужно разобраться и запустить
        /*  
        let postDataToGoogle = {
            code: req.body.postDataToServer.clientGoogleCode,
            client_id: "13412525524-p1m2k49aaloiilh6j5pkpkr152f2nckg.apps.googleusercontent.com",
            client_secret: "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",
            // client_secret: "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",
            // redirect_uri: "http://localhost:5075/api/sessions/oauth/google",
            // redirect_uri: "http://localhost:5075/auth/google",
            // redirect_uri: "config_pr0001.clientAdressauth/google",
            // redirect_uri: "http://localhost:5075/api/sessions/oauth/google",
            // redirect_uri: "http://localhost:5075/GoogleAuth_01",
     
            // redirect_uri: "http://localhost:5075/api/sessions/oauth/google",
            redirect_uri: "https://accounts.google.com/o/oauth2/auth",
            grant_type: "authorization_code"
            // удалить отсюда
            // scope:  "http://www.googleapis.com/auth/userinfo.profile"
        }
     
        console.log("postDataToGoogle= ");
        console.log(postDataToGoogle);
     
                let myPromise = new Promise((resolve, reject) => {
                    try {
                        let mURL = "https://oauth2.googleapis.com/token";
                        fetch(mURL, {
                            method: 'post',
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                // 'Content-Type': 'application/json',
                            },
        
                            body: JSON.stringify({
                                postDataToGoogle
                            })
        
                        })
                            .then(res => res.json())
                            .then((res) => {
                                console.log("Ответ Гугла:");
                                console.log(res);
                                resolve(res);
                            })
        
                    } catch (error) {
                        console.log("Ошибка m_GoogleAuth_01_PS:");
                        console.log(error);
                        reject(error);
                    }
                })
                console.log("Получены токены от Гугла: ");
                console.log(await myPromise);
         */
        // НЕ УДАЛЯТЬ код выше - нужно разобраться и запустить
    }

    //----------------------------------
    async m_logOutOneGadget_PS(req, res) {
        let eMail = req.body.postDataToServer.eMail;
        let mGadgetProcess_ID = req.body.postDataToServer.mGadgetProcess_ID;
        // удаляем токен из реестра пользователя. Тут позже исправить - передавать не токен, еМейл пользователя для более быстрого поиска в реестре пользователей
        let userIndex = findUser_Index_inReestr(eMail);
        if (userIndex != null && userIndex >= 0) {
            console.log("ДО УДАЛЕНИЯ tokensDifferentGadgets= ");
            console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.tokensDifferentGadgets);
            // следующим действием ИМЕННО УДАЛЯЕМ --- а не обнуляем --- свойство объекта с ID конкретного гаджета, чтобы не засорять реестр, поскольку пользователь в будущем возможно не будет заходить с этого гаджета, а ID гаджета останется в реестре с обнуленными данными.
            // Тут к свойству объекта обращаемся в виде [mGadgetProcess_ID], поскольку это динамически созданное свойство из запроса (т.е. ключ в строковом формате) , и его переводим в строковый формат данным образом (см. тут: https://learn.javascript.ru/object)
            delete serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.tokensDifferentGadgets[mGadgetProcess_ID];
            console.log("tokensDifferentGadgets= ");
            console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.tokensDifferentGadgets);

            saveAllDataHandle();
        }
        // в Куки удаляем токен и возвращаем ответ клиенту
        res.clearCookie('refreshToken');
        let dataFromServer = {
            wasLogOutUser_ID: req.body.postDataToServer.eMail,
        }
        // ответ отправляем, в нем содержится инструкция по удалению Куки
        res.status(200).json(dataFromServer);
    }

    //----------------------------------
    async m_logOutAllGadgets_PS(req, res) {
        console.log("++++++++++++++++++++++");
        console.log("Сработал m_logOutAllGadgets_PS, req.body= ");
        console.log(req.body);
        console.log("req.headers= ");
        console.log(req.headers);

        let eMail = req.body.postDataToServer.eMail;
        // удаляем токен из реестра пользователя. Тут позже исправить - передавать не токен, еМейл пользователя для более быстрого поиска в реестре пользователей

        let userIndex = findUser_Index_inReestr(eMail);
        if (userIndex != null && userIndex >= 0) {

            console.log("ПЕРЕД УДАЛЕНИЕМ tokensDifferentGadgets= ");
            console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.tokensDifferentGadgets);
            // удалеим все вложенные объекты с токенами для данного пользователя
            serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.tokensDifferentGadgets = {};
            console.log("tokensDifferentGadgets= ");
            console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.tokensDifferentGadgets);

            saveAllDataHandle();
        }

        // в Куки удаляем токен и возвращаем ответ клиенту
        res.clearCookie('refreshToken');
        let dataFromServer = {
            wasLogOutUser_ID: req.body.postDataToServer.eMail,
        }
        // ответ отправляем, в нем содержится команда браузеру для удаления Куки
        res.status(200).json(dataFromServer);
    }

    //----------------------------------
    async m_refreshToken_PS(req, res) {

        console.log("req.headers.origin = ");
        console.log(req.headers);

        console.log("===  req.cookies= ");
        console.log(req.cookies);

        // let user_Email = req.body.eMail;
        console.log("req.cookies.refreshToken = ");
        console.log(req.cookies.refreshToken);

        let userEmail = req.body.postDataToServer.eMail;
        let mGadgetProcess_ID = req.body.postDataToServer.mGadgetProcess_ID;
        let input_refreshToken = req.cookies.refreshToken;

        let newLogInData = await mUserService.m_f_refreshToken(userEmail, mGadgetProcess_ID, input_refreshToken);

        // заполняем ответ сервера
        let dataFromServer = {
            accessToken: newLogInData.accessToken,
        }

        console.log("=== в респонс добавляем куки, logInData.refreshToken= ");
        console.log(newLogInData.refreshToken);

        // в респонс добавляем куки
        res.cookie('refreshToken', newLogInData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
        // устанавливаем параметры для сохранения куки на клиенте
        // res.header("Access-Control-Allow-Origin", req.headers.origin);
        // res.header('Access-Control-Allow-Metods', 'GET, POST ');
        // res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Credentials', 'true');


        // далее отправляем ответ сервера 
        res.status(200).json(dataFromServer);
        // можно также отправить ответ в ретерне:
        // return (res.status(200).json(dataFromServer));
    }

    //----------------------------------
    async m_test_01_PS(req, res) {

        console.log("=== headers = ");
        console.log(req.headers);

        console.log("=== headers.authorization= ");
        console.log(req.headers.authorization);

        let dataFromServer = "Otvet test_01";
        res.status(200).json(dataFromServer);
    }

}

//========================

class mUserService__constructor {

    async registrationUser(req, res) {
        try {
            let eMail = req.body.postDataToServer.eMail;
            let password = req.body.postDataToServer.password;
            let mGadgetProcess_ID = req.body.postDataToServer.mGadgetProcess_ID;
            let candidateIndex = findUser_Index_inReestr(eMail);
            // нужно исправить - сделать перезапись пользователя в реестре, если его активация не была подтверждена. Иначе польльзователь может занять чужой еМейл и не подтверждая права владения этим еМейлом

            console.log("candidateIndex= " + candidateIndex);

            if ((candidateIndex != null && candidateIndex >= 0) && serverVarriorsDataFromBD_pr0001.users_Reestr[candidateIndex].autorisationData.isActivatedAsseptLink === true) {
                console.log("ПОЛЬЗОВАТЕЛь с таким еМейлом: " + eMail + " - уже ЗАРЕГИСТРИРОВАН");
                throw m_ApiErrors.m_BadRequest("Пользователь с таким еМейлом: " + eMail + " - уже ЗАРЕГИСТРИРОВАН");
                // return "ПОЛЬЗОВАТЕЛь УЖЕ ЗАРЕГИСТРИРОВАНТ";
            }

            // иначе запускаем регистрацию пользователя
            else {
                // хешируем пароль
                let passwordHesh = await bcrypt.hash(password, 3);
                // создаем ремдомную строку для подтверждения е-мейла
                let activationLink = uuidv4();
                // Регистрируем нового пользователя. В дальнейшем удалить пароль в открытом виде password из этой функции и из класса Юзера в шаблонах

                // Если ранее не было попытки создать данного пользователя, которое не было завершенно (т.е. ситуация, когда была запущена регистрация, но не был подтвержден код подтверждения через электронную почту)
                if (!(candidateIndex != null && candidateIndex >= 0)) {
                    // тогда создаем пользователя в реестре
                    console.log("ДОБАВЛЯЕМ НОВОГО ПОЛЬЗОВАТЕЛЯ");
                    serverVarriorsDataFromBD_pr0001.users_Reestr.push(new User_inReestr(
                        myRandomId(),
                        eMail,
                        passwordHesh,
                        null, // это password - не храним его в открытом виде,
                        activationLink));
                    candidateIndex = (serverVarriorsDataFromBD_pr0001.users_Reestr.length) - 1;
                    // Записываем ссылку активации
                    serverVarriorsDataFromBD_pr0001.users_Reestr[candidateIndex].autorisationData.activationLink = activationLink;
                }
                else {
                    // Иначе, если пользователь уже существует (но не активирован) - обновляем ссылку активации
                    serverVarriorsDataFromBD_pr0001.users_Reestr[candidateIndex].autorisationData.activationLink = activationLink;
                }

                saveAllDataHandle();

                // Отправляем на почту нового юзера письмо с подтверждением кода регистрации
                await this.sendActivationMail(eMail, activationLink)
                // генерируем токены
                let newTokens = this.generateTokens({
                    user_Email: eMail,
                    mKuiir: candidateIndex, // это knownUserIndexInReestr - прячем за абревиатурой, чтоб на клиенте не было видно порядковый номер юзера (и приблизительно общ колич.)
                    mGadgetProcess_ID: mGadgetProcess_ID,
                    // passwordHesh: passwordHesh,
                });

                // сохраняем токены ВО ВРЕМЕННОМ ОБЪЕКТЕ для токеноа нового пользователя
                // в след строке мы создаем свойство, название которого создается динамически и соответствует идентификатору Гаджета [mGadgetProcess_ID]
                serverVarriorsDataFromBD_pr0001.users_Reestr[candidateIndex].autorisationData.tokensBeforeRegistration[mGadgetProcess_ID] = newTokens;

                console.log("tokensBeforeRegistration=");
                console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[candidateIndex].autorisationData.tokensBeforeRegistration);

                // ретерним данные
                let returnData = {
                    user_Email: eMail,
                    accessToken: newTokens.accessToken,
                    refreshToken: newTokens.refreshToken,
                }
                return returnData;
            }

        }
        catch (error) {
            console.log("ОШИБКА registrationUser:");
            console.log(error);
            res.status(400).json(error);
        }
    }

    //---------

    // Эту функцию отладить и протестировать после отладки на клиенте
    async changePassword(req, res) {
        try {
            console.log("Запуск changePassword");
            console.log(req.body);

            let eMail = req.body.postDataToServer.user_Email;
            let newPassword = req.body.postDataToServer.newPassword;
            let mGadgetProcess_ID = req.body.postDataToServer.mGadgetProcess_ID;
            let user_Index = findUser_Index_inReestr(eMail);

            console.log("user_Index= " + user_Index);
            if (user_Index != null && user_Index >= 0) {
                console.log("isActivatedAsseptLink= " + serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData.isActivatedAsseptLink);
            }

            if (!(user_Index != null && user_Index >= 0)
                || serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData.isActivatedAsseptLink === false) {
                console.log("При попытке смены пароля - ПОЛЬЗОВАТЕЛь с таким еМейлом: " + eMail + " - НЕ ЗАРЕГИСТРИРОВАН");
                throw m_ApiErrors.m_BadRequest("При попытке смены пароля - ПОЛЬЗОВАТЕЛь с таким еМейлом: " + eMail + " - НЕ ЗАРЕГИСТРИРОВАН");
            }

            // иначе запускаем смену пароля
            else {
                // хешируем пароль
                let changePasswordHesh = await bcrypt.hash(newPassword, 3);
                serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData.changePasswordData.changePasswordHesh_awaitConfirm = changePasswordHesh;
                serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData.changePasswordData.changePassword_awaitConfirm = req.body.postDataToServer.newPassword;

                // создаем ремдомную строку для подтверждения е-мейла
                let activationLink = uuidv4();
                serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData.changePasswordData.changePasswordActivationLink = activationLink;

                // Отправляем на почту нового юзера письмо с подтверждением кода регистрации
                await this.sendMail_changePassword(eMail, activationLink);
                // генерируем токены
                let newTokens = this.generateTokens({
                    user_Email: eMail,
                    mKuiir: user_Index, // это knownUserIndexInReestr - прячем за абревиатурой, чтоб на клиенте не было видно порядковый номер юзера (и приблизительно общ колич.)
                    mGadgetProcess_ID: mGadgetProcess_ID,
                    // passwordHesh: passwordHesh,
                });

                // сохраняем токены ВО ВРЕМЕННОМ ОБЪЕКТЕ для токеноа нового пользователя
                // в след строке мы создаем свойство, название которого создается динамически и соответствует идентификатору Гаджета [mGadgetProcess_ID]
                serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData.changePasswordData.changePassword_newTokens[mGadgetProcess_ID] = newTokens;

                console.log("serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData= ");
                console.log(serverVarriorsDataFromBD_pr0001.users_Reestr[user_Index].autorisationData);

                saveAllDataHandle();

                // ретерним данные
                let returnData = {
                    user_Email: eMail,
                    accessToken: newTokens.accessToken,
                    refreshToken: newTokens.refreshToken,
                }
                return returnData;
            }

        }
        catch (error) {
            console.log("ОШИБКА registrationUser:");
            console.log(error);
            res.status(400).json(error);
        }
    }

    //---------
    async logIn(eMail, password, mGadgetProcess_ID) {

        try {
            console.log("ЗАПУСК logIn ");
            // исправить - при нахождении юзера добавить проверку, что он не только есть в реестре пользователей, но также что он активирован (т.е. подтвердил свою регистрацию)
            let returnData = {};
            let userIndex = findUser_Index_inReestr(eMail);
            console.log("userIndex= " + userIndex);

            if (
                !(userIndex != null && userIndex >= 0)
                || !serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.isActivatedAsseptLink
            ) {
                returnData = {
                    logInResult: "logInError_userIsNotRegistered",
                    user_Email: eMail,
                }
                // прерываем функцию
                return returnData;

                // throw m_ApiErrors.m_BadRequest("Пользователь с таким еМейлом: " + eMail + " - не зарегистрирован");
            }

            // перед продолжением проверяем - не был ли данный пользователь зарегистрирован с пом GoogleService
            if (serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.passwordHesh == "wasAuthByGoogle") {
                returnData = {
                    logInResult: "logInError_userWasAuthByGoogle",
                    user_Email: eMail,
                }
                // прерываем функцию
                return returnData;
            }

            // сравниваем захешированные пароль, переданный пользователем, и находящийся в БД в захешированном виде
            // функция bcrypt.compare сопоставляет переданный клиентом пароль с хахешированным паролем, который сохранен в реестре пользователя. И возвращает либо 'true' либо 'false'
            let isAsseptPassword = await bcrypt.compare(password, serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.passwordHesh);

            if (!isAsseptPassword) {
                returnData = {
                    logInResult: "logInError_invalidPassword",
                    user_Email: eMail,
                }
                // throw m_ApiErrors.m_BadRequest("Введен неверный пароль");
                // прерываем функцию
                return returnData;
            }

            // если все прошло нормально 
            // генерируем нов токен-
            let newUserTokens = this.generateTokens({
                user_Email: eMail,
                mKuiir: userIndex, // это knownUserIndexInReestr - прячем за абревиатурой, чтоб на клиенте не было видно поря
                mGadgetProcess_ID: mGadgetProcess_ID,
                // passwordHesh: serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].autorisationData.passwordHesh,
            });

            // сохраняем новый refreshToken в реестр нового пользователя. Генерируем нов токен для того, чтобы автоматически продлевать время действия Рефреш токна. Но в этом случае будет происходить выбрасывания этого же юзера из других его устройств. Впоследствии исправить - проверять, имеется ли действующий токен для данного пользователя с другого устройства, и если время его действия не истекло - тогда не перезаписывать токен, а отправлять в ответе существующий токен. Правда, в этом случае не будет продлеваться время действия рефреш-токена. В общем нужно продумать решение этой задачи.
            await this.saveUserTokens(eMail, mGadgetProcess_ID, newUserTokens);

            // ретерним данные
            returnData = {
                logInResult: "logIn_Ok",
                user_Email: eMail,
                accessToken: newUserTokens.accessToken,
                refreshToken: newUserTokens.refreshToken,
            }
            return returnData;


        } catch (error) {

        }


    }

    //---------
    async m_f_refreshToken(userEmail, mGadgetProcess_ID, refreshToken) {
        try {
            console.log("ЗАПУСК refresh ");
            // в след условии проверяем: если токен отсутствует - след пользователь не авторизован
            if (!refreshToken) {
                console.log("=== ОШИБКА ТУТ ===");
                throw m_ApiErrors.m_UnauthorizedError();
            }
            // далее валидируем токен
            // в переменную mValidateRefreshToken будут помещены зашитые в токен данные пользователя (логин, пароль)
            let mValidateRefreshToken = this.validateRefreshToken(refreshToken); // возвращает либо содержимое токена, либо "null"
            console.log("ВАЛИДАЦИЯ RefreshToken, =");
            console.log(mValidateRefreshToken);

            let findUserIndex = findUser_Index_inReestr(userEmail);
            console.log("findUserIndex =" + findUserIndex);

            if (!mValidateRefreshToken || !(findUserIndex != null && findUserIndex >= 0)) {
                throw m_ApiErrors.m_UnauthorizedError()
            }
            // если предыдущие валидации пройдены - генерируем новую пару токенов
            let mNewPayload = {
                user_Email: serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].user_Email,
                mKuiir: findUserIndex, // это knownUserIndexInReestr - прячем за абревиатурой, чтоб на клиенте не было видно поря
                mGadgetProcess_ID: mGadgetProcess_ID,
                // passwordHesh: serverVarriorsDataFromBD_pr0001.users_Reestr[findUserIndex].autorisationData.passwordHesh,
            }
            let newUserTokens = this.generateTokens(mNewPayload);
            // сохраняем токен (только refreshToken) в реестр нового пользователя. Впоследствии исправить - проверять, имеется ли действующий токен для данного пользователя с другого устройства, и если время его действия не истекло - тогда не перезаписывать токен, а отправлять в ответе существующий токен. 
            await this.saveUserTokens(mNewPayload.user_Email, mGadgetProcess_ID, newUserTokens);
            return mNewtoken;

        }
        catch (error) {
            console.log("ОШИБКА m_f_refreshToken:");
            console.log(error);
            return null;
        }
    }

    //---------
    async sendActivationMail(emailNewUser, activationLink) {
        // тут используется nodemailer - импортируемый класс со встроенными методами

        try {

            const transporterMail = nodemailer.createTransport({
                host: "smtp.ukr.net",
                port: 2525, // раньше был 465  порт, но инменили настройки на ukr.net, см. инфо тут: https://wiki.ukr.net/_detail/pass_1_new.png?id=manageimapaccess
                secure: true,
                auth: {
                    user: "ole-t@ukr.net",
                    pass: "4Cva1p8O70aoFYK2"   // это сгенерированный пароль от ukr.net для входа  в IMAP
                    // pass: "le13579oleqwe-----ol-t&&354", // это мой пароль для входа в почту
                },
            });

            await transporterMail.sendMail({
                from: "ole-t@ukr.net",
                to: emailNewUser,
                subject: "Регистрация нового пользователя на сервере:  litepm.com",
                text: "",
                html: '<div> <h3> Для завершения регистрации перейдите по ссылке <br/> (данная ссылка действительна в течение 15 мин.): </h3> <a href= " '
                    // далее идет код гиперсылки - GET-запроса, который сработает, когда пользователь кликнет по ссылке подтверждения авторизации 
                    // + 'http://localhost:5075'
                    + config_pr0001.serverAdress
                    // далее вставляем endPoint
                    + '/activate/'
                    + activationLink
                    + ' " > '

                    + activationLink
                    + ' </a> </div>'

                    + '<div> <h4>  <br/> * Данная ссылка сработает один раз, и действительна в течение 15 мин. Иначе нужно будет повторпить регистрацию. </h4>'
            })
            /* 
            .then(mRes => {
                console.log("ПОЛУЧЕН ОТВЕТ ИЗ 'sendMail' :");
                console.log(mRes);
            })
             */
        }
        catch (error) {
            console.log("Ошибка из sendActivationMail: " + error);
            return ("Ошибка из sendActivationMail " + error);

        }


    }

    //---------
    // Эту функцию отладить и протестировать после отладки на клиенте
    async sendMail_changePassword(eMail, activationLink) {
        // тут используется nodemailer - импортируемый класс со встроенными методами

        try {

            const transporterMail = nodemailer.createTransport({
                host: "smtp.ukr.net",
                port: 2525, // раньше был 465  порт, но инменили настройки на ukr.net, см. инфо тут: https://wiki.ukr.net/_detail/pass_1_new.png?id=manageimapaccess
                secure: true,
                auth: {
                    user: "ole-t@ukr.net",
                    pass: "4Cva1p8O70aoFYK2"   // это сгенерированный пароль от ukr.net для входа  в IMAP
                    // pass: "le13579oleqwe-----ol-t&&354", // это мой пароль для входа в почту
                },
            });

            await transporterMail.sendMail({
                from: "ole-t@ukr.net",
                to: "ole-t@i.ua", // eMail, // исправить изменить
                subject: "Смена/восстановление пароля на сервере:  litepm.com",
                text: "",
                html: '<div> <h3> Для подтверждения изменения пароля перейдите по ссылке <br/> (данная ссылка действительна в течение 15 мин.): </h3> <a href= " '
                    // далее идет код гиперсылки - GET-запроса, который сработает, когда пользователь кликнет по ссылке подтверждения авторизации 
                    // + 'http://localhost:5075'
                    + config_pr0001.serverAdress
                    // далее вставляем endPoint
                    + '/confirmChangePassword/'
                    + activationLink
                    + ' " > '

                    + activationLink
                    + ' </a> </div>'

                    + '<div> <h4>  <br/> * Данная ссылка действительна в течение 15 мин. </h4>'
            })
            /* 
            .then(mRes => {
                console.log("ПОЛУЧЕН ОТВЕТ ИЗ 'sendMail' :");
                console.log(mRes);
            })
             */
        }
        catch (error) {
            console.log("Ошибка из sendMail_changePassword: " + error);
            return ("Ошибка из sendMail_changePassword " + error);

        }


    }

    //---------
    generateTokens(payLoad) {

        let accessToken = jwt.sign(payLoad, mySecretKey_forAccessToken, { expiresIn: '10d' });
        let refreshToken = jwt.sign(payLoad, mySecretKey_forRefreshToken, { expiresIn: '300d' });
        return { accessToken, refreshToken };
    }

    //---------
    // исправить позже след функцию - чтобы выполнялась проверка перед перезаписыванием токена, проверять срок действия токена. Если оставить как есть - то при каждом перезаписывании будет плокироваться доступ с разных устройств одновременно для каждого юзера
    async saveUserTokens(user_Email, mGadgetProcess_ID, newUserTokens) {

        try {
            let finedUserIndex = findUser_Index_inReestr(user_Email);
            if (finedUserIndex != null && finedUserIndex >= 0) {
                // в след строке мы создаем свойство, название которого создается динамически и соответствует идентификатору Гаджета [mGadgetProcess_ID]
                serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets[mGadgetProcess_ID] = {
                    accessToken: newUserTokens.accessToken,
                    refreshToken: newUserTokens.refreshToken,
                }
            }
        }
        catch (error) {
            console.log("ОШИБКА saveUserTokens:");
            console.log(error);
        }
    }

    //---------
    validateAccessToken(accessToken) {
        try {
            let userData = jwt.verify(accessToken, mySecretKey_forAccessToken);
            return userData;
        } catch (error) {
            return null;
        }
    }

    //---------
    validateRefreshToken(refreshToken) {
        try {
            // по факту функция verify расшифровует и возвращает содержимое токена
            let userData = jwt.verify(refreshToken, mySecretKey_forRefreshToken);
            return userData;
        } catch (error) {
            return null;
        }
    }

}
let mUserService = new mUserService__constructor();


//========================

class mFile_service_constructor {

    add_fileModel_inFileListOfProject(
        parentAdmin_ID,
        project_ID,
        file_ID,
        file_name,
        file_type,
        file_size,
        senderFile
    ) {
        // добавляем запись в реестр файлов
        try {
            let findProjectIndex = findProjectIndex_inBD(project_ID);
            serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].attachedFiles.filesList.push(new FOLDERS_FILES_MODELS.file_model(
                parentAdmin_ID,
                project_ID,
                file_ID,
                file_name,
                file_type,
                file_size,
                senderFile
            ));
            console.log("Успешно добавлен в РЕЕСТР");
            console.log("Новый список файлов=");
            console.log(serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].attachedFiles.filesList);

        } catch (error) {
            console.log("Ошибка добавления файла в реестр: " + error);
        }
    }
    //---------
    delete_fileModel_inFileListOfProject(project_ID, file_ID) {
        // дбавляем 
        let findProjectIndex = findProjectIndex_inBD(project_ID);
        if (findProjectIndex != null && findProjectIndex >= 0) {
            let findFileIndexInList = serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].attachedFiles.filesList.findIndex(item => item.file_ID == file_ID);
            if (findFileIndexInList != null && findFileIndexInList >= 0) {
                serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].attachedFiles.filesList.splice(findFileIndexInList, 1);
            }
        }
    }
    //---------    
    async createDir(user_Email, project_ID) {
        console.log("ЗАПУСК createDir... ");
        try {
            // создаем родительскую папку Юзера
            // let path_1 = '.../DataBase/uploadFiles/' + user_Email;
            let path_1 = get_valid_adress_fileOrFolder(config_pr0001.local_files_forder_Adress + 'uploadFiles/' + user_Email);

            if (!fs.existsSync(path_1)) {
                fs.mkdirSync(path_1);
            }

            // создаем вложенную папку проекта
            // проверить правильность адреса
            let path_2 = path_1 + '/' + project_ID;
            // пропускаем адрес через встроенную функцию, чтобы откорректировать правильность адреса
            // проверить правильность адреса
            path_2 = path.resolve(path_2);

            if (!fs.existsSync(path_2)) {
                fs.mkdirSync(path_2);
            }

            return path_2;

        } catch (error) {
            console.log("Ошибка при создании папки: " + error);
        }

    }
    //---------
    async deleteSubDir(project_ID) {

    }
    //---------
    async upLoadFiles(req) {
        // Это функция загрузки НЕСКОЛЬКИХ файлов
        console.log("==========================");
        console.log("Запуск upLoadFiles");
        console.log("req.body= ");
        console.log(req.body);

        let user_Email = req.body.user_Email;
        let project_ID = req.body.project_ID;
        let newFilesList = null;

        // загружаем файл
        try {
            // создаем папку для файлов проекта
            let pathSaveFile = await this.createDir(user_Email, project_ID);
            console.log("pathSaveFile= " + pathSaveFile);
            // извлекаем файлы из запроса

            let m_files = req.files.m_files;
            console.log("m_files= ");
            console.log(m_files);

            // ВАЖНО - далее проверяем - если вложен один файл - тогда m_files представляет один объект, если несколько файлов - тогда массив объектов. 
            // Если прислан один файл (соотв один объект) - преобразовываем его в массив с одним объектом.
            // ЭТО ВАЖНО - для дальнейшей обработки преобразуем одиночный m_files в массив с одним элементом. Поскольку дальнейший алгоритм предусматривает возможность добавления группы файов
            // Итак, если m_files предстваляет не массив, а один объект - преобразовываем его в массив с одним объектом
            if (!(Array.isArray(m_files))) {
                m_files = [m_files];
            }
            console.log(" ======= m_files после адаптации для единичного файла= ");
            console.log(m_files);

            // проверяем, есть ли свободное место на диске для данного пользователя
            let summaryFilesSize = 0;
            m_files.forEach(item => {
                summaryFilesSize += item.size;
            });
            console.log(" ======= summaryFilesSize= " + summaryFilesSize);
            let user_INDEX_inReestr = findUser_Index_inReestr(user_Email);
            if (summaryFilesSize > serverVarriorsDataFromBD_pr0001.users_Reestr[user_INDEX_inReestr].tarif_plan.max_diskSpace_forUploadFiles - serverVarriorsDataFromBD_pr0001.users_Reestr[user_INDEX_inReestr].tarif_plan.used_diskSpace) {
                console.log("Ошибка - У данного пользователя недостаточно места для загрузки файлов ");
                newFilesList = "Ошибка - У данного пользователя недостаточно места для загрузки файлов ";
                return ("Ошибка - У данного пользователя недостаточно места для загрузки файлов ");
            }

            // далее запись файлов на диск:
            m_files.forEach(item => {
                try {
                    let arrayOfName = item.name.split(["."]);
                    // выявляем расширение файла                    
                    let endOfName = arrayOfName[(arrayOfName.length) - 1];
                    // выявляем имя файла без расширения
                    let clearName = arrayOfName.slice(0, (arrayOfName.length) - 1);

                    // производим фактическую запись файлов на диск:
                    // в качестве имени файла на сервере используем ID + расширение файла
                    let file_ID = myRandomId();
                    let newFileNameOnServer = file_ID + "." + endOfName;
                    let fullPathAndName = pathSaveFile + '/' + newFileNameOnServer;
                    item.mv(fullPathAndName);

                    // в случ успешной загрузки
                    // Добавляем информацию о файле в реестр файлов
                    try {
                        this.add_fileModel_inFileListOfProject(
                            user_Email,
                            project_ID,
                            newFileNameOnServer, // в качестве ШВ - используем ID - серверное имя  файла вместе с расширением
                            item.name,
                            endOfName,
                            item.size,
                            user_Email  // исправить  - ввести имя отправителя, а не админа папки
                        );
                        console.log("Файл успешно добавлен файла в реестр");
                    } catch (error) {
                        console.log("Ошибка добавления файла в реестр: " + error);
                    }

                    // Суммируем размер загруженных файлов в реестре для данного админа
                    try {
                        serverVarriorsDataFromBD_pr0001.users_Reestr[user_INDEX_inReestr].tarif_plan.used_diskSpace += item.size;
                        console.log("Размер файла успешно добавлен к размеру файлов в реестре");
                        // console.log("used_diskSpace= " + serverVarriorsDataFromBD_pr0001.users_Reestr[user_INDEX_inReestr].tarif_plan.used_diskSpace);
                    } catch (error) {
                        console.log("Ошибка суммирования размера файлов в реестре: " + error);
                    }

                    // ренерним новый список файлов
                    let findProjectIndex = findProjectIndex_inBD(project_ID);
                    newFilesList = serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].attachedFiles.filesList;
                    // console.log("Новый список файловdataBD_fromServer.projects[findProjectIndex].attachedFiles.filesList=: ");
                    // console.log(serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].attachedFiles.filesList);

                } catch (error) {
                    console.log("Ошибка записи файла: " + error);
                    newFilesList = "Ошибка при upLoadFile: " + error;
                    return ("Ошибка записи файла: " + error);
                }
            })

        } catch (error) {
            console.log("Ошибка при upLoadFile: " + error);
            newFilesList = "Ошибка при upLoadFile: " + error;
            return ("Ошибка при upLoadFile: " + error);
        }

        console.log("После добавления newFilesList= ");
        console.log(newFilesList);
        return newFilesList;

    }

    //---------
    async deleteFile(user_Email, project_ID, file_ID) {
        try {
            // let pathDeleteDir = '.../DataBase/uploadFiles/' + user_Email + '/' + project_ID + '/';
            let pathDeleteFile = get_valid_adress_fileOrFolder(config_pr0001.local_files_forder_Adress + 'uploadFiles/' + user_Email + '/' + project_ID + '/');

            if (fs.existsSync(pathDeleteFile)) {
                fs.unlinkSync(pathDeleteFile); // удаляем файл
                console.log("Файл успешно удален: " + file_ID);
            }
            else {
                console.log("Файл не найден при попытке удаления с диска: " + file_ID);
            }

            // в случ успешного удаления файла - удаляем информацию из реестра файлов

        } catch (error) {
            console.log("Ошибка при deleteFile: " + error);
        }

    }

    //---------
    async upLoadOneFile(req) {
        // функция загрузки одного файла
        console.log("==========================");
        console.log("Запуск downLoadOneFile");

        let newFilesList = null;
        // загружаем файл
        try {
            console.log("req.body= ");
            console.log(req.body);

            let user_Email = req.body.user_Email;
            let project_ID = req.body.project_ID;
            let newFile = req.files.m_oneFile;


            console.log("newFile= ");
            console.log(newFile);

            // создаем папку для файлов проекта
            let pathSaveFile = await this.createDir(user_Email, project_ID);
            console.log("pathSaveFile= " + pathSaveFile);
            // проверяем, есть ли свободное место на диске для данного пользователя
            let user_INDEX_inReestr = findUser_Index_inReestr(user_Email);
            if (newFile.size > serverVarriorsDataFromBD_pr0001.users_Reestr[user_INDEX_inReestr].tarif_plan.max_diskSpace_forUploadFiles - serverVarriorsDataFromBD_pr0001.users_Reestr[user_INDEX_inReestr].tarif_plan.used_diskSpace) {
                console.log("Ошибка - У данного пользователя недостаточно места для загрузки файлов ");
                return ("Ошибка - У данного пользователя недостаточно места для загрузки файлов ");
            }

            // далее запись файла на диск:

            let arrayOfName = newFile.name.split(["."]);
            // выявляем расширение файла                    
            let endOfName = arrayOfName[(arrayOfName.length) - 1];
            // выявляем имя файла без расширения
            let clearName = arrayOfName.slice(0, (arrayOfName.length) - 1);
            // производим фактическую запись файлов на диск:
            // в качестве имени файла на сервере используем ID + расширение файла
            let file_ID = myRandomId();
            let newFileNameOnServer = file_ID + "." + endOfName;
            let fullPathAndName = pathSaveFile + '/' + newFileNameOnServer;
            newFile.mv(fullPathAndName);
            // в случ успешной загрузки
            // Добавляем информацию о файле в реестр файлов
            try {
                this.add_fileModel_inFileListOfProject(
                    user_Email,
                    project_ID,
                    newFileNameOnServer, // в качестве ШВ - используем ID - серверное имя  файла вместе с расширением
                    newFile.name,
                    endOfName,
                    newFile.size,
                    user_Email  // исправить  - ввести имя отправителя, а не админа папки
                );
                console.log("Файл успешно добавлен файла в реестр");
            } catch (error) {
                console.log("Ошибка добавления файла в реестр: " + error);
            }
            // Суммируем размер загруженных файлов в реестре для данного админа
            try {
                serverVarriorsDataFromBD_pr0001.users_Reestr[user_INDEX_inReestr].tarif_plan.used_diskSpace += newFile.size;
                console.log("Размер файла успешно добавлен к размеру файлов в реестре");
            } catch (error) {
                console.log("Ошибка суммирования размера файлов в реестре: " + error);
            }

            // ренерним новый список файлов
            let findProjectIndex = findProjectIndex_inBD(project_ID);
            newFilesList = serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndex].attachedFiles.filesList;



        } catch (error) {
            console.log("Ошибка записи файла при upLoadFile: " + error);
            newFilesList = "Ошибка записи файла при upLoadFile: " + error;
            return ("Ошибка записи файла при upLoadFile: " + error);
        }

        console.log("После добавления newFilesList= ");
        console.log(newFilesList);
        return newFilesList;
    }
    //---------
    // УДАЛИТЬ ЭТОТ СТАРЫЙ ВАРИАНТ
    /*     
        async downLoadOneFile(admin_ID, project_ID, file_ID, res) {
            // загружаем файл
            try {
                // определяем путь папки для поиска файла
                let pathLoadDir = '.../DataBase/uploadFiles/' + admin_ID + '/' + project_ID + '/';
                let pathLoadFile = pathLoadDir + file_ID;
                console.log("pathLoadFile= ");
                console.log(pathLoadFile);
    
                if (fs.existsSync(pathLoadFile)) {
                    return res.download(pathLoadFile, file_ID);
                }
                else {
                    console.log("Файл не найден: " + file_ID);
                    return res.status(400).json("Файл не найден: " + file_ID);
                }
    
            } catch (error) {
                console.log("Ошибка при downLoadOneFile: " + error);
                return res.status(400).json("Ошибка при downLoadOneFile: " + error);
            }
        }
     */
    //---------
    // эта функция возвращает фавктический список файлов на диске
    async getFilesList(user_Email, project_ID) {

        try {
            // let path_Dir = './uploadFiles/' + user_Email + '/' + project_ID + '/';
            let path_Dir = get_valid_adress_fileOrFolder('/uploadFiles/' + user_Email + '/' + project_ID + '/');

            if (fs.existsSync(path_Dir)) {
                // let filesList = fs.readdirSync(path_Dir);
                let filesList = fs.readdirSync(path_Dir);
                return filesList;
            }
            else {
                console.log("Файлы отсутствуют");
                return ("Файлы отсутствуют");
            }

            // в случ успешного удаления файла - удаляем информацию из реестра файлов

        } catch (error) {
            console.log("Ошибка getFilesList: " + error);
        }
    }

}
// создаем экземпляр класса для быстрого доступа к методам класса
let mFile_service = new mFile_service_constructor();
//----------------------------------
function responseLongPoolling(responseLongPoolling_Data) {
    console.log("Запуск responseLongPoolling:");
    for (let i = 0; i < serverVarriorsDataFromBD_pr0001.listForResponse.length; i++) {
        serverVarriorsDataFromBD_pr0001.listForResponse[i].user_ResStack.forEach((mCallBack) => {
            //  console.log("Сработала отправка ответа forEach");
            mCallBack(responseLongPoolling_Data);
        });
    }
    // очищаем реестр подписок     
    serverVarriorsDataFromBD_pr0001.listForResponse = [];
    //  console.log("Состояние serverVarriorsDataFromBD_pr0001.listForResponse после очистки:");
    //  console.log(serverVarriorsDataFromBD_pr0001.listForResponse);
}
//----------------------------------
function findUser_Index_inReestr(user_Email, knownIndexInReestr) {
    // определяем индекс  юзера по ID
    let findIndex = serverVarriorsDataFromBD_pr0001.users_Reestr.findIndex(item => item.user_Email == user_Email);
    //  console.log("findIndex= "+findIndex);    
    return findIndex;
}
//----------------------------------
function find___Or_Find_And_Add_NewUserInReestr(user_Email) {
    let findIndex = null;
    findIndex = findUser_Index_inReestr(user_Email);
    // если массив пустой - добавляем пользователя
    if (!(findIndex != null && findIndex >= 0)) {
        // добавляем пользователя
        serverVarriorsDataFromBD_pr0001.users_Reestr.push(new User_inReestr(
            myRandomId(),
            user_Email,
            null,
            null,
            null));
        // повторно запускаем поиск индекса
        findIndex = findUser_Index_inReestr(user_Email);
    }
    return findIndex;
}
//----------------------------------
function findProjectIndex_inAccessProjects_inReestr(userIndexInReestr, project_ID) {
    return serverVarriorsDataFromBD_pr0001.users_Reestr[userIndexInReestr].accessProjects.findIndex(item => item.project_ID === project_ID);
}
//----------------------------------
function add_AccessProjectsForUser_inReestr(user_Email, project_ID, role, defaultAdminForThisProject) {
    //  console.log("---");
    //  console.log("Функция add_AccessProjectsForUser_inReestr");
    // добавляем данные в массив реестр Юзер - доступные проекты
    let index = find___Or_Find_And_Add_NewUserInReestr(user_Email);
    serverVarriorsDataFromBD_pr0001.users_Reestr[index].accessProjects.push(new User_AccessProjects(project_ID, role, defaultAdminForThisProject));
    // сохраняем данные в БД реестhа
    need_SaveData = true;
}
//---------------------
function delete_UsersInReestr_forCurrentProject(project_ID, deleteListForTeam) {
    // проверяем, если "deletedUsersList" не существует - прерываем функцию
    if (!deleteListForTeam || deleteListForTeam.length < 1) return;
    // проходим по списку, и для каждого удаленного пользователя уделяем запись в реестре
    deleteListForTeam.forEach(
        (item) => {
            // находим пользователя в реестре 
            let userIndexInReeatr = findUser_Index_inReestr(item.user_Email);
            // в списке доступных проектов найденного пользователя - находим проект, который нужно удалить:
            let projectIndex_InAccessProjects = findProjectIndex_inAccessProjects_inReestr(userIndexInReeatr, project_ID);
            //если проект наден (projectIndex_InAccessProjects>=0), тогда удаляем проект из списка в реестре
            if (projectIndex_InAccessProjects != null && projectIndex_InAccessProjects >= 0) {
                serverVarriorsDataFromBD_pr0001.users_Reestr[userIndexInReeatr].accessProjects.splice(projectIndex_InAccessProjects, 1);
            }
        }
    )
    need_SaveData = true;
}
//---------------------
// эта функция в реестре пользователей - для конкретного пользователя - в списке доступгых проектов - добавлет новый доступный проект, либо изменяет параметры уже добавленного проекта (например изменяет роль этого юзера в этом проекте)
function add_or_update___UsersInReestr_forCurrentProject(project_ID, newTeamForProject, defaultAdminForThisProject) {
    // копируем новый teamList из запроса
    newTeamForProject.forEach(
        (item) => {
            // находим пользователя в реестре, а при его отсутствии - добавляем его и возвращаем индекс
            let userIndexInReestr = find___Or_Find_And_Add_NewUserInReestr(item.user_Email);
            // в списке доступных проектов данного пользователя пытвемся найти индекс нужного проекта
            let projectIndex_InAccessProjects = findProjectIndex_inAccessProjects_inReestr(userIndexInReestr, project_ID);
            // если проекь присутствует в списке пользователя - обновляем перезаписываем данные проекта
            if (projectIndex_InAccessProjects != null && projectIndex_InAccessProjects >= 0) {
                serverVarriorsDataFromBD_pr0001.users_Reestr[userIndexInReestr].accessProjects[projectIndex_InAccessProjects] = new User_AccessProjects(project_ID, item.userRole, defaultAdminForThisProject);
            }
            // иначе добавляем проект в список  доступных проектов пользователя
            else {
                serverVarriorsDataFromBD_pr0001.users_Reestr[userIndexInReestr].accessProjects.push(
                    new User_AccessProjects(project_ID, item.userRole, defaultAdminForThisProject)
                );
            }
        }
    )

}
//----------------------------------
function dataPreparation_ForCurrentClient_TopData(user_Email) {
    //  console.log("ЗАПУСК item.dataPreparation_ForCurrentClient_TopData ");

    let adaptionFilterData_resFtomServ = { projects: [] };
    // находим юзера в реестре
    let clientIndex_InReestr = serverVarriorsDataFromBD_pr0001.users_Reestr.findIndex(item => item.user_Email == user_Email);
    // если пользователь не найден - возвращаем пустые данные
    if (!clientIndex_InReestr) return adaptionFilterData_resFtomServ;

    // далее проходим по массиву, и по каждому найденному проекту - находим данный проект в БД и копируем из него данный в результирующий массив
    serverVarriorsDataFromBD_pr0001.users_Reestr[clientIndex_InReestr].accessProjects.forEach(
        (item) => {
            // для текущего проекта находим его индекс в БД:
            let findProjectIndexInBD = findProjectIndex_inBD(item.project_ID);

            if (findProjectIndexInBD >= 0) {
                // добавляем данные в результирующий массив
                adaptionFilterData_resFtomServ.projects.push(serverVarriorsDataFromBD_pr0001.projects_DB[findProjectIndexInBD]);

                // пристегиваем к данным по каждому проекту индивидуальную информацию о последнем времени просмотра этого проекта конкретным пользователем
                if (item.time_individual_wasReadEvents) {

                    //  console.log("item.time_individual_wasReadEvents= ");
                    //  console.log(item.time_individual_wasReadEvents);

                    adaptionFilterData_resFtomServ.projects[(adaptionFilterData_resFtomServ.projects.length) - 1].time_individual_wasReadEvents = item.time_individual_wasReadEvents;
                }
            }
            else {
                //  console.log(".............");
                //  console.log("ПРОБЛЕМА !!!!!!!!!!!!!!!!!!!!!!!!!!!!! В dataPreparation_ForCurrentClient_TopData:");
                //  console.log("Проект c ID= " + item.project_ID + "НЕ НАЙДЕН В БАЗЕ ДАННЫХ");
            }
            //  console.log("adaptionFilterData_resFtomServ.project= ");
            //  console.log(adaptionFilterData_resFtomServ.projects);
        }
    )
    // пристегиваем список собственных корп аккаунтов
    adaptionFilterData_resFtomServ.corpAccounts = serverVarriorsDataFromBD_pr0001.users_Reestr[clientIndex_InReestr].corpAccounts;

    // пристегиваем данные аккаунта
    // делаем копию данных
    adaptionFilterData_resFtomServ.userReestrPersonalData = JSON.parse(JSON.stringify(serverVarriorsDataFromBD_pr0001.users_Reestr[clientIndex_InReestr]));
    // удаляем из ответа серверу секретные данные юзера
    delete adaptionFilterData_resFtomServ.userReestrPersonalData.autorisationData;
    return adaptionFilterData_resFtomServ;
}
//----------------------------------
function findProjectIndex_inBD(project_ID) {
    if (serverVarriorsDataFromBD_pr0001.projects_DB) {
        let findProjectIndexInBD = serverVarriorsDataFromBD_pr0001.projects_DB.findIndex(item => item.project_ID === project_ID);
        return findProjectIndexInBD;
    }
    else return null;
}
//----------------------------------
function find_subProject_Index_inBD(main_Project_ID, subProject_ID) {
    let main_ProjectIndex = findProjectIndex_inBD(main_Project_ID);
    let sub_ProjectIndex = -1;
    if (main_ProjectIndex != null && main_ProjectIndex >= 0) {
        sub_ProjectIndex = serverVarriorsDataFromBD_pr0001.projects_DB[main_ProjectIndex].subProjects.findIndex(item => item.subProject_ID === subProject_ID);
    }
    return sub_ProjectIndex;
}
//----------------------------------
function findProjectIndex_InCurrentUserReestr(userIndex_inReestr, project_ID) {
    // console.log("ЗАПУСК findProjectIndex_InCurrentUserReestr");
    // console.log("userIndex_inReestr= "+userIndex_inReestr);
    // console.log("project_ID= "+project_ID);
    if (userIndex_inReestr != null && userIndex_inReestr >= 0) {
        let findProjectIndexInCurrentUserReedtr = serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex_inReestr].accessProjects.findIndex(item => item.project_ID === project_ID);
        return findProjectIndexInCurrentUserReedtr;
    }
    else return null;
}
//----------------------------------
function find_subProjectIdex_InCurr_User_Reestr(userIndex_inReestr, project_INDEX, subProject_ID) {
    // console.log("=== ЗАПУСК find_subProjectIdex_InCurr_User_Reestr");
    let finded_subProjectIndex_InCurrentUserReestr = serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex_inReestr].accessProjects[project_INDEX].time_individual_wasReadEvents.subProjects_individual_WAS_READ_EVENTS.findIndex(item => item.subProject_ID === subProject_ID);
    if (finded_subProjectIndex_InCurrentUserReestr != null && finded_subProjectIndex_InCurrentUserReestr >= 0) {
        // console.log("=== finded_subProjectIndex_InCurrentUserReestr");
        // console.log(finded_subProjectIndex_InCurrentUserReestr);
        return finded_subProjectIndex_InCurrentUserReestr;
    }
    else return null;
}
//----------------------------------
// получение объекта времени по предварительно определенным индексам
/* 
function get_object_WasReadEvents_forSubproject___BY_INDEXES(userIndex_inReestr, project_INDEX, subProject_INDEX) {
    let finedData = null;
    try {
        let finedData = serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex_inReestr].accessProjects[project_INDEX].time_individual_wasReadEvents.subProjects_individual_WAS_READ_EVENTS[subProject_INDEX];

        return finedData;
    } catch (error) {
        console.log("ОШИБКА get_object_WasReadEvents_forSubproject");
        console.log(error);
    }
}
 */
//----------------------------------
// получение объекта времени просмотра по входящим ID
function get_object_WasReadEvents_forSubproject___BY_ID(user_Email, project_ID, subProject_ID) {

    console.log(" ");
    console.log("ЗАПУСК get_object_WasReadEvents_forSubproject___BY_ID");

    let finedData = null;
    // находим юзера в реестре
    let finedUserIndex = findUser_Index_inReestr(user_Email);
    // console.log("finedUserIndex=" + finedUserIndex);
    if (finedUserIndex != null && finedUserIndex >= 0) {
        // находим проект в реестре данного юзера
        let finedProjectIdex_InCurr_Us_Reestr = findProjectIndex_InCurrentUserReestr(finedUserIndex, project_ID);

        if (finedProjectIdex_InCurr_Us_Reestr != null && finedProjectIdex_InCurr_Us_Reestr >= 0) {
            // находим субпроект в проекте реестра юзера
            let fined_subProjectIndex_InCurr_Us_Reestr = find_subProjectIdex_InCurr_User_Reestr(finedUserIndex, finedProjectIdex_InCurr_Us_Reestr, subProject_ID);

            // console.log("finedProjectIdex_InCurr_Us_Reestr=" + finedProjectIdex_InCurr_Us_Reestr);

            if (fined_subProjectIndex_InCurr_Us_Reestr != null && fined_subProjectIndex_InCurr_Us_Reestr >= 0) {
                try {
                    finedData = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].accessProjects[finedProjectIdex_InCurr_Us_Reestr].time_individual_wasReadEvents.subProjects_individual_WAS_READ_EVENTS[fined_subProjectIndex_InCurr_Us_Reestr];
                    // console.log("ОБЪЕКТ get_object_WasReadEvents_forSubproject = ");
                    // console.log(finedData);
                } catch (error) {
                    console.log("ОШИБКА get_object_WasReadEvents_forSubproject___BY_ID");
                    console.log(error);
                    return null;
                }
            }
        }
    }
    console.log("finedData=");
    console.log(finedData);
    console.log(" ");
    return finedData;

}
//----------------------------------
// получение объекта времени просмотра событий проекта для конкретного пользователя по входящим ID
function get_object_WasReadEvents_forProject___BY_ID(user_Email, project_ID) {
    console.log("ЗАПУСК get_object_WasReadEvents_forProject___BY_ID");

    let finedData = null;
    // находим юзера в реестре
    let finedUserIndex = findUser_Index_inReestr(user_Email);
    console.log("finedUserIndex=" + finedUserIndex);
    if (finedUserIndex != null && finedUserIndex >= 0) {
        // находим проект в реестре данного юзера
        let finedProjectIdex_InCurr_Us_Reestr = findProjectIndex_InCurrentUserReestr(finedUserIndex, project_ID);
        console.log("finedProjectIdex_InCurr_Us_Reestr=" + finedProjectIdex_InCurr_Us_Reestr);
        if (finedProjectIdex_InCurr_Us_Reestr != null && finedProjectIdex_InCurr_Us_Reestr >= 0) {
            try {
                finedData = serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].accessProjects[finedProjectIdex_InCurr_Us_Reestr].time_individual_wasReadEvents;
            } catch (error) {
                console.log("ОШИБКА get_object_WasReadEvents_forProject___BY_ID");
                console.log(error);
                return null;
            }
        }
    }
    return finedData;
}

//----------------------------------
// получение объекта времени по предварительно с нуля по входящим ID
function get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID(user_Email, project_ID, subProject_ID) {
    console.log("ЗАПУСК get_OR_add_and_get___object_WasReadEvents_forSubproject___BY_ID");
    let finedData = null;
    finedData = get_object_WasReadEvents_forSubproject___BY_ID(user_Email, project_ID, subProject_ID);
    // если объект не найден - тогда создаем его
    if (!finedData) {
        // console.log("НЕ НАЙДЕН object_WasReadEvents_forSubproject, создаем его:");
        // console.log(finedData);
        let finedUserIndex = findUser_Index_inReestr(user_Email);
        if (finedUserIndex != null && finedUserIndex >= 0) {
            let finedProjectIdex_InCurr_Us_Reestr = findProjectIndex_InCurrentUserReestr(finedUserIndex, project_ID);
            if (finedProjectIdex_InCurr_Us_Reestr != null && finedProjectIdex_InCurr_Us_Reestr >= 0) {
                // создаем субпроект в проекте реестра юзера
                console.log("Создаем объект просмотра времени субпроекта, пользователь " + user_Email + ", субпроект " + subProject_ID);

                serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].accessProjects[finedProjectIdex_InCurr_Us_Reestr].time_individual_wasReadEvents.subProjects_individual_WAS_READ_EVENTS.push(new SubProjectEvents_inUserReestr(subProject_ID));

                saveAllDataHandle();

                finedData = get_object_WasReadEvents_forSubproject___BY_ID(user_Email, project_ID, subProject_ID);
            }
            else {
                console.log("ОШИБКА -  finedProjectIdex_InCurr_Us_Reestr НЕ НАЙДЕН");
            }
        }
    }

    console.log("finedData FINALL =");
    console.log(finedData);
    return finedData;

}
//----------------------------------
function find_chatIndex_in_chatBD(project_OR_subProject___id, knownIndexInReestr) {
    // определяем индекс  юзера по ID
    try {
        // console.log("Запуск find_chatIndex_in_chatBD");
        let findIndex = serverVarriorsDataFromBD_pr0001.chat_DB.findIndex(item => item.project_OR_subProject___id == project_OR_subProject___id);
        return findIndex;
    } catch (error) {
        console.log("ОШИБКА в find_chatIndex_in_chatBD" + error);
    }
}
//----------------------------------
function find___Or_Find_And_Add_NewChat_in_chatBD(project_OR_subProject___id, knownIndexInReestr) {
    try {
        // console.log("Запуск find___Or_Find_And_Add_NewChat_in_chatBD ");
        let findIndex = null;
        findIndex = find_chatIndex_in_chatBD(project_OR_subProject___id);
        // если массив пустой - добавляем пользователя
        if (findIndex < 0) {
            // добавляем новый чат
            serverVarriorsDataFromBD_pr0001.chat_DB.push(new Chat(
                project_OR_subProject___id,
                serverVarriorsDataFromBD_pr0001.chat_DB.length, // это knownIndexInReestr // не вычитаем единицу из length, т.к. это длинна массива до добавления нового проекта
            ));
            // повторно запускаем поиск индекса
            findIndex = find_chatIndex_in_chatBD(project_OR_subProject___id, project_OR_subProject___id, knownIndexInReestr);
        }
        // console.log("findIndex= " + findIndex);
        return findIndex;
    } catch (error) {
        console.log("ОШИБКА в find___Or_Find_And_Add_NewChat_in_chatBD: " + error);
    }
}
//----------------------------------
function delete_oneProjectFromBD(project_ID, knownIndexInReestr) {
    try {
        let finedProjectIndex = findProjectIndex_inBD(project_ID, knownIndexInReestr);
        if (finedProjectIndex != null && finedProjectIndex >= 0) {
            // удаляем из реестра пользователей
            delete_UsersInReestr_forCurrentProject(project_ID, serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndex].teamList);

            // удаляем проект из БД
            // помечаем проект как временно удаленный
            serverVarriorsDataFromBD_pr0001.projects_DB[finedProjectIndex].isDeletedTemp = true;

            need_SaveData = true;
        }
        return "result_OK";
    } catch (error) {
        console.log("ОШИБКА в delete_oneProjectFromBD: " + error);
    }
}


//----------------------------------
// Не используем 
/* 
function find_subChat_in_chatBD(mainProject_inChat_index, subProject_ID) {
    // console.log("===find_subChat_in_chatBD ");
    let find_subChat_Index = null;
    find_subChat_Index = serverVarriorsDataFromBD_pr0001.chat_DB[mainProject_inChat_index].subProjects_chats.findIndex(item => item.subProject_ID == subProject_ID); // в данном случае значение project_ID соответствует субпроекту, а не главному проекту, т.к. структура чата одиниковая для проектов и субпроектов
    // console.log("find_subChat_Index= " + find_subChat_Index);
    return find_subChat_Index;
}
 */
//----------------------------------
// для СУБЧАТА:
// Не используем 
/* 
function find_OR__find_AND_add__new_subChat_in_chatBD(mainProject_inChat_index, subProject_ID) {
    // console.log("ЗАПУСК find_OR_add__new_subChat_in_chatBD ");
    // console.log("mainProject_inChat_index= "+mainProject_inChat_index);
    // console.log("subProject_ID= "+subProject_ID);
    let find_subChat_Index = null;
    find_subChat_Index = find_subChat_in_chatBD(mainProject_inChat_index, subProject_ID);
    if (find_subChat_Index >= 0) return find_subChat_Index;
    else {
        // создаем заготовку нового субчата 
        let new_subChat = new SubChat(subProject_ID);
        // и сразу удаляем для субчата ненужный компонент
        delete new_subChat.subProjects_chats;
        // добавляем в БД чатов
        serverVarriorsDataFromBD_pr0001.chat_DB[mainProject_inChat_index].subProjects_chats.push(new_subChat);
        // повторно запускаем поиск индекса
        find_subChat_Index = find_subChat_in_chatBD(mainProject_inChat_index, subProject_ID);
    }
    return find_subChat_Index;
}
 */
//----------------------------------
// Не используем
/* 
function add_chat_in_chatBD(project_OR_subProject___id, parent_Project_ID, knownIndexInReestr) {
    // след. Ф. "find___Or_Find_And_Add_NewChat_in_chatBD" - автоматически создает нов в базе чатов, поэтому дополнительные действия не требуются
    let findIndex_in_chatBD = find___Or_Find_And_Add_NewChat_in_chatBD(
        project_OR_subProject___id,
        parent_Project_ID,
        knownIndexInReestr
    );
    // найденный индекс передаем в базу данных для последующего быстрого поиска
    // let findprojectIndex_in_BD = findProjectIndex_inBD(project_ID);
    // serverVarriorsDataFromBD_pr0001.projects_DB[findprojectIndex_in_BD].prog_chat_vector.knownIndexInReestr_in_chatBD = findIndex_in_chatBD;
    // сохраняем данные в БД реестhа
    need_SaveChat = true;
}
 */
//----------------------------------
async function mSaveFileDB(data) {
    try {
        // console.log("---------");
        // console.log("Функция mSaveFileDB, 'data' =");
        // let pathNameID = '.../DataBase/' + 'm_DB' + '.json';
        let pathNameID = get_valid_adress_fileOrFolder(config_pr0001.local_files_forder_Adress + 'm_DB.json');
        fs.writeFileSync(pathNameID, JSON.stringify(data));
        // console.log("Был успешно сохранен m_DB.json");
    } catch (error) {
        console.log("Ошибка сохранения файла m_DB.json");
        console.log(error);
    }
}

//----------------------------------
function saveLocalFile(fileName, data) {
    try {
        let pathNameID = get_valid_adress_fileOrFolder(config_pr0001.local_files_forder_Adress + fileName);
        fs.writeFileSync(pathNameID, JSON.stringify(data));
        // console.log("Был успешно сохранен " + fileName);
    } catch (error) {
        console.log("Ошибка сохранения файла " + fileName);
        console.log(error);
    }
}

//----------------------------------
async function saveData_pr0001() {
    // console.log("Запуск saveData_pr0001");
    // сохранение БД и реестра
    if (need_SaveData == true && access_SaveData == true) {
        // console.log("Запускаем сохранение saveData_pr0001");
        // need_SaveData = false;
        access_SaveData = false; // закрываем доступ для предотвращения дублирования функции
        try {
            // сохраняем БД
            //  await mSaveFileDB(serverVarriorsDataFromBD_pr0001.projects_DB);
            saveLocalFile(config_pr0001.mFileName_projectsDB, serverVarriorsDataFromBD_pr0001.projects_DB);

            // console.log("Ф.saveData_pr0001 --- успешно сохранена БД");
        } catch (error) {
            // console.log("Ошибка сохранения БД");
            // console.log(error);
            need_SaveData = true;
            access_SaveData = true;
            return;
        }

        try {
            // затем сохраняем реестр
            // await mSaveUserReestr_inBD(serverVarriorsDataFromBD_pr0001.users_Reestr);
            await saveLocalFile(config_pr0001.mFileName_userReestr, serverVarriorsDataFromBD_pr0001.users_Reestr);
            // console.log("Ф.saveData_pr0001 --- успешно сохранена БД");
        } catch (error) {
            // console.log("Ошибка сохранения БД");
            // console.log(error);
            need_SaveData = true;
            access_SaveData = true;
            return;
        }
        // восстанавливаем доступ к функции сохранения
        access_SaveData = true;
    }

    // сохранение чата
    if (need_SaveChat == true && access_SaveChat == true) {
        // need_SaveChat = false;
        access_SaveChat = false; // закрываем доступ для предотвращения дублирования функции
        try {
            // сохраняем БД
            // await mSaveChatDB(serverVarriorsDataFromBD_pr0001.chat_DB);
            await saveLocalFile(config_pr0001.mFileName_chatDB, serverVarriorsDataFromBD_pr0001.chat_DB);
            // console.log("Ф.saveData_pr0001 --- успешно сохранена БД");
        } catch (error) {
            // console.log("Ошибка сохранения БД");
            // console.log(error);
            need_SaveData = true;
            access_SaveData = true;
            return;
        }
        // восстанавливаем доступ к функции сохранения
        access_SaveChat = true;
    }

}
//----------------------------------
// исправить - удалить эту функцию и ее принудительное использование в тексте программы
function saveAllDataHandle() {

    /* 
        if (access_SaveData == true) {
            access_SaveData = false;
            mSaveFileDB(serverVarriorsDataFromBD_pr0001.projects_DB);
            mSaveUserReestr_inBD(serverVarriorsDataFromBD_pr0001.users_Reestr);
            mSaveChatDB(serverVarriorsDataFromBD_pr0001.chat_DB);
        }
        access_SaveData = true;
     */

}
//----------------------------------
//----------------------------------
function set_timeUpdate_wasRead_subChat(user_Email, project_ID, subProject_ID, time_wasReadChat) {
    let object_WasReadEvents_forSubproject___BY_ID = get__OR___ADD_and_GET___object_WasReadEvents_forSubproject___BY_ID(user_Email, project_ID, subProject_ID);
    // обновляем время просмотра субчата в реестре 
    object_WasReadEvents_forSubproject___BY_ID.time_wasRead_subChat = time_wasReadChat;
}
//----------------------------------

function getOnlineTimeCurrentUser(user_Email) {
    // console.log("ЗАПУСК getOnlineTimeCurrentUser");
    let lastOnlineTime = 0;
    let userIndex = findUser_Index_inReestr(user_Email);

    // console.log("userIndex= " + userIndex);
    if ((userIndex != null && userIndex >= 0)
        && serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus
        && serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus.lastOnlineTime
    ) {
        lastOnlineTime = serverVarriorsDataFromBD_pr0001.users_Reestr[userIndex].onlineStatus.lastOnlineTime
    }
    // console.log("onlineTime= " + lastOnlineTime);
    return lastOnlineTime;
}
//-------------------------------
// Эта функция возвращает корректный адрес от корневой папки операционной системы до указанных в запросе файлов/папок 
function get_valid_adress_fileOrFolder(absPathToFile) {


    try {
        console.log("ЗАПУСК get_valid_adress_fileOrFolder, absPathToFile=");
        console.log(absPathToFile);

        // Тут получаем откорректированный полный путь от корневой папки операционной системы до места вызова этой функции
        // НЕ УДАЛЯТЬ. ЭТОТ МЕТОД РАБОТАЕТ, ЕСЛИ ИСКОМЫЙ ФАЙЛ НАХОДИТСЯ В ТЕКУЩЕЙ ИЛИ ВО ВЛОЖЕННЫХ ПАПКАХ
        /* 
            let globalPathToCurrentFolder = path.resolve();
            console.log("globalPathToCurrentFolder= " + globalPathToCurrentFolder);
            console.log(" ");
     
            // Тут получаем откорректированный абсолютный путь от места вызова функции до указанного файла/папки
            let localPathFromCurrentFolder = path.join(absPathToFile);
            console.log("localPathFromCurrentFolder= " + localPathFromCurrentFolder);
            console.log(" ");
     
            let fullAdress = globalPathToCurrentFolder + localPathFromCurrentFolder;
            console.log("fullAdress= " + fullAdress);
            console.log(" ");
        */

        // см. инфо тут: https://nodejs.org/api/path.html
        // Тут получаем откорректированный относительный путь от места вызова до целевого файла
        let path_normalize = path.normalize(absPathToFile);
        // console.log("path_normalize= " + path_normalize);
        // console.log(" ");

        // return fullAdress;
        return path_normalize;
    } catch (error) {
        console.log("Ошибка из get_valid_adress_fileOrFolder:");
        console.log(error);
        return null;
    }
}

//-------------------------------

function myRandomId() {
    let dateNow = Date.now();
    let rndmNumb = Math.floor(Math.random() * 1000000000);
    let rndmSum = dateNow + '_' + rndmNumb;
    return (rndmSum);
}

//===============================
export default new postService_pr0001();

export { mUserService, mFile_service, get_valid_adress_fileOrFolder };
// экспортируем отдельные функции, чтобы не переписывать их в других файлах
export let varsANDfunctions_fromPostService = {
    // это функции
    // firstLoad_BD: firstLoad_BD,
    // firstLoad_UsersReestr: firstLoad_UsersReestr,
    // firstLoad_ChatDB: firstLoad_ChatDB,
    // firstLoad_oneFileData_fromLocalDiskOrMongoDB: firstLoad_oneFileData_fromLocalDiskOrMongoDB,
    serverVarriorsDataFromBD_pr0001: serverVarriorsDataFromBD_pr0001,

    // это переменные, объекты и указатели
    projects_DB: serverVarriorsDataFromBD_pr0001.projects_DB,
    users_Reestr: serverVarriorsDataFromBD_pr0001.users_Reestr,
    chat_DB: serverVarriorsDataFromBD_pr0001.chat_DB,
    findUser_Index_inReestr: findUser_Index_inReestr,
    validateAccessToken: mUserService.validateAccessToken,
};
