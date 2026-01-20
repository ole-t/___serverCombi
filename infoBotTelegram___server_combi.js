

import config_serverCombi from './config_serverCombi.js';

import { global_Functions_and_Servises_forAll_Projects } from './global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';

console.log(" ");
console.log("=== ЗАПУСК  infoBotTelegram___server_combi");

// вначале подключаемся к Телеграм-боту
export let connectionTo_infoTelegramBot___SERVER_COMBI = null;
try {
    console.log(" ");
    console.log("+++ Попытка подключения connectionTo_infoTelegramBot___SERVER_COMBI");

    connectionTo_infoTelegramBot___SERVER_COMBI = global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.setConnectionCurrentTelegramBot(
        config_serverCombi.telegramAccessToken___combi_server___infoBot
    );

    console.log(" ");
    console.log("=== Установлено соединение с Телеграм ИНФО-БОТОМ из server_combi");
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