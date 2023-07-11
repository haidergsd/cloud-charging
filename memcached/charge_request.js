"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const memcached = require("memcached");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const MAX_EXPIRATION = 60 * 60 * 24 * 30;
const memcachedClient = new memcached(`${process.env.ENDPOINT}:${process.env.PORT}`);

exports.chargeRequestMemcached = async function (input) {
    // TODO: input usage to-be-implemented
    const startTime = new Date().getTime();
    const notAllowedResponse = {remainingBalance:0, isAuthorized:false, charges:0};
    return new Promise((resolve, reject) => {
        memcachedClient.gets(KEY, (err, data)=>{
            if(err) reject(notAllowedResponse)
            var remainingBalance = Number(data[KEY]);
            var charges = getCharges();
            if(!authorizeRequest(remainingBalance, charges)) {
              resolve(notAllowedResponse);
            }else{
              var updatedBalance = remainingBalance - charges;
              memcachedClient.cas(KEY, updatedBalance ,data.cas, MAX_EXPIRATION, (err,res)=>{
                if(err){
                    reject(notAllowedResponse);
                }else{
                  // Calculate the execution time
                  const endTime = new Date().getTime();
                  const executionTime = endTime - startTime;
                  
                  console.log("Execution Time:", executionTime, "milliseconds");
                  
                  resolve({
                    remainingBalance: updatedBalance,
                    charges,
                    isAuthorized:true
                  });
                }
              })
            }
      })
    })
};

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}
function getCharges() {
    return DEFAULT_BALANCE / 20;
}