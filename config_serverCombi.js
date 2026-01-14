
const config_serverCombi = {
    projectNameID: "serverCombi",
    serverAdress: 5075,
    telegramAccessToken___myInfoTelegramBot: '7280924078:AAEPXyvl8coKV_pS8KeuvnhKYfRh4UCxYBc',
    adminTelegramAccount_ID_for_information: 1668193760, // сюда отправляем уведомления Телеграм

    // этот ключ хранится на моем Аккаунте Гугл в настройках приложения
    mGoogle_client_id: "13412525524-p1m2k49aaloiilh6j5pkpkr152f2nckg.apps.googleusercontent.com",

    emodziListTelegram_currentProject: {
        default_currentProjectEmodzi: '💻', // square_black      //  '💻',

        variants: {
            // квадраты
            square_red: '\u{1F7E5}',
            square_yellow: '\u{1F7E8}',
            square_green: '\u{1F7E9}',
            square_blue: '\u{1F7E6}',
            square_orange: '\u{1F7E7}',
            square_purple: '\u{1F7EA}',

            square_black: '\u{2B1B}',       // ⬛
            square_white: '\u{2B1C}',       // ⬜
            square_brown: '\u{1F7EB}',      // 🟫
            square_light_blue: '\u{1F7E6}', // 🟦 (у тебя уже есть)
            square_pink: '\u{1F7E8}',       // 🟨 (иногда используют для желто-розового)

            // =========================
            // круги
            circle_red: '\u{1F534}', // Red Circle
            circle_yellow: '\u{1F7E1}', // 🟡 Yellow Circle
            circle_green: '\u{1F7E2}', // 🟢 Green Circle
            circle_blue: '\u{1F535}', // Blue Circle
            circle_orange: '\u{1F7E0}', // 🟠 Orange Circle
            circle_purple: '\u{1F7E3}',  // 🟣 Purple Circle

            circle_black: '\u{26AB}',       // ⚫
            circle_white: '\u{26AA}',       // ⚪
            circle_brown: '\u{1F7E4}',      // 🟤
            circle_light_blue: '\u{1F535}', // 🔵
            circle_pink: '\u{1F7E7}',       // 🟧 (ближе к оранжево-розовому)
        },
    },
} 

// след переменную используем для блокирования некоторых функций во время отладки, в частнойсти: блокировка подключение к Телеграмм, отмена сохранение данных в Монго ДБ. При продакшине нужно вернуть в состояние false
const localDebugProcess = false;  //  false;

// В режиме отладки вносим изменения в конфиг
if (localDebugProcess == true) {
    config_serverCombi.localDebugProcess = true;
    config_serverCombi.serverAdress = "http://localhost:5075/";
    config_serverCombi.telegramAccessToken___myInfoTelegramBot = '7117525016:AAHHX_RLtLuLtHsUBzBdqJjpvG9fbNkmD4g'; // это отдельный бот Телеграмм для режима отладки приложений
}


//------------------
export default config_serverCombi;