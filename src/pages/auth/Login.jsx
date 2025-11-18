import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { login } from '../../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const onSubmit = async () => {
    try {
      setLoading(true);
      const user = login(email, password);
      toast({ title: 'เข้าสู่ระบบสำเร็จ', status: 'success', duration: 2000 });
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'staff') {
        navigate('/staff', { replace: true });
      } else if (from) {
        navigate(from, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (e) {
      toast({ title: e.message || 'เข้าสู่ระบบไม่สำเร็จ', status: 'error', duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Box
        w="100%"
        maxW="420px"
        bg="white"
        borderRadius="2xl"
        boxShadow="sm"
        p={8}
        border="1px solid"
        borderColor="gray.100"
      >
        <Stack spacing={6}>
          <Box textAlign="center">
            <Heading size="lg" mb={1}>เข้าสู่ระบบ</Heading>
            
            <Text fontSize="sm" color="gray.500" mt={5}>
              เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อ และการใช้งานในระบบ
            </Text>
          </Box>

          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>อีเมล</FormLabel>
              <Input
                type="email"
                placeholder="you@example.com"
                variant="filled"
                bg="gray.50"
                borderRadius="lg"
                _focus={{ bg: 'white', borderColor: 'blue.400' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>รหัสผ่าน</FormLabel>
              <Input
                type="password"
                placeholder="••••••••"
                variant="filled"
                bg="gray.50"
                borderRadius="lg"
                _focus={{ bg: 'white', borderColor: 'blue.400' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSubmit();
                }}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              w="full"
              isLoading={loading}
              onClick={onSubmit}
              mt={4}
            >
              เข้าสู่ระบบ
            </Button>

            <Text fontSize="sm" textAlign="center" mt={5}>
              ยังไม่มีบัญชี?{' '}
              <Link as={RouterLink} to="/register" color="blue.600">
                สมัครสมาชิก
              </Link>
            </Text>
          </VStack>
        </Stack>
      </Box>
    </Box>
  );
}
