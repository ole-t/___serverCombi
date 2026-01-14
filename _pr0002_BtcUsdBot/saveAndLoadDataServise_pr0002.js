
import {global_Functions_and_Servises_forAll_Projects} from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import config_pr0002 from './config_pr0002.js';
import { varrsAndData_pr0002 } from './postService_pr0002.js';
import config_serverCombi from '../config_serverCombi.js';
import { sendTelegramInfo_from_pr0002 } from './postService_pr0002.js';

let access_SaveFalesToMongoDB = true;
let timePreviousSave_FalesToMongoDB = Date.now();

// Подключаемся к МонгоДБ 
const connectToMongo_pr0002 = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.connectToMongoDB(
    config_pr0002.projectNameID,
    config_pr0002.mMongoURL_pr0002
)

export async function first_LoadData_pr0002() {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log(" ");
            // console.log("Запуск first_LoadData_pr0002");

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
                console.log(config_pr0002.projectNameID + ': Успешно загружены данные, varrsAndData_pr0002');
                // console.log(loadData);

                return resolve(loadData);
            }
            else {
                console.log(config_pr0002.projectNameID + ': данные НЕ БЫЛИ ЗАГРУЖЕНЫ');

                sendTelegramInfo_from_pr0002(
                    "Ошибка загрузки данных, pr0002 ",
                    "red"
                )

                return resolve(null);
            }

        } catch (error) {
            console.log("Ошибка first_LoadData_pr0002");
            console.log(error);

            sendTelegramInfo_from_pr0002(
                "Ошибка first_LoadData_pr0002 " + error,
                "red"
            )

            return resolve(null);
        }
    })
}

async function saveDataControl_pr0002() {
    if (config_serverCombi.localDebugProcess) return;

    while (true) { // это бесконечный цикл, выполняет свой блок кода постоянно, пока не произойдёт явный выход из него (break, return, throw и т.п.).  

        // 🔁 Ждём перед следующей итерацией
        await new Promise(resolve => setTimeout(
            resolve,
            (config_pr0002.intervalSaveData_localDisk ? config_pr0002.intervalSaveData_localDisk : 600000))
        );

        try {
            // Важно! Чтобы не перезаписать сохраненные данные при перезапуске сервера - предварительно проверяем, не является ли реестр пустым, что бывает при первом запуске приложения
            if (Object.keys(varrsAndData_pr0002.usersReestrTelegram).length > 0) {
                // сохраняем на локальный диск
                let saveDataResult = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.saveLocal_JSON_file(
                    varrsAndData_pr0002.usersReestrTelegram, // данные
                    config_pr0002.projectNameID, // имя_ID проекта
                    config_pr0002.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                    config_pr0002.mFileName___usersReestrTelegram // имя файла
                );

                // если данные сохранены в локальный файл успешно, то резервируем в Монго ДБ
                if (saveDataResult) {
                    // console.log('saveDataResult= ' + saveDataResult);
                    // console.log('pr0002: После локального сохранения файла экспортитуем его в Монго ДБ...');

                    // каждый час 3600000 мсек
                    if (access_SaveFalesToMongoDB && (Date.now() - timePreviousSave_FalesToMongoDB) > (config_pr0002.intervalSaveData_localDisk ? config_pr0002.intervalSaveData_mongoDB : 3600000)) {
                        // console.log(" ");
                        // console.log("Плановое сохранение в Монго");
                        access_SaveFalesToMongoDB = false;

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

                                sendTelegramInfo_from_pr0002(
                                    config_pr0002.projectNameID + "ОШИБКА из saveDataControl_pr0002 при сохранения файлов в Монго, " + err,
                                    "red"
                                )
                            })
                    }
                }
                else {
                    console.log(" ");
                    console.log("Ошибка сохранения данных на локальный диск - pr0002");

                    sendTelegramInfo_from_pr0002(
                        "Ошибка сохранения данных на локальный диск - pr0002",
                        "red"
                    )
                }
            }
            else {
                console.log("");
                console.log("pr0002: При попытке сохранения объект является пустым, прерываем сохранение");
            }
        } catch (error) {
            console.log("Сработал catch в saveDataControl_pr0002");
            console.log(error);
        }
    }
}
// Запускаем периодичное сохранение данных
saveDataControl_pr0002();








