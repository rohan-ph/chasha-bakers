import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'rohan-ph/chasha-bakers';
const FILE_PATH = 'src/data/reviews.json';

function checkToken() {
  if (!GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN environment variable");
  }
}

async function fetchFromGitHub() {
  checkToken();
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Chasha-Bakers-Website'
    },
    next: { revalidate: 0 } // disable NextJS fetch caching to always get fresh data
  } as any);

  if (!res.ok) {
    throw new Error(`Failed to fetch from GitHub: ${res.statusText}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return {
    reviews: JSON.parse(content),
    sha: data.sha
  };
}

async function writeToGitHub(content: string, sha: string) {
  checkToken();
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Chasha-Bakers-Website'
    },
    body: JSON.stringify({
      message: 'Update reviews.json [automated]',
      content: Buffer.from(content).toString('base64'),
      sha
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Failed to write to GitHub: ${errorData.message}`);
  }
  return res.json();
}

export async function GET() {
  try {
    const { reviews } = await fetchFromGitHub();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error in GET /api/reviews:", error);
    // Fallback to local file if GitHub API fails
    try {
      const localPath = path.join(process.cwd(), FILE_PATH);
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, 'utf8');
        return NextResponse.json(JSON.parse(fileContent));
      }
    } catch (localError) {
      console.error("Local fallback failed:", localError);
    }
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, text, rating } = body;

    if (!name || !text || typeof rating !== 'number') {
      return NextResponse.json({ error: "Invalid review fields" }, { status: 400 });
    }

    const initial = name.trim().charAt(0).toUpperCase() || "C";
    const newReview = {
      name: name.trim(),
      initial,
      text: text.trim(),
      rating
    };

    // Fetch latest reviews and SHA from GitHub
    let reviews = [];
    let sha = "";
    try {
      const result = await fetchFromGitHub();
      reviews = result.reviews;
      sha = result.sha;
    } catch (e) {
      console.warn("Could not fetch latest from GitHub, falling back to local file. Error:", e);
      // Fallback to local
      const localPath = path.join(process.cwd(), FILE_PATH);
      if (fs.existsSync(localPath)) {
        const fileContent = fs.readFileSync(localPath, 'utf8');
        reviews = JSON.parse(fileContent);
      }
    }

    // Append new review at the beginning
    const updatedReviews = [newReview, ...reviews];

    // Push back to GitHub
    const updatedContent = JSON.stringify(updatedReviews, null, 2);
    await writeToGitHub(updatedContent, sha);

    // Also update local file if possible (for local development updates)
    try {
      const localPath = path.join(process.cwd(), FILE_PATH);
      fs.writeFileSync(localPath, updatedContent, 'utf8');
    } catch (localError) {
      console.warn("Could not write to local file path (expected in production serverless):", localError);
    }

    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/reviews:", error);
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 500 });
  }
}
