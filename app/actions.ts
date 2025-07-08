"use server";

import { Session } from "next-auth";
import { BingResults } from "./types";
import { revalidatePath } from "next/cache";
import { Supermemory } from "supermemory";

const supermemory = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY,
});

export const getSearchResultsFromMemory = async (
  query: string,
  user: Session | null
): Promise<BingResults | null> => {
  if (!query || !user?.user) return null;

  try {
    if (!user?.user?.email) throw new Error("User email is required");

    await supermemory.memories.add({
      content: query,
      containerTags: [user.user.email],
    })

  } catch (e) {
    console.error("Error creating memory", e);
  }

  const response = await fetch(
    "https://api.search.brave.com/res/v1/web/search?q=" +
      encodeURIComponent(query),
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.SEARCH_API_KEY,
      },
      next: {
        revalidate: 60 * 60,
      },
    }
  );
  const data = (await response.json()) as BingResults;

  return data;
};

export const getMemories = async (user: Session | null) => {
  if (!user?.user?.email) return null;

  

  try {
    const smResponse = await supermemory.memories.list({
      containerTags: [user.user.email],
    });
    const memories = await Promise.all(smResponse.memories.map(async memory=> {
      const memoryFull = await supermemory.memories.get(memory.id);
      return {
        memory:  memoryFull.summary ?? memory.title ?? memoryFull.content ?? "No memory content",
        id: memory.id,
      }
    }))
    
    console.log(memories);

    return memories;
  } catch (e) {
    console.error("Error getting memories", e);
    return null;
  }
};

export const deleteMemory = async (memoryId: string, user: Session | null) => {
  if (!memoryId || !user?.user) return null;

  console.log(memoryId);

  try {
    await supermemory.memories.delete(memoryId);
  } catch (e) {
    return null;
  }


  revalidatePath("/");

  return true;
};

export const createCustomMemory = async (
  memoryText: string,
  user: Session | null
) => {
  if (!memoryText || !user?.user) return null;

  try {
    if (!user?.user?.email) throw new Error("User email is required");

    const res = await supermemory.memories.add({
      content: memoryText,
      containerTags: [user.user.email],
    })
    const memory = await supermemory.memories.get(res.id);
    return {
      id: memory.id,
      memory: memory.content ?? memory.summary ?? memory.title ?? "No memory content",
    };
  } catch (e) {
    console.error("Error creating memory", e);
    return null;
  }
};
