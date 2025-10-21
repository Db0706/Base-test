import { NextRequest, NextResponse } from "next/server";

// In-memory storage (will reset on server restart)
// For production, use a database or on-chain storage
const scores: Map<string, { address: string; score: number; timestamp: number }[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { address, score } = await request.json();

    if (!address || typeof score !== "number") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // TODO: Verify signature to ensure the score is legitimate
    // This would involve verifying that the address signed a message
    // containing the score

    // Get existing scores for this address
    const addressScores = scores.get(address) || [];

    // Add new score
    addressScores.push({
      address,
      score,
      timestamp: Date.now(),
    });

    // Keep only the highest score for each address
    addressScores.sort((a, b) => b.score - a.score);

    // Store back
    scores.set(address, addressScores);

    return NextResponse.json({
      success: true,
      highScore: addressScores[0].score,
    });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json(
      { error: "Failed to save score" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (address) {
      // Get scores for specific address
      const addressScores = scores.get(address) || [];
      return NextResponse.json({
        scores: addressScores,
        highScore: addressScores[0]?.score || 0,
      });
    }

    // Get global leaderboard
    const allScores: { address: string; score: number; timestamp: number }[] = [];

    scores.forEach((addressScores) => {
      if (addressScores.length > 0) {
        allScores.push(addressScores[0]); // Take highest score for each address
      }
    });

    // Sort by score descending
    allScores.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      leaderboard: allScores.slice(0, 100), // Top 100
    });
  } catch (error) {
    console.error("Error fetching scores:", error);
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    );
  }
}
