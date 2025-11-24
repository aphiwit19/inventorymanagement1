import { useEffect, useMemo, useState } from 'react';
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Stack, Text, useToast, Divider, SimpleGrid, Tag } from '@chakra-ui/react';
import { getCurrentUser, updateProfile } from '../../services/auth';
import { fetchAddresses, createAddress, updateAddressById, deleteAddressById, setDefaultAddress } from '../../services/addresses';

export default function Profile() {
  const toast = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [form, setForm] = useState({
    name: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || user?.phone || '',
  });

  const [addresses, setAddresses] = useState([]);

  useEffect(()=> {
    const u = getCurrentUser();
    setUser(u);
    // sync form when user changes
    setForm({
      name: u?.fullName || u?.name || '',
      email: u?.email || '',
      phone: u?.phoneNumber || u?.phone || '',
    });
    (async () => {
      try {
        const list = await fetchAddresses();
        setAddresses(list);
      } catch (e) {
        // ถ้าโหลดที่อยู่ไม่สำเร็จ แค่แจ้งเตือน แต่ให้หน้าโปรไฟล์เปิดได้ต่อ
        toast({ title: e.message || 'โหลดที่อยู่ไม่สำเร็จ', status: 'error' });
      }
    })();
    // eslint-disable-next-line
  }, []);

  const onSaveProfile = () => {
    const updated = updateProfile({ fullName: form.name, phoneNumber: form.phone });
    if (updated) {
      setUser(updated);
      toast({ title: 'บันทึกโปรไฟล์สำเร็จ', status: 'success' });
    }
  };

  const [addrForm, setAddrForm] = useState({ id: '', fullName: '', phone: '', line1: '', subDistrict: '', district: '', province: '', zipcode: '', isDefault: false });
  const editing = !!addrForm.id;

  const resetAddrForm = () => setAddrForm({
    id: '',
    fullName: user?.fullName || user?.name || '',
    phone: user?.phoneNumber || user?.phone || '',
    line1: '',
    subDistrict: '',
    district: '',
    province: '',
    zipcode: '',
    isDefault: false,
  });

  const onSubmitAddress = async () => {
    const payload = {
      recipientName: addrForm.fullName,
      phoneNumber: addrForm.phone,
      addressLine1: addrForm.line1,
      addressLine2: '',
      subDistrict: addrForm.subDistrict,
      district: addrForm.district,
      province: addrForm.province,
      postalCode: addrForm.zipcode,
    };

    try {
      if (editing) {
        const updated = await updateAddressById(addrForm.id, payload);
        setAddresses(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        toast({ title: 'แก้ไขที่อยู่สำเร็จ', status: 'success' });
      } else {
        const created = await createAddress(payload);
        setAddresses(prev => [...prev, created]);
        toast({ title: 'เพิ่มที่อยู่สำเร็จ', status: 'success' });
      }
      resetAddrForm();
    } catch (e) {
      toast({ title: e.message || 'บันทึกที่อยู่ไม่สำเร็จ', status: 'error' });
    }
  };

  const onEditAddress = (a) => setAddrForm({
    id: a.id,
    fullName: a.recipientName || a.fullName || '',
    phone: a.phoneNumber || a.phone || '',
    line1: a.addressLine1 || a.line1 || '',
    subDistrict: a.subDistrict || '',
    district: a.district || '',
    province: a.province || '',
    zipcode: a.postalCode || a.zipcode || '',
    isDefault: !!a.isDefault,
  });

  const onDeleteAddress = async (id) => {
    try {
      await deleteAddressById(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast({ title: 'ลบที่อยู่แล้ว', status: 'info' });
    } catch (e) {
      toast({ title: e.message || 'ลบที่อยู่ไม่สำเร็จ', status: 'error' });
    }
  };

  const onMakeDefault = async (id) => {
    try {
      const updated = await setDefaultAddress(id);
      setAddresses(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === updated.id,
      })));
      toast({ title: 'ตั้งค่าที่อยู่เริ่มต้นแล้ว', status: 'success' });
    } catch (e) {
      toast({ title: e.message || 'ตั้งค่าที่อยู่เริ่มต้นไม่สำเร็จ', status: 'error' });
    }
  };

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
                    <Text fontWeight="bold">{a.recipientName || a.fullName || ''}</Text>
                    {a.isDefault && <Tag colorScheme="green" size="sm">ค่าเริ่มต้น</Tag>}
                  </HStack>
                  <Text>{a.addressLine1 || a.line1}</Text>
                  <Text>{a.subDistrict ? `${a.subDistrict} ` : ''}{a.district} {a.province} {a.postalCode || a.zipcode}</Text>
                  <Text color="gray.600">{a.phoneNumber || a.phone}</Text>
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
            <FormLabel>ตำบล/แขวง</FormLabel>
            <Input
              variant="filled"
              bg="gray.50"
              borderRadius="lg"
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              value={addrForm.subDistrict}
              onChange={(e)=> setAddrForm({ ...addrForm, subDistrict: e.target.value })}
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
