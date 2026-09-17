const GROQ_API="https://api.groq.com/openai/v1/chat/completions";

const MODELS= {
   fast: process.env.LLM_MODEL_FAST || "llama-3.1-8b-instant",
   strong: process.env.LLM_MODEL_STRONG || "llama-3.3-70b-versatile",
};

export const callLLM = async(systemPrompt, userPrompt,tier = "fast")=>{
    if(!process.env.GROQ_API_KEY){
        throw new Error("Groq Api Key is not set, so at this moment u r not able to use ai feature sorry")
    }
    const res = await fetch(GROQ_API,{
        method:"POST",
        headers:{
            "Content-type":"application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,

        },
        body :JSON.stringify({
            model:MODELS[tier],
            messages:[
                {role:"system",
                content:systemPrompt
                },
                {role:"user",
                content:userPrompt
                }
            ],
            max_tokens:4096,
        }),
    });
    if(!res.ok){
        const body = await res.text();
        throw new Error(`Groq API error (${res.status}): ${body}`);

    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
};
export const callLLMForJSON = async(systemPrompt, userPrompt , tier = "fast")=>{
    const jsonSystemPrompt = `${systemPrompt}\n\nRespond with only valid JSON -no prose, no explanation , no markdowns code fences. Just the raw JSON. Thats it.`;
    
    const raw = await callLLM(jsonSystemPrompt, userPrompt, tier);

    const cleaned = raw.replace(/^```json\s*/i,"").replace(/```\s*$/, "").trim();

    try{
        return JSON.parse(cleaned);
    }catch(err){
        throw new Error(`Failed to parse structured JSON from LLM: ${err.message}\nRaw Response: ${raw.slice(0,500)}`);
    }
};