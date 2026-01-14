
import { global_Functions_and_Servises_forAll_Projects } from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import config_pr0001 from './config_pr0001.js';
import { serverVarriorsDataFromBD_pr0001, functions___pr0001 } from './postService_pr0001.js'
import config_serverCombi from '../config_serverCombi.js';

// Подключаемся к МонгоДБ 
let connectToMongo_pr0001 = null;
try {
    connectToMongo_pr0001 = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.connectToMongoDB(
        config_pr0001.projectNameID,
        config_pr0001.mMongoURL_pr0001
    )

} catch (error) {
    console.log(" ");
    console.log("Не удалось подключиться к Монгус");
    console.log(error);
}



// создаем массив рабочих переменных и файлов
const pr0001_falesNamesAndVarrsNames = [
    // во вложенном массиве первое значение - название файла, во втором значении - указатель на переменную, в которую д.б. записаны данне
    {
        file_name: config_pr0001.mFileName___usersReestr,
        var_name: 'users_Reestr',
        timePreviousSave_FalesToMongoDB_forCurrentFile: 0,
        access_SaveFalesToMongoDB_forCurrentFile: true,
    },

    {
        file_name: config_pr0001.mFileName___projectsDB,
        var_name: 'projects_DB',
        timePreviousSave_FalesToMongoDB_forCurrentFile: 0,
        access_SaveFalesToMongoDB_forCurrentFile: true,
    },

    {
        file_name: config_pr0001.mFileName___chatDB,
        var_name: 'chat_DB',
        timePreviousSave_FalesToMongoDB_forCurrentFile: 0,
        access_SaveFalesToMongoDB_forCurrentFile: true,
    },

] 

export async function first_LoadData_pr0001() {
    try {
        for (const currentFileAndVar of pr0001_falesNamesAndVarrsNames) {

            // console.log(" ");
            // console.log("До загрузки данных serverVarriorsDataFromBD_pr0001." + currentFileAndVar.var_name + "= ");
            // console.log(serverVarriorsDataFromBD_pr0001[currentFileAndVar.var_name]);

            try {
                const loadData = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB(
                    config_pr0001.projectNameID, // имя_ID проекта
                    connectToMongo_pr0001,       // соединение к БД 
                    config_pr0001.localFilesAdress, // адрес файлов
                    currentFileAndVar.file_name      // имя файла
                );

                if (loadData) {
                    // console.log(" ");
                    // console.log("loadData =");
                    // console.log(loadData);

                    serverVarriorsDataFromBD_pr0001[currentFileAndVar.var_name] = loadData;
                    // console.log("Успешно загружены первичные данные, Файл: " + currentFileAndVar.file_name);
                } else {
                    console.warn(`Файл ${currentFileAndVar.file_name}: данные НЕ были загружены`);

                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        `Файл ${currentFileAndVar.file_name}: данные НЕ были загружены`,
                        "red"
                    )
                }

            } catch (error) {
                console.error(`Ошибка загрузки файла ${currentFileAndVar.var_name}`, error);

                try {
                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        `Ошибка загрузки файла ${currentFileAndVar.var_name}`, error,
                        "red"
                    ) 
                } catch (error) {
                    console.error(`Ошибка в first_LoadData_pr0001при попытке отправки сообщения Телеграм`, error);
                }
            } 

            // console.log(" ");
            // console.log("ПОСЛЕ загрузки данных serverVarriorsDataFromBD_pr0001." + currentFileAndVar.var_name + "= ");
            // console.log(serverVarriorsDataFromBD_pr0001[currentFileAndVar.var_name]);

        }
        return 'ok'; // все файлы обработаны 

    } catch (error) {
        console.error('Ошибка в first_LoadData_pr0001', error);

        try {
            functions___pr0001.sendTelegramInfo_from_pr0001(
                'Ошибка в first_LoadData_pr0001', error,
                "red"
            )
        } catch (error) {
            console.error(`Ошибка в first_LoadData_pr0001при попытке отправки сообщения Телеграм 222`, error);
        }

        return null;
    }
}


async function saveDataControl_pr0001() {

    while (true) { // это бесконечный цикл, выполняет свой блок кода постоянно, пока не произойдёт явный выход из него (break, return, throw и т.п.).       

        // 🔁 Ждём перед следующей итерацией
        await new Promise(resolve => setTimeout(
            resolve,
            (config_pr0001.intervalSaveData_localDisk ? config_pr0001.intervalSaveData_localDisk : 10000))
        );

        // console.log(" ");
        // console.log("Циклический запуск кода в saveDataControl_pr0001 ... ");

        try {
            // сохраняем каждый из рабочих файлов
            for (const currentFileAndVar of pr0001_falesNamesAndVarrsNames) {

                // Важно! Чтобы не перезаписать сохраненные данные при перезапуске сервера - проверяем, не содержит ли переменная пустые данные, что бывает при первом запуске приложения, и при необходимости прерываем функцию
                try {

                    if (
                        // для данных в виде массива
                        serverVarriorsDataFromBD_pr0001[currentFileAndVar.var_name].length > 0
                        ||
                        // для данных в виде объекта
                        Object.keys(serverVarriorsDataFromBD_pr0001[currentFileAndVar.var_name]).length > 0
                    ) {

                        // сохраняем на локальный диск
                        let saveDataResult = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.saveLocal_JSON_file(
                            serverVarriorsDataFromBD_pr0001[currentFileAndVar.var_name], // данные
                            config_pr0001.projectNameID, // имя_ID проекта
                            config_pr0001.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                            currentFileAndVar.file_name // имя файла
                        );

                        // console.log(" ");
                        // console.log('saveDataResult= ' + saveDataResult);

                        // если данные сохранены в локальный файл успешно, то резервируем в Монго ДБ
                        if (saveDataResult) {
                            // каждый час 3600000 мсек

                            // console.log(" ");
                            // console.log('DeltaTime = ' + (Date.now() - currentFileAndVar.timePreviousSave_FalesToMongoDB_forCurrentFile));


                            if (currentFileAndVar.access_SaveFalesToMongoDB_forCurrentFile && (Date.now() - currentFileAndVar.timePreviousSave_FalesToMongoDB_forCurrentFile) > (config_pr0001.intervalSaveData_localDisk ? config_pr0001.intervalSaveData_mongoDB : 3600000)) {
                                // console.log(" ");
                                // console.log("Плановое сохранение в Монго");
                                currentFileAndVar.access_SaveFalesToMongoDB_forCurrentFile = false;

                                // Экспортируем данные в МонгоДБ
                                if (config_serverCombi.localDebugProcess) {
                                    // console.log("Отладка включена — пропускаем сохранение в MongoDB для файла:", currentFileAndVar.file_name);
                                    continue; // ВАЖНО  !!! тут не используем  return, иначе прервем непрерывный цикл while для всей функции  saveDataControl_pr0001() 
                                }

                                // console.log('pr0001: После локального сохранения файла ' + currentFileAndVar.file_name + ' - экспорnитуем его в Монго ДБ...');

                                await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.export_And_ZIP_LocalFile_ToMongoDB(
                                    config_pr0001.projectNameID, // имя_ID проекта
                                    connectToMongo_pr0001, // соединение к необходимой БД Монго
                                    config_pr0001.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                                    currentFileAndVar.file_name // имя файла
                                )
                                    .then(() => {
                                        console.log(config_pr0001.projectNameID + ": Файл успешно сохранен  в Монго_ДБ: " + currentFileAndVar.file_name);

                                        currentFileAndVar.timePreviousSave_FalesToMongoDB_forCurrentFile = Date.now();
                                    })
                                    .then(() => {
                                        // console.log(config_pr0001.projectNameID + "  ПРОДОЛЖЕНИЕ...");
                                        currentFileAndVar.access_SaveFalesToMongoDB_forCurrentFile = true;
                                    })
                                    .catch((err) => {
                                        console.log(config_pr0001.projectNameID + "ОШИБКА из saveDataControl_pr0001 при сохранения файлов в Монго");
                                        console.log(err);
                                        currentFileAndVar.access_SaveFalesToMongoDB_forCurrentFile = true;
                                    })
                            }
                        }
                    }
                    else {
                        // console.log(" ");
                        // console.log("Нет данных для согранения файла: " + currentFileAndVar.file_name);
                    }

                } catch (error) {
                    console.log(config_pr0001.projectNameID + ', переменная ' + currentFileAndVar.var_name + ": Ошибка при попытке проверить наличие данных перед сохранением");
                    // отправляем себе уведомление
                    try {
                        functions___pr0001.sendTelegramInfo_from_pr0001(
                            config_pr0001.projectNameID + ', переменная ' + currentFileAndVar.var_name + ": Ошибка при попытке проверить наличие данных перед сохранением",
                            "red"
                        )
                    } catch (error) {
                        console.log(" ");
                        console.log("Ошибка отправки сообщения в postService_pr0001");
                        console.log(error);
                    }
                }
            }

        } catch (error) {
            console.log("Сработал catch в saveDataControl_pr0001");
            console.log(error);

            // отправляем себе уведомление
            try {
                functions___pr0001.sendTelegramInfo_from_pr0001(
                    "Сработал catch в saveDataControl_pr0001: " + error,
                    "red"
                )
            } catch (error) {
                console.log(" ");
                console.log("Ошибка отправки сообщения в postService_pr0001");
                console.log(error);
            }
        }
    }
}
// Запускаем периодичное сохранение данных
saveDataControl_pr0001();








