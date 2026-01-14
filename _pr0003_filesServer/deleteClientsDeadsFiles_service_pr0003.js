import fs from 'fs/promises';
import {global_Functions_and_Servises_forAll_Projects} from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import config_pr0003 from './config_pr0003.js';
import { vars_and_functions___pr0003 } from './postService_pr0003.js'

let currentIndex_saveObject = 0;   // тут либо 0, либо 1
// тут находятся два объекта для поочередного накопления данных, которые затем отправляются на файловый сервер
export let saveObject = [
    {
        deleting_Projects: [],
        deleting_corpAccounts: [],
    },

    {
        deleting_Projects: [],
        deleting_corpAccounts: [],
    },
];

// эта фун возвращает очищенный реестр для хранения списков
function return_clearSaveObj_item() {
    return {
        deleting_Projects: [],
        deleting_corpAccounts: [],
    }
}

async function deleting_deadFiles_deletesProjects_and_corpAccounts_pr0003() {
    while (true) { // это бесконечный цикл, выполняет свой блок кода постоянно, пока не произойдёт явный выход из него (break, return, throw и т.п.).  
        // 🔁 Ждём 10 секунд перед следующей итерацией
        await new Promise(resolve => setTimeout(resolve, 10000));
        // console.log(" ");
        // console.log("Запуск  deleting_deadFiles_deletesProjects_and_corpAccounts_pr0003");
        try {
            // console.log(" ");
            // console.log("Запуск deleting_deadFiles_deletesProjects_and_corpAccounts_pr0003");
            if (
                (saveObject[currentIndex_saveObject].deleting_Projects.length > 0)
                ||
                (saveObject[currentIndex_saveObject].deleting_corpAccounts.length > 0)
            ) {
                // запоминаем индекс (0 либо 1) предыдущего объекта, из которого будем отправлять данные
                let oldObjIndex_toSendData = currentIndex_saveObject;
                // устанавливаем номер свежего объекта, в который будем накапливать поступающие данные
                currentIndex_saveObject = (currentIndex_saveObject == 0 ? 1 : 0);
                // обнуляем содержимое нового объекта для накопления данных
                saveObject[currentIndex_saveObject] = return_clearSaveObj_item();

                // сначала удаляем проекты
                for (const item of saveObject[oldObjIndex_toSendData].deleting_Projects) {
                    await delete_all_files_ofCurrentProject(
                        item.parent_owner_Email,
                        item.corpAccount_ID,
                        item.project_ID
                    )
                };

                // далее удаляем корп аккаунты
                for (const item of saveObject[oldObjIndex_toSendData].deleting_corpAccounts) {
                    await delete_all_files_ofCurrentCorpAcc(
                        item.parent_owner_Email,
                        item.corpAccount_ID,
                    )
                };
            }
            else {
                // console.log("Нет данных для удаления ...");
            }
        } catch (error) {
            console.log("Ошибка в deleting_deadFiles_deletesProjects_and_corpAccounts_pr0003", error);
        }
    }
}
// запускаем контроль отправки данных
deleting_deadFiles_deletesProjects_and_corpAccounts_pr0003();


async function delete_all_files_ofCurrentProject(
    parent_owner_Email,
    corpAccount_ID,
    project_ID
) {
    // console.log(" ");
    // console.log("Запуск delete_all_files_ofCurrentProject, arguments= ");
    // console.log(arguments);

    try {
        if (vars_and_functions___pr0003.usersFiles_Reestr[parent_owner_Email]?.corpAccounts[corpAccount_ID]?.projects[project_ID]) {

            // определчем ID владельца для получения пути на диске
            let owner_ID = vars_and_functions___pr0003.usersFiles_Reestr[parent_owner_Email].owner_ID;

            let pathDeleteProjectFolder = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(
                config_pr0003.usersDownloadFilesAdress + '/users_ID/' + owner_ID + '/corpAccounts_ID/' + corpAccount_ID + '/projects_ID/' + project_ID
            );

            // удаляем с диска вложенные файлы и папку проекта
            try {
                await fs.rm(pathDeleteProjectFolder, { recursive: true, force: true });
                //  recursive: true — удалить всё содержимое.  force: true — игнорировать несуществующие пути и ошибки прав доступа.
                console.log(`Папка "${pathDeleteProjectFolder}" удалена`);
            } catch (err) {
                console.error(`Ошибка при удалении папки: ${err.message}`);
            }

            // Дублируем код с небольшой задержкой, потому что верхняя папка не всегда удаляется, вероятно не сразу успевает сняться блокировка из за процесса удаления вложенных файлов и папок
            try {
                await new Promise(r => setTimeout(r, 1000)); // делаем задержку
                // поаторяем удаление
                await fs.rm(pathDeleteProjectFolder, { recursive: true, force: true });
                //  recursive: true — удалить всё содержимое.  force: true — игнорировать несуществующие пути и ошибки прав доступа.
                console.log(`Папка "${pathDeleteProjectFolder}" удалена`);
            } catch (err) {
                console.error(`Ошибка при удалении папки: ${err.message}`);
            }

            // удаляем из реестра запись данного проекта
            delete vars_and_functions___pr0003.usersFiles_Reestr[parent_owner_Email].corpAccounts[corpAccount_ID].projects[project_ID];
        }

        else {
            // console.log(" ");
            // console.log("Не найден удаляемый проект в реестре файлов, arguments= ");
            // console.log(arguments);
        }


    } catch (error) {
        console.log(" ");
        console.log("Ошибка в delete_all_files_ofCurrentProject");
        console.log(error);

        // отправляем себе уведомление
        try {
            vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                "Ошибка в delete_all_files_ofCurrentProject: " + error,
                "red"
            )
        } catch (error) {
            console.log("Ошибка отправки себе  сообщения в delete_all_files_ofCurrentProject");
            console.log(error);
        }
    }
}


async function delete_all_files_ofCurrentCorpAcc(
    parent_owner_Email,
    corpAccount_ID
) {
    console.log(" ");
    console.log("Запуск delete_all_files_ofCurrentCorpAcc, arguments= ");
    console.log(arguments);

    try {
        if (vars_and_functions___pr0003.usersFiles_Reestr[parent_owner_Email]?.corpAccounts[corpAccount_ID]) {

            // определчем ID владельца для получения пути на диске
            let owner_ID = vars_and_functions___pr0003.usersFiles_Reestr[parent_owner_Email].owner_ID;

            let pathDeleteCorpAccFolder = global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.get_valid_adress_fileOrFolder(
                config_pr0003.usersDownloadFilesAdress + '/users_ID/' + owner_ID + '/corpAccounts_ID/' + corpAccount_ID
            );

            // удаляем с диска вложенные файлы и папку корп Аккаунта
            try {
                await fs.rm(pathDeleteCorpAccFolder, { recursive: true, force: true });
                //  recursive: true — удалить всё содержимое.  force: true — игнорировать несуществующие пути и ошибки прав доступа.
                console.log(`Папка "${pathDeleteCorpAccFolder}" удалена`);
            } catch (err) {
                console.error(`Ошибка при удалении папки: ${err.message}`);
            }

            // Дублируем код с небольшой задержкой, потому что верхняя папка не всегда удаляется, вероятно не сразу успевает сняться блокировка из за процесса удаления вложенных файлов и папок
            try {
                await new Promise(r => setTimeout(r, 1000)); // делаем задержку
                // поаторяем удаление
                await fs.rm(pathDeleteCorpAccFolder, { recursive: true, force: true });
                //  recursive: true — удалить всё содержимое.  force: true — игнорировать несуществующие пути и ошибки прав доступа.
                console.log(`Папка "${pathDeleteCorpAccFolder}" удалена ПРИ ПОВТОРНОЙ ПОПЫТКЕ`);
            } catch (err) {
                console.error(`Ошибка при удалении папки  ПРИ ПОВТОРНОЙ ПОПЫТКЕ: ${err.message}`);
            }



            // удаляем из реестра запись данного корп Аккаунта
            delete vars_and_functions___pr0003.usersFiles_Reestr[parent_owner_Email].corpAccounts[corpAccount_ID];
        }

        else {
            console.log(" ");
            console.log("Не найден корп аккаунт в реестре файлов, arguments= ");
            console.log(arguments);
        }


    } catch (error) {
        console.log(" ");
        console.log("Ошибка в delete_all_files_ofCurrentCorpAcc");
        console.log(error);

        // отправляем себе уведомление
        try {
            vars_and_functions___pr0003.sendTelegramInfo_from_pr0003(
                "Ошибка в delete_all_files_ofCurrentCorpAcc: " + error,
                "red"
            )
        } catch (error) {
            console.log("Ошибка отправки себе  сообщения в delete_all_files_ofCurrentCorpAcc");
            console.log(error);
        }
    }
}


// ========================================

// Эта функция добавляет из входящего поста объект со списком удаленных Проектов и КкорпАккаунтов во входящий стек для удаления файлов
export function add_data_to_input_steck_deleting_projects_and_corpAccounts(dell_list_Obj) {

    // console.log(" ");
    // console.log("Сработал add_data_to_input_steck_deleting_projects_and_corpAccountsб  dell_list_Obj= ");
    // console.log(dell_list_Obj);

    let fun_answer = {
        mResKod: 0,    // варианты кодов: 1-успешно, 10, 11, 12 ...   
        comment: " ",
    };

    try {
        // сначала копируем список проектов
        if (dell_list_Obj?.deleting_Projects) {
            dell_list_Obj.deleting_Projects.forEach(item => {
                saveObject[currentIndex_saveObject].deleting_Projects.push(item);
            })
            // console.log(" ");
            // console.log("Успешно переписали данные в deleting_Projects, pr0003 ");
        }
        // затем копируем список корпАккаунтов
        if (dell_list_Obj?.deleting_corpAccounts) {
            dell_list_Obj.deleting_corpAccounts.forEach(item => {
                saveObject[currentIndex_saveObject].deleting_corpAccounts.push(item);
            })
            // console.log(" ");
            // console.log("Успешно переписали данные в deleting_corpAccounts, pr0003 ");
        }

        fun_answer.mResKod = 1;
        fun_answer.comment = "Data was sucsessful accepted";
        return fun_answer;

    } catch (error) {
        console.log(" ");
        console.log("Ошибка в add_data_to_input_steck_deleting_projects_and_corpAccounts", error);

        fun_answer.mResKod = 0;
        fun_answer.comment = "Error accepted data";
        return fun_answer;
    }
}

