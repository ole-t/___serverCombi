
// projectNameID выносим наружу, поскольку внутри объекта делаем с ним итерации до того, как сам объект будет инициализирован, что вызывает ошибку
const projectNameID = "serverCombi";

const config_serverCombi = {
    projectNameID: projectNameID,
    // serverAdress: 5075,
    serverAdress: "http://localhost:5075/",
    telegramAccessToken___myInfoTelegramBot: '7280924078:AAEPXyvl8coKV_pS8KeuvnhKYfRh4UCxYBc',
    adminTelegramAccount_ID_for_information: 1668193760,

    emodziListTelegram_currentProject: {
        defaul_currentProjectEmodzi: '💻', 


        variants: '🖥️  💻 📈  📉 📊 ✅ 🔄 📅 💼 🆕 ⚠️  ❗ 🛑 ⛔  💲 ₿  🏆 🔴 🔵 🟥 🟨 🟩 🟦            🟥 🟧 🟨 🟩 🟦 🟪 ⬛️ ⬜️ 🟫            📒 📕 📗 📘 📙        🟣 🔵 🟢 🟡 🔴           🔴 🟠 🟡 🟢 🔵 🟣 ⚪️ 🟤   💚 💜 💙 💛         🩷 ❤️ 🧡 💚 🩵 💙 💜 🩶 🤍 🤎 💔      ⚡️ 🔥 🍏 🍎  ❤️‍🔥 ❤️‍🩹 💗 🔺 🔻 🔸 🔹 🔶 🔷 🔳 ◻️  ♥️    ❌         👌 ',
    },
}


//------------------
export default config_serverCombi;