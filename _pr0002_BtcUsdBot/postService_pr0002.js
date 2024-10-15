
//  Продолжить просмотр ролика с 6 мин
//  https://www.youtube.com/watch?v=slcqnHIFrj8&t=410s
// Web app TELEGRAM Бот на node js и React. Интернет магазин и форма обратной связи в телеграмм боте
// https://www.youtube.com/watch?v=MzO-0IYkZMU

import WebSocket from 'ws';
import config_pr0002 from './config_pr0002.js';
import global_Functions_and_Servises_forAll_Projects from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import { first_LoadData_pr0002 } from './saveAndLoadDataServise_pr0002.js';

// эта пустая переменная нужна, чтобы связать этот файл с главным модулем комбиСервера
export const mExportImportLink_postService_pr0002 = 'qwe'
let binanceSocket;

// ------------------------------------------------------------

console.log("ЗАПУСК postService_pr0002 ");

export const varrsAndData_pr0002 = {
    usersReestrTelegram: {},

    // тут указываем послоянную составляющую в названиях кнопок
    buttonsStaticText: {
        butonStText_updateCurrentStockPrise: "Current kurs:",
        butonStText_topLimit: "Top limit:",
        butonStText_BottomLimit: "Bottom limit:",
        butonStText_signalParams: "Signal params:",
    },

    slideData: {
        currentPrice: 0,
        maxPrice_short_inrervalTime: 0,
        minPrice_short_inrervalTime: 0,

        maxPrice_long_inrervalTime: 0,
        minPrice_long_inrervalTime: 0,
    },

    signalNames: {
        // в качестве ключей используем число
        0: "Off",
        1: "Single",
        2: "Repeated",
    },

    emodziListTelegram_pr0002: {
        defaul_currentProjectEmodzi: '📊₿',
        // значки кнопок
        emodzi_buttonCurrentPrice: '📊',
        emodzi_buttonTopPrice: '🔺',
        emodzi_buttonBottomPrice: '🔻',
        emodzi_buttonSignal: '⚡️',

        emodzi_buttonSignal_off: '❌',
        emodzi_buttonSignal_single: '⚠️',
        emodzi_buttonSignal_repeat: '⚠️-⚠️-⚠️',
        // значки сообщенй
        emodzi_alertPrice_UP: '❗👍',
        emodzi_alertPrice_DOWN: '❗👎',
        emodzi_wasUpdateStockPrise: '🔄',
        emodzi_wasSettingNewPrise: '✅',
        emodzi_mistakeInputData: '🛑',
        emodzi_wateInputData: '📘',

        qwe: '✅   ❌     🔼    📘    🔄'

    },

}

// подключаемся к телеграм боту для получения оповещений
let connection_to_telegramBot___BTC_USD_signal;
try {
    connection_to_telegramBot___BTC_USD_signal = global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.connection_to_CurrentTelegramBot(config_pr0002.telegramAccessToken___BTC_USD_signal);
    // Запускаем слушатель ТелеграмБота
    // global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.listenerCurrentTelegramBot(connection_to_telegramBot___BTC_USD_signal);
} catch (error) {
    console.log("Ошибка запуска функций Telegram");
    console.log(error);
}

async function binanceConnection() {
    return new Promise(async (resolve, reject) => {
        try {
            binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
            // прослушиваем входящий поток
            binanceSocket.onmessage = event => {
                //  varrsAndData_pr0002.slideData.currentPrice = Math.floor(Number(JSON.parse(event.data).p));
                // console.log(varrsAndData_pr0002.slideData.currentPrice);   
                resetPrisePreviousInterval(Math.floor(Number(JSON.parse(event.data).p)))
            }

            // Обработка успешного подключения
            binanceSocket.onopen = () => {
                console.log('Успешное подключение к WebSocket.');
            };
            // Обработка ошибки
            binanceSocket.onerror = error => {
                console.error('Ошибка WebSocket:', error.message);
            };
            // Обработка закрытия соединения
            binanceSocket.onclose = () => {
                console.warn('Соединение WebSocket закрыто. Попытка переподключения через 5 секунд...');
                setTimeout(() => {
                    binanceConnection();
                }, 5000); // Попытка переподключиться через 5 секунд
            };

            resolve();
        } catch (error) {
            console.log('Ошибка в binanceConnection:');
            console.log(error);
            resolve();
        }
    })
}
await binanceConnection();

// загружаем сохраненные данные при запуске приложения
await first_LoadData_pr0002();


// Удалить - пробное сообщение юзеру
/* 
setTimeout(() => {
    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
        1668193760, // id пользователя
        "", // Название проекта
        `ЭТО РАССЫЛКА СООБЩЕНИЙ...`, // текст сообщения
        null, //емодзи из переменной, из списка
        keyboardUpdate(1668193760),  // это передаваемая клавиатура для телеграм-Бота
    )
}, 5000);
*/


// это аналог класса, который возвращает объект нового пользователя, но без названия эеземпляра класса
function createNewUser_byInfo_inIncomingMessage(incomingMessage) {
    try {
        return {
            user_telegram_id: incomingMessage.chat.id,
            user_data: {
                first_name: incomingMessage.chat.first_name,
                last_name: incomingMessage.chat.last_name,
                username: incomingMessage.chat.username,
                type: incomingMessage.chat.type,
                dateOfRegistration: incomingMessage.date,
                language_code: incomingMessage.from.language_code,
            },

            signal_params: 0, // 0 -нет сигнала, 1 - одиночный, 2 - повторный

            topLimit_currentClient: 0, // установленный клиентом лимит
            wasUsed_SingleTopSignal: false, // отметка о единократном оповещении
            maxPriceTop_wasSignal_currentClient: 0, // это максимальная цена, которая учитывалась при последнем оповещении клиента

            bottomLimit_currentClient: 0,
            wasUsed_SingleBottomSignal: false,
            minPriceBottom_wasSignal_currentClient: 0,

            countCurrentUserActions_lookingPraice: 0,
            countCurrentUserActions_changeLimits: 0,
            countCurrentUserActions_AllActions: 0,

            timeLastAction: 0,
        }
    } catch (error) {
        console.log("Ошибка в createNewUser_byInfo_inIncomingMessage");
        console.log(error);
    }

}

// удалить - дополняем реестр юзеров псевдопользователями
for (let i = 0; i < 10; i++) {
    const psevdo_id = global_Functions_and_Servises_forAll_Projects.random_id();
    // добавляем псевдо юзера
    /* 
       varrsAndData_pr0002.usersReestrTelegram[psevdo_id] = createNewUser_byInfo_inIncomingMessage(
           // это случайное сообщение
           {
               message_id: 14338,
               from: {
                   id: psevdo_id,
                   is_bot: false,
                   first_name: 'Oleg',
                   username: 'w_oleg',
                   language_code: 'ru'
               },
               chat: {
                   id: psevdo_id,
                   first_name: 'Oleg',
                   username: 'w_oleg',
                   type: 'private'
               },
               date: 1728915413,
               text: psevdo_id
           }
       );
   
       // добавляем случайное количество активности
       varrsAndData_pr0002.usersReestrTelegram[psevdo_id].countCurrentUserActions_AllActions = Math.floor(Math.random() * 1000);
   
       // добавляем дату последней активности
       varrsAndData_pr0002.usersReestrTelegram[psevdo_id].timeLastAction =Date.now();
       */
}


function keyboardUpdate(user_ID) {
    try {
        // console.log('varrsAndData_pr0002.usersReestrTelegram[user_ID]=');
        // console.log(varrsAndData_pr0002.usersReestrTelegram[user_ID]);

        const currentCurse = varrsAndData_pr0002.slideData.currentPrice;
        const topDataIndividual =
            (
                varrsAndData_pr0002.usersReestrTelegram[user_ID]
                    ? (varrsAndData_pr0002.usersReestrTelegram[user_ID].topLimit_currentClient)
                    : 0
            )
        const bottomDataIndividual =
            (
                varrsAndData_pr0002.usersReestrTelegram[user_ID]
                    ? (varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient)
                    : 0
            )

        const signalNubmer =
            (
                varrsAndData_pr0002.usersReestrTelegram[user_ID]
                    ? (varrsAndData_pr0002.usersReestrTelegram[user_ID].signal_params)
                    : 0
            )

        const keyboardOnBot = {
            reply_markup: {
                keyboard: [
                    [{
                        text: varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_buttonCurrentPrice + '  '
                            + varrsAndData_pr0002.buttonsStaticText.butonStText_updateCurrentStockPrise + '   ' + currentCurse.toLocaleString('ru-RU') + '   BTC/USD'
                    }],

                    [{
                        text: varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_buttonTopPrice + '  '
                            + varrsAndData_pr0002.buttonsStaticText.butonStText_topLimit + '   ' + topDataIndividual.toLocaleString('ru-RU')
                            + (topDataIndividual ? '   BTC/USD' : '   (not assigned)')
                    }],

                    [{
                        text: varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_buttonBottomPrice + '  '
                            + varrsAndData_pr0002.buttonsStaticText.butonStText_BottomLimit + '   ' + bottomDataIndividual.toLocaleString('ru-RU')
                            + (bottomDataIndividual ? '   BTC/USD' : '   (not assigned)')
                    }],

                    [{
                        text: varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_buttonSignal + '  '
                            + varrsAndData_pr0002.buttonsStaticText.butonStText_signalParams + '   ' + varrsAndData_pr0002.signalNames[signalNubmer]
                            + // далее добавляем картинку установленного сигнала
                            (
                                !signalNubmer
                                    ? ('  ' + varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_buttonSignal_off)
                                    : (signalNubmer == 1
                                        ? ('  ' + varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_buttonSignal_single)
                                        : '  ' + varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_buttonSignal_repeat)
                            )
                    }],

                ],
                resize_keyboard: true,  // Уменьшает клавиатуру под размер экрана
                //  one_time_keyboard: false, // Оставляет клавиатуру на экране, даже после нажатия
            }
        }
        return keyboardOnBot;
    } catch (error) {
        console.log('Ошибка в keyboardUpdate');
        console.log(error);
        return null;
    }
}

// обрабатываем входящие команды
async function incominCommandFromUser_service() {

    connection_to_telegramBot___BTC_USD_signal.on('message', async (msg) => {
        const incoming_chatID = msg.chat.id;
        // const incoming_text = msg.text;
        const incomingButtonCommand = identification_inIncomingButtonComsnd(msg);

        console.log('');
        console.log('incomingButtonCommand: ' + incomingButtonCommand);
        console.log('Входящее сообщение:');
        console.log(msg);

        //  console.log('');
        //  console.log('Состояние реестра:');
        //  console.log(varrsAndData_pr0002.usersReestrTelegram);
        //  console.log('');

        switch (incomingButtonCommand) {

            // регистрация нового пользователя
            case 'newUserRegistration': {
                try {
                    console.log(' ');
                    console.log('Регистрируем нового пользователя');

                    // добавляем нового пользователя в базу пользователей
                    varrsAndData_pr0002.usersReestrTelegram[msg.chat.id] = createNewUser_byInfo_inIncomingMessage(msg);

                    // отправляем себе уведомление о добавлении нового пользователе
                    await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                        connection_to_telegramBot___BTC_USD_signal,
                        // connection_to_my_InfoTelegramBot,
                        config_pr0002.adminTelegramAccount_ID_pr0002,
                        config_pr0002.projectNameID + "     " + config_pr0002.commentNameCurrentProject, // Название проекта
                        'ИНФО: Добавлен пользователь, ' + incoming_chatID + ",  " + msg.chat.username + ",  " + msg.chat.first_name + ',  Количество пользователей: ' + Object.keys(varrsAndData_pr0002.usersReestrTelegram).length, // текст сообщения
                        varrsAndData_pr0002.emodziListTelegram_pr0002.defaul_currentProjectEmodzi //емодзи из переменной, из списка
                    )

                    // отправляем приветствие новому пользователю
                    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                        msg.chat.id, // id пользователя
                        "", // Название проекта
                        'This bot will notify you when the current BTC/USD price reaches the limits you set.', // текст сообщения
                        varrsAndData_pr0002.emodziListTelegram_pr0002.defaul_currentProjectEmodzi, //емодзи из переменной, из списка
                        keyboardUpdate(msg.chat.id),  // это передаваемая клавиатура для телеграм-Бота
                    )
                    return; // прерываем функцию

                } catch (error) {
                    console.log('Ошибка при попытке регистрации нового пользователя');
                    console.log(error);
                }
                break;
            }
            // запрос на обновление цены
            case 1: {
                try {
                    // прибавляем данные в статистику пользователя
                    try {
                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].countCurrentUserActions_lookingPraice++;

                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].countCurrentUserActions_AllActions++;

                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].timeLastAction = Date.now();

                    } catch (error) {
                        console.log(error);
                    }

                    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                        incoming_chatID, // id пользователя
                        "", // Название проекта
                        'The current market rate for BTC/USD has been updated: ' + '\n' + varrsAndData_pr0002.slideData.currentPrice.toLocaleString('ru-RU') + ' BTC/USD', // текст сообщения
                        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_wasUpdateStockPrise, //емодзи из переменной, из списка
                        keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                    )

                } catch (error) {
                    console.log(error);
                }
                break;
            }
            // установка верхнего лимита
            case 2: {
                try {
                    await connection_to_telegramBot___BTC_USD_signal.sendMessage(
                        incoming_chatID,
                        'Enter upper limit:',
                        // третьим параметром вводим параметр:
                        {
                            reply_markup: {
                                force_reply: true,  // Telegram будет ожидать ввода ответа
                            }
                        }
                    )
                        .then(async (userAnswer) => {
                            console.log('');
                            console.log("Сработал .then");
                            console.log(userAnswer);

                            // Дальнейшее выполнение кода будет после ответа пользователя
                            await connection_to_telegramBot___BTC_USD_signal.onReplyToMessage(
                                incoming_chatID,
                                userAnswer.message_id, // это ID чата, на которое бот ожидает ответ
                                (userAnswer) => {

                                    console.log(" ");
                                    console.log("Сработал .onReplyToMessage");
                                    console.log(userAnswer);

                                    // проверяем введенное число на предмет числа
                                    let validateUserNubber = validation_andRerurn_InputNumber(userAnswer.text);
                                    if (validateUserNubber == null) {
                                        global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                                            connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                                            incoming_chatID, // id пользователя
                                            "", // Название проекта
                                            `The entered value is not a valid number, the command was not accepted`, // текст сообщения
                                            varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_mistakeInputData, //емодзи из переменной, из списка
                                            keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                                        )
                                        return;
                                    }

                                    // проверяем введенное на соотвестствие верхнему лимиту
                                    validateUserNubber = validation_inputTopLimit(incoming_chatID, validateUserNubber);
                                    if (validateUserNubber == null) {
                                        global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                                            connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                                            incoming_chatID, // id пользователя
                                            "", // Название проекта
                                            `The upper limit must be a positive number and must also be greater than the lower limit. The command was not accepted.`, // текст сообщения
                                            varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_mistakeInputData, //емодзи из переменной, из списка
                                            keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                                        )


                                        return;
                                    }

                                    // если валидация пройдена, вносим данные в БД
                                    varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].topLimit_currentClient = validateUserNubber;

                                    // прибавляем данные в статистику пользователя
                                    try {
                                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].countCurrentUserActions_changeLimits++;

                                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].countCurrentUserActions_AllActions++;

                                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].timeLastAction = Date.now();

                                    } catch (error) {
                                        console.log(error);
                                    }

                                    // если сигнал не был установлен - тогда устанавливаем сигнал
                                    if (!varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params) varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params = 2;

                                    // обнуляем отметку об использовании однократного сигнала
                                    varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].wasUsed_SingleTopSignal = false;

                                    // обнуляем цену предыдущего сигнала
                                    varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].maxPriceTop_wasSignal_currentClient = 0;

                                    // отправляем сообщение клиенту с обновленными данными
                                    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                                        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                                        incoming_chatID, // id пользователя
                                        "", // Название проекта
                                        `You have set an upper limit:  `, // текст сообщения
                                        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_wasSettingNewPrise, //емодзи из переменной, из списка
                                        keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                                    )
                                })
                        })
                        .then(() => {
                            // запускаем сразу проверку одиночного сигнала
                            check_singleSignal_currentUser(
                                incoming_chatID,
                                varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime,
                                varrsAndData_pr0002.slideData.minPrice_short_inrervalTime)
                        })
                } catch (error) {
                    console.log(error);
                }
            }
                break;

            // установка нижнего лимита
            case 3: {
                try {
                    await connection_to_telegramBot___BTC_USD_signal.sendMessage(
                        incoming_chatID,
                        'Enter lower limit:',
                        // третьим параметром вводим параметр:
                        {
                            reply_markup: {
                                force_reply: true,  // Telegram будет ожидать ввода ответа
                            }
                        }
                    )
                        .then(async (userAnswer) => {
                            console.log('');
                            console.log("Сработал .then");
                            console.log(userAnswer);

                            // Дальнейшее выполнение кода будет после ответа пользователя
                            await connection_to_telegramBot___BTC_USD_signal.onReplyToMessage(
                                incoming_chatID,
                                userAnswer.message_id, // это ID чата, на которое бот ожидает ответ
                                (userAnswer) => {
                                    console.log(" ");
                                    console.log("Сработал .onReplyToMessage");
                                    console.log(userAnswer);

                                    // проверяем введенное число на предмет числа
                                    let validateUserNubber = validation_andRerurn_InputNumber(userAnswer.text);
                                    if (validateUserNubber == null) {
                                        global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                                            connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                                            incoming_chatID, // id пользователя
                                            "", // Название проекта
                                            `The entered value is not a valid number, the command was not accepted`, // текст сообщения
                                            varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_mistakeInputData, //емодзи из переменной, из списка
                                            keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                                        )

                                        return;
                                    }

                                    // проверяем введенное на соотвестствие нижнему лимиту
                                    validateUserNubber = validation_inputBottomLimit(incoming_chatID, validateUserNubber);
                                    if (validateUserNubber == null) {
                                        global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                                            connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                                            incoming_chatID, // id пользователя
                                            "", // Название проекта
                                            `The upper limit must be a positive number and must also be less than the lower limit. The command was not accepted.`, // текст сообщения
                                            varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_mistakeInputData, //емодзи из переменной, из списка
                                            keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                                        )
                                        return;
                                    }

                                    // если валидация пройдена, вносим данные в БД
                                    varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].bottomLimit_currentClient = validateUserNubber;

                                    // прибавляем данные в статистику пользователя
                                    try {
                                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].countCurrentUserActions_changeLimits++;

                                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].countCurrentUserActions_AllActions++;

                                        varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].timeLastAction = Date.now();

                                    } catch (error) {
                                        console.log(error);
                                    }

                                    // если сигнал не был установлен - тогда устанавливаем сигнал
                                    if (!varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params) varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params = 2;


                                    // обнуляем отметку об использовании однократного сигнала
                                    varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].wasUsed_SingleBottomSignal = false;

                                    // обнуляем цену предыдущего сигнала
                                    varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].minPriceBottom_wasSignal_currentClient = 0;

                                    // отправляем сообщение клиенту с обновленными данными
                                    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                                        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                                        incoming_chatID, // id пользователя
                                        "", // Название проекта
                                        `You have set an lower limit: ` + validateUserNubber.toLocaleString('ru-RU'), // текст сообщения
                                        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_wasSettingNewPrise, //емодзи из переменной, из списка
                                        keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                                    )


                                })

                        })
                        .then(() => {

                            console.log('=======');
                            console.log('varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime = ' + varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime);
                            console.log('varrsAndData_pr0002.slideData.minPrice_short_inrervalTime = ' + varrsAndData_pr0002.slideData.minPrice_short_inrervalTime);

                            // запускаем сразу проверку одиночного сигнала
                            check_singleSignal_currentUser(
                                incoming_chatID,
                                varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime,
                                varrsAndData_pr0002.slideData.minPrice_short_inrervalTime)
                        })
                } catch (error) {
                    console.log(error);
                }
            }
                break;

            // изменение сигнала
            case 4: {
                try {
                    // изменяем настройки сигнала            
                    varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params++;
                    if (varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params > 2) varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params = 0;

                    const signalNubmer = varrsAndData_pr0002.usersReestrTelegram[incoming_chatID].signal_params;

                    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                        incoming_chatID, // id пользователя
                        "", // Название проекта
                        'Signal settings have been changed: ' + varrsAndData_pr0002.signalNames[signalNubmer], // текст сообщения
                        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_wasSettingNewPrise, //емодзи из переменной, из списка
                        keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                    )


                } catch (error) {
                    console.log(error);
                }
            }
                break;

            // ответ на запрос кнопки при вводе значения с клавиатуры
            case 'This is reply_to_message': {
                // если это ответ на ввод после клавиатуры - ничего не делаем
            }
                break;


            // команда от Админа
            case 'getStatistic_sortActivUsers_last__1_day': {
                try {
                    // getStatistic_sortActivUsers_last__1_day();
                    // const anwerToAdmin = 'anwerToAdmin... ';
                    const anwerToAdmin = getStatistic_sortActivUsers_last__1_day();

                    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
                        incoming_chatID, // id пользователя
                        "", // Название проекта
                        anwerToAdmin, // текст сообщения
                        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_wasSettingNewPrise, //емодзи из переменной, из списка
                        keyboardUpdate(incoming_chatID),  // это передаваемая клавиатура для телеграм-Бота
                    )

                } catch (error) {
                    console.log(error);
                }
            }
                break;

            default: {
                // console.log(' ');
                // console.log('СРАБОТАЛ default');
                try {
                    // если команда не распознана, просто обновляем клавиатуру
                    await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
                        connection_to_telegramBot___BTC_USD_signal, // текущее соединение к боту
                        incoming_chatID, // JD клиента
                        "", // ID номер проекта
                        `Use the buttons to enter parameters.`, // ntrcn
                        null, // емодзи
                        keyboardUpdate(incoming_chatID)  // клавиатура бота
                    )
                } catch (error) {
                    console.log(error);
                }
            }
        }
    })

}
incominCommandFromUser_service();


// сообщение себе в InfoTelegramBot
try {
    /* 
        await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
            connection_to_telegramBot___BTC_USD_signal,
            // connection_to_my_InfoTelegramBot,
            config_pr0002.adminTelegramAccount_ID_pr0002,
            config_pr0002.projectNameID + "     " + config_pr0002.commentNameCurrentProject, // Название проекта
            "Сервер pr0002 Запущен", // текст сообщения
            varrsAndData_pr0002.emodziListTelegram_pr0002.defaul_currentProjectEmodzi //емодзи из переменной, из списка 
        );
    */
    /*     
        await global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
            connection_to_telegramBot___BTC_USD_signal,
            // connection_to_my_InfoTelegramBot,
            config_pr0002.adminTelegramAccount_ID_pr0002,
            config_pr0002.projectNameID + "     " + config_pr0002.commentNameCurrentProject, // Название проекта
            "Это пример моего сообщения", // текст сообщения
            null //емодзи из переменной, из списка 
        );
     */
} catch (error) {
    console.log("Ошибка отправки сообщения Telegram");
    console.log(error);
}

function identification_inIncomingButtonComsnd(msg) {
    // эта функция проверяет, есть ли во входящем сообщении команда, переданная нажатием кнопки бота
    try {
        // вначале проверяем, зарегистрирован ли данный пользователь
        if (!varrsAndData_pr0002.usersReestrTelegram[msg.chat.id]) return 'newUserRegistration';
        // стандартные ожидаемые команды
        if (msg.text.includes(varrsAndData_pr0002.buttonsStaticText.butonStText_updateCurrentStockPrise)) return 1;
        if (msg.text.includes(varrsAndData_pr0002.buttonsStaticText.butonStText_topLimit)) return 2;
        if (msg.text.includes(varrsAndData_pr0002.buttonsStaticText.butonStText_BottomLimit)) return 3;
        if (msg.text.includes(varrsAndData_pr0002.buttonsStaticText.butonStText_signalParams)) return 4;
        if (msg.reply_to_message) return 'This is reply_to_message'; // если в сообщении присутствует объект "reply_to_message" - значит это ответ на кнопку бота

        // Тут распознаем мои команды от админа
        if ((msg.chat.id == config_pr0002.adminTelegramAccount_ID_pr0002) && (msg.text.includes('admCom_sendRecl_1'))) return 'admCom_sendRecl_1';
        if ((msg.chat.id == config_pr0002.adminTelegramAccount_ID_pr0002) && (msg.text.includes('getStatistic_sortActivUsers_last__1_day'))) return 'getStatistic_sortActivUsers_last__1_day';
        if ((msg.chat.id == config_pr0002.adminTelegramAccount_ID_pr0002) && (msg.text.includes('getStatistic_sortActivUsers_last__7_dn'))) return 'getStatistic_sortActivUsers_last__7_dn';

        // если пред условия не выполнились, возвращаем null
        return null;
    } catch (error) {
        console.log('Ошибка identificationCurrentCommand_inIncomingText');
        console.log(error);
        return null;
    }
}

function validation_andRerurn_InputNumber(inputData) {
    try {
        // Удаление лишних пробелов и замена точки на запятую
        let transform_inputData = parseFloat(
            inputData
                .trim() // trim - убирает возможные пробелы в нв=ачале и в конце строки
                .replace(' ', '') // убираем возможные пробелы в середине строки
                .replace(',', '.'));
        // Проверка, является ли введенное значение числом
        if (transform_inputData >= 0) {
            console.log("Введенное число= " + transform_inputData);
            return transform_inputData;
        }
        else {
            console.log("Ошибка валидации введенного числа, в результате преобразования получилось: " + transform_inputData);
            return null;
        }
    } catch (error) {
        console.log("Ошибка валидации введенного числа в разделе catch");
        console.log(error);
        return null;
    }
}

function validation_inputTopLimit(user_ID, inputData) {
    try {
        console.log('validation_inputTopLimit, user_ID= ' + user_ID);
        console.log('validation_inputTopLimit, inputData= ' + inputData);
        console.log('varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient= ' + varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient);


        if (
            // допустимые варианты
            // либо мы сбросили на ноль
            (inputData == 0)
            || // либо значение введено верно, и нижний лимит не установлен, т.е. равен нулю
            (inputData > 0) && (varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient == 0)
            || //  либо значение введено верно, и он больше нижнего лимита
            (inputData > 0) && (inputData > varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient)
        ) return inputData;
        else {
            console.log("Ошибка валидации validation_inputTopLimit");
            return null;
        }
    } catch (error) {
        console.log("Ошибка валидации validation_inputTopLimit в разделе catch");
        return null;
    }
}

function validation_inputBottomLimit(user_ID, inputData) {
    try {
        if (
            // допустимые варианты
            // либо мы сбросили на ноль
            (inputData == 0)
            || // либо значение введено верно, и верхний лимит не установлен, т.е. равен нулю
            (inputData > 0) && (varrsAndData_pr0002.usersReestrTelegram[user_ID].topLimit_currentClient == 0)
            || //  либо значение введено верно, и он ниже верхнего лимита
            (inputData > 0) && (inputData < varrsAndData_pr0002.usersReestrTelegram[user_ID].topLimit_currentClient)
        ) return inputData;
        else {
            console.log("Ошибка валидации validation_inputBottomLimit");
            return null;
        }
    } catch (error) {
        console.log("Ошибка валидации validation_inputBottomLimit в разделе catch");
        return null;
    }
}



// эта функция записывает минимальную и максимальную цену за период временя во время потока от вебсокета
function resetPrisePreviousInterval(inputPrice) {
    varrsAndData_pr0002.slideData.currentPrice = inputPrice;
    //  если данные граничных цен за промежуток времени еще не записывались перед запуском сервера, тогда делаем первую запись
    if (!varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime) {
        varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime = inputPrice;
    }
    if (!varrsAndData_pr0002.slideData.minPrice_short_inrervalTime) {
        varrsAndData_pr0002.slideData.minPrice_short_inrervalTime = inputPrice;
    }
    if (!varrsAndData_pr0002.slideData.maxPrice_long_inrervalTime) {
        varrsAndData_pr0002.slideData.maxPrice_long_inrervalTime = inputPrice;
    }
    if (!varrsAndData_pr0002.slideData.minPrice_long_inrervalTime) {
        varrsAndData_pr0002.slideData.minPrice_long_inrervalTime = inputPrice;
    }
    // далее сравниваем текущие min/max цены с текщий и при необх орректируем
    if (varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime < inputPrice) {
        varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime = inputPrice;
    }
    if (varrsAndData_pr0002.slideData.minPrice_short_inrervalTime > inputPrice) {
        varrsAndData_pr0002.slideData.minPrice_short_inrervalTime = inputPrice;
    }

    if (varrsAndData_pr0002.slideData.maxPrice_long_inrervalTime < inputPrice) {
        varrsAndData_pr0002.slideData.maxPrice_long_inrervalTime = inputPrice;
    }
    if (varrsAndData_pr0002.slideData.minPrice_long_inrervalTime > inputPrice) {
        varrsAndData_pr0002.slideData.minPrice_long_inrervalTime = inputPrice;
    }
}

// ------------------------------------------------------------

function alertTopSingle(user_ID, maxIntervalPrice) {
    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
        user_ID, // id пользователя
        "", // Название проекта
        'ATTENTION !  The price has exceeded your limit and reached  ' + maxIntervalPrice.toLocaleString('ru-RU') + " BTC/USD", // текст сообщения
        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_alertPrice_UP, //емодзи из переменной, из списка
        keyboardUpdate(user_ID),  // это передаваемая клавиатура для телеграм-Бота
    )
}

function alertBottomSingle(user_ID, minIntervalPrice) {
    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
        user_ID, // id пользователя
        "", // Название проекта
        'ATTENTION !  The price dropped to the established minimum and amounted to ' + minIntervalPrice.toLocaleString('ru-RU') + " BTC/USD", // текст сообщения
        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_alertPrice_DOWN, //емодзи из переменной, из списка
        keyboardUpdate(user_ID),  // это передаваемая клавиатура для телеграм-Бота
    )
}

function alertTopRepeat(user_ID, maxIntervalPrice) {
    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
        user_ID, // id пользователя
        "", // Название проекта
        'ATTENTION !  Price increased to ' + maxIntervalPrice.toLocaleString('ru-RU') + " BTC/USD", // текст сообщения
        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_alertPrice_UP, //емодзи из переменной, из списка
        keyboardUpdate(user_ID),  // это передаваемая клавиатура для телеграм-Бота
    )
}

function alertBottomRepeat(user_ID, minIntervalPrice) {
    global_Functions_and_Servises_forAll_Projects.telegramBot_Servise.myMessegesToCurrentTelegramBot(
        connection_to_telegramBot___BTC_USD_signal, // соединение с текущим ботом
        user_ID, // id пользователя
        "", // Название проекта
        'ATTENTION !  Price dropped to ' + minIntervalPrice.toLocaleString('ru-RU') + " BTC/USD", // текст сообщения
        varrsAndData_pr0002.emodziListTelegram_pr0002.emodzi_alertPrice_DOWN, //емодзи из переменной, из списка
        keyboardUpdate(user_ID),  // это передаваемая клавиатура для телеграм-Бота
    )
}

// ------------------------------------------------------------

// Тут служебные команды Админа
function getStatistic_sortActivUsers_last__1_day() {
    try {
        console.log(' ');
        console.log('Запуск getStatistic_sortActivUsers_last__1_day');
        let usersArray = [];
        // Извлекаем из реестра пользователей целевых юзеров и добавляем в массив
        Object.keys(varrsAndData_pr0002.usersReestrTelegram).forEach((keyName) => {
            // если с момента последней активности прошло не более суток
            if ((Date.now() - varrsAndData_pr0002.usersReestrTelegram[keyName].timeLastAction) < 86400000) {
                // добавляем юзера в массив
                usersArray.push(
                    '\n'
                    + keyName
                    +
                    (
                        varrsAndData_pr0002.usersReestrTelegram[keyName].user_data.first_name
                            ? ('_' + varrsAndData_pr0002.usersReestrTelegram[keyName].user_data.first_name)
                            : ''
                    )
                    +
                    (
                        varrsAndData_pr0002.usersReestrTelegram[keyName].user_data.username
                            ? ('_' + varrsAndData_pr0002.usersReestrTelegram[keyName].user_data.username)
                            : ''
                    )
                    + '   lookingPraice= ' + varrsAndData_pr0002.usersReestrTelegram[keyName].countCurrentUserActions_lookingPraice
                    + '   changeLimits= ' + varrsAndData_pr0002.usersReestrTelegram[keyName].countCurrentUserActions_changeLimits
                );
            }
        });
        console.log('usersArray=');
        console.log(usersArray);
        return usersArray;
    } catch (error) {
        console.log(error);
    }
}




function check_singleSignal_currentUser(user_ID, maxPrice_short_inrervalTime, minPrice_short_inrervalTime) {
    // console.log('');
    // console.log('maxPrice_short_inrervalTime= ' + maxPrice_short_inrervalTime);
    // console.log('minPrice_short_inrervalTime= ' + minPrice_short_inrervalTime);

    if (varrsAndData_pr0002.usersReestrTelegram[user_ID].signal_params != 1) return;
    // проверка верхних сигналов
    if (
        varrsAndData_pr0002.usersReestrTelegram[user_ID].topLimit_currentClient
        &&
        !varrsAndData_pr0002.usersReestrTelegram[user_ID].wasUsed_SingleTopSignal
        && (maxPrice_short_inrervalTime > varrsAndData_pr0002.usersReestrTelegram[user_ID].topLimit_currentClient)) {
        // Отправляем сигнал пользователю
        alertTopSingle(user_ID, maxPrice_short_inrervalTime);
        // Делаем отметки в реестре данного пользователя
        varrsAndData_pr0002.usersReestrTelegram[user_ID].maxPriceTop_wasSignal_currentClient = maxPrice_short_inrervalTime;
        varrsAndData_pr0002.usersReestrTelegram[user_ID].wasUsed_SingleTopSignal = true;
    }
    // проверка нижних сигналов
    if (
        varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient
        &&
        !varrsAndData_pr0002.usersReestrTelegram[user_ID].wasUsed_SingleBottomSignal
        && (minPrice_short_inrervalTime < varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient)) {
        // Отправляем сигнал пользователю
        alertBottomSingle(user_ID, minPrice_short_inrervalTime);
        // Делаем отметки в реестре данного пользователя
        varrsAndData_pr0002.usersReestrTelegram[user_ID].minPriceBottom_wasSignal_currentClient = minPrice_short_inrervalTime;
        varrsAndData_pr0002.usersReestrTelegram[user_ID].wasUsed_SingleBottomSignal = true;
    }
}


function check_repeatSignal_currentUser(user_ID, maxPrice_long_inrervalTime, minPrice_long_inrervalTime) {

    if (varrsAndData_pr0002.usersReestrTelegram[user_ID].signal_params != 2) return;
    // проверка верхних сигналов
    if (
        varrsAndData_pr0002.usersReestrTelegram[user_ID].topLimit_currentClient
        &&
        (maxPrice_long_inrervalTime > varrsAndData_pr0002.usersReestrTelegram[user_ID].topLimit_currentClient)
        &&
        (   // тут проверяем одно из условий - либо предыдущая цена напоминания еще не была занесена перед первым напоминанием, либо удовлетворяет указанное неравенство
            (!varrsAndData_pr0002.usersReestrTelegram[user_ID].maxPriceTop_wasSignal_currentClient)
            ||
            (maxPrice_long_inrervalTime > varrsAndData_pr0002.usersReestrTelegram[user_ID].maxPriceTop_wasSignal_currentClient)
        )
    ) {
        // Отправляем сигнал пользователю
        alertTopRepeat(user_ID, maxPrice_long_inrervalTime);
        // Делаем отметки в реестре данного пользователя
        varrsAndData_pr0002.usersReestrTelegram[user_ID].maxPriceTop_wasSignal_currentClient = maxPrice_long_inrervalTime;
    }
    // проверка нижних сигналов
    if (
        varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient
        &&
        (minPrice_long_inrervalTime < varrsAndData_pr0002.usersReestrTelegram[user_ID].bottomLimit_currentClient)
        &&
        (   // тут проверяем одно из условий - либо предыдущая цена напоминания еще не была занесена перед первым напоминанием, либо удовлетворяет указанное неравенство
            (!varrsAndData_pr0002.usersReestrTelegram[user_ID].minPriceBottom_wasSignal_currentClient)
            ||
            (minPrice_long_inrervalTime < varrsAndData_pr0002.usersReestrTelegram[user_ID].minPriceBottom_wasSignal_currentClient)
        )
    ) {
        // Отправляем сигнал пользователю
        alertBottomRepeat(user_ID, minPrice_long_inrervalTime);
        // Делаем отметки в реестре данного пользователя
        varrsAndData_pr0002.usersReestrTelegram[user_ID].minPriceBottom_wasSignal_currentClient = minPrice_long_inrervalTime;
    }

}

// ------------------------------------------------------------

// проверка одиночных сигналов, кажд 1 мин
function checkSingleAlerts_forAll_Users() {
    // console.log(' ');
    // console.log('Запуск checkSingleAlerts_forAll_Users()');
    setTimeout(() => {
        const maxCurrentPrice = varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime;
        const minCurrentPrice = varrsAndData_pr0002.slideData.minPrice_short_inrervalTime;

        // теперь обнуляем начальные данные, поскольку вебсокет будет далее обновлять их
        varrsAndData_pr0002.slideData.maxPrice_short_inrervalTime = 0;
        varrsAndData_pr0002.slideData.minPrice_short_inrervalTime = 0;

        //  console.log('');
        //  console.log('maxCurrentPrice = ' + maxCurrentPrice);
        //  console.log('minCurrentPrice = ' + minCurrentPrice);

        // теперь для каждого пользователя запускаем проверку необходимости одиночных оповещений
        Object.keys(varrsAndData_pr0002.usersReestrTelegram).forEach((keyName) => {
            check_singleSignal_currentUser(keyName, maxCurrentPrice, minCurrentPrice);
        });
        checkSingleAlerts_forAll_Users();
    }, 5000);
}
checkSingleAlerts_forAll_Users();


// проверка повторяющихся сигналов, кажд 5 мин
function checkRepeatAlerts_forAll_Users() {
    // console.log(' ');
    // console.log('Запуск checkRepeatAlerts_forAll_Users()');
    setTimeout(() => {
        const maxCurrentPrice = varrsAndData_pr0002.slideData.maxPrice_long_inrervalTime;
        const minCurrentPrice = varrsAndData_pr0002.slideData.minPrice_long_inrervalTime;

        //   console.log('');
        //   console.log('maxCurrentPrice = ' + maxCurrentPrice);
        //   console.log('minCurrentPrice = ' + minCurrentPrice);

        // теперь обнуляем начальные данные, поскольку вебсокет будет далее обновлять их
        varrsAndData_pr0002.slideData.maxPrice_long_inrervalTime = 0;
        varrsAndData_pr0002.slideData.minPrice_long_inrervalTime = 0;
        // теперь для каждого пользователя запускаем проверку необходимости одиночных оповещений
        Object.keys(varrsAndData_pr0002.usersReestrTelegram).forEach((keyName) => {
            check_repeatSignal_currentUser(keyName, maxCurrentPrice, minCurrentPrice);
        });
        checkRepeatAlerts_forAll_Users();
    }, 300000);           //  15000);
}
checkRepeatAlerts_forAll_Users();




//   https://t.me/USD_BTN_Signal_bot



