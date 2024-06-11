import { MongoClient, ObjectId } from "mongodb";

const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

export default async function handler(req, res) {
  const client = new MongoClient(process.env.MONGO_URI);
  if (req.method === "GET") {
    const { date } = req.query;

    const dataModel = {
      _id: new ObjectId(),
      date: date,
      calories: { label: "Calories", total: 0, target: 0, variant: 0 },
      carbs: { label: "Carbs", total: 0, target: 0, variant: 0 },
      fat: { label: "Fat", total: 0, target: 0, variant: 0 },
      protein: { label: "Protein", total: 0, target: 0, variant: 0 },
    };

    let doc = {};

    try {
      await client.connect();
      const db = client.db("MCT");
      const collection = db.collection("daily");

      if (date) {
        doc = await collection.findOne({ date: new Date(date) });
      } else {
        doc = await collection.findOne();
      }

      if (doc == null) {
        doc = dataModel;
      }

      res.status(200).json(doc);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Something went wrong!" });
    } finally {
      await client.close();
    }
  } else if (req.method === "POST") {
    try {
      await client.connect();
      const db = client.db("MCT");
      const collection = db.collection("daily");

      let data = req.body;
      data = JSON.parse(data);
      data.date = new Date(data.date);

      await collection.updateOne(
        { date: new Date(data.date) },
        { $set: data },
        { upsert: true }
      );

      res.status(201).json({ message: "ok" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Something went wrong!" });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

module.exports = allowCors(handler);
