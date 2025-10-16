import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, CircularProgress } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { auditAPI } from '../services/api';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await auditAPI.getRecent(50);
        setLogs(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <PageHeader title="Audit Logs" subtitle="Recent API requests and activity" />

        <Paper sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>IP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{log.method}</TableCell>
                      <TableCell>{log.path}</TableCell>
                      <TableCell>{log.statusCode}</TableCell>
                      <TableCell>{log.user?.username || log.user?.id || '-'}</TableCell>
                      <TableCell>{log.ip || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuditLogs;

