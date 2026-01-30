export async function handler(event) {
  const query = event.queryStringParameters?.q;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing query" })
    };
  }

  const API_KEY = process.env.TMDB_API_KEY;

  try {
    // 1️⃣ Search person
    const searchRes = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results || !searchData.results.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Person not found" })
      };
    }

    const personId = searchData.results[0].id;

    // 2️⃣ Fetch person details
    const detailsRes = await fetch(
      `https://api.themoviedb.org/3/person/${personId}?api_key=${API_KEY}`
    );
    const details = await detailsRes.json();

    // 3️⃣ Fetch combined credits
    const creditsRes = await fetch(
      `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${API_KEY}`
    );
    const credits = await creditsRes.json();

    // 4️⃣ Merge & return
    return {
      statusCode: 200,
      body: JSON.stringify({
        ...details,
        combined_credits: credits
      })
    };
  } catch (err) {
    console.error("TMDB person error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "TMDB fetch failed" })
    };
  }
}
