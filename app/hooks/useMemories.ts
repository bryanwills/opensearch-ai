import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from 'next-auth';
import {
  getSearchResultsFromMemory,
  getMemories,
  deleteMemory,
  createCustomMemory,
} from '../actions';
import { BingResults } from '../types';

// Hook for fetching search results
export function useSearchResults(query: string, user: Session | null) {
  return useQuery({
    queryKey: ['searchResults', query],
    queryFn: () => getSearchResultsFromMemory(query, user),
    enabled: !!query && !!user?.user,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook for fetching memories
export function useMemories(user: Session | null) {
  return useQuery({
    queryKey: ['memories', user?.user?.email],
    queryFn: () => getMemories(user),
    enabled: !!user?.user?.email,
  });
}

// Hook for deleting a memory
export function useDeleteMemory(user: Session | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memoryId: string) => deleteMemory(memoryId, user),
    onSuccess: () => {
      // Invalidate and refetch memories after deletion
      queryClient.invalidateQueries({ queryKey: ['memories', user?.user?.email] });
    },
  });
}

// Hook for creating a memory
export function useCreateMemory(user: Session | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memoryText: string) => createCustomMemory(memoryText, user),
    onSuccess: (newMemory) => {
      if (newMemory) {
        // Update the memories cache with the new memory
        queryClient.setQueryData(['memories', user?.user?.email], (oldData: any) => {
          if (!oldData) return [newMemory];
          return [...oldData, newMemory];
        });
      }
    },
  });
} 