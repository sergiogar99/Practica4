import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import *as uuid from 'uuid';

import "babel-polyfill";

//"mongodb+srv://sergio:123pez@cluster0-dikpx.gcp.mongodb.net/test?retryWrites=true&w=majority"

const usr = "sergio";
const pwd = "123pez";
const url = "cluster0-dikpx.gcp.mongodb.net/test?retryWrites=true&w=majority";

/**
 * Connects to MongoDB Server and returns connected client
 * @param {string} usr MongoDB Server user
 * @param {string} pwd MongoDB Server pwd
 * @param {string} url MongoDB Server url
 */
const connectToDb = async function(usr, pwd, url) {
  const uri = `mongodb+srv://${usr}:${pwd}@${url}`;
  
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await client.connect();
  return client;
};

/**
 * Starts GraphQL server, with MongoDB Client in context Object
 * @param {client: MongoClinet} context The context for GraphQL Server -> MongoDB Client
 */
const runGraphQLServer = function(context) {
  const typeDefs = `
    type Query{

     getFacturas(name:String!,token:ID!):[Facturas]
    }

    type Mutation{

      addUser(name: String!, password: String!):Titulares!
      addFacturas(name:String!,token:ID!,fecha:String!,concepto:String!,cantidad:Float!):Facturas!

      removeUser(name:String!,token:ID!):Titulares
      removeFacturas(name:String!,token:ID!,id:ID!):Facturas

      login(name:String!,password:String!):Titulares!
      logout(name:String!,token:ID!):Titulares!
    }

    type Titulares{
      _id: ID!
      name: String!
      password: String!
      token:ID!
      facturas:[Facturas]
    }

    type Facturas{

      _id:ID!

      idFactura:ID!

      fecha: String!
      concepto: String!
      cantidad: Float!
      titular: Titulares!
    }

  `;

  //el id de la factura es el id del titular

  const resolvers = {

    Titulares:{

      facturas:async (parent, args, ctx, info)=>{
  
        const name= parent.name;
        const token = parent.token;
        const { client } = ctx;
        const db = client.db("morosos");
        const collection = db.collection("users");
        const exist = await collection.findOne({name:name});


        if(exist.token == token){

          const collection = db.collection("facturas");

          const result = await collection.find({"idFactura": exist._id}).toArray(); 

          return result;
        }
      },
  
    },

    Facturas:{

      titular:async (parent, args, ctx, info)=>{
  
        //buscamos user por id

        const id= parent.idFactura;
        
        const { client } = ctx;
        const db = client.db("morosos");
        const collection = db.collection("users");
        const result = await collection.findOne({ _id: ObjectID(id) });

        return result;
      },

    },

  
    Query: {
 
      getFacturas: async (parent, args, ctx, info) => {

        const { name,token } = args;
        const { client } = ctx;
        const db = client.db("morosos");
        const collection = db.collection("users");

        //buscar el usuario por username
        //obtener su token y comparar por el que se ha añadido
        //devolver lista de facturas por id, comparandolo por el id del usuario
        //las facturas tienen el id del user

        // const result = await collection.find({}).toArray();
        // return result;

        

        const exist = await collection.findOne({name:name});


        if(exist.token == token){

          const collection = db.collection("facturas");

          const result = await collection.find({"idFactura": exist._id}).toArray(); 

          return result;
        }

      },
      
    },

    Mutation: {

      addUser: async (parent, args, ctx, info) => {

        const { name, password } = args;
        const { client } = ctx;
        const db = client.db("morosos");
        const collection = db.collection("users");

        const exist = await collection.findOne({name:name});

        if(!exist){

          const token = uuid.v4();

          const result = await collection.insertOne({ name, password ,token});

          return {
            name,
            password,
            token,
            _id: result.ops[0]._id
          };
        }

      },
      addFacturas: async (parent, args, ctx, info) => {

        const { name, token,fecha,concepto,cantidad } = args;
        const { client } = ctx;
        const db = client.db("morosos");
        let collection = db.collection("users");

        const exist = await collection.findOne({name:name});

        if(exist.token == token){

          collection = db.collection("facturas");
          const idFactura = exist._id;
          const result = await collection.insertOne({ fecha, concepto ,cantidad,idFactura});

          return {
            idFactura,
            fecha,
            concepto,
            cantidad,
            _id: result.ops[0]._id
          }; 

        }
        
      },
      login: async (parent, args, ctx, info) => {

        const {name, password} = args;
        const {client} = ctx;
        const db = client.db("morosos");

        const collection = db.collection("users");
        const usuario1 = await collection.findOne({name: name, password: password});
        if(!usuario1){
          throw new Error(`Usuario o contrasena incorrectos`)
        }else{
          await collection.updateOne({"name": name }, { $set: { "token": uuid.v4() }});
        }  
        return await collection.findOne({name: name});
      },

      logout: async (parent, args, ctx, info) => {
        const {name, token} = args;
        const {client} = ctx;
        const db = client.db("morosos");

        const collection = db.collection("users");
        const usuario1 = await collection.findOne({name: name, token: token});
        if(!usuario1){
          throw new Error(`Usuario no logeado`)
        }else{
          await collection.updateOne({ "name": name }, { $set: { "token": null }});
        }
        return await collection.findOne({name: name});

      },


      removeUser: async (parent, args, ctx, info) => {

        //removeUser(name:String!,token:ID!):Titulares
        const {name, token} = args;
        const { client } = ctx;
        const db = client.db("morosos");
        let collection = db.collection("users");
        const exist = await collection.findOne({name:name});

        
        if(exist.token == token){
        
        await collection.deleteOne({name:{$eq:name}}); 

        collection = db.collection("facturas");
        await collection.remove({idFactura:{$eq:exist._id}},false);

        return exist;

        }

      },

      removeFacturas: async (parent, args, ctx, info) => {
        

        //removeFacturas(id:ID!,token:ID!,id:ID!):Facturas
        const {id, token,name} = args;
        const { client } = ctx;
        const db = client.db("morosos");

        let collection = db.collection("users");
        const exist = await collection.findOne({name:name});

        if(exist.token == token){

          
        collection = db.collection("facturas");
        await collection.remove({idFactura:{$eq:exist_id}},false);

        return exist;
        

        }
      },

    }
  };

  const server = new GraphQLServer({ typeDefs, resolvers, context });
  const options = {
    port: 8001
  };

  try {
    server.start(options, ({ port }) =>
      console.log(
        `Server started, listening on port ${port} for incoming requests.`
      )
    );
  } catch (e) {
    console.info(e);
    server.close();
  }
};

const runApp = async function() {
  const client = await connectToDb(usr, pwd, url);
  console.log("Connect to Mongo DB");
  try {
    runGraphQLServer({ client });
  } catch (e) {
    console.log(e);
    client.close();
  }
};

runApp();
