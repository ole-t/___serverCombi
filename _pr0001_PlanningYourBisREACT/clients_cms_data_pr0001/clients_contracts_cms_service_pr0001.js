
import express from "express";
import fetch from "node-fetch";

import config_pr0001 from '../config_pr0001.js';
import config_pr0003 from '../../_pr0003_filesServer/config_pr0003.js';
import { functions___pr0001 } from '../postService_pr0001.js';
// import {global_Functions_and_Servises_forAll_Projects} from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';

import {global_Functions_and_Servises_forAll_Projects} from '../../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import { serverVarriorsDataFromBD_pr0001 } from "../postService_pr0001.js";

const clients_cms_data_pr0001 = {
    updateDate: 0,

    // Эти данные при скачивании файла переносятся в Конфиг файл в pr0001
    defaultMaxCount_freeContacts: null,
    defaultMaxCount_freeCorpAccounts: null,
    defaultMaxCount_freeProjects_inEachCorpAccount: null,
    defaultMaxCount_freeSubProjects_inEachProject: null,

    // Эти данные при скачивании файла переносятся в Конфиг файл в pr0003
    maxTotalSpaceInServerForFiles: 5000000000, // максимальное место на сервере для хранения файлов - 5Гбт
    maxSizeSingleFile: 10000000,
    defaultFreeSpaceForFiles_forOneUser: 50000000, // выделенное по умолчанию бесплатное место для хранения файлов - 50Мбт

    setNewContractForClient: (client_Email, maxUsersCountForClient, maxDiskFilesSpaceForClient, limitDateOfCurrentContract) => {
        // сюда записать функционал 
    },

    // Это шаблон записи для отдельного клиента в реестре
    clientsContractsReestr_cms: {
        "shablon___client_Email": {
            "client_Email": null,
            "client_ID": null,
            "knownClientsIndex_inMainServerReestr": null,
            updateClientDate: 0,
            contracts: [
                // сюда добавляем в качестве нового елемента массива новые условия для клиента по мере их появления
                {
                    updateContractDate: 0,
                    "client_Email": null,
                    "client_ID": null,
                    "knownClientsIndex_inMainServerReestr": null,
                    dateOfAddedNewConrtakt: 0,
                    maxUsersCountForClient: null,
                    maxDiskFilesSpaceForClient: null,
                    limitDateOfCurrentContract: null,
                    comments: null,
                }
            ]
        },

        // -------------------------------

        "olegtarasov2014@gmail.com": {
            "client_Email": null,
            "client_ID": null,
            "knownClientsIndex_inMainServerReestr": null,
            updateClientDate: 0,
            contracts: [
                // сюда добавляем в качестве нового елемента массива новые условия для клиента по мере их появления
                {
                    updateContractDate: 0,
                    "client_Email": null,
                    "client_ID": null,
                    "knownClientsIndex_inMainServerReestr": null,
                    dateOfAddedNewConrtakt: 0,
                    maxUsersCountForClient: null,
                    maxDiskFilesSpaceForClient: null,
                    limitDateOfCurrentContract: null,
                    comments: null,
                }
            ]
        }



    }
}



// НЕ УДАЛЯТЬ - шаблон-функция получения JSON-файла из объекта с данными
async function madeShablon_cms_file() {
    try {
        clients_cms_data_pr0001.updateDate = Date.now();
        let saveDataResult = await global_Functions_and_Servises_forAll_Projects.files_loadAndSave_service.saveLocal_JSON_file(
            clients_cms_data_pr0001, // данные
            config_pr0001.projectNameID, // имя_ID проекта
            config_pr0001.localFilesAdress, // адрес расположеия файлов проекта, без имени файла
            config_pr0001.githab_cms_repo_pr0001.FILE_PATH, // имя файла
            // console.log(" ");
            // console.log("saveDataResult= ");
            // console.log(saveDataResult);
        );
    } catch (error) {
        console.log(" ");
        console.log("Ошибка при создании cms-файла ");
    }
}
madeShablon_cms_file()




export async function download_githab_cms_file() {

    // console.log(" ");
    // console.log("Запуск download_githab_cms_file ");

    let mResponse = {
        success_download_clientsContractsData_cms: false,
        comment: null,
    };

    try {
        // 📡 Запрашиваем содержимое файла через GitHub API
        const url = `https://api.github.com/repos/${config_pr0001.githab_cms_repo_pr0001.OWNER}/${config_pr0001.githab_cms_repo_pr0001.REPO}/contents/${config_pr0001.githab_cms_repo_pr0001.FILE_PATH}?ref=${config_pr0001.githab_cms_repo_pr0001.BRANCH}`;

        const downloadResult = await fetch(url, {
            headers: {
                Authorization: `token ${config_pr0001.githab_cms_repo_pr0001.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3.raw", // важно — получить «сырой» контент файла
                "User-Agent": "NodeJS-Server"
            }
        });

        if (!downloadResult.ok) {
            console.log(" ");
            console.error("Не удалось скачать файл из download_githab_cms_file");

            mResponse.success_download_clientsContractsData_cms = false;
            mResponse.comment = downloadResult.statusText;
            return mResponse;
        }

        // Сразу читаем JSON в память
        const jsonData = await downloadResult.json();

        // console.log(" ");
        // console.error("После загрузки и прочтения clientsContractsData_cms, jsonData = ");
        // console.log(jsonData);

        if (!jsonData) {
            console.log(" ");
            console.error("Не удалось получить jsonData");

            mResponse.success_download_clientsContractsData_cms = false;
            mResponse.comment = "Не удалось получить jsonData";
            return mResponse;
        }

        // переносим полученные данные в рабочее окружение pr0001
        if (jsonData.clientsContractsReestr_cms) serverVarriorsDataFromBD_pr0001.clientsContractsReestr_cms = jsonData.clientsContractsReestr_cms;

        // переносим полученные данные в рабочее окружение pr0001
        if (jsonData.defaultMaxCount_freeContacts) config_pr0001.default_limits_forOneUser.defaultMaxCount_freeContacts = jsonData.defaultMaxCount_freeContacts;
        if (jsonData.defaultMaxCount_freeCorpAccounts) config_pr0001.default_limits_forOneUser.defaultMaxCount_freeCorpAccounts = jsonData.defaultMaxCount_freeCorpAccounts;
        if (jsonData.defaultMaxCount_freeProjects_inEachCorpAccount) config_pr0001.default_limits_forOneUser.defaultMaxCount_freeProjects_inEachCorpAccount = jsonData.defaultMaxCount_freeProjects_inEachCorpAccount;
        if (jsonData.defaultMaxCount_freeSubProjects_inEachProject) config_pr0001.default_limits_forOneUser.defaultMaxCount_freeSubProjects_inEachProject = jsonData.defaultMaxCount_freeSubProjects_inEachProject;
        if (jsonData.defaultMaxCount_freeMessages_inEachChat) config_pr0001.default_limits_forOneUser.defaultMaxCount_freeMessages_inEachChat = jsonData.defaultMaxCount_freeMessages_inEachChat;

        // переносим полученные данные в рабочее окружение pr0003
        if (jsonData.maxTotalSpaceInServerForFiles) config_pr0003.maxTotalSpaceInServerForFiles = jsonData.maxTotalSpaceInServerForFiles;

        // console.log(" ");
        // console.error("config_pr0003.maxSizeSingleFile перед перезаписью = " + config_pr0003.maxSizeSingleFile);

        if (jsonData.maxSizeSingleFile) config_pr0003.maxSizeSingleFile = jsonData.maxSizeSingleFile;

        // console.log(" ");
        // console.error("config_pr0003.maxSizeSingleFile после перезаписи = " + config_pr0003.maxSizeSingleFile);

        config_pr0003.default_limits_forOneUser.defaultFreeSpaceForFiles_forOneUser = jsonData.defaultFreeSpaceForFiles_forOneUser;

        mResponse.success_download_clientsContractsData_cms = true;
        mResponse.comment = "Данные успешно прочитаны с ГитХаб";

        // отправляем себе сообщение
        setTimeout(() => {
            try {
                functions___pr0001.sendTelegramInfo_from_pr0001("Данные успешно прочитаны с ГитХаб pr_0001", "white");
            } catch (error) {
                console.log(" ");
                console.log("Ошибка отправки сообщения в postService_pr0001");
                console.log(error);
            }
        }, 1000);


        // console.log(" ");
        // console.error("config_pr0003= ");
        // console.error(config_pr0003);

        return mResponse;

    } catch (error) {
        console.log(" ");
        console.error("Ошибка при скачивании JSON с GitHub:", error.message);

        mResponse.success_download_clientsContractsData_cms = false;
        mResponse.comment = "Ошибка при скачивании JSON с GitHub:";
        return mResponse;
    }




}












