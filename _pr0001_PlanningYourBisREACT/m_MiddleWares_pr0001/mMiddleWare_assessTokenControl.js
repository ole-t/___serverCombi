
import jwt_decode from 'jwt-decode';
import { varsANDfunctions_fromPostService } from '../postService_pr0001.js';

export default function mMiddleWare_accessTokenControl(req, res, next) {

    console.log("");
    console.log("============= ");
    console.log("ЗАПУСК mMidlWare_accessTokenControl, req.url= " + req.url);
    //console.log("req.method= " + req.method)
    //console.log("req.headers=");
    //console.log(req.headers);
    //console.log("req.body=");
    //console.log(req.body);
    //console.log("");
    //console.log("req.headers.accesstoken= " + req.headers.accesstoken);

    let presenceOfProgramEerrors = false;

    // Если запрос предусматривает наличие токена (это все POST запросы за исключением регистрации,  авторизации и refreshToken)
    if ((req.method == "POST")
        // исключения:
        && (req.url != "/registration_User") // регистрация - тут данные о пользователя извлекаем из body
        && (req.url != "/changePassword") // замена/восстановление пароля - тут данные о пользователя извлекаем из body
        && (req.url != "/logIn") // logIn - тут данные о пользователя 
        && (req.url != "/GoogleAuth_01") // вход/logIn через Гугл - тут данные о пользователя 
        && (req.url != "/logOut")
        && (req.url != "/logOutOneGadget")
        && (req.url != "/logOutAllGadgets")
        // удалить
        && (req.url != "/get_full_data_from_server") // служебная функция
    ) {
        // если токен отсутствует
        if (!req.headers.accesstoken) {
            console.log("Прерываем Auth, отсутствует токен в запросе. req.url= " + req.url);
            console.log(" req.headers.accesstoken= ");
            console.log(req.headers.accesstoken);

            res.status(401).json("m User is not auth");
            presenceOfProgramEerrors = true;
            return;
        }

        // След наша фун "validateAccessToken" помимо осуществления проверки возвращает распакованные данные из токена
        console.log("=== ");
        let decodeValidationToken = varsANDfunctions_fromPostService.validateAccessToken(req.headers.accesstoken);

        // console.log("decodeValidationToken С ПОМ jwt.verify= ");
        // console.log(decodeValidationToken);// 

        // если токен не валиден (напр истек срок действия)
        if (!decodeValidationToken) {
            console.log("Прерываем Auth, токен не прошел валидацию");
            res.status(401).json("m User is not auth");
            presenceOfProgramEerrors = true;
            return;
        }

        // если токен не совпадает с токеном, записанным для данного аккаунта и номера процесса
        // проверяем идентичность токена тому токену, который записан в реестре пользователя
        let finedUserIndex = varsANDfunctions_fromPostService.findUser_Index_inReestr(decodeValidationToken.user_Email, decodeValidationToken.mKuiir);
        if (!(finedUserIndex >= 0)) {
            console.log("ПРОБЛЕМА - НЕ НАЙДЕН ПОЛЬЗОВАТЕЛЬ, УКАЗАННЫЙ В ТОКЕНЕ, finedUserIndex= " + finedUserIndex);
            res.status(401).json("m User is not auth");
            presenceOfProgramEerrors = true;
            return;
        }

        // console.log("tokensDifferentGadgets= ");
        // console.log(varsANDfunctions_fromPostService.serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets[decodeValidationToken.mGadgetProcess_ID]);

        if (
            // если токен для указанного процесса не существует в реестре пользователя
            !varsANDfunctions_fromPostService.serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets[decodeValidationToken.mGadgetProcess_ID]
        ) {
            console.log("Прерываем Auth, отсутствует токен в реестре пользователя для данного процесса ");
            res.status(401).json("m User is not auth");
            presenceOfProgramEerrors = true;
            return;
        }

        if (
            // если токен для указанного процесса в реестре пользователя не идентичен токену, переданному в запросе
            varsANDfunctions_fromPostService.serverVarriorsDataFromBD_pr0001.users_Reestr[finedUserIndex].autorisationData.tokensDifferentGadgets[decodeValidationToken.mGadgetProcess_ID].accessToken != req.headers.accesstoken
        ) {
            console.log("Прерываем Auth, токен не соответствует токену, который записан в реестре пользователя для данного процессапрошел валидацию");
            res.status(401).json("m User is not auth");
            presenceOfProgramEerrors = true;
            return;
        }

        // Если проверка пройдена - записываем содержимое токена в заголовок запроса
        if (presenceOfProgramEerrors == false) {
            // console.log("Проверка токена пройдена успешно");
            // если предыдущие проверки пройдены - в заголовок запроса добавляем данные пользователя из переданного токена
            req.headers.decodeAT_____user_Email = decodeValidationToken.user_Email;
            req.headers.decodeAT_____mKuiir = decodeValidationToken.mKuiir;
            req.headers.decodeAT_____mGadgetProcess_ID = decodeValidationToken.mGadgetProcess_ID;
        }
    }

    // Если проверка пройдена - продолжаем обработку сервером
    if (presenceOfProgramEerrors == false) {
        console.log("Проверка выполнена успешно, продолжаем выполнение next()");
       next(); 
    } 
    else {
        console.log("Проверка запроса не пройдена, возвращаем 400 ");
        res.status(401).json("m Bad request");
        return;
    }
}
