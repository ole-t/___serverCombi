import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import router_pr0003 from './_pr0003_filesServer/router_pr0003.js';
import config_serverCombi from './config_serverCombi.js';
import config_pr0003 from './_pr0003_filesServer/config_pr0003.js';
import { vars_and_functions___pr0003 } from './_pr0003_filesServer/postService_pr0003.js';
import { global_Functions_and_Servises_forAll_Projects } from './global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';

console.log(" ");
console.log("=== === ЗАПУСК  server_pr0003");

{
    // тут предотвращаем падение сервера при непредвиденных ошибках
    process.on('unhandledRejection', (reason, promise) => {
        // unhandledRejection — когда асинхронный промис завершился с ошибкой, но .catch() не был вызван.
        console.error('⚠️ Необработанное отклонение промиса:', reason);
        try {
            vars_and_functions___pr0003.sendTelegramInfo_from_pr0003("Необработанное отклонение промиса: " + reason, "💥");
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    });

    process.on('uncaughtException', (err) => {
        // uncaughtException — когда выброшена ошибка, не пойманная try/catch.
        console.error('💥 Необработанное исключение:', err);
        try {
            vars_and_functions___pr0003.sendTelegramInfo_from_pr0003("Необработанное исключение: " + err, "💥");

            // ТУТ ДОБАВИТЬ:
            // ПРАВИЛЬНО: завершить процесс
            // Сделать сохранение файлов на диск
            // Перезапустить сервер
            // process.exit(1); // → полностью выключает сервер, чтобы не было «подвешенного» состояния.
            // После этого процесс перезапускается менеджером(pm2, systemd, Docker restart policy) и сервер стартует в чистом состоянии.
            // Нельзя просто логировать uncaughtException и продолжать работу.  Для upload-сервиса нужно: уведомить (лог/Telegram) → process.exit(1) → перезапуск. Это защищает от битых файлов, зависших блокировок и порчи памяти.
        } catch (error) {
            console.log("Ошибка отправки сообщения Telegram");
            console.log(error);
        }
    });
}

//=======================
const mServer = express();
const server = http.createServer(mServer);

// длинные соединения для больших файлов
server.keepAliveTimeout = 3600000; // эти настройки должны совпадать с настройками в nginx
server.headersTimeout = 3600000; // эти настройки должны совпадать с настройками в nginx

server.keepAliveTimeout = 0; // подобные настройки есть также в nginx
server.headersTimeout = 0; // подобные настройки есть также в nginx
server.setTimeout(0);

mServer.use(cookieParser());

// оставляем express.json() для обработки JSON
// mServer.use(express.json());
// Тут мы исключаем обработку express.json() при загрузке файла на сервер
mServer.use((req, res, next) => {
    if (
        req.method === 'POST' &&
        req.path === '/pr0003/uploadOneFileToServer'
    ) {
        return next(); // ❌ пропускаем express.json() при загрузке файла на сервер
    }
    express.json()(req, res, next); // ✔️ для всех остальных используем express.json()
});

// тут выводим в консоль поступающие запросы (закомментировано, можно включить при отладке Только в режиме отладки

mServer.use((req, res, next) => {
    console.log(" ");
    console.log(`ПОСТУПИЛ ЗАПРОС на server_pr0003: ${req.method} ${req.path}`);
    return next();
});






mServer.use(cors({
    origin: [
        "https://web.postman.com",
        "http://localhost:3000",
        "https://litepm.com",
        "http://litepm.com",
        "https://ole-t.github.io",
    ],
    methods: ['GET', 'POST'],
    // ВАЖНО - указываем список разрешенных нестандартных заголовков, иначе они могут блокироваться при сложных постах, например с FormData
    allowedHeaders: ['Content-Type', 'accesstoken'],
    credentials: true, // след для разрешения отправки Куки - не используем
}
));

mServer.options('/pr0003/*', cors());

mServer.use('/pr0003', router_pr0003); // посты с префиксом pr0003 - направляем сюда

const PORT = 5076;

async function startServer() {
    try {
        // затем запускаем сервер
        server.listen(PORT, async () => {
            console.log("");
            console.log("server_pr0003 is start, порт: " + PORT);

            try {
                await vars_and_functions___pr0003.sendTelegramInfo_from_pr0003("server_pr0003 перезапущен", "white");
                // await sendTelegramInfo_from___SERVER_COMBI("Это пример моего уведомления", "white");
            } catch (error) {
                console.log("Ошибка отправки сообщения Telegram - server_pr0003");
                console.log(error);
            }
        });
    }
    catch (error) {
        console.log("Ошибка сервера server_pr0003:");
        console.log(error);
    }
}

await startServer(); // запускаем сервер

// Для запуска из powerShell сначала перейти в рабочую папку:
//       cd "C:\Oleg\_My_JS_Projects\___serverProjects_plus_DB\___serverCombi"

// В консоли вызывать:    npx nodemon server_pr0003.js 