export const host = "https://chatting-app-capstone-backend.onrender.com";

// 🔐 Auth Routes
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const logoutRoute = `${host}/api/auth/logout`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;

// 💬 Messaging Routes
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;

// 📎 File Upload Route
export const sendFileRoute = `${host}/api/messages/addmsg/file`;

// 🗑 Delete message routes (🔥 corrected)
export const deleteForMeRoute = `${host}/api/messages/deletemsg/me`;
export const deleteForEveryoneRoute = `${host}/api/messages/deletemsg/everyone`;
