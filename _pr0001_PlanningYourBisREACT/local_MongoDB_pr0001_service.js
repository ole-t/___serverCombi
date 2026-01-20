
import { global_Functions_and_Servises_forAll_Projects } from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';
import config_pr0001 from './config_pr0001.js';
import { serverVarriorsDataFromBD_pr0001, functions___pr0001 } from './postService_pr0001.js';
import mongoose from 'mongoose';

console.log(" ");
console.log("Запуск local_MongoDB_pr0001_service");

// Подключаемся к МонгоДБ 
export let connect_to_local_Mongo_pr0001 = null;
try {
    connect_to_local_Mongo_pr0001 = await global_Functions_and_Servises_forAll_Projects.mongoDB_accessAndService_forAllProjects.connectToMongoDB(
        config_pr0001.projectNameID,
        config_pr0001.local_MongoURL_pr0001_chats
    );
    console.log(" ");
    console.log("Успешное подкдючение к локальной Монго ДБ ...");

} catch (error) {
    console.log(" ");
    console.log("Не удалось подключиться к локальной Монго ДБ");
    console.log(error);
}

// ======================= СХЕМЫ =======================

// схема отдельного сообщения
const message_Schema = new mongoose.Schema({
    autor: { type: String, required: true },
    textMessage: { type: String, required: true },
    timeOfCreate: { type: Number, default: () => Date.now() },
    knownIndexInReestr: Number,
    message_ID: String,
    knownIndexInReestr: Number,            // новое поле для порядкового номера
    parent_owner_Email: String,
    parent_owner_ID: String,
    parent_corpAccount_ID: String,
    parent_project_ID: String,
    parent_subProject_ID: String
}, { _id: false });

// схема отдельного субпроекта в реестре чатов
const subProject_chat_Schema = new mongoose.Schema({
    messages: [message_Schema],
    parent_owner_Email: String,
    parent_owner_ID: String,
    parent_corpAccount_ID: String,
    parent_project_ID: String,
    parent_subProject_ID: String,
    time_last_update: { type: Number, default: () => Date.now() }
}, { _id: false });

// схема основного проекта
const project_chat_Schema = new mongoose.Schema({
    mainProjectChat: {
        messages: [message_Schema],
        parent_owner_Email: String,
        parent_owner_ID: String,
        parent_corpAccount_ID: String,
        parent_project_ID: String,
        time_last_update: { type: Number, default: () => Date.now() }
    },
    subProjectsChats: {
        type: Map,
        of: subProject_chat_Schema
    }
}, { _id: false });

// схема корпоративного аккаунта (corpAccounts)
const corpAccount_chat_Schema = new mongoose.Schema({
    projects: {
        type: Map,
        of: project_chat_Schema
    },
    parent_owner_Email: String,
    parent_owner_ID: String
}, { _id: false });

// Главная схема пользователя (chat_DB)
// Теперь parent_owner_ID — верхний уровень документа
const chat_DB_Schema = new mongoose.Schema({
    parent_owner_ID: { type: String, required: true, unique: true },
    parent_owner_Email: { type: String, required: true },
    corpAccounts: {
        type: Map,
        of: corpAccount_chat_Schema
    }
}, { collection: 'chat_DB' });

// Модель Mongoose для текущего подключения
const chat_DB_mongoose = connect_to_local_Mongo_pr0001.model('ChatDB', chat_DB_Schema);


// ======================= ФУНКЦИИ =======================

export const chats_functions_localMongo = {

    add_message_inChat_localMongo: async function (
        parent_owner_Email,
        parent_owner_ID,
        parent_corpAccount_ID,
        parent_project_ID,
        parent_subProject_ID,  // если null/undefined — добавляем в основной чат проекта
        autor_Email,
        textMessage
    ) {
        // console.log("Запуск add_message_inChat_localMongo, arguments =", arguments);
    
        try {
            // 1️⃣ Найти или создать документ пользователя
            let chatDoc = await chat_DB_mongoose.findOne({ parent_owner_ID });
            if (!chatDoc) {
                chatDoc = new chat_DB_mongoose({
                    parent_owner_ID,
                    parent_owner_Email,
                    corpAccounts: new Map()
                });
            }
    
            // 2️⃣ Получить или создать корпоративный аккаунт
            if (!chatDoc.corpAccounts.has(parent_corpAccount_ID)) {
                chatDoc.corpAccounts.set(parent_corpAccount_ID, {
                    parent_owner_Email,
                    parent_owner_ID,
                    projects: new Map()
                });
            }
            const corpAccount = chatDoc.corpAccounts.get(parent_corpAccount_ID);
    
            // 3️⃣ Получить или создать проект
            if (!corpAccount.projects.has(parent_project_ID)) {
                corpAccount.projects.set(parent_project_ID, {
                    mainProjectChat: {
                        messages: [],
                        nextMessageIndex: 0,
                        parent_owner_Email,
                        parent_owner_ID,
                        parent_corpAccount_ID,
                        parent_project_ID,
                        time_last_update: Date.now()
                    },
                    subProjectsChats: new Map()
                });
            }
            const projectChat = corpAccount.projects.get(parent_project_ID);
    
            // 4️⃣ Определяем, куда добавлять сообщение
            let chatTarget; // объект, в который будем пушить сообщение
    
            if (parent_subProject_ID) {
                // ➤ Добавляем в субпроект
                if (!projectChat.subProjectsChats.has(parent_subProject_ID)) {
                    projectChat.subProjectsChats.set(parent_subProject_ID, {
                        messages: [],
                        nextMessageIndex: 0,
                        parent_owner_Email,
                        parent_owner_ID,
                        parent_corpAccount_ID,
                        parent_project_ID,
                        parent_subProject_ID,
                        time_last_update: Date.now()
                    });
                }
                chatTarget = projectChat.subProjectsChats.get(parent_subProject_ID);
            } else {
                // ➤ Добавляем в основной чат проекта
                chatTarget = projectChat.mainProjectChat;
                if (chatTarget.nextMessageIndex === undefined) chatTarget.nextMessageIndex = chatTarget.messages.length;
            }
    
            // 5️⃣ Создаём новое сообщение с порядковым индексом
            const newMessage = {
                autor: autor_Email,
                textMessage,
                parent_owner_Email,
                parent_owner_ID,
                parent_corpAccount_ID,
                parent_project_ID,
                parent_subProject_ID: parent_subProject_ID || null,
                timeOfCreate: Date.now(),
                message_ID: 'mess_' + global_Functions_and_Servises_forAll_Projects.random_id(),
                knownIndexInReestr: chatTarget.nextMessageIndex
            };
    
            // 6️⃣ Увеличиваем индекс для следующего сообщения
            chatTarget.nextMessageIndex += 1;
    
            // 7️⃣ Добавляем сообщение и обновляем время
            chatTarget.messages.push(newMessage);
            chatTarget.time_last_update = Date.now();
    
            // 8️⃣ Сохраняем документ
            await chatDoc.save();
    
            // console.log(`Сообщение успешно добавлено в ${parent_subProject_ID ? 'субпроект' : 'проект'} с knownIndexInReestr =`, newMessage.knownIndexInReestr);
    
            // 9️⃣ Возвращаем объект с добавленным сообщением
            return newMessage;
    
        } catch (error) {
            console.log("Ошибка в add_message_inChat_localMongo:");
            console.log(error);
            
            return null;
        }
    },

    get_last_messages_fromChat_localMongo: async function (
        parent_owner_Email,
        parent_owner_ID,
        parent_corpAccount_ID,
        parent_project_ID,
        parent_subProject_ID,   // если null/undefined → основной чат проекта
        limitMessagesCount      // N
    ) {
        try {
            // 1️⃣ Найти документ пользователя
            const chatDoc = await chat_DB_mongoose
                .findOne({ parent_owner_ID })
                .lean();

            if (!chatDoc) return [];

            // ⚠️ lean() → Map превращаются в обычные объекты
            const corpAccount = chatDoc.corpAccounts?.[parent_corpAccount_ID];
            if (!corpAccount) return [];

            const projectChat = corpAccount.projects?.[parent_project_ID];
            if (!projectChat) return [];

            let messagesArray;

            // 2️⃣ Определяем источник сообщений
            if (parent_subProject_ID) {
                const subProjectChat = projectChat.subProjectsChats?.[parent_subProject_ID];
                if (!subProjectChat) return [];
                messagesArray = subProjectChat.messages;
            } else {
                messagesArray = projectChat.mainProjectChat?.messages;
            }

            if (!Array.isArray(messagesArray) || messagesArray.length === 0) return [];

            // 3️⃣ Берём последние N сообщений, порядок сохраняется (старые → новые)
            const startIndex = Math.max(messagesArray.length - limitMessagesCount, 0);
            return messagesArray.slice(startIndex);

        } catch (error) {
            console.log("Ошибка в get_last_messages_fromChat_localMongo:");
            console.log(error);
            return [];
        }
    },

    get_previous_messages_fromChat_localMongo: async function (
        parent_owner_Email,
        parent_owner_ID,
        parent_corpAccount_ID,
        parent_project_ID,
        parent_subProject_ID,        // если null/undefined → основной чат проекта
        beforeKnownIndexInReestr,    // индекс, ПЕРЕД которым берем сообщения
        limitMessagesCount           // N
    ) {
    try {
        // 1️⃣ Получаем документ пользователя
        const chatDoc = await chat_DB_mongoose
            .findOne({ parent_owner_ID })
            .lean();

        if (!chatDoc) return [];

        // ⚠️ lean() → Map превращаются в обычные объекты
        const corpAccount = chatDoc.corpAccounts?.[parent_corpAccount_ID];
        if (!corpAccount) return [];

        const projectChat = corpAccount.projects?.[parent_project_ID];
        if (!projectChat) return [];

        let messagesArray;

        // 2️⃣ Определяем источник сообщений
        if (parent_subProject_ID) {
            const subProjectChat = projectChat.subProjectsChats?.[parent_subProject_ID];
            if (!subProjectChat) return [];
            messagesArray = subProjectChat.messages;
        } else {
            messagesArray = projectChat.mainProjectChat?.messages;
        }

        if (!Array.isArray(messagesArray) || messagesArray.length === 0) return [];

        // 3️⃣ Границы выборки (срез от старых к новым)
        const endIndex = Math.min(beforeKnownIndexInReestr, messagesArray.length);
        const startIndex = Math.max(0, endIndex - limitMessagesCount);

        if (startIndex >= endIndex) return [];

        // 4️⃣ Возвращаем предыдущие сообщения, порядок сохраняется (старые → новые)
        return messagesArray.slice(startIndex, endIndex);

    } catch (error) {
        console.log("Ошибка в get_previous_messages_fromChat_localMongo:");
        console.log(error);
        return [];
    }
},

    delete_subProjectChat_localMongo: async function (
        parent_owner_ID,
        parent_corpAccount_ID,
        parent_project_ID,
        parent_subProject_ID
    ) {
        try {
            if (!parent_subProject_ID) {
                throw new Error("parent_subProject_ID обязателен для удаления субпроекта");
            }

            // формируем путь для $unset
            const subProjectPath =
                `corpAccounts.${parent_corpAccount_ID}.projects.${parent_project_ID}.subProjectsChats.${parent_subProject_ID}`;

            const result = await chat_DB_mongoose.updateOne(
                { parent_owner_ID },
                { $unset: { [subProjectPath]: "" } }
            );

            if (result.matchedCount === 0) {
                console.log("Чат субпроекта в локальной МонгоДБ пользователя не найден");
                return false;
            }

            if (result.modifiedCount === 0) {
                console.log("Чат субпроекта в локальной МонгоДБ не найден или уже удалён");
                return false;
            }

            console.log(`Чат субпроекта в локальной МонгоДБ ${parent_subProject_ID} полностью удалён`);
            return true;

        } catch (error) {
            console.log("Ошибка в delete_subProjectChat_localMongo:");
            console.log(error);
            return false;
        }
    },

    delete_projectChat_localMongo: async function (
        parent_owner_ID,
        parent_corpAccount_ID,
        parent_project_ID
    ) {
        try {
            if (!parent_project_ID) {
                throw new Error("parent_project_ID обязателен для удаления проекта");
            }

            // путь к проекту
            const projectPath =
                `corpAccounts.${parent_corpAccount_ID}.projects.${parent_project_ID}`;

            const result = await chat_DB_mongoose.updateOne(
                { parent_owner_ID },
                { $unset: { [projectPath]: "" } }
            );

            if (result.matchedCount === 0) {
                console.log("Чат проекта в локальной МонгоДБ пользователя не найден");
                return false;
            }

            if (result.modifiedCount === 0) {
                console.log("Чат проекта в локальной МонгоДБ не найден или уже удалён");
                return false;
            }

            console.log(`Чат проекта в локальной МонгоДБ ${parent_project_ID} полностью удалён вместе со всеми субпроектами`);
            return true;

        } catch (error) {
            console.log("Ошибка в delete_projectChat_localMongo:");
            console.log(error);
            return false;
        }
    },

    delete_corpAccountChat_localMongo: async function (
        parent_owner_ID,
        parent_corpAccount_ID
    ) {
        try {
            if (!parent_corpAccount_ID) {
                throw new Error("parent_corpAccount_ID обязателен для удаления корпоративного аккаунта");
            }

            // путь к корпоративному аккаунту
            const corpAccountPath =
                `corpAccounts.${parent_corpAccount_ID}`;

            const result = await chat_DB_mongoose.updateOne(
                { parent_owner_ID },
                { $unset: { [corpAccountPath]: "" } }
            );

            if (result.matchedCount === 0) {
                console.log("Чат Корп аккаунта и вложенных проектов/субПроектов не найден");
                return false;
            }

            if (result.modifiedCount === 0) {
                console.log("Чат Корп аккаунта и вложенных проектов/субПроектов не найден или уже удалён");
                return false;
            }

            console.log(`Чат Корп аккаунта и вложенных проектов/субПроектов в локальной МонгоДБ  ${parent_corpAccount_ID} полностью удалён`);
            return true;

        } catch (error) {
            console.log("Ошибка в delete_corpAccountChat_localMongo:");
            console.log(error);
            return false;
        }
    },

    delete_parentOwnerChat_localMongo: async function (
        parent_owner_ID
    ) {
        try {
            if (!parent_owner_ID) {
                throw new Error("parent_owner_ID обязателен для полного удаления");
            }

            const result = await chat_DB_mongoose.deleteOne({
                parent_owner_ID
            });

            if (result.deletedCount === 0) {
                console.log("Документ parent_owner_ID не найден");
                return false;
            }

            console.log(`parent_owner_ID ${parent_owner_ID} полностью удалён со всеми данными`);
            return true;

        } catch (error) {
            console.log("Ошибка в delete_parentOwnerChat_localMongo:");
            console.log(error);
            return false;
        }
    },

};








