
// import { Chat, MessageInChat } from "./chatStructure.js";


class BisData_Shablon_DB {
    // corpAccount = null;
    // corpID = null; // сделать обязательным, в конструктор
    projects = []; // присваиваем значение, чтобы задать структуру 
    // m_settins = null;
}
//-------------------------------

class SingleProject {
    constructor(
        project_ID,
        input_defaultAdminForThisProject,
        // input_projectName,
        projectSettings,
        input_parentCorpAccount_ID,
        input_parentCorpSubAccountName,
        dateOfCreateProject,
        knownIndexInReestr,
    ) {
        this.project_ID = project_ID;
        // this.projectSettings.project_Name = input_projectName;
        this.projectSettings = projectSettings;
        this.defaultAdminForThisProject = input_defaultAdminForThisProject;
        this.teamList.push(new User_in_teamList(
            input_defaultAdminForThisProject,
            input_defaultAdminForThisProject,
            input_defaultAdminForThisProject,
            "role_Admin"
        ))
        this.parentCorpAccount_ID = input_parentCorpAccount_ID;
        this.parentCorpAccount_Name = input_parentCorpSubAccountName;
        this.dateOfCreateProject = dateOfCreateProject;
        this.knownIndexInReestr = knownIndexInReestr;

        this.projectSettings = projectSettings;
    }
    time_Update_including_Objects = {
        time_Update_chat: 0,
        time_Update_projectSettings: 0,
        time_added_new_subProgects: 0,
    };

    prog_HeadData = {};
    timeLasteChange = "";

    projectSettings = {
        project_Name: "",
        dopInfo: "",
        status: 0, // 0-100%

        deadline: {
            deadline_Date: "----:--:--",
            deadline_Time: "--:--",
            deadline_signalTime_preRemind_days: 2,
            // deadline_signalTime_preRemind_hours: 0, // пока не используем
        }
    };

    teamList = [];
    subProjects = [];
    isDeletedTemp = false;
    isDeletedFull = false;

    attachedFiles = {
        maxDiskSpace_forProject: 0, // не используем пока
        usedDiskSpace_forProject: 0,
        filesList: [],
    }

    chat_knownIndexInReestr = null;
}
//-------------------------------

class Single_subProject {
    constructor(
        parentProg_ID,
        input_subProject_ID,
        subProjectSettings,        
        timeOfCreateSubproject,
    ) {
        this.subProject_ID = input_subProject_ID;
        this.parentProg_ID = parentProg_ID;
        this.subProjectSettings = subProjectSettings;
        this.timeOfCreateSubproject = timeOfCreateSubproject;
        this.timeLastUpdate = timeOfCreateSubproject; // дублируем сюда дату создания субпроекта
    }
    chatList = [];
    isDeleted = false; // false deleted_inTrash deleted_to_ALL

    time_Update_including_Objects_SUBPROJECT = {
        time_Update_chat: 0,
        time_Update_subProjectSettings: 0,
    };

    subProjectSettings = {
        subProject_Name: null,
        // teamList_ofResponsible_subProject: [], 
        status: 0, // 0-100%
        task_for_subProject: "",
 
        deadline: {
            deadline_Date: "----:--:--",
            deadline_Time: "--:--",
            deadline_signalTime_preRemind_days: 2,
            deadline_signalTime_preRemind_hours: 0,
        }
    }

    teamList_ofResponsible_subProject= [];

    chat_knownIndexInReestr = null;

}
//-------------------------------

class User_in_teamList {
    constructor(
        user_LoginEmail,
        user_Email,
        user_Nick,
        user_Role,
    ) {
        this.user_LoginEmail = user_LoginEmail;
        this.user_Email = user_Email;
        this.user_Nick = user_Nick;
        this.user_Role = user_Role; //  role_Admin   role_Moderator   role_user_
    }
}

//-------------------------------

class User_ResponseStack {
    constructor(user_Email) {
        this.user_Email = user_Email;
    }
    user_ResStack = [];
}

//-------------------------------
//-------------------------------
//-------------------------------

class Dir {
    constructor(parentAdmin_ID) {
        this.parentAdmin_ID = parentAdmin_ID;
    }
    parentAdmin_ID;
    limitSiseUser = 0;
    usedSpaseUser = 0;    
    subFolders = [];
}

//-------------------------------

class Sub_Dir {
    constructor(parentAdmin_ID, parentProject_ID) {
        this.parentAdmin_ID = parentAdmin_ID;
        this.parentProject_ID = parentProject_ID;
    }
    parentAdmin_ID;
    parentProject_ID;
    limitSiseProject = null;
    usedSiseProject = 0;
    filesList = [];
}

//-------------------------------
class file_model {
    constructor(
        parentAdmin_ID,
        parentProject_ID,
        file_ID, 
        file_name,
        file_type,
        file_size,
        senderFile
    ) {
        this.parentAdmin_ID = parentAdmin_ID;
        this.parentProject_ID = parentProject_ID;
        this.file_ID = file_ID;
        this.file_name = file_name;
        this.file_type = file_type;
        this.file_size = file_size;
        this.senderFile = senderFile;
        this.dateUpLoad = Date.now();
    }
    parentAdmin_ID;
    parentProject_ID;
    file_ID;
    file_name;
    file_type;
    file_size;
    senderFile;
    dateUpLoad;
}

//-------------------------------
//-------------------------------
//-------------------------------

function myRandomId() {
    let dateNow = Date.now();
    let rndmNumb = Math.floor(Math.random() * 1000000000);
    let rndmSum = dateNow + '_' + rndmNumb;
    return (rndmSum);
}

//===============================

export { BisData_Shablon_DB, SingleProject, Single_subProject, User_ResponseStack }

// все классы помещаем в объект и экспортируем его-
export let FOLDERS_FILES_MODELS = {
    Dir,
    Sub_Dir,
    file_model
}












