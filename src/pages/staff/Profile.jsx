import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    useToast,
    Text,
    Divider,
} from '@chakra-ui/react';
import { getCurrentUser, updateProfile } from '../../services/auth';

export default function StaffProfile() {
  const toast = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [form, setForm] = useState({
    name: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || user?.phone || '',
  });

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setForm({
      name: u?.fullName || u?.name || '',
      email: u?.email || '',
      phone: u?.phoneNumber || u?.phone || '',
    });
  }, []);

  const onSave = () => {
    const updated = updateProfile({
      fullName: form.name,
      phoneNumber: form.phone,
      email: form.email,
    });

    if (updated) {
      setUser(updated);
      toast({
        title: 'บันทึกข้อมูล Staff สำเร็จ',
        status: 'success',
        position: 'top-right',
      });
    } else {
      toast({
        title: 'ไม่สามารถบันทึกข้อมูลได้',
        status: 'error',
        position: 'top-right',
      });
    }
  };

  return (
        <Box
            w="100%"
            minH="100vh"
            bg="gray.50"
            px={10}
            pt={10}              
            pb={20}
        >
            <Stack w="100%" maxW="800px" spacing={10} mx="auto">

                <Box>
                    <Heading size="lg" mb={2}>
                        โปรไฟล์ Staff
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                        ข้อมูลติดต่อของผู้ใช้งาน Staff ในระบบหลังบ้าน สามารถแก้ไขได้ตลอดเวลา
                    </Text>
                </Box>

                <Box
                    w="100%"
                    bg="white"
                    borderRadius="2xl"
                    boxShadow="sm"
                    p={8}
                    border="1px solid"
                    borderColor="gray.100"
                >
                    <Stack spacing={8}>
                        <Box>
                            <Heading size="md" mb={1}>ข้อมูลส่วนตัว</Heading>
                            <Text fontSize="sm" color="gray.500">
                                รายละเอียดพื้นฐานของผู้ใช้งาน Staff
                            </Text>
                        </Box>

                        <Divider />

                        <Stack spacing={5}>
                            <FormControl>
                                <FormLabel fontWeight="600">ชื่อ-นามสกุล</FormLabel>
                                <Input
                                    variant="filled"
                                    bg="gray.50"
                                    borderRadius="lg"
                                    _focus={{ bg: 'white', borderColor: 'blue.400' }}
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </FormControl>

                            <FormControl isDisabled>
                                <FormLabel fontWeight="600">อีเมล</FormLabel>
                                <Input
                                    type="email"
                                    variant="filled"
                                    bg="gray.50"
                                    borderRadius="lg"
                                    _focus={{ bg: 'white', borderColor: 'blue.400' }}
                                    value={form.email}
                                    readOnly
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontWeight="600">เบอร์โทรศัพท์</FormLabel>
                                <Input
                                    variant="filled"
                                    bg="gray.50"
                                    borderRadius="lg"
                                    _focus={{ bg: 'white', borderColor: 'blue.400' }}
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </FormControl>

                            <Button
                                colorScheme="blue"
                                size="md"        // จาก lg → md
                                borderRadius="md"
                                px={6}           // จาก px=10 → 6 ให้ขนาดพอดี
                                onClick={onSave}
                            >
                                บันทึกข้อมูล
                            </Button>

                        </Stack>
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}
