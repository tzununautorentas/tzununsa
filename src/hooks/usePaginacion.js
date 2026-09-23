import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, filtroEmpresa } from '../config.js';

export function usePaginacion({ table, query = '', search = '', columns = [], pageSize: ps = 25, order = 'created_at.desc', empresaId = null }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ps);
  const prevSearch = useRef(search);
  const paramsRef = useRef({ table, query, search, columns, page, pageSize, order, empresaId });
  paramsRef.current = { table, query, search, columns, page, pageSize, order, empresaId };

  const loadKey = [table, query, search, page, pageSize, order, empresaId, JSON.stringify(columns)].join('|');

  const load = useCallback(async () => {
    const p = paramsRef.current;
    setLoading(true);
    try {
      let q = p.query ? `&${p.query}` : '';
      const fEmp = filtroEmpresa(p.empresaId);
      if (fEmp) q += `&${fEmp}`;
      if (p.search && p.columns.length > 0) {
        const clauses = p.columns.map(c => `${c}.ilike.*${encodeURIComponent(p.search)}*`);
        q += `&or=(${clauses.join(',')})`;
      }
      const start = (p.page - 1) * p.pageSize;
      const end = start + p.pageSize - 1;
      const url = `/${p.table}?select=*&order=${p.order}${q}`;
      const r = await apiFetch(url, {
        headers: { Range: `${start}-${end}`, Prefer: 'count=exact' },
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
  }, [loadKey]);

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
