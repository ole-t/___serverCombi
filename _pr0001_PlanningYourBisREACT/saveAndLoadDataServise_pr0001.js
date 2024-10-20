
import global_Functions_and_Servises_forAll_Projects from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';

import config_pr0001 from './config_pr0001.js';
import { serverVarriorsDataFromBD_pr0001 } from './postService_pr0001.js'

let access_SaveFalesToMongoDB = true;
let timePreviousSave_FalesToMongoDB = Date.now();

// Подключаемся к МонгоДБ 
const connectToMongo_pr0001 = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.connectToMongoDB(
    config_pr0001.projectNameID,
    config_pr0001.mMongoURL_pr0001
)

// создаем массив рабочих переменных и файлов
const pr0001_falesNamesAndVarrsNames = [
    // во вложенном массиве первое значение - название файла, во втором значении - указатель на переменную, в которую д.б. записаны данне
    [config_pr0001.mFileName___projectsDB, 'projects_DB'],
    [config_pr0001.mFileName___usersReestr, 'users_Reestr'],
    [config_pr0001.mFileName___chatDB, 'chat_DB'],
]

// console.log('pr0001_falesNamesAndVarrsNames= ');
// console.log(pr0001_falesNamesAndVarrsNames);


// в качестве аргумента передаем список переменных по ссылке, а также список файлов с данными
export async function first_LoadData_pr0001() {
    return new Promise(async (resolve, reject) => {
        try {
            // в каждую переменную записаваем данные файла, после его прочтения
            pr0001_falesNamesAndVarrsNames.forEach(async (currentFileAndVar) => {
                try {
                    const loadData = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB(
                        config_pr0001.projectNameID, // имя_ID проекта
                        connectToMongo_pr0001, // соединение к необходимой БД Монго
                        config_pr0001.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                        currentFileAndVar[0], // имя файла
                        // null // ссылка на переменную, куда нужно записать считанные данные
                    )
                    if (loadData) {
                        // записываем данные в переданную проекта
                        serverVarriorsDataFromBD_pr0001[currentFileAndVar[1]] = loadData;
                        resolve('resolve - ok');
                    }
                    else {
                        console.log(config_pr0001.projectNameID + ' Файл: ' + currentFileAndVar[0] + ': данные НЕ БЫЛИ ЗАГРУЖЕНЫ');
                        resolve(null);
                    }


                } catch (error) {
                    console.log(config_pr0001.projectNameID + ': Ошибка загрузки файла: ' + currentFileAndVar[1]);
                    resolve(null);
                }
            })

        } catch (error) {
            console.log(error);
            resolve(null);
        }
    })
}



async function saveDataControl_pr0001() {
    // console.log(" ");
    // console.log("Запуск saveDataControl_pr0001, usersReestrTelegram=");
    return new Promise(async (resolve, reject) => {
        try {
            setTimeout(
                async () => {
                    // console.log("Запуск saveDataControl_pr0001");
                    try {
                        // сохраняем каждый из рабочих файлов
                        pr0001_falesNamesAndVarrsNames.forEach(async (currentFileAndVar) => {
                            // Не используем тут Промис внутр асинхр функции для forEach, поскольку при сохранении данных нам не нужно контролировать окончание процесса
                            // Важно! Чтобы не перезаписать сохраненные данные при перезапуске сервера - проверяем, не содержит ли переменная пустые данные, что бывает при первом запуске приложения, и при необходимости прерываем функцию
                            try {
                                if (serverVarriorsDataFromBD_pr0001[currentFileAndVar[1]].length > 0) {

                                    // сохраняем на локальный диск
                                    let saveDataResult = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.saveLocalFile(
                                        serverVarriorsDataFromBD_pr0001[currentFileAndVar[1]], // данные
                                        config_pr0001.projectNameID, // имя_ID проекта
                                        config_pr0001.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                                        currentFileAndVar[0] // имя файла
                                    );

                                    // если данные сохранены в локальный файл успешно, то резервируем в Монго ДБ
                                    if (saveDataResult) {
                                        // console.log('saveDataResult= ' + saveDataResult);
                                        // console.log('pr0001: После локального сохранения файла экспорnитуем его в Монго ДБ...');

                                        // каждый час 3600000 мсек
                                        if (access_SaveFalesToMongoDB && (Date.now() - timePreviousSave_FalesToMongoDB) > 3600000) {
                                            // console.log(" ");
                                            // console.log("Плановое сохранение в Монго");
                                            access_SaveFalesToMongoDB = false;

                                            // Экспортируем данные в МонгоДБ
                                            await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.export_And_ZIP_LocalFile_ToMongoDB(
                                                config_pr0001.projectNameID, // имя_ID проекта
                                                connectToMongo_pr0001, // соединение к необходимой БД Монго
                                                config_pr0001.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
                                                currentFileAndVar[0] // имя файла
                                            )
                                                .then(() => {
                                                    // console.log(config_pr0001.projectNameID + ": Файлы в монго сохранены")
                                                })
                                                .then(() => {
                                                    // console.log(config_pr0001.projectNameID + "  ПРОДОЛЖЕНИЕ...");
                                                    timePreviousSave_FalesToMongoDB = Date.now();
                                                    access_SaveFalesToMongoDB = true;
                                                })
                                                .catch((err) => {
                                                    console.log(config_pr0001.projectNameID + "ОШИБКА из saveDataControl_pr0001 при сохранения файлов в Монго");
                                                    console.log(err);
                                                    access_SaveFalesToMongoDB = true;
                                                })
                                        }
                                    }
                                }
                                else {
                                    console.log("");
                                    console.log(config_pr0001.projectNameID + ', переменная' + currentFileAndVar[1] + ": При попытке сохранения объект является пустым, прерываем сохранение");
                                }
                            } catch (error) {
                                console.log(config_pr0001.projectNameID + ', переменная' + currentFileAndVar[1] + ": Ошика при попытке проверить наличие данных перед сохранением");
                            }
                        })


                    } catch (error) {
                        console.log("Сработал catch в saveDataControl_pr0001");
                        console.log(error);
                    }
                    saveDataControl_pr0001();
                    resolve('resolve- saveDataControl_pr0001 - finished');
                }, 900000  // 900000 // 15 минут
            )
        } catch (error) {
            console.log(error);
            resolve(null); // ВАЖНО! Возвращаем "resolve" вместо "reject" - при получении результата в вызывающей функции обработать этот ответ
            saveDataControl_pr0001(); // перезапускаем в случ ошибки, т.к. функция должна работать
        }
    })
}
// Запускаем периодичное сохранение данных
saveDataControl_pr0001();








