

import path from 'path';
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
import { Readable } from 'stream';
import zlib from 'zlib'; // для сжатия данных
import util from 'util'; // берем из библиотеки NodeJS - используем для ожидания загрузки файла из сети, в нашем случ из МонгоДБ
// import config_serverCombi from '../config_serverCombi.js';
import TelegramBot from 'node-telegram-bot-api';
import global_Data_forAllProjects from './global_Data_forAllProjects.js';


export default class global_Functions_and_Servises_forAll_Projects {


    static get_valid_adress_fileOrFolder(absPathToFile) {
        try {
            // см. инфо тут: https://nodejs.org/api/path.html
            // Тут получаем откорректированный путь от корневого диска компьютера, на входе передаем относительный путь от места вызова до целевого файла
            let path_normalize = path.normalize(absPathToFile);
            return path_normalize;
        } catch (error) {
            console.log("Ошибка из get_valid_adress_fileOrFolder:");
            console.log(error);
            return null;
        }
    }

    static random_id() {
        let dateNow = Date.now();
        let rndmNumb = Math.floor(Math.random() * 1000000000);
        let rndmSum = dateNow + '_' + rndmNumb;
        return (rndmSum);
    }


    // =========================
    // =========================
    // =========================

    static files_loadAndSave_service = class {


        static loadLocalFile(
            myNameID_ActualProject, // имя_ID проекта
            local_files_forder_Adress, // адрес расположеия файлов проекта, без имени файла
            fileName // имя файла
        ) {
            // console.log("myNameID_ActualProject= " + myNameID_ActualProject);
            // console.log("local_files_forder_Adress= " + local_files_forder_Adress);
            // console.log("fileName= " + fileName);

            try {
                const pathNameID = global_Functions_and_Servises_forAll_Projects.get_valid_adress_fileOrFolder(local_files_forder_Adress + fileName);
                let data = fs.readFileSync(pathNameID, 'utf8');
                if (data) {
                    data = JSON.parse(data);
                }
                console.log(myNameID_ActualProject + ": Был успешно прочитан " + fileName);
                return data;
            } catch (error) {
                console.log(myNameID_ActualProject + ": Ошибка чтения файла " + fileName);
                // console.log(error);
                return null;
            }
        }


        static async saveLocalFile(
            data, // данные
            myNameID_ActualProject, // имя_ID проекта
            local_files_forder_Adress, // адрес расположеия файлов проекта, без имени файла
            fileName // имя файла
        ) {
            return new Promise(async (resolve, reject) => {
                try {
                    let pathNameID = global_Functions_and_Servises_forAll_Projects.get_valid_adress_fileOrFolder(local_files_forder_Adress + fileName);
                    fs.writeFileSync(pathNameID, JSON.stringify(data));
                    // console.log(myNameID_ActualProject + ": Был успешно сохранен " + fileName);
                    resolve(myNameID_ActualProject + ": Был успешно сохранен " + fileName);
                } catch (error) {
                    console.log("Ошибка сохранения файла " + fileName);
                    console.log(error);
                    resolve(null); // ВАЖНО! Возвращаем "resolve" вместо "reject" - при получении результата в вызывающей функции обработать этот ответ
                }
            })
        }

        static async firstLoad_oneFileData_fromLocalDiskOrMongoDB(
            myNameID_ActualProject, // имя_ID проекта
            connectionToMongo_actualProject, // соединение к необходимой БД Монго
            local_files_forder_Adress,  // адрес расположеия файлов проекта, без имени файла
            fileName, // имя файла
        ) {
            // ВАЖНО - названия переменных совпадают с названием файла, за исключением расширенияя
            return new Promise(async (resolve, reject) => {
                // извлекаем название файла без учета расширения, до точки
                const combiNameFile = (myNameID_ActualProject ? (myNameID_ActualProject + "=====") : "") + fileName.split('.')[0];

                try {
                    const loadData = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.loadLocalFile(
                        myNameID_ActualProject,
                        local_files_forder_Adress,
                        fileName
                    );
                    // console.log("qqq= "+qqq);
                    if (loadData) resolve(loadData);
                    else {
                        // иначе пытаемся скачать резервированную копию с МонгоДБ
                        // проверяем, не было ли предыдущейй неудачной попытки скачать файл с МонгоДБ
                        if (!global_Data_forAllProjects.firstDownloadListFromMongoDB.has(combiNameFile)) {
                            console.log("=== НЕ УДАЛОСЬ ПРИ ЗАПУСКЕ ПРОЧИТАТЬ ЛОКАЛЬНЫЙ ФАЙЛ, пытаемся скачать с Монго: " + fileName);
                            global_Data_forAllProjects.firstDownloadListFromMongoDB.add(combiNameFile);
                            let successfullyLoadedFileFromMongo = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.import_AndDecompressed_AndSave_ZIP_File_FromMongoDB(
                                myNameID_ActualProject,
                                connectionToMongo_actualProject,
                                local_files_forder_Adress,
                                fileName
                            );
                            // затем, после попытки скачать резервный файл из МонгоДБ на локальный диск, пытаемся повторно произвести чтение с локального диска
                            try {
                                const importData = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB(
                                    myNameID_ActualProject,
                                    connectionToMongo_actualProject,
                                    local_files_forder_Adress,
                                    fileName,
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
                    console.log("=== СРАБОТАЛ catch files_loadAndSave_service.firstLoad_oneFileData_fromLocalDiskOrMongoDB !!!!!: ");
                    console.log(error);
                    resolve(null);
                }
            })
        }

    }

    // =========================
    // =========================
    // =========================

    static mongoDB_accessAndService_forAllProjects = class {

        static async connectToMongoDB(myNameID_ActualProject, mongoURL_actualProject) {
            return new Promise(async (resolve, reject) => {
                let connectionToMongo_actualProject;
                try {
                    connectionToMongo_actualProject = mongoose.createConnection(mongoURL_actualProject, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        //  strictQuery: false, // это добавлено по рекомендациям монгус в консоли после запуска сервера
                    });
                    // запускаем процесс отслеживания событий подключением к МонгоДБ
                    mControlMongooseConnection(connectionToMongo_actualProject);
                    // важно!  resolve отсюда переместили в обработчик события actualConnectionToMongo.on, поскольку нам нужно дождаться соединения, и только потом озвратить из промиса установленное соединение
                    // resolve(connectionToMongo_actualProject);

                }
                catch (error) {
                    console.log(myNameID_ActualProject + ' -Ошибка подсоединения к МонгоДБ из connectToMongoDB');
                    console.log(error);
                    resolve(null);
                }

                function mControlMongooseConnection(actualConnectionToMongo) {
                    // тут отслеживаем состояние подключение к монгус
                    actualConnectionToMongo.on('connected', () => {
                        // важно!  resolve переместили сюда, поскольку нам нужно дождаться соединения, и только потом озвратить из промиса установленное соединение
                        resolve(connectionToMongo_actualProject);
                        console.log(myNameID_ActualProject + ' -Mongoose подключен к MongoDB');
                    })

                    actualConnectionToMongo.on('disconnected', () => {
                        console.log(myNameID_ActualProject + ' -Mongoose потерял соединение с MongoDB');
                    })

                    actualConnectionToMongo.on('reconnected', () => {
                        console.log(myNameID_ActualProject + ' -Mongoose переподключен к MongoDB');
                    })

                    actualConnectionToMongo.on('error', (err) => {
                        console.error(myNameID_ActualProject + ' -Ошибка подключения Mongoose: ', err);
                    })

                    actualConnectionToMongo.on('close', () => {
                        console.log(myNameID_ActualProject + ' -Соединение с MongoDB было закрыто');
                    })
                }
            })
        }


        static async export_And_ZIP_LocalFile_ToMongoDB(
            myNameID_ActualProject, // имя_ID проекта
            connectionToMongo_actualProject, // соединение к необходимой БД Монго
            local_files_forder_Adress, // адрес расположеия файлов проекта, без имени файла
            fileName //  имя файла
        ) {
            return new Promise(async (resolve, reject) => {
                try {
                    const fileNameAndAdress = global_Functions_and_Servises_forAll_Projects.get_valid_adress_fileOrFolder(local_files_forder_Adress + fileName);

                    // Проверка на существование файла
                    if (!fs.existsSync(fileNameAndAdress)) {
                        console.log(`Ошибка в export_And_ZIP_LocalFile_ToMongoDB - Файл ${fileNameAndAdress} не найден`);
                        resolve(null); // Выходим, если файл не найден
                    }

                    // Предварительно удаляем одноименный файл с МонгоДБ
                    await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.deleteFiles_FromMongoDB(
                        connectionToMongo_actualProject,
                        fileName
                    );
                    // console.log(myNameID_ActualProject + ": Предыдущий файл (файлы) при его наличии был удален, начинаем закачку нового файла");

                    const bucket = new GridFSBucket(connectionToMongo_actualProject.db, {
                        // bucketName: 'dataFromLocalFile'
                        bucketName: 'mBuket_' + fileName + "_ZIP"
                    });
                    // Запись файла в GridFS
                    const uploadStream = bucket.openUploadStream(fileName + "_ZIP");


                    // Создание потока чтения из файла
                    const readStream = fs.createReadStream(fileNameAndAdress);

                    // Создание потока сжатия данных с помощью gzip
                    const gzip = zlib.createGzip();

                    // Связываем потоки: readStream -> gzip -> uploadStream (GridFS)
                    readStream.pipe(gzip).pipe(uploadStream);
                    uploadStream.on('finish', () => {
                        // console.log(myNameID_ActualProject + ': File ' + fileName + ' was successfully  compressed and uploaded to GridFS!');
                        resolve('export_And_ZIP_LocalFile_ToMongoDB - ok');
                    });
                    uploadStream.on('error', (error) => {
                        console.error('Error File uploading:', error);
                        resolve(null);
                    });

                } catch (error) {
                    console.log(myNameID_ActualProject + ': Ошибка в export_And_ZIP_LocalFile_ToMongoDB');
                    console.log(error);
                    resolve(null);
                }
            })
        }


        static async import_AndDecompressed_AndSave_ZIP_File_FromMongoDB(
            myNameID_ActualProject,
            connectionToMongo_actualProject,
            local_files_forder_Adress,
            fileName
        ) {
            // Тут дополнительно реализуем функцонал ожидания окончания заказчки. Для этого разбиваем код на подфункции, используем промисы
            return new Promise(async (resolve, reject) => {
                try {
                    const fileNameAndAdress = global_Functions_and_Servises_forAll_Projects.get_valid_adress_fileOrFolder(
                        local_files_forder_Adress + fileName
                        // + "---QWEqwe"
                    );
                    // Создаем экземпляр GridFSBucket
                    const bucket = new GridFSBucket(connectionToMongo_actualProject.db, {
                        bucketName: 'mBuket_' + fileName + "_ZIP"
                    });

                    // определяем id нужного файла в монгоДБ
                    const fined_FilesInMongoDB = connectionToMongo_actualProject.db.collection('mBuket_' + fileName + "_ZIP" + ".files").find({ filename: fileName + "_ZIP" }); // параметр ".files" добавляется автоматически в МонгоДБ

                    // Если найден файл
                    if (await fined_FilesInMongoDB.hasNext()) {

                        const fined_ID_FilesInMongoDB = (await fined_FilesInMongoDB.next())._id; // ВАЖНО соблюдать синтаксис круглых скобок в сочетании с await
                        // преобразуем ID в указателб на файл в МонгоДБ
                        const fileObjectId = new ObjectId(fined_ID_FilesInMongoDB);

                        // Функция для загрузки файла
                        async function mSubfun_downloadFile() {
                            // Открываем поток для чтения файла из GridFS
                            const downloadStream = bucket.openDownloadStream(mongoose.Types.ObjectId(fileObjectId));
                            // Создаем поток для записи в файл после распаковки
                            const writeStream = fs.createWriteStream(fileNameAndAdress);
                            // Используем zlib для распаковки
                            const unzip = zlib.createGunzip();
                            // Чтение из GridFS -> распаковка -> запись в файл
                            downloadStream
                                .pipe(unzip)  // Распаковка данных
                                .pipe(writeStream)  // Запись в файл
                                // Обработка событий                   
                                .on('finish', () => {

                                    console.log('File successfully downloaded and decompressed')
                                    resolve('import_AndDecompressed_AndSave_ZIP_File_FromMongoDB --- successfully');
                                })
                                .on('error', (error) => {
                                    console.error('Error:', error);
                                    resolve(null);
                                })

                            // Мы оборачиваем функцию mStreamFinished, которая работает с коллбэками, в Promise с пом. "promisify", чтобы можно было ждать ее завершения с помощью await
                            await util.promisify(mStreamFinished)(writeStream);
                        }

                        // подфункция для ожидания завершения стрима
                        // Аргумент "stream" передается видимо автоматически, когда функция вызывается из "util.promisify"
                        function mStreamFinished(stream) {

                            return new Promise((resolve, reject) => {
                                stream.on('finish', resolve);
                                stream.on('error', reject);
                            });

                        }

                        // Это необязательно -  делаем доп проверку для предупредительного сообщения, существует ли более одного файла в МонгоДБ с таким именем
                        if (await fined_FilesInMongoDB.hasNext()) {
                            // тут мы перешли  уже ко второму возможному элементу объекта
                            console.log(" ПРЕДУПРЕЖДЕНИЕ - найдено несколько файлов с именем 'fileName==='" + (fileName + "_ZIP"));
                        }

                        await mSubfun_downloadFile();
                    }

                    else {
                        console.log("=== Не найден файл в МонгоДБ");
                        resolve(null);
                    }


                } catch (error) {
                    console.error('Ошибка в import_AndDecompressed_AndSave_ZIP_File_FromMongoDB:');
                    console.error(error);
                    resolve(null);
                }
            })

        }

        static async deleteFiles_FromMongoDB(
            connectionToMongo_actualProject,
            fileName
        ) {
            // Тут дополнительно реализуем функцонал ожидания окончания заказчки. Для этого разбиваем код на подфункции, используем промисы
            return new Promise(async (resolve, reject) => {
                try {
                    // Создаем экземпляр GridFSBucket
                    const bucket = new GridFSBucket(connectionToMongo_actualProject.db, {
                        bucketName: 'mBuket_' + fileName + "_ZIP"
                    });

                    // ВАЖНО - ожидание асинхронности в след присваивании результатов от bucket  достигается за счет оператора  toArray(): Этот метод преобразует результаты курсора в массив, а сам метод возвращает промис, который можно ожидать через await.
                    const bucketList = await bucket.find({ filename: fileName + "_ZIP" }).toArray();

                    //  console.log("bucketList=");
                    //  console.log(bucketList);

                    const files_ID_list = [];
                    // из полученного перечня файлов извлекаем ID и добавляем в отдельный массив id-номеров 
                    bucketList.forEach((elem) => {
                        files_ID_list.push(elem._id.toString()); // НЕ ОБЯЗАТЕЛЬНО -  преобразуем к строке 
                    });

                    //  console.log("files_ID_list=");
                    //  console.log(files_ID_list);

                    let counterFiles = 0;

                    await deleteFilesListFromMongoDB();

                    async function deleteFilesListFromMongoDB() {
                        for (const elem of files_ID_list) {
                            // console.log("Удаляем файл с ID: " + elem);
                            const fileObjectId = new ObjectId(elem);
                            // Удаление из МонгоДБ
                            try {
                                await deleteOneFileFromMongoDB(fileObjectId);
                            } catch (error) {
                                console.log("Ошибка удаления файла: " + elem);
                            }
                        }
                        // console.log("Количество удаленных файлов= " + counterFiles);
                        resolve();
                    }

                    async function deleteOneFileFromMongoDB(fileObjectId) {
                        return new Promise((resolve, reject) => {
                            bucket.delete(fileObjectId, (err) => {
                                if (err) {
                                    console.error(`Ошибка при удалении файла в МонгоДБ с ID: ${fileObjectId}`, err);
                                    resolve(null);
                                }

                                //  console.log(`Файл с ID ${fileObjectId} удален.`);
                                counterFiles++;
                                resolve(null);
                            });
                        });
                    }

                } catch (error) {
                    console.error('Ошибка в deleteFiles_FromMongoDB:');
                    console.error(error);
                    resolve(null);
                }
            })

        }


    }

    // =========================
    // =========================
    // =========================

    static telegramBot_Servise = class {

        static connection_to_CurrentTelegramBot(accessToken_forCurrentTelegramBot) {
            return new TelegramBot(accessToken_forCurrentTelegramBot, { polling: true });
        }

        static listenerCurrentTelegramBot(connection_to_CurrentTelegramBot) {
            connection_to_CurrentTelegramBot.on('message', (msg) => {
                console.log(msg);
                connection_to_CurrentTelegramBot.sendMessage(msg.chat.id, `Вы отправили сообщение: "${msg.text}"`);
            })
        }

        static async myMessegesToCurrentTelegramBot(
            connection_to_CurrentTelegramBot, // соединение с текущим ботом
            client_telegramAccount_ID, // id пользователя
            projectNumber, // название_id проекта
            text,  // текст сообщения
            emodzi,  //  емодзи
            keyBoardParams // это передаваемая клавиатура для телеграм-Бота
        ) {
            return new Promise(async (resolve, reject) => {
                try {
                    await connection_to_CurrentTelegramBot.sendMessage(
                        client_telegramAccount_ID,
                        //  "_________________" + 
                        (emodzi ? (emodzi + "   ") : "") + projectNumber +
                        '\n' + text,
                        keyBoardParams
                    );
                    resolve();
                } catch (error) {
                    console.log('Ошибка в myMessegesToCurrentTelegramBot:');
                    console.log(error);
                    resolve();
                }
            })
        }
    }

}