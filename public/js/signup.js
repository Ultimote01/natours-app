import axios from "axios";

import { showAlert } from "./alert";


export async function signUp (formData){

try{

 const res = await  axios.post("/api/v1/users/signup", {...formData});

 if (res.data.status){
     showAlert("success", "Sign up  successfully" );
     setTimeout(location.assign("/"), 1500);
 }
 
}
catch(err){
   console.log(err);
   showAlert("error", err.response.data.message);
}
 
}