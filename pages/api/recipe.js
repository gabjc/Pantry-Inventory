import OpenAI from "openai";

const openai = new OpenAI();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { body } = req.body;
      const data = `Give me a link to a recipe that includes any of these ingredients: ${body}`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: data }],
        model: 'gpt-4o-mini',
      });
    
      console.log(completion.choices[0].message);
      res.status(200).json(completion.choices[0]);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
