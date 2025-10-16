import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Container,
  Alert,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { api } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

interface Setting {
  _id: string;
  key: string;
  value: any;
  name: string;
  description: string;
}

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { showNotification } = useNotifications();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      // Ensure default settings are present
      const fetchedSettings = response.data;
      
      const requiredKeys = [
        { key: 'loyalty_point_rate', value: 0.1, name: 'อัตราการให้คะแนน', description: 'ลูกค้าจะได้ 1 คะแนนทุกๆ กี่บาท (เช่น 0.1 หมายถึง 10 บาทได้ 1 คะแนน)' },
        { key: 'point_redemption_rate', value: 1, name: 'อัตราการแลกคะแนน', description: '1 คะแนนมีมูลค่ากี่บาท' }
      ];

      for (const req of requiredKeys) {
        if (!fetchedSettings.some((s: Setting) => s.key === req.key)) {
          // If setting doesn't exist, create it
          const newSetting = await api.post('/settings', req);
          fetchedSettings.push(newSetting.data);
        }
      }

      setSettings(fetchedSettings);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
      showNotification('ไม่สามารถโหลดข้อมูลการตั้งค่าได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const handleSaveSettings = async () => {
    try {
      for (const setting of settings) {
        await api.post('/settings', { key: setting.key, value: setting.value });
      }
      showNotification('บันทึกการตั้งค่าสำเร็จ', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const renderSettingInput = (setting: Setting) => {
    return (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: theme.shadows[2] }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>{setting.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>{setting.description}</Typography>
                <TextField
                    fullWidth
                    type="number"
                    label="ค่า"
                    value={setting.value}
                    onChange={(e) => handleSettingChange(setting.key, parseFloat(e.target.value) || 0)}
                    variant="outlined"
                />
            </CardContent>
        </Card>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        การตั้งค่าระบบ
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        จัดการการตั้งค่าต่างๆ ของระบบคลินิก
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {settings.map((setting) => renderSettingInput(setting))}
      </Box>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSaveSettings}
          sx={{ borderRadius: 2 }}
        >
          บันทึกการเปลี่ยนแปลง
        </Button>
      </Stack>
    </Container>
  );
};

export default SettingsPage;
