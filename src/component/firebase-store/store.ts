// src/store.ts
import {
  ref,
  set,
  get,
  child,
  equalTo,
  orderByChild,
  query,
  DatabaseReference,
  Query,
  startAfter,
} from "firebase/database";
import { WordType } from "../../dummy-data/words";
import { dbRealtime } from "../../firebaseConfig";
import { v4 as uuid } from "uuid";
import moment from "moment";

// Create a reference to the words collection in the Realtime Database
const wordsRef: DatabaseReference = ref(dbRealtime, "words");

// Function to add a word to the Realtime Database
export const addWord = async (word: WordType) => {
  const randomId = uuid(); // Generate a unique ID for the new word
  const createdDate = moment();
  const finalWord = { ...word, created_date: createdDate.toLocaleString() };
  try {
    const newWordRef = child(wordsRef, randomId); // Create a reference for the new word using the unique ID
    await set(newWordRef, finalWord); // Set the new word data at the reference
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
// Function to add a list word to the Realtime Database
export const addWordList = async (words: WordType[]) => {
  try {
    words.forEach((words) => {
      addWord(words);
    });
  } catch (e) {
    console.error("Error adding a list word: ", e);
  }
};

// Function to get words from the Realtime Database, optionally filtered by category
export const getWords = async (category?: string) => {
  try {
    let wordsQuery: Query = wordsRef; // Start with the reference to the words collection
    if (category) {
      // If a category is specified, create a query to filter words by category
      wordsQuery = query(wordsRef, orderByChild("category"), equalTo(category));
    }
    const snapshot = await get(wordsQuery); // Execute the query
    if (snapshot.exists()) {
      const words: WordType[] = []; // Initialize an empty array to hold the words
      snapshot.forEach((childSnapshot) => {
        words.push(childSnapshot.val()); // Add each word to the array
      });
      return words; // Return the array of words
    } else {
      console.log("No data available");
      return []; // Return an empty array if no data is available
    }
  } catch (e) {
    console.error("Error getting documents: ", e);
    return []; // Return an empty array if there was an error
  }
};
