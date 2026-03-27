/*eslint-disable*/
import axios from "axios";
import { showAlert } from "./alert";



export const updateSettings = async (data, type) => {
    try { 
        const url = type === "data"? "submit-user-data": "/api/v1/users/updateMyPassword"
        const res = await axios.patch(url,  data);

        if (res.statusText === "OK") showAlert("success", `${type.toUpperCase()} was updated successfully`);

    } catch (err) {
        if (type === "data"){
            
            return showAlert("error", err.message)
        }

        showAlert("error", err.response.data.message)
    } 
   
};