import { useEffect, useMemo, useState } from 'react';
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Stack, Text, useToast, Divider, SimpleGrid, Tag } from '@chakra-ui/react';
import { getCurrentUser, updateProfile, addAddress, updateAddress, removeAddress, setDefaultAddress } from '../../services/auth';

export default function Profile() {
  const toast = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  const addresses = useMemo(()=> user?.addresses || [], [user]);

  useEffect(()=> {
    setUser(getCurrentUser());
    // sync form when user changes
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    // eslint-disable-next-line
  }, []);

  const onSaveProfile = () => {
    const updated = updateProfile({ name: form.name, phone: form.phone });
    if (updated) {
      setUser(updated);
      toast({ title: 'บันทึกโปรไฟล์สำเร็จ', status: 'success' });
    }
  };

  const [addrForm, setAddrForm] = useState({ id: '', fullName: '', phone: '', line1: '', district: '', province: '', zipcode: '', isDefault: false });
  const editing = !!addrForm.id;

  const resetAddrForm = () => setAddrForm({ id: '', fullName: user?.name || '', phone: user?.phone || '', line1: '', district: '', province: '', zipcode: '', isDefault: false });

  const onSubmitAddress = () => {
    if (editing) {
      const res = updateAddress(addrForm);
      if (res) {
        setUser(getCurrentUser());
        toast({ title: 'แก้ไขที่อยู่สำเร็จ', status: 'success' });
        resetAddrForm();
      }
    } else {
      const res = addAddress(addrForm);
      if (res) {
        setUser(getCurrentUser());
        toast({ title: 'เพิ่มที่อยู่สำเร็จ', status: 'success' });
        resetAddrForm();
      }
    }
  };

  const onEditAddress = (a) => setAddrForm(a);
  const onDeleteAddress = (id) => { removeAddress(id); setUser(getCurrentUser()); toast({ title: 'ลบที่อยู่แล้ว', status: 'info' }); };
  const onMakeDefault = (id) => { setDefaultAddress(id); setUser(getCurrentUser()); toast({ title: 'ตั้งค่าที่อยู่เริ่มต้นแล้ว', status: 'success' }); };

  return (
    <Stack spacing={8}>
      <Heading size="lg">โปรไฟล์ของฉัน</Heading>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
        <Heading size="md" mb={4}>ข้อมูลส่วนตัว</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <FormControl>
            <FormLabel>ชื่อ-นามสกุล</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={form.name}
              onChange={(e)=> setForm({ ...form, name: e.target.value })}
            />
          </FormControl>
          <FormControl isDisabled>
            <FormLabel>อีเมล</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={form.email}
              readOnly
            />
          </FormControl>
          <FormControl>
            <FormLabel>เบอร์โทร</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={form.phone}
              onChange={(e)=> setForm({ ...form, phone: e.target.value })}
            />
          </FormControl>
        </SimpleGrid>
        <HStack mt={4}>
          <Button colorScheme="blue" onClick={onSaveProfile}>บันทึก</Button>
        </HStack>
      </Box>

      <Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
        <Heading size="md" mb={4}>ที่อยู่ของฉัน</Heading>
        <Stack spacing={4}>
          {addresses.length === 0 && <Text color="gray.600">ยังไม่มีที่อยู่</Text>}
          {addresses.map(a => (
            <Box key={a.id} p={4} borderWidth="1px" borderRadius="lg">
              <HStack justify="space-between" align="start">
                <Stack spacing={1}>
                  <HStack>
                    <Text fontWeight="bold">{a.fullName}</Text>
                    {a.isDefault && <Tag colorScheme="green" size="sm">ค่าเริ่มต้น</Tag>}
                  </HStack>
                  <Text>{a.line1}</Text>
                  <Text>{a.district} {a.province} {a.zipcode}</Text>
                  <Text color="gray.600">{a.phone}</Text>
                </Stack>
                <HStack>
                  {!a.isDefault && <Button size="sm" onClick={()=> onMakeDefault(a.id)}>ตั้งค่าเริ่มต้น</Button>}
                  <Button size="sm" variant="outline" onClick={()=> onEditAddress(a)}>แก้ไข</Button>
                  <Button size="sm" colorScheme="red" variant="outline" onClick={()=> onDeleteAddress(a.id)}>ลบ</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </Stack>

        <Divider my={6} />

        <Heading size="sm" mb={3}>{editing ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>ชื่อ-นามสกุล</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={addrForm.fullName}
              onChange={(e)=> setAddrForm({ ...addrForm, fullName: e.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>เบอร์โทร</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={addrForm.phone}
              onChange={(e)=> setAddrForm({ ...addrForm, phone: e.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>ที่อยู่</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              placeholder="บ้านเลขที่ ถนน ซอย"
              value={addrForm.line1}
              onChange={(e)=> setAddrForm({ ...addrForm, line1: e.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>อำเภอ/เขต</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={addrForm.district}
              onChange={(e)=> setAddrForm({ ...addrForm, district: e.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>จังหวัด</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={addrForm.province}
              onChange={(e)=> setAddrForm({ ...addrForm, province: e.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>รหัสไปรษณีย์</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={addrForm.zipcode}
              onChange={(e)=> setAddrForm({ ...addrForm, zipcode: e.target.value })}
            />
          </FormControl>
        </SimpleGrid>
        <HStack mt={4}>
          <Button colorScheme="blue" onClick={onSubmitAddress}>{editing ? 'บันทึกการแก้ไข' : 'เพิ่มที่อยู่'}</Button>
          {editing && <Button variant="outline" onClick={resetAddrForm}>ยกเลิก</Button>}
        </HStack>
      </Box>
    </Stack>
  );
}
