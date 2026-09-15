require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 3000;

async function iniciarServidor(){
    try{
        const connection = await pool.getConnection();
        console.log("Conexión a MySQL establecida correctamente");
        connection.release();
        app.listen(PORT,()=>{
            console.log(`Servidor ejecutándose en el puerto ${PORT}`);
        });
    }catch(error){
        console.error("Error al conectar con MySQL:");
        console.error(error.message);
        process.exit(1);
    }
}

iniciarServidor();