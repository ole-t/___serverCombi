
import path from 'path';
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
import { promises as promises_fs } from 'fs'; // нужно для фсинхронных функций при пработе с файлами и папками
import { Readable } from 'stream';
import zlib from 'zlib'; // для сжатия данных
import util from 'util'; // берем из библиотеки NodeJS - используем для ожидания загрузки файла из сети, в нашем случ из МонгоДБ
// import config_serverCombi from '../config_serverCombi.js';
import TelegramBot from 'node-telegram-bot-api';
import global_Data_forAllProjects from './global_Data_forAllProjects.js';
import config_serverCombi from '../config_serverCombi.js';

import dns from 'dns'; // нужно для контроля соединения с Монго ДБ 

// на случай проблем с DNS Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const global_Functions_and_Servises_forAll_Projects = {

    random_id() {
        let dateNow = Date.now();
        let rndmNumb = Math.floor(Math.random() * 1000000000);
        let rndmSum = dateNow + '_' + rndmNumb;
        return (rndmSum);
    },

    // =========================
    // =========================
    // =========================

    files_loadAndSave_service: {

        get_valid_adress_fileOrFolder(absPathToFile) {
            try {
                // см. инфо тут: https://nodejs.org/api/path.html
                // Тут получаем откорректированный путь от корневого диска компьютера, на входе передаем относительный путь от места вызова до целевого файла
                let path_normalize = path.normalize(absPathToFile);
                return path_normalize;
            } catch (error) {
                // console.log("Ошибка из get_valid_adress_fileOrFolder:");
                // console.log(error);
                return null;
            }
        },

        async createDir_andAll_intermediateDirectories(fullPath) {
            // Эта фун создает папок и все промежуточные директории
            // console.log(" ");
            // console.log("ЗАПУСК createDir_andAll_intermediateDirectories");

            return await new Promise(async (resolve, reject) => {
                try {

                    let validationFullPath = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(fullPath);

                    // console.log(" ");
                    // console.log("validationFullPath = " + validationFullPath);
                    try {
                        // Создаём папки асинхронно (вместе с промежуточными)
                        fs.mkdir(validationFullPath, { recursive: true }, (err) => {
                            if (err) {
                                console.error("Ошибка в fs.mkdir:", err);

                                validationFullPath = null;
                                return resolve(validationFullPath);
                            }
                            else {
                                // console.log(" ");
                                // console.log("Папка создана или уже существовала: " + validationFullPath);
                                resolve(validationFullPath);
                            }
                        });
                    } catch (error) {
                        console.error("Ошибка создания папок в fs.mkdir:");
                        console.error(error);

                        validationFullPath = null;
                        return resolve(validationFullPath);
                    }

                } catch (error) {
                    console.error("Ошибка при создании папки: " + error);

                    validationFullPath = null;
                    return resolve(validationFullPath);
                }
            });
        },

        // Новый вариант без лишних промисов от chatGPT
        async loadLocalFile(
            myNameID_ActualProject, // имя_ID проекта
            local_files_forder_Adress, // адрес расположения файлов проекта, без имени файла
            file_Name // имя файла
        ) {
            try {
                const pathNameID = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service
                    .get_valid_adress_fileOrFolder(local_files_forder_Adress + file_Name);

                if (!fs.existsSync(pathNameID)) {
                    console.log(`\n${myNameID_ActualProject}: Файл не найден: ${file_Name}`);
                    return null;
                }

                let data = fs.readFileSync(pathNameID, 'utf8');
                if (data) {
                    data = JSON.parse(data);
                }

                // console.log(`\n${myNameID_ActualProject}: Был успешно прочитан ${file_Name}`);
                return data;

            } catch (error) {
                console.log(`\n${myNameID_ActualProject}: Ошибка чтения файла ${file_Name}`);
                console.log(error);
                return null;
            }
        },


        // Старый вариант
        /* 
                 async loadLocalFile(
                    myNameID_ActualProject, // имя_ID проекта
                    local_files_forder_Adress, // адрес расположения файлов проекта, без имени файла
                    file_Name // имя файла
                ) {
                    return new Promise((resolve, reject) => {
                        try {
                            const pathNameID = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service
                                .get_valid_adress_fileOrFolder(local_files_forder_Adress + file_Name);
        
                            if (!fs.existsSync(pathNameID)) {
                                console.log("\n" + myNameID_ActualProject + ": Файл не найден: " + file_Name);
                                return resolve(null);
                            }
        
                            let data = fs.readFileSync(pathNameID, 'utf8');
                            if (data) {
                                data = JSON.parse(data);
                            }
        
                            // console.log("\n" + myNameID_ActualProject + ": Был успешно прочитан " + file_Name);
                            return resolve(data);
        
                        } catch (error) {
                            console.log("\n" + myNameID_ActualProject + ": Ошибка чтения файла " + file_Name);
                            console.log(error);
                            return resolve(null);
                        }
                    });
                }
         */

        // Новый вариант от ChatGPT 02.11.2025
        async saveLocal_JSON_file(
            data, // данные
            myNameID_ActualProject, // имя_ID проекта
            local_files_forder_Adress, // адрес расположения файлов проекта, без имени файла
            file_Name // имя файла
        ) {
            try {
                const fullFilePath = global_Functions_and_Servises_forAll_Projects
                    .files_loadAndSave_service
                    .get_valid_adress_fileOrFolder(path.join(local_files_forder_Adress, file_Name));

                // создаём папку и все промежуточные директории
                const pathSaveFile = await global_Functions_and_Servises_forAll_Projects
                    .files_loadAndSave_service
                    .createDir_andAll_intermediateDirectories(local_files_forder_Adress);

                if (!pathSaveFile) {
                    console.log("\nОшибка: не удалось создать путь папки на диске для " + file_Name);
                    return null;
                }

                // сохраняем файл на диск
                await fs.promises.writeFile(fullFilePath, JSON.stringify(data, null, 2)); // с форматированием для читаемости

                // проверяем успешность записи
                try {
                    await fs.promises.access(fullFilePath, fs.constants.F_OK | fs.constants.W_OK);
                    return ("Файл " + file_Name + " успешно сохранён на диск");
                } catch {
                    console.log(`Ошибка: файл "${file_Name}" не существует или недоступен для записи после сохранения`);
                    return null;
                }

            } catch (error) {
                console.log(`Ошибка сохранения файла "${file_Name}":`, error);
                return null;
            }
        },


        // Старый вариант
        /* 
                 async saveLocal_JSON_file(
                    data, // данные
                    myNameID_ActualProject, // имя_ID проекта
                    local_files_forder_Adress, // адрес расположеия файлов проекта, без имени файла
                    file_Name // имя файла
                ) {
                    return new Promise(async (resolve, reject) => {
                        try {
                            let pathNameID = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(local_files_forder_Adress + file_Name);
        
                            // контролируем наличие нужного пути на диске для скачивания файла
                            let pathSaveFile = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.createDir_andAll_intermediateDirectories(local_files_forder_Adress);
                            if (!pathSaveFile) {
                                console.log(" ");
                                console.log("Ошибка при попытке создать путь папки на диске при резервном копировании");
                                return resolve(null);
                            }
        
                            // сохраняем файл на диск
                            // fs.writeFileSync(pathNameID, JSON.stringify(data));
                            // ✅ Асинхронная запись, не блокирует event loop
                            await fs.promises.writeFile(pathNameID, JSON.stringify(data));
        
        
                            // console.log(myNameID_ActualProject + ": Был успешно сохранен " + file_Name);
                            resolve(myNameID_ActualProject + ": Был успешно сохранен " + file_Name);
                        } catch (error) {
                            console.log("Ошибка сохранения файла " + file_Name);
                            console.log(error);
                            resolve(null); // ВАЖНО! Возвращаем "resolve" вместо "reject" - при получении результата в вызывающей функции обработать этот ответ
                        }
                    })
                }
                 */


        async firstLoad_oneFileData_fromLocalDiskOrMongoDB(
            myNameID_ActualProject, // имя_ID проекта 
            connectionToMongo_actualProject, // соединение к необходимой БД Монго
            local_files_forder_Adress,  // адрес расположеия файлов проекта, без имени файла
            file_Name, // имя файла
        ) {

            console.log(" ");
            // console.log("Запуск firstLoad_oneFileData_fromLocalDiskOrMongoDB, arguments=  ");
            // console.log(arguments);

            // ВАЖНО - названия переменных совпадают с названием файла, за исключением расширенияя
            return new Promise(async (resolve, reject) => {
                // извлекаем название файла без учета расширения, до точки
                const combiNameFile = (myNameID_ActualProject ? (myNameID_ActualProject + "=====") : "") + file_Name.split('.')[0];

                try {
                    const loadData = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.loadLocalFile(
                        myNameID_ActualProject,
                        local_files_forder_Adress,
                        file_Name
                    );
                    // console.log("loadData= " + loadData);

                    if (loadData) return resolve(loadData);

                    else {
                        // иначе пытаемся скачать резервированную копию с МонгоДБ
                        // проверяем, не было ли предыдущейй неудачной попытки скачать файл с МонгоДБ
                        if (!global_Data_forAllProjects.firstDownloadListFromMongoDB.has(combiNameFile)) {

                            console.log(" ");
                            console.log("= = = = = = = НЕ УДАЛОСЬ ПРИ ЗАПУСКЕ ПРОЧИТАТЬ ЛОКАЛЬНЫЙ ФАЙЛ, пытаемся скачать с Монго: " + file_Name);

                            global_Data_forAllProjects.firstDownloadListFromMongoDB.add(combiNameFile);

                            let res_import_AndDecompressed_AndSave_ZIP_File_FromMongoDB = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.import_AndDecompressed_AndSave_ZIP_File_FromMongoDB(
                                myNameID_ActualProject,
                                connectionToMongo_actualProject,
                                local_files_forder_Adress,
                                file_Name
                            );

                            console.log(" ");
                            console.log("res_import_AndDecompressed_AndSave_ZIP_File_FromMongoDB= " + res_import_AndDecompressed_AndSave_ZIP_File_FromMongoDB);

                            // затем, после попытки скачать резервный файл из МонгоДБ на локальный диск, пытаемся повторно произвести чтение с локального диска
                            try {
                                const importData = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB(
                                    myNameID_ActualProject,
                                    connectionToMongo_actualProject,
                                    local_files_forder_Adress,
                                    file_Name,
                                );
                                if (importData) resolve(importData);
                                else resolve(null);
                            } catch (error) {
                                resolve(null);
                            }
                        }
                        else {
                            console.log("После попытки скачивания файла из Монго ДБ не удалось найти его на локальном диске");
                            resolve(null);
                        }
                    }
                } catch (error) {
                    // console.log("=== СРАБОТАЛ catch files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB !!!!!: ");
                    // console.log(error);
                    resolve(null);
                }
            })
        },
    },

    // =========================
    // =========================
    // =========================

    mongoDB_accessAndService_forAllProjects: {

        async connectToMongoDB(myNameID_ActualProject, mongoURL_actualProject) {
            let connection = null;
            let isConnecting = false;

            const connectWithRetry = async () => {
                if (isConnecting) return;
                isConnecting = true;

                try {
                    connection = mongoose.createConnection(mongoURL_actualProject, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        serverSelectionTimeoutMS: 10000,
                        connectTimeoutMS: 10000,
                    });

                    // 💡 Ждём фактического подключения
                    await new Promise((resolve, reject) => {
                        connection.once('connected', () => {
                            // console.log(`${myNameID_ActualProject} - Mongoose подключен`);
                            isConnecting = false;
                            resolve();
                        });

                        connection.once('error', (err) => {
                            isConnecting = false;
                            // reject(err);
                            resolve(err);
                        });
                    });

                } catch (err) {
                    console.error(`${myNameID_ActualProject} - Ошибка подключения:`, err);
                    isConnecting = false;
                    setTimeout(connectWithRetry, 5000);
                }
            };

            await connectWithRetry();
            return connection;
        },

        async export_And_ZIP_LocalFile_ToMongoDB(
            myNameID_ActualProject, // имя_ID проекта
            connectionToMongo_actualProject, // соединение к необходимой БД Монго
            local_files_forder_Adress, // адрес расположеия файлов проекта, без имени файла
            file_Name // имя файла
        ) {
            return new Promise(async (resolve, reject) => {
                try {
                    const fileNameAndAdress = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(local_files_forder_Adress + file_Name);

                    // Проверка на существование файла
                    if (!fs.existsSync(fileNameAndAdress)) {
                        // console.log(`Ошибка в export_And_ZIP_LocalFile_ToMongoDB - Файл ${fileNameAndAdress} не найден`);
                        return resolve(null); // Выходим, если файл не найден
                    }

                    // Предварительно удаляем одноименный файл с МонгоДБ
                    await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.deleteFiles_FromMongoDB(
                        connectionToMongo_actualProject,
                        file_Name
                    );
                    // console.log(myNameID_ActualProject + ": Предыдущий файл (файлы) при его наличии был удален, начинаем закачку нового файла");

                    const bucket = new GridFSBucket(connectionToMongo_actualProject.db, {
                        // bucketName: 'dataFromLocalFile'
                        bucketName: 'mBuket_' + file_Name + "_ZIP"
                    });
                    // Запись файла в GridFS
                    const uploadStream = bucket.openUploadStream(file_Name + "_ZIP");
                    uploadStream.on('error', (error) => {
                        console.error('Ошибка в uploadStream:', error);
                        return resolve(null);
                    });

                    // Создание потока чтения из файла
                    const readStream = fs.createReadStream(fileNameAndAdress);
                    readStream.on('error', () => {
                        console.error('Ошибка в readStream:', error);
                        return resolve(null);
                    });

                    // Создание потока сжатия данных с помощью gzip
                    const gzip = zlib.createGzip();
                    gzip.on('error', () => {
                        console.error('Ошибка в gzip:', error);
                        return resolve(null);
                    });

                    // Связываем потоки: readStream -> gzip -> uploadStream (GridFS)    
                    readStream.pipe(gzip).pipe(uploadStream);
                    uploadStream.on('finish', () => {
                        // console.log(myNameID_ActualProject + ': File ' + file_Name + ' was successfully  compressed and uploaded to GridFS!');
                        return resolve('export_And_ZIP_LocalFile_ToMongoDB - ok');
                    });


                    // Таймаут защиты от зависания: если загрузка не закончилась зауказанное время — считаем ошибкой                  
                    const timeoutProtect = setTimeout(() => {
                        console.log("Ошибка сохранения файла в Монго ДБ: " + { myNameID_ActualProject });
                        return resolve(null);
                    }, 7200000);
                    // Сброс таймаута при finish / error
                    uploadStream.on('finish', () => clearTimeout(timeoutProtect));
                    uploadStream.on('error', () => clearTimeout(timeoutProtect));

                } catch (error) {
                    console.log(myNameID_ActualProject + ': Ошибка в export_And_ZIP_LocalFile_ToMongoDB');
                    console.log(error);
                    return resolve(null);
                }
            })
        },

        // Новый вариант от chatGPT, НЕ ПРОВЕРЕННЫЙ 
        async import_AndDecompressed_AndSave_ZIP_File_FromMongoDB(
            myNameID_ActualProject,
            connectionToMongo_actualProject,
            local_files_forder_Adress,
            file_Name
        ) {
            try {
                const fileNameAndAdress =
                    global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(
                        local_files_forder_Adress + file_Name
                    );

                // Проверка подключения
                if (connectionToMongo_actualProject.readyState !== 1) {
                    console.error("Нет подключения к MongoDB");
                    return null;
                }

                const bucketName = 'mBuket_' + file_Name + "_ZIP";
                const bucket = new GridFSBucket(connectionToMongo_actualProject.db, { bucketName });

                const filesCollection = connectionToMongo_actualProject.db.collection(bucketName + ".files");
                const fileDoc = await filesCollection.findOne({ filename: file_Name + "_ZIP" });

                if (!fileDoc) {
                    console.log("=== Не найден файл в МонгоДБ");
                    return null;
                }

                // Проверяем путь на диске
                const pathSaveFile = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.createDir_andAll_intermediateDirectories(local_files_forder_Adress);
                if (!pathSaveFile) {
                    console.error("Ошибка при создании папки для скачивания файла");
                    return null;
                }

                const fileObjectId = new ObjectId(fileDoc._id);
                const downloadStream = bucket.openDownloadStream(fileObjectId);
                const unzip = zlib.createGunzip();
                const writeStream = fs.createWriteStream(fileNameAndAdress);

                // Промис для отслеживания завершения
                const streamPromise = new Promise((resolve, reject) => {
                    writeStream.on('finish', () => resolve('ok'));
                    writeStream.on('error', reject);
                    unzip.on('error', reject);
                    downloadStream.on('error', reject);
                });

                // Тайм-аут для предотвращения зависания
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout при загрузке файла из MongoDB")), 15000)
                );

                downloadStream.pipe(unzip).pipe(writeStream);

                await Promise.race([streamPromise, timeoutPromise]);

                return 'was successfully import_AndDecompressed_AndSave_ZIP_File_FromMongoDB, file_Name= ' + file_Name;

            } catch (error) {
                console.error('Ошибка в import_AndDecompressed_AndSave_ZIP_File_FromMongoDB:', error);
                return null;
            }
        },


        async deleteFiles_FromMongoDB(connectionToMongo_actualProject, file_Name) {
            try {
                // Создаем экземпляр GridFSBucket
                const bucket = new GridFSBucket(connectionToMongo_actualProject.db, {
                    bucketName: 'mBuket_' + file_Name + "_ZIP"
                });

                // Получаем список файлов
                const bucketList = await bucket.find({ filename: file_Name + "_ZIP" }).toArray();

                const files_ID_list = bucketList.map(elem => elem._id);

                let counterFiles = 0;

                for (const fileObjectId of files_ID_list) {
                    try {
                        await bucket.delete(fileObjectId);
                        counterFiles++;
                        // console.log(`Файл с ID ${fileObjectId} удален.`);
                    } catch (error) {
                        console.error(`Ошибка при удалении файла в МонгоДБ с ID: ${fileObjectId}`, error);
                    }
                }

                // console.log("Количество удаленных файлов= " + counterFiles);
                return counterFiles; // возвращаем количество удаленных файлов

            } catch (error) {
                console.error('Ошибка в deleteFiles_FromMongoDB:');
                console.error(error);
                return null;
            }
        },

    },

    // =========================
    // =========================
    // =========================

    telegramBot_Servise: {

        setConnectionCurrentTelegramBot(accessToken_forCurrentTelegramBot) {
            return new TelegramBot(accessToken_forCurrentTelegramBot, { polling: true });
        },

        listenerCurrentTelegramBot(connection_to_CurrentTelegramBot) {
            connection_to_CurrentTelegramBot.on('message', (msg) => {
                // console.log(msg);
                connection_to_CurrentTelegramBot.sendMessage(msg.chat.id, `Вы отправили сообщение: "${msg.text}"`);
            })
        },

        async messegeToCurrentTelegramBot(
            connection_to_CurrentTelegramBot, // соединение с текущим ботом
            client_telegramAccount_ID, // id пользователя
            projectNumber, // название_id проекта
            text,  // текст сообщения
            emodzi,  // емодзи
            keyBoardParams // это передаваемая клавиатура для телеграм-Бота
        ) {

            // console.log(" ");
            // console.log("Запуск messegeToCurrentTelegramBot, arguments =");
            // console.log(arguments);

            return new Promise(async (resolve, reject) => {
                try {
                    await connection_to_CurrentTelegramBot.sendMessage(
                        client_telegramAccount_ID,
                        // "_________________" + 
                        (emodzi ? (emodzi + "   ") : "") + projectNumber +
                        '\n' + text,
                        keyBoardParams
                    );
                    resolve();
                } catch (error) {
                    console.log('Ошибка в messegeToCurrentTelegramBot:');
                    console.log(error);
                    resolve();
                }
            })
        },
    },

    // =========================

    // 🔹 Преобразует объект в массив.
    // Каждый элемент исходного объекта превращается в объект массива,
    // при этом исходный ключ сохраняется в поле "m_KeyConversion".
    convert_mObjectToArray(mObj) {
        // Преобразуем объект в массив объектов.
        // Object.entries возвращает массив пар [ключ, значение]
        return Object.entries(mObj).map(([key, value]) => ({

            // разворачиваем исходный объект, чтобы передать все его данные
            ...value,

            // сохраняем название ключа исходного объекта, 
            // чтобы можно было потом преобразовать массив обратно в объект по данному ключу
            m_KeyConversion: String(key)
        }));
    },

    // 🔹 Преобразует массив в объект.
    convert_mArrayToObject(
        mArr,
        input_KeyConversion // ЭТО НЕ ОБЯЗАТЕЛЬНЫЙ АРГУМЕНТ, применяется для тех массивов, которые были получены в результате предварительноо преобразования из объектов, - в этом случае у них есть свой ключ трансформации 
    ) {
        try {
            if (!Array.isArray(mArr)) {
                console.log(" ");
                console.log("Ошибка из convert_mArrayToObject - входящий аргумент не является Массивом");
                return null;
            }
            if (
                input_KeyConversion // если этот аргумент передан в функцию 
                &&
                (typeof input_KeyConversion) !== 'string' // и при этом он не является строкой 
            ) {
                console.log(" ");
                console.log("Ошибка из convert_mArrayToObject - Ключевое поле должно быть строкой");
                return null;
            }
            // Преобразуем весь массив в массив пар [ключ, данные] Т.е. нам нужно извлечь ранее записанный ключь объекта в отдельную пару, и в то же время удалить его оз общих данных 
            const entries = mArr.map((item) => {
                const m_KeyConversion = input_KeyConversion
                    ? item[input_KeyConversion] // если имя ключа передано во входящик аргументах - находим и извлекаем его в текущей записи 
                    : item.m_KeyConversion; // 1️⃣ Получаем значение поля keyConversion из текущего объекта, Оно там будет в том случае, если данный массив предварительно был получен преобразованием из объекта 
                if (!m_KeyConversion) {
                    console.log(" ");
                    console.log("ОШИБКА - Ключ m_KeyConversion НЕ ОБНАРУЖЕН !!! ");
                    // return null; 
                    // след код прервет функцию и передаст функционал в блок /catch на уровне всей функции. 
                    throw new Error("Ключ " + (input_KeyConversion || "m_KeyConversion") + " НЕ ОБНАРУЖЕН !!!");
                }

                const rest = { ...item }; // делаем копию текущего елемента массива, который затем используем в качества значений содержимого 
                delete rest.m_KeyConversion; // 2️⃣ Удаляем из него его из объекта ключ трансформации keyConversion (если он там есть), чтобы он не загрязнял данные 
                // 3️⃣ В промежуточный массив пар возвращаем массив из двух элементов: [ ключ, оставшиеся данные ] 
                return [m_KeyConversion, rest];
            });

            // Превращаем массив пар обратно в объект 
            const mNewObj = Object.fromEntries(entries); return mNewObj;
        }
        catch (error) {
            console.log(" ");
            console.log("Ошибка из convert_mArrayToObject: ");
            console.log(error);
            return null;
        }
    },


    check_isVar_object(mVar) {
        return (
            typeof mVar === 'object'
            && mVar !== null
            && !Array.isArray(mVar)
        );
    },

    check_isVar_array(mVar) {
        return Array.isArray(mVar);
    },

}


// =================================
/* 
// вначале подключаемся к Телеграм-боту
export let connectionTo_infoTelegramBot___SERVER_COMBI = null;
try {
    // для избежания двойного подключения к одному боту во время запуска одновременно двух серверов, ставим проверку
    if (!connectionTo_infoTelegramBot___SERVER_COMBI) {
        connectionTo_infoTelegramBot___SERVER_COMBI = global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.setConnectionCurrentTelegramBot(
            config_serverCombi.telegramAccessToken___combi_server___infoBot
        );

        console.log(" ");
        console.log("=== Установлено соединение с Телеграм ИНФО-БОТОМ из server_combi");
    }
} catch (error) {
    console.log(" ");
    console.log("=== ОШИБКА ПОДКЛЮЧЕНИЯ К ИНФО-БОТУ");
    console.log(error);
}

// эта ОТДЕЛЬНАЯ функция для отправки стандартизиртных служебные сообщения от Сервера Комби
export async function sendTelegramInfo_from___SERVER_COMBI(
    text,
    additional__emodzi_or_name_or_color_emodzi) {

    console.log(" "); 
    console.log("Запуск sendTelegramInfo_from___SERVER_COMBI, arguments =");
    console.log(arguments);

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
            connectionTo_infoTelegramBot___SERVER_COMBI, // соединение с Телеграм
            config_serverCombi.adminTelegramAccount_ID_for_information, // мой аккаунт для входящих сообщений
            config_serverCombi.projectNameID, // Название проекта
            text, // текст сообщения
            (config_serverCombi.emodziListTelegram_currentProject.default_currentProjectEmodzi + secondEmodzi + " ") //емодзи из переменной, из списка 
        )

    } catch (error) {
        console.log("Ошибка отправки сообщения Telegram из sendTelegramInfo_from___SERVER_COMBI");
        console.log(error);
    }
}
 */






