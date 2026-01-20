

import express from "express";
import fileUpload from 'express-fileupload';
import cors from "cors";
import cookieParser from "cookie-parser";
import router_pr0001 from './_pr0001_PlanningYourBisREACT/router_pr0001.js';
import router_pr0002 from './_pr0002_BtcUsdBot/router_pr0002.js';

import config_serverCombi from './config_serverCombi.js';
import config_pr0001 from './_pr0001_PlanningYourBisREACT/config_pr0001.js';
import { global_Functions_and_Servises_forAll_Projects } from './global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';

import { sendTelegramInfo_from___SERVER_COMBI } from './infoBotTelegram___server_combi.js'

//=======================

console.log(" ");
console.log("=== === ЗАПУСК  server_combi");


{
    // тут предотвращаем падение сервера при непредвиденных ошибках
    process.on('unhandledRejection', (reason, promise) => {
        // unhandledRejection — когда асинхронный промис завершился с ошибкой, но .catch() не был вызван.
        console.error('⚠️ Необработанное отклонение промиса:', reason);
        try {
            sendTelegramInfo_from___SERVER_COMBI(
                "Необработанное отклонение промиса: " + reason,
                "💥"
            );
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    });

    process.on('uncaughtException', (err) => {
        // uncaughtException — когда выброшена ошибка, не пойманная try/catch.
        console.error('💥 Необработанное исключение:', err);
        try {
            sendTelegramInfo_from___SERVER_COMBI(
                "Необработанное исключение: " + err,
                "💥"
            );
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    });
}

//=======================
const mServer = express();
mServer.use(cookieParser());
mServer.use(fileUpload({}));

// тут выводим в консоль поступающие запросы
mServer.use((req, res, next) => {
    // след условие - чтобы не дублировать дважды один запрос в Логах, потому что пост состоит из двух автоматических частей: браузер сначала отправляет preflight-запрос типа OPTIONS. После этого браузер отправляет уже основной POST/GET
    //    if (req.method === 'OPTIONS') {
    //        console.log(`ПОСТУПИЛ ЗАПРОС: ${req.method} ${req.path}`);
    //    }
    // В консоли запрос будет дублироваться дважды - с методом OPTIONS и с методом POST
    console.log(" ");
    console.log(`ПОСТУПИЛ ЗАПРОС на server_combi: ${req.method} ${req.path}`);
    return next();
});


mServer.use(cors({
    origin: [
        "https://web.postman.com",
        "http://localhost:3000",
        "https://litepm.com",
        "http://litepm.com",
        "https://ole-t.github.io",
    ],
    methods: ['GET', 'POST'],
    // след для разрешения отправки Куки
    credentials: true,
}
));

mServer.options('*', cors()); // !!! ДОБАВЛЕНО после того, как сервер перестал отвечать на запросы !!!    Эта строка нужна для обработки preflight-запросов (OPTIONS)

mServer.use(express.json());

// Тут распределяем посты по роутерам различных проектов

mServer.use('/pr0001', router_pr0001); // посты с префиксом pr0001  все запросы без префикса отправляем на роутер проекта "pr0001", поскольку при его создании не планировалось маркировать посты по различным проектам на одном сервере
mServer.use('/pr0002', router_pr0002); // посты с префиксом pr0002 - направляем сюда
// mServer.use('/pr0003', router_pr0003); // посты с префиксом pr0003 - направляем сюда


// папку static  разбиваем для каждого проекта
mServer.use(
    '/pr0001',
    express.static(global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(config_pr0001.static_Adress)
    ));

const PORT = 5075;

async function startServer() {

    try {
        // затем запускаем сервер
        mServer.listen(PORT, "127.0.0.1", async () => {
            console.log("");
            console.log("server_combi is start, порт: " + PORT);

            try {
                await sendTelegramInfo_from___SERVER_COMBI(
                    "Cервер перезапущен",
                    "white"
                );

            } catch (error) {
                console.log("Ошибка отправки сообщения Telegram");
                console.log(error);
            }
        });
    }
    catch (error) {
        console.log("m_ Ошибка сервера:");
        console.log(error);
    }
}

await startServer(); // запускаем сервер

// В консоли вызывать:    npx nodemon server_combi.js

// Для запуска сразу двох серверов локально, в консоли VSC:
//         npx concurrently "nodemon server_combi.js" "nodemon server_pr0003.js"

//  Или так, чтобы Нод Емон не вызывал дважды
//        npx concurrently "node server_combi.js" "node server_pr0003.js"


// Для запуска через powerShell ЛОКАЛЬНО, без nodeEmone:
//      Start-Process node server_combi.js; Start-Process node server_pr0003.js


