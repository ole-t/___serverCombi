

const projectNameID = "pr0003";

const config_pr0003 = {
    projectNameID: projectNameID,
    // путь к папке с Реестром
    localFilesAdress: '../DataBasesAllProjects/DataBase_' + projectNameID + '/',
    // названия файлов с Реестром
    usersFilesReestr: projectNameID + "__usersFilesReestr.json",

    // путь к папке с пользовательскими файлами
    usersDownloadFilesAdress: '../DataBasesAllProjects/DataBase_' + projectNameID + '/usersDownloadFiles/',

    // clientAdress: 'http://localhost:3000',
    clientAdress: "ole-t.github.io/lite_PM",

    // mainServerAdress: "https://mserver.in.net/pr0001",
    mainServerAdress: "http://localhost:5075/pr0001",


    intervalSaveData_localDisk:600000,  //  600000,  // раз в 10 мин 600000

    emodziListTelegram_currentProject: {
        default_currentProjectEmodzi: '⚡️',
    },

    serverErrorsAnsvers: {
        'er_500': "Files Servise Error",
        'er_530': "TokenNoConfirm",
        'er_531': "userNoHasAccessToProject",
        'er_532': "projectNoSupportAttacheFiles",
        'er_533': "increasedSpaceLimitForPr[ject",
        'er_533': "increasedSpaceLimitForPr[ject",
    },

    timeSaveCashData: 10000,  // 60000, // время актуальности данных в Кеше, ставим 10 мин.
    // лимиты по умолчанию, могут быть перезаписаны данными из файла CMS при скачивании
    maxTotalSpaceInServerForFiles: 1000000000,    //  5000000000, // максимальное место на сервере для хранения файлов - 5Гбт
    periodAlerts_totalSpaceDisk: 3600000, // раз в час проверять и отправлять при необх сообщения

    default_limits_forOneUser: {
        defaultFreeSpaceForFiles_forOneUser: 100000000, // выделенное по умолчанию бесплатное место для хранения файлов - 50Мбт
        maxSizeSingleFile: 200000000,
    },


    // Доступ к МонгоДБ
    // Важно!- к основному адресу дописываем имя нашей БД, которую бы создали в Mongo (bd_pr0001)
    mMongoURL_pr0003: 'mongodb+srv://admin:ksjdf6766767GHGGHJHH@cluster-pr0003.vsenbpi.mongodb.net/bd_pr0003',


    emodziListTelegram_currentProject: {
        default_currentProjectEmodzi: '💼',  //  '💾',

        variants: '🖥️  💻 📈  📉 📊 ✅ 🔄 📅 💼 🆕 ⚠️  ❗ 🛑 ⛔  💲 ₿  🏆 🔴 🔵 🟥 🟨 🟩 🟦            🟥 🟧 🟨 🟩 🟦 🟪 ⬛️ ⬜️ 🟫            📒 📕 📗 📘 📙        🟣 🔵 🟢 🟡 🔴           🔴 🟠 🟡 🟢 🔵 🟣 ⚪️ 🟤   💚 💜 💙 💛         🩷 ❤️ 🧡 💚 🩵 💙 💜 🩶 🤍 🤎 💔      ⚡️ 🔥 🍏 🍎  ❤️‍🔥 ❤️‍🩹 💗 🔺 🔻 🔸 🔹 🔶 🔷 🔳 ◻️  ♥️    ❌         👌 ',
    },


}

//------------------
export default config_pr0003;