


// projectNameID выносим наружу, поскольку внутри объекта делаем с ним итерации до того, как сам объект будет инициализирован, что вызывает ошибку
const projectNameID = "pr0001";


const config_pr0001 = {
    projectNameID: projectNameID,
    // путь к папке с БД
    localFilesAdress: '../DataBase_' + projectNameID + '/',

    static_Adress: '../DataBase_' + projectNameID + "/staticFiles_" + projectNameID + '/',
    // названия файлов с данными
    mFileName___projects_DB: projectNameID + "__projectsDB.json",
    mFileName___users_Reestr: projectNameID + "__usersReestr.json",
    mFileName___chat_DB: projectNameID + "__chatDB.json",

    // clientAdress: 'http://localhost:3000',
    // clientAdress: "litepm.com",
    clientAdress: "ole-t.github.io/lite_PM",

    emodziListTelegram_currentProject: {
        defaul_currentProjectEmodzi: '',


    },

    // Доступ к МонгоДБ
    // Важно!- к основному адресу дописываем имя нашей БД, которую бы создали в Mongo (bd_pr0001)
    mMongoURL_pr0001: 'mongodb+srv://admin:ksjdf6766767GHGGHJHH@cluster-pr0001.vsenbpi.mongodb.net/bd_pr0001'
}
 
//------------------
export default config_pr0001;