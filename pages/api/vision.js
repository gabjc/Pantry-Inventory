// pages/api/vision.js
import OpenAI from "openai";

const openai = new OpenAI();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { imageUrl } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "How many watermelons, pineapples, bananas, and oranges can you find in this image? Format the response like: Fruit: [number], Fruit: [number], Fruit: [number], Fruit: [number]" },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
      });
      console.log(response.choices[0]);
      res.status(200).json(response.choices[0]);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
