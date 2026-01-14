
import {global_Functions_and_Servises_forAll_Projects} from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';

export function create_user_inReestr(user_Email, passwordHesh, password, activationLink) {
    return {
        user_Email: user_Email,
        user_ID: "user_" + global_Functions_and_Servises_forAll_Projects.random_id(),
        knownIndexInReestr: null,
        accessProjects: [],
        onlineStatus: {
            lastOnlineTime: 0,
            needHidestatus: false,
        },

        corpAccounts: {
            ownCorpAccounts: [
                {
                    parent_owner_Email: user_Email,
                    corpAccount_ID: "corpAcc_" + global_Functions_and_Servises_forAll_Projects.random_id(),
                    corpAccount_Name: "PtivateDefaultCorpAccount",  
                }
            ],
            otherAccounts: {
                ignorAccounts: [],
                ignorOwnersOfAccounts: [],
            }
        },

        autorisationData: {
            email: user_Email,
            password: password, // позже удалить
            passwordHesh: passwordHesh,
            activationLink: activationLink,
            isActivatedAsseptLink: false,
            timeBeginActivationLink: null,
            tokensBeforeRegistration: {},

            changePasswordData: {
                changePasswordHesh_awaitConfirm: null,
                changePassword_awaitConfirm: null, // позже удалить
                changePasswordActivationLink: null,
                changePassword_newTokens: {},
            },

            tokensDifferentGadgets: {},
            accessToken: null,
            refreshToken: null,
            googleAuthData: {},
        },

        contactList: [],
        ignorOwnersList: [],

        tarif_plan: {
            tarif_name: null,
            max_diskSpace_forUploadFiles: 100000,
            used_diskSpace: 0,
        },

        userPublicData: {
            firstName: null,
            secondName: null,
        },
    };
}

//-------------------------------

// create_accessProject_inAccessProjectsList_forUser

export function create_user_AccessProjects(project_ID, user_Role, parent_owner_Email) {
    return {
        project_ID: project_ID,
        user_Role: user_Role,
        parent_owner_Email: parent_owner_Email, // для различия своих проектов среди доступных

        time_individual_wasReadEvents: {
            time_wasReadChat: 0,
            time_wasRead_settings: 0,
            subProjects_individual_WAS_READ_EVENTS: [],
        },
    };
}

//-------------------------------

export function create_subProjectEvents_inUserReestr(subProject_ID) {
    return {
        subProject_ID: subProject_ID,
        time_wasRead_settings: 0,
        time_wasRead_subChat: 0,
    };
}


