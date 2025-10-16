import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  CircularProgress,
  TextField,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { api } from '../services/api';

const Sessions: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/refresh-tokens');
      setTokens(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch tokens', err);
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (jti: string) => {
    try {
      await api.delete(`/auth/refresh-tokens/${jti}`);
      fetchTokens();
    } catch (err) {
      console.error('Failed to revoke', err);
    }
  };

  const filtered = tokens.filter(t => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (t.jti || '').toLowerCase().includes(q) || (t.userId || '').toLowerCase().includes(q);
  });

  const handleChangePage = (_: any, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  useEffect(() => { fetchTokens(); }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <PageHeader title="Sessions" subtitle="Active refresh tokens" />
        <Paper sx={{ mt: 2, p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField size="small" placeholder="Search JTI or user..." value={query} onChange={e => setQuery(e.target.value)} />
                <Box sx={{ flex: 1 }} />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>JTI</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Expires</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(t => (
                      <TableRow key={t.jti} hover>
                        <TableCell sx={{ maxWidth: 300, wordBreak: 'break-all' }}>
                          <Button onClick={() => setSelected(t)} size="small">{t.jti}</Button>
                        </TableCell>
                        <TableCell>{t.userId}</TableCell>
                        <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{new Date(t.expiresAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button color="error" size="small" onClick={() => revoke(t.jti)}>Revoke</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5,10,25]}
              />

              <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
                <DialogTitle>Token details</DialogTitle>
                <DialogContent>
                  {selected && (
                    <Box>
                      <Typography variant="subtitle2">JTI</Typography>
                      <Typography sx={{ wordBreak: 'break-all', mb: 1 }}>{selected.jti}</Typography>
                      <Typography variant="subtitle2">User</Typography>
                      <Typography sx={{ mb: 1 }}>{selected.userId}</Typography>
                      <Typography variant="subtitle2">Created</Typography>
                      <Typography sx={{ mb: 1 }}>{new Date(selected.createdAt).toLocaleString()}</Typography>
                      <Typography variant="subtitle2">Expires</Typography>
                      <Typography sx={{ mb: 1 }}>{new Date(selected.expiresAt).toLocaleString()}</Typography>
                      <Typography variant="subtitle2">Replaced By</Typography>
                      <Typography sx={{ mb: 1 }}>{selected.replacedBy || '-'}</Typography>
                      <Typography variant="subtitle2">Raw</Typography>
                      <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selected, null, 2)}</Typography>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setSelected(null)}>Close</Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Sessions;
