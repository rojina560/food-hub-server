const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
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

     // jwt related api
     app.post('/jwt', async(req,res)=>{
      const user  = req.body;
      const  token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn: '365d'})
      res.send({token})
    })
    // middleware 
    const verifyToken = (req,res,next) =>{
      console.log('inside verify token', req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message:'forbidden access'})
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
        if(err){
          return res.status(401).send({message:'forbidden access'})
        }
        req.decoded = decoded;
          next()
        
      })
     
    }
  
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
   
    // cart related api
    app.post('/carts',async(req,res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem) 
      res.send(result)
    })
    // use verify admin after verifyToken 
    const verifyAdmin = async (req,res,next) =>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
        return res.status(403).send({message: 'forbidden access'})
      }
      next()
    }
    // user related api
  app.get('/users', verifyToken, verifyAdmin, async(req,res)=>{
    const result = await userCollection.find().toArray()
    res.send(result)
  })
  app.get('/users/admin/:email',  verifyToken, async(req,res)=>{
    const email = req.params.email;
    if(email !== req.decoded.email
    ){
      return res.status(403).send({message:'unauthorized access'})
    }
    const query = {email: email};
    const user = await userCollection.findOne(query)
    let admin = false;
    if(user){
      admin = user?.role
    }
    res.send({admin});
  })
   
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
    app.patch('/users/admin/:id', verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id ;
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })
    app.delete('/users/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
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