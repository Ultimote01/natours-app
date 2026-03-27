/*eslint-disable*/
import axios from "axios"
import { showAlert } from "./alert";

export const logout = async () => {
   try{
         const res = await axios.get("/api/v1/users/logout");

         if (res.data.status) setTimeout(location.reload(true), 1500);

    } catch (err) {
        showAlert("error", "Erorr trying to log out. Try again !!");
    }
}