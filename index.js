const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb')
const app = express()
const port = process.env.PORT || 5000;

// middleWare 
app.use(cors());
app.use(express.json())
// 
// food-hub 


;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cdbyl.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const menuCollection = client.db('foodHub').collection('menu')
    const reveiwCollection = client.db('foodHub').collection('reveiws')
    const cartCollection = client.db('foodHub').collection('carts')
    const userCollection = client.db('foodHub').collection('users')
 
    app.get('/menu',async(req,res)=>{
        const result =  await menuCollection.find().toArray()
        res.send(result)

    })
    
    app.get('/reveiws',async(req,res)=>{
        const result = await reveiwCollection.find().toArray()
        res.send(result)
    })
    app.get('/carts',async(req,res)=>{
      const email = req.query.email;
      const query = {email:email}
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })
    // cart coolection 
    app.post('/carts',async(req,res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem) 
      res.send(result)
    })
    // user related api
    app.post('/users',async(req,res)=>{
      const user = req.body;
      // insert email if user doesnot exists:
      // its have many ways (1.email qnique, 2.upsert 3. simple checking)
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({message:'user already exists', insertedId: null})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res)=>{
    res.send('food hub is running')
})

app.listen(port,() =>{
    console.log(`food hub is running port${port}`);
})