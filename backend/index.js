//mongo db chla rha idhr 
/*import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path:"./.env"
});

connectDB().then(()=>{
    app.listen(process.env.PORT|| 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT|| 8000}`);
    });

}).catch((error)=>{
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
});
*/
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app.js";
import {server} from "socket.io"
import connectDB from "./db/index.js";
import { setIO } from "./utils/SocketManager.js";

const PORT = process.env.PORT || 8000;

let server;

const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
    );
  });
};

startServer().catch((error) => {
  console.error(`Error connecting to MongoDB: ${error.message}`);
  process.exit(1);
});

export { server };
