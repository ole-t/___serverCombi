
import m_ApiErrors from '../m_ApiErrors.js';
import { mUserService } from '../postService_pr0001.js';
 
export default function m_authMiddleWare(req, res, next) {
    try {
        const autorisation_Header = req.headers.authorization;
        if (!autorisation_Header) {
            return next(m_ApiErrors.m_UnauthorizedError());
        }
        // поскольку autorisation_Header состоит из двух элементов, разделенных пробелом, - мы должны изъять из него интересующий нас параметр. Поэтому в след строке мы разбиваем строку на два элемента массива и берем второй элемент массива (индекс [1])
        // ЭТУ ФУНКЦИЮ ЗПУСКАЕМ ВО ВРЕМЯ РАБОЧИХ ЗАПРОСОВ (напр  test_01), используем accessToken
        const accessTokenFromClient = autorisation_Header.split(' ')[1];
        
        if (!accessTokenFromClient) {
            return next(m_ApiErrors.m_UnauthorizedError());
        }

        const userData = mUserService.validateAccessToken(accessTokenFromClient);
        // если данные в userData отсутствуют - значит пользователь не авторизирован
        if (!userData) {
            return next(m_ApiErrors.m_UnauthorizedError());
        }

        // если прошли предыдущие проверки - в запрос клиента добавляем распарсенные данные пользователя, которые мы поместили в переменную userData
        req.user = userData;
        // далее вызываем функцию next - она передает управление следующему midleWare
        next();

    } catch (error) {
        return next(m_ApiErrors.m_UnauthorizedError());
    }
}



