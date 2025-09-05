// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY,
});

const cohortChatGptIndex = pc.Index('cohort-chat-gpt');

async function createMemory({ vectors, metadata, messageId }) {
    try {
    await cohortChatGptIndex.upsert([{
      id: messageId,
      values: vectors,
      metadata
    }]);
  } catch (err) {
    console.error("❌ Error in Pinecone createMemory:", err.message);
    return null;
  }
}

async function queryMemory({queryVector, limit = 5, metadata}){
    try{
        const data = await cohortChatGptIndex.query({
    vector: queryVector,
    topK: limit,   // also note: some SDKs use topK (capital K), not topk
    filter: metadata ? metadata : undefined,
    includeMetadata: true,
    
  }
  
    )
    return data.matches
}
    catch(err){
        console.error("Error in pinecone",err);
        return [];
    }


}


module.exports = {createMemory,queryMemory}

