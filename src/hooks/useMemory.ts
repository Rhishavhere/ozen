import { useState, useCallback } from "react";
import {
  MembrainClient,
  type MemoryNode,
  type GraphExport,
  type HubResponse,
  type HubNode,
  type JobStatus,
} from "../lib/membrain";

export type { MemoryNode, GraphExport, HubResponse, HubNode, JobStatus };

export interface UseMemoryReturn {
  loading: boolean;
  error: string | null;
  search: (
    query: string,
    k?: number,
    responseFormat?: "raw" | "interpreted" | "both",
    signal?: AbortSignal,
  ) => Promise<any | null>;
  create: (
    content: string,
    tags?: string[],
    category?: string,
  ) => Promise<{ memory_id: string; status: string } | null>;
  getById: (id: string) => Promise<MemoryNode | null>;
  update: (
    id: string,
    content: string,
    tags?: string[],
  ) => Promise<boolean | null>;
  remove: (id: string) => Promise<boolean | null>;
  bulkDelete: (tags?: string[], category?: string) => Promise<boolean | null>;
  graphExport: () => Promise<GraphExport | null>;
  hubs: (limit?: number) => Promise<HubResponse | null>;
  neighborhood: (
    memoryId: string,
    hops?: number,
  ) => Promise<GraphExport | null>;
  stats: () => Promise<any | null>;
  health: () => Promise<any | null>;
  count: (tag?: string) => Promise<{ count: number } | null>;
}

export function useMemory(): UseMemoryReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = new MembrainClient();

  const handleError = (err: any) => {
    const message = err?.message || "Unknown error";
    setError(message);
    console.error(err);
    return null;
  };

  const search = useCallback(
    async (
      query: string,
      k = 8,
      responseFormat: "raw" | "interpreted" | "both" = "both",
      signal?: AbortSignal,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.search(query, k, responseFormat, signal);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const create = useCallback(
    async (content: string, tags?: string[], category?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.create(content, tags, category);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const getById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.getById(id);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const update = useCallback(
    async (id: string, content: string, tags?: string[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.update(id, content, tags);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const remove = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.delete(id);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const bulkDelete = useCallback(
    async (tags?: string[], category?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.bulkDelete(tags, category);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const graphExport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.graphExport();
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const hubs = useCallback(
    async (limit = 12) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.hubs(limit);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const neighborhood = useCallback(
    async (memoryId: string, hops = 2) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.neighborhood(memoryId, hops);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const stats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.stats();
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const health = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.health();
      return result;
    } catch (err: any) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const count = useCallback(
    async (tag?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.count(tag);
        return result;
      } catch (err: any) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  return {
    loading,
    error,
    search,
    create,
    getById,
    update,
    remove,
    bulkDelete,
    graphExport,
    hubs,
    neighborhood,
    stats,
    health,
    count,
  };
}
