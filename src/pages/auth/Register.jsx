import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { registerCustomer } from '../../services/auth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const onSubmit = async () => {
    try {
      setLoading(true);
      if (password.length < 8) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      }

      // ต้องเป็นเบอร์ 10 หลักขึ้นต้นด้วย 0
      const phonePattern = /^0\d{9}$/;
      if (!phonePattern.test(phone)) {
        throw new Error('กรุณากรอกเบอร์โทร 10 หลักขึ้นต้นด้วย 0');
      }

      await registerCustomer({ name, email, password, phone });
      toast({ title: 'สมัครสมาชิกสำเร็จ', status: 'success', duration: 2000 });
      navigate('/', { replace: true });
    } catch (e) {
      toast({ title: e.message || 'สมัครสมาชิกไม่สำเร็จ', status: 'error', duration: 2500 });
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
            <Heading size="lg" mb={1}>สมัครสมาชิก</Heading>
            <Text fontSize="sm" color="gray.500" mt={5}>
              สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งานระบบจัดการคำสั่งซื้อสินค้า
            </Text>
          </Box>

          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>ชื่อ-นามสกุล</FormLabel>
              <Input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                variant="filled"
                bg="gray.50"
                borderRadius="lg"
                _focus={{ bg: 'white', borderColor: 'blue.400' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>

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
              <FormLabel>เบอร์โทรศัพท์</FormLabel>
              <Input
                type="tel"
                placeholder="เช่น 0800000000"
                variant="filled"
                bg="gray.50"
                borderRadius="lg"
                _focus={{ bg: 'white', borderColor: 'blue.400' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>รหัสผ่าน</FormLabel>
              <Input
                type="password"
                placeholder="รหัสผ่าน"
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
              ลงทะเบียน
            </Button>

            <Text fontSize="sm" textAlign="center" mt={5}>
              มีบัญชีแล้ว?{' '}
              <Link as={RouterLink} to="/login" color="blue.600">
                เข้าสู่ระบบ
              </Link>
            </Text>
          </VStack>
        </Stack>
      </Box>
    </Box>
  );
}
