


// projectNameID выносим наружу, поскольку внутри объекта делаем с ним итерации до того, как сам объект будет инициализирован, что вызывает ошибку
const projectNameID = "pr0002";
const commentNameCurrentProject = "BTC_USD_signal";


const config_pr0002 = {
    projectNameID: projectNameID,
    commentNameCurrentProject: commentNameCurrentProject,
    // путь к папке с БД
    localFilesAdress: '../DataBasesAllProjects/DataBase_' + projectNameID + '/',
    static_Adress: '../DataBasesAllProjects/DataBase_' + projectNameID + "/staticFiles_" + projectNameID + '/',
    // названия файлов с данными
    mFileName___usersReestrTelegram: projectNameID + "__usersReestrTelegram.json",

    telegramAccessToken___BTC_USD_signal: '1849534701:AAEUXK06JCzmab49WrgipUUlPtiPtzxKUxw',
    id___BTC_USD_signal: '1849534701',  // проверить !!! 
    adminTelegramAccount_ID_pr0002: 1668193760,

    // Доступ к МонгоДБ
    // Важно!- к основному адресу дописываем имя пользователя и пароль. Имя кластера для всех проектов остается cluster-pr0001, т.к. его невозможно изменить. В конце добавляем bd_pr0002 - это имя целевой базы данных. 
    // Также важно - для данного админа в монго ДБ устанавливаем доступ только к целевой БД, делаем это на странице: https://cloud.mongodb.com/v2/66afc140a4ad243040e95eff#/security/database
    mMongoURL_pr0002: 'mongodb+srv://adminServer_pr0002:jgjgJGHHJJ744@cluster-pr0001.vsenbpi.mongodb.net/bd_pr0002'


}
//------------------
export default config_pr0002;