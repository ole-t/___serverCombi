

require('dotenv').config();
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup');
const { callbackButton } = require('telegraf/markup');


let currentPrice = 0;
// const WebSocket = require('ws'); // 
import WebSocket from 'ws';

// ------------------------------------------------------------

//const bot = new Telegraf('1849534701:AAEUXK06JCzmab49WrgipUUlPtiPtzxKUxw','setWebHook?url=https://o65yhvfn7g.execute-api.us-east-1.amazonaws.com/BTC-USD_bot-1_API' )      // ('1849534701:AAEUXK06JCzmab49WrgipUUlPtiPtzxKUxw')
const bot = new Telegraf('1849534701:AAEUXK06JCzmab49WrgipUUlPtiPtzxKUxw', 'setWebhook?url=https://hxfdkvgnpe.execute-api.us-east-1.amazonaws.com/telegram-handler')      // ('1849534701:AAEUXK06JCzmab49WrgipUUlPtiPtzxKUxw')
// const bot = new Telegraf(process.env.myKeyToTelegrammBot);
// Установка клавиатуры

bot.start((ctx) => {
  let id_TelegrammCurrent = Number(ctx.message.from.id);
  let id = get_ID_User_in_BD(id_TelegrammCurrent);
  keyboard_Update(id, messageUpdate);

  ctx.reply('Этот Бот будет оповещать вас, когда текущая стоимость BTC/USD достигнет установленных вами лимитов.');
}
)

// Далее главная функция по выполнению действий в ответ на действия пользователя 
// Обрабатываем введенное пользователем значение:
bot.on('text', ctx => {

  let inputText = String(ctx.message.text); //сюда помещаем сообщение юзера
  let id_TelegrammCurrent = Number(ctx.message.from.id);

  // запускаем функцию обработки с передачей двух входящих аргументов
  ctx.reply(glavn(inputText, id_TelegrammCurrent));
})

bot.launch((ctx) => {
  let id_TelegrammCurrent = Number(ctx.message.from.id);
  let id = get_ID_User_in_BD(id_TelegrammCurrent);
  keyboard_Update(id, messageUpdate);
}
)

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

console.log('\nМой код печатает первое\nИ второе\nИ третье');

// ------------------------------------------------------------
let myStruct = {
  id_Telegramm: 0,
  signal: 0,
  userLanguage: null,
  userTimaArial: null,
  timeUserAction: null,

  price_top: 99000,
  waiteTopPrice: false, // это индикатор ожидания ввода цены в ответ на нажатие соотв клавиши
  wasUsed_SingleTop: false,
  maxPriceTop: 0, // это максимальная цена, превышающая ранее установленный лимит за период
  pricePreviousSignalTop: 0, // это макс цена, о которой было передана информация юзеру при повторных сигналах

  price_bottom: 15000,
  waiteBottomPrice: false, 
  wasUsed_SingleBottom: false,
  minPriceBottom: 0,
  pricePreviousSignalBottom: 0,
};

let myBD_Array = [];
/* 
// заполним базу данных псевдопользователями
for (let i = 0; i < 10; i++) {
  myBD_Array.push({
    id_Telegramm: Math.floor(Math.random() * 10000000000),
    waiteTopPrice: false,
    waiteBottomPrice: false,
    signal: 0,
  });
}
 */

// считываем файл Базы данных 
loadJSONfile();

// ------------------------------------------------------------

// Считываем файл БД
function loadJSONfile() {

  try {
    // Считываем содержание файла в переменную
    let my_BD_temp = fs.readFileSync("myJSON_BD.json", "utf8");
    // Значение переменной "распаковываем" и записываем в значение массива
    myBD_Array = JSON.parse(my_BD_temp);
  }
  catch { return };
}

// ------------------------------------------------------------

// Сохранения файла БД
async function saveJSONfile() {
  let my_BD_temp = JSON.stringify(myBD_Array);
  fs.writeFileSync('myJSON_BD.json', my_BD_temp);
}
// ------------------------------------------------------------

// Функция поиска/добавления пользователя в Базу Данных
let get_ID_User_in_BD = (current_ID_Telegramm) => {

  // поиск уже существующего пользователя
  for (let i = 0; i < myBD_Array.length; i++) {
    if (myBD_Array[i].id_Telegramm == current_ID_Telegramm) {
      // indexInBD_currentUser = i; // если пользователь найден - возвращаем его индекс в БД пользователей
      // let ansver = 'Ответ из функции определения ID, цикл начального поиска, i= ';
      return i; // если пользователь найден - возвращаем его индекс и выходим из функции
    }
  }
  // если программа дошла до этого места - значит пользователь не был найден.
  // создаем нового пользователя
  myBD_Array.push({
    id_Telegramm: current_ID_Telegramm,
    signal: 0,
    userLanguage: null,
    userTimaArial: null,

    price_top: 0,
    waiteTopPrice: 99000,
    wasUsed_SingleTop: false,
    maxPriceTop: 0,
    pricePreviousSignalTop: 0,

    price_bottom: 0,
    waiteBottomPrice: 15000,
    wasUsed_SingleBottom: false,
    minPriceBottom: 0,
    pricePreviousSignalBottom: 0,
  });

  // посылаем мне сообщение о добавлении нового пользователе
  infoMe('ИНФО: Добавлен пользователь, \nid_Telegramm: ' + current_ID_Telegramm);

  // и определяем индекс в БД вновь созданного пользователя. Производим поиск с конца массива:
  for (let i = 0; i < myBD_Array.length; i++) {
    if (myBD_Array[i].id_Telegramm == current_ID_Telegramm) {
      //indexInBD_currentUser = i; // если пользователь найден - возвращаем его индекс в БД пользователей
      // let ansver = 'Ответ из функции определения ID, цикл ПОВТОРНОГО поиска, i= ';
      return i; // если пользователь найден - возвращаем его индекс и выходим из функции
    }
  }
}

// ------------------------------------------------------------

// это функция для обработки входящий команд от телеграм
function glavn(inputText, id_TelegrammCurrent) {

  if (id_TelegrammCurrent != 1668193760) {
    infoMe('ИНФО: Действие пользователя, \nid_Telegramm: ' + id_TelegrammCurrent);
  }

  // Находим индекс данного пользователя в БД (либо добавляем его в БД и получаем индекс)
  let indexInBD_currentUser = get_ID_User_in_BD(id_TelegrammCurrent);

  myBD_Array[indexInBD_currentUser].timeUserAction = getCurrentTime();

  // Функции тестирования:
  // Временные переменные
  let str1 = inputText.slice(0, 3);
  let str2 = inputText.slice(3, 11);

  // Ручное изменение рыночной стоимости - для тестирования
  if (str1 == '///') {
    currentPrice = Number(str2);
    keyboard_Update(indexInBD_currentUser, messageUpdate);
    return;
  }

  // Ручная остановка связи - для тестирования
  if (str1 == '//5') {
    binanceSocket.close();
    return;
  }

  let inputMyCommand = (inputText.slice(0, 6));

  console.log('\nИндекс пользователя в БД= ' + indexInBD_currentUser + ':');
  console.log('inputMyCommand= ' + inputMyCommand);
  console.log(myBD_Array[indexInBD_currentUser]);
  console.log(' \n');

  //return myStr_1 + myStr_2;

  // обрабатываем содержимое входящего сообщения

  // обрабатываем содержимое возможных команд
  switch (inputMyCommand) {

    case 'Текущи': {

      // снимаем метки об ожидании ввода цены (если они есть)
      myBD_Array[indexInBD_currentUser].waiteTopPrice = false;
      myBD_Array[indexInBD_currentUser].waiteBottomPrice = false;
      // обновляем данные клавиатуры
      keyboard_Update(indexInBD_currentUser, messageUpdate);
      return ('Текущий курс составляет: \n' + currentPrice + ' BTC/USD'); // выводим приглашение пользователю
    }


    case 'Верхни': {
      myBD_Array[indexInBD_currentUser].waiteTopPrice = true;
      myBD_Array[indexInBD_currentUser].waiteBottomPrice = false;  // включаем ожидание значение ожидания ввода цены

      /* 
      console.log('\nИндекс пользователя в БД= ' + indexInBD_currentUser + ':');
      console.log(myBD_Array[indexInBD_currentUser]);
      console.log(' \n');
      */

      return ('Введите ВЕРХНИЙ ЛИМИТ:'); // выводим приглашение пользователю
    }

    case 'Нижний': {
      myBD_Array[indexInBD_currentUser].waiteBottomPrice = true;  // включаем ожидание значение ожидания ввода цены
      myBD_Array[indexInBD_currentUser].waiteTopPrice = false;



      console.log('\nИндекс пользователя в БД= ' + indexInBD_currentUser + ':');
      console.log(myBD_Array[indexInBD_currentUser]);
      console.log(' \n');


      return ('Введите НИЖНИЙ ЛИМИТ:'); // выводим приглашение пользователю
    }

    case 'Сигнал': {
      // обнуляем предыдущие установки
      setNull_Slide_Data(indexInBD_currentUser);

      let i = myBD_Array[indexInBD_currentUser].signal + 1;
      if (i == 3) { i = 0 }; // если переваливает за 3, то сбрасываем на ноль
      myBD_Array[indexInBD_currentUser].signal = i;

      keyboard_Update(indexInBD_currentUser, messageUpdate);


      console.log('\nИндекс пользователя в БД= ' + indexInBD_currentUser + ':');
      console.log(myBD_Array[indexInBD_currentUser]);
      console.log(' \n');

      if (i == 0) {
        return ('Все уведомления приостановлены.');
      }
      if (i == 1) {
        return ('Установлен однократный сигнал. \nУведомление придет один раз при достижении верхней цены, и один раз - при достижении нижней цены.');
      }
      if (i == 2) {
        return ('Установлен повторяющийся сигнал. \nУведомление придет при достижении установленных лимитов (max./min.), а также будет периодически повторяться в случае дальнейшего роста (падения) цены.');
      }
    }
  }

  // проверяем, ожидается ли ввод значения верхней цены
  if (myBD_Array[indexInBD_currentUser].waiteTopPrice == true) {

    // Провериям введенное значение
    let data = checkInpudDataTop(indexInBD_currentUser, inputText);

    if (data == 'mistake_1') {
      return ('ОШИБКА. \nЗначение должно быть целым положительным числом, нужно повторить. \nВведите ВЕРХНИЙ ЛИМИТ:');
    }
    if (data == 'mistake_2') {
      return ('ОШИБКА - верхний лимит должен быть больше нижнего лимита, нужно повторить. \nВведите ВЕРХНИЙ ЛИМИТ:');
    }

    // записываем в БД установленную цену
    myBD_Array[indexInBD_currentUser].price_top = Number(inputText);
    // обнуляем значения скользящих паеременных
    setNull_Slide_Data(indexInBD_currentUser);

    // корректируем установку напоминания
    myBD_Array[indexInBD_currentUser].signal = 2; // включаем прогрессивный сигнал

    keyboard_Update(indexInBD_currentUser, messageUpdate);

    return ('Верхний лимит установлен: \n' + myBD_Array[indexInBD_currentUser].price_top + ' BTC/USD \nВключено уведомление');
  }

  // проверяем, ожидается ли ввод значения нижней цены
  if (myBD_Array[indexInBD_currentUser].waiteBottomPrice == true) {

    let data = checkInpudDataBottom(indexInBD_currentUser, inputText);

    if (data == 'mistake_1') {
      return ('ОШИБКА. Значение должно быть целым положительным числом, нужно повторить. \nВведите НИЖНИЙ ЛИМИТ:');
    }
    if (data == 'mistake_2') {
      return ('ОШИБКА - нижний лимит должен быть меньше верхнего лимита, нужно повторить. \nВведите НИЖНИЙ ЛИМИТ:');
    }

    // записываем в БД установленную цену
    myBD_Array[indexInBD_currentUser].price_bottom = Number(inputText);
    // обнуляем значения скользящих паеременных
    setNull_Slide_Data(indexInBD_currentUser);


    // корректируем установку напоминания
    myBD_Array[indexInBD_currentUser].signal = 2; // включаем прогрессивный сигнал

    keyboard_Update(indexInBD_currentUser, messageUpdate);

    return ('Нижний лимит установлен: \n' + myBD_Array[indexInBD_currentUser].price_bottom + ' BTC/USD \nВключено уведомление');
  }

  // Если выполнение дошло до этого места - значит не была введени ни одна из команд
  return ('Команда не распознана. Сначала нажмите соответствующие кнопки в нижнем меню.');
}
// ------------------------------------------------------------
function alertTopSingle(user_ID) {
  /* 
    bot.telegram.sendMessage(myBD_Array[user_ID].id_Telegramm, ('\nВнимание! \nЦена достигла установленного лимита (' + myBD_Array[user_ID].price_top + ' BTC/USD),\nи составила ' + currentPrice + ' BTC/USD'));
   */
  keyboard_Update(user_ID, '\nВнимание! \nЦена достигла установленного лимита (' + myBD_Array[user_ID].price_top + ' BTC/USD),\nи составила ' + currentPrice + ' BTC/USD');
}
// ------------------------------------------------------------
function alertBottomSingle(user_ID) {
  /* 
    bot.telegram.sendMessage(myBD_Array[user_ID].id_Telegramm, ('\nВнимание! \nЦена достигла установленного минимума (' + myBD_Array[user_ID].price_bottom + ' BTC/USD),\nи составила ' + currentPrice + ' BTC/USD'));
   */
  keyboard_Update(user_ID, '\nВнимание! \nЦена достигла установленного минимума (' + myBD_Array[user_ID].price_bottom + ' BTC/USD),\nи составила ' + currentPrice + ' BTC/USD');
}
// ------------------------------------------------------------
function alertTopRepeat(user_ID) {
  /* 
  console.log('\nЦена продолжает расти. За последние 15 мин. цена достигала ' + myBD_Array[user_ID].maxPriceTop + ' BTC/USD');
  console.log(myBD_Array[user_ID]);
 */
  /* 
    bot.telegram.sendMessage(myBD_Array[user_ID].id_Telegramm, ('\nЦена продолжает расти. \nЗа последние 15 мин. цена достигала ' + myBD_Array[user_ID].maxPriceTop + ' BTC/USD'));
   */
  keyboard_Update(user_ID, '\nЦена продолжает расти. \nЗа последние 15 мин. цена достигала ' + myBD_Array[user_ID].maxPriceTop + ' BTC/USD');
}
// ------------------------------------------------------------
function alertBottomRepeat(user_ID) {
  /* 
  console.log('\nЦена продолжает снижаться. \nЗа последние 15 мин. цена опускалась до ' + myBD_Array[user_ID].minPriceBottom + ' BTC/USD');
  console.log(myBD_Array[user_ID]);
 */
  /* 
    bot.telegram.sendMessage(myBD_Array[user_ID].id_Telegramm, ('\nЦена продолжает снижаться. \nЗа последние 15 мин. цена опускалась до ' + myBD_Array[user_ID].minPriceBottom + ' BTC/USD'));
   */
  keyboard_Update(user_ID, '\nЦена продолжает снижаться. \nЗа последние 15 мин. цена опускалась до ' + myBD_Array[user_ID].minPriceBottom + ' BTC/USD');

}
// ------------------------------------------------------------
function check_single_Signal(user_ID) {
  // проверка верхних сигналов
  if (currentPrice > myBD_Array[user_ID].maxPriceTop) {
    // Обновлянм скользащее значение макс. цены
    myBD_Array[user_ID].maxPriceTop = currentPrice;
  }

  // Отправляем сигнал пользоваателю
  if ((currentPrice > myBD_Array[user_ID].price_top) && (myBD_Array[user_ID].wasUsed_SingleTop == false)) {
    alertTopSingle(user_ID);
    myBD_Array[user_ID].pricePreviousSignalTop = currentPrice;
    // Изменяем индикатор подачи первого сигнала
    myBD_Array[user_ID].wasUsed_SingleTop = true;

    console.log(myBD_Array[user_ID]);
  }

  // проверка нижних сигналов
  //Сюда добавить тоже самое для нижних сигналов
  if (currentPrice < myBD_Array[user_ID].minPriceBottom) {
    // Обновлянм скользащее значение макс. цены
    myBD_Array[user_ID].minPriceBottom = currentPrice;
  }

  // Отправляем сигнал пользоваателю
  if ((currentPrice < myBD_Array[user_ID].price_bottom) && (myBD_Array[user_ID].wasUsed_SingleBottom == false)) {
    alertBottomSingle(user_ID);
    myBD_Array[user_ID].pricePreviousSignalBottom = currentPrice;
    // Изменяем индикатор подачи первого сигнала
    myBD_Array[user_ID].wasUsed_SingleBottom = true;

    console.log(myBD_Array[user_ID]);
  }

}
// ------------------------------------------------------------
function check_repeat_Signal(user_ID) {

  if ((currentPrice > myBD_Array[user_ID].price_top) && (myBD_Array[user_ID].maxPriceTop > myBD_Array[user_ID].pricePreviousSignalTop)) {
    // цена продолжает расти     
    // отправляем сигнал пользователю
    alertTopRepeat(user_ID);
    // Корректируем значения предыдущего сигнала
    myBD_Array[user_ID].pricePreviousSignalTop = myBD_Array[user_ID].maxPriceTop;
  }

  // выполняем условия для нижней цены
  if ((currentPrice < myBD_Array[user_ID].price_bottom) && (myBD_Array[user_ID].minPriceBottom < myBD_Array[user_ID].pricePreviousSignalBottom)) {
    // цена продолжает расти     
    // отправляем сигнал пользователю
    alertBottomRepeat(user_ID);
    // Корректируем значения предыдущего сигнала
    myBD_Array[user_ID].pricePreviousSignalBottom = myBD_Array[user_ID].minPriceBottom;
  }

}
// ------------------------------------------------------------
// Таймер отслеживаничя цены и первичных сигналов
let ttt = 0;

let timer_1_sec = setInterval(() => {

  for (let i = 0; i < myBD_Array.length; i++) {
    if (myBD_Array[i].signal > 0) {
      check_single_Signal(i);
    }
  }

  ttt++;
  console.log('\nТаймер функции проверки: ' + ttt)

  // тестируем отключение соединения
  // if (ttt == 5) { binanceSocket.close() }

}, 1000);
// ------------------------------------------------------------
// Таймер повторных сигналов
let timer_15_min = setInterval(() => {

  for (let i = 0; i < myBD_Array.length; i++) {
    if (myBD_Array[i].signal == 2) {
      check_repeat_Signal(i);
    }
  }

}, 5000);
// ------------------------------------------------------------

// ------------------------------------------------------------
// Таймер для езервирование БД
let timer_Save_BD = setInterval(() => {
  try { saveJSONfile(); }
  catch { return };
}, 10000);
// ------------------------------------------------------------

// функция обнуления переменных скользящих значений 
function setNull_Slide_Data(user_ID) {
  myBD_Array[user_ID].waiteTopPrice = false;
  myBD_Array[user_ID].wasUsed_SingleTop = false;
  myBD_Array[user_ID].maxPriceTop = currentPrice;
  myBD_Array[user_ID].pricePreviousSignalTop = 0;

  myBD_Array[user_ID].waiteBottomPrice = false;
  myBD_Array[user_ID].wasUsed_SingleBottom = false;
  myBD_Array[user_ID].minPriceBottom = currentPrice;
  myBD_Array[user_ID].pricePreviousSignalBottom = 0;
}
// ------------------------------------------------------------

let nameKlav_1_begin = 'Текущий курс (нажмите для обновления): ';
let nameKlav_1_end;
let nameKlav_1;

let nameKlav_2_begin = 'Верхний лимит: \n';
let nameKlav_2_end;
let nameKlav_2;

let nameKlav_3_begin = 'Нижний лимит: \n';
let nameKlav_3_end;
let nameKlav_3 = nameKlav_3_begin + nameKlav_3_end;

let nameKlav_4_begin = 'Сигнал: \n';
let nameKlav_4_end = 'ОТКЛЮЧЕН';
let nameKlav_4 = nameKlav_4_begin + nameKlav_4_end;

// ------------------------------------------------------------

function keyboard_Update(user_ID, textMessage) {

  nameKlav_1 = nameKlav_1_begin + currentPrice + ' BTC/USD';
  nameKlav_2 = nameKlav_2_begin + myBD_Array[user_ID].price_top + ' BTC/USD';
  nameKlav_3 = nameKlav_3_begin + myBD_Array[user_ID].price_bottom + ' BTC/USD';

  // установка второй части подписей к кнопкам
  switch (Number(myBD_Array[user_ID].signal)) {
    case 0: {
      nameKlav_4_end = 'ОТКЛЮЧЕН';
      break;
    }
    case 1: {
      nameKlav_4_end = 'ОДИНОЧНЫЙ';
      break;
    }
    case 2: {
      nameKlav_4_end = 'ПРОГРЕССИВНЫЙ';
      break;
    }
  }

  nameKlav_4 = nameKlav_4_begin + nameKlav_4_end;

  bot.telegram.sendMessage((myBD_Array[user_ID].id_Telegramm), textMessage, (Markup.keyboard([[nameKlav_1], [nameKlav_2, nameKlav_3], [nameKlav_4]])
    .oneTime(false)  // false - не прятать клавиатуру после первого использование
    .resize(false)   // false - не уменьшать размер кнопок до минимального размера
    .extra()
  )
  );
}

function checkInpudDataTop(user_ID, inputText) {
  let data = Number(inputText);
  console.log('\nТип введенных данных после преобразования в NUBBER: ' + typeof (data));
  console.log('Введенное значение: ' + data);
  if (data > 0) { }
  else { return ('mistake_1') };  //Ошибка - вводимое значение должно быть целым положительным числом
  if (data <= myBD_Array[user_ID].price_bottom) { return ('mistake_2') }; // Ошибка - веррхний лимит должен быть больше нижнего лимита
}

function checkInpudDataBottom(user_ID, inputText) {
  let data = Number(inputText);

  console.log('\nТип введенных данных после преобразования в NUBBER: ' + typeof (data));
  console.log('Установленный нижний лимит: ' + data);
  console.log('Верхний лимит: ' + myBD_Array[user_ID].price_top);


  if (data > 0) { }
  else { return ('mistake_1') };  //Ошибка - вводимое значение должно быть целым положительным числом
  if (data >= myBD_Array[user_ID].price_top) { return ('mistake_2') }; // Ошибка - нижний лимит должен быть меньше верхнего лимита
}
// ------------------------------------------------------------
let messageUpdate = 'Данные обновлены.'; // 'Данные обновлены.'

// ------------------------------------------------------------

function infoMe(infoText) {
  console.log();
  let mySendText = infoText + '\nВремя: ' + getCurrentTime();
  console.log('\nСообщение из функции infoMe + : \n' + mySendText + '\n');
  bot.telegram.sendMessage(1668193760, mySendText);
}
// ------------------------------------------------------------

let getCurrentTime = () => {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  today = dd + '.' + mm + '.' + yyyy;
  var time = new Date().toLocaleTimeString();
  let currentDate = time + ' --- ' + today;
  return (currentDate);
}

// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------


// переменная вынесена снаружи, чтобы можно было менять значение снаружи при тестировании
let binanceSocket;

async function currentPriseAskBinance() {

  // переменная, разрешающай запускать внешний таймер после окончания работы внутреннего таймера
  let timerAble = true;

  let connectMyFun = () => {

    console.log('\nВЕРХНИЙ запуск функции получения к WebSocket:');
    // пробуем передать сообщение о запуске
    try { infoMe('ВЕРХНИЙ запуск функции получения к WebSocket:'); }
    catch (err) { };

    binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

    // console.log('currentPrice внутри функции getPriseWebSocket = ' + currentPrice);
    binanceSocket.onmessage = event => {
      currentPrice = Math.floor(Number(JSON.parse(event.data).p));
    }

  }

  connectMyFun();

  // функция для проверки состояния соединения с WebSocket, запускается из таймера
  let inspectionConnection = () => {
    timerAble = false;
    // infoMe('Запускаем внутр. задержку 10 сек для фун. inspectionConnection');

    let codeForTimer = () => {
      // infoMe('Задержка 10 сек закончилась \n Статус соединения фун. inspectionConnection= ' + binanceSocket.readyState)
      if (binanceSocket.readyState != 1) { // если соединение отсутствует
        infoMe('Соединение прервано, Функция inspectionConnection, статус = ' + binanceSocket.readyState);
        infoMe('Попытка повторного соединения из функции inspectionConnection: \n ');
        connectMyFun();
      }
      timerAble = true;
    };

    let timer_555_sec = setTimeout(() => codeForTimer(), 10000);
  }

  // Таймер для проверки соединения WebSocket
  let codeForTimer2 = () => {
    if (timerAble == true) {
      inspectionConnection();
    }
  }
  let timer_10_sec = setInterval(() => codeForTimer2(), 1000); // ставим минимальную задержку 1 сек. задержку, таймер используем только для циклического запуска

  // таймер для отображения в консоли текущей  цены с WebSocket
  let timer_111_sec = setInterval(() => {
    console.log('Цена currentPrice = ' + currentPrice)
    // console.log('timerAble = ' + timerAble)
    console.log('binanceSocket.readyState = ' + binanceSocket.readyState)
  }, 1000);

  // Переподключаем WebSocket раз в 30 мин. Принудительно разрываем соединение c WebSocket
  let timer_30_min = setInterval(() => {
    infoMe('Запускаем плановую 30 мин. перезагрузку: \n ');
    binanceSocket.close();
  }, 1800000);

  // 1800000


}

currentPriseAskBinance();

// ------------------------------------------------------------













