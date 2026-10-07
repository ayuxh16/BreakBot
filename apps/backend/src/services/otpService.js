import crypto from "node:crypto";

export function generateOtpCode(){
    return crypto.randomInt(0,10000).toString().padStart(6,"0");
}

export function getExpiryTime(minutesFromNow=10){
    return new Date(Date.now()+minutesFromNow*60*1000);
}