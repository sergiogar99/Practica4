import { MongoClient, ObjectID } from "mongodb";
import "babel-polyfill";

const uri = "mongodb+srv://sergio:123pez@cluster0-dikpx.gcp.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });

client.connect(err => {
  
  const db = client.db("recetario");
  const recetas = db.collection("recetas");
  const autores = db.collections("authors");//Si no existe la crea
  //const id;

  recetas.insertOne(
    {
      name : "Brownie",
      author:"1",
      description:"molt be",
      id:"1"
    })
    .then((result)=> {
      console.log(result.ops);
      id = result.ops[0]._id;
      console.log(_id);
      return recetas.updateOne({_id:id},{$set:{name:"Tarta de Queso"}})
      .then (() => console.log("modificado con exito"));
    });

  // perform actions on the collection object
  client.close();

});


// import "babel-polyfill";

// const uri =
//   "mongodb+srv://avalero:123456abc@cluster0-e8ug9.mongodb.net/test?retryWrites=true&w=majority";
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// const databaseName = "blog";
// const id = new ObjectID();
// console.log(id);
// console.log(id.getTimestamp());

// client.connect(async err => {
//   if (err) {
//     return console.log(`Error connecting to ${uri}`);
//   }
//   console.log("Connected!");
//   const db = client.db(databaseName);
//   const collection = db.collection("authors");

//   const result = await collection.insertOne({
//     name: "Alberto",
//     age: 41
//   });

//   console.log(result.ops);

//   const _id = result.ops._id;

//   const result2 = await collection.insertOne({
//     name: "Pedro",
//     age: 41
//   });

//   const updateOne = await collection.updateOne(
//     { _id },
//     { $set: { name: "Andres" } }
//   );
//   console.log(`update result: ${updateOne.result.ok}`);

//   const updateMany = await collection.updateMany(
//     { name: "Alberto" },
//     { $set: { name: "Luis" } }
//   );

//   console.log(`update many: ${updateMany.result.nModified}`);

//   const remove = collection.deleteMany({ name: "Luis" });

//   // perform actions on the collection object
//   client.close();
// });
