

import { functions___pr0001 } from '../postService_pr0001.js';
import jwt_decode from 'jwt-decode';
import validator from 'validator';



// Тут проверяем те запросы, которые требуют наличия Емейла и токена
export default function middleware_authControl___pr_0001(req, res, next) {

    try {
        // console.log(" ");
        // console.log("Запуск middleware_authControl___pr_0001, req.body = ");
        // console.log(req.body);

        /* 
                //  список ЕндПоинтов, которые не требуют Токен доступа
                let exclusionaryEndpoints = [
                    "/registration_User", // регистрация - тут данные о пользователя извлекаем из body
                    "/changePassword", // замена/восстановление пароля - тут данные о пользователя извлекаем из body
                    "/logIn", // logIn - тут данные о пользователя 
                    "/GoogleAuth_01", // вход/logIn через Гугл - тут данные о пользователя 
                    "/logOut",
                    "/logOutOneGadget",
                    "/logOutAllGadgets",
                ];
                // Если Ендпоинт содержит один из вышеперечисленных адресов - прерываем проверку и продолжаем выполнение
                if ((req.method === "POST")
                    &&
                    (exclusionaryEndpoints.some(exclusionaryEndpoints => req.url.includes(exclusionaryEndpoints)))
                ) {
                    console.log(" ");
                    console.log("Данный Ендпоинт не требует проверки доступа, прерываем проверку и продолжаем обработку запроса ...");
                    return next();
                }
                 */

        // Проверяем, нужна ли валидация данного запроса
        let needValidation = functions___pr0001.isSenderValidationRequired(req.url);
        if (!needValidation) return next();

        // ДАЛЕЕ ВАЖНО СОБЛЮДАТЬ ПОСЛЕДОВАТЕЛЬНОСТЬ

        // ===========================
        //  1. Выявляем Емейл отправителя поста

        let user_Email = null;
        let credentialFromGoogle = null; //это далее используем, если ендПоинт '/GoogleAuth_01'
        let decodeValidationAccessToken = null; //это далее используем при остальных ендПоинтах


        // Проверяем наличие еМейла во всех видах запросов
        try {
            // Если идет запрос регистрации через googleAuth
            if (req.url === '/GoogleAuth_01') {
                // Распарсиваем токен от Гугл и берем оттуда user_Email
                credentialFromGoogle = jwt_decode(req.body.postDataToServer.credentialFromGoogle);
                user_Email = credentialFromGoogle.email;
            }
            // иначе user_Email берем из токена доступа в обычном посте
            else {
                if (!req.headers || !req.headers.accesstoken) {
                    console.log("Отсутствует токен в запросе, req.url= " + req.url);
                }
                else {
                    // Если токен существует - распарсиваем и извлекаем Емейл пользователя
                    try {
                        decodeValidationAccessToken = jwt_decode(req.headers.accesstoken);
                        // console.log(" ");
                        // console.log("Распарсенный decodeValidationAccessToken= ");
                        // console.log(decodeValidationAccessToken);

                        user_Email = decodeValidationAccessToken.user_Email;
                        // console.log(" ");
                        // console.log("user_Email= ");
                        // console.log(user_Email);

                    } catch (error) {
                        console.log(" ");
                        console.log("Ошибка при распарсивании accessToken ");
                        console.log(error);
                    }
                }
            }

        } catch (error) {
            console.log(" ");
            console.log("Ошибка при попытке извлечь еМейл пользователя:");
            console.log(error);
        }

        // ===========================
        // 2. ПРОВЕРЯЕМ НАЛИЧИЕ И ВАЛИДНОСТЬ ЕМЕЙЛА

        // сначала проверяем наличие Емейла
        if (!user_Email) {
            console.log(" ");
            console.log("Не удалось извлечь еМейл пользователя:");
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // проверяем синтаксическую валидность Емейла
        const isValid = validator.isEmail(user_Email); // true или false
        if (!isValid) {
            console.log("Не прошел валидацию user_Email в запросе, user_Email= " + user_Email);
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // ===========================
        // 3. ПРОВЕРЯЕМ НА ЧАСТОТУ ЗАПРОСОВ- НА ПОВТОРЯЕМОСТЬ ПОСТОВ ОТ ДАННОГО ОТПРАВИТЕЛЯ
        // далее проверяем частоту запросов
        const nextAssess = checkRequestFrequency(user_Email);
        // console.log("nextAssess= ");
        // console.log(nextAssess);
        if (!nextAssess.allowed) {
            console.log("Превышен лимит запросов, user_Email= " + user_Email);

            // отправляем себе уведомление
            functions___pr0001.sendTelegramInfo_from_pr0001(
                "Спам атака - превышен лимит ежепериодных запросов, user_Email= " + user_Email,
                // "red"
                '\u{1F534} ' + '\u{1F534} ' + '\u{1F534}'
            )


            return res.status(429).json({ message: "None auth 11345" }); // Тут превышен лимит запросов
        }

        // ===========================
        //  4. ЕСЛИ ЭТО РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ - ПРЕРЫВАЕМ ПРОВЕРКУ И ПЕРЕДАЕМ ВЫПОЛНЕНИЕ ДАЛЬШЕ
        if (req.url === '/GoogleAuth_01') return next();

        // ===========================
        //  5. ЕСЛИ ЭТО ОБЫЧНЫЙ РАБОЧИЙ ПОСТ - ВАЛИДИРУЕМ ТОКЕН ДОСТУПА      

        // если код дошел до этого места - тогда ранее в коде были распарсены данные в переменную  decodeValidationAccessToken

        // если токен не валиден (напр истек срок действия)
        if (!decodeValidationAccessToken) {
            console.log("Прерываем Auth, токен не прошел валидацию");
            return res.status(401).json("pr0001 --- m User is not auth - 2");;
        }

        let pointer_currentUser_inUsersReestr = functions___pr0001.get_pointer_currentUserInReestr(decodeValidationAccessToken.user_Email);

        if (!pointer_currentUser_inUsersReestr) {
            console.log("НЕ НАЙДЕН ПОЛЬЗОВАТЕЛЬ, УКАЗАННЫЙ В ТОКЕНЕ, finedUserIndex= " + decodeValidationAccessToken.user_Email);
            return ("pr0001 --- m User is not auth - 3");
        }

        if (
            // если токен для указанного процесса не существует в реестре пользователя
            !pointer_currentUser_inUsersReestr.autorisationData.tokensDifferentGadgets[decodeValidationAccessToken.gadget_process_ID]
        ) {
            console.log("Прерываем Auth, отсутствует токен в реестре пользователя для данного процесса ");

            return res.status(401).json("pr0001 --- m User is not auth - 4");;
        }

        if (
            // если токен для указанного процесса в реестре пользователя не идентичен токену, переданному в запросе
            pointer_currentUser_inUsersReestr.autorisationData.tokensDifferentGadgets[decodeValidationAccessToken.gadget_process_ID].accessToken != req.headers.accesstoken
        ) {
            console.log("Прерываем Auth, токен не соответствует токену, который записан в реестре пользователя для данного процесса");

            return res.status(401).json("m User is not auth - 5");
        }


        // если предыдущие проверки пройдены - в заголовок запроса добавляем данные пользователя из переданного токена
        req.headers.decodeAT_____user_Email = decodeValidationAccessToken.user_Email;
        req.headers.decodeAT_____mKuiir = decodeValidationAccessToken.mKuiir;
        req.headers.decodeAT_____mGadgetProcess_ID = decodeValidationAccessToken.gadget_process_ID;

        return next();

    } catch (error) {
        console.log("Сработал catch в middleware_authControl___pr_0001");
        console.log(error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
}


// Тут находится объект и функция для контроля за частотой запросоа

// 1. Объект с временно заблокированными пользователями
const blockedUsers = {}; // { "user@example.com": "2025-11-08T12:45:00.000Z" }

// 2. Рабочий объект для хранения стеков времени запросов
const requestStacks = {}; // { "user@example.com": { times: [ "2025-11-08T12:40:00.000Z", ... ] } }

// === Настройки лимита ===
const MAX_REQUESTS = 20;          // допустимое количество запросов за заданны период
const TIME_WINDOW_SECONDS = 1;   // период в секундах для контроля количества запросов (в секундах)
const BLOCK_DURATION_SECONDS = 60; // длительность блокировки для нарушителей (в секундах)

// 3. Функция контроля частоты запросов
function checkRequestFrequency(user_Email) {
    const now = new Date();

    // Шаг 1: проверка временной блокировки
    if (blockedUsers[user_Email]) {
        const blockTime = new Date(blockedUsers[user_Email]);
        if (now < blockTime) {
            return { allowed: false, reason: "User is temporarily blocked" };
        } else {
            blockedUsers[user_Email] = null; // снимаем блокировку
        }
    }

    // Шаг 2: работа со стеком времени запросов
    if (!requestStacks[user_Email]) {
        requestStacks[user_Email] = { times: [] };
    }

    const userStack = requestStacks[user_Email].times;
    userStack.push(now.toISOString());

    // Ограничиваем размер стека
    if (userStack.length > MAX_REQUESTS) {
        userStack.shift();
    }

    // Проверяем частоту запросов
    if (userStack.length === MAX_REQUESTS) {
        const firstTime = new Date(userStack[0]);
        const lastTime = new Date(userStack[MAX_REQUESTS - 1]);
        const diffSeconds = (lastTime - firstTime) / 1000;

        if (diffSeconds < TIME_WINDOW_SECONDS) {
            // Устанавливаем временную блокировку
            const blockUntil = new Date(now.getTime() + BLOCK_DURATION_SECONDS * 1000);
            blockedUsers[user_Email] = blockUntil.toISOString();

            // Очищаем стек
            requestStacks[user_Email].times = [];

            return { allowed: false, reason: "User temporarily blocked due to request frequency" };
        }
    }

    return { allowed: true };
}




