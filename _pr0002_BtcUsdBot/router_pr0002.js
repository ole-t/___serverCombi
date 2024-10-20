
import { Router } from "express";
// в след модуль мы ничего не передаем, но его импорт нужен чтобы запускать этот проект
import postController_pr0002 from './postController_pr0002.js'

const router_pr0002 = new Router(); // этот код работает также без команды "new": const router_pr0002 = Router();
// import { body as m_bodyValidator } from 'express-validator'; 

//======================== 

// router_pr0002.post('/GoogleAuth_01', ()=>{
router_pr0002.post('*', () => {
    console.log(" ");
    console.log("+++ Пришел запрос на роутер pr0002");
    console.log(" ");
});

//========================
export default router_pr0002;







