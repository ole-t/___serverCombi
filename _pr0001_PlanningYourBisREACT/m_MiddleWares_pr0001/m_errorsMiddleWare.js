

import m_ApiErrors from '../m_ApiErrors.js';

export default function m_errorsMiddleWare(err, req, res, next) {
    console.log(err);
    if (err instanceof m_ApiErrors) {
        return res.status(err.status).json({message: err.message, errors: err.errors })
    }
    // иначе:
    return res.status(500).json({message: "m_Непредвиденная ошибка из m_errorsMiddleWare.js"})



    
}




