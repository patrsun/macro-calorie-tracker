import React, { useState } from "react";
import Head from "next/head";
import Result from "../components/result";
import MCTForm from "../components/mctform";
import fetch from "isomorphic-unfetch";
import dayjs from "dayjs";
import { MongoClient, ObjectId } from "mongodb";

const host = "https://macro-calorie-tracker.vercel.app/";
// const host = "http://localhost:3000/";

const Home = ({ data }) => {
  const [results, setResults] = useState(data);

  const onChange = (e) => {
    const data = { ...results };
    let name = e.target.name;
    let resultType = name.split(" ")[0].toLowerCase();
    let resultMacro = name.split(" ")[1].toLowerCase();
    data[resultMacro][resultType] = parseInt(e.target.value);

    setResults(data);
  };

  const getDataForPreviousDay = async () => {
    let currentDate = dayjs(results.date);
    let newDate = currentDate.subtract(1, "day").format("YYYY-MM-DDTHH:mm:ss");
    const res = await fetch(`${host}api/daily?date=${newDate}`);
    const json = await res.json();

    setResults(json);
  };

  const getDataForNextDay = async () => {
    let currentDate = dayjs(results.date);
    let newDate = currentDate.add(1, "day").format("YYYY-MM-DDTHH:mm:ss");
    const res = await fetch(`${host}api/daily?date=${newDate}`);
    const json = await res.json();

    setResults(json);
  };

  const updateMacros = async () => {
    const res = await fetch(`${host}api/daily`, {
      method: "post",
      body: JSON.stringify(results),
    });
  };

  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="http://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>

      <div className="container mx-auto">
        <div className="flex text-center">
          <div className="w-full m-4">
            <h1 className="text-4xl">Macro Compliance Tracker</h1>
          </div>
        </div>

        <div className="flex text-center">
          <div className="w-1/3 bg-gray-200 p-4">
            <button onClick={getDataForPreviousDay}>Previous Day</button>
          </div>
          <div className="w-1/3 p-4">
            {dayjs(results.date).format("YYYY-MM-DD")}
          </div>
          <div className="w-1/3 bg-gray-200 p-4">
            <button onClick={getDataForNextDay}>Next Day</button>
          </div>
        </div>

        <div className="flex mb-4 text-center">
          <Result results={results.calories} />
          <Result results={results.carbs} />
          <Result results={results.fat} />
          <Result results={results.protein} />
        </div>

        {/* <div className="flex">
          <MCTForm data={results} item="Total" onChange={onChange} />
          <MCTForm data={results} item="Target" onChange={onChange} />
          <MCTForm data={results} item="Variant" onChange={onChange} />
        </div> */}

        <div className="flex text-center">
          <div className="w-full m-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={updateMacros}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export async function getStaticProps(context) {
  const client = new MongoClient(process.env.MONGO_URI);

  const dataModel = {
    _id: new ObjectId(),
    date: new Date(),
    calories: { label: "Calories", total: 0, target: 0, variant: 0 },
    carbs: { label: "Carbs", total: 0, target: 0, variant: 0 },
    fat: { label: "Fat", total: 0, target: 0, variant: 0 },
    protein: { label: "Protein", total: 0, target: 0, variant: 0 },
  };

  let doc = {};

  try {
    await client.connect();
    const collection = client.db("MCT").collection("daily");

    doc = await collection.findOne();

    if (doc == null) doc = dataModel;
  } catch (e) {
    console.error(e);
  }

  return {
    props: {
      data: JSON.parse(JSON.stringify(doc)),
    },
  };
}

export default Home;
