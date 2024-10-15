
class User_inReestr {
    // позже удалить из конструктора password - пароль в открытом виде
    constructor(user_ID, user_Email, passwordHesh, password, activationLink) {
        this.user_ID = user_ID;
        this.user_Email = user_Email;
        this.autorisationData.passwordHesh = passwordHesh;
        this.autorisationData.password = password;
        this.autorisationData.activationLink = activationLink;
        this.corpAccounts.ownCorpAccounts[0] = {
            corpAccount_ID: myRandomId(),
            corpAccount_Name: ("PtivateDefaultCorpAccount"),
            // defaultAdmin_ID__forThisCorpAccount: user_Email,
        }; // для базового корп аккаунта устанавливаем это значение

    }

    knownIndexInReestr = null;
    accessProjects = [];
    onlineStatus = {
        lastOnlineTime: 0,
        needHidestatus: false,
    }

    corpAccounts = {
        ownCorpAccounts: [
            /*
            // отсюда перенесли в конструктор
            {                                
                corpAccount_ID: null,
                corpAccount_Name: null,
                defaultAdmin_ID__forThisCorpAccount: user_Email,
            },
            */
        ],

        otherAccounts: {
            ignorAccounts: [],
            ignorOwnersOfAccounts: [],
        }
    }

    autorisationData = {
        email: null,
        password: null, // позже удалить это поле
        passwordHesh: null,

        activationLink: null,
        isActivatedAsseptLink: false,
        timeBeginActivationLink: null,
        // в след переменную помещаем токены пользователя во время регистрации, до полного подтверждения регистрации
        tokensBeforeRegistration: {},

        changePasswordData: {
            changePasswordHesh_awaitConfirm: null, // используем при изменении/восстановлении пароля
            changePassword_awaitConfirm: null, // // позже удалить это поле
            changePasswordActivationLink: null, // используем при изменении/восстановлении пароля
            changePassword_newTokens: {},
        },

        // в след переменной используем токены для различных гаджетов
        tokensDifferentGadgets: {
            // тут размещается объект, содержащий массиво подобный объект с токенами для различных гаджетов пользователя
        },

        // Позже удалить, т.к. используем tokensDifferentGadjets
        accessToken: null,
        refreshToken: null,

        googleAuthData: {

        }
    }

    contactList = [];

    ignorOwnersList = [];

    tarif_plan = {
        tarif_name: null,
        max_diskSpace_forUploadFiles: 100000,
        used_diskSpace: 0,
    }

    userPublicData = {
        firstName: null,
        secondName: null,
    }

}

//-------------------------------

class User_inContactList {
    constructor(user_Email) {
        this.user_Email = user_Email;
    }
    user_Group = "";
    comments = "";
}

//-------------------------------
class User_AccessProjects {
    constructor(project_ID, user_Role, defaultAdminForThisProject) {
        this.project_ID = project_ID;
        this.user_Role = user_Role;
        this.defaultAdminForThisProject = defaultAdminForThisProject; // эта информация нужна для того, чтобы отличать свои собственные проекты в списке доступных клиентов
    }

    time_individual_wasReadEvents = {
        time_wasReadChat: 0,
        time_wasReadProjectSettings: 0,

        subProjects_individual_WAS_READ_EVENTS: [],
    }
}
//-------------------------------
class SubProjectEvents_inUserReestr {
    constructor(subProject_ID) {
        this.subProject_ID = subProject_ID;
    }

    time_wasRead_subProjectSettings = 0;
    time_wasRead_subChat = 0;
}


//-------------------------------
function myRandomId() {
    let dateNow = Date.now();
    let rndmNumb = Math.floor(Math.random() * 1000000000);
    let rndmSum = dateNow + '_' + rndmNumb;
    return (rndmSum);
}


//===============================
export { User_inReestr, User_AccessProjects, SubProjectEvents_inUserReestr }

