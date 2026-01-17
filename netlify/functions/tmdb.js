export async function handler(event) {
  const apiKey = process.env.TMDB_API_KEY;
  const query = event.queryStringParameters.q;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing query" })
    };
  }

  try {
    // 1️⃣ Search movie
    const searchRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results || !searchData.results.length) {
      return {
        statusCode: 200,
        body: JSON.stringify(null)
      };
    }

    const movie = searchData.results[0];

    // 2️⃣ Get full movie details
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=credits`
    );
    const details = await detailRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(details)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "TMDB fetch failed" })
    };
  }
}
