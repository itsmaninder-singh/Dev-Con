import "./index.js";
process.on("uncaughtException",(err)=>{
   console.error("UNCAUGHT EXCEPTION BHAI !!!!!! shutting down........")
   console.error(err.name, err.message);
   process.exit(1);
});

process.on("unhandledRejection",(err)=>{
   console.error("UNHANDELED REQUEST REJECTED!! shutting down....");
   console.error(err.name,err.message);
   process.exit(1);
})


process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});