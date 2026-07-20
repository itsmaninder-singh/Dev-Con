let ioInstance = null;
export const setIO=(io)=>{
    ioInstance =io;
};
export const getIO = ()=>{
    if(ioInstance){
        throw new Error("Socekt.io has not been initialized yet");
    }
    return ioInstance;
};