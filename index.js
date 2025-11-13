const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json()); // express() to express.json()

//rentwheels
//rjAqHRfunFn4PuPB
// MongoDB connection

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.dihohmj.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const myDB = client.db("renstwheels");
    const carCollection = myDB.collection("cars");
    // const userCarCollection = myDB.collection("userCar");
    const bookingCollection = myDB.collection("bookings");

    //api post to db from client side
    app.post("/cars", async (req, res) => {
      try {
        const data = req.body;
        const result = await carCollection.insertOne(data); // added await
        res.status(201).send(result); // send proper status code
      } catch (error) {
        res.status(500).send({ error: "Failed to insert car" });
      }
    });

    //api post to db from client side
    app.post("/bookings", async (req, res) => {
      try {
        const data = req.body;
        const result = await bookingCollection.insertOne(data); // added await
        res.status(201).send(result); // send proper status code
      } catch (error) {
        res.status(500).send({ error: "Failed to insert car" });
      }
    });
    app.post("/bookings_updated", async (req, res) => {
      try {
        const data = req.body;
        // console.log(data);
        const result = await bookingCollection.updateOne(data); // added await
        // console.log(result);
        res.status(201).send(result); // send proper status code
      } catch (error) {
        res.status(500).send({ error: "Failed to insert car" });
      }
    });

    app.patch("/cars_booked", async (req, res) => {
      try {
        const { _id, status } = req.body;
        if (!_id || !status) {
          return res.status(400).send({ error: "Car ID and status required" });
        }
        // Find the car first
        const car = await carCollection.findOne({ _id: new ObjectId(_id) });
        if (!car) {
          return res.status(404).send({ error: "Car not found" });
        }
        if (car.status !== "available") {
          return res.status(400).send({ error: "Car is already booked" });
        }
        // Update the status
        const result = await carCollection.updateOne(
          { _id: new ObjectId(_id) },
          { $set: { status } }
        );
        res.status(200).send({ message: "Car status updated", result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to update car status" });
      }
    });

    //  Get all booked cars
    app.get("/cars_booked", async (req, res) => {
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    });

    //  Get all cars
    app.get("/cars", async (req, res) => {
      const cursor = carCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //  API route to find user by email
    app.get("/myCars", async (req, res) => {
      const email = req.query.email; // get ?email=example@gmail.com
      //   console.log(email);
      if (!email) return res.status(400).send({ error: "Email is required" });

      const query = { provider_email: email };
      const result = await carCollection.find(query).toArray();

      if (!result) {
        return res.status(404).send({ message: "User not found" });
      }
      res.send(result);
    });

    // Update car to the MongoDB by ID
    app.patch("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;

      try {
        const filter = { _id: new ObjectId(id) };

        const updateDoc = {
          $set: {
            name: updatedCar.name,
            rent_per_day: parseFloat(updatedCar.rent_per_day),
            location: updatedCar.location,
            category: updatedCar.category,
            image_url: updatedCar.image_url,
            description: updatedCar.description,
            provider_name: updatedCar.provider_name,
            email: updatedCar.email,
            updated_at: new Date(),
          },
        };

        const result = await carCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Car not found" });
        }

        res.json({
          message: "Car updated successfully",
          modifiedCount: result.modifiedCount,
        });
      } catch (err) {
        console.error("Error updating car:", err);
        res.status(500).json({ message: err.message });
      }
    });

    // DELETE car by ID
    app.delete("/cars/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await carCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Car not found" });
        }

        res.json({ message: "Car deleted successfully" });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Get car by ID
    app.get("/cars/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await carCollection.findOne(query);
        if (!result) {
          return res.status(404).json({ message: "Car not found" });
        }
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully");
  } finally {
    // Ensures that the client will close when you finish/error.
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`
    Rent Wheels Server is running on port ${port}`);
});
