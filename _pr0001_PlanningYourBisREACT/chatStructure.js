
import {global_Functions_and_Servises_forAll_Projects} from '../global_Functions_and_Servises_forAll_Projects/global_Functions_and_Servises_forAll_Projects.js';



//-------------------------------

export function create_Chat(
    project_OR_subProject___id, 
    knownIndexInReestr
    ) {
    return {
        project_OR_subProject___id: project_OR_subProject___id,
        knownIndexInReestr: knownIndexInReestr,
        messages: [],
        isDeleted: false,
        time_last_update: 0,
    };
}

//-------------------------------

export function create_messageInChat(
    project_OR_subProject___id,
    autor,
    textMessage,
   // timeOfCreate, ///////////
    кnownIndexInBD,
   // message_ID ////////
) {
    return {
        project_OR_subProject___id: project_OR_subProject___id,
        autor: autor,
        textMessage: textMessage,
        timeOfCreate: Date.now(),
        кnownIndexInBD: кnownIndexInBD,
        message_ID: "mess_" + global_Functions_and_Servises_forAll_Projects.random_id(),
    };
}

//-------------------------------

