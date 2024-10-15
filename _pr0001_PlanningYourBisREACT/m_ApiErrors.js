
// создаем класс для ошибок, который создаем методом расширения втроенного класса JS
class m_ApiErrors extends Error {

    constructor(status, message, errors=[]) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    // добавляем новые поля:
    status;
    errors;


    // static-функции можно использовать, не создавая экземпляр класса (т.е. при экспорте-импорте класса не используем оператор "new")
    static m_UnauthorizedError() {
        return new m_ApiErrors(401, "Пользователь не авторизован")
    }

    static m_BadRequest(message, errors=[]) {
        return new m_ApiErrors(400, message, errors);
    }

}

export default m_ApiErrors;