const DUOLINGO_PROFILE =
  "https://www.duolingo.com/2017-06-30/users?username=ClarkHayashi";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstream = await fetch(DUOLINGO_PROFILE, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ClarkHayashiPortfolio/1.0",
      },
    });

    if (!upstream.ok) {
      throw new Error(`Duolingo returned ${upstream.status}`);
    }

    const payload = await upstream.json();
    const users = Array.isArray(payload?.users) ? payload.users : [];
    const user =
      users.find(
        (candidate) =>
          candidate?.username?.toLowerCase() === "clarkhayashi",
      ) ?? users[0];

    if (!user) {
      throw new Error("Profile unavailable");
    }

    const courses = Array.isArray(user.courses) ? user.courses : [];
    const japanese = courses.find(
      (course) => course?.learningLanguage === "ja",
    );

    const numberOrNull = (value) =>
      Number.isFinite(Number(value)) ? Number(value) : null;

    response.setHeader(
      "Cache-Control",
      "s-maxage=21600, stale-while-revalidate=86400",
    );

    return response.status(200).json({
      username: user.username ?? "ClarkHayashi",
      streak: numberOrNull(user.streak),
      totalXp: numberOrNull(user.totalXp),
      course: japanese
        ? {
            title: japanese.title ?? "Japanese",
            xp: numberOrNull(japanese.xp),
          }
        : null,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=900",
    );
    return response
      .status(502)
      .json({ error: "Duolingo profile temporarily unavailable" });
  }
}
