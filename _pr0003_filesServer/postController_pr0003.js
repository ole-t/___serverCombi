

import { validationResult } from 'express-validator';
import { postService_pr0003, vars_and_functions___pr0003 } from './postService_pr0003.js';
import fs from 'fs';

export const  postController_pr0003 = {

    async uploadOneFileToServer_PC(req, res) {
        // console.log(" ");
        // console.log("Звпуск uploadOneFileToServer_PC, req.url= " + req.url);
        try {
            // проверяем, нет незавершенных загрузок/скачиваний для данного пользователя
            if (vars_and_functions___pr0003.tempBlockedReestr[req.body.user_Email]) return res.status(500).json("No access - Anther files prosess");
            else vars_and_functions___pr0003.tempBlockedReestr[req.body.user_Email] = "uploading_OneFileToServer"

            let resultPostServise = await postService_pr0003.uploadOneFileToServer_PS(req);
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
            // console.log("Ошибка из postController_pr0003 --- uploadOneFileToServer_PC: " + error);
            // console.log(" ");
            res.status(500).json("Ошибка из postController_pr0003 --- uploadOneFileToServer_PC: ");
        }
        finally {
            // Снимаем отметку о наличии обработки запроса для данного пользователя
            vars_and_functions___pr0003.tempBlockedReestr[req.body.user_Email] = null;
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

            // Отправляем файл и ждём завершения
            await new Promise((resolve, reject) => {
                res.download(result.filePath, result.fileName, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

        } catch (error) {
            console.error("Ошибка при скачивании файла:", error);
            if (!res.headersSent) {
                res.status(500).send("Ошибка при скачивании файла");
            }
        } finally {
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







