const fs = require("fs");

function getShiftDuration(startTime, endTime) {

    function toSeconds(time) {
        time = time.trim();
        let parts = time.split(" ");
        let timePart = parts[0];
        let period = parts[2];

        let t = timePart.split(":");
        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);

        if (period === "pm" && h !== 12) {
            h += 12;
        }

        if (period === "am" && h === 12) {
            h = 0;
        }

        return h * 3600 + m * 60 + s;
    }

    function toTime(seconds) {
        let h = Math.floor(seconds / 3600);
        seconds = seconds % 3600;

        let m = Math.floor(seconds / 60);
        let s = seconds % 60;

        if (m < 10) m = "0" + m;
        if (s < 10) s = "0" + s;

        return h + ":" + m + ":" + s;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let diff = end - start;

    return toTime(diff);
}
/////

function getIdleTime(startTime, endTime) {

    function toSeconds(time) {
        time = time.trim();
        let parts = time.split(" ");
        let timePart = parts[0];
        let period = parts[1];

        let t = timePart.split(":");
        let h = parseInt(t[0]);
        let m = parseInt(t[1]);
        let s = parseInt(t[2]);

        if (period === "pm" && h !== 12) {
            h += 12;
        }

        if (period === "am" && h === 12) {
            h = 0;
        }

        return h * 3600 + m * 60 + s;
    }

    function toTime(seconds) {
        let h = Math.floor(seconds / 3600);
        seconds = seconds % 3600;

        let m = Math.floor(seconds / 60);
        let s = seconds % 60;

        if (m < 10) m = "0" + m;
        if (s < 10) s = "0" + s;

        return h + ":" + m + ":" + s;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let startDelivery = 8 * 3600;   // 8:00 AM
    let endDelivery = 22 * 3600;    // 10:00 PM

    let idle = 0;

    if (start < startDelivery) {
        idle += Math.min(end, startDelivery) - start;
    }

    if (end > endDelivery) {
        idle += end - Math.max(start, endDelivery);
    }

    return toTime(idle);
}
/////////

function getActiveTime(shiftDuration , idleTime){

    function toSeconds(t){
        let parts = t.split(":");
        let h = parseInt(parts[0]);
        let m = parseInt(parts[1]);
        let s = parseInt(parts[2]);

        return h*3600 + m*60 + s;
    }

    function toTime(sec){

        let h = Math.floor(sec/3600);
        sec = sec % 3600;

        let m = Math.floor(sec/60);
        let s = sec % 60;

        if(m < 10) m = "0" + m;
        if(s < 10) s = "0" + s;

        return h + ":" + m + ":" + s;
    }

    let shift = toSeconds(shiftDuration);
    let idle = toSeconds(idleTime);

    let active = shift - idle;

    return toTime(active);

}
////////

function metQuota(date , activeTime){

    function toSeconds(t){
        let p = t.split(":");
        let h = parseInt(p[0]);
        let m = parseInt(p[1]);
        let s = parseInt(p[2]);

        return h*3600 + m*60 + s;
    }

    let parts = date.split("-");
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[2]);

    let active = toSeconds(activeTime);

    let quota;

    if(year == 2025 && month == 4 && day >= 10 && day <= 30){
        quota = 6 * 3600;
    }
    else{
        quota = 8*3600 + 24*60;
    }

    if(active >= quota){
        return true;
    }
    else{
        return false;
    }

}
//////


function addShiftRecord(textFile , shiftObj){

    let data = fs.readFileSync(textFile , "utf8");
    let lines = data.trim().split("\n");

    for(let i = 0 ; i < lines.length ; i++){

        let cols = lines[i].split(",");

        if(cols[0] == shiftObj.driverID && cols[2] == shiftObj.date){
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime , shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime , shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration , idleTime);
    let quota = metQuota(shiftObj.date , activeTime);

    let newObj = {
        driverID : shiftObj.driverID ,
        driverName : shiftObj.driverName ,
        date : shiftObj.date ,
        startTime : shiftObj.startTime ,
        endTime : shiftObj.endTime ,
        shiftDuration : shiftDuration ,
        idleTime : idleTime ,
        activeTime : activeTime ,
        metQuota : quota ,
        hasBonus : false
    };

    let newLine =
        newObj.driverID + "," +
        newObj.driverName + "," +
        newObj.date + "," +
        newObj.startTime + "," +
        newObj.endTime + "," +
        newObj.shiftDuration + "," +
        newObj.idleTime + "," +
        newObj.activeTime + "," +
        newObj.metQuota + "," +
        newObj.hasBonus;

    let lastIndex = -1;

    for(let i = 0 ; i < lines.length ; i++){
        let cols = lines[i].split(",");
        if(cols[0] == shiftObj.driverID){
            lastIndex = i;
        }
    }

    if(lastIndex == -1){
        lines.push(newLine);
    }
    else{
        lines.splice(lastIndex + 1 , 0 , newLine);
    }

    let newData = lines.join("\n");

    fs.writeFileSync(textFile , newData);

    return newObj;

}
///////////

function setBonus(textFile , driverID , date , newValue){


    let data = fs.readFileSync(textFile , "utf8");
    let lines = data.trim().split("\n");

    for(let i = 0 ; i < lines.length ; i++){

        let cols = lines[i].split(",");

        if(cols[0] == driverID && cols[2] == date){

            cols[9] = String(newValue);

            lines[i] = cols.join(",");

        }

    }

    let newData = lines.join("\n");

    fs.writeFileSync(textFile , newData);

}
//////////

function countBonusPerMonth(textFile , driverID , month){


    let data = fs.readFileSync(textFile , "utf8");
    let lines = data.trim().split("\n");

    let count = 0;
    let exists = false;

    month = parseInt(month);

    for(let i = 0 ; i < lines.length ; i++){

        let cols = lines[i].split(",");

        if(cols[0] == driverID){

            exists = true;

            let date = cols[2].split("-");
            let m = parseInt(date[1]);

            if(m == month && cols[9] == "true"){
                count++;
            }

        }

    }

    if(!exists){
        return -1;
    }

    return count;

}
////////////


function getTotalActiveHoursPerMonth(textFile , driverID , month){


    function toSeconds(t){
        let p = t.split(":");
        return parseInt(p[0])*3600 + parseInt(p[1])*60 + parseInt(p[2]);
    }

    function toTime(sec){

        let h = Math.floor(sec/3600);
        sec = sec % 3600;

        let m = Math.floor(sec/60);
        let s = sec % 60;

        if(m < 10) m = "0"+m;
        if(s < 10) s = "0"+s;

        return h + ":" + m + ":" + s;

    }

    let data = fs.readFileSync(textFile , "utf8");
    let lines = data.trim().split("\n");

    let total = 0;

    for(let i = 0 ; i < lines.length ; i++){

        let cols = lines[i].split(",");

        if(cols[0] == driverID){

            let date = cols[2].split("-");
            let m = parseInt(date[1]);

            if(m == month){

                total += toSeconds(cols[7]);

            }

        }

    }

    return toTime(total);

}

function getRequiredHoursPerMonth(textFile , rateFile , bonusCount , driverID , month){



    function toTime(sec){

        let h = Math.floor(sec/3600);
        sec = sec % 3600;

        let m = Math.floor(sec/60);
        let s = sec % 60;

        if(m < 10) m = "0"+m;
        if(s < 10) s = "0"+s;

        return h + ":" + m + ":" + s;

    }

    let rateData = fs.readFileSync(rateFile , "utf8").trim().split("\n");

    let dayOff = "";

    for(let i = 0 ; i < rateData.length ; i++){

        let cols = rateData[i].split(",");

        if(cols[0] == driverID){
            dayOff = cols[1];
        }

    }

    let data = fs.readFileSync(textFile , "utf8").trim().split("\n");

    let total = 0;

    for(let i = 0 ; i < data.length ; i++){

        let cols = data[i].split(",");

        if(cols[0] == driverID){

            let date = cols[2];
            let d = date.split("-");
            let m = parseInt(d[1]);
            let day = parseInt(d[2]);

            if(m == month){

                let weekday = new Date(date).toLocaleDateString("en-US",{weekday:"long"});

                if(weekday != dayOff){

                    if(m == 4 && day >=10 && day <=30){
                        total += 6*3600;
                    }
                    else{
                        total += 8*3600 + 24*60;
                    }

                }

            }

        }

    }

    total -= bonusCount * 2 * 3600;

    if(total < 0) total = 0;

    return toTime(total);

}

function getNetPay(driverID , actualHours , requiredHours , rateFile){



    function toSeconds(t){
        let p = t.split(":");
        return parseInt(p[0])*3600 + parseInt(p[1])*60 + parseInt(p[2]);
    }

    let data = fs.readFileSync(rateFile , "utf8").trim().split("\n");

    let basePay = 0;
    let tier = 0;

    for(let i = 0 ; i < data.length ; i++){

        let cols = data[i].split(",");

        if(cols[0] == driverID){

            basePay = parseInt(cols[2]);
            tier = parseInt(cols[3]);

        }

    }

    let actual = toSeconds(actualHours);
    let required = toSeconds(requiredHours);

    if(actual >= required){
        return basePay;
    }

    let missing = required - actual;

    let allowance = 0;

    if(tier == 1) allowance = 50*3600;
    if(tier == 2) allowance = 20*3600;
    if(tier == 3) allowance = 10*3600;
    if(tier == 4) allowance = 3*3600;

    let billable = missing - allowance;

    if(billable <= 0){
        return basePay;
    }

    let billableHours = Math.floor(billable / 3600);

    let deductionRate = Math.floor(basePay / 185);

    let deduction = billableHours * deductionRate;

    let netPay = basePay - deduction;

    return netPay;

}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
