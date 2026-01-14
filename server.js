

import express from "express";
import fileUpload from 'express-fileupload';
import cors from "cors";
import cookieParser from "cookie-parser";
import router_pr0001 from './_pr0001_PlanningYourBisREACT/router_pr0001.js';
import router_pr0002 from './_pr0002_BtcUsdBot/router_pr0002.js';
import router_pr0003 from './_pr0003_filesServer/router_pr0003.js';
import config_serverCombi from './config_serverCombi.js';
import config_pr0001 from './_pr0001_PlanningYourBisREACT/config_pr0001.js';
import { global_Functions_and_Servises_forAll_Projects } from './global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';


{
    // тут предотвращаем падение сервера при непредвиденных ошибках
    process.on('unhandledRejection', (reason, promise) => {
        // unhandledRejection — когда асинхронный промис завершился с ошибкой, но .catch() не был вызван.
        console.error('⚠️ Необработанное отклонение промиса:', reason);
        try {
            sendTelegramInfo_from_server("Необработанное отклонение промиса: " + reason, "💥");
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    });

    process.on('uncaughtException', (err) => {
        // uncaughtException — когда выброшена ошибка, не пойманная try/catch.
        console.error('💥 Необработанное исключение:', err);
        try {
            sendTelegramInfo_from_server("Необработанное исключение: " + err, "💥");
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    });
}





// вначале подключаемся к Телеграм-боту
export let connectionTo_infoTelegramBot = null;

try {
    connectionTo_infoTelegramBot = global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.setConnectionCurrentTelegramBot(config_serverCombi.telegramAccessToken___myInfoTelegramBot);

    // console.log(" ");
    // console.log("=== Установлено соединение с Телеграм ИНФО-БОТОМ");
} catch (error) {
    console.log(" ");
    console.log("=== ОШИБКА ПОДКЛЮЧЕНИЯ К ИНФО-БОТУ");
    console.log(error);
}


//=======================
const mServer = express();
mServer.use(cookieParser());
mServer.use(fileUpload({}));


// тут выводим в консоль поступающие запросы
/* 
mServer.use((req, res, next) => {
    console.log(" ");
    console.log("ПОСТУПИЛ ЗАПРОС НА СЕРВЕР КОМБИ, req.path = " + req.path);
    return next();
});
 */

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
mServer.use('/pr0003', router_pr0003); // посты с префиксом pr0003 - направляем сюда


// папку static  разбиваем для каждого проекта
mServer.use(
    '/pr0001',
    express.static(global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(config_pr0001.static_Adress)
    ));
const PORT = 5075;

async function startServer() {

    try {
        // затем запускаем сервер
        mServer.listen(PORT, async () => {
            console.log("");
            console.log("Server is start  " + PORT);

            if (connectionTo_infoTelegramBot) {
                try {
                    await sendTelegramInfo_from_server("Cервер перезапущен", "white");
                    // await sendTelegramInfo_from_server("Это пример моего уведомления", "white");
                } catch (error) {
                    console.log("Ошибка отправки сообщения Telegram");
                    console.log(error);
                }
            }

        });
    }
    catch (error) {
        console.log("m_ Ошибка сервера:");
        console.log(error);
    }
}

await startServer(); // запускаем сервер





export async function sendTelegramInfo_from_server(text, additional__emodzi_or_name_or_color_emodzi) {
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
            config_serverCombi.projectNameID, // Название проекта
            text, // текст сообщения
            (config_serverCombi.emodziListTelegram_currentProject.default_currentProjectEmodzi + secondEmodzi + " ") //емодзи из переменной, из списка 
        )

    } catch (error) {
        console.log("Ошибка отправки сообщения Telegram");
        console.log(error);
    }
}
