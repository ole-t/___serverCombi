
import jwt_decode from 'jwt-decode';
import { validationResult } from 'express-validator';
import { postService_pr0003, vars_and_functions___pr0003 } from './postService_pr0003.js';
import fs from 'fs';

export const postController_pr0003 = {

    async uploadOneFileToServer_PC(req, res) {
        console.log("\nЗапуск uploadOneFileToServer_PC, req.headers =");
        // console.log(" req.headers =");
        // console.log(req.headers);

        // Берём user_Email из accessToken в заголовке
        const user_Email = jwt_decode(req.headers.accesstoken).user_Email;

        console.log("\n user_Email = " + user_Email);

        if (!user_Email) {
            console.log(" ");
            console.log("Ошибка в uploadOneFileToServer_PC -Нет user_Email в заголовке");
            return res.status(400).json("Нет user_Email в заголовке");
        }

        console.log("\n vars_and_functions___pr0003.tempBlockedReestr[user_Email] = " + vars_and_functions___pr0003.tempBlockedReestr[user_Email]);

        // Слушаем закрытие соединения клиента
        req.on('close', () => {
            console.log(`Клиент закрыл соединение: ${user_Email}`);
            // Снимаем блокировку
            vars_and_functions___pr0003.tempBlockedReestr[user_Email] = null;
            // Можно добавить удаление временных файлов, если нужно
        });

        try {
            // Проверяем, нет ли незавершённой загрузки
            if (vars_and_functions___pr0003.tempBlockedReestr[user_Email]) {

                console.log("\n Прерываем попытку загрузки, пользователь выполняет другой процесс...");

                return res.status(500).json("No access - Another files process");
            }
            vars_and_functions___pr0003.tempBlockedReestr[user_Email] = "uploading_OneFileToServer";

            console.log("\n После УСТАНОВКИ блокировки tempBlockedReestr[user_Email] = " + vars_and_functions___pr0003.tempBlockedReestr[user_Email]);

            // Запуск пост-сервиса (Busboy и загрузка файла)
            const resultPostServise = await postService_pr0003.uploadOneFileToServer_PS(req, user_Email);

            // Ответ клиенту
            if (resultPostServise.mResStatus === 1) {
                res.status(200).json(resultPostServise);
            } else {
                res.status(500).json(resultPostServise.comment);
            }

        } catch (error) {
            console.error("Ошибка из postController_pr0003 --- uploadOneFileToServer_PC:", error);
            res.status(500).json("Ошибка из postController_pr0003 --- uploadOneFileToServer_PC");
        } finally {
            // Снимаем блокировку пользователя
            vars_and_functions___pr0003.tempBlockedReestr[user_Email] = null;

            console.log("\n После СНЯТИЯ блокировки tempBlockedReestr[user_Email] = " + vars_and_functions___pr0003.tempBlockedReestr[user_Email]);
        }
    },

    //---------
    async getFilesListForCurrentProjectFromServer_PC(req, res) {
        try {
            let resultPostServise = await postService_pr0003.getFilesListForCurrentProjectFromServer_PS(req);
            // console.log(" ");
            // console.log("resultPostServise= ", resultPostServise);
            // ответ на клиента
            switch (resultPostServise.mResStatus) {
                case 1: {
                    res.status(200).json({
                        projectFilesList: resultPostServise.projectFilesList,
                        ownerslimitFiles: resultPostServise.ownerslimitFiles
                    });
                    break;
                }
                default: {
                    res.status(500).json(resultPostServise.comment);
                    break;
                }
            }
        } catch (error) {
            console.log(" ");
            console.log("Ошибка из postController_pr0003 --- getFilesListForCurrentProjectFromServer_PC: ");
            console.log(error);
            // console.log(" ");
            res.status(500).json("Ошибка из postController_pr0003 --- getFilesListForCurrentProjectFromServer_PC: ");
        }

    },

    //---------
    async getAllFilesListForCurrentOwner_PC(req, res) {
        try {
            let resultPostServise = await postService_pr0003.getAllFilesListForCurrentOwner_PS(req);
            // console.log(" ");
            // console.log("resultPostServise= ", resultPostServise);
            // ответ на клиента
            switch (resultPostServise.mResStatus) {
                case 1: {
                    res.status(200).json(resultPostServise.allFilesList);
                    break;
                }
                default: {
                    res.status(500).json(resultPostServise.comment);
                    break;
                }
            }
        } catch (error) {
            // console.log(" ");
            // console.log("Ошибка из postController_pr0003 --- getFilesListForCurrentProjectFromServer_PC: " + error);
            // console.log(" ");
            res.status(500).json("Ошибка из postController_pr0003 --- getFilesListForCurrentProjectFromServer_PC: ");
        }
    },

    //---------
    async deleteFilesListOfProjectFromServer_PC(req, res) {
        try {
            let resultPostServise = await postService_pr0003.deleteFilesListOfProjectFromServer_PS(req);
            // console.log(" ");
            // console.log("resultPostServise= ", resultPostServise);
            // ответ на клиента
            switch (resultPostServise.mResStatus) {
                case 1: {
                    res.status(200).json(resultPostServise);
                    break;
                }
                default: {
                    res.status(500).json(resultPostServise.comment);
                    break;
                }
            }
        } catch (error) {
            // console.log(" ");
            // console.log("Ошибка из postController_pr0003 --- deleteFilesListOfProjectFromServer_PC: " + error);
            // console.log(" ");
            res.status(500).json("Ошибка из postController_pr0003 --- deleteFilesListOfProjectFromServer_PC: ");
        }
    },

    //---------
    async downloadOneFileFromServer_PC(req, res) {
        const userEmail = req.body.user_Email;

        // блокировка пользователя на время скачивания
        if (vars_and_functions___pr0003.tempBlockedReestr[userEmail]) {
            return res.status(500).json("No access - Another process running");
        }

        vars_and_functions___pr0003.tempBlockedReestr[userEmail] = "downloading_OneFileToServer";

        try {
            const result = await postService_pr0003.downloadOneFileFromServer_PS(req);

            if (result.mResStatus !== 1) {
                return res.status(500).json(result.comment);
            }

            // Проверяем файл
            await fs.promises.access(result.filePath, fs.constants.F_OK);

            // Настройки заголовков
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${Buffer.from(result.fileName).toString("binary")}"; filename*=UTF-8''${encodeURIComponent(result.fileName)}`
            );
            res.setHeader("myX-Message", "File was successfully sent");
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, myX-Message");

            // ─────────────────────────────
            // Отправка файла через поток (для больших файлов)
            // ─────────────────────────────
            await new Promise((resolve, reject) => {
                const readStream = fs.createReadStream(result.filePath);
                readStream.on("error", reject);
                readStream.on("end", resolve);
                readStream.pipe(res);
            });

        } catch (error) {
            console.error("Ошибка при скачивании файла:", error);
            if (!res.headersSent) {
                res.status(500).send("Ошибка при скачивании файла");
            }
        } finally {
            // снимаем блокировку пользователя
            vars_and_functions___pr0003.tempBlockedReestr[userEmail] = null;
        }
    },

    //---------
    async get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PC(req, res) {

        try {
            let resultPostServise = postService_pr0003.get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PS(req);

            // console.log(" ");
            // console.log("+ + + + + +  resultPostServise= ");
            // console.log(resultPostServise);

            // ответ на клиента
            switch (resultPostServise.mResKod) {
                case 1: {
                    // console.log(" ");
                    // console.log("+ + + + + + Отправляем ответ из get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PC");

                    res.status(200).json(resultPostServise);
                    break;
                }
                default: {
                    res.status(500).json(resultPostServise.comment);
                    break;
                }
            }
        } catch (error) {
            console.log(" ");
            console.log("Ошибка из postController_pr0003 --- get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PC: ");
            console.log(error);

            res.status(500).json("Ошибка из postController_pr0003 --- deleteFilesListOfProjectFromServer_PC: ");
        }

    },

}







