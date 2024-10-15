
import global_Functions_and_Servises_forAll_Projects from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';

import config_pr0002 from './config_pr0002.js';
import { varrsAndData_pr0002 } from './postService_pr0002.js';

let access_SaveFalesToMongoDB = true;
let timePreviousSave_FalesToMongoDB = 0;

// Подключаемся к МонгоДБ 
const connectToMongo_pr0002 = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.connectToMongoDB(
    config_pr0002.projectNameID,
    config_pr0002.mMongoURL_pr0002
)

export async function first_LoadData_pr0002() {
    return new Promise(async (resolve, reject) => {
        try {
            const loadData = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB(
                config_pr0002.projectNameID, // имя_ID проекта
                connectToMongo_pr0002, // соединение к необходимой БД Монго
                config_pr0002.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                config_pr0002.mFileName___usersReestrTelegram, // имя файла
                // null // ссылка на переменную, куда нужно записать считанные данные
            )
            if (loadData) {
                varrsAndData_pr0002.usersReestrTelegram = loadData;
                console.log(' ');
                console.log(config_pr0002.projectNameID + ': Успешно загружены данные, varrsAndData_pr0002.usersReestrTelegram=');
                console.log(varrsAndData_pr0002.usersReestrTelegram);
                resolve(loadData);
            }
            else {
                console.log(config_pr0002.projectNameID + ': данные НЕ БЫЛИ ЗАГРУЖЕНЫ');
                resolve(null);
            }

        } catch (error) {
            console.log(error);
            resolve(null);
        }
    })
}

async function saveDataControl_pr0002() {
    // console.log(" ");
    // console.log("Запуск saveDataControl_pr0002, usersReestrTelegram=");

    return new Promise(async (resolve, reject) => {
        try {
            setTimeout(
                async () => {
                    // console.log("Запуск saveDataControl_pr0002");
                    try {
                        // Важно! Чтобы не перезаписать сохраненные данные при перезапуске сервера - проверяем, не является ли реестр пустым, что бывает при первом запуске приложения, и при необходимости прерываем функцию
                        if (Object.keys(varrsAndData_pr0002.usersReestrTelegram).length === 0) {
                            console.log("");
                            console.log("При попытке сохранения объект является пустым, прерываем сохранение");
                            saveDataControl_pr0002(); // перезапускаем функцию контроля, т.к. она должна работать постоянно
                            resolve(null); // завершаем промис
                            return; // нужно, стобв прервать выполнение дальнейшего кода
                        }

                        // сохраняем на локальный диск
                        let saveDataResult = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.saveLocalFile(
                            varrsAndData_pr0002.usersReestrTelegram, // данные
                            config_pr0002.projectNameID, // имя_ID проекта
                            config_pr0002.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                            config_pr0002.mFileName___usersReestrTelegram // имя файла
                        );

                        // если данные сохранены в локальный файл успешно, то резервируем в Монго ДБ
                        if (saveDataResult) {
                            // console.log('saveDataResult= ' + saveDataResult);
                            // console.log('pr0002: После локального сохранения файла экспорnитуем его в Монго ДБ...');

                            // каждый час 3600000 мсек
                            if (access_SaveFalesToMongoDB && (Date.now() - timePreviousSave_FalesToMongoDB) > 3600000) {
                                // console.log(" ");
                                // console.log("Плановое сохранение в Монго");
                                access_SaveFalesToMongoDB = false;

                                // Экспортируем данные в МонгоДБ
                                await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.export_And_ZIP_LocalFile_ToMongoDB(
                                    config_pr0002.projectNameID, // имя_ID проекта
                                    connectToMongo_pr0002, // соединение к необходимой БД Монго
                                    config_pr0002.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                                    config_pr0002.mFileName___usersReestrTelegram // имя файла
                                )
                                    .then(() => {
                                        // console.log(config_pr0002.projectNameID + ": Файлы в монго сохранены")
                                    })
                                    .then(() => {
                                        // console.log(config_pr0002.projectNameID + "  ПРОДОЛЖЕНИЕ...");
                                        timePreviousSave_FalesToMongoDB = Date.now();
                                        access_SaveFalesToMongoDB = true;
                                    })
                                    .catch((err) => {
                                        console.log(config_pr0002.projectNameID + "ОШИБКА из saveDataControl_pr0002 при сохранения файлов в Монго");
                                        console.log(err);
                                        access_SaveFalesToMongoDB = true;
                                    })
                            }

                        }
                    } catch (error) {
                        console.log("Сработал catch в saveDataControl_pr0002");
                        console.log(error);
                    }
                    saveDataControl_pr0002();

                }, 900000  // 900000 // 15 минут

            )
            resolve('resolve-ok');
        } catch (error) {
            console.log(error);
            resolve(null); // ВАЖНО! Возвращаем "resolve" вместо "reject" - при получении результата в вызывающей функции обработать этот ответ
        }
    })
}
// Запускаем периодичное сохранение данных
saveDataControl_pr0002();








