/**
 * routes/chat.js
 *
 * POST /chat
 *
 * AI assistant chat endpoint.
 * Uses Groq (LLaMA 3.3 70B) to answer follow-up questions about pharmacogenomic analysis.
 * Accepts an optional analysis context to ground the conversation.
 */

const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Lazy-initialized Groq client for chat
let chatClient = null;

function getChatClient() {
    if (chatClient) return chatClient;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn('[Chat] No GROQ_API_KEY set — AI assistant disabled.');
        return null;
    }

    try {
        chatClient = new Groq({ apiKey });
        console.log('[Chat] Groq client initialized (llama-3.3-70b-versatile)');
        return chatClient;
    } catch (err) {
        console.error('[Chat] Failed to init Groq client:', err.message);
        return null;
    }
}

/**
 * Build a system-level prompt that provides pharmacogenomic context.
 */
function buildSystemPrompt(context) {
    let base = `You are PharmaGuard AI, a helpful pharmacogenomics assistant. 
You explain genetic drug interactions in simple, clear language.
You do NOT provide medical advice — always recommend consulting a physician.
Keep responses concise and informative (2-4 paragraphs max).
Use markdown formatting for readability.`;

    if (context) {
        base += `\n\nThe user is currently viewing an analysis result with the following details:
- Drug: ${context.drug || 'Unknown'}
- Risk Label: ${context.risk_label || 'Unknown'}
- Gene: ${context.gene || 'Unknown'}
- Diplotype: ${context.diplotype || 'Unknown'}
- Phenotype: ${context.phenotype || 'Unknown'}
- Recommendation: ${context.suggestion || context.recommendation || 'None'}
- Mechanism: ${context.mechanism || 'Not available'}
Use this context to provide relevant, specific answers to the user's questions.`;
    }

    return base;
}

router.post('/chat', async (req, res) => {
    try {
        const { messages, context } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: true,
                code: 'MISSING_MESSAGES',
                message: 'The "messages" field is required and must be a non-empty array.',
            });
        }

        const client = getChatClient();

        // Fallback if Groq is unavailable
        if (!client) {
            return res.json({
                reply: generateFallbackReply(messages, context),
            });
        }

        const systemPrompt = buildSystemPrompt(context);

        // Build messages array for Groq chat API
        const groqMessages = [
            { role: 'system', content: systemPrompt },
        ];

        for (const msg of messages) {
            groqMessages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
            });
        }

        const chatCompletion = await client.chat.completions.create({
            messages: groqMessages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.4,
            max_tokens: 1000,
        });

        const reply = chatCompletion.choices?.[0]?.message?.content;

        if (!reply || reply.trim().length === 0) {
            throw new Error('Groq returned empty response');
        }

        return res.json({ reply });
    } catch (err) {
        console.error('[Chat] Groq error:', err.message);

        // Fall back to rule-based response instead of showing an error
        const { messages, context } = req.body || {};
        return res.json({
            reply: generateFallbackReply(messages || [], context),
        });
    }
});

/**
 * Generate a helpful rule-based reply when LLM is unavailable.
 */
function generateFallbackReply(messages, context) {
    const lastMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || '';

    if (context?.drug) {
        const drug = context.drug;
        const gene = context.gene || 'the associated gene';
        const phenotype = context.phenotype || 'Unknown';
        const risk = context.risk_label || 'Unknown';

        if (lastMessage.includes('what') || lastMessage.includes('explain') || lastMessage.includes('mean')) {
            return `Based on your analysis results:\n\n**${drug}** is metabolized by **${gene}**. Your genetic profile shows a **${phenotype}** phenotype, which means your body processes this drug differently than average.\n\n**Risk Level:** ${risk}\n\n${context.suggestion || 'Please consult your healthcare provider for personalized recommendations.'}\n\n⚕️ *This is AI-generated information. Always consult your physician before making any medical decisions.*`;
        }

        if (lastMessage.includes('alternative') || lastMessage.includes('other') || lastMessage.includes('instead')) {
            return `Since your genetic profile indicates a **${phenotype}** phenotype for **${gene}**, your doctor may consider alternative medications that don't rely on this enzyme.\n\nAlternatives should be selected based on:\n- Your complete medical history\n- Other medications you're taking\n- Your specific clinical needs\n\n⚕️ *Please discuss alternative options with your healthcare provider.*`;
        }

        if (lastMessage.includes('diet') || lastMessage.includes('food') || lastMessage.includes('lifestyle')) {
            return `While taking **${drug}**, general lifestyle considerations include:\n\n- **Consistency:** Take your medication at the same time daily\n- **Diet:** Some drugs interact with specific foods (e.g., warfarin with vitamin K-rich foods)\n- **Alcohol:** May affect drug metabolism through liver enzymes\n- **Supplements:** Always inform your doctor about any supplements\n\n⚕️ *Consult your pharmacist for drug-specific dietary guidance.*`;
        }

        return `Based on your **${drug}** analysis:\n\n- **Gene:** ${gene}\n- **Phenotype:** ${phenotype}\n- **Risk:** ${risk}\n- **Recommendation:** ${context.suggestion || 'Follow standard clinical protocols'}\n\nFeel free to ask me specific questions about your results!\n\n⚕️ *Always consult your physician for medical decisions.*`;
    }

    // Generic response when no context
    return `I'm PharmaGuard AI, your pharmacogenomics assistant. I can help you understand:\n\n- **Gene-drug interactions** and what they mean for you\n- **Risk assessments** and safety recommendations\n- **Phenotype classifications** like Poor, Intermediate, or Normal Metabolizer\n- **CPIC guidelines** and clinical recommendations\n\nTo get the most relevant answers, run an analysis first and then ask me about your results!\n\n⚕️ *I provide educational information only. Always consult a healthcare professional.*`;
}

module.exports = router;
