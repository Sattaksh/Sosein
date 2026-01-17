export async function handler(event) {
  const apiKey = process.env.TMDB_API_KEY;
  const { q, year } = event.queryStringParameters || {};

  if (!q) {
    return { statusCode: 400, body: "Missing query" };
  }

  try {
    const searchURL =
      `https://api.themoviedb.org/3/search/movie` +
      `?api_key=${apiKey}` +
      `&query=${encodeURIComponent(q)}` +
      (year ? `&year=${year}` : "");

    const searchRes = await fetch(searchURL);
    const searchData = await searchRes.json();

    if (!searchData.results?.length) {
      return { statusCode: 200, body: "null" };
    }

    // 🎯 exact title match first
    const bestMatch =
      searchData.results.find(
        m => m.title.toLowerCase() === q.toLowerCase()
      ) || searchData.results[0];

    const detailRes = await fetch(
      `https://api.themoviedb.org/3/movie/${bestMatch.id}?api_key=${apiKey}&append_to_response=credits`
    );

    const details = await detailRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(details)
    };

  } catch (err) {
    return { statusCode: 500, body: "TMDB fetch failed" };
  }
}
