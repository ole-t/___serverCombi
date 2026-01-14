
import fetch from "node-fetch";
import config_pr0001 from './config_pr0001.js';
import { functions___pr0001 } from './postService_pr0001.js';

let currentIndex_saveObject = 0;   // тут либо 0, либо 1
let saveObject = [ // тут находятся два однородных объекта для поочередного накопления данных, которые затем отправляются на файловый сервер
    {
        deleting_Projects: [],
        deleting_corpAccounts: [],
    },

    {
        deleting_Projects: [],
        deleting_corpAccounts: [],
    },
];

// эта фун очищает нужный объект (0 либо 1) в объекте для хранения списков
function return_clearSaveObj_item() {
    return (
        {
            deleting_Projects: [],
            deleting_corpAccounts: [],
        }
    )
}


async function control_and_send_data_to_filesServer() {

    while (true) { // это бесконечный цикл, выполняет свой блок кода постоянно, пока не произойдёт явный выход из него (break, return, throw и т.п.).  

        // 🔁 Ждём 10 секунд перед следующей итерацией
        await new Promise(resolve => setTimeout(resolve, 10000));

        // console.log(" ");
        // console.log("Запуск control_and_send_data_to_filesServer");

        try {
            // console.log(" ");
            // console.log("Запуск control_and_send_data_to_filesServer");
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

                // начинаем отправку накопленных данных на файловый сервер
                let sendResult;
                try {
                    sendResult = await sendPostToFilesServer(saveObject[oldObjIndex_toSendData]);
                } catch (error) {
                    console.log("Ошибка при попытке отправить данные:", error);
                    sendResult = { status: 500 };
                }

                // console.log(" ");
                // console.log("sendResult из control_and_send_data_to_filesServer= ");
                // console.log(sendResult);

                // проверяем результат отправки
                if (sendResult?.status != 200) {
                    // при неудачной отправке копируем старые данные в новый накопительный стек для повторной отправки
                    console.log(" ");
                    console.log("Ошибка отправки, повторно добавляем в исходящий стек неотправленные данные= ");

                    try {
                        let count_reCopyesDeleting_Projects = 0;
                        // сначала переписываем проекты
                        saveObject[oldObjIndex_toSendData].deleting_Projects.forEach(item => {
                            addProject_toDeletingFiles(
                                item.parent_owner_Email,
                                item.corpAccount_ID,
                                item.project_ID,
                            );
                            count_reCopyesDeleting_Projects++;
                        })

                        // затем корп аккаунты
                        let count_reCopyesDeleting_corpAccounts = 0;
                        saveObject[oldObjIndex_toSendData].deleting_corpAccounts.forEach(item => {
                            // saveObject[newObjIndex_toSaveNewData].deleting_corpAccounts.push(item);
                            addCorpAcc_toDeletingFiles(
                                item.parent_owner_Email,
                                item.corpAccount_ID,
                            );
                            count_reCopyesDeleting_corpAccounts++;
                        })

                        // console.log(" ");
                        // console.log("saveObject[currentIndex_saveObject].deleting_Projects =");
                        // console.log(saveObject[currentIndex_saveObject].deleting_Projects);

                    } catch (error) {
                        console.log(" ");
                        console.log("Ошибка при попытке повторно копировать неотправленные данные стек исходящих данных");
                        console.log(error);
                    }

                    console.log(" ");
                    console.log("saveObject= ");
                    console.log(saveObject[currentIndex_saveObject]);

                    // отправляем себе уведомление
                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        "Ошибка отправки из control_and_send_data_to_filesServer на файловый сервер",
                        "red"
                    )
                }
                else {
                    // console.log(" ");
                    // console.log("Данные были успешно переданы на файловый сервер");

                    // отправляем себе уведомление
                    functions___pr0001.sendTelegramInfo_from_pr0001(
                        "Данные были успешно переданы на файловый сервер из control_and_send_data_to_filesServer",
                        "green"
                    )
                }
            }
            else {
                // console.log("Нет данных для отправки...");
            }
        } catch (error) {
            console.log("Ошибка при проверке необходимости передавать данные", error);
        }
    }
}
// запускаем контроль отправки данных
control_and_send_data_to_filesServer();

// это функция отправки поста на файловый сервер
async function sendPostToFilesServer(dataToSend) {
    const mURL = config_pr0001.filesServerPort + "/list_of_DeletingProjects_and_corpAccounts_fromMainServer";
    try {
        const res = await fetch(mURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });
        const jsonData = await res.json();
        jsonData.status = res.status;  // Тут из заголовка ответа извлекаем статус, и после распарсивания ответа, пристегиваем статус к объекту. Поскольку после распарсивания заголовки становятся недоступны, остается только тело ответа, а доступ к статусу ответа потребуется дальше
        return jsonData;
    } catch (error) {
        console.log(" ");
        console.log("Ошибка в sendPostToFilesServer ");
        console.log(error);
        return { error: error.message };
    }
}


// ========================================

// Эта функция добавляет удаленные проекты для последующего удалеия пристегнутых файлов
export function addProject_toDeletingFiles(
    parent_owner_Email,
    corpAccount_ID,
    project_ID,
) {

    // console.log(" ");
    // console.log('ЗАПУСК addProject_toDeletingFiles, arguments=');
    // console.log(arguments);

    try {
        saveObject[currentIndex_saveObject].deleting_Projects.push(
            {
                parent_owner_Email: parent_owner_Email,
                corpAccount_ID: corpAccount_ID,
                project_ID: project_ID,
            }
        );
    } catch (error) {
        console.log("Ошибка в f_addProject_toDeletingFiles", error);
    }
}

// Эта функция добавляет удаленные корпАккаунты для последующего удалеия пристегнутых файлов
export function addCorpAcc_toDeletingFiles(
    parent_owner_Email,
    corpAccount_ID,
) {
    console.log(" ");
    console.log('ЗАПУСК addCorpAcc_toDeletingFiles, arguments=');
    console.log(arguments);

    try {
        saveObject[currentIndex_saveObject].deleting_corpAccounts.push(
            {
                parent_owner_Email: parent_owner_Email,
                corpAccount_ID: corpAccount_ID,
            }
        );
    } catch (error) {
        console.log("Ошибка в файлов", error);
    }
}



