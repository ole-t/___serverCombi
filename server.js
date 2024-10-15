
import express from "express";
import fileUpload from 'express-fileupload';
import cors from "cors";
import cookieParser from "cookie-parser";
import router_pr0001 from './_pr0001_PlanningYourBisREACT/router_pr0001.js';
import router_pr0002 from './_pr0002_BtcUsdBot/router_pr0002.js';
import config_serverCombi from './config_serverCombi.js';
import config_pr0001 from './_pr0001_PlanningYourBisREACT/config_pr0001.js';
// import { mListenerTelegramBot, MyMessegesToTelegramInfoChat, emodziListTelegram } from './global_telegramBot_forCombiServer/global_telegramBot_forCombiServer.js';
import global_Functions_and_Servises_forAll_Projects from './global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import global_Data_forAllProjects from './global_Functions_and_Servises_forAll_Projects/global_Data_forAllProjects.js';

export let connection_to_my_InfoTelegramBot;

//=======================
const mServer = express();
mServer.use(cookieParser());
mServer.use(fileUpload({}));
mServer.use(cors({
    origin: [
        "https://web.postman.co",

        "http://localhost:3000",
        "https://litepm.com",
        "http://litepm.com",
        "https://ole-t.github.io",
        "https:3.124.62.35", // - проверить, работает ли это. Это может быть полезным, чтобы не присваивать серверу доменное имя, а пользоваться только статичным IP-адресом
        "3.124.62.35", // - проверить, работает ли это. Это может быть полезным, чтобы не присваивать серверу доменное имя, а пользоваться только статичным IP-адресом
    ],
    // след необязательно - указывает тип допустимых запросов
    // methods: ['GET', 'POST'],
    // след для разрешения отправки Куки
    credentials: true,
}
));

mServer.use(express.json());
// Тут распределяем посты по роутерам различных проектов
mServer.use('/pr0001', router_pr0001); // все запросы без префикса отправляем на роутер проекта "pr0001", поскольку при его создании не планировалось маркировать посты по различным проектам на одном сервере
mServer.use('/pr0002', router_pr0002); // посты с префиксом pr0002 - направляем сюда


// папку static  разбиваем для каждого проекта
mServer.use(
    '/pr0001',
    express.static(global_Functions_and_Servises_forAll_Projects.get_valid_adress_fileOrFolder(config_pr0001.static_Adress)
    ));


    
const PORT = 5075;
async function mStartApp() {

    // подключаемся к телеграм боту для получения оповещений
    // export let connection_to_my_InfoTelegramBot;
    try {
        connection_to_my_InfoTelegramBot = global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.connection_to_CurrentTelegramBot(config_serverCombi.telegramAccessToken___myInfoTelegramBot);
        // Запускаем слушатель ТелеграмБота
        global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.listenerCurrentTelegramBot(connection_to_my_InfoTelegramBot);
    } catch (error) {
        console.log("Ошибка запуска функций Telegram");
        console.log(error);
    }

    try {
        // затем запускаем сервер
        mServer.listen(PORT, async () => {
            console.log("");
            console.log("Server is start  " + PORT);

            // сообщение в телеграм
            try {
                await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                    connection_to_my_InfoTelegramBot,
                    config_serverCombi.adminTelegramAccount_ID_for_information,
                    " ___serverCombi", // Название проекта
                    "Cервер перезапущен", // текст сообщения
                    config_serverCombi.emodziListTelegram_currentProject.defaul_currentProjectEmodzi //емодзи из переменной, из списка 
                );
                await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                    connection_to_my_InfoTelegramBot,
                    config_serverCombi.adminTelegramAccount_ID_for_information,
                    "", // Название проекта
                    "Это пример моего уведомления", // текст сообщения
                    null // emodziListTelegram.emodzi_001     емодзи из переменной, из списка
                )
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
mStartApp(); // запускаем сервер