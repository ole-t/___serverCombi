

import config_serverCombi from '../config_serverCombi.js';

// projectNameID выносим наружу, поскольку внутри объекта делаем с ним итерации до того, как сам объект будет инициализирован, что вызывает ошибку
const projectNameID = "pr0001";


const config_pr0001 = {
    projectNameID: projectNameID,
    // путь к папке с БД
    localFilesAdress: '../DataBasesAllProjects/DataBase_' + projectNameID + '/',

    static_Adress: '../DataBasesAllProjects/DataBase_' + projectNameID + "/staticFiles_" + projectNameID + '/',
    // названия файлов с данными
    mFileName___usersReestr: projectNameID + "__usersReestr.json",
    mFileName___projectsDB: projectNameID + "__projectsDB.json",
    mFileName___chatDB: projectNameID + "__chatDB.json",    


    // clientAdress: 'http://localhost:3000',
    // clientAdress: "litepm.com",
    clientAdress: "ole-t.github.io/lite_PM",

    emodziListTelegram_currentProject: {
        default_currentProjectEmodzi: '♻️',
    },

    intervalSaveData_localDisk: 600000,  // раз в 10 мин  600000
    intervalSaveData_mongoDB: 3600000,  // раз в час 3600000

    filesServerPort: "https://mserver.in.net/pr0003",
    // в режиме отладки переключаем на локальный
    filesServerPort: config_serverCombi.localDebugProcess ? "http://localhost:5075/pr0003" : "https://mserver.in.net/pr0003",

  
    //  список ЕндПоинтов, которые не требуют Токен доступа
    exclusionaryEndpoints: [
        "/changePassword",
        "/logIn",
        '/get_full_data_from_server',
        '/needDownload_clientsContractsData_fromGitHub',

    ],


    // Доступ к МонгоДБ
    // Важно!- к основному адресу дописываем имя нашей БД, которую бы создали в Mongo (bd_pr0001)
    mMongoURL_pr0001: 'mongodb+srv://admin:ksjdf6766767GHGGHJHH@cluster-pr0001.vsenbpi.mongodb.net/bd_pr0001',

    githab_cms_repo_pr0001: {
        OWNER: "ole-t",        // имя пользователя или организации
        REPO: "clientsContracts_pr0001",  // название репозитория
        FILE_PATH: "clientsContracts_pr0001.json", // путь к файлу внутри репозитория. ТАКЖЕ ИСПОЛЬЗУЕМ ДЛЯ ЛОКАЛЬНОГО ИМЕНИ ФАЙЛА
        BRANCH: "main",     // ветка, где находится файл
        GITHUB_TOKEN: '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',
    },

    data_limits: {
        user_Email_longLimit: 100,
        name_corpAcc_longLimit: 100,
        name_project_longLimit: 100,
        name_subProject_longLimit: 100,
        message_longLimit: 100,
    },

    default_limits_forOneUser: {
        // лимиты по умолчанию, могут быть перезаписаны данными из файла CMS при скачивании
        defaultMaxCount_freeContacts: 1000,
        defaultMaxCount_freeCorpAccounts: 40,
        defaultMaxCount_freeProjects_inEachCorpAccount: 100,
        defaultMaxCount_freeSubProjects_inEachProject: 100,
        defaultMaxCount_freeMessages_inEachChat: 10000,
    }
}

// Это мой секретный код на Гитхабе при отправке запросов моему серверу, чтобы я мог проверить подлинность источника  запроса. Он добавится в виде СИГНАТУРЫ (хешируется) в заголовки запроса под названием X-Hub-Signature-256
//  hfsdJHJH66565%^%

//  Это токен от ngrok
//     33mWH1FIiE4xfSlbUdBOcoDehEZ_7pMr36LYm4vczgPsPyij7

// Это временный IP адрес для доступа из ГитХаб к локальному серверу 5075 на моем компе
/* 
Account                       olegtarasov2014@gmail.com (Plan: Free)
Version                       3.30.0
Region                        Europe (eu)
Latency                       28ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://agrostographical-nondissipatedly-isobel.ngrok-free.dev -> http://localhost:5075

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00



К этому адресу добавь путь вебхука, который есть в твоём сервере. Например, если сервер слушает /github-webhook:

https://agrostographical-nondissipatedly-isobel.ngrok-free.dev/needDownload_clientsContractsData_fromGitHub



Этот URL вставляешь в GitHub → Settings → Webhooks → Payload URL.


                               */



//------------------
export default config_pr0001;