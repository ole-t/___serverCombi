import express from "express";
import { Router } from "express";
import { body as m_bodyValidator } from 'express-validator';
import { postController_pr0003 } from './postController_pr0003.js';
import mMiddleWare_accessTokenControl_pr0003 from './m_MiddleWares_pr0003/mMiddleWare_assessTokenControl_pr0003.js';

const router_pr0003 = new Router(); // этот код работает также без команды "new": const router_pr0003 = Router();



//======================== 


// в роутере для всех типов запросов подключаем наш MiddleWare в цепочке обработки функций. Затем, в случае успешного пропуска результата, передаем выполнение остальным Ендпоинтам

// Активировать
/* 
router_pr0003.post(
    '*',
    // тут сделать предв проверку токена на срок действия и соответствие подлинности, чтобы предотвратить главн сервер от ненужных запросов
    midleWare_predvTokenControl_pr0003,
    (req, res, next) => {
        // console.log(" ");
        // console.log("+++ +++ Пришел запрос на роутер pr0003" + req.url);
        // console.log(" ");
        next();
    });
*/

// повторно запускаем обработку для проверки продолжения процесса
router_pr0003.post(
    '*',
    (req, res, next) => {
        // console.log(" ");
        // console.log("== Продолжение, req.url= " + req.url);
        // console.log(" ");
        next();
    });

// Загрузка/скачивание файлов:
router_pr0003.post('/uploadOneFileToServer', postController_pr0003.uploadOneFileToServer_PC);

router_pr0003.post('/getFilesListForCurrentProjectFromServer', postController_pr0003.getFilesListForCurrentProjectFromServer_PC);

router_pr0003.post('/getAllFilesListForCurrentOwner', postController_pr0003.getAllFilesListForCurrentOwner_PC);

router_pr0003.post('/deleteFilesListOfProjectFromServer', postController_pr0003.deleteFilesListOfProjectFromServer_PC);

router_pr0003.post('/downloadOneFileFromServer', postController_pr0003.downloadOneFileFromServer_PC);


// тут внутрисерверные запросы
router_pr0003.post('/list_of_DeletingProjects_and_corpAccounts_fromMainServer', postController_pr0003.get__list_of_DeletingProjects_and_corpAccounts_fromMainServer_PC);




//========================
export default router_pr0003;







