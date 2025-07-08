import { BingResults } from "@/app/types";
import { auth } from "@/server/auth";
import { createOpenAI } from "@ai-sdk/openai";
import { CoreMessage, streamText } from "ai";
import { Supermemory } from "supermemory";

export const runtime = "edge";

const openaiApiKey = process.env.OPENAI_API_KEY;
const supermemoryApiKey = process.env.SUPERMEMORY_API_KEY;

export const POST = async (request: Request): Promise<Response> => {
	const body = (await request.json()) as { data: BingResults; input: string };

	const user = await auth();

	if (!body.data || !body.input || !user?.user) {
		return new Response("Invalid request", { status: 400 });
	}

	if (!openaiApiKey || !supermemoryApiKey) {
		console.error("Missing API keys:", {
			openaiApiKey: !!openaiApiKey,
			supermemoryApiKey: !!supermemoryApiKey,
		});
		return new Response("Missing API keys", { status: 500 });
	}

	if (!user?.user?.email) {
		return new Response("User email is required", { status: 400 });
	}

	const openai = createOpenAI({
		apiKey: openaiApiKey,
	});

	const supermemory = new Supermemory({
		apiKey: supermemoryApiKey,
	});

	const memoriesResponse = await supermemory.search.execute({
		q: "What do you know about " + body.input,
		containerTags: [user.user.email, "opensearch"],
	});

	const memories = memoriesResponse.results.map((mem) => ({
		memory:
			mem.summary ??
			mem.title ??
			mem.chunks.map((chunk) => chunk.content).join("\n") ??
			"No memory content",
	}));

	console.log(memories);

	const memString = memories.map((memory) => memory.memory).join("\n\n");

	console.log(memString);

	const messages: CoreMessage[] = [
		{
			role: "system",
			content: `You are a search assistant that answers the user query based on search results. We already know this about the user, try to tell the user about this showing up!: ${memString}. Give answers in markdown format. the search results are ${body.data.web.results
				.map(
					(result) =>
						`${result.title}\n\n${result.description}\n\n${result.url}\n\n`,
				)
				.join(" ")}`,
		},
		{
			role: "user",
			content: body.input ?? "No question",
		},
	];

	const stream = await streamText({
		model: openai("gpt-4o-mini"),
		messages: messages,
	});

	return stream.toDataStreamResponse();
};
