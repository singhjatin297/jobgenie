import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { PDFParse } from "pdf-parse";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formdata = await req.formData();
    const file = formdata.get("resume") as File | null;

    if (!file)
      return NextResponse.json({ error: "Not File found" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // const filename = `resume-${Date.now()}-${Math.round(
    //   Math.random() * 1e9
    // )}.pdf`;
    // const filepath = join(process.cwd(), "uploads", filename);
    // await writeFile(filepath, buffer);

    const parser = new PDFParse({ data: buffer });

    const result = await parser.getText();
    const text = result.text;

    if (!text)
      return NextResponse.json({ message: "No text in pdf" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert resume parser. Extract the data into the specified JSON format.
      
      RULES FOR MISSING DATA:
      - If a string field is missing, return null.
      - If a number field (yearsOfExperience, noticePeriodDays) is missing, return 0.
      - If an array field (skills, education, workHistory, projects) is missing, return [].
      - For 'noticePeriodDays', convert text like "immediate" to 0, "2 weeks" to 14, "1 month" to 30.
      
      STRICT JSON SCHEMA:
      {
        "name": string,
        "email": string,
        "phone": string,
        "currentTitle": string,
        "yearsOfExperience": number,
        "skills": string[],
        "education": [{
          "degree": string,
          "institution": string,
          "graduationYear": number
        }],
        "workHistory": [{
          "company": string,
          "role": string,
          "duration": string,
          "description": string
        }],
        "projects": [{
          "title": string,
          "description": string,
          "technologiesUsed": string[]
        }],
        "preferredLocations": string[],
        "willingToRelocate": boolean,
        "noticePeriodDays": number
      }`,
        },
        { role: "user", content: text.slice(0, 30000) },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const aiContent = completion?.choices[0]?.message?.content?.trim();

    if (!aiContent)
      return NextResponse.json(
        { error: "AI returned nothing" },
        { status: 500 }
      );

    let parsedData;
    try {
      parsedData = JSON.parse(aiContent);
    } catch (e) {
      return NextResponse.json(
        { error: "AI failed to return valid JSON", raw: aiContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `File uploaded successfully!`,
      success: true,
      originalName: file.name,
      parsedData,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
