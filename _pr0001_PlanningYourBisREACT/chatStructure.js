

//-------------------------------
// старый вариант
/* 
class Chat {
    constructor(project_ID) {
        this.project_ID = project_ID;
    }
    messages = [];
    isDeleted = false;  
    time_last_update = 0;

    subProjects_chats = []; // сюда вставляем вложенные объекты Chat()
    // динамически удалять это свойство при создании субчатов, т.к. необходимо только в главных чатах
}
 */

class Chat {
    constructor(
        project_OR_subProject___id,
        knownIndexInReestr) {
        this.project_OR_subProject___id = project_OR_subProject___id;
        this.knownIndexInReestr = knownIndexInReestr;
    }
    messages = [];
    isDeleted = false;
    time_last_update = 0;
}


//-------------------------------
// Не используем
/* 
class SubChat {
    constructor(subProject_ID) {
       this.subProject_ID = subProject_ID;
    }
    messages = [];
    isDeleted = false;
    time_last_update = 0; 
}
 */
//-------------------------------
class MessageInChat {
    constructor(
        project_OR_subProject___id,
        autor,
        textMessage,  
        timeOfCreate,
        кnownIndexInBD,
        message_ID,
    ) {
        this.project_OR_subProject___id = project_OR_subProject___id;
        this.autor = autor;
        this.textMessage = textMessage;
        this.timeOfCreate = timeOfCreate;
        this.кnownIndexInBD = кnownIndexInBD;
        this.message_ID = message_ID;
    }
}
//-------------------------------
// Не используем
/* 
class Message_in_subChat {
    constructor(subProject_ID,
        autor,
        message_ID,
        textMessage,
        timeOfCreate,
        кnownIndexInBD) {
        this.subProject_ID = subProject_ID;
        this.autor = autor;
        this.message_ID = message_ID;
        this.textMessage = textMessage;
        this.timeOfCreate = timeOfCreate;
        this.кnownIndexInBD = кnownIndexInBD;
    }
}
 */


//-------------------------------
export { Chat, MessageInChat }


