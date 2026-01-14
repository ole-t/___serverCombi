
import {global_Functions_and_Servises_forAll_Projects} from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import config_pr0003 from './config_pr0003.js';
import { vars_and_functions___pr0003 } from './postService_pr0003.js'


// Подключаемся к МонгоДБ 
let connectToMongo_pr0003 = null;
try {
    connectToMongo_pr0003 = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.connectToMongoDB(
        config_pr0003.projectNameID,
        config_pr0003.mMongoURL_pr0003
    )
} catch (error) {
    console.log(" ");
    console.log("Не удалось подключиться к Монгус");
    console.log(error);
}

// создаем массив рабочих переменных и файлов
const pr0003_falesNamesAndVarrsNames = [
    // во вложенном массиве первое значение - название файла, во втором значении - указатель на переменную, в которую д.б. записаны данне
    {
        file_name: config_pr0003.usersFilesReestr,
        var_name: 'usersFiles_Reestr',
        timePreviousSave_FalesToMongoDB_forCurrentFile: 0,
        access_SaveFalesToMongoDB_forCurrentFile: true,
    },
]

// в качестве аргумента передаем список переменных по ссылке, а также список файлов с данными
export async function first_LoadData_pr0003() {
    try {
        // console.log("Запуск first_LoadData_pr0003");

        for (const currentFileAndVar of pr0003_falesNamesAndVarrsNames) {
            try {
                const loadData = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB(
                    config_pr0003.projectNameID,
                    connectToMongo_pr0003,
                    config_pr0003.localFilesAdress,
                    currentFileAndVar.file_name
                );

                if (loadData) {
                    vars_and_functions___pr0003[currentFileAndVar.var_name] = loadData;

                    // уведомление
                    setTimeout(() => {
                        // console.log(" ");
                        // console.log(`Успешно загружены первичные данные, файл: ${currentFileAndVar.file_name}`);


                        vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                            `Успешно загружены первичные данные, файл: ${currentFileAndVar.file_name}`,
                            "white"
                        );
                    }, 1000);

                } else {
                    console.log(`Первичные данные НЕ БЫЛИ ЗАГРУЖЕНЫ: ${config_pr0003.projectNameID} Файл: ${currentFileAndVar.file_name}`);

                    setTimeout(() => {
                        vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                            `Первичные данные НЕ БЫЛИ ЗАГРУЖЕНЫ: ${config_pr0003.projectNameID} Файл: ${currentFileAndVar.file_name}`,
                            "blue"
                        );
                    }, 1000);
                }

            } catch (error) {
                console.log(`Ошибка при загрузке файла ${currentFileAndVar.file_name} в first_LoadData_pr0003`, error);

                setTimeout(() => {
                    vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                        `Первичные данные НЕ БЫЛИ ЗАГРУЖЕНЫ: ${config_pr0003.projectNameID} Файл: ${currentFileAndVar.file_name}`,
                        "red"
                    );
                }, 1000);
            }
        }

        return 'ok'; // все файлы обработаны

    } catch (error) {
        console.log("Ошибка в first_LoadData_pr0003", error);

        setTimeout(() => {
            vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                `Ошибка в first_LoadData_pr0003: ${config_pr0003.projectNameID} Файл: ${currentFileAndVar.file_name}: ` + error,
                "red"
            );
        }, 1000);

        return null;
    }
}

async function saveDataControl_pr0003() {
    while (true) { // это бесконечный цикл, выполняет свой блок кода постоянно, пока не произойдёт явный выход из него (break, return, throw и т.п.).  

        // 🔁 Ждём перед следующей итерацией
        await new Promise(resolve => setTimeout(
            resolve,
            (config_pr0003.intervalSaveData_localDisk ? config_pr0003.intervalSaveData_localDisk : 600000))
        );  // 5000   // 900000  // 900000 // 15 минут

        try {
            // console.log(" ");
            // console.log("Запуск saveDataControl_pr0003");

            // сохраняем каждый из рабочих файлов
            for (const currentFileAndVar of pr0003_falesNamesAndVarrsNames) {
                try {

                    // console.log(" ");
                    // console.log("vars_and_functions___pr0003[currentFileAndVar.var_name]=");
                    // console.log(vars_and_functions___pr0003[currentFileAndVar.var_name]);

                    vars_and_functions___pr0003.access_SaveData = false;
                    // сохраняем на локальный диск
                    let saveDataResult = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.saveLocal_JSON_file(
                        vars_and_functions___pr0003[currentFileAndVar.var_name], // данные
                        config_pr0003.projectNameID, // имя_ID проекта
                        config_pr0003.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                        currentFileAndVar.file_name // имя файла
                    );

                    if (saveDataResult) {
                        vars_and_functions___pr0003.timePreviousSaveData = Date.now();
                        vars_and_functions___pr0003.need_SaveData = false;
                        vars_and_functions___pr0003.access_SaveData = true;

                        console.log(" ");
                        console.log("Данные успешно сохранены на диск, имя файла: " + currentFileAndVar.file_name);
                    }
                    else {
                        vars_and_functions___pr0003.need_SaveData = true;
                        vars_and_functions___pr0003.access_SaveData = true;

                        console.log(" ");
                        console.log("Ошибка при сохранении данных на диск, имя файла: " + currentFileAndVar.file_name);

                        setTimeout(() => {
                            vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                                "Ошибка при сохранении данных на диск, имя файла: " + currentFileAndVar.file_name,
                                "red"
                            );
                        }, 1000);
                    }


                } catch (error) {
                    vars_and_functions___pr0003.access_SaveData = true;

                    console.log(" ");
                    console.log("Сработал catch в forEach --- saveDataControl_pr0003");
                    console.log(error);

                    setTimeout(() => {
                        vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                            "Сработал catch в forEach --- saveDataControl_pr0003",
                            "red"
                        );
                    }, 1000);

                }
            }

        } catch (error) {
            vars_and_functions___pr0003.access_SaveData = true;

            console.log(" ");
            console.log("Сработал error в saveDataControl_pr0003");
            console.log(error);

            setTimeout(() => {
                vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                    "Сработал error в saveDataControl_pr0003",
                    "red"
                );
            }, 1000);
        }
    }
}
// Запускаем периодичное сохранение данных
saveDataControl_pr0003();








