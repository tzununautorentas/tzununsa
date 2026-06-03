import { useState, useEffect, useCallback, useRef } from 'react';
import { SB, H } from '../config.js';

export function usePaginacion({ table, query = '', search = '', columns = [], pageSize: ps = 25, order = 'created_at.desc' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ps);
  const prevSearch = useRef(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let q = query ? `&${query}` : '';
      if (search && columns.length > 0) {
        const clauses = columns.map(c => `${c}.ilike.*${encodeURIComponent(search)}*`);
        q += `&or=(${clauses.join(',')})`;
      }
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      const url = `${SB}/rest/v1/${table}?select=*&order=${order}${q}`;
      const r = await fetch(url, {
        headers: { ...H, Range: `${start}-${end}`, Prefer: 'count=exact' },
      });
      const match = r.headers.get('content-range')?.match(/\/(\d+)$/);
      const totalCount = match ? parseInt(match[1]) : 0;
      const d = await r.json();
      setData(Array.isArray(d) ? d : []);
      setTotal(totalCount);
    } catch {
      setData([]);
      setTotal(0);
    }
    setLoading(false);
  }, [table, query, search, columns, page, pageSize, order]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (search !== prevSearch.current) {
      prevSearch.current = search;
      setPage(1);
    }
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    data, loading, total, page, totalPages,
    pageSize,
    setPage,
    setPageSize: (n) => { setPageSize(n); setPage(1); },
    reload: load,
    desde: total === 0 ? 0 : (page - 1) * pageSize + 1,
    hasta: Math.min(page * pageSize, total),
  };
}
