
import fetch from "node-fetch";
import config_pr0003 from './config_pr0003.js';


export const requestToMainSever_service = {

    async access_ToFiles_ForCurrentUser_fromMainServer_REQ(mArgObj) {
        try {
            // console.log(" ");
            // console.log("ЗАПУСК access_ToFiles_ForCurrentUser_fromMainServer_REQ  = ");
            // console.log(mArgObj);

            let mURL = config_pr0003.mainServerAdress + "/FS_access_toProjectFiles";

            let postDataToServer = {
                // ...mArgObj, // пока не удалить

                parent_owner_Email: mArgObj.owner_Email,
                parent_corpAccount_ID: mArgObj.corpAccount_ID,
                project_ID: mArgObj.project_ID,
                user_Email: mArgObj.user_Email,

                gajet_ID: mArgObj.gajet_ID,
                accessToken: mArgObj.accessToken,
            }

            let answerFromMainServer = await fetch(mURL, {
                method: 'post',
                headers: {
                    accesstoken: mArgObj.accessToken,
                    'Content-Type': 'application/json',
                },
                // Отправляем аргументы в теле запроса
                body: JSON.stringify({ postDataToServer }),
            });

            try {
                // распарсиваем
                answerFromMainServer = await answerFromMainServer.json();
            } catch (error) {

                console.log(" ");
                console.log("Ошибка парсинга JSON в access_ToFiles_ForCurrentUser_fromMainServer_REQ");
                console.log(error);

                return {
                    userAccessToCurrentFilesManipulations: false,
                    comments: "Ошибка парсинга JSON в answerFrom___get_userAccessData_toProjectFiles =access_ToFiles_ForCurrentUser_fromMainServer_REQ",
                };
            }

            // console.log(" ");
            // console.log("answerFromMainServer  = ");
            // console.log(answerFromMainServer);

            return answerFromMainServer;

        } catch (error) {
            console.log(" ");
            console.log("Ошибка в access_ToFiles_ForCurrentUser_fromMainServer_REQ");
            console.log(error);

            return {
                userAccessToCurrentFilesManipulations: false,
                comments: "Return --- Ошибка в access_ToFiles_ForCurrentUser_fromMainServer_REQ",
            };
        }
    }
}


