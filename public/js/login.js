/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alert";

export const login = async (email, password)  => {

try {
const res = await axios.post("/api/v1/users/login", {
    email,
    password
})
if (res.data.status){
    showAlert("success", "Logged in successfully" );
    setTimeout(location.assign("/"), 1500)
}

}catch(err){
    console.log(err);
    showAlert("error", err.response.data.message)
}
}
